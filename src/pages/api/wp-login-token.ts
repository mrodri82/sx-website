import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';

export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  // Request a one-time login token from WordPress
  const res = await fetch(
    `${WP_CMS_URL}/index.php?rest_route=/nova/v1/create-login-token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}`,
        Host: new URL(WP_CMS_URL).host,
      },
      body: JSON.stringify({ user_id: session.userId }),
    }
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Failed to create token' }), { status: 500 });
  }

  const data = await res.json();
  const loginUrl = `${WP_CMS_URL}/?nova_login=${data.token}`;

  return new Response(JSON.stringify({ url: loginUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
