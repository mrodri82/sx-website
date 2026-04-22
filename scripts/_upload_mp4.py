"""One-shot upload of exhibitors-b2b hero video to sx.zds.es WP media."""
import base64, hashlib, json, ssl, urllib.request
from pathlib import Path

DST = "https://sx.zds.es"
USER = "manuel"
PW = "rrLJNonWxaLRgzkJEnbzhkQh"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

src = Path(__file__).parent.parent / ".tmp" / "elementor-import" / "assets" / "mp4.mp4"
boundary = "----NovaImporter" + hashlib.md5(b"mp4").hexdigest()
parts = [
    f"--{boundary}\r\n".encode(),
    b'Content-Disposition: form-data; name="file"; filename="hero-exhibitors.mp4"\r\n',
    b"Content-Type: video/mp4\r\n\r\n",
    src.read_bytes(),
    f"\r\n--{boundary}--\r\n".encode(),
]
body = b"".join(parts)

req = urllib.request.Request(f"{DST}/wp-json/wp/v2/media", method="POST", data=body)
req.add_header("Authorization", f"Basic {base64.b64encode(f'{USER}:{PW}'.encode()).decode()}")
req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
with urllib.request.urlopen(req, context=ctx, timeout=300) as r:
    out = json.loads(r.read())
print(out.get("source_url"))
