import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_URL = site.cmsUrl;
const WP_USER = site.cmsUser;
const WP_PASS = site.cmsPassword;
const wpAuth = `Basic ${btoa(`${WP_USER}:${WP_PASS}`)}`;
const wpH = { Authorization: wpAuth, Host: site.cmsHost, 'Content-Type': 'application/json' };

const MAX_RECENT = 20;  // keep last 20 revisions
const KEEP_MONTHLY = 12; // plus 1 per month for the last 12 months

/**
 * GET /api/revisions?pageId=15 — list revisions for a page
 * POST /api/revisions — save current state as revision before overwriting
 *   body: { pageId: number }
 * PUT /api/revisions — restore a specific revision
 *   body: { pageId: number, revisionIndex: number }
 */

export const GET: APIRoute = async ({ request, url }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token || !getSession(token)) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const pageId = url.searchParams.get('pageId');
  if (!pageId) return new Response(JSON.stringify({ error: 'pageId required' }), { status: 400 });

  try {
    const res = await fetch(`${WP_URL}/index.php/?rest_route=/wp/v2/pages/${pageId}&_fields=meta`, { headers: wpH });
    const page = await res.json();
    const history = page.meta?.sections_history ? JSON.parse(page.meta.sections_history) : [];
    return new Response(JSON.stringify(history.map((r: any, i: number) => ({
      index: i,
      timestamp: r.timestamp,
      author: r.author || 'unknown',
      sectionCount: r.sections ? JSON.parse(r.sections).length : 0,
      preview: r.sections ? JSON.parse(r.sections).map((s: any) => s.type).join(', ') : '',
    }))), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch revisions' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const body = await request.json();
  const { pageId } = body;
  if (!pageId) return new Response(JSON.stringify({ error: 'pageId required' }), { status: 400 });

  try {
    // Read current state
    const res = await fetch(`${WP_URL}/index.php/?rest_route=/wp/v2/pages/${pageId}&_fields=meta`, { headers: wpH });
    const page = await res.json();
    const currentSections = page.meta?.sections_json || '[]';
    const history = page.meta?.sections_history ? JSON.parse(page.meta.sections_history) : [];

    // Add current state to history
    history.unshift({
      timestamp: new Date().toISOString(),
      author: session.username || 'editor',
      sections: currentSections,
    });

    // Keep last 20 recent + 1 per month (oldest of each month)
    if (history.length > MAX_RECENT) {
      const recent = history.slice(0, MAX_RECENT);
      const older = history.slice(MAX_RECENT);
      // Group older by month, keep 1 per month
      const monthlyKeep = new Map();
      for (const rev of older) {
        const month = rev.timestamp.substring(0, 7); // YYYY-MM
        if (!monthlyKeep.has(month)) monthlyKeep.set(month, rev);
      }
      const monthly = [...monthlyKeep.values()].slice(0, KEEP_MONTHLY);
      history.length = 0;
      history.push(...recent, ...monthly);
    }

    // Save history
    await fetch(`${WP_URL}/index.php/?rest_route=/wp/v2/pages/${pageId}`, {
      method: 'POST', headers: wpH,
      body: JSON.stringify({ meta: { sections_history: JSON.stringify(history) } }),
    });

    return new Response(JSON.stringify({ ok: true, revisions: history.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to save revision' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const body = await request.json();
  const { pageId, revisionIndex } = body;
  if (!pageId || revisionIndex === undefined) {
    return new Response(JSON.stringify({ error: 'pageId and revisionIndex required' }), { status: 400 });
  }

  try {
    // Read history
    const res = await fetch(`${WP_URL}/index.php/?rest_route=/wp/v2/pages/${pageId}&_fields=meta`, { headers: wpH });
    const page = await res.json();
    const history = page.meta?.sections_history ? JSON.parse(page.meta.sections_history) : [];

    if (revisionIndex < 0 || revisionIndex >= history.length) {
      return new Response(JSON.stringify({ error: 'Invalid revision index' }), { status: 400 });
    }

    const revision = history[revisionIndex];

    // Save current state as new revision first (so we can undo the restore)
    const currentSections = page.meta?.sections_json || '[]';
    history.unshift({
      timestamp: new Date().toISOString(),
      author: `${session.username || 'editor'} (pre-restore)`,
      sections: currentSections,
    });
    while (history.length > MAX_REVISIONS) history.pop();

    // Restore the revision
    await fetch(`${WP_URL}/index.php/?rest_route=/wp/v2/pages/${pageId}`, {
      method: 'POST', headers: wpH,
      body: JSON.stringify({
        meta: {
          sections_json: revision.sections,
          sections_history: JSON.stringify(history),
        },
      }),
    });

    return new Response(JSON.stringify({ ok: true, restored: revision.timestamp }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to restore revision' }), { status: 500 });
  }
};
