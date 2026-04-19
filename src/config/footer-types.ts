/**
 * Footer types — stable module, not replaced per clone.
 */
import type { NavLabel, NavLink } from './nav-types';
export type { NavLabel, NavLink };

export interface FooterColumn {
  title: NavLabel;
  links: NavLink[];
}

export interface FooterConfig {
  tagline?: NavLabel;
  columns: FooterColumn[];
  contactLines?: NavLabel[];
  legal: NavLink[];
  showCookiePrefs?: boolean;
}
