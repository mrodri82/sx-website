import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';

interface PageItem {
  id: number;
  slug: string;
  title: string;
  type: string;
  parent?: number;
  status?: string;
}

interface PostTypeGroup {
  type: string;          // 'page', 'post', 'glossary', ...
  label: string;         // 'Pages', 'Blog', 'Glosario', ...
  icon: string;          // emoji for the sidebar
  rest_base: string;     // REST API slug (pages, posts, glossary)
  items: PageItem[];
}

/**
 * GET /api/pages/list
 *
 * Fetches all editable post types from WordPress and returns them
 * grouped by type so the editor's page selector can show:
 *
 *   📄 Pages       — main site pages (hierarchical)
 *   📝 Blog        — posts
 *   📖 Glosario    — custom post type (if registered)
 *   🧩 Products    — custom post type (if registered)
 *
 * New CPTs registered via register_post_type() with show_in_rest=true
 * are automatically picked up without code changes here — we discover
 * them via the /wp/v2/types endpoint.
 */
export const GET: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token || !getSession(token)) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}`,
    Host: new URL(WP_CMS_URL).host,
  };

  // Icons + labels for known types. CPTs fall back to generic 🧩 + the WP label.
  const TYPE_META: Record<string, { icon: string; label: string }> = {
    page:     { icon: '📄', label: 'Pages' },
    post:     { icon: '📝', label: 'Blog' },
    glossary: { icon: '📖', label: 'Glosario' },
    product:  { icon: '🛒', label: 'Products' },
    case_study: { icon: '🏆', label: 'Case Studies' },
  };

  try {
    // 1. Discover all post types (built-in + CPTs) that are editable via REST
    const typesRes = await fetch(
      `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/types`,
      { headers }
    );
    if (!typesRes.ok) {
      return new Response(JSON.stringify({ error: 'WP types fetch failed', status: typesRes.status }), { status: 502 });
    }
    const types = await typesRes.json() as Record<string, any>;

    // Filter: only public, editable types with a rest_base, excluding internal types
    const excluded = new Set(['attachment', 'nav_menu_item', 'wp_block', 'wp_template', 'wp_template_part', 'wp_navigation', 'zds_module']);
    const editableTypes = Object.entries(types)
      .filter(([slug, t]) => t.rest_base && !excluded.has(slug) && t.viewable !== false);

    // 2. Fetch items for each type in parallel
    const groups: PostTypeGroup[] = await Promise.all(
      editableTypes.map(async ([slug, t]) => {
        const meta = TYPE_META[slug] || { icon: '🧩', label: t.name || slug };
        try {
          const res = await fetch(
            `${WP_CMS_URL}/index.php/?rest_route=/wp/v2/${t.rest_base}&per_page=100&_fields=id,slug,title,parent,status&orderby=title&order=asc&status=publish,draft`,
            { headers }
          );
          if (!res.ok) return { type: slug, label: meta.label, icon: meta.icon, rest_base: t.rest_base, items: [] };
          const raw = await res.json() as any[];
          const items: PageItem[] = raw.map(p => ({
            id: p.id,
            slug: p.slug,
            title: p.title?.rendered || p.slug,
            type: slug,
            parent: p.parent,
            status: p.status,
          }));
          return { type: slug, label: meta.label, icon: meta.icon, rest_base: t.rest_base, items };
        } catch {
          return { type: slug, label: meta.label, icon: meta.icon, rest_base: t.rest_base, items: [] };
        }
      })
    );

    // 3. Only return groups that have at least one item
    const nonEmpty = groups.filter(g => g.items.length > 0);

    return new Response(JSON.stringify({ groups: nonEmpty }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'WP unreachable', details: String(err) }), { status: 502 });
  }
};
