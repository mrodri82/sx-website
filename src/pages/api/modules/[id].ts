import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';

function wpAuth(): string {
  return `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}`;
}

function wpHost(): string {
  return new URL(WP_CMS_URL).host;
}

function safeJsonParse(str: string): Record<string, unknown> {
  if (!str) return {};
  try { return JSON.parse(str); } catch {
    const fixed = str.replace(/[\x00-\x1F\x7F]/g, c => c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : '');
    try { return JSON.parse(fixed); } catch { return {}; }
  }
}

/** GET /api/modules/:id — fetch single module */
export const GET: APIRoute = async ({ params, request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const res = await fetch(
    `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/zds_module/${params.id}`,
    { headers: { Authorization: wpAuth(), Host: wpHost() } }
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Module not found' }), { status: res.status });
  }

  const m = await res.json();
  return new Response(JSON.stringify({
    id: m.id,
    title: m.title.rendered,
    component: m.meta.component,
    content: safeJsonParse(m.meta.content_json),
    style: safeJsonParse(m.meta.default_style),
  }), { headers: { 'Content-Type': 'application/json' } });
};

/** PUT /api/modules/:id — update module content/style */
export const PUT: APIRoute = async ({ params, request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  // Only admin can update modules
  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
  }

  const meta: Record<string, string> = {};
  if (body.content) meta.content_json = JSON.stringify(body.content);
  if (body.style) meta.default_style = JSON.stringify(body.style);
  if (body.component) meta.component = body.component;

  const res = await fetch(
    `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/zds_module/${params.id}`,
    {
      method: 'POST', // WP REST uses POST for updates
      headers: {
        Authorization: wpAuth(),
        Host: wpHost(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ meta }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'Update failed', details: err }), { status: res.status });
  }

  // Purge LiteSpeed Cache for this change
  try {
    await fetch(`${WP_CMS_URL}/index.php/?rest_route=/litespeed/v1/purge/all`, {
      method: 'POST',
      headers: { Authorization: wpAuth(), Host: wpHost() },
    });
  } catch {}

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
