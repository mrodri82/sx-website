"""Scrape 6 blog posts from sxtech.eu, upload featured images, create
matching WP pages on sx.zds.es with slug /post-<slug>, body rendered via a
new ArticleContent Astro module. Finally rewrites the /news NewsGrid links
from sxtech.eu URLs to our internal /post-<slug> URLs."""
import base64, hashlib, json, re, ssl, urllib.parse, urllib.request
from pathlib import Path

DST = "https://sx.zds.es"
USER = "manuel"
PW = "rrLJNonWxaLRgzkJEnbzhkQh"
UPL = "/wp-content/uploads/2026/04"

ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 SX/Migrator"})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

def wp(method, path, body=None):
    req = urllib.request.Request(f"{DST}{path}", method=method)
    req.add_header("Authorization", f"Basic {base64.b64encode(f'{USER}:{PW}'.encode()).decode()}")
    data = json.dumps(body).encode() if body else None
    if body: req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data=data, context=ctx, timeout=60) as r:
        return json.loads(r.read())

POSTS = [
    # (sxtech_url, target_slug, title, date_label, category, hero_image)
    ("https://sxtech.eu/2026/04/19/marius-rohde-interview/",
     "post-marius-rohde-interview", "Marius Rohde INTERVIEW", "Apr 19, 2026", "NEWS", "7w-1.png"),
    ("https://sxtech.eu/2026/04/19/sx-festival-artist-grant/",
     "post-sx-festival-artist-grant", "SX FESTIVAL ARTIST GRANT", "Apr 19, 2026", "NEWS", "4w-1.png"),
    ("https://sxtech.eu/2026/04/19/sxma-vote-04-08-05-08/",
     "post-sxma-vote-04-08-05-08", "SXMA VOTE 04.08-05.08", "Apr 19, 2026", "NEWS", "1-3-2.png"),
    ("https://sxtech.eu/2026/03/26/sxma-nominations-live/",
     "post-sxma-nominations-live", "SXMA NOMINATIONS LIVE", "Mar 26, 2026", "NEWS", "nowlive-1.png"),
    ("https://sxtech.eu/2026/02/24/hacking-desire/",
     "post-hacking-desire", "HACKING DESIRE", "Feb 24, 2026", "NEWS", "irma-1.png"),
    ("https://sxtech.eu/2026/02/10/ambassador-program-live/",
     "post-ambassador-program-live", "AMBASSADOR PROGRAM LIVE", "Feb 10, 2026", "RECAP", "nonm-1.png"),
]

ELEMENTOR_POST_RE = re.compile(r'<div[^>]*data-elementor-type="wp-post"[^>]*>', re.I)

def extract_article_body(html: str) -> str:
    """sxtech posts are full Elementor-rendered pages. The article body lives
    inside <div data-elementor-type="wp-post">. Extract that block via div
    depth-tracking, strip scripts/styles, rewrite sxtech asset URLs, and
    return the raw HTML."""
    m = ELEMENTOR_POST_RE.search(html)
    if not m:
        return ""
    start = m.end()
    pos = start
    depth = 1
    combined = re.compile(r'<(/?)div\b[^>]*>', re.I)
    end = len(html)
    while pos < len(html):
        mm = combined.search(html, pos)
        if not mm: break
        if mm.group(1) == '/':
            depth -= 1
            if depth == 0:
                end = mm.start()
                break
        else:
            depth += 1
        pos = mm.end()
    body = html[start:end]
    body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.S|re.I)
    body = re.sub(r'<style[^>]*>.*?</style>', '', body, flags=re.S|re.I)
    body = re.sub(r'<noscript[^>]*>.*?</noscript>', '', body, flags=re.S|re.I)
    # strip inline on-handlers
    body = re.sub(r'\son[a-z]+\s*=\s*"[^"]*"', '', body, flags=re.I)
    body = re.sub(r"\son[a-z]+\s*=\s*'[^']*'", '', body, flags=re.I)
    # rewrite sxtech.eu asset URLs to sx.zds.es (we've mirrored 2026/04/ uploads)
    body = body.replace("https://sxtech.eu/wp-content/uploads", f"{DST}/wp-content/uploads")
    return body.strip()

def upsert_page(slug: str, title: str, sections: list) -> int:
    existing = wp("GET", f"/wp-json/wp/v2/pages?slug={slug}&_fields=id")
    if existing:
        pid = existing[0]["id"]
    else:
        resp = wp("POST", "/wp-json/wp/v2/pages", {"slug": slug, "title": title, "status": "publish"})
        pid = resp["id"]
    wp("POST", f"/wp-json/wp/v2/pages/{pid}", {"meta": {"sections_json": json.dumps(sections, ensure_ascii=False)}})
    return pid

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
results = []

for (url, slug, title, date, cat, img) in POSTS:
    print(f"\n{slug}")
    try:
        html = fetch_text(url)
    except Exception as e:
        print(f"  fetch failed: {e}")
        continue
    body = extract_article_body(html)
    print(f"  body: {len(body)} chars")

    hero_img = f"{DST}{UPL}/{img}"
    sections = [
        {
            "id": -1, "type": "HeroSimple", "mode": "detached",
            "data": {
                "title": title,
                "subtitle": f"{cat} · {date}",
                "min_height": "48vh",
                "align": "start",
            },
        },
        {
            "id": -2, "type": "ArticleContent", "mode": "detached",
            "data": {
                "hero_image": hero_img,
                "category": cat,
                "date": date,
                "html": body,
            },
        },
    ]
    pid = upsert_page(slug, title, sections)
    (seed_dir / f"{slug}.sections.json").write_text(
        json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  -> WP id={pid}")
    results.append((slug, pid, title))

print("\nSummary:")
for s in results: print(f"  {s[0]}: id={s[1]} — {s[2]}")
