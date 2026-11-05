import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { initCatalogue } from '../src/scripts/catalogue.js';
import { setDialogOpen } from '../src/scripts/dialog.ts';
import { detectMarket, initMarkets } from '../src/scripts/market.ts';
import { initShelf, readShelf, rememberBook } from '../src/scripts/shelf.ts';
import { initFlow } from '../src/scripts/flow.ts';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const builtHtml = readFileSync(join(projectRoot, 'dist/index.html'), 'utf8');
// The site is served from a subpath (GitHub Pages project site), so internal
// links must carry the deploy base. Read it from the built canonical instead of
// hardcoding it, so the tests follow astro.config's SITE_BASE.
const BASE = new URL(builtHtml.match(/<link rel="canonical" href="([^"]+)"/)[1]).pathname.replace(/\/$/, '');
const stylesheet = readFileSync(join(projectRoot, 'src/styles/global.css'), 'utf8');
// the shelf is a memory, not an archive: it keeps the last six books
const SIX = 6;

/* the palette is checked from the tokens themselves: a copy of a hex value in
   the test would keep passing long after the stylesheet had drifted */
const tokens = (name) => [...stylesheet.matchAll(new RegExp(`--${name}: (#[0-9a-f]{6})`, 'gi'))]
  .map((match) => match[1].toLowerCase());
const channel = (value) => (value / 255 <= 0.03928 ? value / 255 / 12.92 : ((value / 255 + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const readPage = (route) => readFileSync(join(projectRoot, 'dist', route, 'index.html'), 'utf8');

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

test('the cinematic light pass has a reduced-motion fallback', () => {
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
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.book-hero-copy, \.s-hero-in/);
});

test('cinematic quote keeps readable text and a reduced-motion fallback', () => {
  const dom = new JSDOM(builtHtml);
  const heading = dom.window.document.querySelector('#ending-heading');
  assert.ok(heading, 'the intertitle needs its heading');
  assert.ok(heading.textContent.replace(/\s+/g, ' ').trim().length > 8, 'the intertitle should carry a real line');
  assert.match(heading.getAttribute('data-len'), /^(short|medium|long)$/, 'the line needs a size for its type');
  const credit = dom.window.document.querySelector('.quote-credit');
  assert.match(credit.textContent, /—/, 'the credit opens with a dash');
  assert.ok(credit.querySelector('cite'), 'the credit names the work it comes from');
  assert.match(stylesheet, /prefers-reduced-motion: reduce[\s\S]{0,400}\.closing-quote \.quote-line/);
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

test('the books hold up in print and in the palette', () => {
  // print: a turned object should come out as a flat jacket
  const print = stylesheet.match(/@media print \{[\s\S]*?\.mast, #toTop[\s\S]*?\n\}/);
  assert.ok(print, 'missing print rules for the book object');
  assert.match(print[0], /\.b3d-face:not\(\.b3d-front\),[\s\S]*?display: none !important/);
  assert.match(print[0], /\.b3d-obj,?[\s\S]*?transform: none !important/);

  // the palette thumbnails must lean the same way as every other board
  assert.match(stylesheet, /\.cmdk-row img \{[^}]*rotateY\(11deg\)/);
  assert.doesNotMatch(stylesheet, /\.cmdk-row img \{[^}]*rotateY\(-/);

  // meta text has to clear AA on every tinted surface it sits on
  const ink3 = stylesheet.match(/--ink-3: (#[0-9a-f]{6})/i)?.[1];
  assert.ok(ink3, 'missing --ink-3 token');
  // dark scopes (book hero, colophon, the intent hero) re-declare --paper as
  // ink; only the light stock has to carry dark metadata text
  const lightSurfaces = [...new Set(tokens('paper').concat(tokens('paper-2')))]
    .filter((hex) => luminance(hex) > 0.3);
  assert.ok(lightSurfaces.length >= 2, 'expected a paper and a paper-2 surface');
  for (const surface of lightSurfaces) {
    assert.ok(contrast(ink3, surface) >= 4.5, `--ink-3 fails AA on ${surface} (${contrast(ink3, surface).toFixed(2)})`);
  }

  // the reader guide is a primary destination, so its nav item says so
  const discover = new JSDOM(readFileSync(join(projectRoot, 'dist/discover/index.html'), 'utf8')).window.document;
  const current = discover.querySelector('.mast nav a[aria-current="page"]');
  assert.ok(current, 'the primary nav should mark the current page');
  assert.match(current.getAttribute('href'), /\/discover\/$/);
});

test('the page block is a calculated slab with a measured bleed', () => {
  // a 300-page trade paperback is 15-18% of its trim width thick; the ratio is
  // carried from the page count, the length resolves against the stage
  assert.match(stylesheet, /--th: clamp\(9px, calc\(var\(--b3d-ratio, \.13\) \* 100cqw\), 64px\)/);
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

/* ------------------------------------------------------------------ *
 * Cross-angle pass: outline, focus traps, theme chrome, the printed
 * sheet, landscape phones and wide displays.
 * ------------------------------------------------------------------ */

function builtPages() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name);
      if (statSync(file).isDirectory()) walk(file);
      else if (name.endsWith('.html')) out.push(file);
    }
  };
  walk(join(projectRoot, 'dist'));
  return out;
}

test('every page ships one h1, a clean outline and no hidden tab stops', () => {
  const pages = builtPages();
  assert.ok(pages.length > 40, `expected the whole archive, found ${pages.length} pages`);
  for (const file of pages) {
    const dom = new JSDOM(readFileSync(file, 'utf8'));
    const d = dom.window.document;
    const page = file.replace(join(projectRoot, 'dist'), '');

    // one h1, and never a jump of more than one level (the footer's column
    // headings used to be h4 under an h2 on all 48 pages)
    const heads = [...d.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    assert.equal(heads.filter((h) => h.tagName === 'H1').length, 1, `${page}: h1 count`);
    let previous = 0;
    for (const h of heads) {
      const level = Number(h.tagName[1]);
      assert.ok(level <= previous + 1, `${page}: ${previous} -> ${level} heading jump`);
      previous = level;
    }

    // a closed dialog must be inert, or its buttons stay in the tab order
    const dialogs = [...d.querySelectorAll('[role="dialog"]')];
    // the reading page is its own document and has no overlays; every other
    // page ships the book sheet, the palette and the Amazon hand-off
    if (page !== '/read/darya-ka-aik-hissa/index.html') {
      assert.ok(dialogs.length >= 3, `${page}: expected the three overlays`);
    }
    for (const dialog of dialogs) {
      if (dialog.getAttribute('aria-hidden') === 'true') {
        assert.ok(dialog.hasAttribute('inert'), `${page}: closed dialog is not inert`);
      }
    }

    // nothing focusable may hide inside aria-hidden without being inert
    for (const hidden of d.querySelectorAll('[aria-hidden="true"]')) {
      if (hidden.closest('[inert]')) continue;
      const stray = hidden.querySelector('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!stray || stray.closest('[inert]')) continue;
      assert.fail(`${page}: focusable ${stray.tagName} inside aria-hidden`);
    }
  }
});

test('closing a dialog removes it from the tab order and the a11y tree', () => {
  const dom = new JSDOM('<div id="sheet" class="modal" role="dialog" aria-hidden="true" inert><button>Close</button></div>');
  const el = dom.window.document.getElementById('sheet');

  setDialogOpen(el, true);
  assert.equal(el.classList.contains('open'), true);
  assert.equal(el.getAttribute('aria-hidden'), 'false');
  assert.equal(el.hasAttribute('inert'), false);

  setDialogOpen(el, false);
  assert.equal(el.classList.contains('open'), false);
  assert.equal(el.getAttribute('aria-hidden'), 'true');
  assert.equal(el.hasAttribute('inert'), true);
});

test('the site has one fixed appearance', () => {
  // no control to switch appearance, and no attribute for one to set
  assert.doesNotMatch(builtHtml, /id="themeBtn"/);
  assert.doesNotMatch(builtHtml, /data-theme=/);
  assert.doesNotMatch(builtHtml, /prefers-color-scheme/);
  assert.doesNotMatch(builtHtml, /localStorage\.getItem\('theme'\)/);

  // one palette, declared once, and a native colour scheme that matches it
  assert.match(stylesheet, /:root \{ color-scheme: light; \}/);
  assert.doesNotMatch(stylesheet, /data-theme/);
  assert.doesNotMatch(stylesheet, /prefers-color-scheme/);

  // the browser chrome still answers to the page it frames
  assert.match(builtHtml, /<meta name="theme-color" id="themeColor" content="#191713">/);
});

test('cross-angle detail: button stacking, focus, native chrome, forced colours, print, landscape, wide', () => {
  // the solid CTA's sweep paints above its own opaque background
  assert.match(stylesheet, /\.btn \{ isolation: isolate; \}/);

  // the focus ring is currentColor, which is legible on paper and on ink
  assert.match(stylesheet, /a:focus-visible,[\s\S]{0,260}outline: 2px solid currentColor/);

  // native widgets and the scrollbar gutter match the one palette
  assert.match(stylesheet, /:root \{ color-scheme: light; \}/);
  assert.match(stylesheet, /html \{ scrollbar-gutter: stable; \}/);

  // small gold text has an ink-weight variant
  assert.match(stylesheet, /--mark-deep: #7d5c14/);
  assert.match(stylesheet, /\.legal-toc h2 \{ color: var\(--mark-deep\); \}/);

  // Windows high contrast keeps the structure
  assert.match(stylesheet, /@media \(forced-colors: active\)[\s\S]{0,400}border: 1px solid ButtonText/);
  assert.match(stylesheet, /\.btn\.solid,[\s\S]{0,120}background: Highlight; color: HighlightText/);

  // the printed sheet
  assert.match(stylesheet, /@page \{ margin: 15mm 14mm; \}/);
  assert.match(stylesheet, /p, \.desc, \.legal-content \{ orphans: 3; widows: 3; \}/);
  assert.match(stylesheet, /\.book-tile,[\s\S]{0,200}break-inside: avoid/);

  // a phone held sideways keeps its vertical rhythm
  assert.match(stylesheet, /@media \(orientation: landscape\) and \(max-height: 520px\)/);

  // a display wider than the measure
  assert.match(stylesheet, /@media \(min-width: 1700px\) \{[\s\S]{0,120}--wrap: 1420px/);
});

test('the preloaded fonts are the files the stylesheet actually asks for', () => {
  const html = readFileSync(join(projectRoot, 'dist/index.html'), 'utf8');
  const preloads = [...html.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)].map((m) => m[1]);
  assert.equal(preloads.length, 2, `expected two font preloads, found ${preloads.length}`);

  const cssFiles = readdirSync(join(projectRoot, 'dist/_astro')).filter((f) => f.endsWith('.css'));
  const css = cssFiles.map((f) => readFileSync(join(projectRoot, 'dist/_astro', f), 'utf8')).join('\n');
  for (const href of preloads) {
    const file = href.split('/').pop();
    assert.ok(css.includes(file), `preloaded ${file} is not referenced by any stylesheet`);
  }
});

test('meta descriptions fit a search result', () => {
  for (const file of builtPages()) {
    const dom = new JSDOM(readFileSync(file, 'utf8'));
    const content = dom.window.document.querySelector('meta[name="description"]')?.content ?? '';
    const page = file.replace(join(projectRoot, 'dist'), '');
    assert.ok(content.length >= 50, `${page}: description is only ${content.length} chars`);
    assert.ok(content.length <= 160, `${page}: description is ${content.length} chars`);
  }
});

/* ------------------------------------------------------------------ *
 * Amazon marketplaces + the generated soundtrack.
 * ------------------------------------------------------------------ */

test('a book page lists every marketplace the title is sold in', () => {
  const dom = new JSDOM(readFileSync(join(projectRoot, 'dist/books/the-quiet-tenancy/index.html'), 'utf8'));
  const d = dom.window.document;
  const list = d.querySelector('[data-stores]');
  assert.ok(list, 'no store list on the page');

  const items = [...list.querySelectorAll('[data-market]')];
  const markets = items.map((i) => i.dataset.market).filter((id) => id !== 'paperback');
  assert.deepEqual(markets, ['us', 'uk', 'in', 'ca', 'au']);
  // a print edition, when the title has one, comes after the marketplaces
  if (items.some((i) => i.dataset.market === 'paperback')) {
    assert.equal(items[items.length - 1].dataset.market, 'paperback');
  }

  const expected = {
    us: 'amazon.com', uk: 'amazon.co.uk', in: 'amazon.in', ca: 'amazon.ca',
    au: 'amazon.com.au', paperback: 'amazon.com',
  };
  for (const item of items) {
    const link = item.querySelector('a');
    assert.ok(link, 'store item without a link');
    assert.match(link.href, /^https:\/\/www\./, 'store link must be absolute');
    assert.ok(link.href.includes(expected[item.dataset.market]), `${item.dataset.market} points at ${link.href}`);
    assert.equal(link.target, '_blank');
    assert.match(link.rel, /noopener/);
    assert.ok(link.textContent.trim().length > 5, 'store link needs a visible name');
    // the badge is server-rendered but hidden until the browser knows the region
    const badge = item.querySelector('[data-local-badge]');
    assert.ok(badge && badge.hasAttribute('hidden'), 'local badge should start hidden');
  }

  // one buy button, pre-loaded with every marketplace for market.ts to switch
  const buy = d.querySelector('[data-buy]');
  assert.ok(buy, 'missing the adaptive buy button');
  for (const market of ['us', 'uk', 'in', 'ca', 'au']) {
    assert.ok(buy.dataset[`${market}`], `buy button has no ${market} target`);
  }
});

test('every page carries the full marketplace list in the colophon', () => {
  for (const file of builtPages()) {
    const page = file.replace(join(projectRoot, 'dist'), '');
    if (page.startsWith('/read/')) continue; // the reader is its own document
    const dom = new JSDOM(readFileSync(file, 'utf8'));
    const nav = dom.window.document.querySelector('nav[aria-label="Amazon marketplaces"]');
    assert.ok(nav, `${page}: no marketplace list`);
    const links = [...nav.querySelectorAll('a')];
    assert.equal(links.length, 5, `${page}: expected five marketplaces, found ${links.length}`);
    for (const link of links) {
      assert.match(link.href, /^https:\/\/www\.amazon\./, `${page}: ${link.href}`);
      assert.match(link.rel, /noopener/);
    }
  }
});

test('the visitor\u2019s own Amazon store is detected from the language tags', () => {
  assert.equal(detectMarket(['en-GB']), 'uk');
  assert.equal(detectMarket(['hi-IN']), 'in');
  assert.equal(detectMarket(['en_US']), 'us');       // underscore form
  assert.equal(detectMarket(['en-AU', 'en']), 'au');
  assert.equal(detectMarket(['en-CA']), 'ca');
  assert.equal(detectMarket(['fr-FR']), null);        // no Amazon store of ours
  assert.equal(detectMarket([]), null);
});

test('the local store is promoted, badged and retargets the buy button', () => {
  const dom = new JSDOM(`
    <body>
      <ul data-stores>
        <li data-market="us"><a href="https://www.amazon.com/dp/X"><span data-local-badge hidden>Your store</span></a></li>
        <li data-market="in"><a href="https://www.amazon.in/dp/X"><span data-local-badge hidden>Your store</span></a></li>
      </ul>
      <a data-buy data-us="https://www.amazon.com/dp/X" data-in="https://www.amazon.in/dp/X"
         data-in-label="Buy on Amazon.in"><span data-buy-label>Buy on Amazon.com</span></a>
    </body>`);
  const d = dom.window.document;
  const market = initMarkets(d, ['en-IN']);

  assert.equal(market, 'in');
  assert.equal(d.documentElement.dataset.market, 'in');

  const first = d.querySelector('[data-stores] [data-market]');
  assert.equal(first.dataset.market, 'in', 'the local store should lead the list');
  assert.ok(first.classList.contains('is-local'));
  assert.equal(first.querySelector('[data-local-badge]').hasAttribute('hidden'), false);

  const buy = d.querySelector('[data-buy]');
  assert.equal(buy.getAttribute('href'), 'https://www.amazon.in/dp/X');
  assert.equal(buy.textContent.trim(), 'Buy on Amazon.in');
});

test('the soundtrack is ours, generated, and light enough to stream', () => {
  const audio = readFileSync(join(projectRoot, 'public/sama.mp3'));
  assert.ok(audio.length > 1_500_000, `soundtrack is only ${audio.length} bytes`);
  assert.ok(audio.length < 3_200_000, `soundtrack is ${audio.length} bytes — too heavy`);
  // an MPEG frame or an ID3 tag, not an HTML error page
  assert.ok(audio[0] === 0x49 || audio[0] === 0xff, 'public/sama.mp3 is not an MP3');

  // the generator is in the repo, so the asset can be rebuilt from source
  const generator = readFileSync(join(projectRoot, 'scripts/audio/sama.py'), 'utf8');
  assert.match(generator, /numpy/);
  assert.match(generator, /lameenc/);
  assert.match(generator, /public.*sama\.mp3/s);

  // cache-busted, so returning visitors get the new bed rather than the old one
  assert.match(builtHtml, /sama\.mp3\?v=2/);
});

/* ---------- the shelf: the site remembering where your attention was ---------- */

function shelfStorage(entries) {
  const store = new Map();
  if (entries) store.set('si_shelf', JSON.stringify(entries));
  return {
    store,
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
  };
}

const sampleShelf = [
  { slug: 'the-quiet-tenancy', title: 'The Quiet Tenancy', img: 'https://example.test/a.jpg', ts: 1710000000000 },
  { slug: 'darya-ka-aik-hissa', title: 'Darya Ka Aik Hissa', img: 'https://example.test/b.jpg', ts: 1700000000000 },
];

test('the shelf replays the books you opened, in this browser only', () => {
  const dom = new JSDOM(builtHtml, { url: 'https://sufi-ilham.test/sufi-ilham/', pretendToBeVisual: true });
  const d = dom.window.document;
  const storage = shelfStorage(sampleShelf);

  // before the script runs the section is in the document but out of sight
  assert.equal(d.getElementById('myShelf').hidden, true);
  assert.equal(d.getElementById('myShelfRail').children.length, 0);

  initShelf(d, storage);

  const section = d.getElementById('myShelf');
  const rail = d.getElementById('myShelfRail');
  assert.equal(section.hidden, false, 'a non-empty shelf should reveal itself');
  assert.equal(rail.children.length, 2);
  assert.equal(d.documentElement.dataset.shelf, '2');

  const links = [...rail.querySelectorAll('a')];
  assert.equal(links[0].getAttribute('href'), `${BASE}/books/the-quiet-tenancy/`);
  assert.equal(links[1].getAttribute('href'), `${BASE}/books/darya-ka-aik-hissa/`);
  assert.match(links[0].querySelector('img').getAttribute('src'), /example\.test\/a\.jpg$/);
  assert.match(links[0].textContent, /The Quiet Tenancy/);

  // and it can be forgotten on request
  d.getElementById('myShelfClear').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  assert.equal(rail.children.length, 0);
  assert.equal(section.hidden, true);
  assert.equal(storage.getItem('si_shelf'), null);
  assert.equal(d.documentElement.dataset.shelf, undefined);
});

test('a book page records itself, newest first, at most six deep', () => {
  const book = new JSDOM(readFileSync(join(projectRoot, 'dist/books/the-quiet-tenancy/index.html'), 'utf8'), {
    url: 'https://sufi-ilham.test/sufi-ilham/books/the-quiet-tenancy/',
  });
  const storage = shelfStorage();
  initShelf(book.window.document, storage);

  const recorded = JSON.parse(storage.getItem('si_shelf'));
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].slug, 'the-quiet-tenancy');
  assert.ok(recorded[0].title.length > 3, 'a shelf entry needs its title to be readable');
  assert.match(recorded[0].img, /^https:\/\//);
  assert.equal(typeof recorded[0].ts, 'number');

  // re-opening a book moves it to the front instead of duplicating it
  initShelf(book.window.document, storage);
  assert.equal(JSON.parse(storage.getItem('si_shelf')).length, 1);

  // the rail is a memory, not an archive
  for (let i = 0; i < 9; i += 1) {
    rememberBook(storage, { slug: `book-${i}`, title: `Book ${i}`, img: '' }, 1720000000000 + i);
  }
  const shelf = readShelf(storage);
  assert.equal(shelf.length, SIX);
  assert.equal(shelf[0].slug, 'book-8');
  assert.equal(shelf.at(-1).slug, 'book-3');
});

test('a broken, blocked or hostile shelf never breaks a page', () => {
  const home = new JSDOM(builtHtml, { url: 'https://sufi-ilham.test/sufi-ilham/' });

  // unreadable storage
  const junk = { getItem: () => '{not json', setItem: () => {}, removeItem: () => {} };
  assert.deepEqual(readShelf(junk), []);
  initShelf(home.window.document, junk);
  assert.equal(home.window.document.getElementById('myShelf').hidden, true);

  // entries that are not books, or that would inject a path
  const hostile = {
    getItem: () => JSON.stringify([
      null,
      { slug: '../../etc/passwd', title: 'nope', ts: 1 },
      { slug: 'fine-book', title: 'Fine Book', ts: 2 },
    ]),
    setItem: () => {},
    removeItem: () => {},
  };
  assert.deepEqual(readShelf(hostile).map((item) => item.slug), ['fine-book']);

  // storage that refuses to write (private mode, full quota)
  const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => {} };
  const book = new JSDOM(readFileSync(join(projectRoot, 'dist/books/the-quiet-tenancy/index.html'), 'utf8'));
  assert.doesNotThrow(() => initShelf(book.window.document, full));

  // and no JavaScript at all leaves the rail hidden and empty
  assert.match(builtHtml, /<section class="my-shelf" id="myShelf"[^>]*hidden/);
  assert.match(builtHtml, /<ul class="my-shelf-rail" id="myShelfRail"><\/ul>/);
});

test('the floating buy bar mirrors the hero action and starts out of the way', () => {
  const dom = new JSDOM(readFileSync(join(projectRoot, 'dist/books/the-quiet-tenancy/index.html'), 'utf8'));
  const d = dom.window.document;
  const bar = d.getElementById('buyBar');
  assert.ok(bar, 'no floating buy bar on a book page');

  // off-screen until the hero action scrolls away, and untouchable while it is
  assert.ok(bar.hasAttribute('inert'));
  assert.equal(bar.getAttribute('aria-hidden'), 'true');
  assert.ok(bar.querySelector('img.buy-bar-cover'));
  assert.match(bar.querySelector('.buy-bar-title').textContent, /./);

  const hero = d.querySelector('.book-hero-actions [data-buy]');
  const cta = bar.querySelector('[data-buy]');
  assert.ok(hero && cta, 'both the hero and the bar need a buy action');
  assert.equal(cta.getAttribute('href'), hero.getAttribute('href'));
  assert.equal(cta.target, '_blank');
  assert.match(cta.rel, /noopener/);
  for (const market of ['us', 'uk', 'in', 'ca', 'au']) {
    assert.equal(cta.dataset[market], hero.dataset[market], `the bar drops the ${market} store`);
    assert.ok(cta.dataset[`${market}Label`], `the bar cannot relabel the ${market} store`);
  }
  assert.ok(bar.querySelector('[data-buy-label]'), 'the bar needs a relabelling hook for market.ts');

  // it only exists on phones, and only once the hero has gone by
  assert.match(stylesheet, /@media \(max-width: 900px\) \{ \.buy-bar \{ display: block; \} \}/);
  assert.match(stylesheet, /\.buy-bar \{\s*position: fixed;\s*inset: auto 0 0;/);
  assert.match(stylesheet, /\.buy-bar\.show \{ transform: none; \}/);
});

test('the phone layout keeps clear of notches, and the catalogue stays browsable', () => {
  // the viewport may reach under the notch and the home indicator
  assert.match(builtHtml, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
  assert.match(stylesheet, /env\(safe-area-inset-bottom/);
  assert.match(stylesheet, /env\(safe-area-inset-top/);
  assert.match(stylesheet, /env\(safe-area-inset-right/);

  // two books per row on a phone, with the cover on top instead of one wide tile
  assert.match(
    stylesheet,
    /@media \(max-width: 560px\) \{\s*\.catalog-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: \.5rem; \}/,
  );
  assert.match(stylesheet, /\.book-tile \{\s*grid-template-columns: minmax\(0, 1fr\);\s*grid-template-rows: auto auto;/);

  // thumb-sized targets in the masthead
  assert.match(stylesheet, /\.mast \.mini, \.seek \{ width: 44px; height: 44px; min-width: 44px; \}/);
});

test('the paper sections sit in one continuous field instead of on separate sheets', () => {
  assert.match(stylesheet, /main \{\s*background-color: var\(--paper\);\s*background-image:/);
  assert.match(stylesheet, /@media \(min-width: 780px\) \{\s*main \{ background-attachment: fixed, fixed, fixed; \}/);
  // the reading area no longer repaints the page on top of it
  assert.match(stylesheet, /\.book-content \{ background: transparent; \}/);
  // and a reader who asks for more contrast gets flat paper, not a wash
  assert.match(stylesheet, /@media \(prefers-contrast: more\) \{\s*main \{ background-image: none; \}/);
});

test('cinematic scene blends add colour without consuming layout space', () => {
  const home = new JSDOM(builtHtml);
  const { document } = home.window;
  const blendBefore = (selector) => {
    const blend = document.querySelector(selector).previousElementSibling;
    assert.ok(blend?.hasAttribute('data-flow-blend'), `${selector}: expected an overlapping colour blend`);
    return blend;
  };
  assert.equal(document.querySelector('#new').nextElementSibling, blendBefore('#shelf'));
  assert.equal(blendBefore('#shelf').dataset.to, 'paper-2', 'the blend lands on the exact contact-sheet colour');
  assert.equal(document.querySelector('#essay').nextElementSibling, blendBefore('#figures'));
  assert.equal(document.querySelector('#figures').nextElementSibling, blendBefore('#ending'));
  assert.equal(document.querySelector('#ending').nextElementSibling, blendBefore('#enquiries'));
  close(home);

  for (const [route, expected] of Object.entries({
    '': 8,
    'books/the-ninth-bell': 2,
    'series/maple': 2,
    contact: 2,
    privacy: 2,
    terms: 2,
    discover: 3,
  })) {
    const dom = new JSDOM(route ? readPage(route) : builtHtml);
    const page = dom.window.document;
    assert.equal(page.querySelectorAll('[data-tone-melt], .tone-melt').length, 0, `${route || 'home'}: no old empty melt bands`);
    const blends = [...page.querySelectorAll('[data-flow-blend]')];
    assert.equal(blends.length, expected, `${route || 'home'}: complete scene coverage`);
    assert.ok(blends.every((blend) => blend.getAttribute('aria-hidden') === 'true' && blend.style.getPropertyValue('--blend-to')));
    const hud = page.getElementById('flowHud');
    assert.ok(hud, `${route || 'home'}: one fixed flow readout`);
    assert.equal(hud.getAttribute('aria-hidden'), 'true');
    assert.equal(hud.querySelectorAll('a, button, input, [tabindex]').length, 0, 'decoration adds no tab stops');
    close(dom);
  }
  assert.doesNotMatch(stylesheet, /\.tone-melt/);
  assert.match(stylesheet, /\.flow-hud \{\s*position: fixed;/);
  assert.match(stylesheet, /\.flow-blend \{[^}]*block-size: 0;/);
  assert.match(stylesheet, /\.flow-blend::before,\s*\.flow-blend::after \{[^}]*position: absolute;/);
  assert.match(stylesheet, /\.flow-blend::before \{[^}]*linear-gradient\(180deg,/);
  assert.match(stylesheet, /@media \(min-width: 1280px\).*prefers-reduced-motion: no-preference/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\) \{\s*\.flow-hud/);
});

test('the flow readout follows real scenes and ordinary scroll position', async () => {
  const chrome = new JSDOM(builtHtml);
  const hudMarkup = chrome.window.document.getElementById('flowHud').outerHTML;
  close(chrome);
  const dom = new JSDOM(`<body>${hudMarkup}<main>
    <section class="editorial-hero"><h1>Opening</h1></section>
    <span class="flow-blend" data-flow-blend aria-hidden="true"></span>
    <section><h2>Second scene</h2></section>
    <section class="closing-quote"><h2>Last light</h2></section>
  </main><footer class="colophon" data-flow-label="Colophon"></footer>`, {
    url: 'https://sufi-ilham.test/sufi-ilham/',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const { document } = window;
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 2400 });
  window.scrollTo = () => { throw new Error('the flow interface must never scroll the page'); };

  const sections = [...document.querySelectorAll('main > section')];
  const boxes = [
    { top: 0, bottom: 800 },
    { top: 800, bottom: 1600 },
    { top: 1600, bottom: 2400 },
  ];
  sections.forEach((section, index) => {
    section.getBoundingClientRect = () => ({
      ...boxes[index], left: 0, right: 1000, width: 1000,
      height: boxes[index].bottom - boxes[index].top, x: 0, y: boxes[index].top,
    });
  });
  document.querySelector('.colophon').getBoundingClientRect = () => ({
    top: 2400, bottom: 2800, left: 0, right: 1000, width: 1000, height: 400, x: 0, y: 2400,
  });
  let blendTop = 700;
  const blend = document.querySelector('[data-flow-blend]');
  blend.getBoundingClientRect = () => ({
    top: blendTop, bottom: blendTop, left: 0, right: 1000, width: 1000, height: 0, x: 0, y: blendTop,
  });

  const stop = initFlow(document, window);
  const hud = document.getElementById('flowHud');
  assert.equal(hud.querySelector('[data-flow-total]').textContent, '04');
  assert.equal(hud.querySelector('[data-flow-current]').textContent, '01');
  assert.equal(hud.querySelector('[data-flow-label]').textContent, 'Opening');
  assert.equal(hud.dataset.tone, 'ink');
  assert.ok(sections[0].classList.contains('is-flow-current'));
  assert.equal(blend.style.getPropertyValue('--blend-p'), '0.174');

  boxes[0] = { top: -1000, bottom: -200 };
  boxes[1] = { top: -200, bottom: 600 };
  boxes[2] = { top: 600, bottom: 1400 };
  blendTop = 400;
  window.scrollY = 600;
  window.dispatchEvent(new window.Event('scroll'));
  await new Promise((resolve) => setTimeout(resolve, 40));

  assert.equal(hud.querySelector('[data-flow-current]').textContent, '02');
  assert.equal(hud.querySelector('[data-flow-label]').textContent, 'Second scene');
  assert.equal(hud.dataset.tone, 'paper');
  assert.equal(hud.style.getPropertyValue('--flow-p'), '0.3750');
  assert.equal(blend.style.getPropertyValue('--blend-p'), '0.694');
  assert.ok(Number(blend.style.getPropertyValue('--blend-o')) > 0.4, 'the warm reflection responds to scrolling');
  assert.ok(sections[1].classList.contains('is-flow-current'));
  assert.ok(!sections[0].classList.contains('is-flow-current'));
  assert.equal(window.scrollY, 600);
  stop();
  close(dom);
});

test('the privacy page lists the shelf and no longer promises a theme', () => {
  const privacy = new JSDOM(readPage('privacy')).window.document;
  const storage = [...privacy.querySelectorAll('code')].map((code) => code.textContent);
  assert.ok(storage.includes('si_shelf'), 'the shelf must be disclosed');
  assert.ok(storage.includes('si_music'), 'the soundtrack choice must stay disclosed');
  assert.ok(!storage.includes('theme'), 'nothing stores a theme any more');
  assert.match(privacy.body.textContent, /this browser/i);
});

test('the shelf shows how far into a book you got, and the reader remembers the place', () => {
  const dom = new JSDOM(builtHtml, { url: 'https://sufi-ilham.test/sufi-ilham/', pretendToBeVisual: true });
  const d = dom.window.document;
  const storage = shelfStorage([
    ...sampleShelf,
    { slug: 'a-recipe-for-maple-falls', title: 'A Recipe for Maple Falls', img: '', ts: 1690000000000 },
  ]);
  storage.setItem('reader:the-quiet-tenancy', JSON.stringify({ y: 2100, p: 0.42 }));
  // an older visit stored a bare pixel offset: no page progress to show
  storage.setItem('reader:darya-ka-aik-hissa', '1840');

  initShelf(d, storage);

  const [started, legacy] = [...d.querySelectorAll('#myShelfRail a')];
  const meter = started.querySelector('.my-shelf-progress');
  assert.ok(meter, 'a started book should carry its progress');
  assert.equal(meter.style.getPropertyValue('--p'), '0.42');
  assert.equal(meter.getAttribute('aria-label'), 'Read 42%');
  assert.match(started.textContent, /42% read/);
  assert.equal(legacy.querySelector('.my-shelf-progress'), null, 'a bare scroll offset is not progress');

  // the reader saves both the place and the fraction, and still reads older values
  const reader = readFileSync(join(projectRoot, 'dist/read/darya-ka-aik-hissa/index.html'), 'utf8');
  assert.match(reader, /localStorage\.setItem\(K, JSON\.stringify\(\{ y: Math\.round\(window\.scrollY\), p: Math\.round\(p \* 1000\) \/ 1000 \}\)\)/);
  assert.match(reader, /function savedPosition\(\)/);
  assert.match(reader, /raw\.charAt\(0\) === '\{'/);
  assert.doesNotMatch(reader, /parseInt\(localStorage\.getItem\(K\)/, 'every restore must go through savedPosition');
});

test('the PDF reader restores its saved place after the first progress write and asynchronous load', async () => {
  const reader = readFileSync(join(projectRoot, 'dist/read/darya-ka-aik-hissa/index.html'), 'utf8');
  const dom = new JSDOM(reader, {
    url: 'https://sufi-ilham.test/sufi-ilham/read/darya-ka-aik-hissa/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.localStorage.setItem('reader:darya-ka-aik-hissa', JSON.stringify({ y: 1840, p: 0.42 }));

  const frames = [];
  const scrolls = [];
  window.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  window.cancelAnimationFrame = () => {};
  window.scrollTo = (...args) => { scrolls.push(args); };
  window.scrollBy = () => {};
  // The viewer's memory timer is irrelevant here; do not keep the test alive.
  window.setInterval = () => 1;
  window.clearInterval = () => {};
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.__pdfLib = {
    GlobalWorkerOptions: {},
    getDocument: () => ({ promise: Promise.resolve({
      numPages: 1,
      getPage: () => Promise.resolve({
        getViewport: ({ scale }) => ({ width: 600 * scale, height: 900 * scale }),
      }),
    }) }),
  };

  const inline = [...window.document.scripts].find((script) => script.textContent.includes("var K = 'reader:'"));
  assert.ok(inline, 'the generated reader must include its inline controller');
  // JSDOM does not load browser modules. Substitute only the PDF.js import;
  // the real controller, storage writes and asynchronous sequencing still run.
  const dynamicImport = "var lib = await import(wrap.getAttribute('data-lib'));";
  assert.ok(inline.textContent.includes(dynamicImport));
  window.eval(inline.textContent.replace(dynamicImport, 'var lib = window.__pdfLib;'));
  await new Promise((resolve) => setTimeout(resolve, 20));
  for (const callback of frames.splice(0)) callback(0);

  assert.ok(scrolls.some(([, y]) => y === 1840), 'the pre-load scroll position must survive the initial zero-progress write');
  assert.equal(window.document.querySelectorAll('.rpage').length, 1);
  close(dom);
});

test('the paper is one stock, deep enough never to read as a white page', () => {
  // every light scope agrees on the same stock: no page may quietly pick its own
  const light = [...new Set(tokens('paper'))].filter((hex) => luminance(hex) > 0.3);
  assert.equal(light.length, 1, `--paper is declared as ${light.join(', ')}`);
  assert.ok(luminance(light[0]) < 0.8, `--paper ${light[0]} still reads as white`);

  const secondShade = [...new Set(tokens('paper-2'))].filter((hex) => luminance(hex) > 0.3);
  assert.equal(secondShade.length, 1, `--paper-2 is declared as ${secondShade.join(', ')}`);
  assert.ok(luminance(secondShade[0]) < luminance(light[0]), 'paper-2 should sit below paper');

  // nothing paints a white sheet any more; the PDF canvas and print are exempt
  const withoutPrint = stylesheet.replace(/@media print \{[\s\S]*?\n\}/g, '');
  const withoutPdfCanvas = withoutPrint.replace(/\.pdfjs-page \{[^}]*\}/g, '');
  assert.doesNotMatch(withoutPdfCanvas, /background(?:-color)?:\s*(#fff|#ffffff|white)\b/i);
  assert.doesNotMatch(stylesheet, /--paper: #f7f2e9/i);
  assert.doesNotMatch(stylesheet, /--paper-2: #eae6dc/i);

  // the field is lamplight on paper — warm, fixed — not a lighter rectangle
  assert.match(stylesheet, /radial-gradient\(78% 44% at 50% -8%, rgba\(255, 243, 218/);
  assert.match(stylesheet, /main::after \{[\s\S]{0,400}?radial-gradient\(125% 105% at 50% 42%, transparent 52%/);
});

test('nothing on the site is a card sitting on a page', () => {
  // panels are separated by tone and light, not by outlines that say "card"
  assert.match(
    stylesheet,
    /\.book-tile,\s*\.catalog-controls,\s*\.book-brief,\s*\.edition-section,\s*\.book-reader \{ border-color: transparent; \}/,
  );

  // the two parchment acts dissolve out of the field instead of starting at an edge
  assert.match(
    stylesheet,
    /\.home-discovery,\s*\.next-chapter \{[\s\S]{0,200}?linear-gradient\(180deg,\s*var\(--paper\) 0,\s*#dccaa8 11%,\s*#dccaa8 89%,\s*var\(--paper\) 100%\)/,
  );
});

/* ---------- the reading room's wall ---------- */

test('the wall is sourced, unique and deterministic', async () => {
  const { QUOTES, quoteFor, sizeFor, seedFrom, QUOTE_COUNT } = await import('../src/data/quotes.ts');

  assert.ok(QUOTE_COUNT >= 350, `the wall holds ${QUOTE_COUNT} lines`);
  assert.equal(QUOTES.length, QUOTE_COUNT);

  const normalised = new Set();
  for (const quote of QUOTES) {
    assert.ok(quote.text.trim().length > 8, `too short: ${quote.text}`);
    assert.ok(quote.author.trim().length > 2, `no author: ${quote.text}`);
    assert.ok(quote.source.trim().length > 2, `no source: ${quote.text}`);
    // the interface sets the opening mark; a line may still quote someone within
    assert.doesNotMatch(quote.text, /^[“"']/, `opens with its own quote mark: ${quote.text}`);
    assert.doesNotMatch(quote.text, /\s{2,}/, `double space: ${quote.text}`);
    const key = quote.text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    assert.ok(!normalised.has(key), `duplicate line: ${quote.text}`);
    normalised.add(key);
  }

  // a translation names its translator, so a line can be traced to a page
  const translated = QUOTES.filter((item) => /trans\./.test(item.source));
  assert.ok(translated.length > 40, `only ${translated.length} translated sources name a translator`);

  // one page, one line — stable across builds, and not the same everywhere
  assert.equal(quoteFor('/').text, quoteFor('/').text);
  assert.equal(seedFrom('/'), seedFrom('/'));
  const routes = ['/', '/books/a-recipe-for-maple-falls', '/discover', '/privacy', '/contact', '/series/carto'];
  const picked = new Set(routes.map((route) => quoteFor(route).text));
  assert.ok(picked.size >= 4, 'routes should not all open on the same line');

  // type size follows length
  assert.equal(sizeFor('short line'), 'short');
  assert.equal(sizeFor('x'.repeat(120)), 'medium');
  assert.equal(sizeFor('x'.repeat(200)), 'long');
});

test('every page carries a line, and the deck is served as one file', async () => {
  const { quoteFor, QUOTE_COUNT } = await import('../src/data/quotes.ts');
  const deck = JSON.parse(readFileSync(join(projectRoot, 'dist/quotes.json'), 'utf8'));
  assert.equal(deck.length, QUOTE_COUNT);
  for (const item of deck.slice(0, 20)) {
    assert.deepEqual(Object.keys(item).sort(), ['author', 'source', 'text']);
  }

  // the intertitle on the home page is a stage, with its own line in the HTML
  const home = new JSDOM(builtHtml).window.document;
  const stage = home.querySelector('[data-quote-stage].closing-quote');
  assert.ok(stage, 'missing the intertitle stage');
  assert.equal(stage.dataset.quoteFeed, `${BASE}/quotes.json`);
  assert.equal(stage.querySelector('[data-quote-text]').textContent.trim(), quoteFor('/ending').text);
  assert.match(stage.querySelector('[data-quote-credit]').textContent, /—\s/);
  assert.ok(stage.querySelector('[data-quote-credit] cite'), 'the credit must name its source');
  assert.ok(stage.querySelector('[data-quote-next]'), 'the stage needs a deliberate turn');

  // and every page carries the quiet copy in the colophon
  for (const file of builtPages()) {
    const page = file.replace(join(projectRoot, 'dist'), '');
    if (page.startsWith('/read/')) continue; // the reader is its own document
    const doc = new JSDOM(readFileSync(file, 'utf8')).window.document;
    const quiet = doc.querySelectorAll('footer [data-quote-stage]');
    assert.equal(quiet.length, 1, `${page}: expected one footer line, found ${quiet.length}`);
    assert.ok(quiet[0].querySelector('[data-quote-text]').textContent.trim().length > 8, `${page}: empty line`);
  }
});

test('the wall turns on its own, and on request', async () => {
  const { initQuotes } = await import('../src/scripts/quotes.ts');
  const { QUOTES } = await import('../src/data/quotes.ts');

  const dom = new JSDOM(builtHtml, { url: 'https://sufi-ilham.test/sufi-ilham/', pretendToBeVisual: true });
  const d = dom.window.document;

  // instant swaps, no pending transitions in a headless document
  dom.window.matchMedia = () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {} });
  let served = 0;
  dom.window.fetch = async () => {
    served += 1;
    return { ok: true, json: async () => QUOTES };
  };

  const stage = d.querySelector('[data-quote-stage].closing-quote');
  const before = stage.querySelector('[data-quote-text]').textContent.trim();

  const stop = initQuotes(d);
  await new Promise((resolve) => setTimeout(resolve, 50));

  const text = stage.querySelector('[data-quote-text]');
  assert.equal(served, 1, 'the deck should be fetched once');
  assert.notEqual(text.textContent.trim(), before, 'the page should open on a line of its own');
  assert.ok(['short', 'medium', 'long'].includes(text.dataset.len), 'the stage needs a length for its type');
  assert.match(stage.querySelector('[data-quote-credit] cite').textContent, /\S/);

  // the deliberate turn
  const turned = text.textContent.trim();
  stage.querySelector('[data-quote-next]').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  assert.notEqual(text.textContent.trim(), turned, 'the button should deal another line');

  // and it can be put back to sleep without leaving a timer behind
  stop();
});

test('the overture puts the archive at the scale of a sky', () => {
  // the catalogue as the build reads it (site.ts imports the JSON straight)
  const catalogue = JSON.parse(readFileSync(join(projectRoot, 'src/data/books.json'), 'utf8'));
  const publishedBooks = catalogue.filter((book) => !book.comingSoon);
  const printedPages = publishedBooks.map((book) => book.pages)
    .filter((pages) => Number.isFinite(pages))
    .reduce((total, pages) => total + pages, 0);
  const home = new JSDOM(builtHtml).window.document;
  const cosmos = home.querySelector('#cosmos');
  assert.ok(cosmos, 'the home page needs its overture');
  assert.equal(cosmos.getAttribute('aria-labelledby'), 'cosmos-title');
  assert.ok(home.getElementById('cosmos-title').textContent.trim().length > 5);

  // a constellation the HTML carries, not a photograph it downloads
  const stars = [...cosmos.querySelectorAll('.cosmos-star')];
  assert.ok(stars.length >= 100, `only ${stars.length} stars`);
  assert.ok(cosmos.querySelector('.cosmos-sky').getAttribute('aria-hidden') === 'true', 'the sky is decoration');
  for (const star of stars.slice(0, 8)) {
    assert.match(star.getAttribute('style'), /left:[\d.]+%;top:[\d.]+%;width:[\d.]+px/, 'each star is placed inline');
  }
  // the same constellation every build
  const again = new JSDOM(readFileSync(join(projectRoot, 'dist/index.html'), 'utf8')).window.document;
  assert.deepEqual(
    [...again.querySelectorAll('.cosmos-star')].map((s) => s.getAttribute('style')),
    stars.map((s) => s.getAttribute('style')),
  );

  // the numbers are the catalogue's own, not decoration
  const figures = [...cosmos.querySelectorAll('.cosmos-figures dd')].map((dd) => dd.textContent.trim());
  assert.deepEqual(figures, [
    String(catalogue.length),
    printedPages.toLocaleString('en-GB'),
    String(new Set(catalogue.map((book) => book.series).filter(Boolean)).size),
  ]);
  assert.equal(figures[0], '36');
  assert.equal(figures[1], '6,071');
  assert.match(cosmos.querySelector('.cosmos-caption').textContent, /2024–2026/);

  // and the sky is a sky: horizon, drift, breath — all removable
  assert.match(stylesheet, /\.cosmos-horizon \{[\s\S]{0,400}?border-radius: 50%/);
  assert.match(stylesheet, /@keyframes cosmos-drift/);
  assert.match(stylesheet, /@keyframes cosmos-breath/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\) \{\s*\.cosmos-star \{ animation: none; \}/);
  assert.match(stylesheet, /\.editorial-hero h1 \{ font-size: clamp\(7rem, 12\.4vw, 16rem\)/);
});

/* ---------- the cut between pages ---------- */

test('the site decides what a page change is, and covers it', async () => {
  const { isInternalNavigation, initCurtain } = await import('../src/scripts/transition.ts');
  const here = { origin: 'https://sufi-ilham.test', pathname: '/sufi-ilham/books/x/', search: '' };
  const link = (href, extra = {}) => ({
    href, hasAttribute: (name) => name in extra, target: extra.target ?? null,
  });

  assert.equal(isInternalNavigation(link('https://sufi-ilham.test/sufi-ilham/discover/'), here), true);
  assert.equal(isInternalNavigation(link('/sufi-ilham/privacy/'), here), true);
  // a jump inside the page is not a page change
  assert.equal(isInternalNavigation(link('#editions'), here), false);
  assert.equal(isInternalNavigation(link('/sufi-ilham/books/x/#editions'), here), false);
  // nor is clicking the page you are already on
  assert.equal(isInternalNavigation(link('/sufi-ilham/books/x/'), here), false);
  // nor anything leaving the site, opening a tab, downloading, or telephoning
  assert.equal(isInternalNavigation(link('https://www.amazon.co.uk/dp/X'), here), false);
  assert.equal(isInternalNavigation(link('https://sufi-ilham.test/sufi-ilham/discover/', { target: '_blank' }), here), false);
  assert.equal(isInternalNavigation(link('/sufi-ilham/reads/x.pdf', { download: '' }), here), false);
  assert.equal(isInternalNavigation(link('mailto:hello@example.com'), here), false);
  assert.equal(isInternalNavigation(link('tel:+440000000000'), here), false);

  // and the curtain itself: raised on a real page change, never twice
  const dom = new JSDOM('<body><div id="veil"></div><a id="go" href="/sufi-ilham/discover/">Discover</a></body>', {
    url: 'https://sufi-ilham.test/sufi-ilham/',
    pretendToBeVisual: true,
  });
  const d = dom.window.document;
  const veil = d.getElementById('veil');
  const navigations = [];
  const stop = initCurtain(d, { navigate: (href) => navigations.push(href) });

  const click = (el, init = {}) => {
    const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
    el.dispatchEvent(event);
    return event;
  };

  const event = click(d.getElementById('go'));
  assert.equal(event.defaultPrevented, true, 'a page change should be taken over by the curtain');
  assert.ok(veil.classList.contains('is-on'), 'the curtain should be down');

  // a second click while leaving must not queue a second navigation
  click(d.getElementById('go'));
  veil.dispatchEvent(new dom.window.Event('transitionend'));
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.deepEqual(navigations, ['https://sufi-ilham.test/sufi-ilham/discover/']);

  // a modified click belongs to the browser
  veil.classList.remove('is-on');
  dom.window.location.href = 'https://sufi-ilham.test/sufi-ilham/';
  const modified = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true });
  d.getElementById('go').dispatchEvent(modified);
  assert.equal(modified.defaultPrevented, false);
  stop();
});

test('every page ships the curtain, and it can be lifted', () => {
  for (const file of builtPages()) {
    const page = file.replace(join(projectRoot, 'dist'), '');
    if (page.startsWith('/read/')) continue;
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<div class="veil" id="veil" aria-hidden="true"><\/div>/, `${page}: missing the curtain`);
    assert.match(html, /<div class="aperture" aria-hidden="true"><\/div>/, `${page}: missing the aperture`);
  }
  assert.match(stylesheet, /\.veil \{[\s\S]{0,200}?z-index: 880;/);
  assert.match(stylesheet, /\.veil\.is-on \{ opacity: 1; \}/);
  // the curtain and the aperture must be the same colour, or the handover shows
  assert.match(stylesheet, /\.veil \{[^}]*background: #14110d;/);
  assert.match(stylesheet, /\.aperture \{[^}]*background: #14110d;/);
  assert.match(stylesheet, /html:not\(\.js\) \.veil \{ display: none; \}/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\) \{ \.veil \{ display: none; \} \}/);
});

/* ---------- the author's two frames ---------- */

test('the author plate is one frame holding two ages, cut by a seam you move', () => {
  const page = new JSDOM(readFileSync(join(projectRoot, 'dist/index.html'), 'utf8')).window.document;

  const portrait = page.querySelector('.author-main');
  assert.ok(portrait, 'the main portrait plate should still be there');
  assert.ok(portrait.querySelector('.plate-img img'), 'the portrait sits in its own clipped frame');

  const seam = page.querySelector('[data-seam]');
  assert.ok(seam, 'the then/now frame should exist');
  const frame = seam.querySelector('.seam-frame');
  const images = Array.from(frame.querySelectorAll('img'));
  assert.equal(images.length, 2, 'two photographs share one frame');
  assert.match(images[0].getAttribute('src'), /sufi-ilham-childhood\.webp$/);
  assert.match(images[1].getAttribute('src'), /sufi-ilham-flute\.webp$/);
  assert.ok(images[0].classList.contains('seam-then'));
  assert.ok(images[1].classList.contains('seam-now'), 'the later photograph is the one that is cut');
  for (const image of images) {
    assert.ok(image.getAttribute('alt'), 'both photographs keep a description');
    assert.equal(image.getAttribute('loading'), 'lazy');
  }

  // graded files, so the attributes have to match the images actually shipped
  assert.deepEqual([+images[0].getAttribute('width'), +images[0].getAttribute('height')], [760, 620]);
  assert.deepEqual([+images[1].getAttribute('width'), +images[1].getAttribute('height')], [830, 830]);
  const portraitImg = portrait.querySelector('img');
  assert.deepEqual([+portraitImg.getAttribute('width'), +portraitImg.getAttribute('height')], [1000, 1250]);

  // the seam is a real slider, not a picture of one
  const range = frame.querySelector('input.seam-range');
  assert.ok(range, 'the seam must be a control');
  assert.equal(range.type, 'range');
  assert.equal(range.getAttribute('min'), '0');
  assert.equal(range.getAttribute('max'), '100');
  assert.equal(range.getAttribute('value'), '50');
  assert.match(range.getAttribute('aria-label'), /childhood.*flute/i);
  assert.ok(frame.querySelector('.seam-line .seam-knob'));
  assert.equal(frame.querySelectorAll('.seam-tag').length, 2);
  assert.equal(seam.querySelector('figcaption').textContent.replace(/\s+/g, ' ').trim(), 'Where it beganThe flute, today');
});

test('the seam is painted from its value, and the portrait only leans on a mouse', async () => {
  const { initSeam, seamValueText, initPortraitLook } = await import('../src/scripts/author.ts');

  assert.equal(seamValueText(0), 'All of the childhood photograph');
  assert.equal(seamValueText(100), 'All of the flute, today');
  assert.equal(seamValueText(37), '37% of the frame shows the childhood photograph');

  const dom = new JSDOM(
    `<body>
       <figure class="author-main"><div class="plate-img"><img src="x.jpg" alt=""></div><figcaption>Portrait</figcaption></figure>
       <figure data-seam>
         <div class="seam-frame"><input class="seam-range" type="range" min="0" max="100" value="50"></div>
       </figure>
     </body>`,
    { pretendToBeVisual: true },
  );
  const d = dom.window.document;
  const frame = d.querySelector('.seam-frame');
  const range = d.querySelector('.seam-range');

  const stop = initSeam(d);
  assert.equal(frame.style.getPropertyValue('--seam'), '50%');
  assert.equal(frame.dataset.seamState, 'mixed');
  assert.equal(range.getAttribute('aria-valuetext'), '50% of the frame shows the childhood photograph');

  range.value = '0';
  range.dispatchEvent(new dom.window.Event('input'));
  assert.equal(frame.style.getPropertyValue('--seam'), '0%');
  assert.equal(frame.dataset.seamState, 'then');

  range.value = '100';
  range.dispatchEvent(new dom.window.Event('input'));
  assert.equal(frame.dataset.seamState, 'now');
  stop();

  // no pointer media query in jsdom: the portrait must simply do nothing
  const image = d.querySelector('.author-main img');
  const unlook = initPortraitLook(d);
  d.querySelector('.author-main').dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 10, clientY: 10 }));
  assert.equal(image.style.getPropertyValue('--look-x'), '', 'no lean without a fine pointer');
  unlook();
});

test('the author frames are graded as one film, and the seam is drawn in gold', () => {
  assert.match(stylesheet, /\.author-main \.plate-img img \{[\s\S]{0,220}?scale\(1\.06\)/);
  assert.match(stylesheet, /animation: author-push linear both;/);
  assert.match(stylesheet, /@supports \(animation-timeline: view\(\)\)/);
  assert.match(stylesheet, /\.seam-img \{[\s\S]{0,160}?object-fit: cover;/);
  assert.match(stylesheet, /\.seam-now \{ clip-path: inset\(0 0 0 var\(--seam, 50%\)\); \}/);
  assert.match(stylesheet, /\.seam-frame:focus-within \{ outline:/, 'the slider must show where the keyboard is');
  assert.match(stylesheet, /\.plate-img::after,\s*\.seam-frame::after \{/, 'one grain over every plate');
  // the grain and the vignette are the same layer on every plate
  assert.match(stylesheet, /feTurbulence/);
  assert.match(stylesheet, /\.seam-knob \{/);
  assert.match(stylesheet, /@media \(max-width: 560px\) \{\s*\.plate--seam \.seam-frame \{ aspect-ratio: 4 \/ 3; \}/);
  // and nothing may push the portrait for a reader who asked for stillness
  assert.match(stylesheet, /@media \(prefers-reduced-motion: no-preference\) \{\s*\.author-main \.plate-img img \{\s*animation: author-push/);
});

/* ---------- the object ---------- */

test('every book is as thick as it is long, and equally thick everywhere', async () => {
  const { bookRatio } = await import('../src/scripts/books3d.ts');

  // a slim essay and a doorstop must not share a spine
  assert.ok(bookRatio(76) < bookRatio(303), 'more pages must mean more bulk');
  assert.ok(bookRatio(303) < bookRatio(700));
  assert.ok(bookRatio(76) >= 0.07, 'nothing collapses to a wafer');
  assert.ok(bookRatio(2000) <= 0.22, 'nothing becomes a brick');
  assert.equal(bookRatio(), bookRatio(280), 'an unknown length gets a middling spine');
  assert.equal(bookRatio(null), bookRatio(280), 'a forthcoming book is not a wafer');
  assert.equal(bookRatio(0), bookRatio(280));

  const page = new JSDOM(readFileSync(join(projectRoot, 'dist/index.html'), 'utf8')).window.document;
  const books = Array.from(page.querySelectorAll('[data-book3d]'));
  assert.ok(books.length > 40, 'the home page is a room full of books');

  const ratios = new Set();
  for (const book of books) {
    const ratio = Number(book.style.getPropertyValue('--b3d-ratio'));
    assert.ok(ratio >= 0.07 && ratio <= 0.22, `${book.className}: ${ratio} is not a book thickness`);
    ratios.add(ratio);
    const pages = Number(book.getAttribute('data-pages'));
    assert.ok(Math.abs(ratio - bookRatio(pages)) < 0.0005, 'the spine must match the page count it carries');
  }
  assert.ok(ratios.size > 8, 'the shelf is not one uniform block: ' + ratios.size + ' thicknesses');

  // the dialog shows the same object, not a flat photograph of one
  const sheet = page.querySelector('.modal .b3d');
  assert.ok(sheet, 'the details sheet holds a book');
  assert.ok(sheet.querySelector('.b3d-front #mImg'), 'the cover image is the front board');
  assert.ok(sheet.querySelector('.b3d-spine .b3d-spine-title'), 'and it has a spine to write on');
});

test('the object is lit like a bound book, not painted like a box', () => {
  // thickness is a ratio of the cover's own width, resolved where it is used
  assert.match(stylesheet, /--th: clamp\(9px, calc\(var\(--b3d-ratio, \.13\) \* 100cqw\), 64px\);/);
  // the board bows: light gathers at the joint and the far corner falls away
  assert.match(stylesheet, /\.b3d-front::after \{[\s\S]{0,900}?linear-gradient\(90deg,/);
  assert.match(stylesheet, /\.b3d-front,\s*\.b3d-back \{ border-radius: clamp\(\.5px, \.42cqw, 3px\); \}/);
  // sewn head-bands at the top and bottom of the joint
  assert.match(stylesheet, /\.b3d-head::after,\s*\.b3d-tail::after \{/);
  assert.match(stylesheet, /repeating-linear-gradient\(90deg,\s*color-mix\(in srgb, var\(--b3d-foil\) 82%, #4a3418\) 0 1px,/);
  // a contact shadow and a room shadow, not one blur
  assert.match(stylesheet, /radial-gradient\(ellipse 46% 34% at 54% 56%,/);
  assert.match(stylesheet, /radial-gradient\(ellipse 78% 56% at 56% 54%,/);
  // the cover lifts off the block at the joint, on a mouse only
  assert.match(stylesheet, /transform: translateZ\(calc\(var\(--th\) \/ 2\)\) rotateY\(-5deg\);/);
  assert.match(stylesheet, /\.b3d-front \{\s*transform-origin: left center;/);
  // and the sheet's book settles in
  assert.match(stylesheet, /\.modal\.open \.b3d \{ opacity: 1; transform: none; \}/);
});

/* ---------- the faults a real browser showed ---------- */

test('the shelf scrolls sideways and never cuts a book, nor paints one over its title', () => {
  // it must not be part of the wrapping list: five books wrapped 4 + 1 and left a hole
  assert.ok(!/\.shelf-scroll[^{}]*\{[^}]*flex-wrap/.test(stylesheet), 'the shelf must not wrap');
  assert.match(stylesheet, /\.filters, \.cover-cta, \.buy-row, \.s-meta \{\s*flex-wrap: wrap;/);

  // a turned book paints outside its box: the foot is reserved inside the object
  assert.match(stylesheet, /\.b3d \{[\s\S]{0,900}?padding-bottom: 4\.5%;/);
  assert.match(stylesheet, /\.shelf-scroll \{[\s\S]{0,400}?padding-block: 1\.15rem 1\.9rem;/);

  // the stage is not a picture frame any more — it holds an object with its own shadow
  assert.match(stylesheet, /\.contact-sheet \.spine-img \{[^}]*border: 0;[^}]*box-shadow: none;/);

  // on a phone a clipped tile cut the spine off the cover
  assert.match(stylesheet, /@media \(max-width: 560px\) \{[\s\S]{0,600}?\.book-tile \{[\s\S]{0,400}?overflow: visible;/);
});

test('a reveal cue cannot hide something taller than the screen', async () => {
  const source = readFileSync(join(projectRoot, 'src/scripts/app.ts'), 'utf8');
  // 12% of the 36-tile catalogue can never be on a phone screen at once
  assert.match(source, /\{ threshold: 0, rootMargin: '0px 0px -8% 0px' \}/);
  assert.ok(!/threshold: 0\.12/.test(source), 'no reveal may be keyed to a fraction of its own height');
});

/* ---------- the details a phone showed ---------- */

test('nothing a reader has to read is smaller than 9.6px on a phone', () => {
  // the catalogue tiles used to set their own captions at .43rem — 6.9px
  assert.match(stylesheet, /@media \(max-width: 560px\) \{[\s\S]{0,2400}?\.book-tile-meta \{[\s\S]{0,200}?font-size: \.58rem;/);
  assert.match(stylesheet, /@media \(max-width: 560px\) \{[\s\S]{0,2400}?\.book-tile-kicker \{ font-size: \.58rem;/);
  // and one floor under the remaining mono labels, which each sized their own
  assert.match(stylesheet, /@media \(max-width: 560px\) \{[\s\S]{0,700}?figcaption,[\s\S]{0,700}?font-size: \.6rem !important;/);
});

test('a thumb gets 24px of hit area on every text link', () => {
  // WCAG 2.5.8 — colophon, marketplace and breadcrumb links were 12–17px tall
  assert.match(stylesheet, /@media \(hover: none\), \(pointer: coarse\) \{[\s\S]{0,2000}?\.colo a, \.colo-bot a, \.colo-markets a/);
  assert.match(stylesheet, /padding-block: 5px;/);
  assert.match(stylesheet, /\.crumb a, \.book-crumb a, \.book-series-link \{ min-height: 28px;/);
  // padding, not a flex box: a long title still has to wrap inside its column
  assert.match(stylesheet, /\.colo a, \.colo-bot a[\s\S]{0,600}?display: inline-block;/);
});

test('small type keeps its colour when it sits on ink', () => {
  // series accents are read off cover art; two of them fell under 4.5:1 at 9.6px
  assert.match(stylesheet, /\.s-hero \.label\.mark,[\s\S]{0,400}?color: color-mix\(in srgb, var\(--mark\) 84%, #f6efe2\);/);
  // and the clay on the discovery panel was 4.03:1
  assert.match(stylesheet, /\.discover-overline \{ color: #844f38;/);
  assert.match(stylesheet, /\.path-eyebrow \{ font-style: italic; color: #6b4d3f;/);
});

test('the first screen stays light', () => {
  // the portrait is the only eager image on the page: it was 158KB, then 104KB
  const portrait = statSync(join(projectRoot, 'public/images/sufi-ilham-portrait.jpg')).size;
  assert.ok(portrait < 112 * 1024, `portrait should stay under 112KB, is ${Math.round(portrait / 1024)}KB`);
  // the page keeps its own dimensions, so nothing shifts while it decodes
  const page = new JSDOM(readFileSync(join(projectRoot, 'dist/index.html'), 'utf8')).window.document;
  const hero = page.querySelector('.hero-visual img, .author-main img');
  assert.equal(hero.getAttribute('width'), '1000');
  assert.equal(hero.getAttribute('height'), '1250');
});
