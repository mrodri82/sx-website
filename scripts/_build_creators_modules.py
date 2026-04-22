"""Build creators page as native Astro modules."""
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

CREATOR_URL = "https://wkf.ms/4qpG1Ks"
BRAND_URL   = "https://wkf.ms/49zQjCt"

sections = [
    {
        "id": -1, "type": "HeroSimple", "mode": "detached",
        "data": {
            "title": "join our\ncommunity",
            "subtitle": "Get access to SX Expo 2026 opportunities\nFANS AREA, brand collaborations,\nFREE TICKETS and VIP PERKS",
            "cta_text": "Register as\na Creator", "cta_url": CREATOR_URL,
            "cta2_text": "Brand Ambassador\nprogram", "cta2_url": BRAND_URL,
            "cta2_ghost": False,
            "bg_image": f"{DST}{UPL}/backcre-1.png",
        },
    },
    {
        "id": -2, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "Choose Your Path", "size": "sm"},
    },
    {
        "id": -3, "type": "FeatureCards", "mode": "detached",
        "data": {
            "columns": 2,
            "layout": "overlay",
            "items": [
                {
                    "title": "CREATOR",
                    "description": "Create content, Meet fans and enjoy free tickets",
                    "buttons": [{"label": "APPLY HERE", "href": CREATOR_URL}],
                    "bg_image": f"{DST}{UPL}/creatorapply-1.png",
                },
                {
                    "title": "BRAND AMBASSADOR",
                    "description": "Represent the brand, affiliate and get VIP access",
                    "buttons": [{"label": "APPLY HERE", "href": BRAND_URL}],
                    "bg_image": f"{DST}{UPL}/ba-1.png",
                },
            ],
        },
    },
    {
        "id": -4, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "Our Top Creators This Month", "size": "sm"},
    },
    {
        "id": -5, "type": "AvatarCarousel", "mode": "detached",
        "data": {
            "direction": "ltr", "autoplay_ms": 2500,
            "items": [
                {"image": f"{DST}{UPL}/PH12-1.png",  "name": "TRIXIE FOX",       "role": "creator", "href": "https://www.instagram.com/miss.trixiefox/"},
                {"image": f"{DST}{UPL}/Missm-1.png", "name": "MISS MASOCHIST",   "role": "creator", "href": "https://www.instagram.com/miss_masochist_/"},
                {"image": f"{DST}{UPL}/cv-1.png",    "name": "CAROLINA VINCENT", "role": "creator", "href": "https://www.instagram.com/carrovinc/"},
                {"image": f"{DST}{UPL}/PH11-1.png",  "name": "HAYLEY QUINN",     "role": "creator", "href": "https://www.instagram.com/hayleyrowson/"},
                {"image": f"{DST}{UPL}/mm-2.png",    "name": "MARIUS ROHDE",     "role": "fetish creator", "href": "https://www.instagram.com/diesermarius/"},
                {"image": f"{DST}{UPL}/mm-1-1.png",  "name": "MARINA VALMONT",   "role": "creator", "href": "https://www.instagram.com/marinavalmont/"},
            ],
        },
    },
    {
        "id": -6, "type": "AvatarCarousel", "mode": "detached",
        "data": {
            "direction": "rtl", "autoplay_ms": 2500,
            "items": [
                {"image": f"{DST}{UPL}/1-4.png", "name": "GODESS KINX",    "role": "creator", "href": "https://x.com/GoddessKinx"},
                {"image": f"{DST}{UPL}/2-1.png", "name": "ECCY",           "role": "creator", "href": "https://www.instagram.com/chaosgoblin3.0/"},
                {"image": f"{DST}{UPL}/3-1.png", "name": "DOMINA LAVEAU",  "role": "creator", "href": "https://www.instagram.com/dominalaveau/"},
                {"image": f"{DST}{UPL}/4-1.png", "name": "PIXIE SIN",      "role": "creator", "href": "https://www.instagram.com/sinnerpixie/"},
                {"image": f"{DST}{UPL}/5-1.png", "name": "DOMINATRIX RIN", "role": "creator", "href": "https://x.com/sfdomme"},
                {"image": f"{DST}{UPL}/6-1.png", "name": "IVINITTY",       "role": "creator", "href": "https://www.instagram.com/ivinitty"},
            ],
        },
    },
]

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
(seed_dir / "creators.sections.json").write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
pid = wp("GET", "/wp-json/wp/v2/pages?slug=creators&_fields=id")[0]["id"]
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {"meta": {"sections_json": json.dumps(sections, ensure_ascii=False)}})
print(f"creators: {len(sections)} modules -> WP id={pid}")
