/**
 * Pointer-driven depth for the `.b3d` book objects.
 *
 * The resting 3D pose comes from CSS, so the covers still look like physical
 * books with no JavaScript at all. This module only adds the small parallax
 * that makes them feel like objects on a table: the board turns a few degrees
 * toward the pointer and the sheen follows it.
 *
 * It is deliberately conservative:
 *  - skipped entirely for `prefers-reduced-motion: reduce`;
 *  - pointer tracking only for fine pointers (touch scrolling is untouched);
 *  - one rAF per book, values clamped by the constants below;
 *  - keyboard focus tilts the book on the wrapping link, then resets on blur.
 */

const REST_Y = 15;
const REST_X = 2;
const REACH_Y = 8;
const REACH_X = 6;

export function initBook3D(): void {
  const books = document.querySelectorAll<HTMLElement>('[data-book3d]');
  if (!books.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  books.forEach((book) => {
    const obj = book.querySelector<HTMLElement>('.b3d-obj');
    if (!obj) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      obj.style.setProperty('--b3d-ry', `${REST_Y - x * REACH_Y}deg`);
      obj.style.setProperty('--b3d-rx', `${REST_X + y * REACH_X}deg`);
      book.style.setProperty('--gx', `${22 + (x + 0.5) * 56}%`);
      book.style.setProperty('--gy', `${6 + (y + 0.5) * 52}%`);
    };

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      obj.style.removeProperty('--b3d-ry');
      obj.style.removeProperty('--b3d-rx');
      book.style.removeProperty('--gx');
      book.style.removeProperty('--gy');
    };

    if (finePointer) {
      book.addEventListener('pointermove', (event) => {
        const rect = book.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        x = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
        y = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));
        if (!frame) frame = requestAnimationFrame(paint);
      });
      book.addEventListener('pointerleave', reset);
    }

    const link = book.closest('a');
    if (link) {
      link.addEventListener('focus', () => {
        obj.style.setProperty('--b3d-ry', `${REST_Y + 6}deg`);
        obj.style.setProperty('--b3d-rx', `${REST_X + 2}deg`);
      });
      link.addEventListener('blur', reset);
    }
  });
}
