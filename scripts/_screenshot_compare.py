"""Screenshot both sxtech.eu and sx.zds.es for each page (desktop + mobile)
and save them side-by-side for visual diff."""
from pathlib import Path
from playwright.sync_api import sync_playwright

PAGES = [
    ("home",             "/",                  "/"),
    ("regular-visitors", "/regular-visitors/", "/regular-visitors"),
    ("exhibitors-b2b",   "/exhibitors-b2b/",   "/exhibitors-b2b"),
    ("creators",         "/creators/",         "/creators"),
    ("program",          "/program/",          "/program"),
    ("news",             "/news/",             "/news"),
]

OUT = Path(__file__).parent.parent / ".tmp" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)

def shoot(browser, url, path, viewport):
    ctx = browser.new_context(viewport=viewport, ignore_https_errors=True)
    page = ctx.new_page()
    try:
        page.goto(url, wait_until="networkidle", timeout=45000)
    except Exception:
        page.goto(url, wait_until="load", timeout=45000)
    page.wait_for_timeout(1500)  # let fonts/videos settle
    page.screenshot(path=str(path), full_page=True)
    ctx.close()
    print(f"  {path.name}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for slug, sx_path, ours_path in PAGES:
        print(f"\n{slug}")
        for vp_name, vp in (("desktop", {"width":1440,"height":900}),
                            ("mobile",  {"width":390,"height":844})):
            shoot(browser, f"https://sxtech.eu{sx_path}",  OUT / f"{slug}_{vp_name}_sxtech.png", vp)
            shoot(browser, f"https://sx.zds.es{ours_path}", OUT / f"{slug}_{vp_name}_ours.png",   vp)
    browser.close()
print("\nDone.")
