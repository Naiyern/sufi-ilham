import { NARRATION_EVENT } from './audio.ts';

/* First-visit cinematic welcome.

   Visual motion may introduce the visit automatically; sound may not. The local
   narration and soundtrack begin only inside the visitor's gesture. While the
   recording plays, its real audio spectrum drives the instrument and its actual
   playback time drives progress. The visitor can always enter or stop early. */

export const WELCOME_STORAGE_KEY = 'si_welcome_v1';
export const WELCOME_NARRATION = 'خوش آمدید۔ صوفی لائبریری میں آپ کا استقبال ہے۔ میں اس ادبی سفر میں آپ کا ساتھ دوں گا۔ یہاں ہر کتاب ایک سوال ہے، ہر کہانی ایک سفر، اور ہر لفظ اپنے آپ کو پہچاننے کی ایک دعوت۔ آئیے، کچھ لمحے دنیا کے شور سے دور، ان الفاظ کے قریب بیٹھیں۔ ہو سکتا ہے، جو جواب آپ ڈھونڈ رہے ہیں، وہی یہاں آپ کا انتظار کر رہا ہو۔ آئیے، کہانی شروع کریں۔';

type SessionStore = Pick<Storage, 'getItem' | 'setItem'>;
type WelcomeOptions = {
  storage?: SessionStore | null;
  playVoice?: (audio: HTMLAudioElement) => void;
  reducedMotion?: boolean;
};
type AudioContextConstructor = new () => AudioContext;
type AudioView = Window & typeof globalThis & { webkitAudioContext?: AudioContextConstructor };

export function initWelcome(doc: Document = document, options: WelcomeOptions = {}) {
  const view = doc.defaultView ?? window;
  const overlay = doc.getElementById('welcome');
  const enter = doc.getElementById('welcomeEnter') as HTMLButtonElement | null;
  const quiet = doc.getElementById('welcomeQuiet') as HTMLButtonElement | null;
  if (!overlay || !enter || !quiet) return () => {};

  let storage: SessionStore | null | undefined = options.storage;
  if (storage === undefined) {
    try { storage = view.sessionStorage; } catch { storage = null; }
  }

  let seen = false;
  try { seen = storage?.getItem(WELCOME_STORAGE_KEY) === 'seen'; } catch { /* storage can be blocked */ }
  const replay = new URLSearchParams(view.location.search).get('welcome') === '1';
  if (seen && !replay) return () => {};

  const reduced = options.reducedMotion ?? view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const voice = doc.getElementById('welcomeVoice') as HTMLAudioElement | null;
  const label = enter.querySelector<HTMLElement>('[data-welcome-enter-label]');
  const note = overlay.querySelector<HTMLElement>('[data-welcome-note]');
  const time = overlay.querySelector<HTMLElement>('[data-welcome-time]');
  const bands = Array.from(overlay.querySelectorAll<HTMLElement>('[data-voice-band]'));
  if (!voice && label) label.textContent = 'Begin with sound';

  let started = false;
  let closing = false;
  let closeTimer: number | undefined;
  let focusTimer: number | undefined;
  let visualFrame: number | undefined;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let frequencies: Uint8Array | null = null;

  const remember = () => {
    try { storage?.setItem(WELCOME_STORAGE_KEY, 'seen'); } catch { /* private mode */ }
  };

  const signalNarration = (active: boolean) => {
    try {
      doc.dispatchEvent(new view.CustomEvent(NARRATION_EVENT, { detail: { active } }));
    } catch { /* older browsers can play without soundtrack ducking */ }
  };

  const updatePlayback = () => {
    if (!voice) return;
    const elapsed = Number.isFinite(voice.currentTime) ? Math.max(0, voice.currentTime) : 0;
    const duration = Number.isFinite(voice.duration) && voice.duration > 0 ? voice.duration : 0;
    const progress = duration ? Math.min(1, elapsed / duration) : 0;
    overlay.style.setProperty('--voice-progress', progress.toFixed(4));
    if (time) time.textContent = `00:${Math.floor(elapsed).toString().padStart(2, '0')}`;
  };

  const stopVisuals = () => {
    if (visualFrame !== undefined) view.cancelAnimationFrame(visualFrame);
    visualFrame = undefined;
    overlay.classList.remove('is-narrating');
  };

  const voiceStopped = () => {
    signalNarration(false);
    stopVisuals();
  };

  /* A same-origin media element can feed an analyser without sending audio to
     any service. If Web Audio is unavailable, the recording plays normally and
     the instrument uses a quieter playback-time fallback. */
  const prepareAnalyser = () => {
    if (!voice || options.playVoice || analyser) return;
    try {
      const audioView = view as AudioView;
      const Context = audioView.AudioContext ?? audioView.webkitAudioContext;
      if (!Context) return;
      audioContext ??= new Context();
      if (!analyser) {
        const source = audioContext.createMediaElementSource(voice);
        const next = audioContext.createAnalyser();
        next.fftSize = 64;
        next.smoothingTimeConstant = .72;
        source.connect(next);
        next.connect(audioContext.destination);
        analyser = next;
        frequencies = new Uint8Array(next.frequencyBinCount);
      }
      if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
    } catch {
      analyser = null;
      frequencies = null;
    }
  };

  const visualTick = () => {
    if (!voice || !overlay.classList.contains('is-narrating')) {
      visualFrame = undefined;
      return;
    }
    updatePlayback();

    if (!reduced) {
      const levels: number[] = [];
      if (analyser && frequencies) {
        analyser.getByteFrequencyData(frequencies);
        const available = Math.min(24, frequencies.length);
        bands.forEach((band, index) => {
          const from = Math.floor(index * available / bands.length);
          const to = Math.max(from + 1, Math.floor((index + 1) * available / bands.length));
          let sum = 0;
          for (let bin = from; bin < to; bin += 1) sum += frequencies[bin] ?? 0;
          levels.push(Math.min(1, (sum / (to - from) / 255) * 2.1));
        });
      } else {
        const elapsed = Number.isFinite(voice.currentTime) ? voice.currentTime : 0;
        bands.forEach((_, index) => {
          const primary = .5 + .5 * Math.sin(elapsed * 7.1 + index * 1.73);
          const secondary = .5 + .5 * Math.sin(elapsed * 2.4 + index * .61);
          levels.push(.12 + primary * secondary * .64);
        });
      }

      bands.forEach((band, index) => {
        band.style.setProperty('--level', Math.max(.12, levels[index] ?? .12).toFixed(3));
      });
      const energy = levels.reduce((sum, value) => sum + value, 0) / Math.max(1, levels.length);
      overlay.style.setProperty('--voice-energy', Math.min(1, energy * 1.45).toFixed(3));
    }

    visualFrame = view.requestAnimationFrame(visualTick);
  };

  const voiceStarted = () => {
    signalNarration(true);
    overlay.classList.add('is-narrating');
    if (label) label.textContent = 'Enter the library';
    if (note) note.textContent = 'Introduction playing · enter whenever you are ready.';
    if (audioContext?.state === 'suspended') void audioContext.resume().catch(() => {});
    updatePlayback();
    if (visualFrame === undefined) visualFrame = view.requestAnimationFrame(visualTick);
  };

  const cancelNarration = () => {
    voiceStopped();
    if (!voice || options.playVoice) return;
    try { voice.pause(); } catch { /* unsupported or already gone */ }
    try { voice.currentTime = 0; } catch { /* metadata may not be ready */ }
  };

  const soundtrack = (on: boolean) => {
    const button = doc.getElementById('sndBtn');
    const pressed = button?.getAttribute('aria-pressed') === 'true';
    if (button && pressed !== on) (button as HTMLButtonElement).click();
  };

  const dismiss = (keepSound: boolean) => {
    if (closing) return;
    closing = true;
    remember();
    view.clearTimeout(focusTimer);
    stopVisuals();
    overlay.classList.remove('is-voice-requested');

    if (!keepSound) {
      cancelNarration();
      soundtrack(false);
    }

    overlay.classList.add('is-leaving');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    doc.body.classList.remove('welcome-open');
    doc.querySelector<HTMLElement>('.logo')?.focus({ preventScroll: true });

    closeTimer = view.setTimeout(() => {
      overlay.classList.remove('is-open', 'is-leaving', 'is-voice-requested', 'is-narrating');
    }, reduced ? 0 : 680);
  };

  const playbackFailed = () => {
    voiceStopped();
    if (started && !closing) dismiss(true);
  };

  const voiceEnded = () => {
    overlay.style.setProperty('--voice-progress', '1');
    voiceStopped();
    if (started && !closing) dismiss(true);
  };

  const narrate = () => {
    if (!voice) {
      playbackFailed();
      return;
    }
    if (options.playVoice) {
      options.playVoice(voice);
      voiceStarted();
      return;
    }

    prepareAnalyser();
    try { voice.currentTime = 0; } catch { /* metadata may not be ready */ }
    voice.volume = 1;
    try {
      const playback = voice.play();
      if (playback) void playback.catch(playbackFailed);
    } catch {
      playbackFailed();
    }
  };

  const begin = () => {
    if (started) {
      dismiss(true);
      return;
    }
    started = true;
    remember();
    overlay.classList.add('is-voice-requested');
    if (label) label.textContent = 'Enter the library';
    if (note) note.textContent = 'Preparing your introduction…';
    quiet.textContent = 'Stop & enter';
    narrate();
    soundtrack(true);
  };

  const onQuiet = () => dismiss(false);
  const onKeydown = (event: KeyboardEvent) => {
    if (closing || !overlay.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss(false);
      return;
    }
    if (event.key !== 'Tab') return;
    if (event.shiftKey && doc.activeElement === enter) {
      event.preventDefault();
      quiet.focus();
    } else if (!event.shiftKey && doc.activeElement === quiet) {
      event.preventDefault();
      enter.focus();
    }
  };

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.removeAttribute('inert');
  doc.body.classList.add('welcome-open');

  voice?.addEventListener('play', voiceStarted);
  voice?.addEventListener('pause', voiceStopped);
  voice?.addEventListener('ended', voiceEnded);
  voice?.addEventListener('error', playbackFailed);

  /* Buffer only when the introduction is shown. Returning visitors and silent
     sessions never download the recording. */
  if (voice && !options.playVoice) {
    voice.preload = 'auto';
    try { voice.load(); } catch { /* play() will retry after the gesture */ }
  }

  enter.addEventListener('click', begin);
  quiet.addEventListener('click', onQuiet);
  doc.addEventListener('keydown', onKeydown);
  view.addEventListener('pagehide', cancelNarration);
  focusTimer = view.setTimeout(() => enter.focus({ preventScroll: true }), reduced ? 0 : 420);

  return () => {
    view.clearTimeout(closeTimer);
    view.clearTimeout(focusTimer);
    cancelNarration();
    enter.removeEventListener('click', begin);
    quiet.removeEventListener('click', onQuiet);
    doc.removeEventListener('keydown', onKeydown);
    view.removeEventListener('pagehide', cancelNarration);
    voice?.removeEventListener('play', voiceStarted);
    voice?.removeEventListener('pause', voiceStopped);
    voice?.removeEventListener('ended', voiceEnded);
    voice?.removeEventListener('error', playbackFailed);
    doc.body.classList.remove('welcome-open');
  };
}
