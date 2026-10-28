#!/usr/bin/env node
/**
 * Verifies the built site before it is copied to the repository root
 * (GitHub Pages serves the root of `main`, so the root *is* the website).
 *
 *   node scripts/verify-build.mjs          # checks dist/
 *   node scripts/verify-build.mjs --root   # also re-checks the deployed root copy
 *
 * It catches redirect stubs, broken internal links and fragment targets,
 * duplicate IDs, missing image alt attributes, default-GET forms that can leak
 * field values into URLs, and pages without exactly one h1. These are checked
 * against generated HTML, not source templates.
 *
 * Run automatically at the end of `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.resolve(root, process.env.DIST_DIR ?? 'dist');
// --root checks the deployed copy instead (GitHub Pages serves the repo root).
const checkRoot = process.argv.includes('--root');
const errors = [];
const notes = [];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.astro', 'src', 'public', 'scripts', 'docs']);

/* ---------------------------------------------------------------- helpers */

const rel = (p) => path.relative(root, p) || p;
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function walk(dir, filter, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
      walk(p, filter, out);
    } else if (filter(p)) out.push(p);
  }
  return out;
}

/** The URL path the file is served from, e.g. dist/privacy/index.html -> /privacy/ */
function servedPath(file, siteDir) {
  let p = '/' + path.relative(siteDir, file).split(path.sep).join('/');
  if (p.endsWith('/index.html')) p = p.slice(0, -'index.html'.length);
  return p;
}

const normalize = (p) =>
  decodeURIComponent(p.split(/[?#]/)[0]).replace(/\/+$/, '') || '/';

/* ------------------------------------------------------- 1. no stub files */

if (!exists(dist)) {
  console.error('✗ dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const stubNames = ['privacy.html', 'terms.html', 'contact.html'];
for (const name of stubNames) {
  if (exists(path.join(dist, name))) errors.push(`dist/${name} exists — a root redirect stub must never be built`);
  if (exists(path.join(root, name))) errors.push(`${name} exists in the repo root — GitHub Pages serves that file for /${name.replace('.html', '')} and loops`);
  if (exists(path.join(root, 'public', name))) errors.push(`public/${name} exists — Astro copies it into every build`);
}

/* ------------------------------------------------- 2. no self-redirecting HTML */

const siteDir = checkRoot ? root : dist;
const htmlFiles = walk(siteDir, (p) => p.endsWith('.html'));
if (htmlFiles.length === 0) errors.push(`no HTML found in ${rel(siteDir)} — did the build/copy run?`);
const redirects = [];
for (const file of htmlFiles) {
  const html = read(file);
  for (const m of html.matchAll(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)/gi)) {
    const from = normalize(servedPath(file, siteDir));
    const to = normalize(m[1]);
    redirects.push({ file: rel(file), from, to });
    // /privacy.html redirecting to /privacy is the loop: GitHub Pages serves
    // the stub itself for the extensionless URL.
    if (to === from || to === `${from}.html`) {
      errors.push(`${rel(file)} redirects to ${m[1]} — that is the same URL GitHub Pages serves it from (endless "Redirecting…")`);
    }
  }
}
if (redirects.length === 0) notes.push(`no HTML redirect stubs anywhere in ${rel(siteDir)}`);

/* ------------------------------------------- 3. every internal link resolves */

// Base path is read from the homepage canonical so this works for the
// custom-domain Pages root build and a sandbox/alt deploy at any subpath.
let base = '';
const homeFile = path.join(siteDir, 'index.html');
if (!exists(homeFile)) errors.push(`${rel(homeFile)} missing`);
else {
  const canonical = read(homeFile).match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) errors.push(`${rel(homeFile)} has no canonical link`);
  else base = normalize(new URL(canonical[1]).pathname);
  if (base === '/') base = '';
}

function sitePath(urlPath) {
  const normalized = normalize(urlPath);
  if (!base) return normalized;
  if (normalized === base) return '/';
  return normalized.startsWith(`${base}/`) ? normalized.slice(base.length) : normalized;
}

function fileForPath(urlPath) {
  const target = normalize(sitePath(urlPath));
  if (target === '/') return path.join(siteDir, 'index.html');
  const p = path.join(siteDir, target.replace(/^\/+/, ''));
  if (exists(p) && fs.statSync(p).isDirectory()) return path.join(p, 'index.html');
  if (exists(p) && fs.statSync(p).isFile()) return p;
  return path.join(p, 'index.html');
}

function resolves(urlPath) {
  const file = fileForPath(urlPath);
  return exists(file) && fs.statSync(file).isFile();
}

for (const file of htmlFiles) {
  const html = read(file);
  const found = new Set();
  // Real navigation: href/src/action attributes …
  for (const m of html.matchAll(/(?:href|src|action)\s*=\s*"([^"]*)"/gi)) found.add(m[1]);
  // … and the link data the client-side JS navigates with (command palette,
  // book modal, cover images), which lives in JSON script tags.
  for (const m of html.matchAll(/"(?:u|img|url|link|href)"\s*:\s*"([^"]+)"/g)) found.add(m[1]);

  for (const raw of found) {
    const url = raw.trim();
    if (!url || !url.startsWith('/')) continue; // external, mailto:, tel:, #anchor, data:
    if (!resolves(url)) errors.push(`${rel(file)} links to ${url} — nothing to serve there`);
  }
}

/* --------------------------------- 4. the two things PR #16 fixed stay fixed */

const indexFile = exists(homeFile) ? homeFile : null;
if (indexFile) {
  const html = read(indexFile);

  const coverTop = html.match(/<div class="cover-top">([\s\S]*?)<\/div>/);
  if (!coverTop) errors.push('index.html has no .cover-top block');
  else if (/Bihar/i.test(coverTop[1])) errors.push('index.html cover-top mentions Bihar (place names belong in the footer only)');

  const explore = html.match(/<h4>Explore<\/h4>\s*<ul>([\s\S]*?)<\/ul>/);
  if (!explore) errors.push('index.html has no footer Explore list');
  else {
    const links = [...explore[1].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    if (links.length !== 6) errors.push(`footer Explore has ${links.length} links, expected 6`);
    for (const href of links) {
      if (!href.startsWith('/') && !href.startsWith('https://')) {
        errors.push(`footer Explore link ${href} is neither internal nor absolute`);
      } else if (href.startsWith('/') && !href.endsWith('/') && !href.includes('#')) {
        errors.push(`footer Explore link ${href} needs a trailing slash`);
      }
    }
  }
}

/* ------------------------------------------- 5. semantic and fragment audit */

const pageAudits = htmlFiles.map((file) => {
  const markup = read(file).replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const ids = new Set();
  const duplicateIds = new Set();
  for (const match of markup.matchAll(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const id = (match[1] ?? match[2] ?? '').trim();
    if (!id) continue;
    if (ids.has(id)) duplicateIds.add(id);
    ids.add(id);
  }
  return { file, markup, ids, duplicateIds };
});
const auditsByFile = new Map(pageAudits.map((audit) => [path.resolve(audit.file), audit]));

for (const audit of pageAudits) {
  const page = rel(audit.file);
  for (const id of audit.duplicateIds) errors.push(`${page} repeats id="${id}"`);

  const h1Count = [...audit.markup.matchAll(/<h1\b/gi)].length;
  if (h1Count !== 1) errors.push(`${page} has ${h1Count} <h1> elements; expected exactly one`);

  for (const match of audit.markup.matchAll(/<form\b([^>]*)>/gi)) {
    const method = match[1].match(/\bmethod\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const value = (method?.[1] ?? method?.[2] ?? method?.[3] ?? 'get').toLowerCase();
    if (value === 'get') errors.push(`${page} contains a default-GET form; form values can leak into the URL without JavaScript`);
  }

  for (const match of audit.markup.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*(?:"[^"]*"|'[^']*')/i.test(match[0])) {
      errors.push(`${page} contains an <img> without an alt attribute`);
    }
  }

  for (const match of audit.markup.matchAll(/<a\b[^>]*>/gi)) {
    const hrefMatch = match[0].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!hrefMatch) continue;
    const href = (hrefMatch[1] ?? hrefMatch[2] ?? '').trim();
    if (!href) {
      errors.push(`${page} contains an anchor with a blank href`);
      continue;
    }
    if (href === '#') {
      errors.push(`${page} contains an empty fragment link (href="#")`);
      continue;
    }

    let url;
    try { url = new URL(href, `https://verify.invalid${servedPath(audit.file, siteDir)}`); }
    catch { continue; }
    if (url.origin !== 'https://verify.invalid' || !url.hash) continue;

    let target;
    try { target = fileForPath(url.pathname); }
    catch { continue; }
    if (!exists(target)) {
      errors.push(`${page} links to fragment ${href}, but ${rel(target)} does not exist`);
      continue;
    }
    let fragment;
    try { fragment = decodeURIComponent(url.hash.slice(1)); }
    catch { fragment = url.hash.slice(1); }
    const targetAudit = auditsByFile.get(path.resolve(target));
    if (targetAudit && !targetAudit.ids.has(fragment)) {
      errors.push(`${page} links to missing fragment ${href} in ${rel(target)}`);
    }
  }
}

/* ----------------------------------------------------------- 6. report out */

const checked = htmlFiles.length;
if (errors.length) {
  console.error(`\n✗ verify-build failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of [...new Set(errors)]) console.error(`  • ${e}`);
  console.error('');
  process.exit(1);
}

for (const n of notes) console.log(`  ✓ ${n}`);
console.log(`  ✓ no self-redirecting stubs, all internal links resolve (${checked} pages checked, base "${base || '/'}")`);
if (base !== '/') console.log(`  ! built with base "${base || '/'}" — the custom-domain Pages deploy expects "/"`);
console.log('  ✓ unique IDs, one h1 per page, image alt attributes, safe form methods, and fragment targets checked');
console.log('  ✓ cover-top clean, footer Explore links trailing-slashed');
console.log('\nverify-build passed — safe to deploy dist/ to the repo root.\n');
