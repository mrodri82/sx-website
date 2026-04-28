import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const OPENROUTER_KEY = import.meta.env.OPENROUTER_API_KEY || '';
const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = import.meta.env.WP_CMS_USER || '';
const WP_CMS_APP_PASSWORD = import.meta.env.WP_CMS_APP_PASSWORD || '';

function wpHeaders(contentType?: string): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Basic ${btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)}`,
    Host: new URL(WP_CMS_URL).host,
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}

/** POST /api/media/generate — generate image via Gemini + upload to WP */
export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.prompt) {
    return new Response(JSON.stringify({ error: 'No prompt' }), { status: 400 });
  }

  // 1. Generate image via Gemini 2.5 Flash Image on OpenRouter
  const genRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': `https://${site.domain}`,
      // ASCII-only header (em-dash U+2014 fails ByteString conversion).
      'X-Title': `Nova Image Generator - ${site.brandName}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-image-preview',
      modalities: ['image', 'text'],
      messages: [
        {
          role: 'user',
          content: body.prompt,
        },
      ],
      max_tokens: 1024,
    }),
  });

  if (!genRes.ok) {
    const err = await genRes.text();
    return new Response(JSON.stringify({ error: 'Image generation failed', details: err }), { status: 500 });
  }

  const genData = await genRes.json();

  // Extract base64 image — check both images[] and content[] formats
  let base64Image = '';
  let mimeType = 'image/png';
  const msg = genData.choices?.[0]?.message;

  // Try images[] first (Gemini 3.x returns images separately)
  let imageParts = msg?.images || [];
  if (imageParts.length === 0 && Array.isArray(msg?.content)) {
    imageParts = msg.content.filter((p: any) => p.type === 'image_url');
  }

  for (const part of imageParts) {
    const dataUrl = part.image_url?.url || '';
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Image = match[2];
      break;
    }
  }

  if (!base64Image) {
    return new Response(JSON.stringify({ error: 'No image in response', raw: JSON.stringify(genData).substring(0, 500) }), { status: 500 });
  }

  // 2. Upload to WordPress Media Library
  const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
  const filename = body.filename || `generated-${Date.now()}.png`;
  const ext = mimeType.split('/')[1] || 'png';

  const uploadRes = await fetch(`${WP_CMS_URL}/index.php/?rest_route=/wp/v2/media`, {
    method: 'POST',
    headers: {
      ...wpHeaders(mimeType),
      'Content-Disposition': `attachment; filename="${filename}.${ext}"`,
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return new Response(JSON.stringify({ error: 'WP upload failed', details: err }), { status: 500 });
  }

  const media = await uploadRes.json();

  // 3. Optionally set as featured image
  if (body.pageId) {
    await fetch(`${WP_CMS_URL}/index.php/?rest_route=/wp/v2/pages/${body.pageId}`, {
      method: 'POST',
      headers: wpHeaders('application/json'),
      body: JSON.stringify({ featured_media: media.id }),
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    mediaId: media.id,
    url: media.source_url,
    width: media.media_details?.width,
    height: media.media_details?.height,
  }), { headers: { 'Content-Type': 'application/json' } });
};
