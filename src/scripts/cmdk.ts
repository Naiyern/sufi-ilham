type Item = { t: string; s: string; u: string; k: string; img: string };

export function initCmdk() {
  const root = document.getElementById('cmdk');
  const input = document.getElementById('cmdkInput') as HTMLInputElement | null;
  const list = document.getElementById('cmdkList');
  const dataEl = document.getElementById('cmdkData');
  if (!root || !input || !list || !dataEl) return;

  const items: Item[] = JSON.parse(dataEl.textContent || '[]');
  let results: Item[] = [];
  let active = 0;

  /* fuzzy subsequence score: rewards contiguous + word-start matches */
  const score = (hay: string, needle: string) => {
    const h = hay.toLowerCase();
    const n = needle.toLowerCase();
    if (!n) return 0;
    if (h.startsWith(n)) return 1000;
    const idx = h.indexOf(n);
    if (idx > -1) return 800 - idx + (h[idx - 1] === ' ' ? 60 : 0);
    let i = 0, s = 0, streak = 0;
    for (const ch of h) {
      if (i < n.length && ch === n[i]) { i++; streak++; s += 10 + streak * 4; }
      else streak = 0;
    }
    return i === n.length ? s : -1;
  };

  const render = () => {
    if (!results.length) {
      list.innerHTML = `<div class="cmdk-empty">No matches. Try “time”, “romance” or “Maple”.</div>`;
      return;
    }
    list.innerHTML = results
      .map((r, i) => `
        <a class="cmdk-row${i === active ? ' on' : ''}" href="${r.u}" data-i="${i}">
          ${r.img ? `<img src="${r.img}" alt="" loading="lazy">` : `<span class="cmdk-dot">${r.k[0]}</span>`}
          <span class="cmdk-tx"><b>${r.t}</b><small>${r.s}</small></span>
          <span class="cmdk-kind">${r.k}</span>
        </a>`)
      .join('');
    list.querySelector('.cmdk-row.on')?.scrollIntoView({ block: 'nearest' });
  };

  const search = (q: string) => {
    if (!q.trim()) results = items.slice(0, 8);
    else {
      results = items
        .map((it) => ({ it, sc: Math.max(score(it.t, q), score(it.s, q) - 200, score(it.k, q) - 400) }))
        .filter((x) => x.sc > -1)
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 10)
        .map((x) => x.it);
    }
    active = 0;
    render();
  };

  const open = () => {
    root.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    search('');
    setTimeout(() => input.focus(), 40);
  };
  const close = () => {
    root.classList.remove('open');
    document.body.style.overflow = '';
  };

  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      root.classList.contains('open') ? close() : open();
      return;
    }
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName)) {
      e.preventDefault(); open(); return;
    }
    if (!root.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
    if (e.key === 'Enter' && results[active]) { e.preventDefault(); location.href = results[active].u; }
  });

  input.addEventListener('input', () => search(input.value));
  list.addEventListener('mousemove', (e) => {
    const row = (e.target as HTMLElement).closest('.cmdk-row') as HTMLElement | null;
    if (row) { const i = Number(row.dataset.i); if (i !== active) { active = i; render(); } }
  });
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  document.querySelectorAll('[data-cmdk-open]').forEach((b) => b.addEventListener('click', open));
}
