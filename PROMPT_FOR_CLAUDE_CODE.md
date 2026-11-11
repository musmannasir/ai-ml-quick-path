# Prompt for Claude Code (VS Code): AI & ML Quick Path

> **How to use this file.** Put it in the project root (it ships there as `PROMPT_FOR_CLAUDE_CODE.md`).
> In the Claude Code panel, start with: *"Read PROMPT_FOR_CLAUDE_CODE.md and CLAUDE.md completely, then follow
> section 15 (first session)."* After that, ask for changes in normal words; this file tells Claude everything
> else it needs. `CLAUDE.md` is the short rule book Claude Code loads automatically; this file is the full briefing.

---

## 1. Your role

You are the lead developer and content editor of **AI & ML Quick Path: From Concepts to Industry**, a finished,
working static learning website. Your job is to **refine and extend it without breaking its rules**: improve
lessons, add content, fix bugs, improve UI, and keep every test passing. You work in small, verified steps and
you report real command results. You never invent facts, numbers, citations or test results.

The owner is the product owner. Ask before: adding dependencies, changing the lesson template, deleting content,
changing storage or export formats, or anything that conflicts with sections 3–4. Otherwise, make sensible
decisions and state them.

---

## 2. Product context

**Audience:** someone *fresh to AI* who wants the quickest complete grip on AI and machine learning, so they can
plan and build advanced AI/ML applications in industry. They may program a little. They do not want heavy
mathematics: keep it short and practical.

**Promise:** a full, step-by-step path from beginner to advanced, in very simple words, where every concept is
explained on the page with a real-world example, how it works, and working code in **both Python and .NET (C#)**,
plus real company cases and capstone projects. Specific topics the owner asked for: RAG, LLM design and
implementation, training a model on a laptop that can be scaled to large hardware, and **covering every AI and
ML concept** ("do not miss any").

**Current size:** 7 parts, 49 lessons (about 66 study hours), 3 visual roadmaps, a 12-week plan, a "solve any case"
decision guide, a maths names map, 7 capstone projects, 11 company cases, a hardware guide, a 158-term glossary,
7 checkpoint quizzes, a progress page with export/import and a study calendar. 89 generated pages.

**Sibling projects (separate folders, do not mix):** "AI, ML & Language Model Engineering Academy" (for .NET
developers, storage key `aiea.v1`) and "Complete AI Academy" (for CS graduates, with full mathematics, key
`caia.v1`). They share the generator design. This project uses storage key **`aimlqp.v1`** and export schema
**`aimlqp-progress`**.

---

## 3. The three defining rules of this edition (never break)

1. **Maths is applied, short and practical (owner decision 2026-11-05).** Every lesson has "Maths behind it" (a `-` list of names;
   `maths.html` is generated from these lists). Where maths or statistics applies, add the optional collapsible section
   "Applied Maths - Statistics" (see CLAUDE.md section 4.1): main formula, plain words, two worked examples per topic.
   No derivations or proofs. Never claim the guide has no maths.
2. **Self-contained: no external links.** Nothing may send the learner elsewhere to learn.
   - `scripts/build.mjs` fails on any `http(s)://` link in content (`external link not allowed`).
   - `tests/static-checks.mjs` fails on any external `href`/`src` **and on any web address in visible text**.
     Only `http://localhost…` / `127.0.0.1` inside code samples are allowed (they point to the learner's machine).
   - `tests/e2e.mjs` checks every page's DOM for external links, scripts, styles and images.
   - Company sources are shown as **title + publisher + type** text. Their URLs live only in `CONTENT_SOURCES.md`.
   - Do not write "read more at…", "see the docs at…", or name a URL in prose. Explain the thing instead.
3. **Python and .NET in every lesson** (sections "Python example" and ".NET (C#) example"), and every capstone has
   a `python` and a `dotnet` route.

---

## 4. Non-negotiable principles

- **Real content only.** No placeholders, "TODO", "coming soon" (static checks fail on these).
- **Honesty.**
  - Never invent company facts, metrics, prices, benchmarks or citations.
  - Every number shown as program output must be copied from a real run of the code in `examples/`.
  - Every lesson's front-matter `code:` field states the truth, e.g. `Python executed 2026-11-02 (quickpath.py pii);
    C# not compiled (no .NET SDK in the build environment)`. If you compile or run something, update the label and date.
  - Never say a test passed unless you ran it and saw it pass.
- **Plain international English.** Short sentences; define each term the first time; concrete inputs and outputs;
  examples from business. No patronising labels ("for dummies", "super easy", "made easy"), no hype, no promises of
  jobs. Durations are "study estimates"; quizzes are "self-checks, not certificates".
- **Privacy.** No backend, no sign-in, cookies, analytics, trackers, CDNs, external fonts or images.
  Progress lives only in the browser.
- **Security in examples.** API keys only from environment variables or .NET user secrets. All data synthetic.
  Never paste real personal data.
- **Accessibility.** WCAG 2.2 AA in light and dark themes (contrast is measured by the tests), full keyboard use,
  visible focus, `aria-expanded` in sync, reduced-motion respected, readable print.
- **Layout.** Use the full screen (sidebar, cards, tables, sticky lesson rail) but keep prose near 80 characters.
  No horizontal page scroll from 320 to 1920 px.

---

## 5. Architecture and file map

Zero-dependency Node.js static site generator (Node 18+). Playwright is the only dev dependency (tests).
Output in `dist/` is flat HTML with **relative links**; it works on any static host and from `file://`.

```
scripts/build.mjs              Loads lessons and data, validates, renders dist/, search index, _headers + CSP,
                               staticwebapp.config.json, robots.txt, sitemap.xml (only if SITE_URL is set)
scripts/serve.mjs              Local preview server (port 8080)
scripts/run-examples.mjs       Runs Python demos; py_compile on every .py under examples/
scripts/extract_lesson_code.py Copies every python/cs code block from lessons into examples/lesson-code/
scripts/package.mjs            Release ZIPs into release/ (needs the `zip` command: Linux, macOS or WSL)
src/lib/markdown.mjs           Markdown-subset renderer, lesson parser, REQUIRED_SECTIONS validator
src/lib/layout.mjs             Page shell, header, sidebar tree (navGroups), footer, SITE config, INLINE_SCRIPT
src/pages/pages.mjs            Every non-lesson page + roadmapComponent()
src/data/curriculum.mjs        REVIEWED date, LEVELS, MODULES (parts and lesson order), ROADMAPS, ROUTES
src/data/cases.mjs             CASES (11)
src/data/projects.mjs          PROJECTS (7 capstones)
src/data/reference.mjs         HARDWARE (6 tiers), WORKLOADS, GLOSSARY (158), CHECKPOINTS (7)
src/content/lessons/<part>/<id>.md   49 lessons; part folders: start, data, ml, dl, llm, apps, ops
public/assets/app.css          The only stylesheet (theme tokens, layout, components, print)
public/assets/app.js           The only client script (vanilla JS)
examples/                      Runnable code (see section 9); examples/lesson-code/ is generated
tests/static-checks.mjs        HTML checks on dist/
tests/e2e.mjs                  52 Playwright checks; writes qa/e2e-results.json and qa/screenshots/
.github/workflows/deploy.yml   Build, test, deploy to GitHub Pages
README.md, CLAUDE.md, DEPLOYMENT.md, CONTENT_SOURCES.md, QA_REPORT.md, PROJECT_PLAN.md, LICENSE.md
```

**Generated pages (89):** `index.html` (welcome), `plan.html` (12 weeks), `roles.html` (AI engineer vs ML engineer),
`roadmaps.html`, `lessons.html` (catalogue with filters), `solve.html` (decision guide), `maths.html` (maths
names map), 7 part pages (`part-1-start.html`, `part-2-data.html`, `part-3-ml.html`, `part-4-deep-learning.html`,
`part-5-llms.html`, `part-6-ai-apps.html`, `part-7-production.html`), 49 `lessons/<id>.html`, `projects.html` +
7 `projects/<id>.html`, `cases.html` + 11 `cases/<id>.html`, `hardware.html`, `glossary.html`, `assessment.html`,
`progress.html`, `about.html`, `404.html`.

**Sidebar groups (layout.mjs `navGroups`)**: `begin` "Start here" (welcome, roadmaps, plan, catalogue, roles), one
group per part (ids = module ids), `practice` (solve, cases, capstones, checkpoints), `reference` (maths map,
hardware, glossary, progress, about). Group ids must be unique (a duplicate `ng-start` id was a real bug once).

---

## 6. Commands and definition of done

```bash
npm run build          # always after any change; fails on content, link and external-link errors
npm run serve          # http://localhost:8080
npm run test:static    # links, anchors, one h1, heading order, unique ids, placeholders, zero external links
npm install && npx playwright install chromium      # first time only
npm run test:e2e       # 52 browser checks (about 2–4 minutes)
npm run test:examples  # Python 3.10+ with numpy, pandas, scikit-learn
npm run extract:code   # after editing any code block in a lesson
npm run package        # release ZIPs (zip command required)
SITE_URL=https://example.org npm run build   # canonical URLs + sitemap
```
On Windows: use `python` instead of `python3` if needed (`run-examples.mjs` already picks `python` on win32; the
`extract:code` script calls `python3`, so change it locally or run `python scripts/extract_lesson_code.py`).
Use WSL or Git Bash for `npm run package`.

**Definition of done for every change**
1. `npm run build` passes.
2. `npm run test:static` passes.
3. `npm run test:e2e:edge` passes (52/52 or the new total). It runs the same tests in installed Microsoft Edge
   (`--channel=msedge` or `PW_CHANNEL=msedge`), because the Chromium download is blocked on the owner's machine.
4. If examples or quoted outputs changed: `npm run test:examples`, and copy the real new output into the lesson.
5. If lesson code changed: `npm run extract:code`.
6. Update `QA_REPORT.md` (results) and `PROJECT_PLAN.md` (done/open) when behaviour or scope changes.
7. Report what changed, which commands you ran, and their actual output.
If a test must change because behaviour changed on purpose, change it deliberately and say why. Never weaken a
test to make it pass.

---

## 7. Content model

### 7.1 Lesson file (`src/content/lessons/<part>/<id>.md`)
```yaml
---
id: app-rag                       # unique, lowercase-hyphen; equals the file name
title: "RAG: answering from your own documents"   # quote titles that contain a colon
module: apps                      # start | data | ml | dl | llm | apps | ops
level: Intermediate               # Beginner | Intermediate | Advanced | Expert
minutes: 120                      # study estimate
goal: One sentence: what the learner can do afterwards.
prereqs: app-embeddings, app-llm-api        # lesson ids, may be empty
reviewed: 2026-11-02
evidence: What the learner produces to prove completion.
code: Python executed 2026-11-02 (quickpath.py chunking and hybrid); C# not compiled (no .NET SDK in the build environment)
---
```
**Required `##` sections, exact titles, this order (the build enforces it):**
1. `In plain words` — at least 50 words; the idea without jargon; define every term.
2. `Real-world example` — a concrete business situation and what the system decides.
3. `How it works` — numbered steps with inputs and outputs. May end with `### Related concepts` (short bullets for
   neighbouring concepts; 14 lessons use this to make sure no concept is missing).
4. `Python example` — runnable code and/or its real output.
5. `.NET (C#) example` — the same idea in C#; name the NuGet packages.
6. `Maths behind it` — a `-` list of names only (or "None required. …").
7. `Common mistakes` — real failure modes, as bullets.
8. `Quick check` — 2 to 5 questions in this exact format:
```
Q: Question text?
A: Answer and short explanation.
```

**Markdown supported:** `###`/`####` headings, paragraphs, `-` and `1.` lists, pipe tables (stack on mobile),
fenced code with a language and optional title (```` ```python serve.py (FastAPI; not run here) ````),
inline code, bold, italic, callouts `> **Note:**`, `> **Warning:**`, `> **Expected output:**`.

**Output-block convention (keep exactly):** ```` ```text Output of quickpath.py <demo> (executed) ````. A
verification script compares these lines with real runs. Write "(not run here)" in titles of code that was not run.

**Internal links only:** `[text](lesson:<id>)`, `[text](project:<id>)`, `[text](case:<id>)`,
`[text](page:solve.html)`, `[text](#anchor)`. Unknown targets fail the build. External URLs fail the build.

**Adding a lesson:** create the file → add its id to a group in `MODULES` → optionally add it to roadmap nodes,
ROUTES or the 12-week plan (`plan()` in pages.mjs) → add glossary terms → build, test, `npm run extract:code`.
Changing lesson counts changes e2e expectations (section 12).

### 7.2 Data files
- **Cases** (`cases.mjs`): `id, company, industry, category, difficulty, tracks[] (applied|ml|lm|dotnet|python),
  effort ("NN–NN h"), confirmed, problem, concept, results[{text, date, caveat}], workflow[], tech[[layer,
  suggested, alternatives]], example{input, output}, project, acceptance[], risks[], sources[{title, publisher, type}]`.
  **No `url` field.** `confirmed` and `results` contain only what sources state; the page labels `workflow`/`tech`
  as the guide's suggested design, not the company's system. New sources go into `CONTENT_SOURCES.md` with URL,
  date and confidence.
- **Capstones** (`projects.mjs`): `id, n, title, track (applied|ml|lm), level, effort, reuses[], requirement,
  prereqs[], architecture[], steps[], python, dotnet, io{input, output}, data, tests[], rubric[], stretch[],
  security, acceptance[], structure, evidence`.
- **Roadmaps** (`curriculum.mjs`): node `n, title, short, effort ("X–Y h", both numbers are parsed by the
  calendar), desc, lessons[], projects[]`. The overview strip supports 9, 10 or 12 steps (`.steps-9/10/12` in
  app.css); add a class for another count.
- **Hardware** (`reference.mjs`): tiers with `cost` (existing|low|medium|high|usage), `spec{}`,
  `supports{workload: yes|limited|no}`, `note`. **No prices** (not verified); add one only with a dated source,
  labelled "estimate, region-dependent".
- **Glossary:** `[term, plain definition, lessonId]`. **Checkpoints:** `{id, title, questions[{q, options[],
  answer (0-based index), why}]}`, one per part.

---

## 8. Curriculum inventory (current)

**Part 1: The big picture** (module `start`, page `part-1-start.html`, folder `src/content/lessons/start/`)

| # | id | Title | Level | Min | Related concepts |
|---|---|---|---|---|---|
| 1 | `s-what-is-ai` | What AI, machine learning, deep learning and generative AI are | Beginner | 60 |  |
| 2 | `s-lifecycle` | How an AI or ML project runs from idea to production | Beginner | 75 |  |
| 3 | `s-setup` | Set up your laptop for AI and ML in Python and .NET | Beginner | 90 |  |

**Part 2: Data** (module `data`, page `part-2-data.html`, folder `src/content/lessons/data/`)

| # | id | Title | Level | Min | Related concepts |
|---|---|---|---|---|---|
| 1 | `d-basics` | Data basics: types, features, labels and splits | Beginner | 60 |  |
| 2 | `d-collect` | Collecting and labelling data, with SQL | Beginner | 90 | yes |
| 3 | `d-clean-eda` | Cleaning and exploring data | Beginner | 90 |  |
| 4 | `d-features` | Feature engineering: turning raw data into model inputs | Intermediate | 90 |  |

**Part 3: Machine learning** (module `ml`, page `part-3-ml.html`, folder `src/content/lessons/ml/`)

| # | id | Title | Level | Min | Related concepts |
|---|---|---|---|---|---|
| 1 | `ml-learning` | How a model learns: loss, training and overfitting | Beginner | 75 |  |
| 2 | `ml-regression` | Regression: predicting a number | Beginner | 75 |  |
| 3 | `ml-classification` | Classification: picking a category | Beginner | 75 | yes |
| 4 | `ml-algorithms` | The main ML algorithms and when to use each | Intermediate | 90 | yes |
| 5 | `ml-unsupervised` | Unsupervised learning: groups, compression and anomalies | Intermediate | 75 |  |
| 6 | `ml-evaluation` | Measuring models honestly | Intermediate | 90 |  |
| 7 | `ml-improve` | Improving and explaining models | Intermediate | 90 |  |
| 8 | `ml-timeseries` | Time-series forecasting | Intermediate | 75 |  |
| 9 | `ml-recommenders` | Recommender systems | Intermediate | 75 |  |

**Part 4: Deep learning** (module `dl`, page `part-4-deep-learning.html`, folder `src/content/lessons/dl/`)

| # | id | Title | Level | Min | Related concepts |
|---|---|---|---|---|---|
| 1 | `dl-neural-nets` | Neural networks in plain words | Intermediate | 90 |  |
| 2 | `dl-training` | Training deep networks well | Intermediate | 90 | yes |
| 3 | `dl-vision` | Computer vision: classification, detection and segmentation | Intermediate | 90 | yes |
| 4 | `dl-sequences` | Text and sequences: tokens, embeddings and RNNs | Intermediate | 75 |  |
| 5 | `dl-transformers` | Transformers and attention | Intermediate | 90 |  |
| 6 | `dl-generative` | Generative models: autoencoders, GANs and diffusion | Advanced | 75 |  |
| 7 | `dl-speech` | Speech and audio: recognition and text-to-speech | Advanced | 60 |  |
| 8 | `dl-rl` | Reinforcement learning | Advanced | 75 |  |
| 9 | `dl-graphs` | Graph neural networks: learning from connections | Advanced | 60 |  |

**Part 5: Large language models** (module `llm`, page `part-5-llms.html`, folder `src/content/lessons/llm/`)

| # | id | Title | Level | Min | Related concepts |
|---|---|---|---|---|---|
| 1 | `llm-how` | How large language models work | Intermediate | 75 |  |
| 2 | `llm-tokens` | Tokens and sampling settings | Intermediate | 60 |  |
| 3 | `llm-design` | Designing a language model | Advanced | 75 | yes |
| 4 | `llm-train-laptop` | Train a small language model on your laptop | Advanced | 120 |  |
| 5 | `llm-scale` | From laptop to big hardware: scaling training | Expert | 90 |  |
| 6 | `llm-finetune` | Fine-tuning: SFT, LoRA, QLoRA and preference tuning | Advanced | 90 |  |
| 7 | `llm-local` | Running language models on your own machine | Intermediate | 75 | yes |
| 8 | `llm-eval` | Evaluating language models | Advanced | 60 |  |

**Part 6: Building AI applications** (module `apps`, page `part-6-ai-apps.html`, folder `src/content/lessons/apps/`)

| # | id | Title | Level | Min | Related concepts |
|---|---|---|---|---|---|
| 1 | `app-llm-api` | Calling an LLM from your application | Beginner | 75 |  |
| 2 | `app-prompting` | Prompt engineering that works in production | Beginner | 60 | yes |
| 3 | `app-embeddings` | Embeddings and vector search | Intermediate | 75 |  |
| 4 | `app-rag` | RAG: answering from your own documents | Intermediate | 120 |  |
| 5 | `app-rag-advanced` | Advanced RAG: chunking, hybrid search, re-ranking and evaluation | Advanced | 90 | yes |
| 6 | `app-agents` | Tools and agents with human approval | Advanced | 120 | yes |
| 7 | `app-frameworks` | AI frameworks and MCP: what to use in Python and .NET | Intermediate | 60 |  |
| 8 | `app-multimodal` | Multimodal AI apps: images, documents and voice | Intermediate | 60 |  |
| 9 | `app-evals` | Evaluating AI applications | Intermediate | 75 |  |
| 10 | `app-security` | Security for AI applications | Advanced | 75 | yes |
| 11 | `app-responsible` | Responsible AI: fairness, privacy, transparency and oversight | Intermediate | 60 | yes |

**Part 7: Production** (module `ops`, page `part-7-production.html`, folder `src/content/lessons/ops/`)

| # | id | Title | Level | Min | Related concepts |
|---|---|---|---|---|---|
| 1 | `ops-serving` | Serving a model as an API | Intermediate | 90 |  |
| 2 | `ops-mlops` | MLOps: versioning, pipelines and safe releases | Advanced | 90 | yes |
| 3 | `ops-monitoring` | Monitoring models and AI apps in production | Advanced | 75 |  |
| 4 | `ops-scale` | Speed, cost and scaling | Advanced | 75 | yes |
| 5 | `ops-architecture` | Production architecture for AI systems | Expert | 120 |  |

**Roadmaps** (ids are URL hashes, e.g. `roadmaps.html#ml`; step anchors `#node-<id>-<n>`):
- `applied` "Quick path: complete grip", 10 steps: big picture and setup → data → core ML → measure, improve and
  apply ML → deep learning → LLMs → talk to models and add knowledge (RAG) → agents, multimodal and trust →
  production → capstones and real cases (c01, c04, c06).
- `ml` "ML engineer view", 9 steps, ending with capstones c01, c02, c03.
- `lm` "AI engineer view", 9 steps, ending with capstones c04, c05, c07.

**Start routes on the home page:** `quick` (get a complete grip), `apps` (build AI apps first), `models` (train
models first).

**Capstones:** c01-churn (ML), c02-forecast (ML), c03-vision (ML, Advanced), c04-rag-assistant (AI application),
c05-agent (AI application, Advanced, reuses c04), c06-tiny-llm (language models, Advanced), c07-local-assistant
(language models, Advanced, reuses c04).

**Company cases (11):** Morgan Stanley (RAG assistant), Klarna (support agent, including its 2025 return to human
staff), Indeed (fine-tuning), Duolingo (LLM features), John Deere (computer vision), Google DeepMind (data-centre
cooling), Intercom Fin (support agent), Moderna (enterprise assistants), Lowe's (associate assistant), GitHub
Copilot (code assistant), Toyota (manufacturing ML platform).

**Checkpoints:** cp-start (3 questions), cp-data (3), cp-ml (4), cp-dl (3), cp-llm (4), cp-apps (4), cp-ops (4).

**Hardware tiers:** existing machine, budget laptop with GPU, low-cost desktop (16 GB GPU), medium desktop,
high-end workstation, cloud GPU. Plus GPU memory arithmetic, a "laptop to large-scale" table and machine checks.

---

## 9. Examples (`examples/`)

All data synthetic, fixed random seeds. Requires Python 3.10+, numpy, pandas, scikit-learn.

- **`quickpath/quickpath.py <demo>`**, the main file for this guide. Demos: `env`, `rules_vs_ml`, `lifecycle`,
  `data`, `anomaly`, `pca`, `bpe`, `bigram`, `sampling`, `llm_size`, `lora`, `chunking`, `hybrid`, `pii`,
  `fairness`, `cache`, `serving` (a real stdlib HTTP model server with /health, /predict, a 400 on bad input and a
  latency measurement), `registry` (champion/challenger promotion gate), `batching`, or `all`.
  Sample real outputs:
  - `rules_vs_ml`: a keyword rule scores 0.42 accuracy and the learned model 1.00.
  - `lifecycle`: churn rate 20.2%, baseline accuracy 0.798, model accuracy 0.818, recall 0.238.
  - `registry`: logistic regression AUC 0.877 beats gradient boosting 0.874.
  - `cache`: a 99.2% hit rate takes cost from 10.00 to 0.08 (illustrative price).
  - `serving` and `batching`: timings depend on the machine.
- `ml-basics/ml_basics.py` (features, quality, gd, cv, kmeans, metrics, drift: PSI 0.005 vs 0.496)
- `gap-topics/gap_topics.py` (sql, viz, regression, svm, roc, tune, interp, wordvec, timeseries, recsys, vision,
  speech, gnn, pg)
- `ai-extras/ai_extras.py` (algos, nn, conv, rnn, dropout, diffusion, qlearn)
- `applied-ai-basics/applied_basics.py` (cosine, evals, latency: TTFT p50 0.28 s, 41.4% over a 5 s budget)
- `math/math_for_ai.py abtest` (A/B significance used by app-evals)
- `spam-classifier/`, `attention/`, `tiny-lm/` (NumPy character LM, about 2 s on CPU), `memory-estimate/`,
  `rag-leave-policy/` (offline retrieval), `agent-returns/` (approval workflow), `llm-summarizer/` (schema
  validation + unit tests, `--offline`), `hybrid-service/` (FastAPI + ASP.NET Core client; not run)
- **`lesson-code/`** is generated by `npm run extract:code`: 44 Python files (1 commented-out fragment) and
  50 C# files, one folder per lesson. Edit the lesson, not these files.

---

## 10. Code status and known review findings

- **Python:** demos executed 2026-11-02/03. On 2026-11-03, 116 quoted output lines were re-checked against fresh
  runs with 0 mismatches.
- **C#: never compiled** (no .NET SDK; NuGet unreachable from the build environment). An independent desk
  review on 2026-11-03 fixed five issues:
  1. ml-recommenders: the label column was renamed from `Score` to `Label`, because `Score` collided with the
     trainer's output column.
  2. app-frameworks: MCP stdio server logs now go to stderr.
  3. app-agents: added `#pragma warning disable MEAI001` and a note that the approval types may be renamed. This
     finding is **uncertain**; verify it.
  4. app-responsible: uses `TryGetValue` for groups with no qualified applicants.
  5. ops-mlops: added a `Customer` class with `[ColumnName("Label")]`.
- **Not run:** FastAPI, MLflow, PyTorch, TorchSharp, LangChain/LangGraph, Ollama/hosted model calls,
  skl2onnx, Docker. Each block is labelled.
- APIs used in C#: ML.NET (FastTree, LightGbm, AutoML, MatrixFactorization, ForecastBySsa), Microsoft.Extensions.ML
  `PredictionEnginePool`, ONNX Runtime, TorchSharp, Microsoft.Extensions.AI (`IChatClient`,
  `IEmbeddingGenerator`, `GetResponseAsync<T>`), OllamaSharp, Microsoft Agent Framework, MCP C# SDK,
  Microsoft.Extensions.VectorData, Whisper.net, Microsoft.ML.Tokenizers, ASP.NET Core minimal APIs,
  OpenTelemetry metrics, Microsoft.Extensions.Http.Resilience.

---

## 11. UI, client behaviour and security constraints

- **Theme tokens** at the top of `app.css` (`--bg --surface --ink --line --accent --accent-ink --link --applied
  --ml --lm --ok-* --warn-* --bad-* --focus` …). Dark values are defined **twice**: inside
  `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and in `:root[data-theme="dark"]`.
  Update both. Never hard-code colours.
- **Layout states** on `<html>`: `data-theme`, `data-sidebar="hidden"`, `data-focus="on"`, set early by
  `INLINE_SCRIPT`. Below 1024 px the sidebar is a drawer (scrim, `inert` main, Escape closes, focus returns).
  Lessons: `.lesson-layout` with a sticky right `.lesson-rail` (facts, prerequisites, roadmap steps, contents) at
  ≥ 1200 px.
- Reusable classes: `.card-list` (`.two`, `.stage-grid`), `.card`, `.badge(-beginner|…)`, `.table-wrap
  .stack-on-mobile`, `.hflow` (horizontal flow; `.vertical-sm` vertical), `.flow .node .node-card` (step lists),
  `.callout-note|warn`, `.two-col`, `.three-col`, `.track-grid`, `.route-grid`, `.btn`, `.btn-primary`,
  `.btn-small`, `.kv`, `.plain-list`.
- **CSP** (generated in build.mjs): `default-src 'self'`; the only inline script is `INLINE_SCRIPT` (its SHA-256
  hash is recomputed automatically). **No inline `style=""` attributes and no new inline `<script>`**; JSON blocks
  with `type="application/json"` are fine; JS may set `element.style.x`.
- **Storage** `aimlqp.v1` = `{ version: 1, prefs: {theme, sidebar, focus}, progress: {"lesson:<id>"|"project:<id>"|
  "skill:<id>": {done, at}} }`. All access in try/catch; the site works with storage blocked (a warning shows).
  Export `{schema:"aimlqp-progress", version:1, exportedAt, progress}`; import validates schema, version and id
  pattern `^(lesson|project|skill):[a-z0-9-]+$`. If you change the schema, bump the version and keep importing v1.
- **Filters:** `.filters[data-filter-target="#list"]` + `select[data-filter="key"]` (option values slugified) +
  `[data-filter-text]` + `[data-filter-reset]` + `.filter-status` + following `.empty-state`; cards carry
  `data-<key>="slug slug"` and `data-text`. `filterBar()` in pages.mjs accepts option strings or `[label, value]`.
- **Search:** `dist/assets/search-index.js` (`window.SEARCH_INDEX`), loaded as a script so it works from `file://`.

---

## 12. Tests and the expectations that depend on content

`tests/e2e.mjs` contains numbers tied to the current content. If you add or move content, update these
deliberately and say so:
- 89 pages. Roadmap steps `[10,9,9]`. Calendar rows for roadmap `lm` = 9.
- Catalogue: 49 lessons; part `3-machine-learning` = 9; part 3 + Intermediate = 6; part 3 + Expert = 0;
  "Python output from a real run" ≥ 40.
- Capstones 7 total, 3 machine learning, 2 language models.
- Glossary ≥ 100 terms; searching "drift" shows 2–4 terms.
- Cases 11; industry Finance = 1; Finance + Advanced = 0.
- Hardware: workload "Distributed training" = 1 tier; plus cost Low = 0.
- Sidebar filter "rag" shows exactly 2 lessons, both containing "RAG".
- Progress test marks `ml-classification`, so the sidebar count is "1/9" and the dashboard shows "1 of 9".
- The quiz test answers `cp-ml` question 0 with option 1.
- Search for "kv cache" must return a result matching /KV cache|scale|local/.
- KEY pages list (used for the 9-width overflow test) names specific lesson and page paths.
Static checks: zero external links, no web addresses in visible text except localhost.

---

## 13. Open items and suggested enhancement backlog

Do these in priority order unless the owner asks otherwise. Each needs build + static + e2e passing.

1. **Compile every C# sample** (the owner can run .NET locally). For each folder in
   `examples/lesson-code/dotnet/`, create a scratch project (`dotnet new console` or `dotnet new web`), add the
   packages the lesson names, compile, fix errors **in the lesson file**, rerun `npm run extract:code`, and change
   that lesson's `code:` label to e.g. "C# compiled with .NET 9 SDK 2026-11-xx (Microsoft.ML 4.x)". Resolve the
   uncertain MEAI001 / approval-type naming in app-agents against the installed package. Consider adding
   `examples/dotnet/QuickPath.sln` with one project per lesson so it compiles in one command, and a
   `npm run test:dotnet` script that runs `dotnet build` when the SDK exists.
2. **Run the not-run Python code** (FastAPI serving, MLflow, skl2onnx export, PyTorch training, Ollama) on a
   machine with those packages, paste the real outputs and update labels.
3. **Cross-browser and screen-reader pass:** run Playwright with Firefox and WebKit (add a browser option to
   e2e.mjs); fix differences; note results in QA_REPORT.md.
4. **Content depth where learners usually struggle:** more worked "solve any case" examples (finance fraud,
   healthcare triage, retail search, manufacturing predictive maintenance), each linked to lessons; a "debugging
   a model" walkthrough; an end-to-end "first week at an AI job" scenario.
5. **Interview preparation page:** common interview questions per role with plain-words answers linked to lessons
   (no external links).
6. **Search quality:** index lesson section headings and glossary definitions with better ranking.
7. **Optional offline extras:** downloadable Jupyter notebooks generated from the Python demos.
Keep the three defining rules throughout.

---

## 14. Working protocol for every request

1. Restate the request in one or two lines and list the files you will touch.
2. Read the relevant files first; follow existing patterns; prefer editing content and data over new mechanisms.
3. Make small, focused changes. For content: write in the lesson template, quote only real outputs, keep the
   no-maths and no-links rules, and add both Python and C#.
4. Run the definition of done (section 6). Fix failures; never weaken tests.
5. Report: what changed (files), commands run and their real results, anything not verified, and one suggested
   next step.
6. Ask first before adding dependencies, changing formats or the lesson template, deleting content, or making
   claims you cannot verify.

---

## 15. First session (do this when you first read this file)

1. Read `CLAUDE.md`, `README.md`, `QA_REPORT.md`, `PROJECT_PLAN.md`, `src/data/curriculum.mjs`,
   `src/lib/markdown.mjs`, `scripts/build.mjs`, and two lessons (`src/content/lessons/apps/app-rag.md`,
   `src/content/lessons/ops/ops-serving.md`).
2. Run `npm run build` and `npm run test:static`. If Playwright is installed, run `npm run test:e2e`. If Python is
   available, run `npm run test:examples`. If the .NET SDK is available, run `dotnet --version`.
3. Report the real results, confirm you understand the three defining rules, and propose a short plan for
   backlog item 1 (compile the C# samples), or for whatever the owner asks next. Do not start editing until the
   owner replies.
