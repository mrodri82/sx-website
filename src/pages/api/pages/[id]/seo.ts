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

/** PUT /api/pages/:id/seo — save RankMath SEO meta */
export const PUT: APIRoute = async ({ params, request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session || session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
  }

  // Update RankMath meta fields + slug via WP REST API
  const wpBody: Record<string, unknown> = { meta: {} };

  if (body.rank_math_title !== undefined) (wpBody.meta as any).rank_math_title = body.rank_math_title;
  if (body.rank_math_description !== undefined) (wpBody.meta as any).rank_math_description = body.rank_math_description;
  if (body.rank_math_focus_keyword !== undefined) (wpBody.meta as any).rank_math_focus_keyword = body.rank_math_focus_keyword;
  if (body.slug) wpBody.slug = body.slug;

  const res = await fetch(
    `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages/${params.id}`,
    { method: 'POST', headers: wpHeaders(), body: JSON.stringify(wpBody) }
  );

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'Save failed', details: err }), { status: res.status });
  }

  // Purge cache for this page
  try {
    await fetch(`${WP_CMS_URL}/index.php/?rest_route=/litespeed/v1/purge/all`, {
      method: 'POST', headers: wpHeaders(),
    });
  } catch {}

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
