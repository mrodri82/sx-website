"""Build program page — LIGHT theme (white bg, black text, centered).
Matches sxtech /program layout where hero is white with black title + centered,
nav logo black. Includes date-pill variants, BUY/WIN buttons with inverse
colors, 3 full-width ProgramBanners (sxtech-style), then my 3 FeatureCards as
a compact recap, followed by TOP VOICES slider, ticker, and Exhibit/Sponsor
buttons."""
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
            "theme": "light",
            "align": "center",
            "min_height": "48vh",
            "chips": [
                {"label": "26.6.26", "variant": "primary"},
                {"label": "27.6.26", "variant": "muted"},
                {"label": "28.6.26", "variant": "muted"},
            ],
            "subtitle": "A multidisciplinary adult event blending ADULT entertainment, art, and live shows. Top influencers, media, SEX educators, sexologists, and kink communities all in one place.",
            "cta_text": "BUY<br>TICKET",   "cta_url":  "https://sxtech.eu/#tickets",  "cta_variant": "black",
            "cta2_text": "WIN<br>TICKET",  "cta2_url": "https://sxtech.eu/#spinner", "cta2_variant": "solid",
        },
    },
    # --- sxtech 3 banners (kept as the primary design, even if minimal) ---
    {
        "id": -2, "type": "ProgramBanners", "mode": "detached",
        "data": {
            "theme": "light",
            "items": [
                {
                    "title": "SXMAwards",
                    "date": "26.6.26",
                    "info": "RSVP ONLY",
                    "description": "SEX MARKETING AWARDS honor the visionaries redefining pleasure and shaping the future of sex tech.",
                    "tags": [
                        "Best Social Media Campaign",
                        "Best Creator Platform Collaboration",
                        "Best Marketing Agency",
                        "Launch of the Year",
                    ],
                    "buttons": [
                        {"label": "VOTING 01.04.2026",   "href": "https://sxma.sxtech.eu/"},
                        {"label": "WIN TICKET AND VOTE", "href": "https://sxma.sxtech.eu/", "variant": "ghost"},
                    ],
                    "bg_image": f"{DST}{UPL}/tlo-2-1.png",
                    "accent": "#ecfd21",
                },
                {
                    "title": "RED MOON\nPARTY",
                    "date": "28.6.26",
                    "info": "STARTS AT 21:30",
                    "description": "The afterparty of SX Festival — exclusive venue, late-night programme, surprise performers.",
                    "buttons": [
                        {"label": "TICKETS COMING SOON",
                         "href": "https://www.canva.com/design/DAGk477Z-Vk/Le7giNor9aVgix6F16Uu1Q/view"},
                    ],
                    "bg_image": f"{DST}{UPL}/backg-2-1.png",
                    "accent": "#FF3355",
                },
                {
                    "title": "SX FESTIVAL",
                    "date": "27-28.6.26",
                    "info": "11:00 — 20:30",
                    "description": "Two days of panels, workshops, performances and experiences across multiple stages and the SX Expo floor.",
                    "buttons": [
                        {"label": "FOR REGULAR VISITORS",  "href": "https://sxtech.eu/#tickets"},
                        {"label": "FOR BUSINESS VISITORS", "href": "https://sxtech.eu/#tickets", "variant": "ghost"},
                    ],
                    "bg_image": f"{DST}{UPL}/cc-1.png",
                    "accent": "#ecfd21",
                },
            ],
        },
    },
    # --- my cleaner recap grid kept below (user explicitly wanted both) ---
    {
        "id": -3, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "AT A GLANCE", "size": "sm", "align": "center", "theme": "light"},
    },
    {
        "id": -4, "type": "FeatureCards", "mode": "detached",
        "data": {
            "columns": 3,
            "theme": "light",
            "items": [
                {
                    "title": "SXMAwards",
                    "description": "<strong>26.6.26 — RSVP ONLY</strong><br>Sex Marketing Awards · 4 categories · voting opens 01.04.2026.",
                    "bg_image": f"{DST}{UPL}/tlo-2-1.png",
                    "buttons": [{"label": "VOTE", "href": "https://sxma.sxtech.eu/"}],
                },
                {
                    "title": "RED MOON\nPARTY",
                    "description": "<strong>28.6.26 — STARTS 21:30</strong><br>The afterparty of SX Festival — exclusive venue + surprise performers.",
                    "bg_image": f"{DST}{UPL}/backg-2-1.png",
                    "buttons": [{"label": "TICKETS SOON",
                                  "href": "https://www.canva.com/design/DAGk477Z-Vk/Le7giNor9aVgix6F16Uu1Q/view"}],
                },
                {
                    "title": "SX FESTIVAL",
                    "description": "<strong>27-28.6.26 · 11:00-20:30</strong><br>Panels, workshops, performances across multiple stages.",
                    "bg_image": f"{DST}{UPL}/cc-1.png",
                    "buttons": [{"label": "GET TICKET", "href": "https://sxtech.eu/#tickets"}],
                },
            ],
        },
    },
    {
        "id": -5, "type": "TopVoices", "mode": "detached",
        "data": {
            "heading": "TOP VOICES",
            "theme": "light",
            "voices": [
                {"thumb": f"{DST}{UPL}/kylie-1.png", "large": f"{DST}{UPL}/kyli2-1.png", "alt": "Kylie"},
                {"thumb": f"{DST}{UPL}/bp-1.png",    "large": f"{DST}{UPL}/bp2-1.png",   "alt": "BP"},
                {"thumb": f"{DST}{UPL}/kris2-1.png", "large": f"{DST}{UPL}/kris3-1.png", "alt": "Kris"},
                {"thumb": f"{DST}{UPL}/mik3-1.png",  "large": f"{DST}{UPL}/mik4-1.png",  "alt": "Mik"},
                {"thumb": f"{DST}{UPL}/moon1-1.png", "large": f"{DST}{UPL}/moon2-1.png", "alt": "Moon"},
                {"thumb": f"{DST}{UPL}/muse1-1.png", "large": f"{DST}{UPL}/muse2-1.png", "alt": "Muse"},
            ],
        },
    },
    {
        "id": -8, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "HOT TOPICS & EXPERIENCES", "size": "md", "align": "center", "theme": "light"},
    },
    {
        "id": -9, "type": "ProgramTable", "mode": "detached",
        "data": {
            "theme": "light",
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
    # --- Ticker moved to just UNDER the hot-topics table ---
    {
        "id": -7, "type": "Ticker", "mode": "detached",
        "data": {
            "text": "FULL PROGRAM COMING SOON!",
            "separator": " • ",
            "speed_sec": 30,
            "theme": "yellow",
            "repeat": 6,
        },
    },
    # --- Exhibit / Sponsor buttons row — 2 solid buttons, centered, white
    # section bg (kept inside the content container, not full-bleed). ---
    {
        "id": -10, "type": "ButtonRow", "mode": "detached",
        "data": {
            "theme": "light",
            "align": "center",
            "size":  "lg",
            "items": [
                {"label": "BECOME AN EXHIBITOR", "href": "/exhibitors-b2b",      "variant": "black"},
                {"label": "BECOME A SPONSOR",    "href": "mailto:info@sxtech.eu", "variant": "yellow"},
            ],
        },
    },
    # --- Berlin 2026 venue banner with text pinned to each corner.
    # Background is the real Heeresbäckerei photo sourced from the sxtech
    # media library (same asset used on sxtech.eu /program). ---
    {
        "id": -11, "type": "LocationBanner", "mode": "detached",
        "data": {
            "bg_image": "https://sxtech.eu/wp-content/uploads/2026/03/cc.png",
            "height": "520px",
            "color": "#ecfd21",
            "bw": True,
            "top_left":     {"lines": ["BERLIN 2026", "JUNE 26-28"], "size": "xl"},
            "bottom_left":  {"lines": ["sxfestival", "expo", "berlin"], "size": "lg"},
            "bottom_right": {"lines": ["Heeresbäckerei Berlin", "Köpenicker Straße 16, Berlin"], "size": "md"},
        },
    },
]

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
(seed_dir / "program.sections.json").write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
pid = wp("GET", "/wp-json/wp/v2/pages?slug=program&_fields=id")[0]["id"]
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {"meta": {"sections_json": json.dumps(sections, ensure_ascii=False)}})
print(f"program: {len(sections)} modules -> WP id={pid}")
