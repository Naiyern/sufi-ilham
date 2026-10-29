/* Build-time only. Resolves whichever file is the current main portrait.
   Drop any of these into public/images/ (whichever was modified most
   recently wins) and rebuild:
     public/images/sufi-ilham-portrait.png | .jpg | .jpeg | .webp
   width/height attributes are read from the real file by publicImageSize. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

export interface PortraitRef {
  /** path relative to public/, e.g. "images/sufi-ilham-portrait.png" */
  rel: string;
  ext: string;
  /** Changes when the image changes, avoiding stale cached portraits. */
  version: string;
}

export function resolvePortrait(): PortraitRef {
  const dir = path.join(process.cwd(), 'public', 'images');
  let best: (PortraitRef & { mtime: number }) | null = null;
  for (const ext of EXTS) {
    const file = path.join(dir, `sufi-ilham-portrait${ext}`);
    try {
      const st = fs.statSync(file);
      if (!best || st.mtimeMs > best.mtime) {
        best = { rel: `images/sufi-ilham-portrait${ext}`, ext, mtime: st.mtimeMs, version: createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12) };
      }
    } catch {
      /* not present — try next extension */
    }
  }
  return best ?? { rel: 'images/sufi-ilham-portrait.jpg', ext: '.jpg', version: 'missing' };
}
