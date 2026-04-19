import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  // Since all pages are now SSR, no rebuild needed.
  // Each request fetches fresh data from WordPress.
  // This endpoint exists for the editor to signal "save complete".
  return new Response(JSON.stringify({
    ok: true,
    status: 'live',
  }), { headers: { 'Content-Type': 'application/json' } });
};
