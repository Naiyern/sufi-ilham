# Sufi Ilham — Editorial Design System

This is the visual source of truth for the author website. It combines the project's established identity with the UI/UX Pro Max review: **Editorial Grid / Magazine** is the closest style match for a content-rich author archive. The generated generic palette was not adopted; keep the site's own warm paper, ink, and vermilion identity.

## Brand character

- **Purpose:** an author-led home for philosophy, romance, myth, suspense, and the complete book catalogue.
- **Voice:** thoughtful, literary, human, clear; confident without sounding like a SaaS product.
- **Visual idea:** a printed literary journal brought to the web—strong type, generous breathing room, real author/book imagery, quiet rules, and one restrained accent at a time. The cinematic layer is a sequence of full-page editorial scenes, not a film-promo template.
- **Primary journey:** meet the author → discover the latest book → search and browse the archive.
- **Cinematic treatment:** structure the home page as distinct scenes: an opening frame, a cover-art spotlight, a contact-sheet archive, accent-graded series worlds, a documentary author portrait, and a closing intertitle. Use the author's real photography and verified book art; reserve vermilion and antique gold for light, rules, and scene markers. Keep text planes high-contrast and covers legible.

## Tokens

Use the CSS custom properties in `src/styles/global.css`; do not scatter new color literals through components.

| Role | Light | Dark | Token |
|---|---|---|---|
| Paper / page | `#f3f0e9` | `#0e0e0c` | `--paper` |
| Raised paper | `#eae6dc` | `#161613` | `--paper-2` |
| Soft surface | `#ded9cc` | `#1e1e1a` | `--paper-3` |
| Primary ink | `#16150f` | `#ece7db` | `--ink` |
| Supporting ink | `#3a382e` | `#b6b1a3` | `--ink-2` |
| Quiet text | `#6d6a5c` | `#85806f` | `--ink-3` |
| Editorial accent | `#8c2f1d` | `#d4573c` | `--mark` |
| Antique gold | `#9a7420` | `#d9b45e` | `--mark-2` |

Maintain at least 4.5:1 contrast for normal text and keep focus indicators distinct from borders and decorative rules.

## Typography

- **Display:** Instrument Serif for the author name, section titles, book titles, and pull quotes.
- **Reading:** Newsreader Variable for paragraphs and longer editorial copy.
- **Utility:** IBM Plex Mono for labels, metadata, dates, and controls.
- **Urdu:** Noto Nastaliq Urdu where Urdu content is shown.
- Fonts are self-hosted. Keep them local; do not add render-blocking remote font imports.

## Layout and content

- Use a clear editorial grid, fluid widths, and responsive reflow; avoid fixed-width page layouts.
- The homepage opens with the real author portrait, the author name, a concise proposition, a current-release route, and a direct path into the book index.
- Catalogue numbers and the latest release must remain data-derived from `src/data/site.ts` / `src/data/books.json`.
- Make archive discovery useful at catalogue scale: search titles, subtitles, series, genres, languages, availability, and summaries; filter by genre/availability and series; sort by newest, title, or page count; and provide a contextual result count plus a one-action reset/no-results recovery.
- Use supplied author photographs and actual book covers; never invent endorsements, reviews, or publication facts.
- Close each route with the ink colophon: an oversized author signature, data-derived catalogue counts, and clear correspondence, latest-title, series, and legal paths.
- Legal pages use the same paper-and-ink editorial voice: an open title band, a compact contents rail on wide screens, a stacked scrollable contents panel on small screens, readable line lengths, and tables contained in horizontal scrollers.

## Interaction and accessibility

- Interactive controls should be comfortably targetable (44px minimum in this project) with visible hover and keyboard-focus states. The wide-screen chapter rail tracks the scene at the viewport center; on touch and smaller screens it becomes a sticky, horizontally scrollable strip. Keep native anchors and ordinary page scrolling at every size—never hijack vertical scroll.
- Use native buttons and links, meaningful names for icon controls, accurate `aria-expanded` / `aria-pressed` states, and logical tab order.
- Keep keyboard focus inside an open dialog and return it to the invoking control when the dialog closes. A closed off-canvas menu must be inert.
- The page must remain readable when JavaScript is unavailable; scroll reveals are progressive enhancement only.
- Respect `prefers-reduced-motion`; animation is decorative, never required to understand content. Use slow, low-amplitude image drift, one-time frame reveals, and restrained pointer-led light only as progressive enhancement on fine pointers; do not scroll-jack, hide text, or make motion a navigation requirement.
- Sound is opt-in for new visitors. Do not autoplay audio.
- Test the main experience at 375px, 768px, 1024px, and 1440px; prevent horizontal page overflow.

## Avoid

- Generic startup gradients, neon pink accents, decorative glass cards, or a wholesale framework/component-library rewrite.
- Hover-only actions, tiny icon buttons, hidden catalogue search, inaccessible modal/menu states, or motion that conceals content.
- Autoplaying audio, remote font dependencies, stock author imagery, or claims that imply an email service when the form only opens WhatsApp.
