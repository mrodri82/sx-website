/**
 * Footer config — data-driven site footer.
 *
 * Clone adoption: replace this file's `footerConfig` export per clone.
 * Types live in ./footer-types.
 */

import type { FooterConfig } from './footer-types';
export type { FooterColumn, FooterConfig, NavLabel, NavLink } from './footer-types';

/** DEFAULT: ZDS footer. */
export const footerConfig: FooterConfig = {
  tagline: {
    es: 'Agencia digital con IA. Enterprise visibility & performance marketing.',
    en: 'AI-powered digital agency. Enterprise visibility & performance marketing.',
    de: 'KI-gestützte Digitalagentur. Enterprise-Visibility & Performance Marketing.',
  },
  columns: [
    {
      title: 'Enterprise',
      links: [
        { label: 'AI Visibility', href: '/servicios/ai-visibility' },
        { label: 'Custom Tools', href: '/servicios/herramientas' },
        { label: 'Data & Analytics', href: '/servicios/analytics' },
        { label: 'KI-Assistent', href: '/ki-assistent' },
        { label: 'Glosario SEO', href: '/glosario' },
      ],
    },
    {
      title: 'Performance',
      links: [
        { label: 'SEO & Content', href: '/b2-performance/seo' },
        { label: 'PPC & Ads', href: '/b2-performance/ppc' },
        { label: 'Social & Strategy', href: '/b2-performance/social' },
        { label: 'B2 Performance →', href: '/b2-performance' },
      ],
    },
  ],
  contactLines: [
    { es: 'Barcelona, España', en: 'Barcelona, Spain', de: 'Barcelona, Spanien' },
    { es: 'Herdecke / Dortmund, Alemania', en: 'Herdecke / Dortmund, Germany', de: 'Herdecke / Dortmund, Deutschland' },
  ],
  legal: [
    { label: { es: 'Aviso legal', en: 'Legal notice', de: 'Impressum' }, href: '/aviso-legal' },
    { label: { es: 'Privacidad', en: 'Privacy', de: 'Datenschutz' }, href: '/privacidad' },
    { label: 'Cookies', href: '/cookies' },
  ],
  showCookiePrefs: true,
};
