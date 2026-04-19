/**
 * Nova Element Registry — defines which elements are editable per component.
 * Each element gets a data-nova-el attribute and a set of editable CSS properties.
 */

export interface NovaElementDef {
  label: string;
  props: NovaEditableProp[];
}

export interface NovaEditableProp {
  key: string;        // CSS property name (background-color, color, font-size, etc.)
  label: string;      // Display label
  type: 'color' | 'size' | 'select' | 'text';
  options?: string[]; // For select type
  default?: string;
}

const color = (key: string, label: string): NovaEditableProp => ({ key, label, type: 'color' });
const size = (key: string, label: string): NovaEditableProp => ({ key, label, type: 'size' });
const select = (key: string, label: string, options: string[]): NovaEditableProp => ({ key, label, type: 'select', options });

export const elementRegistry: Record<string, Record<string, NovaElementDef>> = {
  Hero: {
    'hero-section': { label: 'Hintergrund', props: [color('background', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'hero-badge': { label: 'Badge', props: [color('background-color', 'Hintergrund'), color('color', 'Text'), color('border-color', 'Rahmen')] },
    'hero-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'hero-highlight': { label: 'Highlight-Wort', props: [color('color', 'Farbe')] },
    'hero-subtitle': { label: 'Untertitel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'hero-cta-primary': { label: 'Button Primär', props: [color('background-color', 'Hintergrund'), color('color', 'Text'), size('border-radius', 'Rundung'), size('padding', 'Padding')] },
    'hero-cta-secondary': { label: 'Button Sekundär', props: [color('border-color', 'Rahmen'), color('color', 'Text'), size('border-radius', 'Rundung')] },
  },
  LogoTicker: {
    'ticker-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), color('border-color', 'Rahmen')] },
    'ticker-label': { label: 'Label', props: [color('color', 'Farbe')] },
  },
  Stats: {
    'stats-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'stats-value': { label: 'Zahlenwert', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'stats-label': { label: 'Label', props: [color('color', 'Farbe')] },
  },
  ThreeColumns: {
    'columns-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'columns-label': { label: 'Section Label', props: [color('color', 'Farbe')] },
    'columns-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'columns-card': { label: 'Karten', props: [color('background-color', 'Hintergrund'), color('border-color', 'Rahmen'), size('border-radius', 'Rundung')] },
    'columns-card-title': { label: 'Karten-Titel', props: [color('color', 'Farbe')] },
    'columns-card-text': { label: 'Karten-Text', props: [color('color', 'Farbe')] },
  },
  CTABand: {
    'cta-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'cta-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'cta-highlight': { label: 'Highlight', props: [color('color', 'Farbe')] },
    'cta-subtitle': { label: 'Untertitel', props: [color('color', 'Farbe')] },
    'cta-button': { label: 'Button', props: [color('background-color', 'Hintergrund'), color('color', 'Text'), size('border-radius', 'Rundung')] },
  },
  TeamSection: {
    'team-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe')] },
    'team-label': { label: 'Label', props: [color('color', 'Farbe')] },
    'team-quote': { label: 'Zitat', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'team-name': { label: 'Name', props: [color('color', 'Farbe')] },
  },
  AIShowcase: {
    'showcase-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe')] },
    'showcase-title': { label: 'Titel', props: [color('color', 'Farbe')] },
    'showcase-cta': { label: 'Button', props: [color('background-color', 'Hintergrund'), color('color', 'Text'), size('border-radius', 'Rundung')] },
  },
  ProcessSteps: {
    'process-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe')] },
    'process-title': { label: 'Titel', props: [color('color', 'Farbe')] },
    'process-step-number': { label: 'Schrittnummer', props: [color('color', 'Farbe')] },
    'process-step-title': { label: 'Schritt-Titel', props: [color('color', 'Farbe')] },
  },
  FeatureDetail: {
    'feature-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'feature-label': { label: 'Label', props: [color('color', 'Farbe')] },
    'feature-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'feature-subtitle': { label: 'Untertitel', props: [color('color', 'Farbe')] },
    'feature-item-title': { label: 'Feature-Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'feature-item-text': { label: 'Feature-Text', props: [color('color', 'Farbe')] },
    'feature-item-image': { label: 'Feature-Bild', props: [size('border-radius', 'Rundung')] },
  },
  FAQ: {
    'faq-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'faq-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'faq-question': { label: 'Frage', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'faq-answer': { label: 'Antwort', props: [color('color', 'Farbe')] },
  },
  ContactForm: {
    'form-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'form-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'form-subtitle': { label: 'Untertitel', props: [color('color', 'Farbe')] },
    'form-button': { label: 'Button', props: [color('background-color', 'Hintergrund'), color('color', 'Text'), size('border-radius', 'Rundung')] },
  },
  Testimonials: {
    'testimonials-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'testimonials-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'testimonial-quote': { label: 'Zitat', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'testimonial-author': { label: 'Autor', props: [color('color', 'Farbe')] },
  },
  TextBlock: {
    'text-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'text-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'text-body': { label: 'Text', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
  },
  CaseStudy: {
    'case-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'case-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'case-client': { label: 'Kunde', props: [color('color', 'Farbe')] },
    'case-metric': { label: 'Metrik-Wert', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'case-image': { label: 'Bild', props: [size('border-radius', 'Rundung')] },
  },
  TeamGrid: {
    'team-grid-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'team-grid-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'team-member-name': { label: 'Mitglied-Name', props: [color('color', 'Farbe')] },
    'team-member-role': { label: 'Mitglied-Rolle', props: [color('color', 'Farbe')] },
  },
  VideoEmbed: {
    'video-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'video-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
  },
  PricingTable: {
    'pricing-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'pricing-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'pricing-card': { label: 'Karte', props: [color('background-color', 'Hintergrund'), color('border-color', 'Rahmen'), size('border-radius', 'Rundung')] },
    'pricing-price': { label: 'Preis', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'pricing-cta': { label: 'Button', props: [color('background-color', 'Hintergrund'), color('color', 'Text'), size('border-radius', 'Rundung')] },
  },
  Timeline: {
    'timeline-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'timeline-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'timeline-year': { label: 'Jahr', props: [color('color', 'Farbe')] },
    'timeline-item-title': { label: 'Element-Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
  },
  NumbersBar: {
    'numbers-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), color('border-color', 'Rahmen'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'numbers-value': { label: 'Zahlenwert', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'numbers-label': { label: 'Label', props: [color('color', 'Farbe')] },
  },
  ImageGallery: {
    'gallery-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'gallery-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
    'gallery-image': { label: 'Bild', props: [size('border-radius', 'Rundung')] },
  },
  LogoGrid: {
    'logogrid-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'logogrid-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
  },
  Comparison: {
    'comparison-section': { label: 'Hintergrund', props: [color('background-color', 'Farbe'), size('padding-top', 'Padding oben'), size('padding-bottom', 'Padding unten')] },
    'comparison-title': { label: 'Titel', props: [color('color', 'Farbe'), size('font-size', 'Schriftgröße')] },
  },
};

/**
 * Generate a <style> block from element overrides.
 */
export function generateOverrideCSS(overrides: Record<string, Record<string, string>>): string {
  let css = '';
  for (const [elId, props] of Object.entries(overrides)) {
    const rules = Object.entries(props)
      .filter(([, v]) => v)
      .map(([prop, value]) => `  ${prop}: ${value} !important;`)
      .join('\n');
    if (rules) css += `[data-nova-el="${elId}"] {\n${rules}\n}\n`;
  }
  return css;
}
