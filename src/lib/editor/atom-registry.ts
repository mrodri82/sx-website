/**
 * ATOM_REGISTRY — Per-atom property panels for the Live Editor.
 *
 * Modules used to need a hand-pinned MODULE_REGISTRY entry to expose
 * any UI in the editor sidebar. With atoms, the editor instead asks
 * "what is THIS element semantically?" (an image? a heading? a button?)
 * and renders the panel for that atom type. New modules become
 * editable just by tagging their HTML — no per-module schema.
 *
 * Each atom defines:
 *   - detect(el):    is this element of my type?
 *   - panel():       JSON describing the inputs the editor renders
 *   - read(el):      pull current state out of the DOM
 *   - apply(el, p):  write state back to the DOM (live preview)
 *   - serialize(p):  list of {key, value} writes to section.content
 *
 * The editor wires these together: on slot click → run detect over
 * candidates → render panel → on input change → apply + serialize +
 * mark page dirty.
 */

export type AtomType =
  | 'image'
  | 'heading'
  | 'text'
  | 'button'
  | 'link'
  | 'logos'
  | 'row'
  | 'card'
  | 'video'
  | 'icon'
  | 'richtext';

export interface AtomField {
  /** Stable id used as DOM key inside the panel and as the patch key. */
  key: string;
  /** Input type the editor renders. */
  type: 'media' | 'text' | 'textarea' | 'select' | 'toggle' | 'color' | 'size' | 'url';
  label: string;
  hint?: string;
  options?: { value: string; label: string }[];
  /** Free-form size/color tokens to suggest in a token picker. */
  tokens?: string[];
}

export interface AtomPanel {
  /** Heading shown above the atom panel in the sidebar. */
  title: string;
  /** Hint paragraph under the heading. */
  hint?: string;
  fields: AtomField[];
}

export interface AtomDef {
  type: AtomType;
  /** Heuristic detection — runs only when no explicit data-atom is set. */
  detect: (el: HTMLElement) => boolean;
  panel: AtomPanel;
  /** Pull current state from DOM. Returns the values that fill the panel. */
  read: (el: HTMLElement) => Record<string, string>;
  /** Write the panel state back into the DOM (live preview). */
  apply: (el: HTMLElement, props: Record<string, string>) => void;
  /**
   * Map the atom state into content patches. Each patch updates a key on
   * the surrounding section's `content` object so the change persists
   * after save.
   *
   * The editor passes the matching `data-nova-el` slot key so the atom
   * can derive content keys (e.g. `<slot>_alt`, `<slot>_filter`).
   */
  serialize: (props: Record<string, string>, slotKey: string) =>
    Array<{ key: string; value: string }>;
}

// ──────────────────────────────────────────────────────────────────
// IMAGE
// ──────────────────────────────────────────────────────────────────

const IMAGE: AtomDef = {
  type: 'image',
  detect: (el) => el.tagName === 'IMG',
  panel: {
    title: 'Bild',
    hint: 'Bild aus der Mediathek wählen oder URL eingeben.',
    fields: [
      { key: 'src',          type: 'media', label: 'Bild' },
      { key: 'alt',          type: 'text',  label: 'Alt-Text', hint: 'Wird Screenreadern und Suchmaschinen angezeigt.' },
      { key: 'object_fit',   type: 'select', label: 'Bildausrichtung',
        options: [
          { value: 'cover',      label: 'Cover (Container füllen)' },
          { value: 'contain',    label: 'Contain (komplett zeigen)' },
          { value: 'fill',       label: 'Fill (gestreckt)' },
          { value: 'none',       label: 'Original' },
          { value: 'scale-down', label: 'Verkleinert' },
        ],
      },
      { key: 'filter',       type: 'select', label: 'Filter',
        options: [
          { value: 'none',           label: 'Keiner' },
          { value: 'grayscale',      label: 'Schwarz / Weiß' },
          { value: 'grayscale-soft', label: 'Schwarz / Weiß (50 %)' },
          { value: 'blur-sm',        label: 'Leichter Weichzeichner' },
          { value: 'blur-lg',        label: 'Starker Weichzeichner' },
          { value: 'contrast-up',    label: 'Mehr Kontrast' },
          { value: 'sepia',          label: 'Sepia' },
        ],
      },
      { key: 'border_radius', type: 'select', label: 'Ecken',
        options: [
          { value: '0',    label: 'Keine' },
          { value: '4px',  label: 'Klein (4 px)' },
          { value: '8px',  label: 'Mittel (8 px)' },
          { value: '16px', label: 'Groß (16 px)' },
          { value: '999px', label: 'Pille / Kreis' },
        ],
      },
    ],
  },
  read: (el) => {
    const img = el as HTMLImageElement;
    const cs = getComputedStyle(img);
    const filterStyle = el.dataset.atomFilter || 'none';
    return {
      src:           img.getAttribute('src') || '',
      alt:           img.getAttribute('alt') || '',
      object_fit:    (img.style.objectFit || cs.objectFit || 'cover') as string,
      filter:        filterStyle,
      border_radius: img.style.borderRadius || '0',
    };
  },
  apply: (el, p) => {
    const img = el as HTMLImageElement;
    if (p.src && p.src !== img.src) img.src = p.src;
    if (typeof p.alt === 'string') img.alt = p.alt;
    if (p.object_fit) img.style.objectFit = p.object_fit;
    if (p.border_radius) img.style.borderRadius = p.border_radius;
    if (p.filter) {
      el.dataset.atomFilter = p.filter;
      const map: Record<string, string> = {
        none:           '',
        grayscale:      'grayscale(100%)',
        'grayscale-soft': 'grayscale(50%)',
        'blur-sm':      'blur(2px)',
        'blur-lg':      'blur(8px)',
        'contrast-up':  'contrast(1.2)',
        sepia:          'sepia(80%)',
      };
      img.style.filter = map[p.filter] || '';
    }
  },
  serialize: (p, slotKey) => [
    { key: slotKey,                     value: p.src || '' },
    { key: `${slotKey}_alt`,            value: p.alt || '' },
    { key: `${slotKey}_object_fit`,     value: p.object_fit || '' },
    { key: `${slotKey}_filter`,         value: p.filter || '' },
    { key: `${slotKey}_border_radius`,  value: p.border_radius || '' },
  ],
};

// ──────────────────────────────────────────────────────────────────
// HEADING (skeleton — fields wired in next step)
// ──────────────────────────────────────────────────────────────────

const HEADING: AtomDef = {
  type: 'heading',
  detect: (el) => /^H[1-6]$/.test(el.tagName),
  panel: {
    title: 'Überschrift',
    hint: 'Text, Größe, Farbe und Ausrichtung.',
    fields: [
      { key: 'text',           type: 'text',   label: 'Text' },
      { key: 'level',          type: 'select', label: 'Level',
        options: [
          { value: 'h1', label: 'H1' }, { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' }, { value: 'h4', label: 'H4' },
          { value: 'h5', label: 'H5' }, { value: 'h6', label: 'H6' },
        ],
      },
      { key: 'color',          type: 'color',  label: 'Farbe',
        tokens: ['#ecfd21', '#ffffff', '#000000', '#a6a6a6'] },
      { key: 'align',          type: 'select', label: 'Ausrichtung',
        options: [
          { value: 'start',  label: 'Links' },
          { value: 'center', label: 'Mitte' },
          { value: 'end',    label: 'Rechts' },
        ],
      },
    ],
  },
  read: (el) => ({
    text:  el.textContent?.trim() || '',
    level: el.tagName.toLowerCase(),
    color: el.style.color || '',
    align: el.style.textAlign || '',
  }),
  apply: (el, p) => {
    if (typeof p.text === 'string') el.textContent = p.text;
    if (p.color) el.style.color = p.color;
    if (p.align) el.style.textAlign = p.align;
    // level (tag) change handled by serializer — DOM swap is heavy
  },
  serialize: (p, slotKey) => [
    { key: slotKey,                value: p.text || '' },
    { key: `${slotKey}_color`,     value: p.color || '' },
    { key: `${slotKey}_align`,     value: p.align || '' },
    { key: `${slotKey}_level`,     value: p.level || '' },
  ],
};

// ──────────────────────────────────────────────────────────────────
// TEXT (paragraph / multi-line copy)
// ──────────────────────────────────────────────────────────────────

const TEXT: AtomDef = {
  type: 'text',
  detect: (el) => {
    if (el.tagName !== 'P') return false;
    const wordCount = (el.textContent || '').trim().split(/\s+/).filter(Boolean).length;
    return wordCount >= 5;
  },
  panel: {
    title: 'Text',
    fields: [
      { key: 'text',  type: 'textarea', label: 'Text' },
      { key: 'color', type: 'color',    label: 'Farbe' },
      { key: 'align', type: 'select',   label: 'Ausrichtung',
        options: [
          { value: 'start',   label: 'Links' },
          { value: 'center',  label: 'Mitte' },
          { value: 'end',     label: 'Rechts' },
          { value: 'justify', label: 'Blocksatz' },
        ],
      },
    ],
  },
  read: (el) => ({
    text:  el.innerHTML || '',
    color: el.style.color || '',
    align: el.style.textAlign || '',
  }),
  apply: (el, p) => {
    if (typeof p.text === 'string') el.innerHTML = p.text;
    if (p.color) el.style.color = p.color;
    if (p.align) el.style.textAlign = p.align;
  },
  serialize: (p, slotKey) => [
    { key: slotKey,             value: p.text || '' },
    { key: `${slotKey}_color`,  value: p.color || '' },
    { key: `${slotKey}_align`,  value: p.align || '' },
  ],
};

// ──────────────────────────────────────────────────────────────────
// BUTTON (and button-like anchors)
// ──────────────────────────────────────────────────────────────────

const BUTTON: AtomDef = {
  type: 'button',
  detect: (el) => {
    if (el.tagName === 'BUTTON') return true;
    if (el.tagName !== 'A') return false;
    return /\b(btn|cta|button)\b/i.test(el.className);
  },
  panel: {
    title: 'Button',
    fields: [
      { key: 'label',   type: 'text',   label: 'Beschriftung' },
      { key: 'url',     type: 'url',    label: 'URL', hint: 'Interne Seite (/program) oder externe URL (https://...)' },
      { key: 'variant', type: 'select', label: 'Stil',
        options: [
          { value: 'solid',  label: 'Solid (gelb)' },
          { value: 'ghost',  label: 'Ghost (Outline)' },
          { value: 'black',  label: 'Schwarz' },
          { value: 'white',  label: 'Weiß' },
          { value: 'yellow', label: 'Gelb auf schwarz' },
        ],
      },
      { key: 'new_tab', type: 'toggle', label: 'In neuem Tab öffnen' },
    ],
  },
  read: (el) => {
    const a = el as HTMLAnchorElement;
    return {
      label:   el.textContent?.trim() || '',
      url:     a.getAttribute?.('href') || '',
      variant: el.dataset.atomVariant || 'solid',
      new_tab: a.getAttribute?.('target') === '_blank' ? '1' : '',
    };
  },
  apply: (el, p) => {
    const a = el as HTMLAnchorElement;
    if (typeof p.label === 'string') el.textContent = p.label;
    if (p.url && a.setAttribute) a.setAttribute('href', p.url);
    if (p.variant) el.dataset.atomVariant = p.variant;
    if (a.setAttribute) {
      if (p.new_tab) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      else           { a.removeAttribute('target'); }
    }
  },
  serialize: (p, slotKey) => [
    { key: slotKey,              value: p.label || '' },
    { key: `${slotKey}_url`,     value: p.url || '' },
    { key: `${slotKey}_variant`, value: p.variant || '' },
    { key: `${slotKey}_new_tab`, value: p.new_tab ? '1' : '' },
  ],
};

// ──────────────────────────────────────────────────────────────────
// LOGOS — repeater of <img> children inside a container
// ──────────────────────────────────────────────────────────────────

const LOGOS: AtomDef = {
  type: 'logos',
  /* Containers tag themselves with data-atom="logos". Heuristic fallback:
     a <div>/<section> whose direct children are mostly <img> (≥3) and
     looks like a wall of logos — but explicit data-atom is preferred. */
  detect: (el) => {
    if (el.dataset.atom === 'logos') return true;
    if (!['DIV', 'SECTION', 'UL'].includes(el.tagName)) return false;
    const imgKids = Array.from(el.children).filter(c =>
      c.tagName === 'IMG' || c.querySelector?.('img'));
    return imgKids.length >= 3 && imgKids.length === el.children.length;
  },
  panel: {
    title: 'Logos',
    hint: 'Repeater von Bildern. Anzahl pro Reihe + Ausrichtung steuerbar.',
    fields: [
      { key: 'per_row',   type: 'select', label: 'Logos pro Reihe',
        options: [
          { value: '2', label: '2' }, { value: '3', label: '3' },
          { value: '4', label: '4' }, { value: '5', label: '5' },
          { value: '6', label: '6' }, { value: '8', label: '8' },
        ],
      },
      { key: 'align',     type: 'select', label: 'Ausrichtung',
        options: [
          { value: 'start',  label: 'Links' },
          { value: 'center', label: 'Mitte' },
          { value: 'end',    label: 'Rechts' },
          { value: 'space-between', label: 'Verteilt' },
        ],
      },
      { key: 'gap',       type: 'select', label: 'Abstand',
        options: [
          { value: '0',    label: 'Keiner' },
          { value: '12px', label: 'Klein' },
          { value: '24px', label: 'Mittel' },
          { value: '48px', label: 'Groß' },
        ],
      },
      { key: 'filter',    type: 'select', label: 'Bildfilter',
        options: [
          { value: 'none',           label: 'Original' },
          { value: 'grayscale',      label: 'Schwarz / Weiß' },
          { value: 'grayscale-soft', label: 'Schwarz / Weiß (50 %)' },
        ],
      },
    ],
  },
  read: (el) => ({
    per_row: el.dataset.atomPerRow || '5',
    align:   el.dataset.atomAlign  || 'center',
    gap:     el.dataset.atomGap    || '24px',
    filter:  el.dataset.atomFilter || 'none',
  }),
  apply: (el, p) => {
    if (p.per_row) {
      el.dataset.atomPerRow = p.per_row;
      el.style.gridTemplateColumns = `repeat(${p.per_row}, minmax(0, 1fr))`;
      el.style.display = 'grid';
    }
    if (p.align)  { el.dataset.atomAlign  = p.align;  el.style.justifyContent = p.align; }
    if (p.gap)    { el.dataset.atomGap    = p.gap;    el.style.gap = p.gap; }
    if (p.filter) {
      el.dataset.atomFilter = p.filter;
      const map: Record<string, string> = {
        none: '', grayscale: 'grayscale(100%)', 'grayscale-soft': 'grayscale(50%)',
      };
      const filterValue = map[p.filter] || '';
      Array.from(el.querySelectorAll('img')).forEach(img =>
        ((img as HTMLImageElement).style.filter = filterValue));
    }
  },
  serialize: (p, slotKey) => [
    { key: `${slotKey}_per_row`, value: p.per_row || '' },
    { key: `${slotKey}_align`,   value: p.align   || '' },
    { key: `${slotKey}_gap`,     value: p.gap     || '' },
    { key: `${slotKey}_filter`,  value: p.filter  || '' },
  ],
};

// ──────────────────────────────────────────────────────────────────

export const ATOM_REGISTRY: Record<AtomType, AtomDef | null> = {
  image:    IMAGE,
  heading:  HEADING,
  text:     TEXT,
  button:   BUTTON,
  logos:    LOGOS,
  link:     null, // TODO
  row:      null, // TODO
  card:     null, // TODO
  video:    null, // TODO
  icon:     null, // TODO
  richtext: null, // TODO
};

/**
 * Resolve an atom type for a given DOM element. Explicit `data-atom`
 * always wins; otherwise the first detect() that returns true.
 */
export function resolveAtom(el: HTMLElement): AtomDef | null {
  const explicit = el.dataset.atom as AtomType | undefined;
  if (explicit && ATOM_REGISTRY[explicit]) return ATOM_REGISTRY[explicit];
  for (const def of Object.values(ATOM_REGISTRY)) {
    if (def && def.detect(el)) return def;
  }
  return null;
}
