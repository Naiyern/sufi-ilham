/* "Sama'" ambient soundtrack. Silent until the visitor opts in; a remembered
   preference waits for a user gesture when the browser requires one. Fades in/out. */
export const NARRATION_EVENT = 'sufi:narration';

export function initAudio() {
  const a = document.getElementById('bgm') as HTMLAudioElement | null;
  if (!a) return;

  const KEY = 'si_music';
  const VOL = 0.3;
  const NARRATION_VOL = 0.075;
  const btn = document.getElementById('sndBtn');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let fadeT: number | null = null;
  let wanted = false;
  let narrating = false;
  const level = () => narrating ? NARRATION_VOL : VOL;
  try { wanted = localStorage.getItem(KEY) === 'on'; } catch { /* private mode */ }

  a.volume = 0;
  a.loop = true;

  const paint = () => {
    btn?.classList.toggle('on', wanted && !a.paused);
    btn?.setAttribute('aria-pressed', String(wanted));
    btn?.setAttribute('aria-label', wanted ? 'Turn ambient soundtrack off' : 'Turn ambient soundtrack on');
  };

  const fade = (to: number, ms: number, done?: () => void) => {
    if (fadeT) clearInterval(fadeT);
    const from = a.volume;
    const t0 = Date.now();
    fadeT = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * p));
      if (p >= 1) { clearInterval(fadeT!); done?.(); }
    }, 40);
  };

  let armed = false;
  const arm = () => {
    if (armed) return;
    armed = true;
    const evs = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    const kick = () => {
      evs.forEach((e) => document.removeEventListener(e, kick, true));
      armed = false;
      start();
    };
    evs.forEach((e) => document.addEventListener(e, kick, { once: true, capture: true, passive: true }));
  };

  function start() {
    if (!wanted) return;
    const pr = a!.play();
    if (pr && pr.then) pr.then(() => { fade(level(), RM ? 600 : 4000); paint(); }).catch(arm);
    else { fade(level(), 4000); paint(); }
  }

  const stop = () => fade(0, 700, () => { try { a.pause(); } catch { /* ignore */ } paint(); });

  btn?.addEventListener('click', () => {
    wanted = !wanted;
    try { localStorage.setItem(KEY, wanted ? 'on' : 'off'); } catch { /* private mode */ }
    if (wanted) start(); else stop();
    paint();
  });

  /* Keep the local Urdu recording intelligible: the score recedes to a quiet
     cinematic bed while it speaks, then gently returns to its normal level. */
  document.addEventListener(NARRATION_EVENT, (event) => {
    narrating = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
    if (wanted && !a.paused && !document.hidden) fade(level(), narrating ? 500 : 1400);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!a.paused) fade(0, 400, () => a.pause());
    } else if (wanted) {
      a.play().then(() => { fade(level(), 1400); paint(); }).catch(() => {});
    }
  });

  a.addEventListener('play', paint);
  a.addEventListener('pause', paint);

  /* Do not fetch the 3.4 MB soundtrack until a gesture — play() on load
     was the main reason the homepage felt heavy even with preload="none". */
  paint();
  if (wanted) arm();
}
