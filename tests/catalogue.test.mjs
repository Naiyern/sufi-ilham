import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { initCatalogue } from '../src/scripts/catalogue.js';
import { initTheme } from '../src/scripts/theme.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const builtHtml = readFileSync(join(projectRoot, 'dist/index.html'), 'utf8');
// The site is served from a subpath (GitHub Pages project site), so internal
// links must carry the deploy base. Read it from the built canonical instead of
// hardcoding it, so the tests follow astro.config's SITE_BASE.
const BASE = new URL(builtHtml.match(/<link rel="canonical" href="([^"]+)"/)[1]).pathname.replace(/\/$/, '');
const stylesheet = readFileSync(join(projectRoot, 'src/styles/global.css'), 'utf8');

function setupCatalogue() {
  const dom = new JSDOM(builtHtml, {
    url: 'https://sufi-ilham.test/sufi-ilham/',
    pretendToBeVisual: true,
  });
  initCatalogue(dom.window.document);
  return dom;
}

function visibleSlugs(document) {
  return [...document.querySelectorAll('#bookGrid .book-tile')]
    .filter((tile) => tile.style.display !== 'none')
    .map((tile) => tile.dataset.slug);
}

function setSearch(dom, value) {
  const input = dom.window.document.querySelector('#bookSearch');
  input.value = value;
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

function setSelect(dom, id, value) {
  const select = dom.window.document.querySelector(`#${id}`);
  select.value = value;
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

function close(dom) {
  dom.window.close();
}

test('starts with all 36 catalogue entries and a contextual live count', () => {
  const dom = setupCatalogue();
  const { document } = dom.window;
  const tiles = [...document.querySelectorAll('#bookGrid .book-tile')];
  const forthcoming = tiles.filter((tile) => tile.dataset.comingSoon === 'true');

  assert.equal(tiles.length, 36);
  assert.equal(tiles.length - forthcoming.length, 32);
  assert.equal(forthcoming.length, 4);
  assert.equal(new Set(tiles.map((tile) => tile.dataset.order)).size, 36);
  assert.deepEqual(visibleSlugs(document).length, 36);
  assert.equal(document.querySelector('#fcount').textContent, 'Showing 36 of 36 titles');
  assert.equal(document.querySelector('#catalogReset').hidden, true);
  assert.equal(document.querySelector('#bookEmpty').hidden, true);
  close(dom);
});

test('searches summaries with case-insensitive AND terms and combines with language filters', () => {
  const dom = setupCatalogue();
  const { document } = dom.window;

  setSearch(dom, 'FLOWER nahrabad');
  assert.deepEqual(visibleSlugs(document), ['the-river-s-portion']);
  assert.equal(document.querySelector('#fcount').textContent, 'Showing 1 of 36 titles');

  setSearch(dom, '');
  setSearch(dom, 'Hindi');
  assert.deepEqual(visibleSlugs(document), ['nasruddin-ki-tedhi-tarazu']);
  close(dom);
});

test('combines genre, series, and search; the top reset restores every control', () => {
  const dom = setupCatalogue();
  const { document } = dom.window;
  const romance = document.querySelector('[data-filter="romance"]');

  setSelect(dom, 'seriesFilter', 'maple');
  romance.click();
  assert.equal(visibleSlugs(document).length, 5);
  assert.equal(romance.getAttribute('aria-pressed'), 'true');

  setSearch(dom, 'Christmas');
  assert.deepEqual(visibleSlugs(document), ['the-christmas-letters-of-maple-falls']);
  assert.equal(document.querySelector('#catalogReset').hidden, false);
  document.querySelector('#catalogReset').click();

  assert.equal(visibleSlugs(document).length, 36);
  assert.equal(document.querySelector('#bookSearch').value, '');
  assert.equal(document.querySelector('#seriesFilter').value, 'all');
  assert.equal(document.querySelector('#bookSort').value, 'newest');
  assert.equal(document.querySelector('[data-filter="all"]').getAttribute('aria-pressed'), 'true');
  assert.equal(document.querySelector('#catalogReset').hidden, true);
  assert.equal(document.activeElement, document.querySelector('#bookSearch'));
  close(dom);
});

test('sorts alphabetically and by page count while keeping forthcoming titles last', () => {
  const dom = setupCatalogue();
  const { document } = dom.window;
  const tiles = () => [...document.querySelectorAll('#bookGrid .book-tile')];
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  setSelect(dom, 'bookSort', 'title');
  let ordered = tiles();
  const published = ordered.filter((tile) => tile.dataset.comingSoon !== 'true');
  const upcoming = ordered.filter((tile) => tile.dataset.comingSoon === 'true');
  assert.equal(ordered.at(-1).dataset.comingSoon, 'true');
  for (let i = 1; i < published.length; i++) {
    assert.ok(collator.compare(published[i - 1].dataset.sortTitle, published[i].dataset.sortTitle) <= 0);
  }
  assert.equal(upcoming.length, 4);

  setSelect(dom, 'bookSort', 'pages');
  ordered = tiles();
  const publishedPages = ordered.filter((tile) => tile.dataset.comingSoon !== 'true');
  const pageValues = publishedPages.map((tile) => Number(tile.dataset.pages)).filter(Boolean);
  const sortedPageValues = [...pageValues].sort((a, b) => a - b);
  assert.deepEqual(pageValues, sortedPageValues);
  const firstUnknown = publishedPages.findIndex((tile) => !Number(tile.dataset.pages));
  if (firstUnknown !== -1) {
    assert.ok(publishedPages.slice(firstUnknown).every((tile) => !Number(tile.dataset.pages)));
  }
  assert.ok(ordered.slice(-4).every((tile) => tile.dataset.comingSoon === 'true'));
  assert.equal(document.querySelector('#catalogReset').hidden, false);
  close(dom);
});

test('no-results state gives a working reset path and returns focus to search', () => {
  const dom = setupCatalogue();
  const { document } = dom.window;

  setSearch(dom, 'nothing-matches-this-query');
  assert.deepEqual(visibleSlugs(document), []);
  assert.equal(document.querySelector('#fcount').textContent, 'Showing 0 of 36 titles');
  assert.equal(document.querySelector('#bookEmpty').hidden, false);
  assert.equal(document.querySelector('#catalogReset').hidden, false);

  document.querySelector('.catalog-empty .js-catalog-reset').click();
  assert.equal(visibleSlugs(document).length, 36);
  assert.equal(document.querySelector('#bookEmpty').hidden, true);
  assert.equal(document.querySelector('#fcount').textContent, 'Showing 36 of 36 titles');
  assert.equal(document.activeElement, document.querySelector('#bookSearch'));
  close(dom);
});

test('controls have accessible names, a single contextual status, and a mobile reflow rule', () => {
  const dom = setupCatalogue();
  const { document } = dom.window;

  assert.match(document.querySelector('.catalog-search').textContent, /Search titles, series, genres, languages, availability and summaries/);
  assert.equal(document.querySelector('#bookSearch').getAttribute('aria-controls'), 'bookGrid');
  assert.equal(document.querySelector('#seriesFilter').getAttribute('aria-controls'), 'bookGrid');
  assert.equal(document.querySelector('#bookSort').getAttribute('aria-controls'), 'bookGrid');
  assert.equal(document.querySelector('#fcount').getAttribute('role'), 'status');
  assert.equal(document.querySelector('#fcount').getAttribute('aria-atomic'), 'true');
  assert.match(stylesheet, /@media\s*\(max-width:\s*740px\)[\s\S]*?\.catalog-search\s*\{\s*grid-column:\s*1\s*\/\s*-1\s*;/);
  assert.match(stylesheet, /\.catalog-controls\s+\.fbtn\s*\{[^}]*min-height:\s*44px/s);
  assert.doesNotMatch(stylesheet, /\.soon-step[^{}]*\{[^}]*\bopacity\s*:/s);
  close(dom);
});

test('homepage keeps every chapter anchor and no longer carries a rail', () => {
  const dom = new JSDOM(builtHtml);
  const { document } = dom.window;

  // the eight chapters are ordinary sections; the header nav reaches them
  for (const id of ['top', 'new', 'index', 'series', 'essay', 'figures', 'ending', 'enquiries']) {
    assert.ok(document.getElementById(id), `missing chapter section #${id}`);
  }
  const navHrefs = [...document.querySelectorAll('.mast nav a')].map((a) => a.getAttribute('href'));
  assert.ok(navHrefs.some((href) => href.endsWith('/discover/')), 'header nav should still reach the reader guide');

  // the floating rail was removed on request: markup, styles and script all go
  assert.equal(document.querySelector('#chapterRail'), null);
  assert.equal(document.querySelector('[data-chapter]'), null);
  assert.doesNotMatch(stylesheet, /chapter-rail|chapterRail|chapter-name/);
  const appSource = readFileSync(join(projectRoot, 'src/scripts/app.ts'), 'utf8');
  assert.doesNotMatch(appSource, /chapterRail|data-chapter|initChapterRail/);

  assert.match(stylesheet, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(stylesheet, /\.soon-step[^{}]*\{[^}]*\bopacity\s*:/s);
  close(dom);
});

test('mobile keeps cinematic navigation and series artwork in the experience', () => {
  const mobileStart = stylesheet.indexOf('MOBILE CINEMA');
  assert.notEqual(mobileStart, -1);
  const mobileStyles = stylesheet.slice(mobileStart);

  assert.match(mobileStyles, /\.s-hero-bg\s*\{[^}]*display:\s*flex;/s);
  assert.match(mobileStyles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('contact, legal, book and series routes carry their scene-specific shells', () => {
  const readPage = (route) => readFileSync(join(projectRoot, 'dist', route, 'index.html'), 'utf8');
  const contact = readPage('contact');
  const privacy = readPage('privacy');
  const book = readPage('books/darya-ka-aik-hissa');
  const seriesPage = readPage('series/carto');

  assert.match(contact, /class="contact-page"/);
  assert.match(contact, /class="correspondence-chapter"/);
  assert.match(privacy, /class="legal-page"/);
  assert.match(privacy, /class="legal-hero"/);
  assert.match(book, /class="book-page"/);
  assert.match(seriesPage, /class="series-page"/);
  assert.match(seriesPage, /class="soon-step"/);
  assert.match(stylesheet, /#order \.soon-step \.s-step p\s*\{\s*color:\s*var\(--ink-2\)/);
});

test('does nothing on pages without a catalogue', () => {
  const dom = new JSDOM('<main>No catalogue on this page</main>');
  assert.doesNotThrow(() => initCatalogue(dom.window.document));
  close(dom);
});

test('new release is searchable and links to its verified book page', () => {
  const dom = setupCatalogue();
  setSearch(dom, 'First Person Singular');
  assert.deepEqual(visibleSlugs(dom.window.document), ['first-person-singular']);
  const page = readFileSync(join(projectRoot, 'dist/books/first-person-singular/index.html'), 'utf8');
  assert.match(page, /B0HNWJH3LD/);
  assert.match(page, /22 Oct 2026/);
  close(dom);
});


test('new books are searchable and The Ninth Bell belongs to The Nine Hours', () => {
  const dom = setupCatalogue();
  setSearch(dom, 'caregiving');
  assert.deepEqual(visibleSlugs(dom.window.document), ['the-caregiving-launch-plan']);
  setSearch(dom, '');
  setSelect(dom, 'seriesFilter', 'nine-hours');
  assert.deepEqual(visibleSlugs(dom.window.document), ['the-ninth-bell']);
  for (const [slug, asin] of [['the-ninth-bell', 'B0HPJK4NSQ'], ['the-caregiving-launch-plan', 'B0HP7KFBWP']]) {
    const page = readFileSync(join(projectRoot, 'dist/books', slug, 'index.html'), 'utf8');
    assert.ok(page.includes(asin));
  }
  assert.match(readFileSync(join(projectRoot, 'dist/series/nine-hours/index.html'), 'utf8'), /The Ninth Bell/);
  close(dom);
});

test('reader guide presents four accessible paths with valid book links', () => {
  const html = readFileSync(join(projectRoot, 'dist/discover/index.html'), 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.querySelectorAll('.path-card').length, 4);
  const bookLinks = [...document.querySelectorAll('.path-book')];
  assert.equal(bookLinks.length, 12);
  assert.ok(bookLinks.every((link) => link.getAttribute('href').startsWith(`${BASE}/books/`)));
  assert.ok(bookLinks.every((link) => link.querySelector('img[alt]')));
  assert.ok(document.querySelector(`a[href="${BASE}/read/darya-ka-aik-hissa/"]`));
  assert.ok(new JSDOM(builtHtml).window.document.querySelector(`a[href="${BASE}/discover/"]`));
  close(dom);
});

test('series books link to adjacent titles in reading order', () => {
  const page = readFileSync(join(projectRoot, 'dist/books/the-sea-tithe/index.html'), 'utf8');
  const dom = new JSDOM(page);
  const nav = dom.window.document.querySelector('nav[aria-label="Series reading order"]');
  assert.ok(nav.querySelector(`a[href="${BASE}/books/the-shadow-tithe/"]`));
  assert.ok(nav.querySelector(`a[href="${BASE}/books/the-crown-always-owns/"]`));
  close(dom);
});

test('reader paths connect homepage to guide and remain usable on mobile', () => {
  const home = new JSDOM(builtHtml);
  const guide = new JSDOM(readFileSync(join(projectRoot, 'dist/discover/index.html'), 'utf8'));
  const links = [...home.window.document.querySelectorAll('.home-paths a')];
  assert.equal(links.length, 4);
  for (const link of links) assert.ok(guide.window.document.getElementById(link.getAttribute('href').split('#')[1]));
  assert.match(stylesheet, /@media\s*\(max-width:\s*760px\)\s*\{\s*\.hero-layout\s*\{\s*grid-template-columns:\s*1fr/);
  close(home); close(guide);
});

test('all series structured data tracks the current catalogue', () => {
  const home = new JSDOM(builtHtml);
  const data = [...home.window.document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
  const series = data.filter((item) => item['@type'] === 'BookSeries');
  assert.equal(series.length, 5);
  const nine = series.find((item) => item.name === 'The Nine Hours');
  assert.equal(nine.numberOfItems, 1);
  assert.match(nine.hasPart[0].url, /the-ninth-bell/);
  const page = readFileSync(join(projectRoot, 'dist/series/nine-hours/index.html'), 'utf8');
  assert.match(page, /BookSeries/);
  close(home);
});

test('404 pages are noindexed and catalogue resources use versioned URLs', () => {
  const notFound = new JSDOM(readFileSync(join(projectRoot, 'dist/404.html'), 'utf8'));
  assert.equal(notFound.window.document.querySelector('meta[name="robots"]').content, 'noindex');
  assert.equal(notFound.window.document.querySelector('link[rel="canonical"]'), null);
  const home = new JSDOM(builtHtml);
  assert.match(home.window.document.querySelector('#modal').dataset.store, /book-store\.json\?v=[0-9a-f]{12}$/);
  assert.match(home.window.document.querySelector('.hero-portrait img').src, /sufi-ilham-portrait\.jpg\?v=[0-9a-f]{12}$/);
  close(notFound); close(home);
});

test('book specs avoid stale fixed retailer prices', () => {
  const books = JSON.parse(readFileSync(join(projectRoot, 'src/data/books.json'), 'utf8'));
  for (const book of books) for (const spec of book.spec || []) assert.doesNotMatch(spec, /[₹$£]\s*\d/);
});

test('Song of the Unbroken Sky uses the current Amazon cover images', () => {
  const books = JSON.parse(readFileSync(join(projectRoot, 'src/data/books.json'), 'utf8'));
  const covers = {
    'the-eden-of-sunspire': '81DvLXaR5LL._SY342_.jpg',
    'the-citadel-of-sapphire-seas': '819Acw0OWjL._SY342_.jpg',
    'the-chariot-of-peace': '81xXCHwx8tL._SY342_.jpg',
  };
  const store = JSON.parse(readFileSync(join(projectRoot, 'dist/book-store.json'), 'utf8'));
  const seriesPage = readFileSync(join(projectRoot, 'dist/series/song/index.html'), 'utf8');
  for (const [slug, image] of Object.entries(covers)) {
    assert.ok(books.find((book) => book.slug === slug).img.endsWith(image));
    assert.ok(store[slug].img.endsWith(image));
    assert.ok(seriesPage.includes(image));
    assert.ok(readFileSync(join(projectRoot, 'dist/books', slug, 'index.html'), 'utf8').includes(image));
  }
});

test('theme toggle preserves preference and communicates its current state', () => {
  const dom = new JSDOM(builtHtml, { url: 'https://sufiilham.test/' });
  const { document, localStorage } = dom.window;
  document.documentElement.dataset.theme = 'dark';
  initTheme(document, localStorage);
  const button = document.getElementById('themeBtn');
  assert.equal(button.getAttribute('aria-label'), 'Dark mode');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(button.title, 'Switch to light mode');
  button.click();
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  assert.equal(localStorage.getItem('theme'), 'light');
  button.click();
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(localStorage.getItem('theme'), 'dark');
  close(dom);
});

test('theme toggle works when storage is unavailable', () => {
  const dom = new JSDOM(builtHtml, { url: 'https://sufiilham.test/' });
  initTheme(dom.window.document, { setItem() { throw new Error('Storage unavailable'); } });
  const button = dom.window.document.getElementById('themeBtn');
  button.click();
  assert.equal(dom.window.document.documentElement.dataset.theme, 'dark');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  close(dom);
});

test('dark reading surfaces and cinematic light pass have reduced-motion fallback', () => {
  assert.match(stylesheet, /html\[data-theme='dark'\] \.discover-paths/);
  assert.match(stylesheet, /html\[data-theme='dark'\] \.home-discovery/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.hero-image-wrap::before\s*\{\s*animation: portrait-light-pass/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.hero-image-wrap::before, \.hero-eyebrow-rule\s*\{\s*animation: none !important/);
});

test('book and series scenes have useful next steps and book cover backdrops', () => {
  for (const route of ['books/the-ninth-bell', 'series/song', 'contact']) {
    const dom = new JSDOM(readFileSync(join(projectRoot, 'dist', route, 'index.html'), 'utf8'));
    const next = dom.window.document.querySelector('.next-chapter');
    assert.ok(next, `missing next chapter on ${route}`);
    assert.ok(next.querySelector(`a[href="${BASE}/discover/"]`));
    assert.ok(next.querySelector(`a[href="${BASE}/#index"]`));
    close(dom);
  }
  const book = new JSDOM(readFileSync(join(projectRoot, 'dist/books/the-ninth-bell/index.html'), 'utf8'));
  assert.match(book.window.document.querySelector('.book-hero').getAttribute('style'), /--cinema-still:url\("https:\/\/m\.media-amazon\.com/);
  close(book);
  assert.match(stylesheet, /html\[data-theme='dark'\] \.next-chapter/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.book-hero-copy, \.s-hero-in/);
});

test('cinematic quote keeps readable text and a reduced-motion fallback', () => {
  const dom = new JSDOM(builtHtml);
  const heading = dom.window.document.querySelector('#closing-quote-text');
  assert.match(heading.textContent.replace(/\s+/g, ' ').trim(), /A journey of a thousand miles begins with a single step/);
  assert.equal(heading.querySelectorAll('.quote-line').length, 3);
  assert.match(dom.window.document.querySelector('.quote-credit').textContent, /Lao Tzu/);
  assert.match(stylesheet, /prefers-reduced-motion: reduce[\s\S]*?\.closing-quote \.quote-line/);
  close(dom);
});

test('every catalogue cover is a physical 3D book with an accessible front', () => {
  const dom = new JSDOM(builtHtml);
  const { document } = dom.window;
  const books = [...document.querySelectorAll('#bookGrid .book-tile [data-book3d]')];
  assert.equal(books.length, 36, 'each tile should carry one book object');
  for (const book of books) {
    const front = book.querySelector('.b3d-front');
    assert.ok(front, 'missing front board');
    assert.ok(front.querySelector('img[alt]'), 'the cover image inside the front board needs alt text');
    assert.ok(book.querySelector('.b3d-spine-title').textContent.trim(), 'spine needs a title');
    for (const face of book.querySelectorAll('.b3d-spine, .b3d-fore, .b3d-head, .b3d-tail, .b3d-back, .b3d-shadow')) {
      assert.equal(face.getAttribute('aria-hidden'), 'true', 'decorative book parts must be hidden from AT');
    }
  }
  close(dom);
});

test('3D books appear everywhere a cover does, and flatten for reduced motion', () => {
  for (const route of ['', 'discover', 'series/song', 'books/the-ninth-bell']) {
    const doc = new JSDOM(readFileSync(join(projectRoot, 'dist', route, 'index.html'), 'utf8')).window.document;
    assert.ok(doc.querySelector('[data-book3d]'), `no 3D book on /${route}`);
  }
  assert.match(stylesheet, /\.b3d-obj \{[^}]*transform-style: preserve-3d/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\) \{\s*\.b3d-obj \{ transform: none !important/);
  assert.match(stylesheet, /\.cmdk-row img \{[^}]*rotateY/);
  // perspective must not be declared with container-query units on the
  // container itself: an element cannot query itself, so it would silently
  // fall back to the viewport and flatten the book.
  assert.doesNotMatch(stylesheet, /\.b3d \{[^}]*perspective:[^;}]*cqw/);
  assert.match(stylesheet, /\.b3d-frame \{[^}]*perspective: clamp\([^)]*cqw/);
});

test('the books hold up on dark stages, in print, and in the palette', () => {
  // dark stages: a black shadow on near-black loses the object, so the theme
  // deepens the shadow and swaps the dark board rim for a warm one
  assert.match(stylesheet, /:root\[data-theme='dark'\] \.b3d-shadow \{[^}]*background: radial-gradient/);
  assert.match(stylesheet, /:root\[data-theme='dark'\] \.b3d-front::after \{[^}]*inset 0 0 0 1px rgba\(255, 246, 228/);

  // print: a turned object should come out as a flat jacket
  const print = stylesheet.match(/@media print \{[\s\S]*?\.mast, #toTop[\s\S]*?\n\}/);
  assert.ok(print, 'missing print rules for the book object');
  assert.match(print[0], /\.b3d-face:not\(\.b3d-front\),[\s\S]*?display: none !important/);
  assert.match(print[0], /\.b3d-obj,?[\s\S]*?transform: none !important/);

  // the palette thumbnails must lean the same way as every other board
  assert.match(stylesheet, /\.cmdk-row img \{[^}]*rotateY\(11deg\)/);
  assert.doesNotMatch(stylesheet, /\.cmdk-row img \{[^}]*rotateY\(-/);

  // meta text has to clear AA on the tinted surfaces it sits on
  const ink3 = stylesheet.match(/--ink-3: (#[0-9a-f]{6})/i)?.[1];
  assert.ok(ink3, 'missing --ink-3 token');
  const rgb = [1, 3, 5].map((i) => parseInt(ink3.slice(i, i + 2), 16));
  const lum = ([r, g, b]) => {
    const f = (v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  for (const surface of ['#eae6dc', '#f3f0e9']) {
    const s = [1, 3, 5].map((i) => parseInt(surface.slice(i, i + 2), 16));
    const [hi, lo] = [lum(rgb), lum(s)].sort((a, b) => b - a);
    assert.ok((hi + 0.05) / (lo + 0.05) >= 4.5, `--ink-3 fails AA on ${surface}`);
  }

  // the reader guide is a primary destination, so its nav item says so
  const discover = new JSDOM(readFileSync(join(projectRoot, 'dist/discover/index.html'), 'utf8')).window.document;
  const current = discover.querySelector('.mast nav a[aria-current="page"]');
  assert.ok(current, 'the primary nav should mark the current page');
  assert.match(current.getAttribute('href'), /\/discover\/$/);
});

test('the page block is a calculated slab with a measured bleed', () => {
  // a 300-page trade paperback is 15-18% of its trim width thick; drawn any
  // thinner and the paper edge does not exist
  assert.match(stylesheet, /--th: clamp\(9px, 13cqw, 52px\)/);
  assert.match(stylesheet, /--b3d-bleed: clamp\(\.5px, \.3cqw, 2\.4px\)/);

  // the paper stands proud of the boards at the three cut edges
  assert.match(stylesheet, /\.b3d-head \{[^}]*top: calc\(-1 \* var\(--b3d-bleed\)\)/s);
  assert.match(stylesheet, /\.b3d-tail \{[^}]*bottom: calc\(-1 \* var\(--b3d-bleed\)\)/s);
  assert.match(stylesheet, /\.b3d-fore \{[^}]*right: calc\(1\.2% - var\(--b3d-bleed\)\)/s);

  // each surface is a layer stack: cut edge, board shadow, three sheet
  // periods, spine compression, paper
  const headRule = stylesheet.match(/\.b3d-head,\n\.b3d-tail \{[^}]*\}/s)[0];
  const foreRule = stylesheet.match(/\.b3d-fore \{[^}]*\}/s)[0];
  for (const [label, rule] of [['head/tail', headRule], ['fore', foreRule]]) {
    const gradients = (rule.match(/gradient\(/g) || []).length;
    assert.ok(gradients >= 6, `${label} should be a layer stack, found ${gradients} gradients`);
    assert.match(rule, /rgba\(52, 40, 26/, `the board must shadow the paper on ${label}`);
  }

  // thumbnails stay slim instead of turning into bricks
  assert.match(stylesheet, /@container \(max-width: 118px\) \{[^}]*--th: clamp\(6px, 8\.5cqw, 10px\)/s);
});

test('premium detail: tokens, text rendering, scroll state and system preferences', () => {
  // one motion vocabulary
  for (const token of ['--ease-out', '--ease-in-out', '--dur-1', '--dur-2', '--dur-3', '--dur-4', '--dur-5']) {
    assert.ok(stylesheet.includes(token + ':'), `missing motion token ${token}`);
  }
  assert.match(stylesheet, /\.b3d-obj[\s\S]{0,400}?transition: transform var\(--dur-4\) var\(--ease-out\)/);

  // text rendering
  assert.match(stylesheet, /body \{[^}]*font-kerning: normal/);
  assert.match(stylesheet, /body \{[^}]*font-optical-sizing: auto/);
  assert.match(stylesheet, /text-wrap: pretty/);

  // scroll progress costs no JavaScript and survives reduced motion
  const progress = stylesheet.slice(stylesheet.indexOf('.mast::after'));
  assert.match(progress, /@supports \(animation-timeline: scroll\(\)\)/);
  assert.match(progress, /animation-timeline: scroll\(root block\)/);
  assert.match(progress, /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}\.mast::after \{ animation-duration: auto !important/);

  // the soundtrack control states that it is playing
  assert.match(stylesheet, /#sndBtn\[aria-pressed='true'\] \{/);
  assert.match(stylesheet, /#sndBtn\[aria-pressed='true'\]::after/);

  // system preferences
  assert.match(stylesheet, /@media \(prefers-contrast: more\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-transparency: reduce\)/);

  // print: chrome goes, the jacket stays
  const print = stylesheet.match(/@media print \{[\s\S]*?\.mast, #toTop[\s\S]*?\n\}/);
  assert.ok(print, 'missing print rules');
  assert.match(print[0], /\.mast, #toTop, \.cmdk, \.modal, \.colophon/);
  assert.match(print[0], /\.book-hero, \.colophon, \.editorial-hero \{ background: #fff !important/);

  // the 36-tile catalogue skips off-screen painting without shifting layout
  assert.match(stylesheet, /\.book-tile \{[^}]*content-visibility: auto[^}]*contain-intrinsic-size: auto 240px/s);
});
