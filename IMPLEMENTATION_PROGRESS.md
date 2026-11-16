# Implementation progress: 2026-11 upgrade (V2 specification)

Branch `upgrade/v2-2026-11`. Last updated 2026-11-13. Nothing here is deployed or pushed.
Specification: `CLAUDE_FABLE_AI_ML_QUICK_PATH_UPGRADE_PROMPT_V2.md`. Baseline: `docs/audits/BASELINE_2026_UPGRADE.md`.

**Honest summary.** Stages 0 and 1 are complete. Stages 2, 3, 4 and 6 are partly done: the foundations and the
highest-value pieces are in and tested, but each still has open work listed below. Stage 5 (capstones, case depth, hardware) is
not started apart from the case source links. The site builds and all automated checks pass.

## Latest real results (2026-11-13, this machine)

| Command | Result |
|---|---|
| `npm run build` | 92 pages (50 lessons, 8 capstones, 11 case studies) |
| `npm run check:maths` | 52 maths moments, 118 applied-maths topics, 697 calculations checked, 0 problems |
| `npm run test:static` | 92 pages, 9,761 internal links, 97 outside reference links to 59 registered sources, 0 unregistered. Passed |
| `npm run test:e2e` | 59 of 59 checks passed (Playwright Chromium) |
| `npm run test:examples` | 14 runs, 0 failures |
| `npm run verify:code` | C#: 58 of 58 lesson samples compiled (.NET SDK 10.0.400), covering all 50 lessons. Python: 14 of 14 example programmes ran; of 51 lesson blocks, 9 ran on their own, 41 passed a syntax check only, 1 is a fragment |
| `npm run check:links` | 61 sources: 55 confirmed, 1 moved, 5 refused the automated check |
| Ads build (fake test ids) | builds; static checks pass; default build has no ad markup in any page |

Not run: Microsoft Edge, Firefox, Safari, real phones, a screen reader, Lighthouse.

## Stage log

| Stage | Work actually completed | Files modified | Commands run / result | Evidence | Known limitations | Next actions |
|---|---|---|---|---|---|---|
| 0 Audit and baseline | Tools, baseline tests, inventory, 20 findings mapped to files and tests | `docs/audits/BASELINE_2026_UPGRADE.md`, `docs/audits/before/` | build, static, e2e (52/52), examples (2 failures found) | 21 "before" screenshots | No Lighthouse baseline | none |
| 1 Correctness and continuity | Single-source theme tokens; three layered panel style blocks merged into one; stale wording fixed; vetted outside-link register, checker and policy tests; data version 2 with migration | `src/design/tokens.mjs`, `public/assets/app.css`, `src/data/sources.mjs`, `scripts/check-links.mjs`, `tests/static-checks.mjs`, `public/assets/app.js`, `README.md`, `src/pages/pages.mjs`, `src/lib/layout.mjs` | build, static, e2e | e2e migration check; link status file | 6 of 61 links not confirmed automatically (shown as "review needed" on the page) | a person opens the 6 links |
| 2 Flagship journey and design system | Single reading column; new lesson header (position, level, time, maths level, real code status, prerequisites); code language switch; home start chooser and resume; maths moment component with 8 calculators | `scripts/build.mjs`, `src/lib/maths.mjs`, `public/assets/app.css`, `public/assets/app.js`, `src/data/curriculum.mjs` | e2e 59/59 | `qa/screenshots/lesson-maths-*`, `home-*`, `mm-*` | The beginner to core ML journey (Parts 1 to 3) has the new pieces, but its lesson prose was not rewritten; no usability test with people | review Parts 1 to 3 prose section by section |
| 3 Maths at the point of need | 52 maths moments across 48 lessons, each with hand steps checked by the build, a tie-back to AI and a "try one change"; all 7 benchmark examples from the specification included; Maths map indexes them; maths level set per lesson; 453 older calculations scanned | 48 lesson files, `src/lib/maths.mjs`, `scripts/check-maths.mjs`, `src/pages/pages.mjs` | check:maths 697 checked, 0 problems | Maths map page; e2e calculator checks | The 118 older Applied Maths topics were verified but NOT rewritten into step-per-line form and not pruned for repetition; maths-moment placement is at the end of a section, not hand-tuned inside it; no independent maths review | restyle or trim the older topics; move moments next to the exact sentence that needs them |
| 4 Executable code and depth | Verification harness; all C# samples compile (8 repaired, one for a real API rename); Windows encoding fix for the Python runner; status pills generated from the record; stale "no .NET SDK" notes removed from 50 lessons | `scripts/verify-code.mjs`, `scripts/run-examples.mjs`, `scripts/extract_lesson_code.py`, 7 lesson files, `qa/code-status.json`, `examples/lesson-code/` | verify:code 58/58 compiled | `qa/code-status.json` | Compiled is not run: no C# sample was executed; PyTorch, FastAPI, MLflow, LangGraph and model calls were not run (not installed, no key, no GPU); 41 Python blocks are excerpts checked for syntax only; no curriculum-depth additions, no new prerequisite lessons | run the C# samples that need no model or data; install torch on a machine that has it |
| 5 Industry applications | Case pages link to their sources with the link-check result | `src/data/cases.mjs`, `src/pages/pages.mjs` | static | case page screenshot | Case facts were NOT re-read against the sources; capstones, hardware guide and assessments unchanged | re-verify each case; capstone audit |
| 6 Platform UX, accessibility, SEO | Full-text search with snippets; catalogue filters for maths level and progress; top-bar progress link; larger edge tabs; forced-colours support; `.node-version` | `public/assets/app.js`, `public/assets/app.css`, `src/lib/layout.mjs`, `src/pages/pages.mjs` | e2e 59/59 (contrast in both themes, 9 widths, keyboard) | e2e results | No axe run, no screen-reader pass, no Lighthouse, roadmaps unchanged, no structured data, no feedback link | see open list |
| 7 Release gate | Tests rerun after every slice; documents written | `QA_REPORT.md`, `MONETIZATION_READINESS.md`, `docs/DESIGN_SYSTEM.md`, `CLAUDE.md`, `HANDBACK-2026-11-05.md` | table above | | Not a release: open items remain; owner approval needed before deploy or push | owner review |

## Requirements-to-test matrix

| Requirement (specification section) | Implemented in | Automated check |
|---|---|---|
| Maths at the point of need, tiny numbers, explicit steps (2) | ` ```maths ` blocks in 48 lessons | build fails on a wrong step; static: every lesson that needs maths has a moment with steps and a "why" |
| Benchmark examples: average, line, precision, probability, dot product, gradient step, attention (2) | d-clean-eda, ml-regression, ml-classification, s-what-is-ai, app-embeddings, ml-learning, dl-transformers | e2e: each calculator shows the hand-worked result |
| No forced maths (2) | `maths: none` on s-setup and app-frameworks | static: a "No maths" lesson must not contain a moment |
| Maths correctness (2, 8) | `scanArithmetic`, `checkChain` | `npm run check:maths` (in `npm test`) |
| Interactive, keyboard-usable, bounded, resettable, with fallback (2) | 8 calculator types; steps above are the fallback | e2e: default, change, invalid input, reset, keyboard reveal, dark theme at 390 px |
| One dark-token definition (3A) | `src/design/tokens.mjs` | e2e contrast, both themes, all pages |
| Single reading column (3C) | `.lesson-body` rules | e2e overflow at 9 widths; screenshots |
| Python and C# switch, honest badges (3C, 4) | `[data-lang-switch]`, `codeEvidence()` | e2e language switch and pill check |
| Search inside lesson text (3B) | `search-text.js`, `runSearch()` | e2e search check |
| Start chooser, resume (3B, 3D) | home page, `STARTS` | e2e chooser and resume check |
| Versioned, migrated local data (3D) | `migrate()` | e2e migration; e2e export, import, reset |
| Outside links only to vetted sources, nothing loaded remotely (6) | `sources.mjs`, `sourceLink()` | static and e2e link policy checks |
| Visible, checked case sources (5) | case pages | static register check; `npm run check:links` |
| Real compile and run evidence (4, 8) | `scripts/verify-code.mjs` | `npm run verify:code` |
| Ads prepared but off (7) | existing env-driven build | default build: 0 pages with ad markup (checked by hand with grep); e2e "nothing loaded from other sites" |
| No horizontal scroll 320 to 1920 (8) | CSS | e2e sweep, 427 page and width combinations |

## Acceptance contract (specification section 10)

- [x] Brand, 7 parts, 50 lessons, teal, blue and violet identity preserved. All 92 addresses unchanged.
- [x] A beginner reaches a complete first activity without advanced maths or an account (start chooser, first lesson, maths moment, quick check).
- [ ] Maths exactly where needed in each topic. **Partly:** 52 moments are inside the lessons; the older Applied Maths sections still sit after the code and are not restyled.
- [ ] Every important concept has explanation, example, application, explained code, error cases and a self-test. **Not audited lesson by lesson.**
- [x] Python and C# statuses reflect real evidence. Hybrid patterns were already described in lessons; not extended.
- [ ] Capstones and cases have runnable paths and verified citations. **Partly:** citations are linked and link-checked; facts not re-read; capstones not audited.
- [ ] Visual design coherent on every template. **Partly:** lesson, home, maths and case templates reviewed by eye; roadmaps, plan, hardware and others not re-reviewed after the change.
- [x] Sidebar, focus, search, filters, quizzes, progress migration, export and import, maths calculators and deep links have passing tests. (Code "tabs" are a show and hide switch.)
- [ ] Accessibility WCAG 2.2 AA. **Automated only:** contrast, keyboard, names, focus, overflow. No screen-reader or human test.
- [x] Static, no account, nothing loaded from other sites, Cloudflare Pages ready, outside links possible.
- [x] No fake ranking, domain, author or qualification claims. No structured data added.
- [x] AdSense prepared and disabled; flag preserved; obligations documented in `MONETIZATION_READINESS.md`.
- [x] Real test results, screenshots and remaining failures are recorded here and in `QA_REPORT.md`.

## Open work, in suggested order

1. Read every lesson once for teaching quality (does it teach its title, are transitions sound) and move each maths moment beside the sentence that needs it.
2. Restyle or trim the 118 older Applied Maths topics.
3. Re-read the 11 cases against their sources; open the 6 unconfirmed links by hand.
4. Audit the 8 capstones against runnable code.
5. Roadmap, plan, hardware, glossary and assessment templates: review after the design change; add practical assessment questions.
6. Accessibility: axe run, NVDA or VoiceOver pass, Edge, Firefox, Safari, phones.
7. Performance: Lighthouse lab run; the full-text index is 540 KB and loads only when search is used.
8. Lesson feedback link (needs the owner's repository or contact choice).
9. Owner decisions still pending: domain for `SITE_URL`, contact email, AdSense ids, hosting go-ahead.

## Round 2, 2026-11-16 (same branch)

Real results on this date: build 92 pages; `check:maths` 697 calculations, 0 problems; static checks passed; browser tests 59 of 59;
C#: 57 of 57 samples compiled and 25 ran to the end; Python: 14 of 14 example programmes ran, and of 51 lesson blocks 9 ran on their own, 41 passed a syntax check only and 1 is a fragment.

- **Cases re-checked against their sources.** Each claim on the 11 case pages was compared with the source pages that could be opened.
  Ten wordings or figures were corrected (for example Intercom now quotes 12,000+ customers, not 8,000+; Klarna's share of chats differs
  between sources and the page says so). Every case page has a dated "Source check" section saying what was confirmed and what rests on a
  page that refused an automated request. Six such pages still need a person to open them.
- **Capstones.** Each of the 8 has a "Starter code you can run today" section: the exact command (all run on 2026-11-13), the lessons whose
  C# samples cover the .NET route, and what the starter does not give you. Vision and LoRA have no runnable training starter here.
- **Assessments.** One practical question added to each checkpoint (read numbers, find a leakage bug, diagnose training, estimate memory,
  name a defence, defend a release decision): 32 questions in total.
- **Older Applied Maths examples** are shown one sentence per numbered line (240 examples). Layout only; wording and numbers unchanged.
- **Maths moment placement.** 25 moments moved from after "Related concepts" to the step they belong to.
- **C# samples are now also run**, not only compiled, where that is possible without a model, a service or data.
- Static checks now also require the source-check section and two linked sources on every case, and the starter section on every capstone.

Still open after round 2: lesson-by-lesson teaching review; rewording or trimming the older maths topics; the six unopened sources; roadmap
redesign; diagram audit; separate progress for exercises; quiz retry flow; feedback link; screen reader, other browsers, phones, axe and
Lighthouse; PyTorch, FastAPI, MLflow, LangGraph and live model calls; the migration pack.

- Roadmaps (2026-11-16): each step shows what to finish first (derived from lesson prerequisites), a finished-lessons count, its part checkpoint link, and each roadmap has a "Continue this route" button. e2e 60/60.

- Layout review (2026-11-16): plan, hardware, glossary, progress checked at 1440 px and 390 px; consistent. Added per-week finished counts and done marks to the plan, and a resume link on the progress page. e2e 61/61.

- Diagram audit (2026-11-16): all 432 diagrams analysed. No overflow or clipping at 320, 768 and 1440 px in dark mode; every number in a diagram appears in its lesson text; 3 duplicate titles and 3 repeated structures are intentional reinforcement. Three thin diagrams (two-step flows and a two-step loop) given a third step. `npm run check:diagrams` now enforces: 3+ steps in step diagrams, unique titles per lesson, numbers present in lesson text; it is part of `npm test`. Not done: 245 diagrams have no caption note; no human review of whether each diagram teaches well.

- Assessment and print review (2026-11-16): the checkpoints page split questions across two columns and cut question text through the box border; fixed (one column, text inside the box). Print of a lesson and of the assessment checked as PDF: clean, explanations open, controls hidden; the check buttons were still printed, now hidden. e2e 63/63. Print of roadmaps, cases, capstones and plan measured but not viewed.

- Quiz retry flow (2026-11-16): a wrong answer marks the choice "(not this one)" in words, keeps the options open and counts the try; a right answer locks, reports its try and opens the explanation; each part shows "x of y correct so far, z on the first try" and a Retry button that resets it. Results are kept on the page only, not saved. The lesson "Quick check" (reveal answers) is unchanged. e2e 64/64.

- Diagram reading guides (2026-11-16): every diagram without an author note now shows a generated "How to read it" line built from its own boxes (all 432 diagrams have a caption note or a reading guide). e2e 64/64. Not done: no authored explanation per diagram; no "Explain this diagram" toggle.
