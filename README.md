# AI & ML Quick Path: From Concepts to Industry

A free, self-contained learning website for people **new to AI** who want a complete grip on AI and machine
learning, from the first idea to designing and building industry systems.

- **50 lessons in 7 parts**: the big picture, data, machine learning, deep learning, large language models,
  AI applications (RAG, agents, multimodal, evaluation, security, responsible AI) and production (serving,
  MLOps, monitoring, scale, architecture).
- **Short, practical maths.** Where it applies, a lesson has a collapsible "Applied Maths - Statistics" section with the main formula and worked examples; the Maths map collects the topics.
- **Plain words.** Every lesson has the same eight sections: In plain words, Real-world example, How it works,
  Python example, .NET (C#) example, Applied Maths - Statistics (where it applies), Maths behind it, Common mistakes, Quick check.
- **Python and .NET in every lesson.** Python outputs are copied from real runs; C# is labelled "not compiled".
- **Real cases**: 11 documented company uses of AI, with sources listed by title and publisher.
- **Practice**: a 12-week plan, 3 visual roadmaps, a "solve any case" decision guide, 8 capstone projects
  (churn, forecasting, visual inspection, RAG assistant, approval-based agent, a small LLM trained on a laptop,
  and a private local assistant), 7 checkpoint quizzes and a 158-term glossary.
- **No external links.** Everything is explained on the site itself. The build and tests fail if a link appears.
- Light, dark and system themes; collapsible sidebar; mobile drawer; focus mode; filters; progress saved in
  the browser with JSON export and import. No tracking, no backend.

## Quick start

```bash
npm run build          # builds dist/ (Node 18+, no dependencies)
npm run serve          # http://localhost:8080
```
Or open `dist/index.html` directly from disk: all links are relative.

## Tests

```bash
npm run test:static                     # links, anchors, headings, ids, zero external links
npm install && npx playwright install chromium
npm run test:e2e                        # 52 browser checks, screenshots in qa/screenshots
npm run test:examples                   # runs the Python examples (needs numpy, pandas, scikit-learn)
```
Latest results are in `QA_REPORT.md`.

## Project layout

```
scripts/build.mjs            generator (validates lessons, fails on external or broken links)
scripts/extract_lesson_code.py   copies lesson code blocks into examples/lesson-code/
src/content/lessons/<part>/  50 lessons in Markdown
src/data/                    curriculum (parts, roadmaps, routes), cases, capstones, hardware, glossary, quizzes
src/pages/pages.mjs          all non-lesson pages
src/lib/                     Markdown renderer, page layout
public/assets/               the only CSS and JS files
examples/                    runnable Python demos and all lesson code as files
tests/                       static checks and Playwright tests
```

## Documents

- `PROMPT_FOR_CLAUDE_CODE.md` — the full briefing for Claude Code in VS Code (context, rules, inventory, tests, backlog).
- `CLAUDE.md` — the short rule book Claude Code loads automatically.
- `DEPLOYMENT.md` — hosting on GitHub Pages, Cloudflare, Netlify, Azure Static Web Apps or any web server.
- `CONTENT_SOURCES.md` — sources and verification for every fact and number.
- `QA_REPORT.md` — what was tested, results and known limits.
- `PROJECT_PLAN.md` — scope, decisions and open items.

## Licence

Lesson text and diagrams: CC BY 4.0. Code: MIT. See `LICENSE.md`.
