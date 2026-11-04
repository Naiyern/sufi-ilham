/* The rotation behind the reading room's wall.

   The page ships one line already in its HTML (so the quote is there without
   JavaScript, and without a flash of empty space). This module then does what
   a static page cannot: it opens on a *different* line every visit, advances
   on its own while the visitor is reading, and offers a deliberate "another
   line" for anyone who wants to keep turning the page.

   The deck is fetched as JSON rather than imported, so the collection never
   weighs on the bundle, and nothing here runs unless the page has a stage. */

type Quote = { text: string; author: string; source: string };

/** Type size is chosen from length, so a long line is not set as a headline. */
const bucketOf = (text: string): 'short' | 'medium' | 'long' =>
  (text.length > 170 ? 'long' : text.length > 90 ? 'medium' : 'short');

const STAGE_PERIOD = 22000;
const QUIET_PERIOD = 40000;

export function initQuotes(doc: Document = document) {
  const stages = Array.from(doc.querySelectorAll<HTMLElement>('[data-quote-stage]'));
  if (!stages.length) return;

  const feed = stages[0].dataset.quoteFeed;
  if (!feed) return;

  // the page's own window: it is `window` in a browser, and whatever the
  // document belongs to in a test
  const view = doc.defaultView ?? window;
  const reduce = view.matchMedia('(prefers-reduced-motion: reduce)');
  const recent: string[] = [];
  let deck: Quote[] = [];

  stages.forEach((stage) => {
    const text = stage.querySelector<HTMLElement>('[data-quote-text]');
    if (text?.textContent) recent.push(text.textContent.trim());
  });

  const remember = (text: string) => {
    recent.push(text);
    if (recent.length > 14) recent.shift();
  };

  const buildCredit = (quote: Quote) => {
    const dash = doc.createElement('span');
    dash.setAttribute('aria-hidden', 'true');
    dash.textContent = '— ';
    const sep = doc.createElement('span');
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = ' · ';
    const cite = doc.createElement('cite');
    cite.textContent = quote.source;
    return [dash, `${quote.author}`, sep, cite];
  };

  const paint = (stage: HTMLElement, quote: Quote, animate = true) => {
    const text = stage.querySelector<HTMLElement>('[data-quote-text]');
    const credit = stage.querySelector<HTMLElement>('[data-quote-credit]');
    if (!text || !credit) return;

    const apply = () => {
      text.textContent = quote.text;
      text.dataset.len = bucketOf(quote.text);
      credit.replaceChildren(...buildCredit(quote));
      stage.dataset.quoteLen = text.dataset.len;
    };

    if (!animate || reduce.matches) {
      apply();
      return;
    }

    stage.classList.add('is-swapping');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      apply();
      requestAnimationFrame(() => stage.classList.remove('is-swapping'));
    };
    text.addEventListener('transitionend', finish, { once: true });
    // a transitionend that never fires (hidden tab, reduced motion mid-flight)
    // must not leave the stage blank
    view.setTimeout(finish, 700);
  };

  /** A line that has not been on screen recently, if the deck allows it. */
  const draw = (): Quote | null => {
    if (!deck.length) return null;
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const candidate = deck[Math.floor(Math.random() * deck.length)];
      if (!recent.includes(candidate.text)) {
        remember(candidate.text);
        return candidate;
      }
    }
    return deck[Math.floor(Math.random() * deck.length)];
  };

  const advance = (stage: HTMLElement, animate = true) => {
    const quote = draw();
    if (quote) paint(stage, quote, animate);
  };

  /* Timers exist only while a stage is on screen and the tab is awake: a line
     should not turn over in a tab nobody is looking at. */
  const timers = new Map<HTMLElement, number>();
  const periodFor = (stage: HTMLElement) =>
    (stage.classList.contains('closing-quote') ? STAGE_PERIOD : QUIET_PERIOD);

  const start = (stage: HTMLElement) => {
    if (timers.has(stage) || !deck.length) return;
    timers.set(stage, view.setInterval(() => {
      if (!doc.hidden) advance(stage);
    }, periodFor(stage)));
  };

  const stop = (stage: HTMLElement) => {
    const timer = timers.get(stage);
    if (timer !== undefined) {
      view.clearInterval(timer);
      timers.delete(stage);
    }
  };

  if ('IntersectionObserver' in view) {
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const stage = entry.target as HTMLElement;
        if (entry.isIntersecting) start(stage);
        else stop(stage);
      });
    }, { threshold: 0.15 });
    stages.forEach((stage) => watcher.observe(stage));
  } else {
    stages.forEach((stage) => start(stage));
  }

  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) stages.forEach(stop);
  });

  /* The deliberate turn. */
  stages.forEach((stage) => {
    const button = stage.querySelector<HTMLButtonElement>('[data-quote-next]');
    button?.addEventListener('click', () => {
      advance(stage);
      stop(stage);
      start(stage);
    });
  });

  /* The deck arrives after the page does; the moment it lands, every stage
     turns to a line the visitor has not seen, which is the point of it. */
  const load = async () => {
    try {
      const response = await view.fetch(feed);
      if (!response.ok) return;
      const parsed: unknown = await response.json();
      if (!Array.isArray(parsed)) return;
      deck = parsed.filter((item): item is Quote => Boolean(
        item
        && typeof (item as Quote).text === 'string'
        && typeof (item as Quote).author === 'string'
        && typeof (item as Quote).source === 'string',
      ));
      if (deck.length < 2) return;
      stages.forEach((stage) => advance(stage, true));
      stages.forEach((stage) => {
        // observed stages start themselves; the rest wait for their turn
        if (!('IntersectionObserver' in view)) start(stage);
      });
    } catch {
      /* offline, blocked, or a stale cache: the line already on the page stays */
    }
  };

  load();

  /* the caller may need to put the wall back to sleep (tests, teardown) */
  return () => stages.forEach(stop);
}
