/* Shared, lazily-fetched book store. The data lives in /book-store.json
   (see BookModal.astro) instead of being inlined into every page. Both the
   modal (app.ts) and the Amazon interstitial (amazon.ts) read it from here so
   it is fetched at most once per visit and never bloats the HTML. */
export type Book = {
  title: string; sub?: string; kicker?: string; quote?: string; desc?: string; img: string;
  spec?: string[]; us?: string; in?: string; uk?: string; ca?: string; au?: string; paperback?: string;
  free?: boolean; pdf?: string; read?: string; dir?: 'rtl' | 'ltr';
};

let BOOKS: Record<string, Book> | null = null;
let pending: Promise<Record<string, Book>> | null = null;

const storeUrl = (): string | null =>
  document.getElementById('modal')?.getAttribute('data-store') ?? null;

export function loadBooks(): Promise<Record<string, Book>> {
  if (BOOKS) return Promise.resolve(BOOKS);
  if (pending) return pending;
  const url = storeUrl();
  if (!url) return Promise.resolve((BOOKS = {}));
  pending = fetch(url)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: Record<string, Book>) => (BOOKS = d))
    .catch(() => (BOOKS = {}));
  return pending;
}

/** Synchronous access to the store if it has already loaded, else null. */
export function booksNow(): Record<string, Book> | null {
  return BOOKS;
}

/** Kick off the fetch when the browser is idle, so it's ready before a click. */
export function prefetchBooks(): void {
  const run = () => loadBooks();
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(run);
  } else {
    setTimeout(run, 1500);
  }
}
