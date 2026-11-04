/* Gestures for the two author plates.

   The seam frame holds two photographs of the same person, years apart, in one
   frame. The seam is a real range input lying invisibly over the pictures, so
   the browser already gives us everything a gesture needs: click or tap
   anywhere and the seam jumps there, drag and it follows the finger, arrow keys
   move it a step at a time, and a screen reader announces it as a slider. All
   this module does is paint the value back into CSS — a custom property is the
   one thing the input cannot set on its own.

   The portrait's "look" is the second gesture: on a mouse, the picture leans a
   few pixels towards the pointer, the way a photograph held in a hand shifts as
   the hand turns. Touch and reduced motion never see it, and nothing is
   animated on a timeline, so no visitor can be left mid-gesture. */

const NEAR = 4;

/** "Half the frame shows the childhood photograph" — spoken, not just seen. */
export function seamValueText(percent: number): string {
  if (percent <= NEAR) return 'All of the childhood photograph';
  if (percent >= 100 - NEAR) return 'All of the flute, today';
  return `${Math.round(percent)}% of the frame shows the childhood photograph`;
}

export function initSeam(doc: Document = document): () => void {
  const stops: Array<() => void> = [];

  for (const figure of Array.from(doc.querySelectorAll<HTMLElement>('[data-seam]'))) {
    const frame = figure.querySelector<HTMLElement>('.seam-frame');
    const range = figure.querySelector<HTMLInputElement>('.seam-range');
    if (!frame || !range) continue;

    const paint = () => {
      const value = Number(range.value) || 0;
      frame.style.setProperty('--seam', `${value}%`);
      frame.dataset.seamState = value <= NEAR ? 'then' : value >= 100 - NEAR ? 'now' : 'mixed';
      range.setAttribute('aria-valuetext', seamValueText(value));
    };

    range.addEventListener('input', paint);
    paint();
    stops.push(() => range.removeEventListener('input', paint));
  }

  return () => stops.forEach((stop) => stop());
}

export function initPortraitLook(doc: Document = document): () => void {
  const view = doc.defaultView;
  const figure = doc.querySelector<HTMLElement>('.author-main');
  const image = figure?.querySelector<HTMLElement>('img');
  if (!view || !figure || !image) return () => {};

  // only where there is a pointer that can hover, and only if motion is welcome
  if (!view.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches) return () => {};
  if (view.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return () => {};

  const LEAN = 9;
  const look = (event: PointerEvent) => {
    const rect = figure.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    image.style.setProperty('--look-x', `${(x * LEAN).toFixed(2)}px`);
    image.style.setProperty('--look-y', `${(y * LEAN).toFixed(2)}px`);
  };
  const rest = () => {
    image.style.removeProperty('--look-x');
    image.style.removeProperty('--look-y');
  };

  figure.addEventListener('pointermove', look);
  figure.addEventListener('pointerleave', rest);
  figure.addEventListener('pointercancel', rest);

  return () => {
    figure.removeEventListener('pointermove', look);
    figure.removeEventListener('pointerleave', rest);
    figure.removeEventListener('pointercancel', rest);
    rest();
  };
}
