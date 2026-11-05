/* First-visit cinematic welcome.

   Visual motion may introduce the visit automatically; sound may not. Modern
   browsers require a gesture, so narration and the existing opt-in soundtrack
   begin only inside the Enter button's click handler. The session flag stores
   no identity and disappears when the browsing session ends. */

export const WELCOME_STORAGE_KEY = 'si_welcome_v1';
export const WELCOME_NARRATION = 'Welcome to Soo fee Library. A home for stories, questions, and the quiet truths that stay with you. Come in, and find the words that were waiting for you.';

type SessionStore = Pick<Storage, 'getItem' | 'setItem'>;
type WelcomeOptions = {
  storage?: SessionStore | null;
  speak?: (text: string) => void;
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
  const nativeSpeech = view.speechSynthesis;
  const canNarrate = Boolean(options.speak || (nativeSpeech && typeof SpeechSynthesisUtterance !== 'undefined'));
  const label = enter.querySelector<HTMLElement>('[data-welcome-enter-label]');
  if (!canNarrate && label) label.textContent = 'Enter with sound';

  let closing = false;
  let closeTimer: number | undefined;
  let focusTimer: number | undefined;

  const remember = () => {
    try { storage?.setItem(WELCOME_STORAGE_KEY, 'seen'); } catch { /* private mode */ }
  };

  const cancelNarration = () => {
    try { nativeSpeech?.cancel(); } catch { /* unsupported or already gone */ }
  };

  const narrate = () => {
    if (!canNarrate) return;
    try {
      if (options.speak) {
        options.speak(WELCOME_NARRATION);
        return;
      }
      if (!nativeSpeech) return;
      const line = new SpeechSynthesisUtterance(WELCOME_NARRATION);
      line.lang = 'en-GB';
      line.rate = .84;
      line.pitch = .88;
      line.volume = 1;
      const voices = nativeSpeech.getVoices();
      const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
      const preferred = ['Daniel', 'Google UK English Male', 'Microsoft Ryan', 'Microsoft Guy', 'Serena', 'Samantha', 'Alex'];
      line.voice = preferred.map((name) => english.find((voice) => voice.name.includes(name))).find(Boolean)
        ?? english.find((voice) => voice.lang.toLowerCase() === 'en-gb')
        ?? english[0]
        ?? null;
      nativeSpeech.cancel();
      nativeSpeech.speak(line);
    } catch { /* a missing platform voice never blocks entry */ }
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
  enter.addEventListener('click', () => close(true));
  quiet.addEventListener('click', () => close(false));
  doc.addEventListener('keydown', onKeydown);
  view.addEventListener('pagehide', cancelNarration);
  focusTimer = view.setTimeout(() => enter.focus({ preventScroll: true }), reduced ? 0 : 420);

  return () => {
    view.clearTimeout(closeTimer);
    view.clearTimeout(focusTimer);
    cancelNarration();
    doc.removeEventListener('keydown', onKeydown);
    view.removeEventListener('pagehide', cancelNarration);
    doc.body.classList.remove('welcome-open');
  };
}
