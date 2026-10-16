type Item = { t: string; s: string; u: string; k: string; img: string; lang?: string; dir?: 'rtl' | 'ltr' };

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
      const empty = document.createElement('div');
      empty.className = 'cmdk-empty';
      empty.textContent = 'No matches. Try “time”, “romance” or “Maple”.';
      list.replaceChildren(empty);
      return;
    }

    const rows = results.map((item, i) => {
      const row = document.createElement('a');
      row.className = `cmdk-row${i === active ? ' on' : ''}`;
      row.href = item.u;
      row.dataset.i = String(i);

      if (item.img) {
        const img = document.createElement('img');
        img.src = item.img;
        img.alt = '';
        img.loading = 'lazy';
        row.append(img);
      } else {
        const dot = document.createElement('span');
        dot.className = 'cmdk-dot';
        dot.textContent = item.k.charAt(0);
        row.append(dot);
      }

      const text = document.createElement('span');
      text.className = 'cmdk-tx';
      const title = document.createElement('b');
      title.lang = item.lang || 'en';
      title.dir = item.dir || 'ltr';
      title.textContent = item.t;
      const subtitle = document.createElement('small');
      subtitle.lang = 'en';
      subtitle.textContent = item.s;
      text.append(title, subtitle);

      const kind = document.createElement('span');
      kind.className = 'cmdk-kind';
      kind.textContent = item.k;
      row.append(text, kind);
      return row;
    });
    list.replaceChildren(...rows);
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

  let lastFocus: HTMLElement | null = null;
  const anotherDialogOpen = () => Boolean(document.querySelector('.modal.open, .go-ov.open'));
  const open = () => {
    if (anotherDialogOpen()) return;
    lastFocus = document.activeElement as HTMLElement | null;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    input.value = '';
    search('');
    setTimeout(() => input.focus(), 40);
  };
  const close = () => {
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus?.focus();
    lastFocus = null;
  };

  addEventListener('keydown', (e) => {
    if (!root.classList.contains('open') && anotherDialogOpen()) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      root.classList.contains('open') ? close() : open();
      return;
    }
    const target = e.target as HTMLElement | null;
    const editing = Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
    if (e.key === '/' && !editing) {
      e.preventDefault(); open(); return;
    }
    if (!root.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const focusable = Array.from(root.querySelectorAll<HTMLElement>('input:not([disabled]), a[href], button:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
    if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      const destination = results[active].u;
      close();
      location.href = destination;
    }
  });

  input.addEventListener('input', () => search(input.value));
  list.addEventListener('click', (e) => {
    const mouse = e as MouseEvent;
    if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.button !== 0) return;
    if ((e.target as HTMLElement).closest('.cmdk-row')) close();
  });
  list.addEventListener('mousemove', (e) => {
    const row = (e.target as HTMLElement).closest('.cmdk-row') as HTMLElement | null;
    if (row) { const i = Number(row.dataset.i); if (i !== active) { active = i; render(); } }
  });
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  document.querySelectorAll('[data-cmdk-open]').forEach((b) => b.addEventListener('click', open));
}
