"""
Elementor → Nova importer.

For each sxtech.eu page:
  1. Fetch rendered HTML
  2. Extract the Elementor content div (everything between <div data-elementor-type="wp-page"…> and </body>/</main>)
  3. Download the page-specific Elementor CSS (post-<id>.css)
  4. Download shared Elementor frontend CSS (custom-frontend.min.css, widget-*.min.css)
  5. Download theme CSS (hello-elementor/*.css)
  6. Download all referenced images; upload to sx.zds.es WP media; rewrite URLs in HTML + CSS
  7. Write a WP page on sx.zds.es with sections_json = [{ type: "RawHTML", data: { html, css } }]

Result: 1:1 visual clone via the RawHTML module, pixel-perfect because we reuse Elementor's own output.
Later refactor: replace RawHTML with dedicated Nova modules once the design is stable.

Usage:
  python elementor_to_nova.py                         # all 7 pages, dry-run (writes to .tmp/)
  python elementor_to_nova.py --upload                # actually upload + create WP pages
  python elementor_to_nova.py --pages home,creators   # subset
"""
import argparse, base64, hashlib, json, os, re, ssl, sys, urllib.parse, urllib.request
from pathlib import Path

# ── config ────────────────────────────────────────────────────────────────────
SRC = "https://sxtech.eu"
SRC_HOST = "sxtech.eu"
DST = "https://sx.zds.es"
DST_USER = "manuel"
DST_PW = "rrLJNonWxaLRgzkJEnbzhkQh"

PAGES = [
    ("homepage",         "/",                     8),
    ("regular-visitors", "/regular-visitors/",    17),
    ("exhibitors-b2b",   "/exhibitors-b2b/",      19),
    ("creators",         "/creators/",            21),
    ("program",          "/program/",             23),
    ("news",             "/news/",                502),
    ("cfp-form",         "/cfp-form/",            624),
]

OUT = Path(__file__).parent.parent / ".tmp" / "elementor-import"
OUT.mkdir(parents=True, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NovaImporter/1.0"

# ── network helpers ───────────────────────────────────────────────────────────
def fetch(url: str, binary: bool = False) -> bytes | str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", errors="replace")

def wp(method: str, path: str, body=None, form_data: bytes | None = None, content_type: str | None = None):
    req = urllib.request.Request(f"{DST}{path}", method=method)
    req.add_header("Authorization", f"Basic {base64.b64encode(f'{DST_USER}:{DST_PW}'.encode()).decode()}")
    data = None
    if form_data is not None:
        data = form_data
        if content_type: req.add_header("Content-Type", content_type)
    elif body is not None:
        data = json.dumps(body).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data=data, context=ctx, timeout=120) as r:
        return json.loads(r.read())

# ── extraction helpers ────────────────────────────────────────────────────────
ELEMENTOR_START_RE = re.compile(r'<div[^>]*data-elementor-type="wp-page"[^>]*>', re.IGNORECASE)

CSS_LINKS_RE = re.compile(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>', re.IGNORECASE)
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
IMG_URL_RE = re.compile(rf'https?://{re.escape(SRC_HOST)}/wp-content/uploads/[^\s"\'\)]+?\.(?:png|jpg|jpeg|webp|gif|svg|mp4|webm)', re.IGNORECASE)
CSS_URL_RE = re.compile(r'url\(\s*["\']?(https?://[^)"\']+)["\']?\s*\)', re.IGNORECASE)

def extract_elementor_html(full_html: str) -> str:
    """Extract from '<div data-elementor-type="wp-page"…>' up to '</body>'.
    Uses tag-depth tracking to close at the matching </div>."""
    start_m = ELEMENTOR_START_RE.search(full_html)
    if not start_m:
        return ""
    start = start_m.start()
    # Walk from start: count <div> / </div> up to depth 0.
    # The elementor block always has depth starting at 1 after opening.
    idx = start_m.end()
    depth = 1
    div_open = re.compile(r'<div\b', re.IGNORECASE)
    div_close = re.compile(r'</div\s*>', re.IGNORECASE)
    end_idx = len(full_html)
    # naive but effective: iterate each tag after start
    combined = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)
    pos = idx
    while pos < len(full_html):
        m = combined.search(full_html, pos)
        if not m: break
        if m.group(1) == '/':
            depth -= 1
            if depth == 0:
                end_idx = m.end()
                break
        else:
            depth += 1
        pos = m.end()
    block = full_html[start : end_idx]
    # strip all <script> tags for safety
    block = re.sub(r'<script[^>]*>.*?</script>', '', block, flags=re.DOTALL | re.IGNORECASE)
    block = re.sub(r'<noscript[^>]*>.*?</noscript>', '', block, flags=re.DOTALL | re.IGNORECASE)
    # strip inline event handlers
    block = re.sub(r'\son[a-z]+\s*=\s*"[^"]*"', '', block, flags=re.IGNORECASE)
    block = re.sub(r"\son[a-z]+\s*=\s*'[^']*'", '', block, flags=re.IGNORECASE)
    # remove wheel-of-fortune (mabel/wof) popups, iframes, and parent elementor-widgets containing them
    def strip_parent_with_class(html: str, child_pat: str) -> str:
        """Find child_pat; walk outward to the nearest <div class="…elementor-widget…"> and drop it."""
        out = []
        cursor = 0
        pat = re.compile(child_pat, re.IGNORECASE)
        while True:
            m = pat.search(html, cursor)
            if not m: break
            # walk backwards to find the enclosing div opening tag
            back_text = html[cursor:m.start()]
            # find last '<div' before match
            last_div = back_text.rfind('<div')
            if last_div < 0:
                out.append(html[cursor:m.end()])
                cursor = m.end()
                continue
            widget_start = cursor + last_div
            # find matching </div>
            depth = 1
            scan_pos = m.end()
            combined = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)
            end_pos = len(html)
            while scan_pos < len(html):
                mm = combined.search(html, scan_pos)
                if not mm: break
                if mm.group(1) == '/':
                    depth -= 1
                    if depth == 0:
                        end_pos = mm.end()
                        break
                else:
                    depth += 1
                scan_pos = mm.end()
            # emit everything up to widget_start, skip widget block
            out.append(html[cursor:widget_start])
            cursor = end_pos
        out.append(html[cursor:])
        return ''.join(out)

    block = strip_parent_with_class(block, r'class="[^"]*\bwof-[a-z-]+\b')
    block = strip_parent_with_class(block, r'class="[^"]*\bmabel-[a-z-]+\b')
    block = re.sub(r'<iframe[^>]*>.*?</iframe>', '', block, flags=re.DOTALL | re.IGNORECASE)
    return block

def extract_css_urls(full_html: str) -> list[str]:
    """Pull all CSS link hrefs, in order."""
    urls = []
    for link in CSS_LINKS_RE.findall(full_html):
        h = HREF_RE.search(link)
        if h:
            url = h.group(1)
            if not url.startswith("http"):
                url = SRC + ("" if url.startswith("/") else "/") + url
            urls.append(url)
    # dedup, preserve order
    seen, out = set(), []
    for u in urls:
        key = u.split("?")[0]
        if key in seen: continue
        seen.add(key)
        out.append(u)
    return out

def collect_assets(html: str, css: str) -> set[str]:
    assets = set(IMG_URL_RE.findall(html))
    assets |= set(IMG_URL_RE.findall(css))
    for m in CSS_URL_RE.finditer(css):
        u = m.group(1)
        if SRC_HOST in u:
            assets.add(u)
    return assets

# ── asset pipeline ────────────────────────────────────────────────────────────
def upload_media(local_path: Path, orig_filename: str) -> dict:
    """POST the file to /wp-json/wp/v2/media — returns dict with source_url."""
    # Build a multipart body manually
    boundary = "----NovaImporter" + hashlib.md5(str(local_path).encode()).hexdigest()
    mime = {
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
        ".mp4": "video/mp4", ".webm": "video/webm",
    }.get(local_path.suffix.lower(), "application/octet-stream")

    parts = []
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(f'Content-Disposition: form-data; name="file"; filename="{orig_filename}"\r\n'.encode())
    parts.append(f"Content-Type: {mime}\r\n\r\n".encode())
    parts.append(local_path.read_bytes())
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(parts)

    return wp("POST", "/wp-json/wp/v2/media",
              form_data=body,
              content_type=f"multipart/form-data; boundary={boundary}")

def ensure_assets_dir() -> Path:
    d = OUT / "assets"
    d.mkdir(exist_ok=True)
    return d

def download_asset(url: str) -> Path:
    assets = ensure_assets_dir()
    safe = hashlib.md5(url.encode()).hexdigest()[:12]
    filename = urllib.parse.unquote(url.split("/")[-1].split("?")[0])
    out = assets / f"{safe}_{filename}"
    if not out.exists():
        out.write_bytes(fetch(url, binary=True))  # type: ignore[arg-type]
    return out

def build_url_map(asset_urls: set[str], upload: bool) -> dict[str, str]:
    """Download every asset; if upload, also push to sx WP and map to its new source_url.
    Without upload, keep absolute sxtech.eu URLs so the page still loads images (hotlink)."""
    url_map = {}
    print(f"  Assets to process: {len(asset_urls)}")
    cache_file = OUT / "url_map_cache.json"
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    for i, u in enumerate(sorted(asset_urls), 1):
        if u in cache:
            url_map[u] = cache[u]
            continue
        try:
            if upload:
                local = download_asset(u)
                orig_name = urllib.parse.unquote(u.split("/")[-1].split("?")[0])
                m = upload_media(local, orig_name)
                new_url = m.get("source_url", u)
                url_map[u] = new_url
                cache[u] = new_url
                print(f"    [{i}/{len(asset_urls)}] ✓ {orig_name} → {new_url}")
            else:
                url_map[u] = u  # hotlink
        except Exception as e:
            print(f"    [{i}/{len(asset_urls)}] ✗ {u}: {e}")
            url_map[u] = u
    cache_file.write_text(json.dumps(cache, indent=2))
    return url_map

def rewrite(text: str, url_map: dict[str, str]) -> str:
    for src, dst in sorted(url_map.items(), key=lambda kv: -len(kv[0])):
        text = text.replace(src, dst)
    return text

# ── CSS pipeline ──────────────────────────────────────────────────────────────
def combine_css(html: str) -> tuple[str, list[str]]:
    """Download every linked stylesheet in order, concatenate. Returns (css, urls_list)."""
    urls = extract_css_urls(html)
    # Prioritize Elementor + theme CSS; drop analytics/plugins that might conflict
    KEEP = ("elementor", "hello-elementor", "font-awesome", "google")
    SKIP = ("mabel-wheel", "google-tagmanager", "gtm.js", "analytics")
    ordered = []
    for u in urls:
        lower = u.lower()
        if any(s in lower for s in SKIP):
            continue
        if any(k in lower for k in KEEP) or "wp-content" in lower or "wp-includes" in lower:
            ordered.append(u)
    chunks = []
    for u in ordered:
        try:
            css = fetch(u)
            chunks.append(f"/* ── {u} ── */\n{css}")
        except Exception as e:
            print(f"    ! failed to fetch css {u}: {e}")
    return "\n\n".join(chunks), ordered  # type: ignore[return-value]

# ── main per-page pipeline ────────────────────────────────────────────────────
def process_page(slug: str, src_path: str, post_id: int, upload: bool) -> dict:
    print(f"\n→ {slug} ({SRC}{src_path})")
    html_full = fetch(SRC + src_path)
    if not isinstance(html_full, str):
        raise RuntimeError("bad html response")

    elementor_html = extract_elementor_html(html_full)
    print(f"  Elementor block: {len(elementor_html)} chars")

    # Combine + download CSS
    combined_css, css_urls = combine_css(html_full)
    print(f"  CSS: {len(css_urls)} stylesheets, {len(combined_css)} chars")

    # Collect assets
    assets = collect_assets(elementor_html, combined_css)
    url_map = build_url_map(assets, upload=upload)

    # Rewrite HTML + CSS
    rewritten_html = rewrite(elementor_html, url_map)
    rewritten_css  = rewrite(combined_css, url_map)

    # Save local artifacts for debugging
    (OUT / f"{slug}.html").write_text(rewritten_html, encoding="utf-8")
    (OUT / f"{slug}.css").write_text(rewritten_css, encoding="utf-8")

    return {
        "slug": slug,
        "src_path": src_path,
        "post_id": post_id,
        "html": rewritten_html,
        "css": rewritten_css,
    }

def upsert_wp_page(slug: str, title: str, sections: list) -> int:
    """Create or update a WP page by slug; write sections_json meta."""
    # Map slug "homepage" → WP slug "homepage" (already exists); others create.
    existing = wp("GET", f"/wp-json/wp/v2/pages?slug={slug}&_fields=id")
    if existing:
        pid = existing[0]["id"]
    else:
        resp = wp("POST", "/wp-json/wp/v2/pages", {
            "slug": slug,
            "title": title,
            "status": "publish",
        })
        pid = resp["id"]
    wp("POST", f"/wp-json/wp/v2/pages/{pid}", {
        "meta": {"sections_json": json.dumps(sections, ensure_ascii=False)},
    })
    return pid

# ── main ──────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--upload", action="store_true", help="Upload images and write WP pages (live mode)")
    ap.add_argument("--pages", default="", help="Comma-separated slugs to process")
    args = ap.parse_args()

    selection = [p for p in PAGES if not args.pages or p[0] in args.pages.split(",")]
    print(f"Processing {len(selection)} page(s). Upload mode: {args.upload}")

    for slug, src_path, post_id in selection:
        data = process_page(slug, src_path, post_id, upload=args.upload)

        if not args.upload:
            print(f"  ✓ wrote .tmp/elementor-import/{slug}.html + .css (dry run)")
            continue

        # Build sections_json
        sections = [{
            "id": -1,
            "type": "RawHTML",
            "mode": "detached",
            "data": {
                "html":    data["html"],
                "html_en": data["html"],
                "html_es": data["html"],
                "css":     data["css"],
            },
        }]
        # homepage is always slug "homepage" in our WP
        wp_slug = "homepage" if slug == "homepage" else slug
        title = {
            "homepage": "Home",
            "regular-visitors": "Regular Visitors",
            "exhibitors-b2b": "Exhibitors & B2B",
            "creators": "Creators",
            "program": "Program",
            "news": "News",
            "cfp-form": "CFP Form",
        }.get(slug, slug.title())
        pid = upsert_wp_page(wp_slug, title, sections)
        print(f"  ✓ WP page id={pid} slug={wp_slug} updated")

    print("\nDone.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        sys.stderr.write(f"FATAL: {e}\n")
        raise
