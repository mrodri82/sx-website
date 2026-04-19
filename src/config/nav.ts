/**
 * Navigation config — data-driven navigation menu.
 *
 * Clone adoption: replace this file's `navConfig` export to change the menu.
 * When `primary: []`, Navigation renders only logo + language switcher + CTA.
 *
 * Types and helpers live in ./nav-types so a clone only swaps the config, not
 * the helper functions.
 */

import type { NavConfig } from './nav-types';
export type { NavLabel, NavLink, NavGroup, NavDropdown, NavItem, NavConfig } from './nav-types';
export { isDropdown, localizeLabel } from './nav-types';

/** DEFAULT: ZDS navigation (kept so zds.es keeps working). Replace per clone. */
export const navConfig: NavConfig = {
  cta: {
    label: { es: 'Contacto', en: 'Contact', de: 'Kontakt' },
    href: '/contacto',
  },
  showLanguageSwitcher: true,
  primary: [
    {
      label: { es: 'Servicios', en: 'Services', de: 'Leistungen' },
      href: '/servicios',
      groups: [
        {
          title: 'SEO →',
          links: [
            { label: { es: 'GEO — AI Visibility', en: 'GEO — AI Visibility', de: 'GEO — KI-Sichtbarkeit' }, href: '/servicios-geo' },
            { label: 'SEO Técnico', href: '/servicios-seo-tecnico' },
            { label: 'SEO Internacional', href: '/servicios-seo-internacional' },
            { label: 'SEO Local', href: '/servicios-seo-local' },
            { label: 'SEO E-Commerce', href: '/servicios-seo-ecommerce' },
            { label: 'Amazon SEO', href: '/servicios-amazon-seo' },
            { label: 'Relaunch & Migration', href: '/servicios-relaunch-seo' },
            { label: 'Core Web Vitals', href: '/servicios-core-web-vitals' },
            { label: 'Linkbuilding & Offpage', href: '/servicios-linkbuilding' },
          ],
        },
        {
          title: 'Marketing & Ads →',
          links: [
            { label: 'Google Ads', href: '/servicios-google-ads' },
            { label: 'Amazon Ads', href: '/servicios-amazon-ads' },
            { label: 'Content Strategy', href: '/servicios-content-strategy' },
            { label: 'Email Marketing', href: '/servicios-email-marketing' },
            { label: 'Marketing Automation', href: '/servicios-marketing-automation' },
            { label: 'CRO (Conversion)', href: '/servicios-cro' },
            { label: 'Digital PR', href: '/servicios-digital-pr' },
          ],
        },
        {
          title: 'Design & Consulting →',
          links: [
            { label: 'Web Design & Dev', href: '/servicios-web-design' },
            { label: 'UX & Usabilidad', href: '/servicios-ux' },
            { label: 'Branding', href: '/servicios-branding' },
            { label: 'Consultoría Digital', href: '/servicios-consultoria' },
            { label: 'Analytics & Dashboards', href: '/servicios-analytics' },
            { label: 'Accesibilidad Web', href: '/servicios-accesibilidad' },
            { label: 'Auditorías', href: '/servicios-audits' },
            { label: 'Formación & Workshops', href: '/servicios-training' },
          ],
        },
      ],
      featured: [
        { label: 'B2 Performance →', href: '/b2-performance' },
        { label: 'Recursos →', href: '/recursos' },
        { label: 'Glosario →', href: '/glosario' },
      ],
    },
    {
      label: { es: 'IA', en: 'AI', de: 'KI' },
      href: '/servicios/ai-visibility',
      groups: [
        {
          title: { es: 'Productos y Servicios de IA', en: 'AI Products & Services', de: 'KI-Produkte & Services' },
          links: [
            { label: 'AI Visibility Tracker', href: '/servicios/ai-visibility' },
            { label: { es: 'GEO — Visibilidad en IA', en: 'GEO — AI Visibility', de: 'GEO — KI-Sichtbarkeit' }, href: '/servicios-geo' },
            { label: { es: 'ETIM y herramientas personalizadas', en: 'ETIM & Custom Tools', de: 'ETIM & Custom Tools' }, href: '/servicios/herramientas' },
            { label: 'Data & Analytics', href: '/servicios/analytics' },
            { label: { es: 'Asistente IA (Enterprise)', en: 'AI Assistant (Enterprise)', de: 'KI-Assistent (Enterprise)' }, href: '/ki-assistent' },
          ],
        },
      ],
    },
    {
      label: { es: 'Sectores', en: 'Sectors', de: 'Branchen' },
      href: '/sectores',
      groups: [
        {
          title: { es: 'Todos los sectores', en: 'All sectors', de: 'Alle Branchen' },
          links: [
            { label: 'SHK / HVAC', href: '/sectores-shk' },
            { label: 'Electro & Wholesale', href: '/sectores-electro' },
            { label: 'Turismo & Hotels', href: '/sectores-turismo' },
            { label: 'Retail & Consumer', href: '/sectores-retail' },
            { label: 'Pharma & FMCG', href: '/sectores-pharma' },
            { label: 'Industrial & B2B', href: '/sectores-industrial' },
            { label: 'Fashion & Lifestyle', href: '/sectores-fashion' },
            { label: 'Food & Gastro', href: '/sectores-food' },
            { label: 'Tech & SaaS', href: '/sectores-tech' },
            { label: 'Dating & Matching', href: '/sectores-dating' },
          ],
        },
      ],
    },
    { label: { es: 'Proyectos', en: 'Projects', de: 'Projekte' }, href: '/proyectos' },
    { label: { es: 'Insights', en: 'Insights', de: 'Insights' }, href: '/insights' },
    { label: { es: 'Nosotros', en: 'About', de: 'Über uns' }, href: '/nosotros' },
  ],
};
