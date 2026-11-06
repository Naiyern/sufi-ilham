/* "Your shelf" — the site remembering where your attention was.

   The archive holds 37 titles; a visitor who opens three of them should not
   have to find them again from the top. Each book page records itself in this
   browser's local storage; the home page replays the last few as a rail.

   Nothing leaves the device, there is no account, and the shelf can be wiped
   from the rail itself. All of it is progressive: without JavaScript the rail
   never appears and the page is exactly as it was. */

export type ShelfItem = {
  slug: string;
  title: string;
  img: string;
  /** Last time the book was opened, ms since epoch. */
  ts: number;
};

export const SHELF_KEY = 'si_shelf';
const MAX_ITEMS = 6;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function safeParse(raw: string | null): ShelfItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is ShelfItem => Boolean(
        item
        && typeof (item as ShelfItem).slug === 'string'
        && typeof (item as ShelfItem).title === 'string'
        && typeof (item as ShelfItem).ts === 'number',
      ))
      .filter((item) => /^[a-z0-9-]+$/.test(item.slug))
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/** Newest first. Tolerates storage being blocked, empty or full. */
export function readShelf(storage: ReadableStorage): ShelfItem[] {
  try {
    return safeParse(storage.getItem(SHELF_KEY));
  } catch {
    return [];
  }
}

/** Record a visit and return the shelf it produces, newest first. */
export function rememberBook(storage: WritableStorage, book: Omit<ShelfItem, 'ts'>, now = Date.now()): ShelfItem[] {
  const entry: ShelfItem = { slug: book.slug, title: book.title, img: book.img, ts: now };
  const rest = readShelf(storage).filter((item) => item.slug !== entry.slug);
  const next = [entry, ...rest].slice(0, MAX_ITEMS);
  try {
    storage.setItem(SHELF_KEY, JSON.stringify(next));
  } catch {
    /* private mode or a full quota: the shelf simply does not persist */
  }
  return next;
}

export function clearShelf(storage: Pick<Storage, 'removeItem'>) {
  try {
    storage.removeItem(SHELF_KEY);
  } catch {
    /* nothing to clear */
  }
}

/* How far into a book the reader got, as a fraction, if they read it here and
   the reader has saved a place. Older visits stored a bare pixel offset, which
   says nothing about the page, so those simply have no progress to show. */
export function readingProgress(storage: ReadableStorage, slug: string): number | null {
  try {
    const raw = storage.getItem(`reader:${slug}`);
    if (!raw || raw.charAt(0) !== '{') return null;
    const parsed = JSON.parse(raw) as { p?: unknown };
    const progress = Number(parsed?.p);
    if (!Number.isFinite(progress) || progress <= 0.005 || progress >= 0.995) return null;
    return progress;
  } catch {
    return null;
  }
}

function base(doc: Document): string {
  return doc.documentElement.dataset.base || '';
}

/** Render the rail, or record the open book. Safe to call on every page. */
export function initShelf(doc: Document = document, storage: Storage | null = safeStorage()) {
  if (!storage) return;

  // 1. a book page remembers itself
  const page = doc.getElementById('bookBody');
  const data = page?.dataset.book;
  if (data) {
    try {
      const book = JSON.parse(data) as { slug?: string; title?: string; img?: string };
      if (book.slug && book.title) {
        rememberBook(storage, { slug: book.slug, title: book.title, img: book.img || '' });
      }
    } catch {
      /* a malformed attribute must never break the page */
    }
  }

  // 2. the home page replays the shelf
  const rail = doc.getElementById('myShelfRail');
  const section = doc.getElementById('myShelf');
  if (!rail || !section) return;

  const items = readShelf(storage);
  if (!items.length) return;

  rail.replaceChildren(...items.map((item) => {
    const li = doc.createElement('li');
    li.className = 'my-shelf-item';

    const link = doc.createElement('a');
    link.className = 'my-shelf-link';
    link.href = `${base(doc)}/books/${item.slug}/`;
    link.dataset.slug = item.slug;

    if (item.img) {
      const img = doc.createElement('img');
      img.src = item.img;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 120;
      img.height = 180;
      img.className = 'my-shelf-cover';
      link.append(img);
    }

    const title = doc.createElement('span');
    title.className = 'my-shelf-title';
    title.textContent = item.title;
    link.append(title);

    // a book you started carries the thread back into it
    const progress = readingProgress(storage as ReadableStorage, item.slug);
    if (progress !== null) {
      const meter = doc.createElement('span');
      meter.className = 'my-shelf-progress';
      meter.style.setProperty('--p', String(progress));
      meter.setAttribute('role', 'img');
      meter.setAttribute('aria-label', `Read ${Math.round(progress * 100)}%`);
      const fill = doc.createElement('span');
      fill.className = 'my-shelf-progress-fill';
      const pct = doc.createElement('span');
      pct.className = 'my-shelf-pct';
      pct.textContent = `${Math.round(progress * 100)}% read`;
      meter.append(fill);
      link.append(meter, pct);
    }

    li.append(link);
    return li;
  }));

  section.hidden = false;
  doc.documentElement.dataset.shelf = String(items.length);

  // 3. and can be forgotten on request
  doc.getElementById('myShelfClear')?.addEventListener('click', () => {
    clearShelf(storage as Pick<Storage, 'removeItem'>);
    rail.replaceChildren();
    section.hidden = true;
    delete doc.documentElement.dataset.shelf;
  });
}

function safeStorage(): Storage | null {
  try {
    const probe = '__si_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}
