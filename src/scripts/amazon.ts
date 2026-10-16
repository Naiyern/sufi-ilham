import { booksNow } from './store';

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
  let returnFocus: HTMLElement | null = null;

  const hide = () => {
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
  };
  const restoreFocus = () => {
    returnFocus?.focus({ preventScroll: true });
    returnFocus = null;
  };
  const close = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    hide();
    if (popup && !popup.closed) { try { popup.close(); } catch { /* ignore */ } }
    popup = null;
    restoreFocus();
  };

  const show = (url: string, cover: string, name: string, win: Window | null, trigger: HTMLElement) => {
    if (timer !== null) clearTimeout(timer);
    target = url;
    popup = win;
    returnFocus = trigger;
    (window as any).plausible?.('Amazon Click', { props: { book: name || url, url } });

    titleEl.textContent = name || 'Opening Amazon';
    subEl.textContent = 'Taking you to the secure Amazon store…';
    bookEl.replaceChildren();
    if (cover) {
      const image = document.createElement('img');
      image.src = cover;
      image.alt = '';
      bookEl.append(image);
    }
    cancel.textContent = 'Cancel';
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    cancel.focus({ preventScroll: true });

    timer = window.setTimeout(() => {
      if (popup && !popup.closed) {
        try { (popup as any).opener = null; } catch { /* ignore */ }
        try { popup.location.replace(target!); popup.focus(); }
        catch { location.href = target!; }
      } else {
        location.href = target!;
      }
      popup = null;
      timer = null;
      hide();
      restoreFocus();
    }, RM ? 200 : 1500);
  };

  cancel.addEventListener('click', close);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  addEventListener('keydown', (e) => {
    if (!ov.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { e.preventDefault(); cancel.focus({ preventScroll: true }); }
  });

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

    const card = a.closest('[data-slug]') as HTMLElement | null;
    let cover = '';
    let nm = a.getAttribute('data-go-name') || '';
    if (card?.dataset.slug) {
      const d = booksNow()?.[card.dataset.slug];
      if (d) { cover = d.img; nm = nm || d.title; }
    }
    const mim = document.querySelector<HTMLImageElement>('#modal.open #mImg');
    if (!cover && mim) {
      cover = mim.src;
      nm = nm || document.getElementById('mTitle')?.textContent || '';
    }
    show(a.href, cover, nm, win, a);
  }, true);
}
