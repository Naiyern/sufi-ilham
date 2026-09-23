import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://naiyern.github.io',
  // GitHub Pages serves the site from /sufi-ilham; in dev we serve from the
  // root so the preview URL works without the subpath.
  base: process.env.NODE_ENV === 'production' ? '/sufi-ilham' : '/',
  trailingSlash: 'ignore',
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
