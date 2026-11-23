# Deployment

The site is static: build once, upload `dist/`. No server code, database, API key or paid service is required.

```bash
SITE_URL=https://quickpath.example.org npm run build    # SITE_URL optional; enables canonical URLs and sitemap.xml
```

`dist/` contains `_headers` (Netlify, Cloudflare Pages) and `staticwebapp.config.json` (Azure Static Web Apps) with:
- `Content-Security-Policy`: `default-src 'self'`, scripts limited to the site plus a SHA-256 hash of the single inline theme script (generated at build time), no third-party origins, `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling camera, microphone and geolocation

If you edit the inline script in `src/lib/layout.mjs`, rebuild: the hash is recomputed automatically.

## GitHub Pages
GitHub Pages cannot set custom headers; everything else works. A workflow is included at
`.github/workflows/deploy.yml`. In the repository settings choose Pages → Source: GitHub Actions, then push to `main`.
Set the repository variable `SITE_URL` (for example `https://<user>.github.io/<repo>`) to emit the sitemap.

## Cloudflare Pages (planned host, free plan)
Connect the GitHub repository in Workers & Pages. Framework preset: None. Build command `npm run build`, build output directory
`dist`, production branch `main`. Node 22 is pinned by the `.node-version` file. Set the variable `SITE_URL` to the real
address once it is chosen (without it no sitemap and no canonical tags are written, which is the safe default).
`_headers` is applied automatically; `404.html` is served for unknown addresses. The build needs no network access.
Do not set `ADSENSE_CLIENT` until the steps in `MONETIZATION_READINESS.md` are done. Cloudflare runs only the build: run
`npm test` locally before pushing. Not yet tried on Cloudflare; after the first deploy click through nested pages, because
Cloudflare serves `page.html` at `/page`.

### Deploy from GitHub Actions (production, from 2026-11-23)
`.github/workflows/deploy-cloudflare.yml` deploys to the Cloudflare Pages project `aimlquickpath` on every push to `main` (and
by hand from the Actions tab). It builds the site, runs `check:maths`, `check:sims` and `test:static`, then runs
`wrangler pages deploy dist`. The browser tests run in a separate job that reports but does not block the deploy.
One-time setup in GitHub, Settings, Secrets and variables, Actions: secrets `CLOUDFLARE_API_TOKEN` (permission Account, Cloudflare
Pages, Edit) and `CLOUDFLARE_ACCOUNT_ID`, and the variable `SITE_URL` (set it only once that address works). Never commit these values.
A Pages project is either connected to Git in the Cloudflare dashboard or uses direct upload, not both. This workflow needs a
direct-upload project. If `aimlquickpath` is connected to GitHub in the dashboard, Cloudflare already builds on every push to `main`,
and you should use one method only.

## Netlify
Build command `npm run build`, publish directory `dist`. `_headers` is applied automatically.

## Azure Static Web Apps
App location `/`, output location `dist`, build command `npm run build`. Headers and the 404 rewrite come from
`dist/staticwebapp.config.json`.

## Any web server (nginx example)
```nginx
server {
  listen 443 ssl;
  root /var/www/ai-ml-quick-path/dist;
  index index.html;
  error_page 404 /404.html;
  add_header Content-Security-Policy "<copy the value from dist/_headers>" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  location /assets/ { expires 7d; }
}
```

## Offline copy
Zip `dist/` (or use `release/ai-ml-quick-path-dist-*.zip`) and open `index.html` from disk. All links are relative and no
network requests are made. Progress saved from a `file://` page is stored separately from the hosted site's progress.

## Before each release
1. `npm run build && npm run test:static && npm run test:e2e`
2. `npm run test:examples`
3. `npm run extract:code` if you changed any code block in a lesson (refreshes `examples/lesson-code/`)
4. Update `reviewed:` dates in lessons you re-checked

There is no link checker because this edition contains no external links; `npm run test:static` fails the
release if one appears.

## Analytics and privacy
No analytics are included. If you add any, obtain consent where required, update the privacy section in
`src/pages/pages.mjs` (`about()`), and add the analytics origin to the CSP explicitly.

## Optional phase 2 (not built)
Cross-device progress, sign-in and team dashboards need a backend, for example ASP.NET Core with
authentication (Microsoft Entra ID or another OpenID Connect provider), PostgreSQL storing progress records
compatible with the export schema (`aimlqp-progress`, version 1), and a manager dashboard with role-based access
and consent for any learner-level reporting. The static site must keep working without it.

## Google AdSense build (optional, owner plan)

Default build = no ads, nothing external. For the AdSense stages see CLAUDE.md section 9.

1. Approval stage: `SITE_URL=https://your-domain ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX npm run build`, upload `dist/`, then add the site in AdSense and request review. `ads.txt` is written to the site root.
2. After approval, in AdSense Privacy & messaging, publish the consent message for the EEA, UK and Switzerland.
3. Create ad units (rail, end, footer) and build with `ADS_SLOTS=on AD_SLOT_RAIL=... AD_SLOT_END=... AD_SLOT_FOOTER=...`.
4. Check the browser console on the live site: CSP is Report-Only in this build, so violations are reported, not blocked. Move to Google's strict nonce-based policy when the host can add nonces.
5. Set the variables in the host's build settings (not in the repository). Re-run `npm run test:static` with the same variables.
