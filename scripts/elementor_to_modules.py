#!/usr/bin/env python3
"""Elementor → Nova Astro Modules converter.

Walks a sxtech.eu page's Elementor HTML top-down, identifies widgets by
data-widget_type, groups them semantically (heading + subtitle + button →
HeroSimple) and emits a sections_json with native Astro module instances.

Drop-in replacement for the earlier RawHTML-import flow. No CSS overrides
needed — each module already ships its own styles.

Usage:
  python elementor_to_modules.py --slug exhibitors-b2b
  python elementor_to_modules.py --slug creators --push     # upload to WP
  python elementor_to_modules.py --all --push               # all 5 inner pages

Requires the pages already imported once (images available on sx.zds.es).
"""
import argparse, base64, json, pathlib, re, ssl, sys, urllib.parse, urllib.request
from html import unescape

SRC = "https://sxtech.eu"
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
UA = "Mozilla/5.0 NovaConverter/1.0"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

def wp_post(page_id, meta):
    url = f"{DST}/index.php/?rest_route=/wp/v2/pages/{page_id}"
    body = json.dumps({"meta": meta}).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{DST_USER}:{DST_PW}".encode()).decode())
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        return json.loads(r.read())

# ── widget parsing ────────────────────────────────────────────────────────────
WIDGET_RE = re.compile(r'<div[^>]*data-widget_type="([^"]+)"[^>]*>', re.IGNORECASE)

def extract_widgets(html):
    """Yield (widget_type, full_block_html) in document order. Walks <div>
    depth to find each widget's closing tag."""
    combined = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)
    out = []
    for wm in WIDGET_RE.finditer(html):
        wtype = wm.group(1)
        start = wm.start()
        # Find matching </div> with depth tracking, starting from the opening tag
        depth = 1
        pos = wm.end()
        end = len(html)
        for dm in combined.finditer(html, pos):
            if dm.group(1) == '/':
                depth -= 1
                if depth == 0:
                    end = dm.end()
                    break
            else:
                depth += 1
        out.append((wtype, html[start:end]))
    return out

def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).strip()

def first_group(pattern, text, group=1, default=""):
    m = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    return m.group(group).strip() if m else default

def rewrite_img_url(url):
    """sxtech.eu URLs → sx.zds.es (path kept identical)."""
    return url.replace(SRC, DST).replace("&#038;", "&")

# ── widget → module extractors ────────────────────────────────────────────────
def parse_heading(block):
    """Return (text, level). level is 1/2/3/… based on h-tag."""
    m = re.search(r'<(h[1-6]|span)[^>]*class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)</\1>', block, re.IGNORECASE)
    if not m: return "", 6
    tag, body = m.group(1).lower(), m.group(2)
    level = int(tag[1]) if tag.startswith("h") else 6
    return strip_tags(body), level

def parse_button(block):
    a_m = re.search(r'<a[^>]*class="[^"]*elementor-button[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)</a>', block, re.IGNORECASE)
    if not a_m:
        a_m = re.search(r'<a[^>]*href="([^"]*)"[^>]*class="[^"]*elementor-button[^"]*"[^>]*>([\s\S]*?)</a>', block, re.IGNORECASE)
    if not a_m: return None
    text_m = re.search(r'<span[^>]*elementor-button-text[^>]*>([\s\S]*?)</span>', a_m.group(2), re.IGNORECASE)
    text = strip_tags(text_m.group(1) if text_m else a_m.group(2))
    return {"text": text, "url": unescape(a_m.group(1))}

def parse_icon_list(block):
    items = []
    for li in re.finditer(r'<li[^>]*class="elementor-icon-list-item"[^>]*>([\s\S]*?)</li>', block, re.IGNORECASE):
        body = li.group(1)
        href_m = re.search(r'href="([^"]+)"', body)
        text_span = re.search(r'<span[^>]*class="elementor-icon-list-text"[^>]*>([\s\S]*?)</span>', body, re.IGNORECASE)
        label_html = text_span.group(1) if text_span else body
        # detect inline color override
        color_m = re.search(r'<span[^>]*style="[^"]*color\s*:\s*([^;"]+)[^"]*"[^>]*>([\s\S]*?)</span>', label_html)
        if color_m:
            items.append({"label": strip_tags(color_m.group(2)), "href": unescape(href_m.group(1)) if href_m else "#", "color": color_m.group(1).strip()})
        else:
            items.append({"label": strip_tags(label_html), "href": unescape(href_m.group(1)) if href_m else "#"})
    return items

def parse_carousel(block, html_full):
    """Return list of {image, name, role} from swiper-slides. Images aren't always
    present inline (Elementor lazy-loads via JS) — we fall back to scraped assets."""
    slides = []
    # Each swiper-slide block
    slide_starts = [m.start() for m in re.finditer(r'<div[^>]*class="[^"]*swiper-slide[^"]*"', block)]
    slide_starts.append(len(block))
    for i in range(len(slide_starts) - 1):
        s = block[slide_starts[i]:slide_starts[i+1]]
        headings = re.findall(r'elementor-heading-title[^>]*>([\s\S]*?)</(?:h[1-6]|span)>', s)
        headings = [strip_tags(h).upper() for h in headings if strip_tags(h)]
        img_m = re.search(r'<img[^>]*src="(https://[^"]+\.(?:png|jpg|jpeg|webp))"', s)
        image = rewrite_img_url(img_m.group(1)) if img_m else ""
        if not image:
            # try to pull from surrounding widget via container data-settings
            bg_m = re.search(r'background[_-]image["\']?\s*:\s*["\']?(https://[^"\';\s)]+)', s)
            if bg_m: image = rewrite_img_url(bg_m.group(1))
        slides.append({
            "image": image,
            "name": headings[0] if headings else "",
            "role": headings[1] if len(headings) > 1 else "",
        })
    return slides

# ── grouper ───────────────────────────────────────────────────────────────────
def build_sections(widgets, page_html):
    """Walk widgets and emit Nova module entries."""
    sections = []
    buf_hero = None   # accumulator: {title, subtitle, cta_text, cta_url}
    section_ctr = 1

    def flush_hero(as_cta=False):
        nonlocal buf_hero, section_ctr
        if not buf_hero or not buf_hero.get("title"): buf_hero = None; return
        mod = "CTABanner" if as_cta else "HeroSimple"
        data = {
            "title":    buf_hero.get("title", ""),
            "subtitle": buf_hero.get("subtitle", ""),
            "cta_text": buf_hero.get("cta_text", ""),
            "cta_url":  buf_hero.get("cta_url", ""),
        }
        sections.append({"id": f"{mod.lower()}-{section_ctr}", "type": mod, "mode": "detached", "data": data})
        section_ctr += 1
        buf_hero = None

    for wtype, block in widgets:
        if wtype == "nav-menu.default":
            continue  # Astro Navigation handles this
        if wtype == "form.default":
            continue  # Footer form

        if wtype == "heading.default":
            text, level = parse_heading(block)
            if not text: continue
            if buf_hero is None:
                buf_hero = {"title": text}
            elif not buf_hero.get("subtitle"):
                buf_hero["subtitle"] = text
            else:
                # a new heading starts a new hero-group — flush previous
                flush_hero()
                buf_hero = {"title": text}
            continue

        if wtype == "button.default":
            btn = parse_button(block)
            if btn and buf_hero:
                buf_hero["cta_text"] = btn["text"]
                buf_hero["cta_url"]  = btn["url"]
            continue

        if wtype == "icon-list.default":
            flush_hero()
            items = parse_icon_list(block)
            if items:
                sections.append({
                    "id": f"iconlist-{section_ctr}",
                    "type": "IconLinkList",
                    "mode": "detached",
                    "data": {"heading": "", "items": items},
                })
                section_ctr += 1
            continue

        if wtype in ("nested-carousel.default", "carousel.default"):
            # Use the last-seen hero.title as carousel heading if it wasn't flushed yet
            heading = buf_hero["title"] if buf_hero else ""
            subtitle = buf_hero.get("subtitle", "") if buf_hero else ""
            buf_hero = None  # consume into carousel
            slides = parse_carousel(block, page_html)
            # Heuristic: "CONVERSATIONS" or "VOICES" keyword → FeaturedConversations
            is_conversations = any(k in (heading + " " + subtitle).upper() for k in ("CONVERSATION", "VOICES", "INTERVIEW"))
            mod = "FeaturedConversations" if is_conversations else "LineupCarousel"
            if is_conversations:
                items = [{"image": s["image"], "label": s["role"] or "INTERVIEW", "name": s["name"]} for s in slides if s["name"]]
            else:
                items = [{"image": s["image"], "name": s["name"], "role": s["role"]} for s in slides if s["name"]]
            sections.append({
                "id": f"{mod.lower()}-{section_ctr}",
                "type": mod,
                "mode": "detached",
                "data": {"heading": heading, "subtitle": subtitle, "items": items, "autoplay_ms": 4000 if not is_conversations else 5000},
            })
            section_ctr += 1
            continue

        # text-editor, image, divider → ignore for now (can be added later)

    # Final hero / CTA flush. If last buffered hero had a CTA, promote to CTABanner.
    if buf_hero:
        as_cta = bool(buf_hero.get("cta_text")) and len(sections) > 0
        flush_hero(as_cta=as_cta)

    return sections

# ── main ──────────────────────────────────────────────────────────────────────
def process(slug, push=False):
    print(f"\n→ {slug}")
    html = fetch(f"{SRC}/{slug}/")
    # extract only the elementor main content wrapper (ignore global header/footer widgets)
    m = re.search(r'<div[^>]*data-elementor-type="wp-page"[^>]*>', html)
    if m:
        start = m.start()
        # find matching end div via depth
        depth = 1
        pos = m.end()
        combined = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)
        end = len(html)
        for dm in combined.finditer(html, pos):
            if dm.group(1) == '/':
                depth -= 1
                if depth == 0:
                    end = dm.end(); break
            else:
                depth += 1
        content_html = html[start:end]
    else:
        content_html = html

    widgets = extract_widgets(content_html)
    print(f"  {len(widgets)} widgets")
    sections = build_sections(widgets, content_html)
    print(f"  → {len(sections)} Astro modules:")
    for s in sections:
        d = s["data"]
        if s["type"] in ("HeroSimple", "CTABanner"):
            preview = d.get("title", "")[:40]
        elif s["type"] == "IconLinkList":
            preview = f"{len(d.get('items',[]))} items"
        else:
            preview = f"{d.get('heading','')[:30]} — {len(d.get('items',[]))} items"
        print(f"    {s['type']:25s}  {preview}")

    if push:
        pid = SLUG_TO_PAGE_ID.get(slug)
        if not pid:
            print(f"  [skip push] no WP page_id for {slug}")
            return
        wp_post(pid, {"sections_json": json.dumps(sections, ensure_ascii=False)})
        print(f"  ✓ pushed to WP page {pid}")
    return sections

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", help="Single slug (e.g. exhibitors-b2b)")
    ap.add_argument("--all", action="store_true", help="Process all 5 inner pages")
    ap.add_argument("--push", action="store_true", help="POST sections_json to WP")
    args = ap.parse_args()

    if args.all:
        for slug in SLUG_TO_PAGE_ID:
            process(slug, push=args.push)
    elif args.slug:
        process(args.slug, push=args.push)
    else:
        print("need --slug or --all"); sys.exit(1)

if __name__ == "__main__":
    main()
