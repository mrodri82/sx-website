/**
 * Navigation types + helpers — stable module, not replaced per clone.
 * Clones replace `nav.ts` only (the navConfig export).
 */

export type NavLabel = string | Partial<Record<'es' | 'en' | 'de', string>>;

export interface NavLink {
  label: NavLabel;
  href: string;
  highlight?: boolean;
}

export interface NavGroup {
  title: NavLabel;
  links: NavLink[];
}

export interface NavDropdown {
  label: NavLabel;
  href?: string;
  groups: NavGroup[];
  featured?: NavLink[];
}

export type NavItem = NavLink | NavDropdown;

export interface NavConfig {
  primary: NavItem[];
  cta?: { label: NavLabel; href: string } | null;
  logoUrl?: string;
  showLanguageSwitcher?: boolean;
}

export function isDropdown(item: NavItem): item is NavDropdown {
  return 'groups' in item;
}

export function localizeLabel(label: NavLabel, locale: 'es' | 'en' | 'de'): string {
  if (typeof label === 'string') return label;
  return label[locale] || label.en || label.es || label.de || '';
}
