"""Build exhibitors-b2b as native Astro modules (phase 1: top 7 sections).

Phase 1 (now):
  1. HeroVideo     — READY TO EXHIBIT? + mp4 background + 2 CTAs
  2. SectionTitle  — "All the Things You Can't Skip"
  3. FeatureCards  — 4 cards 2x2 (EXPO / SPONSORSHIP / BUSINESS / VENUE)
  4. SectionTitle  — "Click. Sponsored. Done." + "Speed Boarding Sponsorship"
  5. PricingTiers  — SEEN €1000, RECOGNISED €2000, REMEMBERED €3000
  6. HeroSimple    — "THE B2B" + "june 27-28 berlin"
  7. SectionTitle  — "PROGRAM" + 2-day blurb

Phase 2 (later): TOP VOICES festival slider + Program Table.
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

CALL = "https://calendly.com/ola-sxtech/sx-expo-call"
B2B_TICKET = "https://www.eventbrite.ie/e/sx-festival-expo-2026-berlin-business-tech-only-tickets-1461155267739"
PAY = "https://wkf.ms/4tReioE"
VIDEO = f"{DST}/wp-content/uploads/2026/04/hero-exhibitors.mp4"

sections = [
    {
        "id": -1,
        "type": "HeroSimple",
        "mode": "detached",
        "data": {
            "title": "READY TO\nEXHIBIT?",
            "subtitle": "If your brand matters, it should be here.",
            "cta_text": "BOOK A CALL", "cta_url": CALL,
            "cta2_text": "BOOK A TICKET", "cta2_url": B2B_TICKET,
            "video_url": VIDEO,
        },
    },
    {
        "id": -2, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "All the Things You Can't Skip", "size": "sm"},
    },
    {
        "id": -3, "type": "FeatureCards", "mode": "detached",
        "data": {
            "columns": 2,
            "items": [
                {
                    "title": "EXPO BOOKING",
                    "description": "This is where people discover your brand.<br>Fancy LED Technology Booths.",
                    "bg_image": f"{DST}{UPL}/1-3.png",
                    "buttons": [
                        {"label": "CATALOGUE",  "href": "https://www.canva.com/design/DAGvAUDhuZo/jwoR6VhF50iNblYsSIbo7w/view"},
                        {"label": "BOOK A BOOTH", "href": "https://forms.monday.com/forms/e108c50e7f486102cec78a2ee3a9f673?r=euc1"},
                    ],
                },
                {
                    "title": "SPONSORSHIP",
                    "description": "If you want attention, this is the paid version.",
                    "bg_image": f"{DST}{UPL}/1-1-1.png",
                    "buttons": [
                        {"label": "VIEW OPTIONS", "href": "https://www.canva.com/design/DAGk477Z-Vk/Le7giNor9aVgix6F16Uu1Q/view"},
                        {"label": "BOOK A CALL",  "href": CALL},
                    ],
                },
                {
                    "title": "BUSINESS\nTICKETS",
                    "description": "BUSINESS & TECH TRACKS PROGRAM",
                    "bg_image": f"{DST}{UPL}/1-2-1-1.png",
                    "buttons": [
                        {"label": "BUSINESS TICKET", "href": B2B_TICKET},
                        {"label": "BUSINESS VIP",    "href": B2B_TICKET},
                    ],
                },
                {
                    "title": "VENUE\nPLAN",
                    "description": "Where you stand matters.",
                    "bg_image": f"{DST}{UPL}/Projekt-bez-nazwy-8.png",
                    "buttons": [
                        {"label": "VIRTUAL TOUR", "href": "https://tours.nexpics.com/visitberlin/magazin-der-heeresbaeckerei/"},
                        {"label": "MAPS",         "href": "https://www.google.com/maps/dir/?api=1&destination=Heeresb%C3%A4ckerei+Berlin+K%C3%B6penicker+Stra%C3%9Fe+16+Berlin"},
                    ],
                },
            ],
        },
    },
    {
        "id": -4, "type": "SectionTitle", "mode": "detached",
        "data": {
            "title": "Click. Sponsored. Done.",
            "subtitle": "Speed Boarding Sponsorship",
            "size": "sm",
        },
    },
    {
        "id": -5, "type": "PricingTiers", "mode": "detached",
        "data": {
            "items": [
                {
                    "name": "SEEN LEVEL", "price": "€1000",
                    "accent": "#A6A6A6",
                    "features": [
                        "Get Logo on event website (partners section)",
                        "1 social media mention (Instagram or LinkedIn)",
                        "Logo included in one newsletter (logo grid)",
                        "Event partner listing",
                        "1 B2B VIP TICKET or 2 B2B Regulars",
                    ],
                    "cta_label": "PAY NOW", "cta_href": PAY,
                },
                {
                    "name": "RECOGNISED LEVEL", "price": "€2000",
                    "accent": "#FFFFFF",
                    "features": [
                        "Everything from the \"Seen\"",
                        "2 social media mentions (Instagram or LinkedIn)",
                        "Logo in 2 newsletters grid",
                        "Logo placement on selected format (digital agenda/print poster)",
                        "2 B2B VIP or 3 B2B Regulars",
                        "1 week add run our Expo page",
                    ],
                    "cta_label": "PAY NOW", "cta_href": PAY,
                },
                {
                    "name": "REMEMBERED LEVEL", "price": "€3000",
                    "accent": "#ecfd21",
                    "features": [
                        "Everything from \"Recognised\"",
                        "1 dedicated social post (brand-focused)",
                        "Logo mention in the opening or closing event communication slide",
                        "Speaker slot 20 min keynote / panel",
                        "Strong backlink positioning press release",
                        "2 VIP B2B Tickets + 1 B2B regular",
                    ],
                    "cta_label": "PAY NOW", "cta_href": PAY,
                },
            ],
        },
    },
    {
        "id": -6, "type": "SectionTitle", "mode": "detached",
        "data": {
            "title": "THE B2B\nPROGRAM",
            "subtitle": "june 27-28\nberlin",
            "size": "lg",
            "layout": "row",
            "subtitle_style": "event",
        },
    },
    {
        "id": -7, "type": "SectionTitle", "mode": "detached",
        "data": {
            "subtitle": "2 days in Berlin packed with a high-impact program. Bringing together industry leaders and important topics and talks in the industry",
            "size": "lg",
        },
    },
    {
        "id": -8, "type": "SectionTitle", "mode": "detached",
        "data": {"title": "TOP VOICES", "size": "md", "align": "center"},
    },
    {
        "id": -9, "type": "FestivalSlider", "mode": "detached",
        "data": {
            "autoplay_ms": 4000,
            "items": [
                {"thumb": f"{DST}/wp-content/uploads/2026/04/carly-1.png",      "large": f"{DST}/wp-content/uploads/2026/04/carly1-1.png"},
                {"thumb": f"{DST}/wp-content/uploads/2026/04/payfasto-1.png",   "large": f"{DST}/wp-content/uploads/2026/04/payfasto1-1.png"},
                {"thumb": f"{DST}/wp-content/uploads/2026/04/sp-1.png",         "large": f"{DST}/wp-content/uploads/2026/04/sp1-1.png"},
                {"thumb": f"{DST}/wp-content/uploads/2026/04/susan-1.png",      "large": f"{DST}/wp-content/uploads/2026/04/susan1-1.png"},
                {"thumb": f"{DST}/wp-content/uploads/2026/04/littleleaf-1.png", "large": f"{DST}/wp-content/uploads/2026/04/littleleaf1-1.png"},
                {"thumb": f"{DST}/wp-content/uploads/2026/04/ai-1.png",         "large": f"{DST}/wp-content/uploads/2026/04/ai1-1.png"},
                {"thumb": f"{DST}/wp-content/uploads/2026/04/payment-1.png",    "large": f"{DST}/wp-content/uploads/2026/04/payment1-1.png"},
                {"thumb": f"{DST}/wp-content/uploads/2026/04/regulatory-1.png", "large": f"{DST}/wp-content/uploads/2026/04/regulatory1-1.png"},
            ],
        },
    },
    {
        "id": -10, "type": "ProgramTable", "mode": "detached",
        "data": {
            "items": [
                {"icon": f"{DST}/wp-content/uploads/2026/04/Projekt-bez-nazwy-1.png",
                 "theme": "Cristina Dezi - Erotic Circuits", "voices": "Cristina Dezi",
                 "track": "workshop\nPleasure & Wellness", "stage": "Edu Stage\n27.6.2026"},
                {"icon": f"{DST}/wp-content/uploads/2026/04/littleleaf-1.png",
                 "theme": "One Step Ahead: How can we market in an AI-landscape?",
                 "voices": "Kathryn Byberg, Ashton Egner",
                 "track": "panel\nAI", "stage": "Innovation Stage\n28.6.2026"},
                {"icon": f"{DST}/wp-content/uploads/2026/04/Projekt-bez-nazwy-4-1.png",
                 "theme": "AI Personalization & Ownership of the Customer Journey",
                 "voices": "Raquel Shaw",
                 "track": "keynote\nAI, ecommerce", "stage": "Innovation Stage\n28.6.2026"},
                {"icon": f"{DST}/wp-content/uploads/2026/04/Projekt-bez-nazwy-5-1.png",
                 "theme": "SEX MEDIA TRAFFIC: Algorithm Driven Media Impact",
                 "voices": "TBA",
                 "track": "panel\nMedia, Traffic", "stage": "Impact Stage\n28.6.2026"},
                {"icon": f"{DST}/wp-content/uploads/2026/04/Projekt-bez-nazwy-6-1.png",
                 "theme": "How do get payment processing for the adult industry",
                 "voices": "Gerardo Martinez, CSO at PayFasto",
                 "track": "keynote\nPayment", "stage": "Impact Stage\n28.6.2026"},
                {"icon": f"{DST}/wp-content/uploads/2026/04/Projekt-bez-nazwy-7-1.png",
                 "theme": "Hash-Matching Technologies in Platform, Payment, and Data Governance.",
                 "voices": "TBA",
                 "track": "panel\nRegulatory", "stage": "Impact Stage\n28.6.2026"},
            ],
        },
    },
    {
        "id": -11, "type": "SectionTitle", "mode": "detached",
        "data": {
            "title": "Brands that trusted us since 2019",
            "subtitle": "They showed up. It worked.",
            "size": "sm",
        },
    },
    {
        "id": -12, "type": "ImageBlock", "mode": "detached",
        "data": {
            "image": f"{DST}/wp-content/uploads/2026/04/loga-1.png",
            "max_width": "1830px",
            "alt": "Partners & brands that trusted us",
        },
    },
]

seed_dir = Path(__file__).parent.parent / "database" / "seeds"
seed_dir.mkdir(parents=True, exist_ok=True)
seed_file = seed_dir / "exhibitors-b2b.sections.json"
seed_file.write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Seed: {seed_file}")

existing = wp("GET", "/wp-json/wp/v2/pages?slug=exhibitors-b2b&_fields=id")
pid = existing[0]["id"]
wp("POST", f"/wp-json/wp/v2/pages/{pid}", {
    "meta": {"sections_json": json.dumps(sections, ensure_ascii=False)},
})
print(f"WP id={pid}: {len(sections)} modules written (phase 1)")
