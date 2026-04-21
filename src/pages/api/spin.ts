import type { APIRoute } from 'astro';

/**
 * /api/spin — records a wheel spin (email + prize).
 *
 * Today: just logs to stdout (captured by systemd journal). Later hooks:
 *   - Monday CRM: POST to Monday API with email + prize
 *   - Mailchimp: add to SX list
 *   - Email receipt to winner (SendGrid / SMTP)
 *
 * Non-fatal: wheel works regardless of whether this endpoint succeeds,
 * so client-side fire-and-forget is fine.
 */
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, prize, code, at } = data || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // stdout line — grep'able in journalctl later
    console.log(`[spin] ${email} won ${prize || '?'} (code=${code || '-'}) at=${at || '-'}`);

    // TODO: push to Monday CRM once API key is wired (env MONDAY_API_KEY).
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[spin] error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'server_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
