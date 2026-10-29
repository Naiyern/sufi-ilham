/** Keep the theme control's state in sync with the preference on every page. */
export function initTheme(doc = document, storage = window.localStorage) {
  const button = doc.getElementById('themeBtn');
  if (!button) return;
  const root = doc.documentElement;
  const paint = () => {
    const dark = root.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  };
  paint();
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    paint();
    try { storage.setItem('theme', root.dataset.theme); } catch { /* storage may be unavailable */ }
  });
}
