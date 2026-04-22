"""Build regular-visitors as native Astro modules (PA2 strategy: throw away
Elementor HTML entirely, keep only content + image URLs).

Uses existing modules: HeroSimple, LineupCarousel, FeaturedConversations, IconLinkList.
Images are hotlinked from sx.zds.es (uploaded previously by elementor_to_nova.py).

Writes seed + updates WP page 9.
"""
import base64, json, ssl, urllib.request
from pathlib import Path

DST = "https://sx.zds.es"
DST_USER = "manuel"
DST_PW = "rrLJNonWxaLRgzkJEnbzhkQh"
UPL = "/wp-content/uploads/2026/04"

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

EVENTBRITE = "https://www.eventbrite.ie/e/sx-festival-sx-expo-2026-berlin-tickets-1550925051579"

sections = [
    {
        "id": -1,
        "type": "HeroSimple",
        "mode": "detached",
        "data": {
            "title":    "THE\nLINEUP",
            "subtitle": "Join artists, creators, and performers shaping\nmodern kink, fetish, and alternative culture at one\nof the most anticipated festivals of 2026.",
            "cta_text": "GET TICKETS",
            "cta_url":  EVENTBRITE,
            "bg_image": f"{DST}{UPL}/backg-3.png",
        },
    },
    {
        "id": -2,
        "type": "LineupCarousel",
        "mode": "detached",
        "data": {
            "heading":     "LINEUP",
            "subtitle":    "WATCH WHAT UNFOLDS",
            "autoplay_ms": 5000,
            "items": [
                {"name": "MUSE SACRED",        "role": "Speaker", "image": f"{DST}{UPL}/muse.png"},
                {"name": "MARINA VALMONT",     "role": "Host",    "image": f"{DST}{UPL}/marina.png",     "href": "https://www.instagram.com/marinavalmont/"},
                {"name": "MISS MASOCHIST",     "role": "Speaker", "image": f"{DST}{UPL}/PHOTO3.png",     "href": "https://www.instagram.com/miss_masochist_/"},
                {"name": "MAGDALENA PIECH",    "role": "Artist",  "image": f"{DST}{UPL}/PHOTO4.png"},
                {"name": "ANNE ALLURA",        "role": "Artist",  "image": f"{DST}{UPL}/annaalura.png"},
                {"name": "FIFI FANTOME",       "role": "Artist",  "image": f"{DST}{UPL}/fifi.png"},
                {"name": "KYLIE DARLING",      "role": "Artist",  "image": f"{DST}{UPL}/kylie-2.png"},
                {"name": "EROTIC CIRCUITS",    "role": "Artist",  "image": f"{DST}{UPL}/erotic.png"},
                {"name": "MARIE SAUVAGE",      "role": "Speaker", "image": f"{DST}{UPL}/marie.png",      "href": "https://www.instagram.com/marie.sauvage/"},
                {"name": "CATHERINE DE NOIRE", "role": "Host",    "image": f"{DST}{UPL}/cath.png",       "href": "https://www.instagram.com/catherine_de_noire/"},
                {"name": "CHARLIE BOUQUETT",   "role": "Artist",  "image": f"{DST}{UPL}/chartlie.png",   "href": "https://www.instagram.com/charliebouquett/"},
            ],
        },
    },
    {
        "id": -3,
        "type": "FeaturedConversations",
        "mode": "detached",
        "data": {
            "heading":     "FEATURED CONVERSATIONS",
            "subtitle":    "VOICES OF SX FESTIVAL & SX EXPO",
            "autoplay_ms": 5000,
            "items": [
                {"label": "INTERVIEW", "status": "READ",        "name": "MARIUS ROHDE",     "image": f"{DST}{UPL}/25.png",   "href": "https://sxtech.eu/2026/04/19/marius-rohde-interview/"},
                {"label": "INTERVIEW", "status": "COMING SOON", "name": "CAT MINT",         "image": f"{DST}{UPL}/25-1.png"},
                {"label": "INTERVIEW", "status": "COMING SOON", "name": "CHARLIE BOUQUETT", "image": f"{DST}{UPL}/25-2.png"},
            ],
        },
    },
    {
        "id": -4,
        "type": "IconLinkList",
        "mode": "detached",
        "data": {
            "heading": "GET YOUR\nTICKETS",
            "items": [
                {"label": "DAY 1  SATURDAY",  "href": EVENTBRITE},
                {"label": "DAY 2 SUNDAY",     "href": EVENTBRITE},
                {"label": "WEEKEND",          "href": EVENTBRITE},
                {"label": "RED MOON PARTY",   "href": EVENTBRITE, "color": "#e30613"},
            ],
        },
    },
]

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
seed_file = seed_dir / "regular-visitors.sections.json"
seed_file.write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Seed: {seed_file}")

existing = wp("GET", "/wp-json/wp/v2/pages?slug=regular-visitors&_fields=id")
pid = existing[0]["id"]
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {
    "meta": {"sections_json": json.dumps(sections, ensure_ascii=False)},
})
print(f"WP id={pid}: {len(sections)} modules written")
