import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';

function wpHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}`,
    Host: new URL(WP_CMS_URL).host,
    'Content-Type': 'application/json',
  };
}

/** GET /api/pages/:id/sections — get page sections order */
export const GET: APIRoute = async ({ params, request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token || !getSession(token)) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const res = await fetch(
    `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages/${params.id}&_fields=id,meta`,
    { headers: wpHeaders() }
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Page not found' }), { status: res.status });
  }

  const page = await res.json();
  const sections = JSON.parse(page.meta?.sections_json || '[]');

  return new Response(JSON.stringify({ sections }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/** PUT /api/pages/:id/sections — save new sections order */
export const PUT: APIRoute = async ({ params, request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.sections || !Array.isArray(body.sections)) {
    return new Response(JSON.stringify({ error: 'Invalid sections array' }), { status: 400 });
  }

  // Replace any temporary 'new-…' ids (from module-picker) with
  // stable integer ids. This keeps sections manageable across
  // subsequent saves instead of accumulating stringified timestamps.
  let nextId = Date.now();
  const normalized = body.sections.map((s: Record<string, unknown>) => {
    const id = s.id;
    if (typeof id === 'string' && id.startsWith('new-')) {
      return { ...s, id: nextId++ };
    }
    if (id == null || id === '') {
      return { ...s, id: nextId++ };
    }
    return s;
  });

  // Save via WP REST API — update the page meta
  const res = await fetch(
    `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages/${params.id}`,
    {
      method: 'POST',
      headers: wpHeaders(),
      body: JSON.stringify({
        meta: { sections_json: JSON.stringify(normalized) },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'Save failed', details: err }), { status: res.status });
  }

  // Purge LiteSpeed Cache after section change
  try {
    await fetch(`${WP_CMS_URL}/index.php/?rest_route=/litespeed/v1/purge/all`, {
      method: 'POST',
      headers: wpHeaders(),
    });
  } catch {}

  // Return the normalized sections so the client can swap out
  // placeholder ids for the real ones.
  return new Response(JSON.stringify({ ok: true, sections: normalized }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
