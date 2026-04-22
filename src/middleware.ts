import { defineMiddleware } from 'astro:middleware';

/* No auto-redirect. Admins reach the editor explicitly via /admin/live/<slug>
   or the WP "Edit with Nova" button (which routes through /admin/auto-login
   with a one-time token). Visiting `/` should always render the public
   homepage, regardless of whether a Nova session cookie happens to exist. */
export const onRequest = defineMiddleware(async (_context, next) => next());
