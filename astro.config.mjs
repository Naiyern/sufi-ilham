import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://naiyern.github.io',
  // GitHub Pages serves the site from /sufi-ilham. SITE_BASE lets the sandbox
  // preview build at the root instead, where there is no subpath.
  base: process.env.SITE_BASE ?? (process.env.NODE_ENV === 'production' ? '/sufi-ilham' : '/'),
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
