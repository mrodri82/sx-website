/**
 * Page status toggle — draft <-> publish.
 * GET  returns current status
 * PUT  { status: 'draft' | 'publish' | 'private' } updates it
 */
import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = site.cmsUser;
const WP_CMS_APP_PASSWORD = site.cmsPassword;
const authHeader =
  WP_CMS_USER && WP_CMS_APP_PASSWORD
    ? 'Basic ' + btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)
    : '';

function requireSession(request: Request) {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  return token ? getSession(token) : null;
}

export const GET: APIRoute = async ({ params, request }) => {
  if (!requireSession(request)) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  const id = params.id;
  try {
    const res = await fetch(`${WP_CMS_URL}/wp-json/wp/v2/pages/${id}?context=edit`, {
      headers: { Authorization: authHeader, Host: site.cmsHost },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'WP fetch failed', status: res.status }), { status: 502 });
    }
    const data = await res.json();
    return new Response(JSON.stringify({ status: data.status, id: data.id, slug: data.slug }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  if (!requireSession(request)) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!['draft', 'publish', 'private'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
  }
  const id = params.id;
  try {
    const res = await fetch(`${WP_CMS_URL}/wp-json/wp/v2/pages/${id}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        Host: site.cmsHost,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'WP update failed', details: errText }), { status: 502 });
    }
    const data = await res.json();
    return new Response(JSON.stringify({ status: data.status, id: data.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
