import type { APIRoute } from 'astro';
import { getTokenFromCookies, destroySession, clearSessionCookie } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (token) destroySession(token);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};
