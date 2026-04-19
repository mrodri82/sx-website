/**
 * Module Registry — maps component names to their Astro component imports.
 * New modules added via the editor get registered here automatically.
 */

export const moduleRegistry: Record<string, {
  fields: string[];
  reusable: boolean;
  source?: 'global';
}> = {
  Hero: {
    fields: ['badge', 'headline', 'subtitle', 'cta_primary_text', 'cta_primary_url', 'cta_secondary_text', 'cta_secondary_url'],
    reusable: true,
  },
  LogoTicker: {
    fields: ['label', 'clients'],
    reusable: true,
    source: 'global',
  },
  Stats: {
    fields: ['items'],
    reusable: true,
    source: 'global',
  },
  ThreeColumns: {
    fields: ['section_label', 'section_sublabel', 'headline', 'subtitle', 'items', 'footer_link_text', 'footer_link_url'],
    reusable: true,
  },
  CTABand: {
    fields: ['headline', 'highlight', 'subtitle', 'button_text', 'button_url'],
    reusable: true,
  },
  TeamSection: {
    fields: ['label', 'quote', 'founder_name', 'founder_role', 'founder_photo', 'team_photo', 'locations'],
    reusable: true,
  },
  AIShowcase: {
    fields: ['label', 'headline', 'subtitle', 'cta_text', 'cta_url', 'dashboard_stats'],
    reusable: true,
  },
  ProcessSteps: {
    fields: ['label', 'headline', 'steps'],
    reusable: true,
  },
  LiquidGlass: {
    fields: ['section_label', 'headline', 'subtitle', 'items'],
    reusable: true,
  },
};
