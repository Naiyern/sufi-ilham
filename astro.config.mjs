import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Where the site actually lives.
 *
 * GitHub Pages serves this repository as a *project* site at
 * https://naiyern.github.io/sufi-ilham/ — i.e. under the `/sufi-ilham/`
 * subpath. Every internal link, asset URL, canonical and sitemap entry must
 * therefore include that subpath, otherwise the live site loads with no CSS,
 * broken images and navigation that 404s (it previously did).
 *
 * If the site moves back to a custom apex domain (e.g. sufiilham.co.uk), build
 * with SITE_ORIGIN=https://sufiilham.co.uk SITE_BASE=/ npm run deploy and
 * re-add public/CNAME.
 */
const SITE_ORIGIN = (process.env.SITE_ORIGIN ?? 'https://naiyern.github.io').replace(/\/+$/, '');
const SITE_BASE = process.env.SITE_BASE ?? '/sufi-ilham/';

export default defineConfig({
  site: SITE_ORIGIN,
  base: SITE_BASE,
  // 'always' matches how GitHub Pages serves the site: /privacy/ is the page,
  // /privacy only redirects to it. With 'ignore' Astro also emitted a stub
  // privacy.html that meta-refreshed to /privacy — which GitHub Pages then
  // served for /privacy itself, producing an endless "Redirecting…" loop.
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    // Expose the resolved origin to src/ modules (canonical/OG/JSON-LD URLs)
    // so there is one source of truth for the deployed address.
    define: { 'import.meta.env.PUBLIC_SITE_ORIGIN': JSON.stringify(SITE_ORIGIN) },
    server: {
      host: true,
      allowedHosts: ['.e2b.app', '.arena.site', 'localhost'],
      ws: { clientPort: 443, protocol: 'wss' },
    },
  },
});
