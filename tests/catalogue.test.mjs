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

test('homepage chapter rail sits between the opening and release scene with valid anchors', () => {
  const dom = new JSDOM(builtHtml);
  const { document, Node } = dom.window;
  const hero = document.querySelector('#top');
  const rail = document.querySelector('#chapterRail');
  const release = document.querySelector('#new');
  const links = [...rail.querySelectorAll('[data-chapter]')];

  assert.equal(links.length, 8);
  assert.equal(links[0].getAttribute('aria-current'), 'location');
  assert.ok(hero.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(rail.compareDocumentPosition(release) & Node.DOCUMENT_POSITION_FOLLOWING);
  for (const link of links) assert.ok(document.querySelector(link.hash), `missing chapter target ${link.hash}`);
  assert.match(rail.getAttribute('aria-label'), /chapters/i);
  assert.match(stylesheet, /\.chapter-rail a\.active/);
  assert.match(stylesheet, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(stylesheet, /\.soon-step[^{}]*\{[^}]*\bopacity\s*:/s);
  close(dom);
});

test('mobile keeps cinematic navigation and series artwork in the experience', () => {
  const mobileStart = stylesheet.indexOf('MOBILE CINEMA');
  assert.notEqual(mobileStart, -1);
  const mobileStyles = stylesheet.slice(mobileStart);

  assert.match(mobileStyles, /\.chapter-rail\s*\{[^}]*position:\s*sticky;[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;/s);
  assert.match(mobileStyles, /\.s-hero-bg\s*\{[^}]*display:\s*flex;/s);
  assert.match(mobileStyles, /scroll-snap-type:\s*x\s+proximity/);
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
  assert.ok(bookLinks.every((link) => link.getAttribute('href').startsWith('/books/')));
  assert.ok(bookLinks.every((link) => link.querySelector('img[alt]')));
  assert.ok(document.querySelector('a[href="/read/darya-ka-aik-hissa/"]'));
  assert.ok(new JSDOM(builtHtml).window.document.querySelector('a[href="/discover/"]'));
  close(dom);
});

test('series books link to adjacent titles in reading order', () => {
  const page = readFileSync(join(projectRoot, 'dist/books/the-sea-tithe/index.html'), 'utf8');
  const dom = new JSDOM(page);
  const nav = dom.window.document.querySelector('nav[aria-label="Series reading order"]');
  assert.ok(nav.querySelector('a[href="/books/the-shadow-tithe/"]'));
  assert.ok(nav.querySelector('a[href="/books/the-crown-always-owns/"]'));
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
    assert.ok(next.querySelector('a[href="/discover/"]'));
    assert.ok(next.querySelector('a[href="/#index"]'));
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
