# Plan — Atom-Registry für den Live-Editor

**Datum:** 2026-04-27
**Status:** Vorgeschlagen, nicht abgesegnet
**Trigger:** Manuel-Idee aus der Dusche — „Mikro-Templates" damit der Editor
selbst versteht was in jedem Slot steckt und passende Bedien-Optionen
anbietet, statt pro Modul ein neues Schema pflegen zu müssen.

## Problem

1. Jedes Modul (HeroSimple, FeatureCards, ProgramTable …) braucht heute
   einen Eintrag in `src/lib/editor/module-registry.ts` mit eigenem
   Field-Schema. Wenn ein neues Modul hinzukommt, beginnen wir wieder
   von 0 — ohne Eintrag zeigt die Sidebar keine Bearbeitungs-UI.
2. Das Schema dupliziert Wissen das **bereits im DOM steht**: ein `<img>`
   ist immer ein Bild und braucht immer dieselben Optionen (Picker,
   Crop, Filter, Object-fit). Ein `<h2>` ist immer eine Überschrift.
3. Klon-Geschwindigkeit ist heute durch den Editor-Schema-Aufwand
   limitiert, nicht durch das HTML/CSS — und genau das soll diese Woche
   mit dem nächsten Klon getestet werden.

## Idee

Property-Panels werden **per Atom**, nicht per Modul, definiert. Module
sind nur noch Layout-Hülle mit `data-atom`-Annotationen. Der Editor
erkennt beim Click auf ein Slot den Atom-Type und rendert die passende
UI automatisch.

## Atom-Katalog (v1)

| Atom-Type    | Erkennung                                              | Property-Panel zeigt                                                               |
|--------------|--------------------------------------------------------|------------------------------------------------------------------------------------|
| `image`      | `<img>` ODER `data-atom="image"`                       | Image Picker, Alt-Text, Crop/Object-fit, Aspect Ratio, Filter (grayscale/blur), Border Radius |
| `heading`    | `<h1>`-`<h6>` ODER `data-atom="heading"`               | Text, Level (h1-6), Color (Token), Font-Size (Token oder px), Align, Line-Height, Letter-Spacing |
| `text`       | `<p>` mit > 5 Wörtern ODER `data-atom="text"`          | Tiptap Editor (rich), Color, Size-Token, Max-Width, Align                          |
| `button`     | `<a class="*-btn">` / `<button>` ODER `data-atom="button"` | Label, URL, Variant (solid/ghost/outline/black/yellow), Size, New-Tab            |
| `logos`      | `data-atom="logos"` (Container)                        | Image-Repeater (add/remove/reorder), Per-Row-Count, Align, Gap, Hover-Filter       |
| `row`        | `data-atom="row"` (Container)                          | Flex-Direction, Gap, Align-Items, Justify-Content, Wrap, Background                |
| `card`       | `data-atom="card"` (Container)                         | Background (color/image), Padding-Token, Border-Radius, Children-Layout            |
| `link`       | `<a>` außerhalb von button-Kontext                     | Label, URL, New-Tab, Color                                                         |
| `video`      | `<video>` ODER `data-atom="video"`                     | Source-URL, Poster, Autoplay, Loop, Muted, Controls                                |
| `icon`       | `data-atom="icon"`                                     | Icon-Picker (Lucide), Size, Color                                                  |
| `richtext`   | `data-atom="richtext"` (Article-Body)                  | Volle Tiptap-Toolbar (h1-h3, list, bold, italic, link, image-inline, blockquote)   |

## Zwei-Schicht-Modell

```
Module (Layout)            Atom (Bearbeitung)
─────────────────         ─────────────────
HeroSimple                ├── heading   (Title)
                          ├── text      (Subtitle)
                          ├── button    (CTA1)
                          └── button    (CTA2)

FeatureCards              ├── heading   (Section-Title)
                          └── card[]    (Repeated)
                                ├── image
                                ├── heading
                                ├── text
                                └── button

ProgramTable              └── row[]     (Repeated rows)
                                ├── image (icon)
                                ├── text  (theme)
                                ├── text  (voices)
                                ├── text  (track)
                                └── text  (stage)
```

Module-Schemata reduzieren sich auf eine **Slot-Liste** (welche
Atom-Slots existieren, optional Defaults), keine eigenen Field-Schemata
mehr.

## Implementierungsschritte

### 1. Atom-Annotation im DOM (Sources of Truth)
- Jedes Modul-Astro-Component mit `data-atom="<type>"` an den
  bearbeitbaren Elementen ausstatten.
- Bestehende `data-nova-el="<key>"`-Attribute behalten (eindeutige Slot-ID).
- Repeater (Cards, Rows, Items) bekommen `data-atom-repeat="<key>"` am
  Container — Editor erkennt: hier kann +/- gemacht werden, Children
  sind Repeat-Items.

### 2. `ATOM_REGISTRY` (neu, `src/lib/editor/atom-registry.ts`)
Pro Atom-Type:
- `detect(el: HTMLElement): boolean` — fallback zur Tag/Klassen-Erkennung
  wenn kein `data-atom` vorhanden
- `panel(el, ctx): PanelSchema` — beschreibt das UI (Felder, Defaults,
  Token-Liste, Read/Write-Adapter)
- `read(el): Record<string, any>` — DOM-State zurückgeben
- `apply(el, props): void` — Änderungen ins DOM zurückschreiben
  (live-preview)
- `serialize(props): SectionContentPatch` — Änderungen in
  `section.content` umwandeln

### 3. Editor-Click-Handler erweitern
Aktuell: Click auf `[data-nova-el]` zeigt das Modul-Schema-Feld in der
Sidebar. Neu: zusätzlich Atom-Type detecten →
`ATOM_REGISTRY[type].panel()` rendern. Bei Modulen die schon ein
Schema haben: Schema bleibt Vorrang, Atom-Panel kommt darunter
(„Erweiterte Bearbeitung").

### 4. Token-System für die Property-Panels
- Color-Tokens: `--color-brand-500`, `--color-text`, …
- Size-Tokens: `xs`, `sm`, `md`, `lg`, `xl` mit definierten px-Werten
  pro Atom-Type (heading sizes ≠ button sizes)
- Spacing-Tokens für Padding/Gap
- Property-Panels zeigen Token-Picker primär, „Custom Value" als
  Escape-Hatch (RowContainer-B-Spike-Pattern)

### 5. Migration der bestehenden 9-10 Module
- Schritt für Schritt `data-atom`-Tags reinhängen
- Schema im Registry kann erstmal bleiben, Atom-Panel ergänzt sich
  drumrum
- Sobald alle Atom-Tags drin sind und das Atom-Panel komplett ist:
  Modul-Schemata radikal reduzieren auf reine Slot-Listen

## Reihenfolge / Heute-Angriffsplan

1. **Atom-Registry-Skelett** + Image-Atom als erstes komplettes Beispiel
   (Picker + Filter + Object-fit). Test: jeder `<img>` in jedem Modul
   wird klickbar und kann ausgetauscht werden, ohne dass das Modul ein
   image-Schema-Feld hat.
2. **Heading-Atom** + **Text-Atom** (basics: Color, Size-Token, Align).
   Test: Hero-Title und Section-Title bearbeitbar ohne Modul-Schema.
3. **Button-Atom** mit Variant-Picker. Test: CTA1/CTA2 in HeroSimple.
4. **Logos-Atom** als Repeater (`data-atom="logos"` + Items mit
   `data-atom="image"`). Test: SponsorsGrid wird ein 5-Zeilen-Modul.
5. **Module migrieren:** `data-atom` in HeroSimple, HeroVideo,
   FeatureCards, NewsGrid, SectionTitle, ButtonRow, ArticleContent,
   LocationBanner, ProgramTable, FestivalSlider.
6. **User-Test:** Manuel klickt durch jede Seite und meldet was
   funktioniert / fehlt.
7. **Klon-Test:** Neue Domain, neuer Klon — wie schnell geht es jetzt
   ein neues Modul aus DOM heraus zu erstellen, ohne Schema-Pflege?

## Was NICHT in v1 reinkommt

- Drag-and-drop neue Atoms in ein Modul einfügen (Webflow-Territory) —
  Atoms entstehen nur durch Module-HTML, nicht durch Editor-Aktionen.
- Custom-Atom-Type registrieren über UI — geht nur per Code.
- Validation/Constraints (z.B. „Heading muss <100 Zeichen sein").
- Atomic-CSS-Generation (Tailwind-Style Generated Classes) — wir
  arbeiten weiterhin mit den bestehenden CSS-Variablen + Module-CSS.

## Risiken / offene Fragen

- **Schema-Override-Konflikt:** wenn beide (Modul-Schema und Atom-Panel)
  ein Feld zeigen → wer gewinnt? Vorschlag: Atom-Panel ist additiv unter
  dem Modul-Schema, aber wir müssen aufpassen dass Save-Pfade nicht
  doppelt schreiben.
- **Repeater-Kollisionen:** der bestehende Repeater-Code in
  `[...slug].astro` ist groß (siehe `currentLang`-Logik bis Zeile 4400).
  Atom-basiertes Repeater-Handling muss damit kompatibel sein, nicht
  parallel.
- **Detection-Ambiguity:** ein `<a class="sx-fcard-btn">` ist ein Button
  AND ein Link — `data-atom="button"` explizit setzen schlägt
  Heuristik. Heuristik ist nur Fallback.
- **Performance:** Atom-Detection läuft beim Click — sollte O(1) sein
  (Tag-Lookup in einer Map, nicht volle DOM-Traversal pro Slot).

## Erfolgs-Kriterien

- ✅ Klick auf jedes `<img>` in irgendeinem Modul → Image-Picker erscheint
- ✅ Klick auf jedes `<h*>` → Heading-Editor mit Color-Token-Picker
- ✅ Sprachwechsel im Editor zeigt die andere Sprache live in der Vorschau
  (heute schon erledigt, soll nicht regredieren)
- ✅ Neues Modul hinzufügen kostet nur HTML+CSS, kein Schema-Eintrag
- ✅ Manuel kann diese Woche einen neuen Klon (andere Domain) komplett
  durchbedienen ohne dass „Sidebar leer" passiert
