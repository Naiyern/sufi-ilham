/* Build-time only (never import this from a client script).
   Reads the real pixel size of a file in public/ so an <img>'s width/height
   attributes always match the actual photo. Swap the file and the attributes
   follow on the next build, with no hand-edited numbers to fall out of date. */
import sharp from 'sharp';
import path from 'node:path';

export async function publicImageSize(
  rel: string,
  fallback: [number, number],
): Promise<[number, number]> {
  const file = path.join(process.cwd(), 'public', rel.replace(/^\//, ''));
  try {
    const m = await sharp(file).metadata();
    let w = m.autoOrient?.width ?? m.width;
    let h = m.autoOrient?.height ?? m.height;
    // Phone photos often store rotation in EXIF; browsers apply it, so the
    // attributes must describe the rotated image (older sharp: swap by hand).
    if (!m.autoOrient && (m.orientation ?? 1) >= 5) [w, h] = [h, w];
    if (w && h) return [w, h];
  } catch (err) {
    console.warn(`[image-size] could not read ${file}: ${(err as Error).message}`);
  }
  return fallback;
}
