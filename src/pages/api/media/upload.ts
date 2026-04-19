/**
 * Upload a file from the editor directly into the WordPress media library.
 * Accepts multipart/form-data with a single 'file' part. Returns the WP
 * attachment object so the editor can immediately use its source_url.
 */
import type { APIRoute } from 'astro';
import { getTokenFromCookies, getSession } from '@/lib/auth';
import { site } from '@/config/site';

export const prerender = false;

const WP_CMS_URL = site.cmsUrl;
const WP_CMS_USER = site.cmsUser;
const WP_CMS_APP_PASSWORD = site.cmsPassword;
const authHeader =
  WP_CMS_USER && WP_CMS_APP_PASSWORD
    ? 'Basic ' + btoa(`${WP_CMS_USER}:${WP_CMS_APP_PASSWORD}`)
    : '';

export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  const session = token ? getSession(token) : null;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }

  // WP accepts binary POST to /wp/v2/media with Content-Disposition
  // naming the filename. Keep it simple: stream the raw bytes with
  // Content-Type matching the file, and set the filename in the
  // disposition header. WP creates an attachment and returns it.
  const buf = await file.arrayBuffer();
  try {
    const res = await fetch(`${WP_CMS_URL}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        Host: site.cmsHost,
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.name.replace(/"/g, '')}"`,
      },
      body: buf,
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(
        JSON.stringify({ error: 'WP upload failed', status: res.status, details: err.slice(0, 300) }),
        { status: 502 }
      );
    }
    const data = await res.json();
    return new Response(
      JSON.stringify({
        id: data.id,
        source_url: data.source_url,
        alt_text: data.alt_text || '',
        mime_type: data.mime_type,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
