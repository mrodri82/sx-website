/**
 * i18n utilities for multilingual content.
 * SX is an English-first international festival. Default: en (no prefix),
 * de → /de/, es → /es/. Kept multi-locale to stay forward-compatible.
 */

export const LOCALES = ['en', 'de', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Extract locale from URL pathname.
 * /de/program → 'de'
 * /es/entradas → 'es'
 * /program → 'en' (default, no prefix)
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first === 'de' || first === 'es') return first;
  return DEFAULT_LOCALE;
}

/**
 * Get a localized field from content object.
 * Priority: requested locale → English → Spanish → shared field.
 */
export function t(content: Record<string, unknown>, fieldBase: string, locale: Locale): string {
  const localized = content[`${fieldBase}_${locale}`];
  if (localized && String(localized).trim()) return String(localized);
  // Fallback chain: English → Spanish → shared
  const en = content[`${fieldBase}_en`];
  if (en && String(en).trim()) return String(en);
  const es = content[`${fieldBase}_es`];
  if (es) return String(es);
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
