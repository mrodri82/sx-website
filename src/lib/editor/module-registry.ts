/**
 * MODULE_REGISTRY — Central definition for all 27 module types.
 * The Nova Editor generates its 3-tab UI (Content / Style / Advanced) from this registry.
 *
 * Field types:
 *   text      — single line input
 *   textarea  — multi-line textarea
 *   richtext  — Tiptap rich text editor (HTML output, supports highlight mark)
 *   media     — WordPress Media Library picker
 *   pagelink  — Internal page picker (page:ID format)
 *   select    — Dropdown with options
 *   icon      — Font Awesome icon picker
 *   toggle    — Boolean checkbox
 *   color     — Color swatch + hex input
 *   size      — Number input with unit (px/em/rem/%)
 *
 * tr: true means the field is translatable (ES/EN/DE variants)
 */

export interface RegistryField {
  key: string;
  type: 'text' | 'textarea' | 'richtext' | 'inline-html' | 'media' | 'pagelink' | 'select' | 'icon' | 'toggle' | 'color' | 'size';
  label?: string;
  tr?: boolean;
  options?: string[];
  hint?: string;
  // DOM binding for live editor (optional — old editor ignores these)
  domEl?: string;            // data-nova-el value to read from (e.g., "hero-title")
  domRead?: 'innerHTML' | 'textContent' | 'attribute'; // how to extract value
  domAttribute?: string;     // if domRead is 'attribute', which attr (e.g., 'href')
  // Conditional visibility: show this field only when another field matches
  showWhen?: {
    field: string;              // key of the field to watch (e.g., 'layout')
    equals: string | string[];  // value(s) that trigger visibility
  };
}

export interface RegistrySection {
  section: string;
  collapsed?: boolean;
  fields: RegistryField[];
}

export interface RegistryStyleField {
  prop: string;
  label?: string;
  type: 'color' | 'size' | 'text';
}

export interface RegistryStyleSection {
  section: string;
  element: string; // data-nova-el value
  fields: RegistryStyleField[];
}

export interface RegistryRepeater {
  key: string;       // Array field name in content (e.g., "items", "steps")
  label: string;     // Singular label for UI (e.g., "Frage", "Schritt")
  col: string;       // Field to show in collapsed card header
  fields: RegistryField[];
}

export interface ModuleDefinition {
  content: RegistrySection[];
  style: RegistryStyleSection[];
  repeaters: RegistryRepeater[];
}

// ═══════════════════════════════════════════════
// MODULE REGISTRY
// ═══════════════════════════════════════════════

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {

  // ────────── HERO ──────────
  Hero: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Badge / Label', domEl: 'hero-badge', domRead: 'textContent' },
        { key: 'headline', type: 'inline-html', tr: true, label: 'Headline', domEl: 'hero-title', domRead: 'innerHTML' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel', domEl: 'hero-subtitle', domRead: 'textContent' },
        { key: 'cta_text', type: 'text', tr: true, label: 'Button Primär', domEl: 'hero-cta-primary', domRead: 'textContent' },
        { key: 'cta2_text', type: 'text', tr: true, label: 'Button Sekundär', domEl: 'hero-cta-secondary', domRead: 'textContent' },
      ]},
      { section: 'Links', collapsed: true, fields: [
        { key: 'cta_url', type: 'pagelink', label: 'Button Primär URL', domEl: 'hero-cta-primary', domRead: 'attribute', domAttribute: 'href' },
        { key: 'cta2_url', type: 'pagelink', label: 'Button Sekundär URL', domEl: 'hero-cta-secondary', domRead: 'attribute', domAttribute: 'href' },
      ]},
      { section: 'Darstellung', collapsed: true, fields: [
        // highlight_word removed — color the word directly via Tiptap toolbar in the headline editor
        { key: 'layout', type: 'select', label: 'Layout', options: ['default', '2col', '2col-reverse', '2col-form', 'minimal'] },
        { key: 'image', type: 'media', label: 'Seitenbild (für 2col)', showWhen: { field: 'layout', equals: ['2col', '2col-reverse'] } },
      ]},
    ],
    style: [
      { section: 'Hintergrund', element: 'hero-section', fields: [
        { prop: 'background-image', type: 'text', label: 'Hintergrundbild' },
        { prop: 'background-position', type: 'text', label: 'Bildposition' },
        { prop: 'background-color', type: 'color', label: 'Hintergrundfarbe' },
      ]},
      { section: 'Headline', element: 'hero-title', fields: [
        { prop: 'color', type: 'color', label: 'Farbe' },
        { prop: 'font-size', type: 'size', label: 'Größe' },
      ]},
      { section: 'Untertitel', element: 'hero-subtitle', fields: [
        { prop: 'color', type: 'color', label: 'Farbe' },
      ]},
      { section: 'Button Primär', element: 'hero-cta-primary', fields: [
        { prop: 'background-color', type: 'color', label: 'Hintergrund' },
        { prop: 'color', type: 'color', label: 'Text' },
        { prop: 'border-radius', type: 'size', label: 'Rundung' },
      ]},
      { section: 'Button Sekundär', element: 'hero-cta-secondary', fields: [
        { prop: 'border-color', type: 'color', label: 'Rahmen' },
        { prop: 'color', type: 'color', label: 'Text' },
      ]},
    ],
    repeaters: [],
  },

  // ────────── TEXT BLOCK ──────────
  TextBlock: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label', domEl: 'text-label', domRead: 'textContent' },
        { key: 'headline', type: 'inline-html', tr: true, label: 'Headline', domEl: 'text-title', domRead: 'innerHTML' },
        { key: 'subtitle', type: 'richtext', tr: true, label: 'Body', domEl: 'text-body', domRead: 'innerHTML' },
      ]},
    ],
    style: [
      { section: 'Headline', element: 'text-title', fields: [
        { prop: 'color', type: 'color' },
        { prop: 'font-size', type: 'size' },
      ]},
    ],
    repeaters: [],
  },

  // ────────── CTA BAND ──────────
  CTABand: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'headline', type: 'text', tr: true, label: 'Headline', domEl: 'cta-title', domRead: 'textContent' },
        { key: 'highlight', type: 'text', tr: true, label: 'Highlight (farbig)', domEl: 'cta-highlight', domRead: 'textContent' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel', domEl: 'cta-subtitle', domRead: 'textContent' },
        { key: 'cta_text', type: 'text', tr: true, label: 'Button Text', domEl: 'cta-button', domRead: 'textContent' },
      ]},
      // Button URL is accessible via the link icon on BUTTON TEXT field.
      // Theme is in Style tab → Modul-Hintergrund & Layout.
    ],
    style: [
      { section: 'Hintergrund', element: 'cta-section', fields: [
        { prop: 'background-image', type: 'text', label: 'Hintergrundbild' },
        { prop: 'background-color', type: 'color', label: 'Hintergrundfarbe' },
      ]},
      { section: 'Button', element: 'cta-button', fields: [
        { prop: 'background-color', type: 'color' },
        { prop: 'color', type: 'color' },
      ]},
    ],
    repeaters: [],
  },

  // ────────── CTA FORM ──────────
  CTAForm: {
    content: [
      { section: 'Text', fields: [
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel' },
      ]},
      { section: 'Ansprechpartner', fields: [
        { key: 'person_name', type: 'text', label: 'Name' },
        { key: 'person_role', type: 'text', tr: true, label: 'Rolle' },
        { key: 'person_image', type: 'media', label: 'Foto' },
      ]},
    ],
    style: [],
    repeaters: [],
  },

  // ────────── LIQUID GLASS ──────────
  LiquidGlass: {
    content: [
      { section: 'Header', fields: [
        { key: 'section_label', type: 'text', tr: true, label: 'Section Label', domEl: 'liquid-glass-label', domRead: 'textContent' },
        { key: 'headline', type: 'inline-html', tr: true, label: 'Headline', domEl: 'liquid-glass-title', domRead: 'innerHTML' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel', domEl: 'liquid-glass-subtitle', domRead: 'textContent' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Glass Card', col: 'title',
      fields: [
        { key: 'badge', type: 'text', tr: true, label: 'Badge', domEl: 'liquid-glass-card-badge', domRead: 'textContent' },
        { key: 'title', type: 'text', tr: true, label: 'Titel', domEl: 'liquid-glass-card-title', domRead: 'textContent' },
        { key: 'desc', type: 'textarea', tr: true, label: 'Beschreibung', domEl: 'liquid-glass-card-desc', domRead: 'textContent' },
        { key: 'value', type: 'text', tr: true, label: 'Wert (groß)', domEl: 'liquid-glass-card-value', domRead: 'textContent' },
        { key: 'trend', type: 'text', tr: true, label: 'Trend / Subtext', domEl: 'liquid-glass-card-trend', domRead: 'textContent' },
      ],
    }],
  },

  // ────────── THREE COLUMNS ──────────
  ThreeColumns: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Section Label', domEl: 'columns-label', domRead: 'textContent' },
        { key: 'headline', type: 'inline-html', tr: true, label: 'Headline', domEl: 'columns-title', domRead: 'innerHTML' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel', domEl: 'columns-subtitle', domRead: 'textContent' },
      ]},
    ],
    style: [
      { section: 'Hintergrund', element: 'columns-section', fields: [
        { prop: 'background-color', type: 'color' },
      ]},
      { section: 'Headline', element: 'columns-title', fields: [
        { prop: 'color', type: 'color' },
      ]},
      { section: 'Cards', element: 'columns-card', fields: [
        { prop: 'background-color', type: 'color' },
        { prop: 'border-color', type: 'color' },
      ]},
    ],
    repeaters: [{
      key: 'items', label: 'Spalte', col: 'title',
      fields: [
        { key: 'icon', type: 'icon', label: 'Icon' },
        { key: 'title', type: 'text', tr: true, label: 'Titel', domEl: 'columns-card-title', domRead: 'textContent' },
        { key: 'description', type: 'textarea', tr: true, label: 'Beschreibung', domEl: 'columns-card-text', domRead: 'textContent' },
        { key: 'url', type: 'pagelink', label: 'Link' },
        { key: 'badge', type: 'text', label: 'Badge' },
      ],
    }],
  },

  // ────────── CARD GRID ──────────
  CardGrid: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Section Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Karte', col: 'title',
      fields: [
        { key: 'icon', type: 'icon', label: 'Icon' },
        { key: 'image', type: 'media', label: 'Bild' },
        { key: 'badge', type: 'text', tr: true, label: 'Badge' },
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'subtitle', type: 'text', tr: true, label: 'Untertitel' },
        { key: 'desc', type: 'textarea', tr: true, label: 'Beschreibung' },
        { key: 'rating', type: 'text', label: 'Bewertung' },
        { key: 'price', type: 'text', label: 'Preis' },
        { key: 'link_text', type: 'text', tr: true, label: 'Link Text' },
        { key: 'href', type: 'pagelink', label: 'Link URL' },
      ],
    }],
  },

  // ────────── FEATURE LIST ──────────
  FeatureList: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel' },
      ]},
      { section: 'Layout', fields: [
        { key: 'layout', type: 'select', label: 'Layout', options: ['list', 'grid'] },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Feature', col: 'title',
      fields: [
        { key: 'icon', type: 'icon', label: 'Icon' },
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'description', type: 'textarea', tr: true, label: 'Beschreibung' },
      ],
    }],
  },

  // ────────── PROCESS STEPS ──────────
  ProcessSteps: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label', domEl: 'process-label', domRead: 'textContent' },
        { key: 'headline', type: 'inline-html', tr: true, label: 'Headline', domEl: 'process-title', domRead: 'innerHTML' },
      ]},
    ],
    style: [
      { section: 'Hintergrund', element: 'process-section', fields: [
        { prop: 'background-color', type: 'color' },
      ]},
      { section: 'Schritt-Nummer', element: 'process-step-number', fields: [
        { prop: 'color', type: 'color' },
      ]},
    ],
    repeaters: [{
      key: 'steps', label: 'Schritt', col: 'title',
      fields: [
        { key: 'number', type: 'text', label: 'Nummer', domEl: 'process-step-number', domRead: 'textContent' },
        { key: 'title', type: 'text', tr: true, label: 'Titel', domEl: 'process-step-title', domRead: 'textContent' },
        { key: 'description', type: 'textarea', tr: true, label: 'Beschreibung', domEl: 'process-step-desc', domRead: 'textContent' },
      ],
    }],
  },

  // ────────── NUMBERS BAR ──────────
  NumbersBar: {
    content: [],
    style: [],
    repeaters: [{
      key: 'items', label: 'Metrik', col: 'label',
      fields: [
        { key: 'value', type: 'text', label: 'Wert' },
        { key: 'label', type: 'text', tr: true, label: 'Beschriftung' },
      ],
    }],
  },

  // ────────── STATS ──────────
  Stats: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [] },
    ],
    style: [
      { section: 'Hintergrund', element: 'stats-section', fields: [
        { prop: 'background-color', type: 'color' },
      ]},
      { section: 'Werte', element: 'stats-value', fields: [
        { prop: 'color', type: 'color' },
      ]},
    ],
    repeaters: [{
      key: 'items', label: 'Stat', col: 'label',
      fields: [
        { key: 'value', type: 'text', label: 'Wert', domEl: 'stats-value', domRead: 'textContent' },
        { key: 'suffix', type: 'text', label: 'Suffix (+, %, h)' },
        { key: 'label', type: 'text', tr: true, label: 'Beschriftung', domEl: 'stats-label', domRead: 'textContent' },
      ],
    }],
  },

  // ────────── FAQ ──────────
  FAQ: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'headline', type: 'inline-html', tr: true, label: 'Headline', domEl: 'faq-title', domRead: 'innerHTML' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Frage', col: 'question',
      fields: [
        { key: 'question', type: 'text', tr: true, label: 'Frage', domEl: 'faq-question', domRead: 'textContent' },
        { key: 'answer', type: 'richtext', tr: true, label: 'Antwort', domEl: 'faq-answer', domRead: 'innerHTML' },
      ],
    }],
  },

  // ────────── TESTIMONIALS ──────────
  Testimonials: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Testimonial', col: 'author',
      fields: [
        { key: 'quote', type: 'textarea', tr: true, label: 'Zitat' },
        { key: 'author', type: 'text', label: 'Name' },
        { key: 'company', type: 'text', label: 'Unternehmen' },
        { key: 'avatar', type: 'media', label: 'Foto' },
      ],
    }],
  },

  // ────────── COMPARISON ──────────
  Comparison: {
    content: [
      { section: 'Header', fields: [
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'left_title', type: 'text', tr: true, label: 'Links-Titel' },
        { key: 'right_title', type: 'text', tr: true, label: 'Rechts-Titel' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Zeile', col: 'left',
      fields: [
        { key: 'left', type: 'text', tr: true, label: 'Links' },
        { key: 'right', type: 'text', tr: true, label: 'Rechts' },
      ],
    }],
  },

  // ────────── CASE STUDY ──────────
  CaseStudy: {
    content: [
      { section: 'Text', fields: [
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'description', type: 'textarea', tr: true, label: 'Beschreibung' },
        { key: 'image', type: 'media', label: 'Bild' },
        { key: 'url', type: 'pagelink', label: 'Link' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'results', label: 'Ergebnis', col: 'metric',
      fields: [
        { key: 'value', type: 'text', label: 'Wert' },
        { key: 'metric', type: 'text', tr: true, label: 'Metrik' },
      ],
    }],
  },

  // ────────── LOGO TICKER ──────────
  LogoTicker: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
      ]},
    ],
    style: [
      { section: 'Hintergrund', element: 'ticker-section', fields: [
        { prop: 'background-color', type: 'color' },
      ]},
    ],
    repeaters: [{
      key: 'clients',
      label: 'Kunde',
      col: 'name',
      fields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'logo', label: 'Logo', type: 'media' },
      ],
    }],
    repeaters: [{
      key: 'clients', label: 'Kunde', col: 'name',
      fields: [
        { key: 'name', type: 'text', label: 'Name' },
        { key: 'logo', type: 'media', label: 'Logo' },
      ],
    }],
  },

  // ────────── LOGO GRID ──────────
  LogoGrid: {
    content: [],
    style: [],
    repeaters: [{
      key: 'logos', label: 'Logo', col: 'name',
      fields: [
        { key: 'name', type: 'text', tr: true, label: 'Name' },
        { key: 'image', type: 'media', label: 'Logo' },
        { key: 'url', type: 'pagelink', label: 'Link' },
      ],
    }],
  },

  // ────────── TEAM SECTION ──────────
  TeamSection: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label', domEl: 'team-label', domRead: 'textContent' },
        { key: 'quote', type: 'textarea', tr: true, label: 'Zitat', domEl: 'team-quote', domRead: 'textContent' },
        { key: 'founder_name', type: 'text', label: 'Gründer Name', domEl: 'team-name', domRead: 'textContent' },
      ]},
      { section: 'Eigenschaften', collapsed: true, fields: [
        { key: 'founder_role', type: 'text', tr: true, label: 'Gründer Rolle' },
        { key: 'founder_photo', type: 'media', label: 'Gründer Foto' },
        { key: 'team_photo', type: 'media', label: 'Team Foto' },
      ]},
    ],
    style: [
      { section: 'Hintergrund', element: 'team-section', fields: [
        { prop: 'background-color', type: 'color' },
      ]},
    ],
    repeaters: [{
      key: 'locations', label: 'Standort', col: 'city',
      fields: [
        { key: 'flag', type: 'text', label: 'Flagge (Emoji)' },
        { key: 'city', type: 'text', label: 'Stadt' },
      ],
    }],
  },

  // ────────── TEAM GRID ──────────
  TeamGrid: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'members', label: 'Mitglied', col: 'name',
      fields: [
        { key: 'name', type: 'text', label: 'Name' },
        { key: 'role', type: 'text', tr: true, label: 'Rolle' },
        { key: 'photo', type: 'media', label: 'Foto' },
      ],
    }],
  },

  // ────────── CONTACT FORM ──────────
  ContactForm: {
    content: [
      { section: 'Text', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel' },
        { key: 'cta_text', type: 'text', tr: true, label: 'Button Text' },
        { key: 'email_to', type: 'text', label: 'E-Mail Empfänger' },
      ]},
    ],
    style: [],
    repeaters: [],
  },

  // ────────── AI SHOWCASE ──────────
  AIShowcase: {
    content: [
      { section: 'Sichtbare Inhalte', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label', domEl: 'showcase-label', domRead: 'textContent' },
        { key: 'headline', type: 'inline-html', tr: true, label: 'Headline', domEl: 'showcase-title', domRead: 'innerHTML' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel', domEl: 'showcase-subtitle', domRead: 'textContent' },
        { key: 'cta_text', type: 'text', tr: true, label: 'CTA Text', domEl: 'showcase-cta', domRead: 'textContent' },
      ]},
      { section: 'Eigenschaften', collapsed: true, fields: [
        { key: 'cta_url', type: 'pagelink', label: 'CTA URL', domEl: 'showcase-cta', domRead: 'attribute', domAttribute: 'href' },
      ]},
    ],
    style: [
      { section: 'Hintergrund', element: 'showcase-section', fields: [
        { prop: 'background-color', type: 'color' },
      ]},
    ],
    repeaters: [{
      key: 'dashboard_stats', label: 'Stat', col: 'label',
      fields: [
        { key: 'label', type: 'text', label: 'Label' },
        { key: 'value', type: 'text', label: 'Wert' },
        { key: 'change', type: 'text', label: 'Änderung' },
      ],
    }],
  },

  // ────────── FEATURE DETAIL ──────────
  FeatureDetail: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'features', label: 'Feature', col: 'title',
      fields: [
        { key: 'image', type: 'media', label: 'Bild' },
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'description', type: 'textarea', tr: true, label: 'Beschreibung' },
      ],
    }],
  },

  // ────────── TIMELINE ──────────
  Timeline: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Eintrag', col: 'title',
      fields: [
        { key: 'year', type: 'text', label: 'Jahr' },
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'description', type: 'textarea', tr: true, label: 'Beschreibung' },
      ],
    }],
  },

  // ────────── PRICING TABLE ──────────
  PricingTable: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Paket', col: 'name',
      fields: [
        { key: 'name', type: 'text', tr: true, label: 'Name' },
        { key: 'price', type: 'text', label: 'Preis' },
        { key: 'period', type: 'text', tr: true, label: 'Zeitraum' },
        { key: 'featured', type: 'toggle', label: 'Hervorgehoben' },
        { key: 'cta_text', type: 'text', tr: true, label: 'Button Text' },
        { key: 'cta_url', type: 'pagelink', label: 'Button URL' },
      ],
    }],
  },

  // ────────── IMAGE GALLERY ──────────
  ImageGallery: {
    content: [
      { section: 'Layout', fields: [
        { key: 'columns', type: 'select', label: 'Spalten', options: ['2', '3', '4'] },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Bild', col: 'alt',
      fields: [
        { key: 'image', type: 'media', label: 'Bild' },
        { key: 'alt', type: 'text', tr: true, label: 'Alt-Text' },
        { key: 'caption', type: 'text', tr: true, label: 'Bildunterschrift' },
      ],
    }],
  },

  // ────────── VIDEO EMBED ──────────
  VideoEmbed: {
    content: [
      { section: 'Video', fields: [
        { key: 'video_url', type: 'text', label: 'Video URL (YouTube/Vimeo)' },
        { key: 'poster_image', type: 'media', label: 'Vorschaubild' },
        { key: 'headline', type: 'text', tr: true, label: 'Titel' },
      ]},
    ],
    style: [],
    repeaters: [],
  },

  // ────────── QUOTE ──────────
  Quote: {
    content: [
      { section: 'Zitat', fields: [
        { key: 'quote', type: 'textarea', tr: true, label: 'Zitat' },
        { key: 'author', type: 'text', label: 'Autor' },
        { key: 'role', type: 'text', tr: true, label: 'Rolle' },
        { key: 'image', type: 'media', label: 'Foto' },
      ]},
    ],
    style: [],
    repeaters: [],
  },

  // ────────── NEW MODULES ──────────

  // ────────── TABBED CONTENT ──────────
  TabbedContent: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Tab', col: 'title',
      fields: [
        { key: 'title', type: 'text', tr: true, label: 'Tab-Titel' },
        { key: 'description', type: 'richtext', tr: true, label: 'Inhalt' },
      ],
    }],
  },

  // ────────── MAGAZINE CARD ──────────
  MagazineCard: {
    content: [
      { section: 'Text', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel' },
        { key: 'body_html', type: 'richtext', tr: true, label: 'Body' },
      ]},
      { section: 'Bild', fields: [
        { key: 'image', type: 'media', label: 'Bild' },
        { key: 'image_alt', type: 'text', label: 'Alt-Text' },
        { key: 'image_pos', type: 'select', label: 'Bild-Position', options: ['left', 'right'] },
      ]},
      { section: 'CTA', fields: [
        { key: 'cta_text', type: 'text', tr: true, label: 'Button Text' },
        { key: 'cta_url', type: 'pagelink', label: 'Button URL' },
      ]},
    ],
    style: [],
    repeaters: [],
  },

  // ────────── PROGRESSIVE REVEAL ──────────
  ProgressiveReveal: {
    content: [
      { section: 'Text', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'teaser', type: 'textarea', tr: true, label: 'Teaser (sichtbar)' },
        { key: 'body_html', type: 'richtext', tr: true, label: 'Volltext (expandierbar)' },
      ]},
    ],
    style: [],
    repeaters: [],
  },

  // ────────── STICKY TOC ──────────
  StickyTOC: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Abschnitt', col: 'title',
      fields: [
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'description', type: 'richtext', tr: true, label: 'Inhalt' },
      ],
    }],
  },

  // ────────── SCROLL CAROUSEL ──────────
  ScrollCarousel: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Slide', col: 'title',
      fields: [
        { key: 'image', type: 'media', label: 'Bild' },
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'description', type: 'textarea', tr: true, label: 'Beschreibung' },
        { key: 'author', type: 'text', label: 'Autor' },
        { key: 'company', type: 'text', label: 'Unternehmen' },
      ],
    }],
  },

  // ────────── BEFORE/AFTER ──────────
  BeforeAfter: {
    content: [
      { section: 'Text', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Label' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel' },
      ]},
      { section: 'Bilder', fields: [
        { key: 'before_image', type: 'media', label: 'Vorher-Bild' },
        { key: 'before_label', type: 'text', tr: true, label: 'Vorher-Label' },
        { key: 'after_image', type: 'media', label: 'Nachher-Bild' },
        { key: 'after_label', type: 'text', tr: true, label: 'Nachher-Label' },
      ]},
    ],
    style: [],
    repeaters: [],
  },

  // ────────── EXPANDABLE CARDS ──────────
  ExpandableCards: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Section Label', domEl: 'expandable-label', domRead: 'textContent' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline', domEl: 'expandable-title', domRead: 'innerHTML' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel', domEl: 'expandable-subtitle', domRead: 'textContent' },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Card', col: 'title',
      fields: [
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'desc', type: 'textarea', tr: true, label: 'Beschreibung' },
        { key: 'icon', type: 'icon', label: 'Icon' },
      ],
    }],
  },

  // ────────── WIDGET GRID ──────────
  WidgetGrid: {
    content: [
      { section: 'Header', fields: [
        { key: 'label', type: 'text', tr: true, label: 'Section Label', domEl: 'widget-label', domRead: 'textContent' },
        { key: 'headline', type: 'richtext', tr: true, label: 'Headline', domEl: 'widget-title', domRead: 'innerHTML' },
        { key: 'subtitle', type: 'textarea', tr: true, label: 'Untertitel', domEl: 'widget-subtitle', domRead: 'textContent' },
        { key: 'columns', type: 'select', label: 'Spalten', options: ['2', '3', '4'] },
      ]},
    ],
    style: [],
    repeaters: [{
      key: 'items', label: 'Widget', col: 'title',
      fields: [
        { key: 'icon', type: 'text', label: 'Emoji/Icon' },
        { key: 'title', type: 'text', tr: true, label: 'Titel' },
        { key: 'desc', type: 'textarea', tr: true, label: 'Beschreibung' },
        { key: 'href', type: 'pagelink', label: 'Link' },
      ],
    }],
  },
};

// ═══════════════════════════════════════════════
// ADVANCED FIELDS (identical for ALL modules)
// ═══════════════════════════════════════════════

export const ADVANCED_FIELDS: RegistrySection[] = [
  { section: 'Hintergrund', fields: [
    { key: 'background_image', type: 'media', label: 'Hintergrundbild' },
    { key: 'background_color', type: 'color', label: 'Hintergrundfarbe' },
    { key: 'background_overlay', type: 'color', label: 'Overlay-Farbe' },
  ]},
  { section: 'Spacing', fields: [
    { key: 'padding_top', type: 'size', label: 'Padding oben' },
    { key: 'padding_bottom', type: 'size', label: 'Padding unten' },
    { key: 'margin_top', type: 'size', label: 'Margin oben' },
    { key: 'margin_bottom', type: 'size', label: 'Margin unten' },
  ]},
  { section: 'Responsive', fields: [
    { key: 'hide_mobile', type: 'toggle', label: 'Auf Mobile verstecken' },
    { key: 'hide_tablet', type: 'toggle', label: 'Auf Tablet verstecken' },
    { key: 'hide_desktop', type: 'toggle', label: 'Auf Desktop verstecken' },
  ]},
  { section: 'Versionierung', fields: [] }, // Placeholder — restore button rendered separately
];
