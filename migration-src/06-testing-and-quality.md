# 06 - Testing and quality

(Last synced {{STAMP}}.)

## Definition of done for every change

1. `npm run build` passes (fails on content errors, unknown links, external URLs, missing sections, diagram or maths-format errors).
2. `npm run test:static` passes (always after a fresh build).
3. Browser tests pass: `npm run test:e2e:edge` on the original machine (also run `node tests/e2e.mjs --channel=chrome`); `npm run test:e2e` elsewhere. 52 checks as of {{STAMP}}.
4. If an example or a quoted output changed: `npm run test:examples` (needs Python) and re-copy the real output.
5. If lesson code changed: `npm run extract:code` (needs Python).
6. Original machine only: run `scripts/deploy.ps1` and report the smoke test.
7. Report actual results. Never claim a test passed without running it. If a test must change because behaviour intentionally changed, say why (examples: lesson total 49 -> 50 in the catalogue test; capstone total 7 -> 8 and language-model count 2 -> 3 in the capstone filter test).

## What the tests cover

- `tests/static-checks.mjs`: every internal link and anchor resolves, exactly one h1 per page, heading order never skips, ids unique, no placeholder text (TODO, TBD, lorem ipsum, "coming soon"), no unrendered template text, **zero external links**, at least 3 diagrams per lesson page, every diagram has a caption, and it refuses to run against an empty dist.
- `tests/e2e.mjs`: no JS errors on every page; contrast on every page in light and dark and in dynamic states; no external resources; no horizontal scroll at several widths and at 200% zoom; sidebar and drawer behaviour; theme persistence; roadmaps; filters; search; calendar; progress export/import; storage-blocked mode; keyboard and accessible names; screenshots into `qa/screenshots/`. The full list is in the generated appendix below.

## Status of the content (be honest in future reports)

- **Python outputs** quoted in lessons were copied from real runs (executed in an earlier session on a machine that had Python). The Python added later (agent loop, technique snippets) was **not run**.
- **C# was never compiled** anywhere (no .NET SDK on the original machine). Samples were desk-reviewed only; five review findings were fixed on 2026-11-03.
- **FastAPI, MLflow, PyTorch, LangGraph, peft/trl** code is not run and is labelled.
- **Worked maths examples** (the Applied Maths panels, 107+ topics) are illustrative hand calculations. The authors recomputed the non-trivial ones with node; the data-augmentation counts were checked by eye. No independent subject-matter review has happened. One real error was caught during authoring (47 hours a year corrected to 57), so more may exist.
- **Concept coverage** against the four owner checklist images was scanned by regex plus heading check, not read line by line.
- **Browsers:** Edge and Chrome automated; Firefox only by headless screenshots; Safari/WebKit and real iPhones untested. No screen-reader testing.
- **Visual review:** screenshots were viewed for representative pages (not every one of the lessons and diagrams).
- Search is simple term matching. The 404 page was left as is (short page with spare space).
