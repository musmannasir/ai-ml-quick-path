# Project plan — AI & ML Quick Path

## Goal
The quickest complete route for someone new to AI to understand every main AI and ML concept and build
industry systems, in plain words, with Python and .NET examples, real company cases, short practical maths with worked examples
and no external links.

## Requirements and how they are met

| Requirement | Implementation |
|---|---|
| Beginner to advanced, proper flow | 7 parts, 49 lessons with prerequisites, 3 roadmaps, 12-week plan |
| Short, practical maths | "Applied Maths - Statistics" collapsible panels (formula + two worked examples) where maths applies; "Maths behind it" names; generated Maths map |
| Very simple words, step by step | Fixed 8-section lesson template; "In plain words" first; "How it works" as numbered steps |
| Simple examples and implementations | Python example (real output) and C# example in every lesson; all code also in `examples/lesson-code/` |
| No external links, fully standalone | Build fails on external links; static and e2e checks assert zero; sources shown as text |
| RAG, LLM design and implementation | app-rag, app-rag-advanced, llm-how, llm-tokens, llm-design; capstone 4 |
| Train a model on a laptop, scale to large hardware | llm-train-laptop, llm-scale, hardware page "laptop to large-scale"; capstone 6 |
| Cover all AI/ML concepts | Coverage check over ~150 concepts; 14 "Related concepts" blocks fill gaps; 158-term glossary |
| .NET and Python | Both in every lesson and every capstone; hybrid .NET + Python architecture lesson |
| Real-world cases | 11 sourced company cases with confirmed facts separated from suggested designs |
| Ready for any case | "Solve any case" decision guide (9 steps, approach table, worked examples) |

## Done (2026-11-02 / 03)
- All 49 lessons, 7 part pages, roadmaps, plan, roles, solve guide, maths map, capstones, cases, hardware,
  glossary, 7 checkpoint quizzes, progress, about.
- New demos: serving (real HTTP model server), registry (promotion gate), batching.
- Independent C# review; 5 fixes applied.
- Tests: static checks with zero-external-links rule; 52 Playwright checks; examples runner; output verification.

## Open items
1. Compile and run all C# samples with a .NET 9/10 SDK; pin package versions; update `code:` labels.
2. Run the FastAPI, MLflow, PyTorch and Ollama samples on a machine with those installed.
3. Test in Firefox and Safari; screen-reader pass (NVDA, VoiceOver).
4. Independent subject-matter review of lessons.
5. Re-check case-study facts at least every 6 months (sources in CONTENT_SOURCES.md).
6. Optional: downloadable offline notebook versions of the Python examples.

## Done 2026-11-04
- Diagrams for every lesson (352), renderer `src/lib/diagram.mjs`, styles in `app.css`, rules in CLAUDE.md 4.7.
- Browser tests run in installed Microsoft Edge (`npm run test:e2e:edge`); the site is deployed to local IIS
  through `scripts/deploy.ps1` as plain static files with a generated web.config (site "AIGuide"; no exe).
