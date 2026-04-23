"""One-shot cleanup: remove every media file that was uploaded by the
previous blog-post migration so the next run re-fetches the originals
and writes them back out as webp at a sensible size/quality."""
import base64, json, ssl, urllib.request

DST = "https://sx.zds.es"
USER = "manuel"
PW = "rrLJNonWxaLRgzkJEnbzhkQh"

ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

def wp(method, path, body=None):
    req = urllib.request.Request(f"{DST}{path}", method=method)
    req.add_header("Authorization", f"Basic {base64.b64encode(f'{USER}:{PW}'.encode()).decode()}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(body).encode()
    else:
        data = None
    with urllib.request.urlopen(req, data=data, context=ctx, timeout=60) as r:
        return json.loads(r.read()) if r.length != 0 else {}

# Slugs that the previous migration round produced. Each plus its WP-
# generated thumbnails. Using slug-based lookup because IDs may differ.
ORIGINAL_SLUGS = [
    # explicit heroes and inline images we mirrored
    '2312-1', '7w-1', '4w-1', '4w', '5w', '6w', '1-3-2', '2w', '3w',
    'nowlive-1', '1-2', '22222', '3333', 'irma-1', 'irma', 'irma2', 'irma3',
    'nonm-1', 'ph2', 'ph2-2', 'ph4', 'ph31', 'ph32', 'ph31-1',
    'sxt-1', 'sxt1', 'sxt12', 'sxt',
    'projekt-bez-nazwy', 'projekt-bez-nazwy-2',
    'projekt-bez-nazwy-4', 'projekt-bez-nazwy-5',
    'projekt-bez-nazwy-6', 'projekt-bez-nazwy-7',
]

deleted = 0
for slug in ORIGINAL_SLUGS:
    matches = wp("GET", f"/wp-json/wp/v2/media?slug={slug}&_fields=id,source_url")
    for m in matches or []:
        try:
            wp("DELETE", f"/wp-json/wp/v2/media/{m['id']}?force=true")
            print(f"  deleted #{m['id']:>5}  {m['source_url'].rsplit('/',1)[-1]}")
            deleted += 1
        except Exception as e:
            print(f"  delete #{m['id']} failed: {e}")
print(f"\nTotal deleted: {deleted}")
