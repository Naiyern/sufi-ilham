import type { APIRoute } from 'astro';

/**
 * Generated (not copied from public/) so `start_url`, `scope` and icon URLs
 * carry the deploy base path. A static manifest with "/" made the installed
 * app open the GitHub Pages root instead of this site.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

const manifest = {
  name: 'Sufi Ilham — Author',
  short_name: 'Sufi Ilham',
  description:
    'Official website of Sufi Ilham (MD Naiyer Alam), author of 32 books — the Cartographers saga, the Song of the Unbroken Sky trilogy, The Spare Key Summer, and works on philosophy, romance and self-discovery.',
  start_url: `${base}/`,
  scope: `${base}/`,
  display: 'standalone',
  background_color: '#08080a',
  theme_color: '#08080a',
  lang: 'en',
  categories: ['books', 'education', 'lifestyle'],
  icons: [
    { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

const body = JSON.stringify(manifest, null, 2);

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
