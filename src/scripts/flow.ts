/* A quiet flow interface over the page's real structure.

   There is no scroll-jacking, router, canvas, or layout spacer here. The script
   only observes ordinary scrolling and paints a fixed chapter readout. All the
   content remains readable with JavaScript off and the readout is hidden when
   reduced motion is requested. */

const SCENES = [
  'main > section:not(.my-shelf)',
  'main > #series > section',
  'main > #bookBody > .book-hero',
  'main > #bookBody > .book-content',
  'main > .legal-page > .legal-hero',
  'main > .legal-page > .legal-body',
  'body > .next-chapter',
  'body > .colophon',
].join(',');

const INK_SCENES = [
  '.editorial-hero', '.cosmos', '.cinema-reel', '.series-spread',
  '.author-chapter', '.closing-quote', '.book-hero', '.s-hero',
  '.discover-hero', '.discover-finale', '.correspondence-chapter',
  '.legal-hero', '.not-found', '.colophon',
].join(',');

const compact = (value: string) => value.replace(/\s+/g, ' ').trim();
const labelFor = (scene: HTMLElement, index: number) => {
  const explicit = scene.dataset.flowLabel;
  if (explicit) return compact(explicit);
  const heading = scene.querySelector<HTMLElement>('h1, h2');
  const text = compact(heading?.innerText || heading?.textContent || '');
  if (!text) return `Scene ${index + 1}`;
  return text.length > 34 ? `${text.slice(0, 33).trimEnd()}…` : text;
};
const number = (value: number) => String(value).padStart(2, '0');

export function initFlow(doc: Document = document, view: Window = doc.defaultView ?? window) {
  const hud = doc.getElementById('flowHud');
  if (!hud) return () => {};

  const scenes = Array.from(doc.querySelectorAll<HTMLElement>(SCENES))
    .filter((scene) => !scene.hidden);
  if (!scenes.length) return () => {};

  const current = hud.querySelector<HTMLElement>('[data-flow-current]');
  const total = hud.querySelector<HTMLElement>('[data-flow-total]');
  const label = hud.querySelector<HTMLElement>('[data-flow-label]');
  const labels = scenes.map(labelFor);

  scenes.forEach((scene, index) => {
    scene.classList.add('flow-scene');
    scene.dataset.flowScene = number(index + 1);
    scene.dataset.flowTone = scene.matches(INK_SCENES) ? 'ink' : 'paper';
  });
  if (total) total.textContent = number(scenes.length);

  let active: HTMLElement | undefined;
  let frame = 0;

  const update = () => {
    frame = 0;
    const available = scenes.filter((scene) => !scene.hidden);
    if (!available.length) return;

    const viewport = view.innerHeight || 800;
    const anchor = viewport * .42;
    const geometry = available.map((scene) => ({ scene, rect: scene.getBoundingClientRect() }));
    let next = geometry.find(({ rect }) => rect.top <= anchor && rect.bottom > anchor)?.scene;

    // Between two scenes, choose the nearest heading edge. This also gives a
    // deterministic first scene in DOM emulators that do not implement layout.
    if (!next) {
      next = geometry.reduce((nearest, candidate) => (
        Math.abs(candidate.rect.top - anchor) < Math.abs(nearest.rect.top - anchor)
          ? candidate
          : nearest
      )).scene;
    }

    if (next !== active) {
      active?.classList.remove('is-flow-current');
      active = next;
      active.classList.add('is-flow-current');
      const index = scenes.indexOf(active);
      if (current) current.textContent = number(index + 1);
      if (label) label.textContent = labels[index];
      hud.dataset.tone = active.dataset.flowTone || 'paper';
    }

    const root = doc.documentElement;
    const top = view.scrollY || root.scrollTop || 0;
    const distance = Math.max(0, root.scrollHeight - viewport);
    const progress = distance > 0 ? Math.min(1, Math.max(0, top / distance)) : 0;
    hud.style.setProperty('--flow-p', progress.toFixed(4));
  };

  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(update);
  };

  view.addEventListener('scroll', schedule, { passive: true });
  view.addEventListener('resize', schedule, { passive: true });
  doc.documentElement.classList.add('flow-ready');
  update();

  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    view.removeEventListener('scroll', schedule);
    view.removeEventListener('resize', schedule);
    doc.documentElement.classList.remove('flow-ready');
    scenes.forEach((scene) => scene.classList.remove('is-flow-current'));
  };
}
