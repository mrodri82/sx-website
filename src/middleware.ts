import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // If user visits the homepage and has a Nova session, redirect to editor
  if (context.url.pathname === '/' && !context.url.searchParams.has('nova_edit') && !context.url.searchParams.has('preview') && !context.url.searchParams.has('nova-preview')) {
    const cookie = context.request.headers.get('cookie') || '';
    if (cookie.includes('nova_session=')) {
      return context.redirect('/admin/live/homepage');
    }
  }

  return next();
});
