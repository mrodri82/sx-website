# SX Festival & Expo 2026 — Nova CMS Instance

Site for **sxtech.eu / sxfestival.com** (hosted under **sx.zds.es** until domain cutover).
A 1:1 visual clone of the live sxtech.eu (Elementor), rebuilt on Nova CMS so it can be
edited with our live editor, served by Astro SSR, and cloned further.

## Why this repo is separate

sx-website is forked from the zds-website codebase but **decoupled** and owned by SX:
- Own Git repo: `github.com/mrodri82/sx-website`
- Own server deploy: `/var/www/sx-astro` on `89.167.47.53`
- Own WordPress: `sx.zds.es/wp-admin` (DB `sx_website`, user `sx_wp`)
- Own theme: black/yellow, Inter font, uppercase bold (not ZDS navy/blue)
- Own Nav/Footer: short menu (Regular Visitors / Exhibitors & B2B / Creators / Program / News / TICKETS)

The entire ZDS menu tree (Servicios, Sectores, Insights, Glosario, …) is gone.
zds.es and sx-website share **no** live code — changes here do not affect zds.es.

## Architecture

```
Browser ──► nginx on 89.167.47.53
             ├─ /wp-admin, /wp-login.php, /wp-json  → PHP-FPM 8.3 + WP
             └─ /*                                   → Astro SSR :4323
```

- **WordPress** headless on same host; editor-facing only
- **Astro SSR** renders every page; fetches `sections_json` from WP post meta
- `/etc/hosts` maps `sx.zds.es → 127.0.0.1` so Node `fetch` can hit WP locally with the
  right Host header (Node undici strips manual `Host`, so we make DNS say localhost)
- nginx location `~ ^/index\.php(/|$)` forwards path-info to PHP-FPM
  (needed because our `wordpress.ts` calls `/index.php/?rest_route=…`)

## Files that matter (start here)

- `src/config/site.ts` — all branding, address, CMS config (reads `.env`)
- `src/styles/global.css` — black/yellow palette, Inter font, `sx-btn`, `sx-heading`
- `src/layouts/BaseLayout.astro` — meta, schema.org Event, admin bar injection
- `src/components/Navigation.astro` — top nav + mobile menu (SX-specific)
- `src/components/Footer.astro` — dark footer with contact form + imprint
- `src/components/modules/*.astro` — shared Nova modules (Hero, etc.)
- `src/components/modules/ModuleRenderer.astro` — maps `component` → Astro component
- `src/pages/index.astro` — homepage (fetches `homepage` WP page)
- `src/pages/[...slug].astro` — catches all other routes (inc. wp-admin proxy)
- `src/pages/admin/live/[...slug].astro` — Nova Live Editor
- `src/lib/wordpress.ts` — WP REST client (uses `site.cmsHost`)

## Deploy

Source of truth: `main` branch.
Deploy target: `/var/www/sx-astro` on `89.167.47.53`.

```bash
# from laptop
git push origin main
ssh root@89.167.47.53 "cd /var/www/sx-astro && git pull origin main && npm run build && systemctl restart sx-website"
```

Restart + log tail:
```bash
systemctl restart sx-website
journalctl -u sx-website -f
```

## WordPress

- Admin: https://sx.zds.es/wp-admin/
- User: `manuel` (App-Password lives in `/var/www/sx-astro/.env`)
- DB: `sx_website` @ MariaDB, user `sx_wp` (NICHT root — PHP-FPM hätte sonst socket-auth-Issues)
- Must-use plugins: `zds-modules` (copied from zds repo — CPT + meta registration + CORS)

## Design language — match sxtech.eu

- Background: pure black `#000` (`--color-bg-base`)
- Accent: bright yellow `#eeee22` (`--color-brand-500`)
- Text: white with opacity tiers (`text-white/70`, `text-white/40` …)
- Typography: **Inter** at 400 / 500 / 700 / 900; heavy uppercase with tight tracking
- Shapes: sharp corners (no rounded-xl), rectangular cards, editorial grid
- Buttons: `sx-btn` class — yellow fill, black text, uppercase, small padding
- No gradients, no grain, no glass — pure flat editorial

## Module-build workflow (matches an existing sxtech.eu section)

1. Screenshot the target section from sxtech.eu: `node .tmp/screenshot-one.mjs <url>`
2. Note the sxtech HTML structure: `curl <url> | grep -A2 elementor-element`
3. Create / adapt a Nova module in `src/components/modules/<Name>.astro`
4. Register in `src/lib/editor/module-registry.ts` + `ModuleRenderer.astro`
5. Run `npm run build` locally — check no TS / Astro errors
6. Create a test WP page with only that section — confirm fidelity
7. Iterate until the Playwright diff screenshot matches within ~5%

## What NOT to do

- Never import from zds-website — this repo is self-contained
- Never change the `cms.zds.es`-style host header scheme; nginx routing depends on it
- Never commit `.env` (use `.env.example`); server has its own `/var/www/sx-astro/.env`
- Never neutralize the `@theme` palette without also updating every component that uses
  `bg-brand-500` / `text-navy-300` etc. — they expect concrete colors
