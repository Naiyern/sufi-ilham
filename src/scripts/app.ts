const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll(s)) as T[];

/* ---------- theme ---------- */
const themeBtn = $('#themeBtn');
themeBtn?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
});

/* ---------- nav ---------- */
const nav = $('#nav');
const menu = $('#menu');
const burger = $('#burger');
burger?.addEventListener('click', () => {
  const open = menu?.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(!!open));
});
$$('#menu a').forEach((a) =>
  a.addEventListener('click', () => {
    menu?.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }),
);

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

/* ---------- reveal ---------- */
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

/* ---------- animated counters ---------- */
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

/* ---------- book filter + search ---------- */
const grid = $('#bookGrid');
if (grid) {
  const cards = $$('.card', grid);
  const chips = $$('.chip[data-filter]');
  const search = $<HTMLInputElement>('#bookSearch');
  const empty = $('#bookEmpty');
  let filter = 'all';

  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    let shown = 0;
    cards.forEach((c) => {
      const tags = c.dataset.tags || '';
      const title = c.dataset.title || '';
      const ok = (filter === 'all' || tags.includes(filter)) && (!q || title.includes(q));
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (empty) empty.style.display = shown ? 'none' : '';
  };

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      filter = chip.dataset.filter || 'all';
      apply();
    }),
  );
  search?.addEventListener('input', apply);
}

/* ---------- modal ---------- */
type Book = {
  title: string; sub?: string; kicker?: string; quote?: string; desc?: string; img: string;
  spec?: string[]; us?: string; in?: string; uk?: string; ca?: string; au?: string; paperback?: string;
};
const modal = $('#modal');
const BASE = document.querySelector('base')?.getAttribute('href') ?? '';
let lastFocus: HTMLElement | null = null;

const openModal = (b: Book) => {
  if (!modal) return;
  lastFocus = document.activeElement as HTMLElement;
  const img = $<HTMLImageElement>('#mImg')!;
  img.src = b.img.startsWith('http') ? b.img : `${BASE}/${b.img.replace(/^\//, '')}`.replace(/\/+/g, '/');
  img.alt = `${b.title} cover`;
  $('#mKicker')!.textContent = b.kicker || '';
  $('#mTitle')!.textContent = b.title;
  $('#mSub')!.textContent = b.sub || '';
  $('#mQuote')!.textContent = b.quote || '';
  $('#mDesc')!.innerHTML = b.desc || '';
  $('#mSpec')!.innerHTML = (b.spec || []).map((s) => `<li>${s}</li>`).join('');
  const stores: [string, string | undefined][] = [
    ['Amazon.com', b.us], ['Amazon.in', b.in], ['UK', b.uk], ['Canada', b.ca], ['Australia', b.au],
    ['Paperback', b.paperback],
  ];
  $('#mBuy')!.innerHTML = stores
    .filter(([, u]) => u)
    .map(([l, u], i) => `<a class="btn${i === 0 ? ' pri' : ''}" href="${u}" target="_blank" rel="noopener">${l}</a>`)
    .join('');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  $('#modalClose')?.focus();
};

const closeModal = () => {
  modal?.classList.remove('open');
  document.body.style.overflow = '';
  lastFocus?.focus();
};

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('.js-open')) {
    const card = t.closest('[data-book]') as HTMLElement | null;
    if (card?.dataset.book) openModal(JSON.parse(card.dataset.book));
  }
  if (t.closest('#modalClose') || t === modal) closeModal();
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
});

/* ---------- contact form → WhatsApp ---------- */
const form = $<HTMLFormElement>('#waForm');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = new FormData(form);
  const msg = `Hello Sufi Ilham,%0A%0AName: ${d.get('name')}%0AEmail: ${d.get('email')}%0ASubject: ${d.get(
    'subject',
  )}%0A%0A${d.get('message')}`;
  open(`https://wa.me/${form.dataset.phone}?text=${msg}`, '_blank', 'noopener');
});

export {};
