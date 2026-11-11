# 02 - Architecture and workflow

(Last synced {{STAMP}}. The project root also has CLAUDE.md, which is the authoritative rule file; read it first.)

## What it is technically

A **zero-dependency Node.js static site generator** (Node 18+, developed on Node 22). Playwright is the only dev dependency (browser tests). No framework, no bundler, no runtime dependency. Output is plain HTML/CSS/JS in `dist/` with **relative links**, so it works from `file://` and on any static host.

## Repository layout

```
scripts/build.mjs          Loads lessons + data, validates, renders dist/, writes the search index, robots.txt,
                           sitemap.xml (only if SITE_URL is set), _headers and staticwebapp.config.json (CSP)
scripts/serve.mjs          Local server on port 8080
scripts/deploy.ps1         Windows/IIS deploy (build, mirror dist to the deploy folder, web.config, site, smoke test)
scripts/check-diagrams.mjs Validate diagram blocks without building:   node scripts/check-diagrams.mjs [part...]
scripts/check-maths.mjs    Validate lessons incl. Applied Maths section: node scripts/check-maths.mjs <file.md ...>
scripts/migration-sync.mjs Regenerates the migration pack (this folder)
scripts/run-examples.mjs   Runs the Python examples and compiles every .py under examples/ (needs Python)
scripts/extract_lesson_code.py  Copies lesson code blocks into examples/lesson-code/ (needs Python)
scripts/package.mjs        Release ZIPs (needs `zip`; Linux/macOS/WSL)
src/lib/markdown.mjs       Markdown-subset renderer, lesson parser and validator (REQUIRED_SECTIONS, APPLIED_MATHS)
src/lib/diagram.mjs        Renders ```diagram blocks to accessible HTML+CSS
src/lib/layout.mjs         Page shell, sidebar tree (navGroups), SITE config, inline theme script
src/pages/pages.mjs        All non-lesson pages (home, plan, roles, roadmaps, catalogue, solve, maths map, part pages,
                           projects, cases, hardware, glossary, assessment, progress, about, 404)
src/data/curriculum.mjs    MODULES (parts and groups), ROADMAPS, ROUTES, LEVELS, REVIEWED
src/data/cases.mjs         CASES (company cases, sources without URLs)
src/data/projects.mjs      PROJECTS (capstones, each with python and dotnet routes)
src/data/reference.mjs     HARDWARE, WORKLOADS, GLOSSARY, CHECKPOINTS (quizzes)
src/content/lessons/<part>/<id>.md   Lessons; part folders: start, data, ml, dl, llm, apps, ops
public/assets/app.css      The only stylesheet     public/assets/app.js   The only client script
examples/                  Runnable code (examples/quickpath/quickpath.py is the main demo file; others in examples/README.md)
tests/static-checks.mjs    HTML checks on dist/ (links, anchors, one h1, heading order, unique ids, zero external links,
                           at least 3 diagrams per lesson, diagram captions)
tests/e2e.mjs              Playwright browser checks (52); writes qa/e2e-results.json and qa/screenshots/
migration-src/             Hand-written sources of this migration pack
```

## Commands

```
npm install                       first time on a new machine
npm run build                     always run after any change; fails on content, link or external-link errors
npm run serve                     preview at http://localhost:8080
npm run test:static               links, anchors, headings, ids, placeholders, ZERO external links
npm run test:e2e:edge             browser tests in installed Microsoft Edge (Windows owner machine)
npm run test:e2e                  browser tests in Playwright Chromium (new machine: npx playwright install chromium first)
node tests/e2e.mjs --channel=chrome   same tests in installed Google Chrome
npm run test:examples             runs Python examples (needs Python 3.10+, numpy, pandas, scikit-learn)
npm run extract:code              after editing any lesson code block (needs Python)
```

Always run `npm run build` BEFORE `test:static`: the static test reads dist/ and a stale or empty dist gives false results.

## Lesson content model

File `src/content/lessons/<part>/<id>.md`, front matter keys: id, title (quote it if it has a colon), module (start|data|ml|dl|llm|apps|ops), level (Beginner|Intermediate|Advanced|Expert), minutes, goal, prereqs (comma-separated lesson ids), reviewed (date), evidence, code (status text, parts separated by `;`, each shown as a pill: text before `(` is the label, the parenthesised text is the detail; labels containing "not run/compiled/executed" are coloured as warnings).

Required `##` sections, in this exact order (build enforces): In plain words (at least 50 words), Real-world example, How it works, Python example, .NET (C#) example, **[optional] Applied Maths - Statistics**, Maths behind it, Common mistakes, Quick check.

- `### Related concepts` may close "How it works"; closely related terms go there as `- **Term**` bullets or `####` sections.
- **Applied Maths - Statistics** (between the .NET example and "Maths behind it"): one intro sentence, then topics. Each topic is `### Topic (plain description)` with `**Where it is used:**`, a ```` ```formula Title ```` block (plain-text formula, no LaTeX), `**In plain words:**`, and at least two `**Example 1: label.**` / `**Example 2: label.**` worked examples. The build renders every topic as a collapsible `<details class="maths-item">` and fails if a topic has no formula block or fewer than two examples. Worked numbers are small, made-up and must be recomputed (a node one-liner is enough).
- **Quick check:** 2 to 5 `Q:` / `A:` pairs.
- Extra code for techniques goes under `### More techniques in Python: X` at the end of the Python section and `### More techniques in C#: X` at the end of the .NET section (the two headings must differ, otherwise ids collide and the static check fails). Mark untested code in the fence title: ```` ```python name.py (not run here) ```` and never add an "Output of" block for code that was not run.
- Output blocks of real runs use the exact title format ```` ```text Output of quickpath.py <demo> (executed) ````.
- Internal links only: `[text](lesson:app-rag)`, `[text](project:c04-rag-assistant)`, `[text](case:klarna)`, `[text](page:solve.html)`.
- Diagrams: fenced ```` ```diagram <type> <title> ```` blocks. Types flow, loop, layers, compare, nest, matrix (needs `x:` and `y:` lines with `a | b` and exactly 4 items, row by row), lanes, fan, merge, bar. Kinds: input, process, model, output, store, warn, bad. Label up to 48 chars, detail up to 130, 2 to 8 items. No formulas and no invented numbers in diagrams. Every lesson needs at least 3.
- **Pitfall:** the lesson parser splits sections at lines that start with `## `. Inside diagram blocks the parser is fence-aware, but keep `## ` lines out of formula/code blocks anyway.

## Adding things

- **New lesson:** create the file, add its id to a group in `MODULES` (curriculum.mjs), optionally to a roadmap node, add glossary terms, update counts hard-coded in tests (`tests/e2e.mjs` catalogue test expects the lesson total) and docs (CLAUDE.md, README.md), then build and test. Run `npm run extract:code` when Python is available.
- **New capstone:** add an object to `PROJECTS` (fields listed in CLAUDE.md 4.4), add it to a roadmap node `projects[]`, update the e2e capstone filter test (total and language-model count) and docs.
- **New case:** add to `CASES` (no `url` field; record sources in CONTENT_SOURCES.md).
- **New glossary term:** `[term, definition, lessonId]` in `GLOSSARY` (the e2e test requires the "drift" search to match 2 to 4 terms).

## Client behaviour (public/assets/app.js)

Storage key `aimlqp.v1`: `{ version: 1, prefs: { theme, sidebar, focus }, progress: { "<type>:<id>": { done, at } } }` with types `lesson:`, `project:`, `skill:`. All storage access is in try/catch; the site works with storage blocked. Export/import uses schema `aimlqp-progress` version 1. Filters use `.filters[data-filter-target]` with `select[data-filter]`. Roadmaps use a tablist with deep links `#node-<id>-<n>`. A generic `[data-expand-all]` / `[data-collapse-all]` handler opens or closes `<details>` inside a target element (used by quizzes and maths panels). Header search is simple term matching over `assets/search-index.js`.

## Security headers (CSP)

`dist/_headers` and `dist/staticwebapp.config.json` carry the content security policy: no inline `style=""`, no inline scripts (except the JSON data blocks and the pre-hashed theme script), no external origins. Netlify and Cloudflare Pages read `_headers`; Azure Static Web Apps reads `staticwebapp.config.json`; IIS gets them from the generated `web.config`.
