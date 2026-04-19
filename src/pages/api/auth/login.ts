import type { APIRoute } from 'astro';
import { authenticateWithWP, createSession, sessionCookie } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.username || !body?.password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await authenticateWithWP(body.username, body.password);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = createSession(user);

  return new Response(
    JSON.stringify({
      ok: true,
      user: { name: user.name, role: user.role },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie(token),
      },
    }
  );
};
