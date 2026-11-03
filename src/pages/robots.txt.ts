import type { APIRoute } from 'astro';

/**
 * Generated (not copied from public/) so the sitemap URL always follows the
 * deployed origin + base path. A static robots.txt previously pointed search
 * engines at the retired custom domain.
 */
const origin = (import.meta.env.SITE ?? 'https://naiyern.github.io').replace(/\/+$/, '');
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

const body = `User-agent: *
Allow: /

Sitemap: ${origin}${base}/sitemap-index.xml
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
