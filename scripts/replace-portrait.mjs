#!/usr/bin/env node
/**
 * Replace the main author portrait — works with ANY photo you give it.
 * Usage:
 *   node scripts/replace-portrait.mjs /path/to/your-new-photo.jpg
 *   node scripts/replace-portrait.mjs ./my-photo.png
 *
 * What it does:
 *   1. Reads your image, auto-rotates by EXIF, crops to a centered square
 *      (so vertical 4:5, horizontal, or phone photos all look editorial),
 *   2. Generates a high-quality 1200×1200 master JPG + 600×600 fallback,
 *   3. Copies to all locations the site reads from:
 *        public/images/sufi-ilham-portrait.jpg  (served)
 *        src/assets/sufi-ilham-portrait.jpg     (Astro asset)
 *        images/sufi-ilham-portrait.jpg         (legacy / Pages)
 *   4. Also writes a WebP variant next to the JPG for future use.
 *
 * After it runs, rebuild:  npm run build   (or just push — GitHub Pages rebuilds)
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
if (!input) {
  console.error(`
  ✖ No input file given.

  Usage:
    node scripts/replace-portrait.mjs /path/to/your-photo.jpg

  Tip: Drag your photo into the terminal to paste its path.
  Any shape works (square, portrait 4:5, phone vertical) — it will be
  auto-cropped to a centered square so it looks identical on
  desktop, tablet and mobile without stretching.
`);
  process.exit(1);
}

const resolved = path.resolve(input);
if (!fs.existsSync(resolved)) {
  console.error(`✖ File not found: ${resolved}`);
  process.exit(1);
}

const targets = [
  'public/images/sufi-ilham-portrait.jpg',
  'src/assets/sufi-ilham-portrait.jpg',
  'images/sufi-ilham-portrait.jpg',
];

async function run() {
  const base = path.join(process.cwd());
  console.log(`→ Reading ${resolved}`);
  const meta = await sharp(resolved).metadata();
  console.log(`  Original: ${meta.width}×${meta.height}  ${meta.format}  orientation:${meta.orientation ?? 1}`);

  // Auto-rotate by EXIF, then cover-crop to square centred slightly above middle (18% top offset)
  // to keep faces centred — matches CSS object-position: center 18%.
  // We use a resize with position 'attention' or 'centre' but with a slight top bias.
  // Sharp's cover with position string: "centre" is centre. We'll use "north" bias by extracting.
  // Simplest: resize to cover 1200 square with position "attention" which finds faces, but fallback to centre.

  const master = sharp(resolved).rotate(); // auto EXIF

  // Generate 1200 square master
  const makeSquare = (size) =>
    master
      .clone()
      .resize(size, size, {
        fit: 'cover',
        position: 'attention', // face-aware when possible
        withoutEnlargement: false,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

  const buf1200 = await makeSquare(1200);
  const buf600 = await makeSquare(600);

  // Also WebP for future srcset
  const webp1200 = await master
    .clone()
    .resize(1200, 1200, { fit: 'cover', position: 'attention' })
    .webp({ quality: 78 })
    .toBuffer();

  for (const rel of targets) {
    const dest = path.join(base, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf1200);
    console.log(`  ✓ wrote ${rel}  (${(buf1200.length / 1024).toFixed(1)} KB  1200×1200)`);
  }

  // Also keep a small variant for reference and a webp
  const pubDir = path.join(base, 'public/images');
  fs.writeFileSync(path.join(pubDir, 'sufi-ilham-portrait-600.jpg'), buf600);
  fs.writeFileSync(path.join(pubDir, 'sufi-ilham-portrait.webp'), webp1200);
  fs.writeFileSync(path.join(pubDir, 'sufi-ilham-portrait-600.webp'), await sharp(buf600).webp({ quality: 78 }).toBuffer());
  console.log(`  ✓ wrote public/images/sufi-ilham-portrait-600.jpg  (${(buf600.length / 1024).toFixed(1)} KB)`);
  console.log(`  ✓ wrote public/images/sufi-ilham-portrait.webp + -600.webp`);

  console.log(`
  ✔ Done. Your new portrait is now live in the repo.

  Next:
    1. npm run build   → check it locally, or
    2. git add -A && git commit -m "update portrait" && git push
       → GitHub Pages rebuilds automatically (1–2 min).

  The CSS frame (aspect-ratio 1/1 + object-fit:cover) guarantees it never
  stretches on mobile/tablet/desktop — any photo shape will look editorial.
`);
}

run().catch((e) => {
  console.error('✖ Failed:', e);
  process.exit(1);
});
