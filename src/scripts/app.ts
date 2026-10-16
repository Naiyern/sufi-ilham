import { initGo } from './amazon';
import { initAudio } from './audio';
import { initCatalogue } from './catalogue.js';
import { initCmdk } from './cmdk';
import { loadBooks, prefetchBooks, type Book } from './store';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll(s)) as T[];

/* ---------- cinematic pointer depth ---------- */
const initCinematicParallax = () => {
  const stages = $$<HTMLElement>('.editorial-hero, .book-hero, .s-hero');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => finePointer.matches && !reducedMotion.matches;
  if (!stages.length || !allowed()) return;

  const reset = (stage: HTMLElement) => {
    stage.style.removeProperty('--cinema-glow-x');
    stage.style.removeProperty('--cinema-glow-y');
    stage.querySelector<HTMLElement>('.hero-visual')?.style.removeProperty('--cinema-light-x');
    stage.querySelector<HTMLElement>('.hero-visual')?.style.removeProperty('--cinema-light-y');
    const portrait = stage.querySelector<HTMLImageElement>('.hero-image-wrap img');
    portrait?.style.removeProperty('--cinema-image-x');
    portrait?.style.removeProperty('--cinema-image-y');
  };

  stages.forEach((stage) => {
    let frame = 0;
    let clientX = 0;
    let clientY = 0;
    const spotlight = stage.querySelector<HTMLElement>('.hero-visual');
    const portrait = stage.querySelector<HTMLImageElement>('.hero-image-wrap img');

    const onMove = (event: PointerEvent) => {
      if (!allowed() || event.pointerType === 'touch') return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!allowed()) return;

        const bounds = stage.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
        const y = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
        stage.style.setProperty('--cinema-glow-x', `${Math.round(18 + x * 64)}%`);
        stage.style.setProperty('--cinema-glow-y', `${Math.round(16 + y * 66)}%`);

        if (spotlight) {
          const lightBounds = spotlight.getBoundingClientRect();
          const lightX = Math.max(0, Math.min(1, (clientX - lightBounds.left) / lightBounds.width));
          const lightY = Math.max(0, Math.min(1, (clientY - lightBounds.top) / lightBounds.height));
          spotlight.style.setProperty('--cinema-light-x', `${Math.round(25 + lightX * 50)}%`);
          spotlight.style.setProperty('--cinema-light-y', `${Math.round(22 + lightY * 56)}%`);
        }

        if (portrait) {
          portrait.style.setProperty('--cinema-image-x', `${((.5 - x) * 12).toFixed(1)}px`);
          portrait.style.setProperty('--cinema-image-y', `${((.5 - y) * 9).toFixed(1)}px`);
        }
      });
    };

    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      reset(stage);
    };
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', onLeave, { passive: true });
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) onLeave(); });
    finePointer.addEventListener('change', () => { if (!finePointer.matches) onLeave(); });
  });
};
initCinematicParallax();

/* The chapter rail follows the scene passing through the viewport center. */
const initChapterRail = () => {
  const rail = $('#chapterRail');
  if (!rail || !('IntersectionObserver' in window)) return;
  const links = $$<HTMLAnchorElement>('[data-chapter]', rail);
  const targets = links
    .map((link) => $(link.hash))
    .filter((target): target is HTMLElement => target instanceof HTMLElement);
  if (!targets.length) return;

  const centerInset = Math.round(innerHeight * 0.42);
  const observer = new IntersectionObserver((entries) => {
    const scene = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) =>
        Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - innerHeight / 2)
        - Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - innerHeight / 2),
      )[0];
    if (!scene) return;
    const id = (scene.target as HTMLElement).id;
    links.forEach((link) => {
      const active = link.hash === `#${id}`;
      const changed = link.classList.contains('active') !== active;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
        if (changed && matchMedia('(max-width: 1180px)').matches) {
          link.scrollIntoView({
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      } else link.removeAttribute('aria-current');
    });
  }, { rootMargin: `-${centerInset}px 0px -${centerInset}px 0px`, threshold: 0 });

  targets.forEach((target) => observer.observe(target));
};
initChapterRail();

/* ---------- theme ---------- */
const themeBtn = $('#themeBtn');
const paintThemeButton = () =>
  themeBtn?.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
paintThemeButton();
themeBtn?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  paintThemeButton();
  try { localStorage.setItem('theme', next); } catch { /* private mode */ }
});

/* ---------- nav ---------- */
const nav = $('#nav');
const menu = $('#menu');
const burger = $('#burger');
const compactNav = () => matchMedia('(max-width: 1180px)').matches;
const setMenu = (open: boolean, restoreFocus = false) => {
  const compact = compactNav();
  const visible = compact && open;
  menu?.classList.toggle('open', visible);
  menu?.setAttribute('aria-hidden', String(compact && !visible));
  if (menu) menu.inert = compact && !visible;
  document.body.classList.toggle('menu-open', visible);
  burger?.setAttribute('aria-expanded', String(visible));
  burger?.setAttribute('aria-label', visible ? 'Close navigation menu' : 'Open navigation menu');
  if (visible) requestAnimationFrame(() => menu?.querySelector('a')?.focus({ preventScroll: true }));
  else if (restoreFocus) burger?.focus();
};
if (menu) setMenu(false);
burger?.addEventListener('click', () => setMenu(!menu?.classList.contains('open')));
$$('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false, true)));
/* tap on the scrim (or anywhere outside) closes the menu */
document.addEventListener('click', (e) => {
  if (!menu?.classList.contains('open')) return;
  const t = e.target as Node;
  if (menu.contains(t) || (burger && burger.contains(t))) return;
  setMenu(false);
});
addEventListener('keydown', (e) => {
  if (!menu?.classList.contains('open')) return;
  if (e.key === 'Escape') { setMenu(false, true); return; }
  if (e.key === 'Tab') {
    const focusable = [
      ...$$<HTMLElement>('a[href]', menu),
      ...(burger ? [burger] : []),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
});
addEventListener('resize', () => setMenu(false));

/* ---------- scroll: progress, sticky nav, to-top ---------- */
const progress = $('#progress');
const toTop = $('#toTop');
let ticking = false;
const onScroll = () => {
  const y = window.scrollY;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progress?.style.setProperty('--p', String(h > 0 ? y / h : 0));
  nav?.classList.toggle('stuck', y > 40);
  toTop?.classList.toggle('show', y > 700);
  ticking = false;
};
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);
onScroll();
toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- reveal + animated counters ---------- */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  $$('.reveal').forEach((el) => io.observe(el));

  const counters = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = Number(el.dataset.count || 0);
        const suffix = el.dataset.suffix || '';
        const dur = 1400;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counters.unobserve(el);
      }),
    { threshold: 0.6 },
  );
  $$('[data-count]').forEach((el) => counters.observe(el));
} else {
  $$('.reveal').forEach((el) => el.classList.add('in'));
}

/* ---------- catalogue filters, rich search, sort + live count ---------- */
initCatalogue();

/* Book shelves use native links; the details dialog is an optional enhancement. */
/* ---------- modal ---------- */
const modal = $('#modal');
let lastFocus: HTMLElement | null = null;

/* Prefetch the lazy book store on idle so a modal opens instantly on click. */
if (modal) prefetchBooks();

const openModal = (b: Book, slug: string, trigger?: HTMLElement | null) => {
  if (!modal) return;
  lastFocus = trigger ?? document.activeElement as HTMLElement;
  const img = $<HTMLImageElement>('#mImg')!;
  img.src = b.img;
  img.alt = `${b.altTitle || b.title} cover`;
  $('#mKicker')!.textContent = b.kicker || '';

  const status = $<HTMLElement>('#mStatus')!;
  status.textContent = b.comingSoon ? 'Forthcoming' : b.free ? 'Free to read online' : 'Available now';
  status.hidden = false;
  const titleEl = $('#mTitle')!;
  titleEl.textContent = b.title;
  titleEl.setAttribute('lang', b.language || 'en');
  if (b.dir) titleEl.setAttribute('dir', b.dir); else titleEl.removeAttribute('dir');

  const alt = $<HTMLElement>('#mAltTitle')!;
  alt.textContent = b.altTitle || '';
  alt.hidden = !b.altTitle;
  const sub = $<HTMLParagraphElement>('#mSub')!;
  sub.textContent = b.sub || '';
  sub.hidden = !b.sub;
  sub.setAttribute('lang', b.language || 'en');
  const quote = $<HTMLParagraphElement>('#mQuote')!;
  quote.textContent = b.quote || '';
  quote.hidden = !b.quote;
  quote.setAttribute('lang', b.language || 'en');
  if (b.dir) quote.setAttribute('dir', b.dir); else quote.removeAttribute('dir');
  $('#mDesc')!.innerHTML = b.desc || '';

  const specList = $<HTMLUListElement>('#mSpec')!;
  specList.replaceChildren(...(b.spec || []).map((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));

  const buy = $('#mBuy')!;
  const stores: [string, string | undefined][] = [
    ['Amazon.com', b.us], ['Amazon.in', b.in], ['UK', b.uk], ['Canada', b.ca], ['Australia', b.au],
    ['Paperback', b.paperback],
  ];
  if (b.free && b.read) stores.unshift(['Read free online', b.read]);
  buy.replaceChildren(...stores.filter(([, url]) => Boolean(url)).map(([label, url], index) => {
    const link = document.createElement('a');
    link.className = `btn${index === 0 ? ' pri' : ''}`;
    link.href = url!;
    link.textContent = label;
    const external = new URL(url!, location.href).origin !== location.origin;
    if (external) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    return link;
  }));

  const pageLink = $<HTMLAnchorElement>('#mPage')!;
  pageLink.href = `${modal.getAttribute('data-base') || ''}/books/${encodeURIComponent(slug)}/`;
  pageLink.textContent = 'Open full book page →';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('#modalClose')?.focus();
};

const closeModal = () => {
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocus?.focus({ preventScroll: true });
};

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const bookLink = t.closest('a.book-tile, a.spine, a.release-cover-link') as HTMLAnchorElement | null;
  const mouse = e as MouseEvent;
  if (bookLink && (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.button !== 0)) return;
  if (bookLink) e.preventDefault();

  if (t.closest('.js-open, .book-tile, .spine')) {
    const card = t.closest('[data-slug]') as HTMLElement | null;
    const slug = card?.dataset.slug;
    if (slug) {
      const candidate = t.closest('a.book-tile, a.spine, a.release-cover-link, button.js-open') as HTMLElement | null;
      const trigger = candidate?.matches('a[href], button, [tabindex]:not([tabindex="-1"])')
        ? candidate
        : document.activeElement as HTMLElement;
      loadBooks().then((db) => {
        const b = db[slug];
        if (b) openModal(b, slug, trigger);
        else {
          const fallback = bookLink?.href || `${modal?.getAttribute('data-base') || ''}/books/${encodeURIComponent(slug)}/`;
          window.location.assign(fallback);
        }
      });
    }
  }
  if (t.closest('#modalClose') || t === modal) closeModal();
});
addEventListener('keydown', (e) => {
  if (!modal?.classList.contains('open')) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    const focusable = Array.from(modal.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
});

/* ---------- contact fields → WhatsApp (never submitted to this server) ---------- */
const contactGroup = $<HTMLElement>('#waForm');
const contactSend = $<HTMLButtonElement>('#waSend');
const showWhatsAppDraft = (note: HTMLElement | null, url: string) => {
  if (!note) return;
  note.replaceChildren(document.createTextNode('WhatsApp should open with your draft. If it did not, '));
  const fallback = document.createElement('a');
  fallback.href = url;
  fallback.target = '_blank';
  fallback.rel = 'noopener';
  fallback.textContent = 'open the draft here';
  note.append(fallback, document.createTextNode('. Choose Send in WhatsApp only if you want to contact the author.'));
};
const sendContactMessage = () => {
  if (!contactGroup) return;
  const fields = Array.from(contactGroup.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name]'));
  const data = new FormData();
  for (const field of fields) {
    if (!field.reportValidity()) return;
    data.set(field.name, field.value);
  }
  const message = [
    'Hello Sufi Ilham,',
    '',
    `Name: ${data.get('name') || ''}`,
    `Email: ${data.get('email') || ''}`,
    `Subject: ${data.get('subject') || ''}`,
    '',
    `${data.get('message') || ''}`,
  ].join('\n');
  const url = new URL(`https://wa.me/${contactGroup.dataset.phone}`);
  url.searchParams.set('text', message);
  window.open(url.href, '_blank', 'noopener');
  showWhatsAppDraft($('#waNote'), url.href);
};
contactSend?.addEventListener('click', sendContactMessage);
contactGroup?.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendContactMessage(); }
  });
});

/* ---------- new-release request → WhatsApp ---------- */
const news = $<HTMLElement>('#newsForm');
const newsEmail = $<HTMLInputElement>('#newsEmail');
const newsSend = $<HTMLButtonElement>('#newsSend');
const sendReleaseRequest = () => {
  if (!news || !newsEmail?.reportValidity()) return;
  const email = newsEmail.value.trim();
  if (!email) return;
  (window as any).plausible?.('New Release Request');
  const url = new URL(`https://wa.me/${news.dataset.phone}`);
  url.searchParams.set('text', `Hello Sufi Ilham,\n\nI would like to hear about new releases.\nEmail: ${email}`);
  window.open(url.href, '_blank', 'noopener');
  showWhatsAppDraft($('#newsNote'), url.href);
  newsEmail.value = '';
};
newsSend?.addEventListener('click', sendReleaseRequest);
newsEmail?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); sendReleaseRequest(); }
});

/* ---------- soundtrack, Amazon interstitial ---------- */
initGo();
initAudio();
initCmdk();

/* ---------- 3D tilt on book covers ---------- */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(hover:hover)').matches) {
  $$('.spine').forEach((c) => {
    const el = c as HTMLElement;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e as PointerEvent).clientX - r.left;
      const py = (e as PointerEvent).clientY - r.top;
      const rx = ((py / r.height) - 0.5) * -7;
      const ry = ((px / r.width) - 0.5) * 7;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- per-article reading progress ---------- */
const bp = $('#bpBar');
if (bp) {
  const article = $('#bookBody');
  const onBp = () => {
    if (!article) return;
    const r = article.getBoundingClientRect();
    const total = r.height - innerHeight;
    const done = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
    bp.style.setProperty('--bp', String(done));
  };
  addEventListener('scroll', onBp, { passive: true });
  onBp();
}

export {};
