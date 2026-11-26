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

## Search titles and descriptions
`src/data/seo.mjs` holds the title and description used in search results where a page's own are weak or too long. Page
headings do not change. Lessons without an entry use their title and goal. `npm run test:static` fails on a title over
60 characters, a description outside 50 to 160 characters, or a title or description used by two pages. Say only what the
page really contains.

## Links inside the site
In a clean-address build (Cloudflare, or `CLEAN_URLS=on`) every internal link, and the search index, names the clean
address, so no click or crawl goes through a redirect. Other builds keep `.html`, so the site works from a local file.
`npm run serve` serves both forms. A few links that the script creates for returning learners ("Continue learning") still
use `.html` and are redirected by the host; search crawlers do not see them.

## Featured lessons
The home page links six lessons chosen by hand (`FEATURED` in `src/pages/pages.mjs`). They are not called popular, because
the site does not measure what is read.

## Front matter
`updated: YYYY-MM-DD` (optional) is the date a lesson's content last changed in a real way. It must not be earlier than `reviewed`.
Set it when you change a lesson; do not use it for a subject review (that is `reviewed`).

## Owner checks in the dashboards (not code)
- Cloudflare, AI Crawl Control: make sure the AI crawlers you want citations from are allowed. Cloudflare can block them by default.
- Google Search Console: sitemap status, then the Pages report after a week.
- No analytics script is used on purpose. Use Search Console and Cloudflare's own traffic charts.

## Left out on purpose
- FAQ structured data: Google shows FAQ results only for a few site types, so it would add nothing.
