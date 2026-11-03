/** Keep the theme control's state in sync with the preference on every page. */
export function initTheme(doc = document, storage = window.localStorage) {
  const button = doc.getElementById('themeBtn');
  if (!button) return;
  const root = doc.documentElement;
  const meta = doc.getElementById('themeColor');
  // Pages with an ink jacket keep a dark browser chrome even in light mode,
  // because the masthead and hero they sit under are dark.
  const ink = doc.body?.dataset.chrome === 'ink';
  const paint = () => {
    const dark = root.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    if (meta) meta.setAttribute('content', dark || ink ? '#191713' : '#f3f0e9');
  };
  paint();

  // Follow the operating system live — but only until the visitor has chosen
  // a theme of their own, which is stored and wins from then on.
  const mq = doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
  mq?.addEventListener?.('change', (event) => {
    try { if (storage.getItem('theme')) return; } catch { /* private mode */ }
    root.dataset.theme = event.matches ? 'dark' : 'light';
    paint();
  });

  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    paint();
    try { storage.setItem('theme', root.dataset.theme); } catch { /* storage may be unavailable */ }
  });
}
