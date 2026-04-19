import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { getModules } from '@/lib/wordpress';

function safeJsonParse(str: string): Record<string, unknown> {
  if (!str) return {};
  try { return JSON.parse(str); } catch {
    const fixed = str.replace(/[\x00-\x1F\x7F]/g, c => c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : '');
    try { return JSON.parse(fixed); } catch { return {}; }
  }
}

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;

  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const wpModules = await getModules();
    const modules = wpModules.map((m) => ({
      id: m.id,
      title: m.title.rendered,
      component: m.meta.component,
      content: safeJsonParse(m.meta.content_json),
      style: safeJsonParse(m.meta.default_style),
    }));

    return new Response(JSON.stringify(modules), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch modules' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
