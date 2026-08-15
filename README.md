# Sufi Ilham — Official Author Website

An original, cinematic multi-page website for **Sufi Ilham** (pen name of MD Naiyer Alam),
author of 7 titles on Amazon. Every line of design, copy, code and music here was made
for this site — no templates, no stock, no copied marketing text.

## What's in this folder

| File | Description |
|---|---|
| `index.html` | Homepage — hero, 7-book library with live filters, about, themes, contact strip |
| `contact.html` | Contact page — phone, WhatsApp, message form, 5-item FAQ |
| `privacy.html` | Privacy Policy — 13 sections with sticky table of contents |
| `terms.html` | Terms of Use — 13 sections, governing law: Bihar, India |
| `sama.mp3` | Original Sufi ambient soundtrack, 5:52 (3.4 MB) |
| `robots.txt` / `sitemap.xml` | Search engine files |

All images (3 author photos + 8 book covers) are **embedded directly in the HTML** as
base64, so every page is self-contained. The only separate file is `sama.mp3`.

## How to publish it

The site is 100% static — no server code, no database, no build step.

**Netlify (easiest, free):** go to https://app.netlify.com/drop and drag this whole
folder onto the page. It goes live in about 20 seconds.

**Vercel:** https://vercel.com/new → import or drag the folder.

**GitHub Pages:** push these files to a repo, then Settings → Pages → deploy from branch.

**Any web host / cPanel:** upload the contents of this folder to `public_html`.

Keep all files together in the same folder so `sama.mp3` and the page links resolve.

## Signature features

- **Four languages** — English, हिन्दी, اردو and Hinglish. Urdu switches the entire layout
  to right-to-left. Your choice follows you across every page.
- **Cinematic Amazon routing** — clicking any store link opens an interstitial showing the
  book cover and a progress bar, then delivers the reader to the correct Amazon store in a
  new tab. All 16 links (8 books × amazon.com and amazon.in) are verified working.
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

- Palette lifted out of near-black to a warm charcoal so the site stays legible on
  phone screens and in daylight; body text, borders and gold accents all brightened.
- Added a two-photo gallery under the author portrait: the flute portrait ("The flute ·
  today") and the childhood photograph ("Where it began"), warm-toned to match.
- Removed the "Veni, Vidi, Vici" motto from all wording.
- Mobile: larger body text, 44px minimum tap targets, softer vignette, no overflow at 390px.

## The books

1. The Human Operating Manual — 383 pp · most popular
2. Laozi: The Man Who Disappeared into the Dao — 318 pp · newest
3. The Wall Was a Gesture — 334 pp
4. The Map Is Finished — 320 pp
5. NeuroFocus Protocol — 362 pp
6. Fractured Time — 56 pp · most talked about
7. Belief Unveiled — 66 pp
8. The Infinite Classroom — 76 pp

## Contact

Phone / WhatsApp: **+91 62017 57330** · Bihar, India · Available worldwide
Instagram: **@Sufiilham07** (author) · **@naiyer_fx** (personal)

---

*Veni · Vidi · Vici*
