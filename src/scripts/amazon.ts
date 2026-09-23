import { t } from './i18n';

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Cinematic interstitial before handing the reader to Amazon. The tab is
   opened synchronously inside the click so it is never popup-blocked. */
export function initGo() {
  const ov = document.getElementById('goOv');
  if (!ov) return;

  const titleEl = ov.querySelector<HTMLElement>('.go-title')!;
  const subEl = ov.querySelector<HTMLElement>('.go-sub')!;
  const bookEl = ov.querySelector<HTMLElement>('.go-book')!;
  const cancel = ov.querySelector<HTMLElement>('.go-cancel')!;

  let timer: number | null = null;
  let target: string | null = null;
  let popup: Window | null = null;

  const close = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
    if (popup && !popup.closed) { try { popup.close(); } catch { /* ignore */ } }
    popup = null;
  };

  const show = (url: string, cover: string, name: string, win: Window | null) => {
    target = url;
    popup = win;
    (window as any).plausible?.('Amazon Click', { props: { book: name || url, url } });

    titleEl.textContent = name || t('go.title') || 'Opening Amazon';
    subEl.textContent = t('go.sub') || 'Taking you to the secure Amazon store…';
    bookEl.innerHTML = cover ? `<img src="${cover}" alt="">` : '';
    cancel.textContent = t('go.cancel') || 'Cancel';
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');

    timer = window.setTimeout(() => {
      if (popup && !popup.closed) {
        try { (popup as any).opener = null; } catch { /* ignore */ }
        try { popup.location.replace(target!); popup.focus(); }
        catch { location.href = target!; }
      } else {
        location.href = target!;
      }
      ov.classList.remove('open');
      ov.setAttribute('aria-hidden', 'true');
    }, RM ? 200 : 1500);
  };

  cancel.addEventListener('click', close);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && ov.classList.contains('open')) close(); });

  document.addEventListener('click', (e) => {
    const me = e as MouseEvent;
    const a = (me.target as HTMLElement)?.closest?.('a[href*="amazon."]') as HTMLAnchorElement | null;
    if (!a) return;
    if (me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
    e.preventDefault();

    let win: Window | null = null;
    try { win = window.open('', '_blank'); } catch { win = null; }
    if (win) {
      try {
        (win as any).opener = null;
        win.document.write(
          '<!doctype html><meta charset=utf-8><title>Opening Amazon…</title>' +
          '<body style="margin:0;background:#07070a;color:#d9b45e;font:14px/1.6 system-ui;' +
          'display:grid;place-items:center;height:100vh">Opening Amazon…</body>',
        );
      } catch { /* ignore */ }
    }

    const card = a.closest('[data-book]');
    let cover = '';
    let nm = a.getAttribute('data-go-name') || '';
    if (card) {
      try {
        const d = JSON.parse(card.getAttribute('data-book')!);
        cover = d.img?.startsWith('http') ? d.img : `${import.meta.env.BASE_URL}/${d.img}`.replace(/\/+/g, '/');
        nm = nm || d.title;
      } catch { /* ignore */ }
    }
    const mim = document.querySelector<HTMLImageElement>('#modal.open #mImg');
    if (!cover && mim) {
      cover = mim.src;
      nm = nm || document.getElementById('mTitle')?.textContent || '';
    }
    show(a.href, cover, nm, win);
  }, true);
}
