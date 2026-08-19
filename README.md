# Sufi Ilham — Official Author Website

An original, cinematic multi-page website for **Sufi Ilham** (pen name of MD Naiyer Alam),
author of 15 titles on Amazon — ten works of philosophy, spirituality and self-discovery plus the
five-book **Maple Falls Romance** series. Every line of design, copy, code and music here
was made for this site — no templates, no stock, no copied marketing text.

## What's in this folder

| File | Description |
|---|---|
| `index.html` | Homepage — hero, 10-book library with live filters, the Maple Falls Romance series section, about, themes, contact strip |
| `contact.html` | Contact page — phone, WhatsApp, message form, 5-item FAQ |
| `privacy.html` | Privacy Policy — 16 sections with sticky table of contents |
| `terms.html` | Terms of Use — 15 sections, governing law: Bihar, India |
| `404.html` | Styled not-found page (GitHub Pages serves it automatically) |
| `assets/site.css` | **Shared stylesheet for every page** — downloaded once, then cached |
| `assets/site.js` | **Shared script** — engine, four-language system, Amazon interstitial, soundtrack |
| `assets/icon*.png`, `favicon.ico` | Favicon, Apple touch icon and PWA icons |
| `site.webmanifest` | Web app manifest (installable, correct name and theme colour) |
| `images/` | 3 author photos + 8 book covers |
| `sama.mp3` | Original Sufi ambient soundtrack, 5:52 (3.4 MB) |
| `robots.txt` / `sitemap.xml` | Search engine files |
| `.nojekyll` | Tells GitHub Pages to publish the files as-is |

The CSS and JavaScript used to be pasted inline into all four pages. They now live in
`assets/`, so the browser fetches them once and every page after the first is close to
instant. Page-specific rules (the contact form, for instance) stay inline in that page.

## How to publish it

The site is 100% static — no server code, no database, no build step.

**Netlify (easiest, free):** go to https://app.netlify.com/drop and drag this whole
folder onto the page. It goes live in about 20 seconds.

**Vercel:** https://vercel.com/new → import or drag the folder.

**GitHub Pages (this repo):** already live at <https://naiyern.github.io/sufi-ilham/> —
pushing to `main` rebuilds it automatically.

**Any web host / cPanel:** upload the contents of this folder to `public_html`.

Keep all files together in the same folder so `sama.mp3` and the page links resolve.

## Signature features

- **Four languages** — English, हिन्दी, اردو and Hinglish. Urdu switches the entire layout
  to right-to-left. Your choice follows you across every page.
- **Cinematic Amazon routing** — clicking any store link opens an interstitial showing the
  book cover and a progress bar, then delivers the reader to the correct Amazon store in a
  new tab. All 30 links (15 books × amazon.com and amazon.in) are wired the same way.
- **Series shelf** — the Maple Falls Romance section has its own maple-warm palette, a
  reading-order strip and five numbered cards, and the homepage counters now read
  15 titles · 2,832 pages · 11 free on Kindle Unlimited.
- **Motion design** — custom cursor, drifting dust canvas, scroll progress bar, staggered
  reveals, preloader, and a full reduced-motion mode for visitors who prefer less animation.

## The soundtrack

`sama.mp3` is an original ambient piece written for this site — nothing sampled,
every sound synthesised from scratch. It is built on **Maqam Hijaz** (the mode with
the augmented second that gives Sufi and Middle-Eastern music its devotional colour),
played in free rhythm with no fixed beat:

- a tanpura-like drone on D and A that slowly beats and breathes
- a ney (reed flute) line with breath noise and portamento between notes
- bowed swells underneath, in the low octave
- a daf frame-drum heartbeat on a 4.5-second breath cycle, very soft
- a distant wordless "hu" pad through the middle section

It runs 5 minutes 52 seconds and loops seamlessly. It starts on its own at low
volume and fades in over four seconds; browsers that block autoplay start it on the
visitor's first tap or scroll. The speaker button in the navigation turns it off,
and that choice is remembered across pages and visits.

## Recent polish

- **Shared assets.** The stylesheet and script were lifted out of all four pages into
  `assets/site.css` and `assets/site.js`. `index.html` went from 198 KB to 63 KB and the three
  sub-pages from ~93 KB to ~14 KB each; after the first page the browser reuses the cache.
- **The soundtrack no longer pre-downloads.** `sama.mp3` was set to `preload="auto"`, so every
  visit pulled 3.4 MB before the page was usable. It is now `preload="none"` and fetched only
  when the music actually starts.
- **Privacy Policy rewritten to match reality** — it previously claimed there were no analytics
  and no newsletter, while the site runs cookie-free Plausible analytics and a Buttondown
  subscribe box. It now documents both, plus the two local-storage preference keys, a
  sub-processor table, retention periods and DPDP/GDPR/CCPA rights.
- **Terms of Use** gained a newsletter clause and a privacy clause, lists all fifteen titles
  (it stopped at eight), and reserves rights against AI training and bulk scraping.
- Real favicon, Apple touch icon, PWA manifest and a styled `404.html`.
- `preconnect` hints for the analytics and Amazon image origins; the hero portrait is
  preloaded as the LCP image, and sub-pages finally have Open Graph / Twitter cards.
- Fixed a `prefers-reduced-motion` block that was nested inside a phone-only media query so it
  never applied on desktop, and a stray `}` that truncated the contact page's CSS.
- Palette lifted out of near-black to a warm charcoal so the site stays legible on
  phone screens and in daylight; body text, borders and gold accents all brightened.
- Added a two-photo gallery under the author portrait: the flute portrait ("The flute ·
  today") and the childhood photograph ("Where it began"), warm-toned to match.
- Mobile: larger body text, 44px minimum tap targets, softer vignette, no overflow at 390px.

## The Maple Falls Romance series

Five small-town romances set in Maple Falls, Vermont. All five are $2.99 on Kindle and
free on Kindle Unlimited. They live in their own section on the homepage (`#maple`),
with a reading-order strip, per-book "Read More" modals and the usual Amazon interstitial.

| # | Title | ASIN | Pages | Published |
|---|---|---|---|---|
| 1 | The Bookshop at the End of Maple Street | B0HDSLBTX7 | 123 | 17 Aug 2026 |
| 2 | A Recipe for Maple Falls | B0HFKCQXS4 | 76 | 17 Aug 2026 |
| 3 | The Christmas Letters of Maple Falls | B0HFMFQW2C | 78 | 18 Aug 2026 |
| 4 | A Second Chance in Maple Falls | B0HFP1KFF1 | 68 | 18 Aug 2026 |
| 5 | A Wedding at the End of Maple Street | B0HFNWTV82 | 76 | 18 Aug 2026 |

Amazon series page: <https://www.amazon.com/dp/B0H7Q6GQPV>

**One note on the covers.** The eight older covers and the three author photos are real files
in `images/`. The five Maple Falls covers and the two newer love books (Moh Tera Prem, PREM)
are loaded straight from Amazon's image CDN
(`https://m.media-amazon.com/images/I/<id>._SL500_.jpg`), which is always the live cover Amazon
is showing. If a cover ever fails to load, `mfCover()` / `phCover()` in `index.html` swap in a
styled placeholder so the layout never breaks.

## The books

1. The Human Operating Manual — 383 pp · most popular
2. Moh Tera Prem: Where Attachment Ends and Love Begins — 211 pp · new
3. PREM: The Ancient Path of Selfless, Unconditional Love — 285 pp · new
4. Laozi: The Man Who Disappeared into the Dao — 318 pp
5. The Wall Was a Gesture — 334 pp
6. The Map Is Finished — 320 pp
7. NeuroFocus Protocol — 362 pp
8. Fractured Time — 56 pp · most talked about
9. Belief Unveiled — 66 pp
10. The Infinite Classroom — 76 pp
11. The Bookshop at the End of Maple Street — 123 pp · Maple Falls #1
12. A Recipe for Maple Falls — 76 pp · Maple Falls #2
13. The Christmas Letters of Maple Falls — 78 pp · Maple Falls #3
14. A Second Chance in Maple Falls — 68 pp · Maple Falls #4
15. A Wedding at the End of Maple Street — 76 pp · Maple Falls #5

## Contact

Phone / WhatsApp: **+91 62017 57330** · Bihar, India · Available worldwide
Instagram: **@Sufiilham07** (author) · **@naiyer_fx** (personal)
