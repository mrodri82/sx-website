import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';

export const GET: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token || !getSession(token)) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

  const headers = {
    Authorization: `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}`,
    Host: new URL(WP_CMS_URL).host,
  };
  const base = `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/media&per_page=100&media_type=image&_fields=id,source_url,title,media_details${searchParam}`;

  // Paginate to get ALL images
  let wpImages: any[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${base}&page=${page}&_t=${Date.now()}`, { headers });
    if (!res.ok) break;
    const batch = await res.json();
    wpImages = wpImages.concat(batch);
    if (batch.length < 100) break; // last page
  }

  // Also include static team/generated images
  const staticImages = [
    '/images/team/management-duo.webp',
    '/images/team/team-collage.webp',
    '/images/team/edited/office-dark.jpg',
    '/images/team/edited/team-dark.jpg',
    '/images/team/edited/manuel-dark.jpg',
    '/images/team/lars-biewald.jpg',
    '/images/team/andreas-berth.jpg',
    // Scene photos (AI-generated team scenes)
    '/images/team/scenes/olesya-office.jpg',
    '/images/team/scenes/olesya-meeting.jpg',
    '/images/team/scenes/olesya-presenting.jpg',
    '/images/team/scenes/olesya-desk.jpg',
    '/images/team/scenes/olesya-city-portrait.jpg',
    '/images/team/scenes/olesya-headshot.jpg',
    '/images/team/scenes/olesya-plants-office.jpg',
    '/images/team/scenes/olesya-ai-dashboard.jpg',
    '/images/team/scenes/olesya-social.jpg',
    '/images/team/scenes/york-ppc-meeting.jpg',
    '/images/team/scenes/armin-coding.jpg',
  ].filter(p => !search || p.toLowerCase().includes(search.toLowerCase()))
   .map((p, i) => ({
    id: 90000 + i,
    source_url: p,
    title: { rendered: p.split('/').pop()?.replace(/\.\w+$/, '') || '' },
    media_details: { sizes: { thumbnail: { source_url: p } } },
  }));

  return new Response(JSON.stringify([...wpImages, ...staticImages]), {
    headers: { 'Content-Type': 'application/json' },
  });
};
