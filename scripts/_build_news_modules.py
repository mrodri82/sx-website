"""Build news page as native Astro modules."""
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
            "title": "HOT NEWS",
            "subtitle": "Partner with SX EXPO 2026 and be part of something\nextraordinary.",
            "min_height": "48vh",
            "cta_text": "JOIN OUR NEWSLETTER",
            "cta_url":  "https://sxtech.us20.list-manage.com/subscribe?u=3e8fe16cc99a204f2cded972c&id=b03816ab1d",
            "cta2_text": "MEDIA APPLY",
            "cta2_url":  "https://forms.monday.com/forms/51e8b9610adda9f8f3eba50f8f55ecc7?r=euc1",
        },
    },
    {
        "id": -2, "type": "NewsGrid", "mode": "detached",
        "data": {
            "columns": 3,
            "items": [
                {"image": f"{DST}{UPL}/7w-1.png", "category": "NEWS",
                 "title": "Marius Rohde INTERVIEW",
                 "href":  "/post-marius-rohde-interview",
                 "date":  "Apr 19, 2026"},
                {"image": f"{DST}{UPL}/4w-1.png", "category": "NEWS",
                 "title": "SX FESTIVAL ARTIST GRANT",
                 "href":  "/post-sx-festival-artist-grant",
                 "description": "APPLICATION OPEN!",
                 "date":  "Apr 19, 2026"},
                {"image": f"{DST}{UPL}/1-3-2.png", "category": "NEWS",
                 "title": "SXMA VOTE 04.08-05.08",
                 "href":  "/post-sxma-vote-04-08-05-08",
                 "date":  "Apr 19, 2026"},
                {"image": f"{DST}{UPL}/nowlive-1.png", "category": "NEWS",
                 "title": "SXMA NOMINATIONS LIVE",
                 "href":  "/post-sxma-nominations-live",
                 "description": "SXMA Awards nominations are now live. Voting begins on 1.04.",
                 "date":  "Mar 26, 2026"},
                {"image": f"{DST}{UPL}/irma-1.png", "category": "NEWS",
                 "title": "HACKING DESIRE",
                 "href":  "/post-hacking-desire",
                 "description": "Join the official warm up event for the SX Festival at Venture Café. Free registration. Data, desire, and sex hacks.",
                 "date":  "Feb 24, 2026"},
                {"image": f"{DST}{UPL}/nonm-1.png", "category": "RECAP",
                 "title": "AMBASSADOR PROGRAM LIVE",
                 "href":  "/post-ambassador-program-live",
                 "description": "Step into the inner circle. Get rewarded with exclusive access, special tickets, and behind-the-scenes experiences.",
                 "date":  "Feb 10, 2026"},
                {"image": f"{DST}/wp-content/uploads/2026/04/ph31.png", "category": "NEWS",
                 "title": "ARTISTS APPLY TODAY",
                 "href":  "/post-artists-apply-today",
                 "description": "Creators, performers and visual artists — apply to take part in SX Festival 2026.",
                 "date":  "Feb 10, 2026"},
                {"image": f"{DST}/wp-content/uploads/2026/04/sxt.png", "category": "NEWS",
                 "title": "SXMA AWARDS NOMINATE",
                 "href":  "/post-sxma-awards-nominate",
                 "description": "Nominations for the SX Marketing Awards are open — celebrate the teams and campaigns shaping the category.",
                 "date":  "Feb 10, 2026"},
            ],
        },
    },
]

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
(seed_dir / "news.sections.json").write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
pid = wp("GET", "/wp-json/wp/v2/pages?slug=news&_fields=id")[0]["id"]
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {"meta": {"sections_json": json.dumps(sections, ensure_ascii=False)}})
print(f"news: {len(sections)} modules -> WP id={pid}")
