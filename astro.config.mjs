import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sufiilham.co.uk',
  // With a custom domain, GitHub Pages serves the site from the root.
  // SITE_BASE still lets the sandbox preview or an alternate subpath
  // deploy override this at build time if needed.
  base: process.env.SITE_BASE ?? '/',
  // 'always' matches how GitHub Pages serves the site: /privacy/ is the page,
  // /privacy only redirects to it. With 'ignore' Astro also emitted a stub
  // privacy.html that meta-refreshed to /privacy — which GitHub Pages then
  // served for /privacy itself, producing an endless "Redirecting…" loop.
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    server: {
      host: true,
      allowedHosts: ['.e2b.app', '.arena.site', 'localhost'],
      ws: { clientPort: 443, protocol: 'wss' },
    },
  },
});
