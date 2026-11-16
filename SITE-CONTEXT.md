# AI & ML Quick Path: full site context

Written 2026-11-13. All numbers come from the data files and lesson front matter in this repository, read on that date.

## What the site is

- Product: a free static learning website called "AI & ML Quick Path: From Concepts to Industry".
- Audience: beginners with no AI background who can program a little (or are learning). They want to build industry AI and ML applications and do not want heavy mathematics.
- Promise: every main concept in plain words, how industry uses it, and working examples in both Python and .NET (C#).
- Technology: a zero-dependency Node.js static site generator. Playwright is used for tests only. There is no backend, no sign-in and no analytics. Progress is saved in the visitor's browser under the key `aimlqp.v1`.
- Repository: https://github.com/musmannasir/ai-ml-quick-path (public, branch `main`).
- Build output: 92 pages, about 4.2 MB in 99 files.

## Scale

| Item | Count |
|---|---|
| Lessons | 50, in 7 parts |
| Study time | about 4,005 minutes (roughly 67 hours), a study estimate |
| Lesson words | about 98,900 |
| Diagrams | 432 (at least 3 per lesson) |
| Lessons with an Applied Maths - Statistics section | 48 |
| Capstone projects | 8 |
| Real company case studies | 11 |
| Roadmaps | 3 (10, 9 and 9 steps) |
| Glossary terms | 166 |
| Checkpoint quizzes | 7 (32 questions in total since 2026-11-16) |
| Pages | 92 |

Lesson levels: Beginner 11, Intermediate 22, Advanced 15, Expert 2.

## The 7 parts and their lessons

### Part 1: The big picture (3 lessons)
- s-what-is-ai: What AI, machine learning, deep learning and generative AI are (Beginner, 60 min)
- s-lifecycle: How an AI or ML project runs from idea to production (Beginner, 75 min)
- s-setup: Set up your laptop for AI and ML in Python and .NET (Beginner, 90 min)

### Part 2: Data (4 lessons)
- d-basics: Data basics: types, features, labels and splits (Beginner, 60 min)
- d-collect: Collecting and labelling data, with SQL (Beginner, 90 min)
- d-clean-eda: Cleaning and exploring data (Beginner, 90 min)
- d-features: Feature engineering: turning raw data into model inputs (Intermediate, 90 min)

### Part 3: Machine learning (9 lessons)
How learning works:
- ml-learning: How a model learns: loss, training and overfitting (Beginner, 75 min)
- ml-regression: Regression: predicting a number (Beginner, 75 min)
- ml-classification: Classification: picking a category (Beginner, 75 min)
- ml-algorithms: The main ML algorithms and when to use each (Intermediate, 90 min)
- ml-unsupervised: Unsupervised learning: groups, compression and anomalies (Intermediate, 75 min)

Measure and improve:
- ml-evaluation: Measuring models honestly (Intermediate, 90 min)
- ml-improve: Improving and explaining models (Intermediate, 90 min)

Common industry problems:
- ml-timeseries: Time-series forecasting (Intermediate, 75 min)
- ml-recommenders: Recommender systems (Intermediate, 75 min)

### Part 4: Deep learning (9 lessons)
Neural networks:
- dl-neural-nets: Neural networks in plain words (Intermediate, 90 min)
- dl-training: Training deep networks well (Intermediate, 90 min)

Model families:
- dl-vision: Computer vision: classification, detection and segmentation (Intermediate, 90 min)
- dl-sequences: Text and sequences: tokens, embeddings and RNNs (Intermediate, 75 min)
- dl-transformers: Transformers and attention (Intermediate, 90 min)
- dl-generative: Generative models: autoencoders, GANs and diffusion (Advanced, 75 min)
- dl-speech: Speech and audio: recognition and text-to-speech (Advanced, 60 min)
- dl-rl: Reinforcement learning (Advanced, 75 min)
- dl-graphs: Graph neural networks: learning from connections (Advanced, 60 min)

### Part 5: Large language models (8 lessons)
How LLMs work:
- llm-how: How large language models work (Intermediate, 75 min)
- llm-tokens: Tokens and sampling settings (Intermediate, 60 min)

Design and train:
- llm-design: Designing a language model (Advanced, 75 min)
- llm-train-laptop: Train a small language model on your laptop (Advanced, 120 min)
- llm-scale: From laptop to big hardware: scaling training (Expert, 90 min)

Adapt, run and evaluate:
- llm-finetune: Fine-tuning: SFT, LoRA, QLoRA and preference tuning (Advanced, 90 min)
- llm-local: Running language models on your own machine (Intermediate, 75 min)
- llm-eval: Evaluating language models (Advanced, 60 min)

### Part 6: Building AI applications (12 lessons)
Talking to models:
- app-llm-api: Calling an LLM from your application (Beginner, 75 min)
- app-prompting: Prompt engineering that works in production (Beginner, 60 min)

Knowledge: embeddings and RAG:
- app-embeddings: Embeddings and vector search (Intermediate, 75 min)
- app-rag: RAG: answering from your own documents (Intermediate, 120 min)
- app-rag-advanced: Advanced RAG: chunking, hybrid search, re-ranking and evaluation (Advanced, 90 min)

Actions: tools and agents:
- app-agents: Tools and agents with human approval (Advanced, 120 min)
- app-frameworks: AI frameworks and MCP: what to use in Python and .NET (Intermediate, 60 min)
- app-multimodal: Multimodal AI apps: images, documents and voice (Intermediate, 60 min)

Quality and trust:
- app-evals: Evaluating AI applications (Intermediate, 75 min)
- app-security: Security for AI applications (Advanced, 75 min)
- app-responsible: Responsible AI: fairness, privacy, transparency and oversight (Intermediate, 60 min)

Advanced: the whole picture:
- app-genai-agentic: Generative AI and Agentic AI: the whole picture (Advanced, 60 min)

### Part 7: Production (5 lessons)
- ops-serving: Serving a model as an API (Intermediate, 90 min)
- ops-mlops: MLOps: versioning, pipelines and safe releases (Advanced, 90 min)
- ops-monitoring: Monitoring models and AI apps in production (Advanced, 75 min)
- ops-scale: Speed, cost and scaling (Advanced, 75 min)
- ops-architecture: Production architecture for AI systems (Expert, 120 min)

## How every lesson is built

Every lesson has the same sections, in this order:

1. In plain words
2. Real-world example
3. How it works
4. Python example
5. .NET (C#) example
6. Applied Maths - Statistics (where it applies; 48 of 50 lessons)
7. Maths behind it (a list of names that feeds the Maths map page)
8. Common mistakes
9. Quick check (2 to 5 questions)

Details:
- The maths section is collapsible. Each topic has the main formula, a plain-words meaning and at least two worked examples. There are no derivations or proofs. The numbers are labelled as made-up and illustrative.
- Diagrams are accessible HTML and CSS, with no images or scripts. Diagrams always sit below the text, never beside it.
- Each lesson shows pills for the Python and C# code status.
- Lesson text flows into two columns on wide screens, while diagrams, code and tables stay full width.

## Learning paths and practice

### Roadmaps
- **Quick path: complete grip (10 steps):** big picture and setup (4–6 h); data skills (8–12 h); core machine learning (12–18 h); measure, improve and apply ML (8–12 h); deep learning (14–20 h); large language models (14–20 h); talk to models and add knowledge (10–14 h); agents, multimodal and trust (12–16 h); production (10–14 h); capstones and real cases (30–60 h).
- **ML engineer view (9 steps):** big picture and setup; data; supervised learning; algorithms and unsupervised learning; evaluation and improvement; forecasting and recommendations; deep learning; MLOps and production; capstones.
- **AI engineer view (9 steps):** big picture and setup; enough data and ML; how LLMs work; calling models and prompting; embeddings and RAG; agents and multimodal apps; quality, security and responsibility; own and run models; capstones.

### Capstone projects (8)
| Id | Title | Track | Level | Effort |
|---|---|---|---|---|
| c01-churn | Customer churn prediction service | ML | Intermediate | 20–30 h |
| c02-forecast | Store demand forecasting | ML | Intermediate | 20–30 h |
| c03-vision | Visual defect inspection | ML | Advanced | 25–40 h |
| c04-rag-assistant | Company knowledge assistant (RAG) | Quick path | Intermediate | 20–35 h |
| c05-agent | Order-returns agent with human approval | Quick path | Advanced | 25–40 h |
| c06-tiny-llm | Train a small language model on your laptop | Language models | Advanced | 25–40 h |
| c07-local-assistant | Private assistant running fully on a laptop | Language models | Advanced | 20–30 h |
| c08-lora-finetune | Fine-tune a small model with LoRA | Language models | Advanced | 20–30 h |

Each capstone has both a Python route and a .NET route, plus architecture, steps, tests, a rubric, stretch goals, security notes and acceptance criteria.

### Company case studies (11)
| Company | Industry | Category | Difficulty |
|---|---|---|---|
| Morgan Stanley | Finance | RAG / knowledge assistant | Intermediate |
| Klarna | Commerce | Agents / customer support | Intermediate |
| Indeed | Hiring | Fine-tuning | Advanced |
| Duolingo | Education | LLM product features | Intermediate |
| John Deere | Agriculture | Computer vision | Advanced |
| Google DeepMind | Infrastructure | Predictive ML | Advanced |
| Intercom | Customer support | Agents / customer support | Intermediate |
| Moderna | Life sciences | Enterprise assistants / data analysis | Intermediate |
| Lowe's | Retail | RAG / knowledge assistant | Intermediate |
| GitHub | Developer tools | Code assistants | Intermediate |
| Toyota | Manufacturing | ML platform / computer vision | Advanced |

Sources are shown on the site as title plus publisher text, with no links. The URLs live only in CONTENT_SOURCES.md. The results on each case page contain only what the sources state; the workflow and tech suggestions are the guide's own design and are labelled as such.

### Other pages
- Home, a 12-week plan with a study calendar, roles, roadmaps, a lesson catalogue with filters.
- "Solve" decision guide (how to approach any AI case), Maths map (generated from every lesson's maths section).
- 7 part overview pages, hardware guide (6 tiers: existing laptop with no GPU, budget laptop with an entry GPU, low-cost desktop, medium desktop, high-end workstation, professional or cloud GPU access; no prices because none were verified), 8 workloads.
- Glossary (166 terms), assessment (7 checkpoint quizzes, one per part), progress page (JSON export, import and reset), about, privacy and cookies, 404.

## Design and features

- Teal accent with a lighter, flatter look (owner decision 2026-11-11). Track colours: Quick path is teal, ML is blue, language models are violet.
- Light, dark and system themes. The dark values are defined twice in the stylesheet.
- Collapsible sidebar and a collapsible lesson side panel, each with a slim edge tab on large screens. The choices are saved in the browser.
- Mobile drawer, focus mode, filters and search (simple term matching), themed thin scrollbars.
- Target: WCAG 2.2 AA in both themes. The e2e tests measure contrast, keyboard use, focus visibility, accessible names and horizontal scroll from 320 to 1920 px.

## Rules that shape the content

1. Real teaching content, never placeholders.
2. Honesty: no invented facts, metrics, citations, benchmarks or prices. Quoted outputs come from real runs. Never claim code ran if it did not.
3. Plain international English with every term defined on first use. Durations are study estimates and quizzes are self-checks.
4. Privacy: no backend, no sign-in, no analytics, no external fonts or images, no external scripts (except the optional AdSense build).
5. Self-contained by default: the build and the static test fail on any external link. The owner may add external reference links later.
6. Python and .NET (C#) in every lesson.
7. Maths is applied, short and practical. No claims of "no maths".

## Advertising (Google AdSense)

An AdSense build mode exists and is off by default. It needs the environment variables `ADSENSE_CLIENT` and `SITE_URL`, and later `ADS_SLOTS` with slot ids. No publisher or ad ids are stored in the repository. Ads never appear inside lesson text, diagrams, code, quizzes or on the home, progress, about, privacy and 404 pages. Google supports only a nonce-based CSP, so the ads build sends the CSP as Report-Only.

## Honest status of the code and testing

- **Python:** 32 of 50 lessons say "Python executed" in their front matter. The other 18 are labelled as not run here (for example FastAPI, MLflow, PyTorch and LangGraph snippets).
- **C#:** 0 of 50 lessons are compiled. 37 are labelled "not compiled"; the other lessons carry no compile claim. Compiling them is the first verification debt. The .NET SDK 10.0.400 is installed on this machine.
- `npm run test:examples` has not been run on this machine, because scikit-learn is not installed.
- **Browser tests:** the e2e suite (52 checks) passes in Playwright Chromium on this machine. It ran in Microsoft Edge and Google Chrome on the original machine. Firefox was checked by screenshots only. Safari and real phones are untested.
- **Never done:** screen-reader testing and an independent subject-matter review of the lesson text.
- **Last real results (2026-11-11):** build 92 pages; static checks 92 pages, 9,463 internal links, 0 external links; e2e 52 of 52.

## Known stale text

- README.md says "158-term glossary", but the data has 166 terms.
- The home page says "there are no outside links to follow", which no longer matches the owner decision that external links may be added later.

## Hosting and repository state

- GitHub: the code is pushed to `main`. Commits use the GitHub noreply address.
- The GitHub Pages workflow `.github/workflows/deploy.yml` runs only by hand (`workflow_dispatch`).
- Planned hosting: Cloudflare Pages on the free plan. Build command `npm run build`, output directory `dist`, environment variables `NODE_VERSION=22` and `SITE_URL`. `dist/_headers` carries the security headers. Nothing has been deployed yet.
- Domain: not chosen. A free `*.pages.dev` address works for testing, but sources suggest AdSense approval is safer on an owned domain. The existing toolquarter.com domain will not be used for this site.

## Pending items for the owner

1. Domain for `SITE_URL`.
2. Contact email for the privacy page (`CONTACT_EMAIL`).
3. Hosting decision (Cloudflare Pages is the current plan).
4. AdSense publisher id, and later the ad unit ids.
5. Wording of the home page line about outside links, and the README glossary count.
6. Go-ahead for the verification debts: compile the C# samples, run the Python samples after installing scikit-learn, and recheck the Applied Maths numbers.

## Where to read more

- CLAUDE.md: the authoritative rules for working on the project.
- README.md, DEPLOYMENT.md, CONTENT_SOURCES.md, QA_REPORT.md, PROJECT_PLAN.md.
- HANDBACK-2026-11-05.md: what changed in the second-machine sessions, with real test results.
- migration-src/: product context, decisions, design and open items.
