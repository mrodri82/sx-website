"""Scrape 6 blog posts from sxtech.eu, upload featured images, create
matching WP pages on sx.zds.es with slug /post-<slug>, body rendered via a
new ArticleContent Astro module. Finally rewrites the /news NewsGrid links
from sxtech.eu URLs to our internal /post-<slug> URLs."""
import base64, hashlib, io, json, re, ssl, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

# Hero photos at full-resolution often weigh 1-2 MB raw. Resizing anything
# wider than this keeps retina-quality on a 1920 monitor while cutting
# several hundred KB. WebP at 85 % is visually lossless for photos and
# typically lands 60-80 % smaller than the source PNG.
MAX_W = 2560
WEBP_QUALITY = 85

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

# Cache so we upload each remote asset at most once across the whole run.
_upload_cache: dict[str, str] = {}
_IMG_EXT_RE = re.compile(r'\.(png|jpg|jpeg|webp|gif)(\?|$)', re.I)

def mirror_image(src_url: str) -> str:
    """Mirror an sxtech.eu upload to sx.zds.es Media Library (idempotent via
    slug lookup). Leaves non-sxtech URLs untouched. Non-image URLs are
    returned verbatim."""
    if not src_url or src_url in _upload_cache:
        return _upload_cache.get(src_url, src_url)
    if "sxtech.eu" not in src_url or not _IMG_EXT_RE.search(src_url):
        return src_url

    fname = src_url.rsplit('/', 1)[-1].split('?')[0]
    slug = re.sub(r'[^a-z0-9-]+', '-', fname.rsplit('.', 1)[0].lower()).strip('-')

    existing = wp("GET", f"/wp-json/wp/v2/media?slug={slug}&_fields=source_url")
    if existing:
        _upload_cache[src_url] = existing[0]["source_url"]
        return _upload_cache[src_url]

    try:
        req = urllib.request.Request(src_url, headers={"User-Agent": "Mozilla/5.0 SX/Migrator"})
        with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
            data = r.read()
    except Exception as e:
        print(f"    fetch {src_url} failed: {e}")
        return src_url

    raw_size = len(data)
    webp_bytes: bytes
    out_fname = fname
    try:
        img = Image.open(io.BytesIO(data))
        if img.width > MAX_W:
            ratio = MAX_W / img.width
            img = img.resize((MAX_W, int(img.height * ratio)), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='WEBP', quality=WEBP_QUALITY, method=6)
        webp_bytes = buf.getvalue()
        out_fname = fname.rsplit('.', 1)[0] + '.webp'
    except Exception as e:
        print(f"    recompress failed ({e}); uploading raw")
        webp_bytes = data

    saved_pct = 100 - (len(webp_bytes) * 100 / max(raw_size, 1))
    print(f"    mirror {fname} -> {out_fname}  ({raw_size//1024}KB -> {len(webp_bytes)//1024}KB, -{saved_pct:.0f}%)")

    upload_req = urllib.request.Request(f"{DST}/wp-json/wp/v2/media", method="POST", data=webp_bytes)
    upload_req.add_header("Authorization", f"Basic {base64.b64encode(f'{USER}:{PW}'.encode()).decode()}")
    upload_req.add_header("Content-Type", 'image/webp' if out_fname.endswith('.webp') else 'image/png')
    upload_req.add_header("Content-Disposition", f'attachment; filename="{out_fname}"')
    try:
        with urllib.request.urlopen(upload_req, context=ctx, timeout=180) as r:
            resp = json.loads(r.read())
    except Exception as e:
        print(f"    upload {out_fname} failed: {e}")
        return src_url
    new_url = resp.get("source_url") or src_url
    _upload_cache[src_url] = new_url
    return new_url

POSTS = [
    # (sxtech_url, target_slug, title, date_label, category, hero_image, inline_image?)
    # Titles carry an explicit \n so the blog hero renders them on two lines
    # (white-space: pre-line in the CSS). sxtech puts the subject on line 1
    # and the type/section ("INTERVIEW", "PROGRAM"…) on line 2.
    ("https://sxtech.eu/2026/04/19/marius-rohde-interview/",
     "post-marius-rohde-interview", "Marius Rohde\nINTERVIEW", "Apr 19, 2026", "NEWS",
     "https://sxtech.eu/wp-content/uploads/2026/04/2312-1.png",
     "https://sxtech.eu/wp-content/uploads/2026/04/Projekt-bez-nazwy-2.png"),
    ("https://sxtech.eu/2026/04/19/sx-festival-artist-grant/",
     "post-sx-festival-artist-grant", "SX FESTIVAL\nARTIST GRANT", "Apr 19, 2026", "NEWS", "4w-1.png", None),
    ("https://sxtech.eu/2026/04/19/sxma-vote-04-08-05-08/",
     "post-sxma-vote-04-08-05-08", "SXMA VOTE\n04.08-05.08", "Apr 19, 2026", "NEWS", "1-3-2.png", None),
    ("https://sxtech.eu/2026/03/26/sxma-nominations-live/",
     "post-sxma-nominations-live", "SXMA NOMINATIONS\nLIVE", "Mar 26, 2026", "NEWS", "nowlive-1.png", None),
    ("https://sxtech.eu/2026/02/24/hacking-desire/",
     "post-hacking-desire", "HACKING\nDESIRE", "Feb 24, 2026", "NEWS", "irma-1.png", None),
    ("https://sxtech.eu/2026/02/10/ambassador-program-live/",
     "post-ambassador-program-live", "AMBASSADOR\nPROGRAM LIVE", "Feb 10, 2026", "RECAP", "nonm-1.png", None),
    ("https://sxtech.eu/2026/02/10/artists-apply-today/",
     "post-artists-apply-today", "ARTISTS APPLY\nTODAY", "Feb 10, 2026", "NEWS",
     "https://sxtech.eu/wp-content/uploads/2026/02/ph31.webp", None),
    ("https://sxtech.eu/2026/02/10/sx-valentine-limited-offer/",
     "post-sxma-awards-nominate", "SXMA AWARDS\nNOMINATE", "Feb 10, 2026", "NEWS",
     "https://sxtech.eu/wp-content/uploads/2026/02/sxt.png", None),
]

def inject_image_after_first_paragraph(body: str, image_url: str) -> str:
    """Insert a <figure><img></figure> directly after the first closing </p>
    that follows meaningful prose. Skips <p>s inside headings/meta blocks by
    only matching plain-text paragraphs long enough to be actual content."""
    if not image_url: return body
    mirrored = mirror_image(image_url)
    figure = (
        f'<figure style="margin:32px 0;">'
        f'<img src="{mirrored}" alt="" loading="lazy" '
        f'style="width:100%;height:auto;display:block;"/>'
        f'</figure>'
    )
    for m in re.finditer(r'</p>', body, flags=re.I):
        segment = body[max(0, m.start()-400):m.start()]
        # first paragraph with >80 chars of visible prose is the intro
        txt = re.sub(r'<[^>]+>', '', segment).strip()
        if len(txt) > 80:
            return body[:m.end()] + figure + body[m.end():]
    return body + figure

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

    # The elementor-post block includes the whole page chrome (nav, logo,
    # hero image, hero title, plus the actual article). Trim everything before
    # the first text-editor widget — that's where the real prose starts.
    text_editor_idx = body.find('elementor-widget-text-editor')
    if text_editor_idx > 0:
        # walk backwards to find the opening <div> of that widget
        open_div = body.rfind('<div', 0, text_editor_idx)
        if open_div > 0:
            body = body[open_div:]

    # Mirror every inline image from sxtech.eu into the sx.zds.es Media
    # Library so posts become self-contained (idempotent via filename slug).
    def _rewrite_img(m):
        before, url, after = m.group(1), m.group(2), m.group(3)
        return f'{before}{mirror_image(url)}{after}'
    body = re.sub(
        r'(<img[^>]+src=")([^"]+)(")',
        _rewrite_img, body, flags=re.I)
    # also handle srcset (comma-separated "url size, url size")
    def _rewrite_srcset(m):
        head = m.group(1)
        parts = []
        for entry in m.group(2).split(','):
            entry = entry.strip()
            if not entry: continue
            segs = entry.split(' ', 1)
            new_url = mirror_image(segs[0])
            parts.append(new_url + (' ' + segs[1] if len(segs) > 1 else ''))
        return f'{head}"{", ".join(parts)}"'
    body = re.sub(r'(srcset=)"([^"]+)"', _rewrite_srcset, body, flags=re.I)
    # drop any remaining nav-menu / logo-heading widgets (safety net)
    body = re.sub(
        r'<div[^>]*elementor-widget-nav-menu[^>]*>.*?(?=<div[^>]*elementor-(widget|element)-)',
        '', body, flags=re.S|re.I)

    # Strip elementor-button widgets whose label is a Newsletter or Ticket
    # CTA — those now live in the article sidebar, so keeping them at the
    # end of the body would be redundant. Depth-walk closes the widget's
    # matching </div> before chopping.
    body = _strip_widgets_with_labels(body, [
        'newsletter', 'ticket', 'join our', 'get your ticket'
    ])

    # The text-editor trim earlier chopped opening <div>s from outer
    # elementor wrappers but left their matching </div>s dangling at the
    # end. That imbalance later escapes the article's main column and
    # breaks the sidebar grid. Rebalance by dropping the trailing
    # orphaned </div>s.
    body = _rebalance_divs(body)
    return body.strip()

def _rebalance_divs(html: str) -> str:
    opens  = len(re.findall(r'<div\b', html, flags=re.I))
    closes = len(re.findall(r'</div\s*>', html, flags=re.I))
    overage = closes - opens
    while overage > 0:
        idx = html.rfind('</div>')
        if idx < 0:
            break
        html = html[:idx] + html[idx+6:]
        overage -= 1
    return html

def _strip_widgets_with_labels(body: str, needles: list[str]) -> str:
    """Remove any <div ...elementor-widget-button...>…</div> block whose
    inner text contains one of `needles` (case-insensitive). Uses a div
    depth counter so nested Elementor DOM is handled correctly."""
    needles_lc = [n.lower() for n in needles]
    out = []
    cursor = 0
    start_re = re.compile(r'<div[^>]*elementor-widget-button[^>]*>', re.I)
    div_re   = re.compile(r'<(/?)div\b[^>]*>', re.I)
    while True:
        m = start_re.search(body, cursor)
        if not m:
            break
        pos = m.end()
        depth = 1
        end_pos = len(body)
        while pos < len(body):
            mm = div_re.search(body, pos)
            if not mm: break
            if mm.group(1) == '/':
                depth -= 1
                if depth == 0:
                    end_pos = mm.end()
                    break
            else:
                depth += 1
            pos = mm.end()
        block = body[m.start():end_pos]
        text = re.sub(r'<[^>]+>', ' ', block).lower()
        if any(n in text for n in needles_lc):
            out.append(body[cursor:m.start()])
        else:
            out.append(body[cursor:end_pos])
        cursor = end_pos
    out.append(body[cursor:])
    return ''.join(out)

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

for (url, slug, title, date, cat, img, inline_img) in POSTS:
    print(f"\n{slug}")
    try:
        html = fetch_text(url)
    except Exception as e:
        print(f"  fetch failed: {e}")
        continue
    body = extract_article_body(html)
    body = inject_image_after_first_paragraph(body, inline_img)
    print(f"  body: {len(body)} chars")

    # `img` may be a bare filename (already mirrored during the initial
    # scrape; referenced under DST/UPL) or a fully-qualified sxtech.eu URL
    # for posts added afterwards. In the URL case we mirror it now so every
    # post ends up with its hero image hosted on sx.zds.es.
    hero_img = mirror_image(img) if img.startswith("http") else f"{DST}{UPL}/{img}"
    # Hero = 70vh full-bleed image under transparent nav with the title
    # pinned to the bottom-left corner (sxtech.eu blog style). The meta line
    # (category · date) lives in ArticleContent right below, so we don't
    # duplicate it in the hero subtitle.
    sections = [
        {
            "id": -1, "type": "HeroSimple", "mode": "detached",
            "data": {
                "title": title,
                "bg_image": hero_img,
                "align": "start",
                "valign": "end",
                "min_height": "70vh",
            },
        },
        {
            "id": -2, "type": "ArticleContent", "mode": "detached",
            "data": {
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
