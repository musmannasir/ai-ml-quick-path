# SEO and GEO (search and AI-answer visibility)

Status 2026-11-23. Honest summary: these steps make the site easy for search engines and AI tools to read and
describe. Nobody can promise rankings or citations; links from other sites, mentions and time matter most.

## What the build does (needs `SITE_URL`; Cloudflare builds also set clean addresses)
- Canonical tag and `og:url` on every page; clean addresses (no `.html`) on Cloudflare (`WORKERS_CI`, `CF_PAGES` or `CLEAN_URLS=on`).
- `sitemap.xml` with a real `lastmod` per page: a lesson uses its `updated` front matter date, otherwise `reviewed`; other pages use the newest lesson date.
- Structured data (JSON-LD, schema.org, a data block that the strict CSP does not touch): `WebSite` on the home page,
  `BreadcrumbList` on pages with breadcrumbs, `LearningResource` on every lesson.
- Social sharing: `og:image` (`public/assets/og-image.png`, 1200 x 630, made by `scripts/make-og-image.mjs`), `twitter:card` and the matching title and description.
- Titles: the brand suffix is added only when the whole title fits in 60 characters.
- `llms.txt`: a plain list of the main pages and every lesson with its goal, for AI tools. An optional convention whose benefit is unproven.
- `robots.txt` allows all crawlers and names the sitemap.
- `npm run test:static` (with `SITE_URL` set) checks the JSON-LD, the image tags, title length, sitemap dates and `llms.txt`.

## Front matter
`updated: YYYY-MM-DD` (optional) is the date a lesson's content last changed in a real way. It must not be earlier than `reviewed`.
Set it when you change a lesson; do not use it for a subject review (that is `reviewed`).

## Owner checks in the dashboards (not code)
- Cloudflare, AI Crawl Control: make sure the AI crawlers you want citations from are allowed. Cloudflare can block them by default.
- Google Search Console: sitemap status, then the Pages report after a week.
- No analytics script is used on purpose. Use Search Console and Cloudflare's own traffic charts.

## Left out on purpose
- `.html` links in the pages are kept, because the site must also work from a local file. Cloudflare redirects them to the clean address.
- FAQ structured data: Google shows FAQ results only for a few site types, so it would add nothing.
