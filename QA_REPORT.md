# QA report — AI & ML Quick Path

Date: 2026-11-03. Environment: Linux, Node 22.23, Python 3.13.18 (NumPy 2.5.3, pandas 3.0.5, scikit-learn 1.9.1),
Playwright 1.63 with Chromium. Every result below comes from a command that was actually run; the final run
was after the last change.

## Results

| Check | Command | Result |
|---|---|---|
| Build and content validation (section order, quick-check format, internal links, **no external links**) | `npm run build` | 89 pages, 49 lessons, 7 capstones, 11 cases; 0 errors |
| Static HTML checks | `npm run test:static` | 89 pages, 8,711 internal links, **0 external links**, passed |
| Browser tests | `npm run test:e2e` | **52 / 52 passed** (`qa/e2e-results.json`) |
| Python examples | `npm run test:examples` | 14 runs and 63 files compiled, 0 failures |
| Quoted outputs vs real runs | one-off script (see below) | 116 quoted lines compared, 0 mismatches |
| C# code | independent desk review of all 50 files | 5 issues found and fixed (see CONTENT_SOURCES.md); **not compiled** |

## What the 52 browser checks cover
- No JavaScript errors on all 89 pages in light and dark themes.
- WCAG AA text contrast on every page in both themes (13,218 text elements each), and in dynamic states:
  empty filters, search results, open drawer, expanded roadmap, quiz feedback, calendar error.
- **Self-contained:** no external `a`, `script`, `link` or `img` on any page.
- No document-level horizontal scroll: 421 page × width combinations (320–1920 px), plus a 200% zoom equivalent.
- Desktop sidebar hide/show (3 cycles), persistence after reload, focus mode, sidebar group expand/collapse and filter.
- Mobile drawer at 320, 390 and 768 px: scrim, Escape, scrim click, button, focus return.
- Theme persistence and the System option.
- Roadmaps: 3 tracks with 10, 9 and 9 steps, connectors, collapse/expand per step and all, URL and Back button,
  arrow-key tabs, deep links, print layout (PDF written).
- Filters: cases (industry × difficulty × area × effort, empty state, reset), hardware, capstones, glossary
  (158 terms), lesson catalogue (part × level × code status).
- Header search (results, arrow keys, Escape, no-results message).
- Progress: completion, sidebar count, JSON export (schema `aimlqp-progress`), reset, import, invalid import
  rejected, study calendar validation.
- Blocked localStorage, skip link, visible focus, accessible names, copy buttons, quiz feedback, reduced motion.

## Quoted-output verification
Every ```` ```text Output of <script> <demo> (executed) ```` block for quickpath.py, ml_basics.py,
applied_basics.py, gap_topics.py, ai_extras.py and math_for_ai.py was compared line by line with a fresh run:
116 lines, 0 mismatches. Lines with machine-dependent timings (serving latency, batching speed-up) were skipped
and the lessons say those numbers vary by machine. Outputs of the other example folders were verified when the
sibling editions were built and their scripts are unchanged.

## Screens reviewed by eye
Home (1440 light, 390 dark), solve guide (1440 dark), maths map (1280), lesson at 1920, plan at 390,
capstone page, roadmap expanded at 390. Fixed after review: duplicate sidebar label ("Start here" vs
"1 Start here", Part 1 renamed "The big picture"), duplicate sidebar group id, over-tall boxes in vertical
architecture flows, comma-joined lesson lists in the plan.

## Known limits
- **C# not compiled:** no .NET SDK, and NuGet/npm registries were unreachable from the build environment.
  The code was reviewed by a separate reviewer; one experimental-API finding (Microsoft.Extensions.AI approval
  types) is uncertain and is flagged in the lesson.
- FastAPI, MLflow, PyTorch, TorchSharp, LangGraph, Ollama and hosted-model calls were not run (packages or
  models not available); every such block says so.
- Chromium only; Firefox and Safari not tested; no screen-reader session.
- Text was written and checked by the author and an automated reviewer; no independent subject-matter expert review.

## Diagrams added 2026-11-04
- 352 diagrams across all 49 lessons (6 to 11 per lesson; at least 3 is enforced by `npm run test:static`). Each
  lesson has a diagram next to every concept it introduces (flows, loops, layers, comparisons, nested boxes,
  2 by 2 matrices, lanes, fan/merge and proportional bars). They are HTML and CSS (no images, no inline styles).
- Checked: `node scripts/check-diagrams.mjs` (352 diagrams, 0 problems), `npm run build` (89 pages),
  `npm run test:static` (0 external links), `npm run test:e2e:edge` (52/52 in Microsoft Edge, including contrast in
  both themes and no horizontal scroll from 320 to 1920 px). Layout of every diagram type was reviewed visually at
  1280 px light and 360 px dark. Not every one of the 352 diagrams was reviewed by eye.
- Honesty review: numbers in diagrams were spot-checked against the lesson text and executed outputs (88% to 74%,
  15 caught / 5 missed / 30 false alarms, 0.980 and 0.965). Percentages in `bar` diagrams are labelled illustrative.
- Fixes during this work: the lesson parser now ignores `## ` lines inside fenced blocks; the static check now fails
  on an empty `dist/`.

## Layout, typography and browsers 2026-11-04
- Body text 17px (18px on wide screens), clearer heading scale, prose limited to 76 characters, zebra tables.
- Wide screens: lesson prose flows into two columns with diagrams full width below it (a side-by-side text and diagram
  layout was tried and rejected); about, checkpoints, case and capstone pages use two balanced columns from 1360px; plan weeks, roadmap steps and glossary entries use grids. Fixed a rule that capped
  card-like list items at 80 characters (plan weeks and roadmap steps were half-width).
- Tablet and phone: reviewed by screenshot at 768 and 390px (diagrams stack, no horizontal scroll). `npm run test:e2e:edge`
  and the same suite with `--channel=chrome` both pass 52/52 (contrast in light and dark, no horizontal scroll at
  320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920px).
- Firefox: checked by headless screenshots (lesson at 1600 and 390px, roadmaps); no automated Firefox run and no
  Safari/WebKit test were possible here. Container-query fallbacks exist for older browsers.

## Concept checklist coverage 2026-11-04
- The owner supplied four checklists (LLM basics, RAG, agents, evals and ops: 60 concepts). Each concept now has a plain-words
  explanation with a diagram in the lesson named in the glossary entry, and a glossary entry (158 terms, up from 114).
  Missing or thin before this work: agent loop, tool design, handoffs, sandboxing, computer use, skills, subagents, durable
  workflows, context packing, PDF parsing, re-indexing, regression tests, latency budgets, response caching, tracing,
  observability, token cost tracking, model selection, among others. New sections are `####` headings under
  "Related concepts" in the lesson's How it works section. No code blocks were added or changed (44 Python and 50 C# blocks
  as before); the new text describes concepts generally with no model names, prices or invented numbers.
- During this work one edit damaged an existing diagram header in app-rag.md; the build caught it and it was repaired.
  A structural scan of all lessons found nothing else. Content was not independently reviewed for accuracy.

## Report-style presentation 2026-11-04
- Restyled to match the owner's AssistBot architecture report: numbered panel sections, left-bar callouts, status pills for code status, tinted bordered tables, quiet cards. Checked in light, dark and at 390px by screenshot; automated checks below.

## Overview pages 2026-11-04
- Part pages: intro text now spans the width; an "At a glance" panel (lessons, study time, level mix, previous and next part, capstones that use the part) sits beside it and the part's glossary terms fill the left column. All values are computed from the guide's own data (no new claims).
- Home hero heading and text widened; lesson cards on part pages use auto-fit so no empty grid cells; callout and card text uses the full box width; prose limit raised from 76 to 100 characters outside lesson prose columns.
- Checked: build, static, Edge and Chrome e2e 52/52; screenshots of part pages at 1280 and 1600px and on a 390px phone.

## Applied Maths - Statistics 2026-11-05
- Owner decision: the guide no longer says "no maths". All such statements were removed (home page, about, Maths map, README, CLAUDE.md, plan, prompt file, lesson goal).
- New optional lesson section `## Applied Maths - Statistics` (before "Maths behind it", which was renamed from "Maths behind it (names only)"). Added to 47 of 49 lessons (s-setup and app-frameworks are tooling only, so skipped). Each topic is a collapsible panel with a formula block, plain words and at least two worked examples; the build enforces this (`node scripts/check-maths.mjs`).
- Worked numbers are illustrative hand calculations, checked by the authoring agents with node where non-trivial; they were NOT independently reviewed by a subject expert. Report errors if you spot any.
- Checks: build 89 pages, static passed, Edge and Chrome e2e 52/52, screenshots at 1400 px light and 390 px dark.

## New advanced lesson 2026-11-05
- Added `app-genai-agentic` "Generative AI and Agentic AI: the whole picture" (Part 6, Advanced, new group "Advanced: the whole picture"; also in the AI engineer roadmap step 8). 50 lessons, 90 pages, 160 glossary terms. Simple-English overview, 11 diagrams, worked example, Python and C# agent-loop samples (NOT run/compiled: no Python or .NET SDK here, so no output block), Applied Maths topics (agent cost, chain success p^n).
- Checks: build 90 pages, static passed, Edge and Chrome e2e 52/52 (lesson-count checks updated 49 to 50).

## Training-technique gaps closed 2026-11-05
- Added plain-words explanation, diagram, Applied Maths topic (formula + 2 worked examples), Python and C# snippets for: batch normalisation, gradient clipping, learning-rate schedule (dl-training); transfer learning, data augmentation (dl-vision); epsilon-greedy code (dl-rl); bagging (ml-algorithms); k-means centre update (ml-unsupervised); QLoRA, DPO, RLHF (llm-finetune). Six glossary terms added (166).
- New capstone c08-lora-finetune "Fine-tune a small model with LoRA" (8 capstones; e2e capstone filter test updated to 8 total / 3 language models).
- All new snippets are NOT run or compiled (no Python or .NET SDK here) and carry no output blocks; `code:` front matter shows a "not run" pill. Worked numbers recomputed with node by the authors, not independently reviewed.
- Checks: build 91 pages, static passed, Edge and Chrome e2e 52/52.
