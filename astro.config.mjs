import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: process.env.SITE_URL || 'https://sxfestival.com',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  security: {
    checkOrigin: false,
  },
  build: {
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/kaufmich-demo') && !page.includes('/review'),
    }),
    svelte(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
