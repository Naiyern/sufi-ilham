#!/usr/bin/env node
/* Replace the main author portrait with your EXACT photo.
 *
 *   node scripts/replace-portrait.mjs /path/to/your-photo.png
 *
 * The file is copied BYTE-FOR-BYTE — no cropping, no resizing, no filters,
 * no AI. It is placed (under the name the site expects) in:
 *        public/images/sufi-ilham-portrait.<ext>   (served / built)
 *        src/assets/sufi-ilham-portrait.<ext>      (Astro asset copy)
 *        images/sufi-ilham-portrait.<ext>          (legacy / Pages root)
 * Old cropped variants (sufi-ilham-portrait-400/600/900/1200, .webp) and
 * masters with other extensions are removed so only your exact file remains.
 * Then run: npm run build && cp -r dist/. .
 */
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/replace-portrait.mjs /path/to/your-photo.png');
  process.exit(1);
}
const srcFile = path.resolve(src);
if (!fs.existsSync(srcFile)) {
  console.error(`File not found: ${srcFile}`);
  process.exit(1);
}

const extRaw = path.extname(srcFile).toLowerCase();
const ext = extRaw === '.jpeg' ? '.jpg' : extRaw;
if (!['.png', '.jpg', '.webp'].includes(ext)) {
  console.error(`Unsupported format "${extRaw || '(none)'}" — use .png, .jpg/.jpeg or .webp.`);
  process.exit(1);
}

const root = process.cwd();
const targets = [
  path.join(root, 'public', 'images', `sufi-ilham-portrait${ext}`),
  path.join(root, 'src', 'assets', `sufi-ilham-portrait${ext}`),
  path.join(root, 'images', `sufi-ilham-portrait${ext}`),
];

// 1) remove old variants + masters in other extensions (keep nothing stale)
const dirs = [path.join(root, 'public', 'images'), path.join(root, 'src', 'assets'), path.join(root, 'images')];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!/^sufi-ilham-portrait(-\d+)?\.(png|jpe?g|webp)$/i.test(f)) continue;
    const full = path.join(dir, f);
    if (targets.includes(full)) continue; // will be overwritten below
    fs.rmSync(full);
    console.log(`  - removed stale ${path.relative(root, full)}`);
  }
}

// 2) copy the exact bytes to every location
const buf = fs.readFileSync(srcFile);
for (const t of targets) {
  fs.mkdirSync(path.dirname(t), { recursive: true });
  fs.writeFileSync(t, buf);
  console.log(`  ✓ ${path.relative(root, t)}  (${(buf.length / 1024).toFixed(1)} KB, byte-for-byte)`);
}

console.log(`\nDone. Your photo is used exactly as-is (${ext}).`);
console.log('Next: npm run build && cp -r dist/. .   (or just push — the GitHub action rebuilds).');
