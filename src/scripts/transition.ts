/* The cut between pages.

   A site made of pages announces every change with a white flash: the old
   document is torn down, a blank frame appears, the new one paints. This
   module replaces that tear with a cut — the screen goes to the colour of ink
   over a third of a second, the next page loads underneath it, and the page's
   own aperture lifts the ink away. What the visitor sees is one image
   changing, not one document replacing another.

   It is deliberately not a client-side router: no page is patched at runtime,
   no script is re-initialised, and every link still works with JavaScript off,
   with the modifier keys, with the back button, and in a new tab. All this
   module does is decide *when* a normal navigation begins. */

type AnchorTarget = {
  href: string;
  target?: string | null;
  hasAttribute(name: string): boolean;
};

/** Should this link be covered by the curtain, or left to the browser? */
export function isInternalNavigation(
  anchor: AnchorTarget,
  options: { origin?: string; pathname?: string; search?: string } = {},
): boolean {
  const origin = options.origin ?? location.origin;
  const pathname = options.pathname ?? location.pathname;
  const search = options.search ?? location.search;

  // a new tab, a download, or a protocol this site does not own
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;

  let url: URL;
  try {
    url = new URL(anchor.href, `${origin}${pathname}${search}`);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.origin !== origin) return false;

  // a jump inside the page being read is not a page change
  if (url.pathname === pathname && url.search === search && url.hash) return false;
  // clicking the page you are already on should do nothing at all
  if (url.pathname === pathname && url.search === search && !url.hash) return false;

  return true;
}

const CURTAIN_MS = 300;
const STRAND_MS = 6000;

/** Cover the screen, then let the browser do what it already does well. */
export function initCurtain(
  doc: Document = document,
  options: { navigate?: (href: string) => void } = {},
) {
  const view = doc.defaultView ?? window;
  const veil = doc.getElementById('veil');
  if (!veil) return () => {};

  const reduce = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  let pending: number | undefined;
  let leaving = false;

  const go = (href: string) => {
    view.clearTimeout(pending);
    if (options.navigate) options.navigate(href);
    else view.location.assign(href);
  };

  const onLeave = (href: string) => {
    if (leaving) return;
    leaving = true;
    veil.classList.add('is-on');
    // the paint that matters is the opaque one; navigate on the next frame
    // after it, with a hard cap so a throttled tab never strands the visitor
    pending = view.setTimeout(() => go(href), CURTAIN_MS + 60);
    veil.addEventListener('transitionend', () => {
      view.clearTimeout(pending);
      pending = view.setTimeout(() => go(href), 30);
    }, { once: true });
    // if the navigation never happens — offline, blocked, a stalled request —
    // the visitor must not be left looking at ink
    view.setTimeout(() => {
      if (veil.classList.contains('is-on')) {
        leaving = false;
        veil.classList.remove('is-on');
      }
    }, STRAND_MS);
  };

  const onClick = (event: Event) => {
    const mouse = event as MouseEvent;
    // anything another part of the page has already handled wins
    if (event.defaultPrevented) return;
    if (mouse.button !== undefined && mouse.button !== 0) return;
    if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;
    if (reduce && reduce.matches) return;

    const target = event.target as Element | null;
    const anchor = (target?.closest?.('a[href]') ?? null) as HTMLAnchorElement | null;
    if (!anchor) return;
    // read "here" from the document's own window, never from a shared global
    const here = { origin: view.location.origin, pathname: view.location.pathname, search: view.location.search };
    if (!isInternalNavigation(anchor, here)) return;

    event.preventDefault();
    onLeave(anchor.href);
  };

  doc.addEventListener('click', onClick);

  /* coming back from the back/forward cache: the curtain may still be down */
  const onShow = (event: Event) => {
    if (!(event as PageTransitionEvent).persisted) return;
    leaving = false;
    view.clearTimeout(pending);
    veil.classList.remove('is-on');
  };
  view.addEventListener('pageshow', onShow);

  return () => {
    view.clearTimeout(pending);
    doc.removeEventListener('click', onClick);
    view.removeEventListener('pageshow', onShow);
  };
}
