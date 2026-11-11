# CLAUDE.md — AI & ML Quick Path: From Concepts to Industry

Read this file before making any change. It explains what the product is, who it serves, how the code is
organised, and the rules every change must follow. Also see README.md, DEPLOYMENT.md, CONTENT_SOURCES.md,
QA_REPORT.md and PROJECT_PLAN.md.

---

## 1. Product and business purpose

**What it is:** a free, static learning website that gives someone **new to AI** the quickest complete grip on
AI and machine learning: every main concept explained in plain words, how industry uses it, and working
examples in **both Python and .NET (C#)**, ending with the skills to plan and build real AI/ML systems.

**Audience:** beginners (no AI background) who want to build industry AI/ML applications. They can program a
little, or are learning to. They do not want heavy mathematics, so maths is kept short and practical.

**Three defining rules of this edition (do not break them):**
1. **Maths is applied, short and practical (owner decision 2026-11-05, replaces "no maths").** Where maths or
   statistics applies, the lesson has a collapsible `## Applied Maths - Statistics` section: the main formula,
   a plain-words meaning and at least two worked examples per topic. No derivations or proofs. Never write
   "no maths" claims anywhere. Every worked number must be correct and is labelled as made-up/illustrative.
2. **Self-contained by default: no external links** (owner decision 2026-11-05: the owner may add external reference links later, and exactly one third-party script is allowed, Google AdSense, see section 9; until the owner adds such links the tests stay strict). Nothing on the site may send the learner elsewhere to learn.
   `scripts/build.mjs` fails on any `https?://` link in content, and `tests/static-checks.mjs` fails on any
   external `href`/`src` or any web address in visible text. Only `localhost`/`127.0.0.1` addresses inside code
   samples are allowed. Sources for company cases are shown as title + publisher text; their URLs live only in
   `CONTENT_SOURCES.md` in the repository.
3. **Python and .NET for every lesson.** Every lesson has both a "Python example" and a ".NET (C#) example".

**Sibling projects:** "AI, ML & Language Model Engineering Academy" (for .NET developers, storage key
`aiea.v1`) and "Complete AI Academy" (for CS graduates, with full maths, key `caia.v1`) share this code base.
Keep them separate: this site uses storage key `aimlqp.v1` and export schema `aimlqp-progress`.

**Structure (7 parts, 50 lessons):** 1 The big picture (3), 2 Data (4), 3 Machine learning (9),
4 Deep learning (9), 5 Large language models (8), 6 AI applications (12), 7 Production (5).
Roadmaps: `applied` "Quick path: complete grip" (10 steps), `ml` "ML engineer view" (9), `lm` "AI engineer view" (9).
Capstones: c01-churn, c02-forecast, c03-vision, c04-rag-assistant, c05-agent, c06-tiny-llm, c07-local-assistant, c08-lora-finetune.

**Non-negotiable product principles:**
1. Real teaching content, never placeholders.
2. Honesty: never invent case-study facts, metrics, citations, benchmarks or prices. Never claim code ran if it
   did not. Every number quoted from an example must come from a real run.
3. Plain international English: short sentences, define every term on first use, concrete inputs and outputs.
   No patronising labels ("for dummies", "super easy"). Durations are study estimates; quizzes are self-checks.
4. Privacy: no backend, no sign-in, no analytics, no external fonts or images. No external scripts, except the optional Google AdSense build (section 9), which is OFF unless `ADSENSE_CLIENT` is set.
5. Accessibility: WCAG 2.2 AA in light and dark themes, keyboard operable, no horizontal page scroll 320–1920 px.
6. Layout: use the full screen (sidebar, cards, tables, side rail) while keeping prose lines near 80 characters.

---

## 2. Architecture

A **zero-dependency Node.js static site generator**. Playwright is the only dev dependency (tests).

```
scripts/build.mjs        Loads lessons + data, validates, renders dist/, writes search index, robots.txt,
                         sitemap.xml (only if SITE_URL set), _headers and staticwebapp.config.json (CSP)
scripts/serve.mjs        Local server on port 8080
scripts/run-examples.mjs Runs the Python examples and compiles every .py file under examples/
scripts/extract_lesson_code.py  Copies lesson code blocks into examples/lesson-code/{python,dotnet}/
scripts/package.mjs      Release ZIPs (needs `zip`; Linux/macOS/WSL)
src/lib/markdown.mjs     Markdown-subset renderer, lesson parser and validator (REQUIRED_SECTIONS)
src/lib/layout.mjs       Page shell, sidebar tree (navGroups), SITE config, INLINE_SCRIPT
src/pages/pages.mjs      All non-lesson pages + roadmapComponent()
src/data/curriculum.mjs  MODULES (parts), ROADMAPS, ROUTES, LEVELS, REVIEWED
src/data/cases.mjs       CASES (11), sources without URLs
src/data/projects.mjs    PROJECTS (8 capstones, each with python and dotnet routes)
src/data/reference.mjs   HARDWARE, WORKLOADS, GLOSSARY (166), CHECKPOINTS (7 quizzes)
src/content/lessons/<part>/<id>.md   50 lessons; part folders: start, data, ml, dl, llm, apps, ops
public/assets/app.css    The only stylesheet
public/assets/app.js     The only client script
examples/                Runnable code; examples/quickpath/quickpath.py is the main demo file
tests/static-checks.mjs  HTML checks on dist/ (including zero external links)
tests/e2e.mjs            52 Playwright checks; writes qa/e2e-results.json and qa/screenshots/
```

**Pages (92):** index, plan (12 weeks), roles, roadmaps, lessons (catalogue with filters), solve (decision guide),
maths (maths names map, generated from every lesson's maths section), 7 part pages (`part-1-start.html` …
`part-7-production.html`), 50 lessons, projects + 8 capstones, cases + 11, hardware, glossary, assessment,
progress, about, 404. Output uses **relative links** and works from `file://`.

---

## 3. Commands

```bash
npm run build          # always run after any change; fails on content, link or external-link errors
npm run serve          # preview at http://localhost:8080
npm run test:static    # links, anchors, one h1, heading order, unique ids, placeholders, ZERO external links
npm run test:e2e:edge  # same browser tests in installed Microsoft Edge (use this one on the owner's machine)
npm run test:e2e       # browser tests (first time: npm install && npx playwright install chromium)
npm run test:examples  # needs Python 3.10+ with numpy, pandas, scikit-learn
npm run extract:code   # after editing any code block in a lesson
npm run package        # release ZIPs into release/
```

**Definition of done for every change:** `npm run build`, `npm run test:static` and `npm run test:e2e:edge` pass
(the Playwright Chromium download is blocked on the owner's Windows machine, so browser tests use the installed
Microsoft Edge via `--channel=msedge` or `PW_CHANNEL=msedge`).
**Deployment (standing rule from the owner):** after every requested change, once the checks above pass, run
`powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1` (elevated). It rebuilds the site and mirrors dist/ as plain static files into `D:\AI\GuideApp\deploy`, writes a
`web.config` there (security headers from dist/_headers, the site 404 page) and redeploys the local IIS site "AIGuide"
(http://localhost:8091/, pool "AIGuide"). No exe or server code is used: the deploy folder is a complete static site
that can be uploaded to any static host. Report the smoke test.
**Migration pack (owner request 2026-11-05):** `D:\AI\GuideApp\migration` (beside `deploy`) holds the migration markdown files, `source-snapshot.zip` and `UpdateMigration.exe`, used to continue development on a second machine. The hand-written parts live in `migration-src/*.md`; the generator is `scripts/migration-sync.mjs` and the exe source is `scripts/migration-exe/UpdateMigration.cs`. After a change that affects context, decisions, design, environment or open items, update the matching `migration-src` file and run `D:\AI\GuideApp\migration\UpdateMigration.exe --no-pause` (or `node scripts/migration-sync.mjs`). Never put migration files in `deploy`.
If you changed an example or a quoted output, also run `npm run test:examples` and re-copy the real output.
If you changed lesson code, run `npm run extract:code`. Report actual results; never claim a test passed
without running it. If a test must change because behaviour intentionally changed, say why.

---

## 4. Content model

### 4.1 Lessons (`src/content/lessons/<part>/<id>.md`)

```yaml
---
id: app-rag                    # unique, lowercase, hyphens; file name = id
title: "RAG: answering from your own documents"
module: apps                   # start | data | ml | dl | llm | apps | ops
level: Intermediate            # Beginner | Intermediate | Advanced | Expert
minutes: 90                    # study estimate
goal: One-sentence learning goal.
prereqs: app-embeddings, app-llm-api   # lesson ids (may be empty)
reviewed: 2026-11-02
evidence: What the learner produces to prove completion.
code: Python executed 2026-11-02 (quickpath.py chunking); C# not compiled (no .NET SDK in the build environment)
---
```
Quote titles that contain a colon.

**Required `##` sections, exact titles, in this order** (the build enforces order):
`In plain words` (≥ 50 words), `Real-world example`, `How it works`, `Python example`, `.NET (C#) example`,
`Maths behind it` (a `-` list of names; it feeds maths.html), `Common mistakes`, `Quick check`.

**Optional section `## Applied Maths - Statistics`** sits between the .NET example and `Maths behind it`. One intro sentence,
then 2–4 topics, each `### Topic (plain description)` containing: `**Where it is used:**`, a ```` ```formula Title ```` block
(plain-text formula, no LaTeX), `**In plain words:**`, and two or more `**Example 1: label.**` / `**Example 2: label.**`
worked examples. The build renders each topic as a collapsible `<details class="maths-item">` and enforces the formula and
example counts. Check without building: `node scripts/check-maths.mjs <lesson.md ...>`.

Optional `### Related concepts` at the end of "How it works" covers closely related terms in a few lines each
(14 lessons use it so that no concept is missing).

**Quick check** (2–5 questions):
```
Q: Question text?
A: Answer and explanation.
```

**Markdown supported:** `###`/`####`, paragraphs, `-` and `1.` lists, pipe tables, fenced code with language and
title (```` ```python serve.py (FastAPI; not run here) ````), `` `code` ``, `**bold**`, `*italic*`, callouts
(`> **Note:**`, `> **Warning:**`, `> **Expected output:**`).
Output blocks are ```` ```text Output of quickpath.py <demo> (executed) ````; keep that title format, because a
verification script compares those lines with real runs.

**Internal links only** (the build fails on unknown targets and on any external URL):
`[text](lesson:app-rag)`, `[text](project:c04-rag-assistant)`, `[text](case:klarna)`, `[text](page:solve.html)`.

**Adding a lesson:** create the file, add its id to a group in `MODULES` (curriculum.mjs), optionally to a
roadmap node, add glossary terms if it introduces new ones, then build, test and `npm run extract:code`.

### 4.2 Roadmaps (`ROADMAPS`)
Node fields: `n`, `title`, `short`, `effort` ("X–Y h"; the calendar parses both numbers), `desc`, `lessons[]`,
optional `projects[]`. The overview grid supports 9, 10 or 12 steps (`.steps-9/10/12` in app.css).

### 4.3 Cases (`CASES`)
Fields: `id, company, industry, category, difficulty, tracks[], effort, confirmed, problem, concept,
results[{text, date, caveat}], workflow[], tech[[layer, suggested, alternatives]], example{input, output},
project, acceptance[], risks[], sources[{title, publisher, type}]` — **no `url` field** (add URLs only to
CONTENT_SOURCES.md). `confirmed` and `results` contain only what sources state; `workflow`/`tech` are the
guide's suggested design and are labelled as such on the page.

### 4.4 Capstones (`PROJECTS`)
Fields: `id, n, title, track (applied|ml|lm), level, effort, reuses[], requirement, prereqs[], architecture[],
steps[], python, dotnet, io{input, output}, data, tests[], rubric[], stretch[], security, acceptance[],
structure, evidence`.

### 4.5 Reference data
`HARDWARE` tiers have no prices (not verified). `GLOSSARY` is `[term, definition, lessonId]`.
`CHECKPOINTS` are `{id, title, questions[{q, options[], answer (index), why}]}`, one per part.

### 4.6 Examples
`examples/quickpath/quickpath.py <demo>` backs most lessons (demos: env, rules_vs_ml, lifecycle, data, anomaly,
pca, bpe, bigram, sampling, llm_size, lora, chunking, hybrid, pii, fairness, cache, serving, registry, batching).
Other folders are described in `examples/README.md`. All data is synthetic. API keys only from environment
variables or .NET user secrets.

### 4.7 Diagrams (every lesson has at least 3; one for each concept the lesson introduces)
A fenced block `diagram <type> <title>` renders accessible HTML+CSS (src/lib/diagram.mjs, styles at the end of app.css).
No images, inline styles or scripts. Body lines: `note: caption`, `loop: label`, items `- Label | detail | kind`, groups `## Title | kind`.
Types: flow, loop, layers, compare, nest, matrix (x:, y:, 4 items), lanes, fan, merge, bar (detail = percent).
Kinds: input, process, model, output, store, warn, bad (plain if omitted). Label max 48 chars, detail max 130, 2-8 items.
Diagrams must agree with the lesson text, hold no formulas (formulas live in the Applied Maths section) and no invented numbers (bar percents are illustrative).
Check without building: `node scripts/check-diagrams.mjs [part...]`. `npm run test:static` fails on a lesson with fewer than 3.

---

## 5. Design system and UI rules
- Theme tokens at the top of `public/assets/app.css`; dark values defined **twice** (media query and
  `[data-theme="dark"]`). Never hard-code colours; text contrast ≥ 4.5:1 in both themes (e2e measures it).
- Layout states on `<html>`: `data-theme`, `data-sidebar="hidden"`, `data-focus="on"`. Below 1024 px the sidebar
  is a drawer (scrim, `inert` main, Escape closes, focus returns). Lessons use `.lesson-layout` with a sticky
  `.lesson-rail` at ≥ 1200 px.
- No document-level horizontal scroll; wide content goes in `.table-wrap` or `.stack-on-mobile`.
- Real `<button>`s for actions, `<a>` for navigation, accessible names, visible focus, `aria-expanded` in sync.
- CSP: no inline `style=""` and no new inline `<script>`; JSON data blocks are fine.
- Type and layout (2026-11-04): body 17px (18px from 1680px, 16px under 380px), prose max 76ch. Wide screens: lesson prose sections (In plain words, Real-world example, How it works, Common mistakes) flow into two columns when .lesson-body is 880px or wider, while diagrams, code, tables and headings stay full width BELOW the text (never side by side with text: the owner rejected that), about/assessment/case/capstone pages use two columns (.content.cols, 1500px), plan/roadmap/glossary use 2+ column grids. Card-like list items must override the prose max-width with a `.content`-prefixed rule.
- Report style (2026-11-04, modelled on the owner's AssistBot architecture report): every lesson section is a bordered panel with a numbered blue badge heading (CSS counters), callouts have a coloured left bar, tables have a tinted header and cell borders above 720px, and the lesson facts show Python/C# status as pills (`pill-ok`, `pill-warn`; built by codeStatus() in build.mjs from the `code:` front matter). About, quiz, case and capstone sections use the same panel (`.content.cols`). Not copied from the report: its filter bar, its zoom button and its CDN diagram library (external scripts are not allowed).
- Sidebar group ids must be unique (the "Start here" pages group is `begin`, Part 1 is `start`).

## 6. Client behaviour (app.js)
- Storage key `aimlqp.v1`: `{ version: 1, prefs: { theme, sidebar, focus }, progress: { "<type>:<id>": { done, at } } }`.
  Types: `lesson:`, `project:`, `skill:`. All storage access in try/catch; the site works with storage blocked.
- Export `{ schema: "aimlqp-progress", version: 1, exportedAt, progress }`; import validates schema, version and
  ids, then replaces progress. Reset clears progress only.
- Filters: `.filters[data-filter-target]` with `select[data-filter]` values slugified; cards carry `data-<key>`.
- Roadmaps: tablist, panels `#applied #ml #lm`, deep links `#node-<id>-<n>`.

## 7. How to work on this project
1. Read this file and the relevant sources first; follow existing patterns.
2. Prefer editing content and data files; do not add npm runtime dependencies or frameworks without asking.
3. Build → static checks → e2e after every change. Fix failures rather than weakening tests.
4. New facts about companies: record the source with date in CONTENT_SOURCES.md and show title + publisher on
   the page (never a link). If you cannot verify something, say so in the content.
5. Update QA_REPORT.md and PROJECT_PLAN.md when behaviour changes.
6. Summarise what you changed, the commands you ran and their real results.

**Do not:** add external links (other than those the owner asks for), teach maths, add a backend, analytics or CDNs, put keys in code, invent numbers,
claim untested code works, use root-absolute `/` links, or add inline styles/scripts.

## 8. Known limitations
- C# samples were desk-reviewed but **not compiled** (no .NET SDK in the build environment); five review findings
  were fixed on 2026-11-03. FastAPI, MLflow, PyTorch, LangGraph and similar code is not run and is labelled.
- Browser tests run in Microsoft Edge and Google Chrome (e2e); Firefox was checked by screenshots only (no automated run, Playwright cannot drive stock Firefox); Safari/WebKit is untested. No screen-reader testing yet; no independent subject-matter review.
- Search is simple term matching. The 404 page uses relative links.

---

## 9. Advertising (Google AdSense) - owner decision 2026-11-05

The owner will host the site publicly and earn from Google AdSense. Everything is **off by default**; the default build is the fully self-contained site and all tests keep their strict meaning.

Environment variables read by the build (no values are stored in the repository):
- `ADSENSE_CLIENT=ca-pub-...` : stage 1 (approval). Adds the Google loader script and `google-adsense-account` meta tag to every page, writes `dist/ads.txt`, switches the privacy wording and sends the CSP as `Content-Security-Policy-Report-Only`. **Requires `SITE_URL`**: the build fails without it.
- `ADS_SLOTS=on` plus `AD_SLOT_RAIL`, `AD_SLOT_END`, `AD_SLOT_FOOTER` (numeric ad unit ids) : stage 2 (ads visible). A slot with no id is not rendered.
- `CONTACT_EMAIL` : optional; adds a contact line to `privacy.html`.

Slots (`adSlot()` in `src/lib/layout.mjs`): `rail` (bottom of the lesson side rail), `end` (after the lesson completion panel), `footer` (lessons.html, glossary, cases, projects, hardware, solve, maths and part pages). Each is a fixed-height box labelled "Advertisement", hidden in print and in focus mode. **Never** place ads inside lesson text, diagrams, code, quizzes, near buttons, or on the home, progress, about, privacy and 404 pages. Not more than 2 ads per lesson page.

Rules: do not put publisher or ad unit ids in the repository. Do not add inline scripts for ads (the `push({})` call lives in `public/assets/app.js`). Google supports only a strict nonce-based CSP; a static host cannot add nonces, so the ads build uses Report-Only CSP until a host that can add nonces is chosen. The consent message for the EEA, UK and Switzerland must be set up inside the AdSense account (Privacy & messaging); no consent code is in this repository.
`npm run test:static` allows only the Google loader URL, and only when `ADSENSE_CLIENT` is set (and the site's own `SITE_URL` for canonical tags). `npm run test:e2e` is meant for the default build: its "no external resources" check fails on an ads build by design.
