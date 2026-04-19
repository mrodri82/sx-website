/**
 * WordPress REST API Fetch Utility
 * Fetches content from the headless WordPress backend.
 */
import { site } from '@/config/site';

const WP_URL = site.cmsUrl;
const WP_USER = site.cmsUser;
const WP_APP_PASSWORD = site.cmsPassword;

/**
 * Safely parse JSON that may have unescaped control characters (from WordPress meta).
 * WordPress stores \\n but REST API returns literal newlines.
 */
function safeJsonParse(str: string): Record<string, unknown> {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    // Fix unescaped control characters inside JSON string values
    const fixed = str.replace(/[\x00-\x1F\x7F]/g, (ch) => {
      if (ch === '\n') return '\\n';
      if (ch === '\r') return '\\r';
      if (ch === '\t') return '\\t';
      return '';
    });
    try {
      return JSON.parse(fixed);
    } catch {
      console.error('JSON parse failed even after fix:', str.substring(0, 100));
      return {};
    }
  }
}

function getAuthHeader(): Record<string, string> {
  if (!WP_USER || !WP_APP_PASSWORD) return {};
  const encoded = btoa(`${WP_USER}:${WP_APP_PASSWORD}`);
  return { Authorization: `Basic ${encoded}` };
}

async function wpFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  // Build URL manually — URL() encodes slashes in rest_route which breaks WP
  const extraParams = params ? Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
  const url = `${WP_URL}/index.php/?rest_route=${endpoint}${extraParams ? '&' + extraParams : ''}&_t=${Date.now()}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Host: site.cmsHost,
      ...getAuthHeader(),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`WP API error ${res.status}: ${endpoint}`);
  }

  return res.json() as Promise<T>;
}

// --- Types ---

export interface WPModule {
  id: number;
  title: { rendered: string };
  meta: {
    component: string;
    content_json: string;
    default_style: string;
  };
}

export interface WPPage {
  id: number;
  title: { rendered: string };
  featured_media: number;
  meta: {
    sections_json: string;
    rank_math_title?: string;
    rank_math_description?: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
}

export interface SectionRef {
  type: string;
  module_id: number;
  mode: 'linked' | 'detached';
  visual_overrides?: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface ModuleData {
  id: number;
  title: string;
  component: string;
  content: Record<string, unknown>;
  style: Record<string, string>;
  overrides?: Record<string, string>;
}

// --- API Functions ---

export async function getModules(): Promise<WPModule[]> {
  // WP REST API max 100 per page — paginate to get all
  const page1 = await wpFetch<WPModule[]>('/wp/v2/zds_module', { per_page: '100', page: '1' });
  if (page1.length < 100) return page1;
  const page2 = await wpFetch<WPModule[]>('/wp/v2/zds_module', { per_page: '100', page: '2' });
  if (page2.length < 100) return [...page1, ...page2];
  const page3 = await wpFetch<WPModule[]>('/wp/v2/zds_module', { per_page: '100', page: '3' });
  return [...page1, ...page2, ...page3];
}

export async function getModuleById(id: number): Promise<WPModule> {
  return wpFetch<WPModule>(`/wp/v2/zds_module/${id}`);
}

export async function getPageBySlug(slug: string): Promise<{ page: WPPage; usedFallback: boolean } | null> {
  // Try exact slug first, then convert path separators to hyphens
  // e.g. "servicios/ai-visibility" → try "servicios/ai-visibility" then "servicios-ai-visibility"
  const pages = await wpFetch<WPPage[]>('/wp/v2/pages', { slug, per_page: '1', _embed: 'wp:featuredmedia' });
  if (pages.length > 0) return { page: pages[0], usedFallback: false };

  if (slug.includes('/')) {
    const hyphenSlug = slug.replace(/\//g, '-');
    const pages2 = await wpFetch<WPPage[]>('/wp/v2/pages', { slug: hyphenSlug, per_page: '1', _embed: 'wp:featuredmedia' });
    if (pages2.length > 0) return { page: pages2[0], usedFallback: true };
  }

  return null;
}

export async function getPageById(id: number): Promise<WPPage> {
  return wpFetch<WPPage>(`/wp/v2/pages/${id}`);
}

/**
 * Fetches a page's sections with their full module data resolved.
 * This is the main function used by page templates.
 */
export async function getPageSections(pageSlug: string): Promise<{ sections: ModuleData[]; usedFallback: boolean; ogImage?: string; pageTitle?: string; seoTitle?: string; seoDescription?: string }> {
  const result = await getPageBySlug(pageSlug);
  if (!result?.page?.meta?.sections_json) return { sections: [], usedFallback: false };
  const { page, usedFallback } = result;
  const ogImage = page._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
  const pageTitle = page.title?.rendered || '';
  const seoTitle = page.meta?.rank_math_title || '';
  const seoDescription = page.meta?.rank_math_description || '';

  let sections: SectionRef[];
  try {
    sections = JSON.parse(page.meta.sections_json);
  } catch {
    // WordPress meta can contain unescaped control characters — fix and retry
    const fixed = page.meta.sections_json.replace(/[\x00-\x1F\x7F]/g, (ch: string) => {
      if (ch === '\n') return '\\n';
      if (ch === '\r') return '\\r';
      if (ch === '\t') return '\\t';
      return '';
    });
    try { sections = JSON.parse(fixed); } catch { sections = []; }
  }
  const moduleIds = sections.filter(s => s.module_id).map(s => s.module_id);

  // Fetch all needed modules in parallel
  const modules = await Promise.all(moduleIds.map(id => getModuleById(id)));
  const moduleMap = new Map(modules.map(m => [m.id, m]));

  const resolved = sections.map((section, idx) => {
    if (section.mode === 'detached' && section.data) {
      return {
        id: -(idx + 1),
        title: section.type,
        component: section.type,
        content: section.data,
        // Per-instance module-level style (background, theme, spacing)
        // saved alongside content via the live editor.
        style: (section as any).style || {},
        overrides: section.visual_overrides,
      };
    }

    const mod = moduleMap.get(section.module_id);
    if (!mod) {
      console.warn(`Module ${section.module_id} not found`);
      return null;
    }

    return {
      id: mod.id,
      title: mod.title.rendered,
      component: mod.meta.component,
      content: safeJsonParse(mod.meta.content_json),
      style: safeJsonParse(mod.meta.default_style),
      overrides: section.visual_overrides,
    };
  }).filter((m): m is ModuleData => m !== null);

  return { sections: resolved, usedFallback, ogImage, pageTitle, seoTitle, seoDescription };
}
