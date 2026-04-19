/**
 * Link Resolver — resolves page:ID references to URL paths.
 * Used by ModuleRenderer to make internal links slug-change-proof.
 *
 * Supports two formats:
 *   "page:42"    → looks up page ID 42 → "/contacto"
 *   "/contacto"  → returned as-is (legacy, still works)
 *   "https://..." → returned as-is (external)
 */

import { site } from '@/config/site';

// Simple in-memory cache with TTL
let pageMapCache: Map<number, string> | null = null;
let pageMapTimestamp = 0;
const PAGE_MAP_TTL = 60_000; // 60 seconds

/**
 * Fetch all pages from WP and build ID → path lookup map.
 * Called once per request cycle, cached for 60s.
 */
async function getPageMap(): Promise<Map<number, string>> {
  const now = Date.now();
  if (pageMapCache && (now - pageMapTimestamp) < PAGE_MAP_TTL) {
    return pageMapCache;
  }

  const WP_URL = site.cmsUrl;
  const WP_USER = import.meta.env.WP_CMS_USER || '';
  const WP_PASS = import.meta.env.WP_CMS_APP_PASSWORD || '';
  const auth = WP_USER ? { Authorization: `Basic ${btoa(`${WP_USER}:${WP_PASS}`)}` } : {};

  try {
    const res = await fetch(
      `${WP_URL}/index.php/?rest_route=/wp/v2/pages&per_page=100&_fields=id,slug&_t=${now}`,
      { headers: { Host: new URL(WP_URL).host, ...auth }, cache: 'no-store' }
    );
    if (!res.ok) return pageMapCache || new Map();
    const pages: Array<{ id: number; slug: string }> = await res.json();

    const map = new Map<number, string>();
    for (const p of pages) {
      // Homepage special case
      if (p.slug === 'homepage') {
        map.set(p.id, '/');
      } else {
        map.set(p.id, '/' + p.slug);
      }
    }

    pageMapCache = map;
    pageMapTimestamp = now;
    return map;
  } catch {
    return pageMapCache || new Map();
  }
}

/**
 * Resolve a single link value.
 */
export async function resolveLink(value: string | undefined | null): Promise<string> {
  if (!value) return '';

  // page:ID format
  const match = value.match(/^page:(\d+)$/);
  if (match) {
    const pageId = parseInt(match[1]);
    const map = await getPageMap();
    return map.get(pageId) || value;
  }

  // Legacy path or external URL — return as-is
  return value;
}

/**
 * Resolve all link fields in a content object.
 * Call once per module in ModuleRenderer.
 */
export async function resolveContentLinks(content: Record<string, unknown>): Promise<Record<string, unknown>> {
  const resolved = { ...content };
  const linkFields = ['cta_url', 'cta_primary_url', 'cta_secondary_url', 'cta2_url',
                      'button_url', 'link_url', 'footer_link_url', 'href', 'url'];

  // Top-level fields
  for (const field of linkFields) {
    if (typeof resolved[field] === 'string' && (resolved[field] as string).startsWith('page:')) {
      resolved[field] = await resolveLink(resolved[field] as string);
    }
  }

  // Repeater arrays
  const arrayFields = ['items', 'steps', 'results', 'members'];
  for (const arrField of arrayFields) {
    const arr = resolved[arrField];
    if (Array.isArray(arr)) {
      resolved[arrField] = await Promise.all(arr.map(async (item: Record<string, unknown>) => {
        const resolvedItem = { ...item };
        for (const field of linkFields) {
          if (typeof resolvedItem[field] === 'string' && (resolvedItem[field] as string).startsWith('page:')) {
            resolvedItem[field] = await resolveLink(resolvedItem[field] as string);
          }
        }
        return resolvedItem;
      }));
    }
  }

  return resolved;
}
