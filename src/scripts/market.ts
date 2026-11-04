/* Amazon marketplaces, from the visitor's point of view.

   The same book is sold in five stores, but a link to amazon.com is little use
   to a reader in Pune or Perth. Every store is already in the HTML (so the
   page works without JavaScript and search engines see all of them); this
   module only promotes the visitor's own store to the top of the list, badges
   it, and points the primary buy button at it. */

const REGION_MARKET: Record<string, string> = {
  US: 'us',
  GB: 'uk',
  UK: 'uk',
  IN: 'in',
  CA: 'ca',
  AU: 'au',
};

/** `['en-GB', 'en']` → 'uk'. Returns null when no Amazon store matches. */
export function detectMarket(languages: readonly string[]): string | null {
  for (const tag of languages) {
    const parts = String(tag).replace(/_/g, '-').split('-');
    // skip the language subtag: the region is always a later one
    for (let i = 1; i < parts.length; i += 1) {
      const market = REGION_MARKET[parts[i].toUpperCase()];
      if (market) return market;
    }
  }
  return null;
}

/** Put the visitor's store first, badge it, and retarget the buy buttons. */
export function initMarkets(
  doc: Document = document,
  languages: readonly string[] = navigator.languages?.length ? navigator.languages : [navigator.language],
) {
  const market = detectMarket(languages);
  if (!market) return null;

  for (const list of doc.querySelectorAll<HTMLElement>('[data-stores]')) {
    const items = Array.from(list.querySelectorAll<HTMLElement>('[data-market]'));
    const local = items.find((item) => item.dataset.market === market);
    if (!local) continue;
    list.prepend(local);
    local.classList.add('is-local');
    local.querySelector<HTMLElement>('[data-local-badge]')?.removeAttribute('hidden');
  }

  for (const button of doc.querySelectorAll<HTMLAnchorElement>('[data-buy]')) {
    const url = button.dataset[market];
    if (!url) continue;
    const label = button.dataset[`${market}Label`];
    button.href = url;
    if (label) {
      const target = button.querySelector<HTMLElement>('[data-buy-label]') ?? button;
      target.textContent = label;
    }
  }

  doc.documentElement.dataset.market = market;
  return market;
}
