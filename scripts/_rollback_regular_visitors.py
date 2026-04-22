"""Restore regular-visitors to the RawHTML 1:1 clone from .tmp/ + reapply yesterday's
manual CSS overrides (yellow text, nav-menu hide, icon-list white, red moon red,
arrow-up-right icon, back-nav dark).

Idempotent: running multiple times produces the same result.
"""
import base64, json, ssl, urllib.request
from pathlib import Path

DST = "https://sx.zds.es"
DST_USER = "manuel"
DST_PW = "rrLJNonWxaLRgzkJEnbzhkQh"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def wp(method, path, body=None):
    req = urllib.request.Request(f"{DST}{path}", method=method)
    req.add_header("Authorization", f"Basic {base64.b64encode(f'{DST_USER}:{DST_PW}'.encode()).decode()}")
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data=data, context=ctx, timeout=120) as r:
        return json.loads(r.read())

# ── Manual CSS overrides recovered from chat history (21.04.2026 evening) ────────
OVERRIDES = r"""
/* ─────────────────────────────────────────────────────────────────────────
   SX manual overrides (applied on top of imported Elementor CSS).
   Recovered after sections_json was lost — keep in repo from now on.
   ───────────────────────────────────────────────────────────────────────── */

/* 1. Grey-instead-of-yellow fix: Elementor kit's default text color bleeds
      through because we don't ship the <body class="elementor-17"> wrapper. */
[data-nova-el="rawhtml-section"] {
  --e-global-color-text: #ecfd21;
  --e-global-color-primary: #ecfd21;
  --e-global-color-secondary: #ecfd21;
  --e-global-color-accent: #ecfd21;
}
[data-nova-el="rawhtml-section"] .elementor-heading-title,
[data-nova-el="rawhtml-section"] .elementor-widget-heading h1,
[data-nova-el="rawhtml-section"] .elementor-widget-heading h2,
[data-nova-el="rawhtml-section"] .elementor-widget-heading h3,
[data-nova-el="rawhtml-section"] .elementor-widget-text-editor p,
[data-nova-el="rawhtml-section"] .elementor-widget-text-editor {
  color: #ecfd21;
}

/* 2. Subtitle grey tone: "WATCH WHAT UNFOLDS" etc. */
[data-nova-el="rawhtml-section"] .elementor-heading-title.elementor-size-default + *,
[data-nova-el="rawhtml-section"] .elementor-widget-heading + .elementor-widget-heading .elementor-heading-title {
  /* leave alone; per-widget overrides handled inline by Elementor */
}

/* 3. Icon-list: default white, Red Moon is red. */
[data-nova-el="rawhtml-section"] .elementor-icon-list-items .elementor-icon-list-text {
  color: #ffffff;
}
[data-nova-el="rawhtml-section"] .elementor-icon-list-items .elementor-icon-list-icon i {
  color: #ffffff;
}
/* Red Moon Party row: tag it via :has if supported, else rely on Elementor inline style */
[data-nova-el="rawhtml-section"] .elementor-icon-list-item:has(.elementor-icon-list-text:is(:contains("RED MOON"))) {
  color: #e30613;
}

/* 4. Missing arrow-up-right themify glyph */
[data-nova-el="rawhtml-section"] .ti-arrow-top-right:before { content: "\e65a"; }

/* 5. Hide the in-page nav-menu widget on desktop (we ship our own Nav) */
@media (min-width: 1024px) {
  [data-nova-el="rawhtml-section"] .elementor-widget-nav-menu,
  [data-nova-el="rawhtml-section"] .elementor-menu-toggle,
  [data-nova-el="rawhtml-section"] .elementor-widget-wc-menu-cart { display: none !important; }
}

/* 6. Carousel arrows: black on yellow background */
[data-nova-el="rawhtml-section"] .swiper-button-next,
[data-nova-el="rawhtml-section"] .swiper-button-prev,
[data-nova-el="rawhtml-section"] .elementor-swiper-button {
  color: #000 !important;
}
"""

tmp = Path(__file__).parent.parent / ".tmp" / "elementor-import"
html = (tmp / "regular-visitors.html").read_text(encoding="utf-8")
css  = (tmp / "regular-visitors.css").read_text(encoding="utf-8") + "\n\n" + OVERRIDES

sections = [{
    "id": -1,
    "type": "RawHTML",
    "mode": "detached",
    "data": {
        "html":    html,
        "html_en": html,
        "html_es": html,
        "css":     css,
    },
}]

# Seed file for future rollback without DB access
seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
(seed_dir / "regular-visitors.sections.json").write_text(
    json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(f"Seed written: {seed_dir / 'regular-visitors.sections.json'}")

existing = wp("GET", "/wp-json/wp/v2/pages?slug=regular-visitors&_fields=id")
pid = existing[0]["id"]
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {
    "meta": {"sections_json": json.dumps(sections, ensure_ascii=False)},
})
print(f"WP page id={pid}: sections_json updated ({len(css)} css + {len(html)} html chars)")
