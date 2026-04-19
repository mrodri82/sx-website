import type { APIRoute } from 'astro';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';
const SITE = site.siteOrigin;

export const GET: APIRoute = async () => {
  const auth = WP_CMS_USER ? { Authorization: `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}` } : {};
  const headers = { Host: new URL(WP_CMS_URL).host, ...auth };

  // Fetch all pages
  let pages: any[] = [];
  try {
    const res = await fetch(`${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages&per_page=100&_fields=slug,modified&_t=${Date.now()}`, { headers, cache: 'no-store' });
    if (res.ok) pages = await res.json();
  } catch {}

  // Fetch all posts
  let posts: any[] = [];
  try {
    const res = await fetch(`${WP_CMS_URL}/index.php/?rest_route=/wp/v2/posts&per_page=100&_fields=slug,modified&_t=${Date.now()}`, { headers, cache: 'no-store' });
    if (res.ok) posts = await res.json();
  } catch {}

  // Build URLs
  const urls: { loc: string; lastmod: string; priority: string }[] = [];

  // Homepage
  urls.push({ loc: `${SITE}/`, lastmod: new Date().toISOString().split('T')[0], priority: '1.0' });

  // Pages
  const SKIP = ['sample-page', 'homepage', 'about-us'];
  for (const p of pages) {
    if (SKIP.includes(p.slug)) continue;
    const slug = p.slug;
    // Convert WP hierarchical slugs
    const url = slug.includes('/') ? `/${slug}` : `/${slug}`;
    const lastmod = p.modified ? new Date(p.modified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const priority = slug === 'servicios' || slug === 'sectores' || slug === 'contacto' ? '0.9' :
                     slug.startsWith('servicios-') || slug.startsWith('sectores-') ? '0.8' :
                     slug.startsWith('que-es-') || slug.startsWith('seo-') ? '0.6' : '0.7';
    urls.push({ loc: `${SITE}${url}`, lastmod, priority });
  }

  // Blog posts
  for (const p of posts) {
    const lastmod = p.modified ? new Date(p.modified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    urls.push({ loc: `${SITE}/insights/${p.slug}`, lastmod, priority: '0.7' });
  }

  // Static pages
  urls.push({ loc: `${SITE}/insights`, lastmod: new Date().toISOString().split('T')[0], priority: '0.8' });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
