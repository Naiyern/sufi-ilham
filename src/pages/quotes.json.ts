import type { APIRoute } from 'astro';
import { QUOTES } from '../data/quotes';

/**
 * The reading room's deck, emitted once as a cached JSON file rather than
 * bundled into the script: the page opens with its own line already in the
 * HTML, and the rotation only needs the rest of the collection — fetched after
 * load, at most once per visit, and never on the critical path.
 */
const body = JSON.stringify(QUOTES);

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=604800',
    },
  });
