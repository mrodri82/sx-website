/**
 * Normalize module content fields to a standard schema.
 * Maps old/inconsistent field names to the unified standard.
 * Runs BEFORE rendering — components only see normalized fields.
 *
 * Standard fields:
 *   label, headline, subtitle, image, image_alt, image_pos,
 *   cta_text, cta_url, cta2_text, cta2_url, theme, layout,
 *   body_html, items[], steps[]
 */

const FIELD_ALIASES: Record<string, string> = {
  // Label variants
  badge: 'label',
  section_label: 'label',

  // Subtitle/body variants
  body: 'subtitle',
  description: 'subtitle',

  // CTA variants
  cta_primary_text: 'cta_text',
  button_text: 'cta_text',
  footer_link_text: 'cta_text',
  cta_primary_url: 'cta_url',
  button_url: 'cta_url',
  footer_link_url: 'cta_url',
  cta_secondary_text: 'cta2_text',
  cta_secondary_url: 'cta2_url',

  // Image variants
  background_image: 'image',
  hero_image: 'image',
  photo: 'image',
  person_image: 'image',

  // Highlight (used in CTABand)
  highlight: 'highlight', // keep as-is, it's a valid field
};

// Locale suffixes to handle
const LOCALES = ['_es', '_en', '_de'];

/**
 * Normalize a single content object's field names.
 * Preserves original fields AND adds normalized aliases.
 * This way, old components still work AND new code can use standard names.
 */
export function normalizeContent(content: Record<string, unknown>): Record<string, unknown> {
  const result = { ...content };

  for (const [oldName, newName] of Object.entries(FIELD_ALIASES)) {
    // Direct field
    if (oldName in result && !(newName in result)) {
      result[newName] = result[oldName];
    }

    // Locale variants: badge_es → label_es, etc.
    for (const suffix of LOCALES) {
      const oldKey = oldName + suffix;
      const newKey = newName + suffix;
      if (oldKey in result && !(newKey in result)) {
        result[newKey] = result[oldKey];
      }
    }
  }

  // Normalize items within repeaters
  const repeaterFields = ['items', 'steps', 'results', 'members', 'images'];
  for (const field of repeaterFields) {
    const arr = result[field];
    if (Array.isArray(arr)) {
      result[field] = arr.map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          return normalizeRepeaterItem(item as Record<string, unknown>);
        }
        return item;
      });
    }
  }

  return result;
}

/**
 * Normalize fields within a repeater item (card, step, FAQ item, etc.)
 */
function normalizeRepeaterItem(item: Record<string, unknown>): Record<string, unknown> {
  const result = { ...item };

  const ITEM_ALIASES: Record<string, string> = {
    // Common item field aliases
    name: 'title',
    question: 'title',
    quote: 'description', // for testimonials
    number: 'step', // ProcessSteps: number → step
    description: 'desc', // ProcessSteps: description → desc
    link_url: 'url',
    href: 'url',
    cta_url: 'url',
  };

  for (const [oldName, newName] of Object.entries(ITEM_ALIASES)) {
    if (oldName in result && !(newName in result)) {
      result[newName] = result[oldName];
    }
    for (const suffix of LOCALES) {
      const oldKey = oldName + suffix;
      const newKey = newName + suffix;
      if (oldKey in result && !(newKey in result)) {
        result[newKey] = result[oldKey];
      }
    }
  }

  return result;
}
