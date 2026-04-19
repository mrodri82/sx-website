import type { APIRoute } from 'astro';
import { exec } from 'node:child_process';
import { site } from '@/config/site';

export const prerender = false;

const NOTIFY_EMAILS = site.notifyEmails;

function sanitize(s: string): string {
  return s.replace(/[<>"'&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c] || c));
}

function sendEmail(to: string, subject: string, body: string, replyTo?: string): Promise<void> {
  return new Promise((resolve) => {
    const headers = [
      `Subject: ${subject}`,
      `From: ${site.brandName} Website <${site.senderEmail}>`,
      `To: ${to}`,
      replyTo ? `Reply-To: ${replyTo}` : '',
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
    ].filter(Boolean).join('\n');
    const msg = `${headers}\n\n${body}`;
    const escaped = msg.replace(/'/g, "'\\''");
    // -f sets envelope sender (return-path), required for SPF/DMARC + Hornetsecurity
    exec(`echo '${escaped}' | /usr/sbin/sendmail -f ${site.senderEmail} -t`, (err) => {
      if (err) console.error('sendmail error:', err.message);
      resolve();
    });
  });
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.message) {
    return new Response(JSON.stringify({ error: 'Name, email and message required' }), { status: 400 });
  }

  const name = sanitize(body.name);
  const email = sanitize(body.email);
  const phone = sanitize(body.phone || '-');
  const company = sanitize(body.company || '-');
  const message = sanitize(body.message);
  const source = sanitize(body.source || body.referrer || 'direct');

  // 1. Send notification emails to all recipients
  const emailBody = `Nuevo contacto desde ${site.domain}\n\nNombre: ${body.name}\nEmail: ${body.email}\nTelefono: ${body.phone || '-'}\nEmpresa: ${body.company || '-'}\nOrigen: ${source}\n\nMensaje:\n${body.message}\n\n---\nResponder directamente a: ${body.email}`;
  await Promise.all(NOTIFY_EMAILS.map(to => sendEmail(to, `[${site.brandName}] Contacto: ${body.name} [${source}]`, emailBody, body.email)));

  // 2. Store in WordPress
  const WP_URL = site.cmsUrl;
  const WP_USER = site.cmsUser;
  const WP_PASS = site.cmsPassword;

  try {
    await fetch(`${WP_URL}/index.php/?rest_route=/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${WP_USER}:${WP_PASS}`)}`,
        Host: new URL(WP_URL).host,
      },
      body: JSON.stringify({
        title: `Contacto: ${name} — ${email} [${source}]`,
        content: `<p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Telefono:</strong> ${phone}</p><p><strong>Empresa:</strong> ${company}</p><p><strong>Origen:</strong> ${source}</p><p><strong>Mensaje:</strong></p><p>${message}</p>`,
        status: 'private',
      }),
    });
  } catch {}

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
