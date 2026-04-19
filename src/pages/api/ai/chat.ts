import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { buildPageBuilderPrompt } from '@/lib/editor/ai-knowledge';
import { site } from '@/config/site';

export const prerender = false;

const OPENROUTER_KEY = import.meta.env.OPENROUTER_API_KEY || '';
// Claude Opus 4.6 on OpenRouter. For cheaper/faster runs, set
// AI_MODEL=anthropic/claude-sonnet-4-5 in .env.
const MODEL = import.meta.env.AI_MODEL || 'anthropic/claude-opus-4.6';

export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.message) {
    return new Response(JSON.stringify({ error: 'No message' }), { status: 400 });
  }

  // Build context-aware system prompt
  const pageContext = body.context || {};
  const systemPrompt = buildPageBuilderPrompt({
    pageName: pageContext.pageName || 'Unbekannt',
    pageId: pageContext.pageId,
    existingSections: pageContext.sections?.map((s: any) => ({
      type: s.component || s.type,
      title: s.title || s.component || s.type,
      id: s.id || s.module_id,
    })),
  });

  // Proxy to OpenRouter with SSE streaming
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': `https://${site.domain}`,
      'X-Title': `Nova Editor AI — ${site.brandName}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...body.history || [],
        { role: 'user', content: body.message },
      ],
      max_tokens: 16000, // Increased for page building (multiple modules)
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: 'AI error', details: err }), { status: 500 });
  }

  // Forward SSE stream
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};
