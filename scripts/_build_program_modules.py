"""Build program page as native Astro modules."""
import base64, json, ssl, urllib.request
from pathlib import Path

DST = "https://sx.zds.es"
USER = "manuel"
PW = "rrLJNonWxaLRgzkJEnbzhkQh"
UPL = "/wp-content/uploads/2026/04"

ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

def wp(method, path, body=None):
    req = urllib.request.Request(f"{DST}{path}", method=method)
    req.add_header("Authorization", f"Basic {base64.b64encode(f'{USER}:{PW}'.encode()).decode()}")
    data = json.dumps(body).encode() if body else None
    if body: req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data=data, context=ctx, timeout=120) as r: return json.loads(r.read())

sections = [
    {
        "id": -1, "type": "HeroSimple", "mode": "detached",
        "data": {
            "title": "THE PROGRAM",
            "subtitle": "A multidisciplinary adult event blending ADULT entertainment, art, and live shows. Top influencers, media, SEX educators, sexologists, and kink communities all in one place.",
            "cta_text": "BUY TICKET",  "cta_url":  "https://sxtech.eu/#tickets",
            "cta2_text": "WIN TICKET", "cta2_url": "https://sxtech.eu/#spinner",
        },
    },
    {
        "id": -2, "type": "FeatureCards", "mode": "detached",
        "data": {
            "columns": 3,
            "items": [
                {
                    "title": "SXMAwards",
                    "description": "<strong>26.6.26 — RSVP ONLY</strong><br>SEX MARKETING AWARDS honor the visionaries redefining pleasure and shaping the future of sex tech.<br><br>BEST SOCIAL MEDIA CAMPAIGN · Best Creator Platform Collaboration · Best Marketing Agency · Launch of the Year",
                    "buttons": [
                        {"label": "VOTING 01.04.2026", "href": "https://sxma.sxtech.eu/"},
                        {"label": "WIN TICKET AND VOTE", "href": "https://sxma.sxtech.eu/"},
                    ],
                },
                {
                    "title": "RED MOON\nPARTY",
                    "description": "<strong>28.6.26 — STARTS AT 21:30</strong><br>The afterparty of SX Festival — exclusive venue, late-night programme, surprise performers.",
                    "buttons": [
                        {"label": "TICKETS COMING SOON", "href": "https://www.canva.com/design/DAGk477Z-Vk/Le7giNor9aVgix6F16Uu1Q/view"},
                    ],
                },
                {
                    "title": "SX FESTIVAL",
                    "description": "<strong>27-28.6.26 · 11:00-20:30</strong><br>Two days of panels, workshops, performances and experiences across multiple stages and the SX Expo floor.",
                    "buttons": [
                        {"label": "FOR REGULAR VISITORS",  "href": "https://sxtech.eu/#tickets"},
                        {"label": "FOR BUSINESS VISITORS", "href": "https://sxtech.eu/#tickets"},
                    ],
                },
            ],
        },
    },
    {
        "id": -3, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "TOP VOICES", "size": "lg"},
    },
    {
        "id": -4, "type": "FestivalSlider", "mode": "detached",
        "data": {
            "autoplay_ms": 4000,
            "items": [
                {"thumb": f"{DST}{UPL}/kylie-1.png", "large": f"{DST}{UPL}/kyli2-1.png"},
                {"thumb": f"{DST}{UPL}/bp-1.png",    "large": f"{DST}{UPL}/bp2-1.png"},
                {"thumb": f"{DST}{UPL}/kris2-1.png", "large": f"{DST}{UPL}/kris3-1.png"},
                {"thumb": f"{DST}{UPL}/mik3-1.png",  "large": f"{DST}{UPL}/mik4-1.png"},
                {"thumb": f"{DST}{UPL}/moon1-1.png", "large": f"{DST}{UPL}/moon2-1.png"},
                {"thumb": f"{DST}{UPL}/muse1-1.png", "large": f"{DST}{UPL}/muse2-1.png"},
            ],
        },
    },
    {
        "id": -5, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "HOT TOPICS & EXPERIENCES", "size": "lg"},
    },
    {
        "id": -6, "type": "ProgramTable", "mode": "detached",
        "data": {
            "labels": {"theme": "Theme", "voices": "Voices", "track": " ", "stage": "Stage & Date"},
            "items": [
                {"icon": f"{DST}{UPL}/kylie-1.png",
                 "theme": "Deconstructing ideas around sexuality",
                 "voices": "Kylie Darlings",
                 "track": "performance",
                 "stage": "Kink Garden\n27.6.2026"},
                {"icon": f"{DST}{UPL}/ol-1.png",
                 "theme": "Crossing the 'Gasm Chasm: Activating and Expanding Your Female Orgasmic Potential",
                 "voices": "Susan Bratton",
                 "track": "panel",
                 "stage": "Sensual Stage\n27.6.2026"},
                {"icon": f"{DST}{UPL}/Missm-1.png",
                 "theme": "Sober Sex: Building Confidence and Connection Again",
                 "voices": "Maddie Sin, Muse Sacred, LOLA",
                 "track": "panel",
                 "stage": "Sensual Stage\n27.6.2026"},
                {"icon": f"{DST}{UPL}/moon1-1.png",
                 "theme": "Exploring Arousal Beyond the Physical by Moonlight Society",
                 "voices": "Moonlight Society",
                 "track": "workshop",
                 "stage": "Sex Edu Stage\n27.6.2026"},
                {"icon": f"{DST}{UPL}/tickets-1.png",
                 "theme": "Bitter Moon Tarot",
                 "voices": "Magdalena Piech",
                 "track": "experience",
                 "stage": "Kink Market\n27-28.6.2026"},
            ],
        },
    },
]

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
(seed_dir / "program.sections.json").write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
pid = wp("GET", "/wp-json/wp/v2/pages?slug=program&_fields=id")[0]["id"]
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {"meta": {"sections_json": json.dumps(sections, ensure_ascii=False)}})
print(f"program: {len(sections)} modules -> WP id={pid}")
