import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';

export const GET: APIRoute = async ({ params, request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token || !getSession(token)) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const slug = params.slug;
  const auth = `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}`;
  const host = new URL(WP_CMS_URL).host;

  const res = await fetch(
    `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages&slug=${slug}&_fields=id,title,meta`,
    { headers: { Authorization: auth, Host: host } }
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'WP API error' }), { status: res.status });
  }

  const pages = await res.json();
  if (!pages.length) {
    return new Response(JSON.stringify({ error: 'Page not found' }), { status: 404 });
  }

  const page = pages[0];
  const sections = JSON.parse(page.meta?.sections_json || '[]');

  return new Response(JSON.stringify({
    id: page.id,
    title: page.title.rendered,
    sections,
  }), { headers: { 'Content-Type': 'application/json' } });
};
