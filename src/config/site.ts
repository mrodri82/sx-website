/**
 * SX Festival — Site Configuration
 *
 * All site-specific values read from .env (see .env.example).
 */

const env = import.meta.env;

export const site = {
  // ── Core ──
  domain: env.SITE_DOMAIN || 'sx.zds.es',
  url:    env.SITE_URL    || `https://${env.SITE_DOMAIN || 'sx.zds.es'}`,

  // ── WordPress (headless CMS) ──
  cmsUrl:       env.WP_CMS_URL        || 'http://sx.zds.es',
  cmsUser:      env.WP_CMS_USER       || '',
  cmsPassword:  env.WP_CMS_APP_PASSWORD || '',
  cmsHost:      env.WP_CMS_HOST       || 'sx.zds.es',
  cmsProxyPort: env.WP_CMS_PROXY_PORT || '80',

  // ── Admin Host Detection (noindex) ──
  adminHostDomain: env.ADMIN_HOST_DOMAIN || 'sx.zds.es',
  adminHostIp:     env.ADMIN_HOST_IP     || '89.167.47.53',

  // ── Branding ──
  brandName:     env.BRAND_NAME         || 'SX Festival',
  brandFullName: env.BRAND_FULL_NAME    || 'SX Festival & Expo 2026 Berlin',
  brandAltName:  env.BRAND_ALT_NAME     || 'sxfestival.com',
  legalName:     env.BRAND_LEGAL_NAME   || 'Sx TechEU GmbH',
  logoUrl:       env.BRAND_LOGO_URL     || '',

  // ── Contact ──
  contactEmail:  env.CONTACT_EMAIL      || 'info@sxfestival.com',
  notifyEmails: (env.CONTACT_NOTIFY_EMAILS || 'info@sxfestival.com').split(',').map((e: string) => e.trim()).filter(Boolean),
  senderEmail:   env.SENDER_EMAIL       || 'noreply@sxfestival.com',
  phone:         env.CONTACT_PHONE      || '',

  // ── Address ──
  streetAddress: env.ADDRESS_STREET     || 'Level 8, Linkstraße 2',
  city:          env.ADDRESS_CITY       || 'Berlin',
  region:        env.ADDRESS_REGION     || '',
  postalCode:    env.ADDRESS_POSTCODE   || '10785',
  country:       env.ADDRESS_COUNTRY    || 'DE',
  foundingDate:  env.FOUNDING_DATE      || '2024',
  linkedinUrl:   env.LINKEDIN_URL       || 'https://www.linkedin.com/company/13008767',
  instagramUrl:  env.INSTAGRAM_URL      || 'https://www.instagram.com/sxtecheu/',

  // ── AI ──
  openrouterKey: env.OPENROUTER_API_KEY || '',
  aiModel:       env.AI_MODEL           || 'anthropic/claude-opus-4.6',

  // ── Languages ──
  defaultLocale: env.DEFAULT_LOCALE     || 'en',
  locales:      (env.LOCALES            || 'en').split(',').map((l: string) => l.trim()).filter(Boolean),

  // ── Derived ──
  get siteOrigin() { return `https://${this.domain}`; },
  get cmsOrigin() { return this.cmsUrl.replace(/\/+$/, ''); },
  get wpApiBase() { return `${this.cmsOrigin}/wp-json`; },

  isAdminHost(host: string): boolean {
    return host.startsWith(this.adminHostDomain) || host.startsWith(this.adminHostIp);
  },
} as const;

export type SiteConfig = typeof site;
