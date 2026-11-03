/* A shared open/close switch for the three overlays that live in the document
   from first paint (book sheet, command palette, Amazon hand-off).
   `aria-hidden` hides a panel from assistive tech but leaves every control
   inside it in the tab order, so a keyboard visitor would tab into an invisible
   dialog. `inert` closes that hole: it removes the subtree from the tab order,
   the accessibility tree and hit-testing in one attribute. The markup ships
   with `inert` already set, so the overlays are closed even before this module
   runs (or if it never does). */
export function setDialogOpen(el: Element | null, open: boolean) {
  if (!el) return;
  el.classList.toggle('open', open);
  el.setAttribute('aria-hidden', String(!open));
  el.toggleAttribute('inert', !open);
}
