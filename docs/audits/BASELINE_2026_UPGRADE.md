# Baseline audit before the 2026-11 upgrade

Written 2026-11-13 on machine LAP-NFS2036 (Windows 11 Pro), branch `upgrade/v2-2026-11` cut from `main` at commit `c889805`.
Every line says where the fact comes from: **observed** (run or read in this repository on that date), **reported** (taken from
`SITE-CONTEXT.md` or `HANDBACK-2026-11-05.md`, not re-run), **externally verified** (checked against a live outside source) or **not checked**.

## 1. Tools (observed)

| Tool | Version | How checked |
|---|---|---|
| Node.js | v22.17.0 | `node -v` |
| npm | 10.9.2 | `npm -v` |
| .NET SDK | 10.0.400 (MSBuild 18.9.6) | `dotnet --info` |
| Python | 3.12.10, numpy 2.5.2, pandas 3.0.5 | `python -c ...` |
| scikit-learn | missing at baseline; 1.9.1 installed during the audit | `pip install scikit-learn` |
| torch, fastapi, mlflow, langgraph, transformers | not installed | import test |
| Playwright | Chromium installed | e2e run |

## 2. Baseline test results (observed, before any change)

| Command | Result |
|---|---|
| `npm run build` | 92 pages (50 lessons, 8 capstones, 11 case studies) |
| `npm run test:static` | 92 pages, 9,463 internal links, 0 external links. Passed |
| `npm run test:e2e` | 52 of 52 checks passed (Playwright Chromium) |
| `npm run test:examples` | **2 failures** on Windows: `math_for_ai.py` and `ai_extras.py` crashed with `UnicodeEncodeError` (cp1252) when their output was piped. Not a logic error: the runner did not set UTF-8 output |
| C# compile | never run before this audit |

Screenshots of the site before the upgrade: `docs/audits/before/` (21 images copied from `qa/screenshots/`).

## 3. Inventory (observed from source files)

50 lessons in 7 parts, about 98,900 lesson words, 432 diagram blocks, 118 Applied Maths topics in 48 lessons, 166 glossary terms,
8 capstones, 11 cases, 3 roadmaps, 7 checkpoints with 25 questions, 92 pages. These match `SITE-CONTEXT.md`.

## 4. Findings, with the file each one lives in

| # | Finding | Status | Where | Evidence |
|---|---|---|---|---|
| 1 | Dark theme tokens written twice (system setting and manual switch) | observed | `public/assets/app.css` lines 17-36 | read |
| 2 | Lesson panel styles defined three times in layered override blocks | observed | `public/assets/app.css` (base, "report style", "teal flat") | read |
| 3 | Lesson prose flows into two columns on wide screens | observed | `.lesson-section.prose-cols` | `docs/audits/before/lesson-1920-light.png` |
| 4 | README says 158 glossary terms; data has 166 | observed | `README.md`, `src/data/reference.mjs` | count |
| 5 | Home page says "there are no outside links to follow" | observed | `src/pages/pages.mjs` | read |
| 6 | Case sources shown as text only; addresses only in `CONTENT_SOURCES.md` | observed | `casePage()` | read |
| 7 | Build and static test fail on ANY outside link | observed | `scripts/build.mjs`, `tests/static-checks.mjs` | read |
| 8 | Maths lives only in a section after both code examples; its position is forced by the parser | observed | `parseLesson()` in `src/lib/markdown.mjs` | read |
| 9 | Worked examples are written as one dense paragraph each, not step by step | observed | all 48 Applied Maths sections | read `ml-regression.md` |
| 10 | No automatic check of any worked number | observed | no such script existed | read |
| 11 | Code status pills come from hand-written front matter; every lesson said "C# not compiled (no .NET SDK)" although an SDK is installed here | observed | `codeStatus()` in `scripts/build.mjs` | read |
| 12 | 0 of 50 C# lesson samples had ever been compiled | reported, then observed | `SITE-CONTEXT.md` | first real compile run: 42 of 50 files compiled, 8 failed |
| 13 | `examples/lesson-code/` was out of date (44 Python and 50 C# files; a fresh extraction gives 51 and 58) | observed | `npm run extract:code` | diff |
| 14 | Search matches page titles and 600 characters of text only | observed | `search-index.js` | read |
| 15 | No first-visit guidance, no "continue where I left off" | observed | home page | read |
| 16 | Browser data has one version and no migration path | observed | `public/assets/app.js` | read |
| 17 | Client script header still names the sibling project "AI Engineering Academy" | observed | `app.js` line 1 | read |
| 18 | One case source (Deere press release) redirects automated requests to a generic page | externally verified | `npm run check:links` | result "moved" |
| 19 | The approval type in the agents C# sample was renamed by Microsoft (`FunctionApprovalRequestContent` is now `ToolApprovalRequestContent`) | externally verified | NuGet package Microsoft.Extensions.AI 11.0.0 | compile error, then package XML docs |
| 20 | Screen-reader pass, Safari, real phones, independent subject review | not checked | | still open |

## 5. Arithmetic audit of the existing maths (observed)

A scanner (`src/lib/maths.mjs`, `npm run check:maths`) read every "calculation = result" in the 48 Applied Maths sections:
453 calculations, **0 wrong**. Two results are truncated rather than rounded (0.0416 shown as 0.041 in `llm-eval`; 0.665 shown as 0.66
in `ops-mlops`); the scanner allows one unit in the last shown decimal for prose, so these pass. The scanner cannot read every
sentence (it skips unknown functions such as `tanh` and anything it cannot parse), so "0 wrong" means "0 wrong among those it could read".

## 6. Traceability: what each finding became

| Finding | Change | Test that guards it |
|---|---|---|
| 1 | `src/design/tokens.mjs` is the single source; the build writes the token block | e2e contrast audit in both themes |
| 2, 3 | One definition of the numbered sections; single reading column | e2e overflow sweep, screenshots |
| 4, 5 | Wording corrected; counts computed from data where the page is generated | static placeholder check, by eye |
| 6, 7, 18 | `src/data/sources.mjs` register, `npm run check:links`, links with their checked status on the page | static check "0 unregistered outside addresses"; e2e "nothing loaded from other sites" |
| 8, 9, 10 | ` ```maths ` moments inside sections; build fails on wrong arithmetic; position rule relaxed | build, `npm run check:maths`, static check "every lesson has a maths moment" |
| 11, 12, 13, 19 | `scripts/verify-code.mjs` writes `qa/code-status.json`; pills generated from it; 8 samples repaired | `npm run verify:code`; e2e check on the C# pill |
| 14 | Full-text index loaded on first use, snippets with marked words | e2e "search finds text inside lessons" |
| 15 | Start chooser and resume card | e2e "start chooser ... resume" |
| 16 | Data version 2 with `migrate()`; version 1 exports still import | e2e "version 1 browser data migrates" |
| 17 | Header corrected | read |
| 20 | Unchanged | listed as open in `QA_REPORT.md` |
