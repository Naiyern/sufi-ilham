import dict from '../data/i18n.json';

type Lang = Record<string, string>;
const I18N = dict as unknown as Record<string, Lang>;

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LS = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

let lang = LS.get('si_lang') || 'en';
if (!I18N[lang]) lang = 'en';

const t = (key: string) => {
  const d = I18N[lang] || {};
  return key in d ? d[key] : I18N.en?.[key] ?? '';
};

export function applyLang(code: string, animate = false) {
  if (!I18N[code]) return;
  lang = code;
  LS.set('si_lang', code);
  (window as any).plausible?.('Language Change', { props: { language: code } });

  const d = I18N[code];
  const html = document.documentElement;
  html.setAttribute('lang', code === 'hinglish' ? 'hi-Latn' : code);
  html.setAttribute('dir', (d as any)._dir || 'ltr');
  document.body.classList.toggle('rtl', (d as any)._dir === 'rtl');
  document.body.classList.toggle('lang-ur', code === 'ur');
  document.body.classList.toggle('lang-hi', code === 'hi');

  const swap = () => {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n')!;
      const v = t(k);
      if (!v) return;
      const attr = el.getAttribute('data-i18n-attr');
      if (attr) el.setAttribute(attr, v.replace(/<[^>]+>/g, ''));
      else el.innerHTML = v;
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-opt]').forEach((o) => {
      const v = t(o.getAttribute('data-i18n-opt')!);
      if (v) o.textContent = v;
    });
    document.querySelectorAll<HTMLElement>('.lang-cur').forEach((e) => { e.textContent = (d as any)._name; });
    document.querySelectorAll<HTMLElement>('.lang-opt').forEach((b) => {
      b.classList.toggle('on', b.getAttribute('data-lang') === code);
    });
  };

  if (animate && !RM) {
    document.body.classList.add('lang-fade');
    setTimeout(() => { swap(); document.body.classList.remove('lang-fade'); }, 260);
  } else swap();
}

export function initLang() {
  const btn = document.getElementById('langBtn');
  const menu = document.getElementById('langMenu');
  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    menu.addEventListener('click', (e) => e.stopPropagation());
    menu.querySelectorAll<HTMLElement>('.lang-opt').forEach((b) => {
      b.addEventListener('click', () => {
        applyLang(b.getAttribute('data-lang')!, true);
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }
  applyLang(lang, false);
}

export { t };
