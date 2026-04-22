#!/usr/bin/env python3
"""RawHTML → Astro Modules converter.

Pipeline step 2. Step 1 (elementor_to_nova.py) scraped sxtech.eu and
stored the Elementor HTML as a RawHTML section. This script reads that
stored HTML *from WP* and emits a new sections_json where each top-level
Elementor container is turned into the appropriate Astro module.

No network hit to sxtech.eu — we work from the already-imported HTML.

Iteration:
  python rawhtml_to_modules.py --slug regular-visitors           # dry-run (print plan)
  python rawhtml_to_modules.py --slug regular-visitors --push    # write back to WP
  python rawhtml_to_modules.py --slug regular-visitors --raw     # also keep the RawHTML as a trailing fallback section
"""
import argparse, base64, json, re, ssl, sys, urllib.request
from html import unescape

DST = "https://sx.zds.es"
DST_USER = "manuel"
DST_PW = "rrLJNonWxaLRgzkJEnbzhkQh"

SLUG_TO_PAGE_ID = {
    "regular-visitors": 9,
    "exhibitors-b2b":   10,
    "creators":          11,
    "program":           12,
    "news":              13,
}
TICKETS_URL = "https://www.eventbrite.ie/e/sx-festival-sx-expo-2026-berlin-tickets-1550925051579"

ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

def wp_get(page_id):
    url = f"{DST}/index.php/?rest_route=/wp/v2/pages/{page_id}&_fields=id,meta"
    req = urllib.request.Request(url)
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{DST_USER}:{DST_PW}".encode()).decode())
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.loads(r.read())

def wp_post(page_id, meta):
    url = f"{DST}/index.php/?rest_route=/wp/v2/pages/{page_id}"
    body = json.dumps({"meta": meta}).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{DST_USER}:{DST_PW}".encode()).decode())
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        return json.loads(r.read())

# ── DOM helpers: find matching closing </div> by tag-depth ────────────────────
TAG_RE = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)

def span_of_div(html: str, open_tag_start: int, open_tag_end: int) -> int:
    """Given position of a <div …> opening tag, return index after its matching </div>."""
    depth = 1
    for m in TAG_RE.finditer(html, open_tag_end):
        if m.group(1) == '/':
            depth -= 1
            if depth == 0:
                return m.end()
        else:
            depth += 1
    return len(html)

def strip_tags(s: str) -> str:
    return re.sub(r'<[^>]+>', '', s or '').strip()

def norm_url(url: str) -> str:
    return unescape(url).replace('https://sxtech.eu/', 'https://sx.zds.es/').replace('&#038;', '&')

# ── parsers per widget-type (on a container's inner HTML) ─────────────────────
def find_widgets(inner_html: str):
    """Yield (widget_type, block_html) for widgets inside a container, skipping
    widgets that are nested inside another widget (e.g. headings inside carousel
    slides). Only the outermost widget at each position is returned."""
    out = []
    consumed_until = 0
    for m in re.finditer(r'<div[^>]*data-widget_type="([^"]+)"[^>]*>', inner_html):
        if m.start() < consumed_until:
            continue  # this widget is nested inside a previously-matched one
        end = span_of_div(inner_html, m.start(), m.end())
        out.append((m.group(1), inner_html[m.start():end]))
        consumed_until = end
    return out

def parse_heading(block: str):
    m = re.search(r'<(h[1-6]|span|p|div)[^>]*class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)</\1>', block, re.IGNORECASE)
    if not m: return ""
    return strip_tags(m.group(2))

def parse_button(block: str):
    a = re.search(r'<a[^>]*href="([^"]*)"[^>]*class="[^"]*elementor-button[^"]*"[^>]*>([\s\S]*?)</a>', block)
    if not a:
        a = re.search(r'<a[^>]*class="[^"]*elementor-button[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)</a>', block)
    if not a: return None
    txt_m = re.search(r'<span[^>]*elementor-button-text[^>]*>([\s\S]*?)</span>', a.group(2))
    return {"text": strip_tags(txt_m.group(1) if txt_m else a.group(2)), "url": norm_url(a.group(1))}

def parse_icon_list(block: str):
    items = []
    for li in re.finditer(r'<li[^>]*class="elementor-icon-list-item"[^>]*>([\s\S]*?)</li>', block):
        body = li.group(1)
        href_m = re.search(r'href="([^"]+)"', body)
        txt_m = re.search(r'<span[^>]*class="elementor-icon-list-text"[^>]*>([\s\S]*?)</span>', body)
        label_html = txt_m.group(1) if txt_m else body
        color_m = re.search(r'<span[^>]*style="[^"]*color\s*:\s*([^;"]+)[^"]*"[^>]*>([\s\S]*?)</span>', label_html)
        item = {
            "href": norm_url(href_m.group(1)) if href_m else "#",
            "label": strip_tags(color_m.group(2) if color_m else label_html),
        }
        if color_m: item["color"] = color_m.group(1).strip()
        items.append(item)
    return items

def parse_carousel_slides(block: str):
    """Each swiper-slide → {image, name, role}. The carousel may contain nested
    containers; we walk per swiper-slide div and pull the first img + first two
    heading-titles per slide."""
    slides = []
    for m in re.finditer(r'<div[^>]*class="[^"]*swiper-slide[^"]*"[^>]*>', block):
        end = span_of_div(block, m.start(), m.end())
        s = block[m.start():end]
        img_m = re.search(r'<img[^>]*src="(https://[^"]+\.(?:png|jpg|jpeg|webp))"', s)
        hs = re.findall(r'class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)</(?:h[1-6]|span)>', s)
        hs = [strip_tags(h).upper() for h in hs if strip_tags(h)]
        slides.append({
            "image": norm_url(img_m.group(1)) if img_m else "",
            "name":  hs[0] if hs else "",
            "role":  hs[1] if len(hs) > 1 else "",
        })
    return slides

# ── container → module classifier ─────────────────────────────────────────────
def classify(widgets):
    """Given the list of top-level widgets inside a container, return a module spec
    dict or None (skip). Classification is based on the widget mix."""
    types = [w[0] for w in widgets]
    if not widgets: return None

    # Skip containers that are purely nav — we have our own Astro nav.
    if all(t == "nav-menu.default" for t in types): return None

    # Carousel container → LineupCarousel or FeaturedConversations
    carousel = next((w for w in widgets if w[0] in ("nested-carousel.default", "carousel.default")), None)
    if carousel:
        # Heading & subtitle are *earlier* widgets in the SAME container.
        headings = [parse_heading(b) for t, b in widgets if t == "heading.default"]
        headings = [h for h in headings if h]
        heading = headings[0] if headings else ""
        subtitle = headings[1] if len(headings) > 1 else ""
        slides = parse_carousel_slides(carousel[1])
        is_conv = any(k in (heading + " " + subtitle).upper() for k in ("CONVERSATION", "VOICES", "INTERVIEW"))
        if is_conv:
            items = [{"image": s["image"], "label": s["role"] or "INTERVIEW", "name": s["name"]} for s in slides if s["name"]]
            return {"type": "FeaturedConversations", "data": {"heading": heading, "subtitle": subtitle, "items": items, "autoplay_ms": 5000}}
        items = [{"image": s["image"], "name": s["name"], "role": s["role"]} for s in slides if s["name"]]
        return {"type": "LineupCarousel", "data": {"heading": heading, "subtitle": subtitle, "items": items, "autoplay_ms": 4000}}

    # Icon-list container → IconLinkList (optional leading heading)
    if any(t == "icon-list.default" for t in types):
        heading = ""
        for t, b in widgets:
            if t == "heading.default":
                heading = parse_heading(b); break
        items = []
        for t, b in widgets:
            if t == "icon-list.default":
                items.extend(parse_icon_list(b))
        if items:
            return {"type": "IconLinkList", "data": {"heading": heading, "items": items}}

    # Heading(s) + button container → HeroSimple / CTABanner
    headings = [parse_heading(b) for t, b in widgets if t == "heading.default"]
    headings = [h for h in headings if h]
    buttons  = [parse_button(b) for t, b in widgets if t == "button.default"]
    buttons  = [b for b in buttons if b]
    if headings:
        title = headings[0]
        subtitle = headings[1] if len(headings) > 1 else ""
        btn = buttons[0] if buttons else None
        return {"type": "HeroSimple", "data": {
            "title": title,
            "subtitle": subtitle,
            "cta_text": btn["text"] if btn else "",
            "cta_url":  btn["url"]  if btn else "",
        }}

    # Pure text/image container — skip for now (could emit TextBlock later)
    return None

# ── top-level container walker ────────────────────────────────────────────────
def top_level_containers(page_html: str):
    """Find direct-child containers of <div data-elementor-type='wp-page'>."""
    root_m = re.search(r'<div[^>]*data-elementor-type="wp-page"[^>]*>', page_html)
    if not root_m: return []
    root_end = span_of_div(page_html, root_m.start(), root_m.end())
    root_body_start = root_m.end()
    # Walk inside root: find first-level <div data-element_type="container">
    containers = []
    pos = root_body_start
    depth = 0
    while pos < root_end:
        m = TAG_RE.search(page_html, pos)
        if not m or m.end() > root_end: break
        if m.group(1) == '/':
            depth -= 1
            pos = m.end()
            continue
        # opening div
        tag = page_html[m.start():m.end()]
        if depth == 0 and 'data-element_type="container"' in tag:
            end = span_of_div(page_html, m.start(), m.end())
            containers.append((m.start(), end, page_html[m.start():end]))
            pos = end
        else:
            depth += 1
            pos = m.end()
    return containers

# ── main ──────────────────────────────────────────────────────────────────────
def process(slug: str, push: bool, keep_raw: bool):
    pid = SLUG_TO_PAGE_ID.get(slug)
    if not pid:
        print(f"no page_id for {slug}"); return
    print(f"\n→ {slug} (WP id={pid})")

    page = wp_get(pid)
    sections = json.loads(page["meta"].get("sections_json", "[]") or "[]")
    raw = next((s for s in sections if s.get("type") == "RawHTML"), None)
    if not raw:
        print("  [skip] no RawHTML section to convert"); return
    html = raw.get("data", {}).get("html", "") or raw.get("data", {}).get("html_en", "")
    css  = raw.get("data", {}).get("css", "")

    containers = top_level_containers(html)
    print(f"  top-level containers: {len(containers)}")

    # Pre-compute widgets per container
    container_data = []
    for cont_html in [c[2] for c in containers]:
        inner_start = re.search(r'<div[^>]*>', cont_html).end()
        inner_end = cont_html.rfind('</div>')
        inner = cont_html[inner_start:inner_end]
        widgets = find_widgets(inner)
        container_data.append((widgets, inner))

    # Merge rule: if container N is heading-only AND container N+1 contains a
    # carousel but has no heading widgets of its own, promote the headings
    # from N into N+1 and drop N.
    merged = []
    i = 0
    while i < len(container_data):
        widgets, inner = container_data[i]
        types = [w[0] for w in widgets]
        is_heading_only = types and all(t == "heading.default" for t in types)
        has_next = i + 1 < len(container_data)
        if is_heading_only and has_next:
            next_widgets, next_inner = container_data[i + 1]
            next_types = [w[0] for w in next_widgets]
            next_has_carousel = any(t in ("nested-carousel.default", "carousel.default") for t in next_types)
            # Carousel containers always "own" heading-only predecessors —
            # the nested headings inside swiper-slides are slide names, not
            # section titles.
            if next_has_carousel:
                merged.append((widgets + next_widgets, inner + next_inner))
                i += 2
                continue
        merged.append((widgets, inner))
        i += 1

    out_sections = []
    for idx, (widgets, inner_html) in enumerate(merged, 1):
        mod = classify(widgets)
        if not mod:
            # Fallback: emit the original container HTML as RawHTML so the content
            # still renders 1:1. Include the full scraped CSS on the first
            # fallback only (the <style> block is global in the DOM so we don't
            # need to duplicate it).
            first_raw = not any(s.get("type") == "RawHTML" for s in out_sections)
            mod = {"type": "RawHTML", "data": {"html": inner_html, "css": css if first_raw else ""}}
            print(f"    [{idx}] RawHTML fallback ({[w[0] for w in widgets]})")
        mod["id"] = f"{mod['type'].lower()}-{idx}"
        mod["mode"] = "detached"
        out_sections.append(mod)
        # Compact preview
        d = mod["data"]
        if mod["type"] in ("LineupCarousel", "FeaturedConversations"):
            preview = f"{d.get('heading','')[:30]} ({len(d.get('items',[]))} items)"
        elif mod["type"] == "IconLinkList":
            preview = f"{d.get('heading','')[:20]} ({len(d.get('items',[]))} items)"
        else:
            preview = f"{d.get('title','')[:40]}"
        print(f"    [{idx}] {mod['type']:25s} {preview}")

    # Optional fallback: keep the RawHTML last so any unconverted bits still render
    if keep_raw:
        out_sections.append({"id": "raw-fallback", "type": "RawHTML", "mode": "detached", "data": {"html": html, "css": css}})

    if push:
        wp_post(pid, {"sections_json": json.dumps(out_sections, ensure_ascii=False)})
        print(f"  ✓ pushed {len(out_sections)} sections")
    else:
        print(f"  dry-run: {len(out_sections)} sections (pass --push to apply)")

    return out_sections

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--push", action="store_true")
    ap.add_argument("--raw", action="store_true", help="Keep the original RawHTML as a fallback section at the end")
    a = ap.parse_args()

    if a.all:
        for s in SLUG_TO_PAGE_ID: process(s, a.push, a.raw)
    elif a.slug:
        process(a.slug, a.push, a.raw)
    else:
        print("need --slug or --all"); sys.exit(1)

if __name__ == "__main__":
    main()
