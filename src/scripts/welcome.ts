import { NARRATION_EVENT } from './audio.ts';

/* First-visit cinematic welcome.

   Visual motion may introduce the visit automatically; sound may not. Modern
   browsers require a gesture, so the prerecorded Urdu narration and existing
   opt-in soundtrack begin only inside the Enter button's click handler. The
   session flag stores no identity and disappears when the browsing session ends. */

export const WELCOME_STORAGE_KEY = 'si_welcome_v1';
export const WELCOME_NARRATION = 'خوش آمدید۔ صوفی لائبریری میں آپ کا استقبال ہے۔ میں اس ادبی سفر میں آپ کا ساتھ دوں گا۔ یہاں ہر کتاب ایک سوال ہے، ہر کہانی ایک سفر، اور ہر لفظ اپنے آپ کو پہچاننے کی ایک دعوت۔ آئیے، کچھ لمحے دنیا کے شور سے دور، ان الفاظ کے قریب بیٹھیں۔ ہو سکتا ہے، جو جواب آپ ڈھونڈ رہے ہیں، وہی یہاں آپ کا انتظار کر رہا ہو۔ آئیے، کہانی شروع کریں۔';

type SessionStore = Pick<Storage, 'getItem' | 'setItem'>;
type WelcomeOptions = {
  storage?: SessionStore | null;
  playVoice?: (audio: HTMLAudioElement) => void;
  reducedMotion?: boolean;
};

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
  const canNarrate = Boolean(voice);
  const label = enter.querySelector<HTMLElement>('[data-welcome-enter-label]');
  if (!canNarrate && label) label.textContent = 'Enter with sound';

  let closing = false;
  let closeTimer: number | undefined;
  let focusTimer: number | undefined;

  const remember = () => {
    try { storage?.setItem(WELCOME_STORAGE_KEY, 'seen'); } catch { /* private mode */ }
  };

  const signalNarration = (active: boolean) => {
    try {
      doc.dispatchEvent(new view.CustomEvent(NARRATION_EVENT, { detail: { active } }));
    } catch { /* an older browser can still play the recording without ducking */ }
  };
  const voiceStarted = () => signalNarration(true);
  const voiceStopped = () => signalNarration(false);
  voice?.addEventListener('play', voiceStarted);
  voice?.addEventListener('pause', voiceStopped);
  voice?.addEventListener('ended', voiceStopped);
  voice?.addEventListener('error', voiceStopped);

  const cancelNarration = () => {
    voiceStopped();
    if (!voice || options.playVoice) return;
    try { voice.pause(); } catch { /* unsupported or already gone */ }
    try { voice.currentTime = 0; } catch { /* metadata may not be ready */ }
  };

  const narrate = () => {
    if (!voice) return;
    if (options.playVoice) {
      options.playVoice(voice);
      voiceStarted();
      return;
    }
    try { voice.currentTime = 0; } catch { /* metadata may not be ready */ }
    voice.volume = 1;
    try {
      const playback = voice.play();
      if (playback) void playback.catch(voiceStopped);
    } catch {
      voiceStopped();
    }
  };

  const soundtrack = (on: boolean) => {
    const button = doc.getElementById('sndBtn');
    const pressed = button?.getAttribute('aria-pressed') === 'true';
    if (button && pressed !== on) (button as HTMLButtonElement).click();
  };

  const close = (withVoice: boolean) => {
    if (closing) return;
    closing = true;
    remember();
    view.clearTimeout(focusTimer);

    if (withVoice) {
      narrate();
      soundtrack(true);
    } else {
      cancelNarration();
      soundtrack(false);
    }

    overlay.classList.add('is-leaving');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    doc.body.classList.remove('welcome-open');
    doc.querySelector<HTMLElement>('.logo')?.focus({ preventScroll: true });

    closeTimer = view.setTimeout(() => {
      overlay.classList.remove('is-open', 'is-leaving');
    }, reduced ? 0 : 680);
  };

  const onEnter = () => close(true);
  const onQuiet = () => close(false);
  const onKeydown = (event: KeyboardEvent) => {
    if (closing || !overlay.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const first = enter;
    const last = quiet;
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.removeAttribute('inert');
  doc.body.classList.add('welcome-open');

  /* Begin buffering only when the introduction is actually shown. Returning
     visitors and silent sessions never download the narration. */
  if (voice && !options.playVoice) {
    voice.preload = 'auto';
    try { voice.load(); } catch { /* play() will retry after the gesture */ }
  }

  enter.addEventListener('click', onEnter);
  quiet.addEventListener('click', onQuiet);
  doc.addEventListener('keydown', onKeydown);
  view.addEventListener('pagehide', cancelNarration);
  focusTimer = view.setTimeout(() => enter.focus({ preventScroll: true }), reduced ? 0 : 420);

  return () => {
    view.clearTimeout(closeTimer);
    view.clearTimeout(focusTimer);
    cancelNarration();
    enter.removeEventListener('click', onEnter);
    quiet.removeEventListener('click', onQuiet);
    doc.removeEventListener('keydown', onKeydown);
    view.removeEventListener('pagehide', cancelNarration);
    voice?.removeEventListener('play', voiceStarted);
    voice?.removeEventListener('pause', voiceStopped);
    voice?.removeEventListener('ended', voiceStopped);
    voice?.removeEventListener('error', voiceStopped);
    doc.body.classList.remove('welcome-open');
  };
}
