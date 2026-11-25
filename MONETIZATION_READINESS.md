# Monetization readiness (Google AdSense): prepared, switched off

Status on 2026-11-13: **no advertising is active.** The default build contains no ad script, no ad slot and no ad markup
(checked: 0 of 92 pages contain `adsbygoogle`, `googlesyndication` or `ad-slot`). Nothing in this file has been tested
against the real AdSense service. Policy statements below are from memory of Google's published rules and were **not re-read
on this date**; re-read the official pages listed at the end before any activation.

## 1. How the switch works (already in the repository)

Everything is driven by environment variables at build time. No id is stored in the repository.

| Variable | Effect |
|---|---|
| none | Default build: no ads, strict Content-Security-Policy, no outside scripts |
| `ADSENSE_CLIENT=ca-pub-...` with `SITE_URL` | Stage 1 (review): Google loader script and account meta tag on every page, `ads.txt`, advertising wording on the privacy page, CSP sent as Report-Only |
| plus `ADS_SLOTS=on` and `AD_SLOT_RAIL`, `AD_SLOT_END`, `AD_SLOT_FOOTER` | Stage 2: the three slot types render. A slot with no id is not rendered, so there are never empty ad boxes |
| `CONTACT_EMAIL` | Adds a contact line to the privacy page |

The build stops with an error if `ADSENSE_CLIENT` is set without `SITE_URL`, or if an id has the wrong shape.

**One-step rollback:** remove `ADSENSE_CLIENT` from the host's build variables and redeploy. The next build is the plain site
with the strict CSP. No code change is needed.

## 2. Where ads may and may not appear

| Page type | Ads allowed later? | Slot |
|---|---|---|
| Lesson pages | Yes, at most 2: bottom of the side panel, and after the completion box | `rail`, `end` |
| Glossary, hardware, each case page, each capstone page | Yes, one at the page foot | `footer` |
| Catalogue, part pages, case and capstone index pages, solve guide, maths map, cheat sheets | No (navigation or short pages) | none |
| Home, progress, about, privacy, 404 | No | none |
| Inside lesson text, maths moments, calculators, diagrams, code, quizzes, roadmap controls, next and previous links | Never | none |

Each slot is a labelled box ("Advertisement") with reserved height, hidden in print and in focus mode. Auto Ads are not
used: they place ads automatically and could land inside teaching content.

## Update 2026-11-25 (checked against Google's help pages on that date)

- Privacy page (advertising build): states that third-party vendors including Google use cookies, links Google Ads Settings and
  aboutads.info, and links Google's information on advertising partners. Review which partners are enabled in your AdSense
  account; if you enable vendors outside Google's list, name and link them.
- The landing page no longer says "no tracking" in an advertising build.
- A "Contact" link appears in the footers and a contact section on the About page when `CONTACT_EMAIL` is set.
- Footer ad slots are limited to content pages (section 2).
- `npm run test:static` run with the advertising variables set checks these points.
- Still yours: age and account details, a review of the lesson text, the consent message in the AdSense account, Auto Ads off.

## 3. Before applying (quality gates)

- [ ] A real domain is chosen and set as `SITE_URL`. A free `pages.dev` address may not be accepted; this was not confirmed either way.
- [ ] The site has been public long enough to have real visitors. No traffic number guarantees approval.
- [ ] About, privacy and contact information are real. Set `CONTACT_EMAIL`; do not invent an address.
- [ ] Open items in `IMPLEMENTATION_PROGRESS.md` that affect content quality are closed (lesson review, case re-verification).
- [ ] `npm test` passes on the default build.

## 4. Before switching ads on (after approval)

- [ ] **Consent.** For visitors in the EEA, the UK and Switzerland, Google requires a consent message from a certified
      consent platform. Set it up inside the AdSense account ("Privacy & messaging"). This repository contains no consent code.
      Core lessons must stay readable whatever the visitor chooses.
- [ ] **`ads.txt`.** The build writes it from the publisher id. Compare it with the line Google shows in the account before deploying.
- [ ] **Content-Security-Policy.** The ads build sends the policy as Report-Only, which reports problems and blocks nothing.
      That is a real security step down from the default build. Options, to be decided when the host is chosen: (a) keep
      Report-Only and accept it; (b) use a host function that adds a per-request nonce so a strict policy can stay enforced.
      Test either on a staging address first and read the browser console for policy reports.
- [ ] **Layout.** Check on a phone and a desktop that slots do not push content around while loading and never sit next to buttons.
- [ ] **Tests.** `npm run test:static` with the ads variables set must pass. `npm run test:e2e` is written for the default build and
      fails by design on an ads build; add an ads-build e2e check once real ids exist.
- [ ] **Privacy page.** Read the generated advertising section and confirm it matches what the account actually does.

## 5. Rules that do not change

Never ask visitors to click ads, never place ads so they can be mistaken for navigation, never promise earnings, never put
publisher or ad unit ids in the repository.

## 6. Official pages to re-read before activation (not re-checked on 2026-11-13)

Google Search "Creating helpful, reliable, people-first content"; Google SEO Starter Guide; AdSense "Best practices for ad
placement"; AdSense "Ad placement policies"; AdSense consent requirements for publishers; W3C WCAG 2.2. Their addresses are in
section 7 of the V2 specification file in this repository.
