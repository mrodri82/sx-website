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

/** POST /api/modules/create — create a new zds_module and optionally insert into page */
export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session || session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.component || !body?.content) {
    return new Response(JSON.stringify({ error: 'Missing title, component, or content' }), { status: 400 });
  }

  // 1. Create the module in WordPress
  const modRes = await fetch(`${WP_CMS_URL}/index.php/?rest_route=/wp/v2/zds_module`, {
    method: 'POST',
    headers: wpHeaders(),
    body: JSON.stringify({
      title: body.title,
      status: 'publish',
      meta: {
        component: body.component,
        content_json: JSON.stringify(body.content),
        default_style: JSON.stringify(body.style || { theme: 'dark' }),
      },
    }),
  });

  if (!modRes.ok) {
    const err = await modRes.text();
    return new Response(JSON.stringify({ error: 'Module creation failed', details: err }), { status: 500 });
  }

  const mod = await modRes.json();
  const moduleId = mod.id;

  // 2. If pageId provided, insert into page sections
  if (body.pageId) {
    const pageRes = await fetch(
      `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages/${body.pageId}&_fields=id,meta`,
      { headers: wpHeaders() }
    );
    if (pageRes.ok) {
      const page = await pageRes.json();
      const sections = JSON.parse(page.meta?.sections_json || '[]');
      const newSection = { type: body.component, module_id: moduleId, mode: 'linked' as const };

      // Insert at position if specified, otherwise append
      const position = typeof body.position === 'number' ? body.position : sections.length;
      sections.splice(position, 0, newSection);

      await fetch(`${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages/${body.pageId}`, {
        method: 'POST',
        headers: wpHeaders(),
        body: JSON.stringify({ meta: { sections_json: JSON.stringify(sections) } }),
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, id: moduleId, component: body.component }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
