/* "Sama'" ambient soundtrack. Plays by itself, no gate. Falls back to the
   first interaction when the browser blocks autoplay, and always fades. */
export function initAudio() {
  const a = document.getElementById('bgm') as HTMLAudioElement | null;
  if (!a) return;

  const KEY = 'si_music';
  const VOL = 0.3;
  const btn = document.getElementById('sndBtn');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let fadeT: number | null = null;
  let wanted = localStorage.getItem(KEY) !== 'off';

  a.volume = 0;
  a.loop = true;

  const paint = () => {
    btn?.classList.toggle('on', wanted && !a.paused);
    btn?.setAttribute('aria-pressed', String(wanted && !a.paused));
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
    if (pr && pr.then) pr.then(() => { fade(VOL, RM ? 600 : 4000); paint(); }).catch(arm);
    else { fade(VOL, 4000); paint(); }
  }

  const stop = () => fade(0, 700, () => { try { a.pause(); } catch { /* ignore */ } paint(); });

  btn?.addEventListener('click', () => {
    wanted = !wanted;
    localStorage.setItem(KEY, wanted ? 'on' : 'off');
    if (wanted) start(); else stop();
    paint();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!a.paused) fade(0, 400, () => a.pause());
    } else if (wanted) {
      a.play().then(() => { fade(VOL, 1400); paint(); }).catch(() => {});
    }
  });

  a.addEventListener('play', paint);
  a.addEventListener('pause', paint);

  if (wanted) start(); else paint();
}
