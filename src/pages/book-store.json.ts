import type { APIRoute } from 'astro';
import { books, coverUrl, pdfUrl } from '../data/site';

/**
 * The book data the client-side modal needs, emitted as ONE cached JSON file
 * instead of being inlined into every page's HTML. app.ts fetches it lazily
 * (on idle / first card interaction), so it never blocks first paint and is
 * downloaded at most once per visit. Undefined fields are dropped by
 * JSON.stringify, keeping the payload lean.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const store = Object.fromEntries(
  books.map((b) => [
    b.slug,
    {
      title: b.title,
      kicker: b.kicker,
      sub: b.sub,
      quote: b.quote,
      desc: b.desc,
      spec: b.spec,
      dir: b.dir,
      img: coverUrl(b.img, base),
      us: b.us,
      in: b.in,
      uk: b.uk,
      ca: b.ca,
      au: b.au,
      paperback: b.paperback,
      ...(b.free && b.pdf
        ? { free: true, pdf: pdfUrl(b.pdf, base), read: `${base}/read/${b.slug}/` }
        : {}),
    },
  ]),
);

const body = JSON.stringify(store);

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
