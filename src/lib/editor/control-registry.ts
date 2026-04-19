/**
 * Nova Editor Control Registry
 * Defines field types per module — the single source of truth for the edit panel.
 */

export type ControlType = 'text' | 'textarea' | 'number' | 'select' | 'color' | 'media' | 'url' | 'icon' | 'toggle' | 'richtext' | 'repeater';

export interface FieldDef {
  key: string;
  label: string;
  type: ControlType;
  translatable?: boolean; // true = _es/_en/_de (default true for text/textarea/richtext)
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  default?: unknown;
  hint?: string;
}

export interface RepeaterFieldDef extends FieldDef {
  type: 'repeater';
  itemLabel: string;
  itemFields: FieldDef[];
  collapsedTitle?: string; // which sub-field to show when collapsed
  maxItems?: number;
}

export interface ModuleControlDef {
  content: (FieldDef | RepeaterFieldDef)[];
  style?: FieldDef[];
}

// Helper to reduce boilerplate
const t = (key: string, label: string, type: ControlType = 'text', extra: Partial<FieldDef> = {}): FieldDef =>
  ({ key, label, type, translatable: ['text', 'textarea', 'richtext'].includes(type), ...extra });

const shared = (key: string, label: string, type: ControlType = 'text', extra: Partial<FieldDef> = {}): FieldDef =>
  ({ key, label, type, translatable: false, ...extra });

const repeater = (key: string, itemLabel: string, itemFields: FieldDef[], collapsedTitle?: string, extra: Partial<RepeaterFieldDef> = {}): RepeaterFieldDef =>
  ({ key, label: itemLabel + 's', type: 'repeater', translatable: false, itemLabel, itemFields, collapsedTitle: collapsedTitle || 'title', ...extra });

// ============================================================
// REGISTRY
// ============================================================

export const CONTROL_REGISTRY: Record<string, ModuleControlDef> = {

  Hero: {
    content: [
      t('badge', 'Badge'),
      t('headline', 'Headline', 'textarea'),
      t('subtitle', 'Subtitle', 'textarea'),
      t('cta_primary_text', 'CTA Primär Text'),
      shared('cta_primary_url', 'CTA Primär URL', 'url'),
      t('cta_secondary_text', 'CTA Sekundär Text'),
      shared('cta_secondary_url', 'CTA Sekundär URL', 'url'),
      shared('background_image', 'Hintergrundbild', 'media'),
    ],
  },

  NumbersBar: {
    content: [
      repeater('items', 'Metrik', [
        shared('value', 'Wert'),
        shared('suffix', 'Suffix'),
        t('label', 'Label'),
      ], 'label'),
    ],
  },

  LogoTicker: {
    content: [
      t('label', 'Label'),
      // clients is a string array — handle as textarea (one per line)
      shared('_clients_text', 'Kunden (eine pro Zeile)', 'textarea', { hint: 'Jede Zeile = ein Name im Ticker' }),
    ],
  },

  TextBlock: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('body', 'Text', 'richtext'),
    ],
  },

  ThreeColumns: {
    content: [
      t('section_label', 'Section Label'),
      t('headline', 'Headline', 'textarea'),
      t('subtitle', 'Subtitle', 'textarea'),
      repeater('items', 'Spalte', [
        shared('icon', 'Icon', 'icon'),
        t('title', 'Titel'),
        t('desc', 'Beschreibung', 'textarea'),
      ], 'title'),
    ],
  },

  CTABand: {
    content: [
      t('headline', 'Headline'),
      t('highlight', 'Highlight-Wort'),
      t('subtitle', 'Subtitle', 'textarea'),
      t('button_text', 'Button Text'),
      shared('button_url', 'Button URL', 'url'),
    ],
  },

  TeamSection: {
    content: [
      t('label', 'Label'),
      t('quote', 'Zitat', 'textarea'),
      shared('founder_name', 'Name'),
      t('founder_role', 'Rolle'),
      shared('founder_photo', 'Foto', 'media'),
      shared('team_photo', 'Team-Foto', 'media'),
    ],
  },

  ProcessSteps: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      repeater('steps', 'Schritt', [
        shared('number', 'Nummer'),
        t('title', 'Titel'),
        t('desc', 'Beschreibung', 'textarea'),
      ], 'title'),
    ],
  },

  Stats: {
    content: [
      repeater('items', 'Statistik', [
        shared('value', 'Wert'),
        shared('suffix', 'Suffix'),
        t('label', 'Label'),
      ], 'label'),
    ],
  },

  FeatureList: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline', 'textarea'),
      t('subtitle', 'Subtitle', 'textarea'),
      shared('layout', 'Layout', 'select', { options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'Liste' }] }),
      repeater('items', 'Feature', [
        shared('icon', 'Icon', 'icon'),
        t('title', 'Titel'),
        t('desc', 'Beschreibung', 'textarea'),
      ], 'title'),
    ],
  },

  FeatureDetail: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('body', 'Text', 'richtext'),
      shared('image', 'Bild', 'media'),
      repeater('items', 'Detail', [
        shared('icon', 'Icon', 'icon'),
        t('title', 'Titel'),
        t('desc', 'Beschreibung', 'textarea'),
      ], 'title'),
    ],
  },

  FAQ: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      repeater('items', 'Frage', [
        t('question', 'Frage'),
        t('answer', 'Antwort', 'textarea'),
      ], 'question'),
    ],
  },

  CaseStudy: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('subtitle', 'Subtitle', 'textarea'),
      t('client', 'Kunde'),
      shared('image', 'Bild', 'media'),
      t('link_text', 'Link Text'),
      shared('link_url', 'Link URL', 'url'),
      repeater('results', 'Ergebnis', [
        shared('value', 'Wert'),
        t('metric', 'Metrik'),
        t('desc', 'Beschreibung'),
      ], 'metric'),
    ],
  },

  CardGrid: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('subtitle', 'Subtitle', 'textarea'),
      shared('columns', 'Spalten', 'select', { options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] }),
      repeater('items', 'Karte', [
        shared('icon', 'Icon', 'icon'),
        t('title', 'Titel'),
        t('desc', 'Beschreibung', 'textarea'),
        t('link_text', 'Link Text'),
        shared('link_url', 'Link URL', 'url'),
      ], 'title'),
    ],
  },

  Testimonials: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      repeater('items', 'Testimonial', [
        t('quote', 'Zitat', 'textarea'),
        t('name', 'Name'),
        t('role', 'Rolle'),
        t('company', 'Firma'),
        shared('avatar', 'Avatar', 'media'),
      ], 'name'),
    ],
  },

  Timeline: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      repeater('items', 'Eintrag', [
        shared('year', 'Jahr'),
        t('title', 'Titel'),
        t('desc', 'Beschreibung', 'textarea'),
      ], 'title'),
    ],
  },

  PricingTable: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('subtitle', 'Subtitle', 'textarea'),
      repeater('items', 'Paket', [
        t('name', 'Name'),
        t('price', 'Preis'),
        t('period', 'Zeitraum'),
        t('cta_text', 'Button Text'),
        shared('cta_url', 'Button URL', 'url'),
        shared('highlighted', 'Hervorgehoben', 'toggle'),
        // features as textarea (one per line) for simplicity
        t('features_text', 'Features (eine pro Zeile)', 'textarea', { hint: 'Jede Zeile = ein Feature' }),
      ], 'name'),
    ],
  },

  Comparison: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('left_title', 'Links Titel'),
      t('right_title', 'Rechts Titel'),
      repeater('items', 'Zeile', [
        t('feature', 'Feature'),
        t('left', 'Links'),
        t('right', 'Rechts'),
      ], 'feature'),
    ],
  },

  AIShowcase: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('subtitle', 'Subtitle', 'textarea'),
      repeater('items', 'Feature', [
        shared('icon', 'Icon', 'icon'),
        t('title', 'Titel'),
        t('desc', 'Beschreibung', 'textarea'),
      ], 'title'),
    ],
  },

  Quote: {
    content: [
      t('quote', 'Zitat', 'textarea'),
      t('author', 'Autor'),
      t('role', 'Rolle'),
      t('company', 'Firma'),
    ],
  },

  ImageGallery: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      repeater('images', 'Bild', [
        shared('url', 'Bild URL', 'media'),
        t('alt', 'Alt Text'),
        t('caption', 'Beschriftung'),
      ], 'alt'),
    ],
  },

  VideoEmbed: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      shared('video_url', 'Video URL', 'url'),
      shared('poster_image', 'Vorschaubild', 'media'),
    ],
  },

  TeamGrid: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      repeater('members', 'Mitglied', [
        shared('name', 'Name'),
        t('role', 'Rolle'),
        shared('photo', 'Foto', 'media'),
        shared('photo_position', 'Foto-Position', 'text', { placeholder: 'center 30%' }),
        shared('linkedin', 'LinkedIn URL', 'url'),
      ], 'name'),
    ],
  },

  LogoGrid: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      repeater('items', 'Logo', [
        shared('name', 'Name'),
        shared('logo', 'Logo URL', 'media'),
        shared('url', 'Website URL', 'url'),
      ], 'name'),
    ],
  },

  ContactForm: {
    content: [
      t('label', 'Label'),
      t('headline', 'Headline'),
      t('subtitle', 'Subtitle', 'textarea'),
    ],
  },
};
