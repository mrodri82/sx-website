"""Audit every migrated post: how many images sit inside .sx-ac-body vs.
inside the <aside class="sx-ac-side">, plus whether there's stray markup
between the two that could leak content out of main into aside."""
import re, ssl, urllib.request
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

SLUGS = [
    'post-marius-rohde-interview', 'post-sx-festival-artist-grant',
    'post-sxma-vote-04-08-05-08', 'post-sxma-nominations-live',
    'post-hacking-desire', 'post-ambassador-program-live',
    'post-artists-apply-today', 'post-sxma-awards-nominate',
]

def get(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, context=ctx, timeout=30).read().decode('utf-8', errors='replace')

def body_slice(h: str):
    m = re.search(r'<div class="sx-ac-body"[^>]*>', h)
    if not m: return None
    pos = m.end(); depth = 1; end = len(h)
    for mm in re.finditer(r'<(/?)div\b[^>]*>', h[pos:]):
        if mm.group(1) == '/':
            depth -= 1
            if depth == 0: end = pos + mm.end(); break
        else:
            depth += 1
    return h[m.end():end]

def aside_slice(h: str):
    m = re.search(r'<aside class="sx-ac-side"[^>]*>', h)
    if not m: return None
    pos = m.end(); depth = 1; end = len(h)
    combined = re.compile(r'<(/?)(aside|div)\b[^>]*>', re.I)
    for mm in combined.finditer(h[pos:]):
        if mm.group(1) == '/':
            depth -= 1
            if depth == 0: end = pos + mm.end(); break
        else:
            depth += 1
    return h[m.end():end]

for slug in SLUGS:
    h = get(f'https://sx.zds.es/{slug}')
    body = body_slice(h) or ''
    side = aside_slice(h) or ''
    # count img tags (excluding logo/nav)
    body_imgs = len(re.findall(r'<img\b', body))
    side_imgs = len(re.findall(r'<img\b', side))
    # also count text-editor para tags in each
    body_paras = len(re.findall(r'<p\b', body))
    side_paras = len(re.findall(r'<p\b', side))
    print(f'  {slug:38s} body(imgs={body_imgs}, p={body_paras}) side(imgs={side_imgs}, p={side_paras})')
