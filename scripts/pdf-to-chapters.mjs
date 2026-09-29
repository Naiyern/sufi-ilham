#!/usr/bin/env node
/**
 * Extract the words from a book PDF and convert them into structured chapters
 * for the on-site HTML reader (the best reading experience — reflowable text,
 * real Urdu typography, night mode, resizable type).
 *
 *   node scripts/pdf-to-chapters.mjs <slug> [path/to/file.pdf]
 *
 * Reads:  public/reads/<slug>.pdf   (unless a path is given)
 * Writes: src/data/reader/<slug>.json
 *
 * Text is reconstructed line-by-line from PDF text items, grouped into
 * paragraphs by vertical gaps, and split into chapters on heading-like lines
 * (بابن / حصہ / فصل / Chapter / a lone number). RTL (Urdu/Arabic) is detected
 * automatically. Re-run this whenever the PDF changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/pdf-to-chapters.mjs <slug> [file.pdf]');
  process.exit(1);
}
const pdfPath = path.resolve(root, process.argv[3] || `public/reads/${slug}.pdf`);
const outPath = path.resolve(root, `src/data/reader/${slug}.json`);

if (!fs.existsSync(pdfPath)) {
  console.error(`✗ PDF not found: ${path.relative(root, pdfPath)}`);
  process.exit(1);
}

// pdfjs legacy build runs in Node without a DOM.
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const isHeading = (s) =>
  /^\s*(باب|حصہ|فصل|منظر|chapter|prologue|epilogue|part)\b/i.test(s) ||
  /^\s*[0-9۰-۹]{1,3}\s*[.:۔-]?\s*$/.test(s) ||
  (s.length <= 40 && /^\s*[*﷽۔–—-]*\s*$/.test(s) === false && s.trim().split(/\s+/).length <= 6 && /[:۔]$/.test(s));

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function run() {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const lines = [];
  let rtlHits = 0;
  let totalChars = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    // Group text items into visual lines by rounded Y.
    const byY = new Map();
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y).push({ x, str: it.str, h: it.height || Math.abs(it.transform[3]) });
      if (ARABIC.test(it.str)) rtlHits++;
      totalChars += it.str.length;
    }
    // Top-to-bottom (PDF y grows upward → sort descending).
    const ys = [...byY.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const items = byY.get(y);
      const rtl = items.some((i) => ARABIC.test(i.str));
      // RTL reads right→left, so order items by descending x.
      items.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
      const text = items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
      const h = Math.max(...items.map((i) => i.h || 0));
      if (text) lines.push({ text, y, h, page: p });
    }
    lines.push({ text: '', gap: true, page: p }); // page break hint
  }

  const dir = rtlHits > totalChars / 40 ? 'rtl' : 'ltr';

  // Median line height to spot headings.
  const heights = lines.filter((l) => l.h).map((l) => l.h).sort((a, b) => a - b);
  const medianH = heights.length ? heights[Math.floor(heights.length / 2)] : 0;

  // Build chapters and paragraphs.
  const chapters = [];
  let cur = { title: '', paras: [] };
  let buf = '';
  const flushPara = () => { if (buf.trim()) { cur.paras.push(buf.trim()); buf = ''; } };
  const flushChapter = () => {
    flushPara();
    if (cur.title || cur.paras.length) chapters.push(cur);
    cur = { title: '', paras: [] };
  };

  for (const l of lines) {
    if (l.gap) { flushPara(); continue; }
    const big = medianH && l.h > medianH * 1.35;
    if ((big || isHeading(l.text)) && l.text.length <= 60) {
      // Start a new chapter on a heading.
      flushChapter();
      cur.title = l.text;
      continue;
    }
    // Join wrapped lines into a paragraph; blank handled by page gap.
    buf += (buf ? ' ' : '') + l.text;
    // Heuristic paragraph break: sentence end followed by short line already merged;
    // rely mostly on page gaps + headings. Break on Urdu full stop at line end.
    if (/[۔.!?”"]$/.test(l.text) && l.text.length < 55) flushPara();
  }
  flushChapter();

  // If nothing chaptered, wrap everything into one chapter.
  const clean = chapters.filter((c) => c.title || c.paras.length);
  const out = clean.length ? clean : [{ title: '', paras: [] }];

  // Attach book meta from books.json if present.
  let meta = {};
  try {
    const books = JSON.parse(fs.readFileSync(path.join(root, 'src/data/books.json'), 'utf8'));
    const b = books.find((x) => x.slug === slug);
    if (b) meta = { title: b.title, author: 'صوفی الہام', sub: b.sub };
  } catch { /* ignore */ }

  const json = {
    slug,
    title: meta.title || slug,
    author: meta.author || '',
    sub: meta.sub || '',
    dir,
    lang: dir === 'rtl' ? 'ur' : 'en',
    source: 'extracted-from-pdf',
    generatedAt: new Date().toISOString().slice(0, 10),
    pages: doc.numPages,
    chapters: out.map((c, i) => ({
      id: `ch${i + 1}`,
      title: c.title || (dir === 'rtl' ? `باب ${i + 1}` : `Chapter ${i + 1}`),
      html: c.paras.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n'),
    })),
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
  const words = out.reduce((a, c) => a + c.paras.join(' ').split(/\s+/).filter(Boolean).length, 0);
  console.log(`✓ ${path.relative(root, outPath)} — ${json.chapters.length} chapter(s), ~${words} words, dir=${dir}, ${doc.numPages} pdf pages`);
  if (words < 30) {
    console.log('  ! Very little text extracted — is this the real manuscript, or a placeholder/scanned PDF?');
  }
}

run().catch((e) => { console.error('✗ extraction failed:', e.message); process.exit(1); });
