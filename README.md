# Sufi Ilham — Official Author Website

An original, cinematic multi-page website for **Sufi Ilham** (pen name of MD Naiyer Alam).
The live catalogue in `src/data/books.json` contains **29 published titles** — 28 with Amazon
store links and one free Urdu novella to read online — plus **four forthcoming titles**. The
catalogue spans non-fiction, literary fiction, romance, fantasy, thrillers, and Urdu- and
Hindi-language works. Catalogue data feeds the homepage, search, book pages, series pages and
structured data. Every line of design, copy, code and music here was made for this site — no
templates, no stock, no copied marketing text.

## What's in this folder

| Path | Description |
|---|---|
| `src/pages/` | Astro routes for the homepage, book details, series, contact, legal pages, reader, RSS and sitemap |
| `src/components/`, `src/layouts/` | Shared navigation, book cards/dialogs, command palette, footer and page shell |
| `src/scripts/`, `src/styles/` | Progressive-enhancement interactions and the shared visual system |
| `src/data/books.json` | Catalogue source data; published and upcoming books feed the homepage and detail pages |
| `public/` | Static covers, author photography, the optional soundtrack, reader PDF, icons and crawler files |
| `design-system/sufi-ilham/` | Master design guide and homepage, book-detail and series page overrides |
| `.agents/skills/ui-ux-pro-max/` | Project-local UI/UX Pro Max skill, reference notes and search data |
| `scripts/verify-build.mjs` | Checks routes, redirect stubs, internal links/fragments, unique IDs, one h1 per page and image alt attributes |
| Root `index.html`, route folders and `_astro/` | Generated GitHub Pages output; edit `src/`, then regenerate with `npm run deploy` |

## How to build and publish

This is a static Astro site. Use **Node.js 22.12 or newer** to develop and generate the files
(Astro 7 requirement); GitHub Pages serves the generated output without an application server or
database.

```bash
npm ci
SITE_BASE=/ npm run dev -- --host 0.0.0.0  # local preview
npm run build                              # generate dist/ and verify it
npm test                                   # build, then run catalogue interaction regressions
npm run deploy                             # test, sync and verify GitHub Pages output in the repo root
```

This repository's GitHub Pages site is <https://naiyern.github.io/sufi-ilham/>. Pages serves the
**repository root** of `main` (`build_type: legacy`), so `npm run deploy` copies Astro's `dist/`
output to the root. The deploy script also clears stale hashed `_astro/` bundles before copying.
Running it only prepares files locally; publishing still requires those generated files to reach
the configured Pages branch.

**Trailing slashes matter.** `<base>/<page>/` is the real URL and `<base>/<page>` redirects to it.
Do not add `privacy.html`, `terms.html` or `contact.html` redirect stubs to the root or `public/`:
GitHub Pages can serve such a stub for the extensionless URL too, causing a self-redirect loop.
The build verifier rejects redirect stubs and broken internal links.

For another static host, publish the generated `dist/` output (or the synchronized repository root),
not the Astro source tree alone.

## Signature features

- **Author-led editorial homepage** — real portrait, latest-release card, live catalogue proof
  points, recently published books and a visible search field for the full index.
- **Catalogue discovery** — multi-field search across titles, summaries, series and availability;
  genre/series filters; newest, alphabetical and page-count sorting; live result counts and reset
  recovery; keyboard-operable controls; dedicated book and series routes.
- **Amazon handoff** — store links show a brief, cancellable book interstitial before opening the
  selected Amazon destination in a new tab.
- **Accessible interactions** — responsive navigation, command palette (`/` or `Cmd/Ctrl+K`),
  dialog focus handling, visible keyboard focus, large mobile targets and reduced-motion support.
- **Preferences that respect visitors** — warm paper/ink/vermilion styling, optional dark theme,
  and an ambient soundtrack that starts only after an explicit opt-in. The choice is remembered.
- **Static-site essentials** — generated metadata and structured data, RSS, sitemap, a styled 404,
  web manifest, and content that remains readable when JavaScript is unavailable.
- **Honest release requests** — the optional form opens a pre-filled WhatsApp message; it does not
  subscribe the visitor to an automated email list.

## The soundtrack

`public/sama.mp3` is an original ambient piece written for this site — nothing sampled,
every sound synthesised from scratch. It is built on **Maqam Hijaz** (the mode with
the augmented second that gives Sufi and Middle-Eastern music its devotional colour),
played in free rhythm with no fixed beat:

- a tanpura-like drone on D and A that slowly beats and breathes
- a ney (reed flute) line with breath noise and portamento between notes
- bowed swells underneath, in the low octave
- a daf frame-drum heartbeat on a 4.5-second breath cycle, very soft
- a distant wordless "hu" pad through the middle section

It runs 5 minutes 52 seconds and loops seamlessly. New visitors start in silence;
playback is an explicit opt-in, the audio is not preloaded, and the preference is
remembered across pages and visits.

## Recent improvements

- Installed UI/UX Pro Max and created the project-specific editorial design guide while keeping
  the existing warm palette and self-hosted type.
- Rebuilt the homepage opening as a dark ink-cover with a legible floating masthead, vivid author
  portrait, warm-paper release slip and stronger featured-book cards; the archive below stays on
  the established paper palette.
- Expanded the cinematic language across the whole homepage: an eight-scene chapter rail that becomes a touch-scrollable sticky strip on smaller screens, a latest-cover-lit release stage, tactile archive contact sheet, accent-graded series worlds, documentary author chapter and closing intertitle. Series cover art stays in the mobile scene; page transitions and motion honor reduced-motion settings, while sound stays opt-in.
- Removed the blocking first-visit welcome screen so visitors reach the author and books immediately.
- Turned the full index into a responsive, cover-led catalogue; search covers titles, transliterations
  and related metadata, while each tile remains a real book link when JavaScript is off.
- Rebuilt book and series detail pages around their actual covers, reading order, editions and related
  titles; series accents now come from the catalogue data. Shared route transitions, correspondence
  framing, legal title cards and the ink colophon carry the same cinematic finish beyond the homepage.
- Kept the latest-release feature and catalogue metrics data-driven, with search and filters visible
  beside the full book index.
- Expanded catalogue search to summaries and language metadata; added series filtering, three sort
  orders, live counts and no-results recovery, with forthcoming books kept at the end of every sort.
- Clarified Kindle Unlimited as subscription inclusion rather than “free,” and removed the
  unsupported “Most Talked About” popularity claim.
- Added `npm test` for generated-catalogue DOM regressions across combined filters, sorting,
  reset/no-results recovery, focus handling and responsive control rules.
- Improved keyboard and mobile behavior for navigation, command search, book details and forms;
  retained no-JavaScript content and reduced-motion handling.
- Updated the Privacy Policy and Terms to describe the WhatsApp request flow accurately: WhatsApp
  receives the pre-filled link when opened; the author receives the message only if the visitor
  sends it.
- Made `npm run deploy` replace old hashed `_astro/` bundles before copying the fresh static
  output, avoiding stale generated assets in the Pages root.
- Upgraded Astro to 7.3.8 for the current security fixes, updated vulnerable transitive packages,
  and moved the optional photo workflow to Node 22; `npm audit` now reports zero vulnerabilities.

## Design direction and UI skill

The **UI/UX Pro Max** skill is installed project-locally at `.agents/skills/ui-ux-pro-max/`
for universal agent support. The skill is MIT-licensed; its source is
<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>. The working design guide is
`design-system/sufi-ilham/MASTER.md` plus page overrides for homepage, book detail and series detail:
a warm editorial archive that keeps the existing self-hosted type and paper/ink/vermilion palette
intact. If the skill files need refreshing, run
`npx ui-ux-pro-max-cli@latest init --ai universal` from the project root.

## The Maple Falls Romance series

Five small-town romances set in Maple Falls, Vermont. All five are available through Kindle
and Kindle Unlimited. The homepage features the series in its editorial spreads; the dedicated
series route is `/series/maple/`, with individual book-detail pages and a reading order.

| # | Title | ASIN | Pages | Published |
|---|---|---|---|---|
| 1 | The Bookshop at the End of Maple Street | B0HDSLBTX7 | 123 | 17 Aug 2026 |
| 2 | A Recipe for Maple Falls | B0HFKCQXS4 | 76 | 17 Aug 2026 |
| 3 | The Christmas Letters of Maple Falls | B0HFMFQW2C | 78 | 18 Aug 2026 |
| 4 | A Second Chance in Maple Falls | B0HFP1KFF1 | 68 | 18 Aug 2026 |
| 5 | A Wedding at the End of Maple Street | B0HFNWTV82 | 76 | 18 Aug 2026 |

Amazon series page: <https://www.amazon.com/dp/B0H7Q6GQPV>

## The Tithe Crown

A complete dark gothic romantasy trilogy. The Crown cuts magic from any soul that will not
declare it — and sends its own collectors after every shadow that hides. The homepage features
the series in its editorial spreads; the dedicated route is `/series/tithe/`, with a reading
order and individual book-detail pages.

| # | Title | ASIN | Pages | Published |
|---|---|---|---|---|
| 1 | The Shadow Tithe: A Dark Gothic Romantasy | B0HGBM3WX2 | 222 | 24 Aug 2026 |
| 2 | The Sea Tithe: A Dark Gothic Romantasy | B0HGF5G8QM | 247 | 25 Aug 2026 |
| 3 | The Crown Always Owns: A Dark Gothic Romantasy | B0HGG8N7VD | 260 | 25 Aug 2026 |

Amazon series page: <https://www.amazon.com/dp/B0HGBX47WJ>

## The River's Portion

A standalone literary novel of tawbah, debt, and the rights of the living, set in the fictional
town of Nahrabad. Included in Kindle Unlimited and also available in paperback.

| Title | Kindle ASIN | Paperback ASIN | Pages | Published |
|---|---|---|---|---|
| The River's Portion | B0HG5S4DG2 | B0HG787946 | 243 | 22 Aug 2026 (Kindle) / 23 Aug 2026 (paperback) |

**One note on the covers.** Local cover artwork and author photos live in `src/assets/` and
`public/images/`; many newer covers are served from Amazon's image CDN. The shared `Cover.astro`
component falls back to a typographic placeholder if a remote cover is slow or unavailable, so a
failed image does not break the layout.

## The Cartographers of Lost Tomorrows

A seven-book slow-burn romance and impossible-mystery saga. “Seven books. One harbor. Two
hundred years of kept promises — and every one of them is coming due.” Books 1–3 are published;
Books 4–7 are marked as forthcoming in the catalogue. The dedicated series route is
`/series/carto/`.

| # | Title | ASIN | Pages | Published |
|---|---|---|---|---|
| 1 | The Map of Tomorrow | B0HJH4MH5D | 272 | 11 Sept 2026 |
| 2 | The Tide of Unmade Days | B0HJMJWG6S | 219 | 12 Sept 2026 |
| 3 | The Compass of the Dead | B0HJNDGLH1 | 268 | 13 Sept 2026 |
| 4 | The Library of Drowned Days | — | — | Coming soon |
| 5 | The Seven Unwritten Days | — | — | Coming soon |
| 6 | The Last Cartographer | — | — | Coming soon |
| 7 | The Future We Buried | — | — | Coming soon |

Amazon series page: <https://www.amazon.com/dp/B0HJHF6Y1P>

## The Song of the Unbroken Sky

A complete mythic-romance trilogy of Valen and Elora — devotion, destiny, and the melody
that awakens the living earth. The dedicated series route is `/series/song/`, with all three
books linked in reading order.

| # | Title | ASIN | Pages | Published |
|---|---|---|---|---|
| 1 | The Eden of Sunspire | B0HHZN5D7P | 96 | 6 Sept 2026 |
| 2 | The Citadel of Sapphire Seas | B0HJ1JQRMT | 93 | 7 Sept 2026 |
| 3 | The Chariot of Peace | B0HJ1R5LY6 | 80 | 7 Sept 2026 |

Amazon series page: <https://www.amazon.com/dp/B0HHWGYSPL>

## The Quiet Tenancy

A standalone psychological thriller. Cassie Adler is paid to live ninety days in a Brooklyn
Heights brownstone and notice everything — then the house starts keeping a schedule of its own.
Available on Kindle and in paperback, with Kindle Unlimited. It shares its publication day with
*The Spare Key Summer* (21 Sept 2026); the catalogue’s latest entries are Darya and the Hindi
Nasruddin title, published 29 Sept 2026.

| Title | Kindle ASIN | Paperback ASIN | Pages | Published |
|---|---|---|---|---|
| The Quiet Tenancy | B0HKK6RFRS | B0HKKKG6RM | 278 | 21 Sept 2026 |

## The Spare Key Summer

A standalone contemporary romance novel (not a series): Nora Sullivan returns to Milwaukee
for one summer and meets Eli Mercer. It is available in Kindle and paperback editions and remains
listed in the searchable catalogue alongside the other recently published books.

| Title | Kindle ASIN | Paperback ASIN | Pages | Published |
|---|---|---|---|---|
| The Spare Key Summer | B0HKHL8D6Q | B0HKKCX4H9 | 234 | 21 Sept 2026 |

## Published catalogue: 29 titles

The catalogue currently contains **28 Amazon-linked titles and one free online Urdu novella**.
Page counts and edition details below follow `src/data/books.json`; the full live record is the
source of truth when a retail listing changes.

1. **Darya Ka Aik Hissa** (دریا کا ایک حصہ) — Urdu novella · free to read online
2. **Nasruddin Ki Tedhi Tarazu** (नसरुद्दीन की टेढ़ी तराज़ू) — Hindi historical-folkloric novel · Kindle
3. **The Quiet Tenancy** — 278 pp · psychological thriller · Kindle and paperback
4. **The Human Operating Manual** — 383 pp
5. **Moh Tera Prem: Where Attachment Ends and Love Begins** — 211 pp
6. **PREM: The Ancient Path of Selfless, Unconditional Love** — 285 pp
7. **Laozi: The Man Who Disappeared into the Dao** — 318 pp
8. **The Wall Was a Gesture** — 334 pp
9. **The Map Is Finished** — 320 pp
10. **NeuroFocus Protocol** — 362 pp
11. **Fractured Time** — 56 pp
12. **Belief Unveiled** — 66 pp
13. **The Infinite Classroom** — 76 pp
14. **The River's Portion** — 243 pp · paperback edition also listed
15. **The Bookshop at the End of Maple Street** — 123 pp · Maple Falls #1
16. **A Recipe for Maple Falls** — 76 pp · Maple Falls #2
17. **The Christmas Letters of Maple Falls** — 78 pp · Maple Falls #3
18. **A Second Chance in Maple Falls** — 68 pp · Maple Falls #4
19. **A Wedding at the End of Maple Street** — 76 pp · Maple Falls #5
20. **The Shadow Tithe** — 222 pp · Tithe Crown #1
21. **The Sea Tithe** — 247 pp · Tithe Crown #2
22. **The Crown Always Owns** — 260 pp · Tithe Crown #3
23. **The Map of Tomorrow** — 272 pp · Cartographers #1
24. **The Tide of Unmade Days** — 219 pp · Cartographers #2
25. **The Compass of the Dead** — 268 pp · Cartographers #3
26. **The Eden of Sunspire** — 96 pp · Unbroken Sky #1
27. **The Citadel of Sapphire Seas** — 93 pp · Unbroken Sky #2
28. **The Chariot of Peace** — 80 pp · Unbroken Sky #3
29. **The Spare Key Summer** — 234 pp · standalone contemporary romance

### Forthcoming (not included in the 29 published titles)

- *The Library of Drowned Days*
- *The Seven Unwritten Days*
- *The Last Cartographer*
- *The Future We Buried*

## Contact

Phone / WhatsApp: **+91 62017 57330** · Bihar, India · Available worldwide
Instagram: **@Sufiilham07** (author) · **@naiyer_fx** (personal)

## Main portrait — exact image workflow

The build-time resolver selects the most recently modified file named
`public/images/sufi-ilham-portrait.{png,jpg,jpeg,webp}`. The source bytes are not processed during
build; CSS may crop the portrait to fit the hero or gallery frame on screen.

- Replace locally with `node scripts/replace-portrait.mjs /path/to/photo.png`, then run
  `npm run deploy`. The script copies the original bytes into the source, public and legacy image
  locations and removes stale portrait variants.
- Optional GitHub automation: copy `docs/rebuild-on-photo-upload.yml` to
  `.github/workflows/` to rebuild and commit the generated site when a portrait changes. Review
  the workflow's write permission and branch behavior before enabling it.
