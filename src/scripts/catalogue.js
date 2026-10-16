/**
 * Progressive catalogue search/filter/sort behavior.
 * Kept separate so the real DOM interactions can be regression-tested in Node.
 * @param {Document} doc
 */
export function initCatalogue(doc = document) {
  const grid = doc.querySelector('#bookGrid');
  if (!grid) return;

  const rows = Array.from(grid.querySelectorAll('.book-tile'));
  const chips = Array.from(doc.querySelectorAll('.fbtn[data-filter]'));
  const search = doc.querySelector('#bookSearch');
  const seriesFilter = doc.querySelector('#seriesFilter');
  const sortSelect = doc.querySelector('#bookSort');
  const empty = doc.querySelector('#bookEmpty');
  const count = doc.querySelector('#fcount');
  const reset = doc.querySelector('#catalogReset');
  let filter = 'all';

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const normalize = (value) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const searchable = new Map(rows.map((row) => [row, normalize(row.dataset.search || '')]));
  const originalOrder = (a, b) => Number(a.dataset.order || 0) - Number(b.dataset.order || 0);

  const sortRows = () => {
    const mode = sortSelect?.value || 'newest';
    const ordered = [...rows].sort((a, b) => {
      const aSoon = a.dataset.comingSoon === 'true';
      const bSoon = b.dataset.comingSoon === 'true';
      if (aSoon !== bSoon) return aSoon ? 1 : -1;
      if (mode === 'title') {
        return collator.compare(a.dataset.sortTitle || '', b.dataset.sortTitle || '') || originalOrder(a, b);
      }
      if (mode === 'pages') {
        const aPages = Number(a.dataset.pages) || Number.POSITIVE_INFINITY;
        const bPages = Number(b.dataset.pages) || Number.POSITIVE_INFINITY;
        return aPages - bPages || originalOrder(a, b);
      }
      return originalOrder(a, b);
    });
    const fragment = doc.createDocumentFragment();
    ordered.forEach((row) => fragment.append(row));
    grid.append(fragment);
  };

  const apply = () => {
    const query = normalize((search?.value || '').trim());
    const terms = query ? query.split(/\s+/) : [];
    const series = seriesFilter?.value || 'all';
    let shown = 0;

    rows.forEach((row) => {
      const tags = (row.dataset.tags || '').split(/\s+/);
      const matchesGenre = filter === 'all' || tags.includes(filter);
      const matchesSeries = series === 'all' || row.dataset.series === series;
      const haystack = searchable.get(row) || '';
      const matchesQuery = terms.every((term) => haystack.includes(term));
      const visible = matchesGenre && matchesSeries && matchesQuery;
      row.style.display = visible ? '' : 'none';
      if (visible) shown++;
    });

    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = `Showing ${shown} of ${rows.length} titles`;
    if (reset) {
      reset.hidden = filter === 'all' && !query && series === 'all' && (sortSelect?.value || 'newest') === 'newest';
    }
  };

  const resetCatalogue = () => {
    filter = 'all';
    if (search) search.value = '';
    if (seriesFilter) seriesFilter.value = 'all';
    if (sortSelect) sortSelect.value = 'newest';
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String((chip.dataset.filter || 'all') === 'all')));
    sortRows();
    apply();
    search?.focus();
  };

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      chips.forEach((item) => item.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      filter = chip.dataset.filter || 'all';
      apply();
    }),
  );
  search?.addEventListener('input', apply);
  seriesFilter?.addEventListener('change', apply);
  sortSelect?.addEventListener('change', () => {
    sortRows();
    apply();
  });
  doc.querySelectorAll('.js-catalog-reset').forEach((button) => button.addEventListener('click', resetCatalogue));
}
