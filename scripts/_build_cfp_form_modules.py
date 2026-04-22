"""Build cfp-form page. Minimal placeholder — full Elementor form on sxtech
is a WP-only widget; we link out to it until we port a native form."""
import base64, json, ssl, urllib.request
from pathlib import Path

DST = "https://sx.zds.es"
USER = "manuel"
PW = "rrLJNonWxaLRgzkJEnbzhkQh"

ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

def wp(method, path, body=None):
    req = urllib.request.Request(f"{DST}{path}", method=method)
    req.add_header("Authorization", f"Basic {base64.b64encode(f'{USER}:{PW}'.encode()).decode()}")
    data = json.dumps(body).encode() if body else None
    if body: req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data=data, context=ctx, timeout=120) as r: return json.loads(r.read())

# Create page if missing
existing = wp("GET", "/wp-json/wp/v2/pages?slug=cfp-form&_fields=id")
if existing:
    pid = existing[0]["id"]
else:
    resp = wp("POST", "/wp-json/wp/v2/pages", {
        "slug": "cfp-form", "title": "Speakers CFP", "status": "publish",
    })
    pid = resp["id"]

sections = [
    {
        "id": -1, "type": "HeroSimple", "mode": "detached",
        "data": {
            "title": "SPEAKERS\nCFP",
            "subtitle": "Call for Papers — SX Festival & Expo 2026\nShare your voice on stage.",
            "cta_text": "APPLY NOW",
            "cta_url":  "https://sxtech.eu/cfp-form/",
        },
    },
    {
        "id": -2, "type": "SectionTitle", "mode": "detached",
        "data": {
            "title": "What we're looking for",
            "subtitle": "Keynotes, panels, workshops and performances around sex tech, pleasure, kink, marketing, AI, payments, media, regulation — if your topic pushes the industry forward, we want to hear it.",
            "size": "sm",
        },
    },
]

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
(seed_dir / "cfp-form.sections.json").write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {"meta": {"sections_json": json.dumps(sections, ensure_ascii=False)}})
print(f"cfp-form: {len(sections)} modules -> WP id={pid}")
