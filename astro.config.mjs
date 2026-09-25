import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://naiyern.github.io',
  // GitHub Pages serves the site from /sufi-ilham. SITE_BASE lets the sandbox
  // preview build at the root instead, where there is no subpath.
  base: process.env.SITE_BASE ?? (process.env.NODE_ENV === 'production' ? '/sufi-ilham' : '/'),
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
      hmr: { clientPort: 443, protocol: 'wss' },
    },
  },
});
