/**
 * i18n utilities for multilingual content.
 * Default: es (no prefix), en → /en/, de → /de/
 */

export const LOCALES = ['es', 'en', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

/**
 * Extract locale from URL pathname.
 * /en/servicios → 'en'
 * /de/kontakt → 'de'
 * /servicios → 'es' (default, no prefix)
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first === 'en' || first === 'de') return first;
  return DEFAULT_LOCALE;
}

/**
 * Get a localized field from content object.
 * Tries the requested locale first, falls back to ES.
 */
export function t(content: Record<string, unknown>, fieldBase: string, locale: Locale): string {
  const localized = content[`${fieldBase}_${locale}`];
  if (localized && String(localized).trim()) return String(localized);
  // Fallback to Spanish
  const fallback = content[`${fieldBase}_es`];
  if (fallback) return String(fallback);
  // Try without locale suffix (shared field)
  const shared = content[fieldBase];
  if (shared) return String(shared);
  return '';
}

/**
 * Get localized array items. Each item has _es/_en/_de fields.
 */
export function tItems(items: Record<string, unknown>[], locale: Locale): Record<string, string>[] {
  return items.map(item => {
    const result: Record<string, string> = {};
    const bases = new Set<string>();

    for (const key of Object.keys(item)) {
      const match = key.match(/^(.+)_(es|en|de)$/);
      if (match) bases.add(match[1]);
      else result[key] = String(item[key] ?? '');
    }

    for (const base of bases) {
      result[base] = t(item as Record<string, unknown>, base, locale);
    }

    return result;
  });
}

/**
 * Build a localized URL.
 */
export function localePath(path: string, locale: Locale): string {
  const clean = path.replace(/^\/(en|de)\//, '/');
  if (locale === DEFAULT_LOCALE) return clean;
  return `/${locale}${clean}`;
}
