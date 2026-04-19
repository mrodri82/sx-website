/**
 * Find or create a globally-shared zds_module for a given component type.
 * Used by the live editor's link/detach toggle — when a user wants to
 * switch a section from "detached" to "linked", we need a stable
 * zds_module post to point at. The first call creates one (titled
 * "Global <Component>"); subsequent calls return the same id.
 *
 * GET  /api/modules/global/:component  →  { id, component, content, style }
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

function wpHeaders() {
  return {
    Authorization: authHeader,
    Host: site.cmsHost,
    'Content-Type': 'application/json',
  };
}

const GLOBAL_TITLE_PREFIX = 'Global: ';

export const GET: APIRoute = async ({ params, request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  const component = params.component;
  if (!component) {
    return new Response(JSON.stringify({ error: 'Missing component' }), { status: 400 });
  }

  const expectedTitle = GLOBAL_TITLE_PREFIX + component;

  try {
    // Search existing zds_module posts by title
    const searchRes = await fetch(
      `${WP_CMS_URL}/wp-json/wp/v2/zds_module?per_page=100&search=${encodeURIComponent(expectedTitle)}`,
      { headers: wpHeaders() }
    );
    if (searchRes.ok) {
      const list = await searchRes.json();
      // Prefer exact title match
      const exact = Array.isArray(list)
        ? list.find((p: { title?: { rendered?: string } }) => p.title?.rendered === expectedTitle)
        : null;
      if (exact) {
        return new Response(JSON.stringify({
          id: exact.id,
          component,
          title: exact.title?.rendered,
          content: exact.meta?.content_json,
          style: exact.meta?.default_style,
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Create a new globally-shared module
    const createRes = await fetch(`${WP_CMS_URL}/wp-json/wp/v2/zds_module`, {
      method: 'POST',
      headers: wpHeaders(),
      body: JSON.stringify({
        title: expectedTitle,
        status: 'publish',
        meta: {
          component,
          content_json: JSON.stringify({}),
          default_style: JSON.stringify({ theme: 'dark' }),
        },
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      return new Response(
        JSON.stringify({ error: 'Create failed', details: err.slice(0, 300) }),
        { status: 502 }
      );
    }
    const created = await createRes.json();
    return new Response(JSON.stringify({
      id: created.id,
      component,
      title: created.title?.rendered,
      content: {},
      style: { theme: 'dark' },
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
