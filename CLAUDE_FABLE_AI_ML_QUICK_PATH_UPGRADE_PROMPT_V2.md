# MASTER EXECUTION PROMPT V2 — AI & ML Quick Path: From Concepts to Industry

> **Purpose:** Give this complete prompt to Claude Code using your chosen capable Claude model (Fable or another available model). This is an **upgrade directive for the existing repository**, not a request to make another site, mockup, or plan. 
>
> **Context reviewed:** `SITE-CONTEXT.md`, dated 2026-11-13, and the previous AI/ML Academy upgrade specification. **The current repository and its `CLAUDE.md` remain the authority for actual code and project rules.**
>
> **Owner priorities, in order:** (1) a fresh learner truly understands every topic; (2) mathematics is taught **in context, only where useful, with small everyday examples**; (3) extraordinary but calm, accessible, practical UI/UX; (4) reliable Python and C# code and industry-grade learning; (5) organic discoverability and a **future** AdSense pathway without live ads today.

---

## 0. Your role, decision principles and first actions

Act as a multidisciplinary delivery team: principal AI and ML engineer, LLM systems engineer, .NET architect, Python engineer, mathematics educator, instructional designer, learning-experience (LX) designer, UI/UX design director, accessibility specialist, technical editor, QA engineer, SEO specialist and static-site deployment engineer.

**Your assignment is to improve the existing site `AI & ML Quick Path: From Concepts to Industry` to the quality of a professional, trustworthy global learning platform.** Optimize for comprehension, successful practice and verified competence—not number of pages, visual effects, or superficial claims of expertise.

### Read before changing anything

1. Read `SITE-CONTEXT.md` in full. Read `CLAUDE.md` in full: it contains authoritative development rules. Inspect `README.md`, `PROJECT_PLAN.md`, `CONTENT_SOURCES.md`, `QA_REPORT.md`, `DEPLOYMENT.md`, `HANDBACK-2026-11-05.md`, `migration-src/` and the original academy master prompt if present. Resolve contradictory instructions by preferring an explicit *new owner requirement in this prompt* over older plans, while preserving safety and verified facts.
2. Inspect the **actual repository** at `https://github.com/musmannasir/ai-ml-quick-path`, branch `main`, or the local checked-out equivalent. Read code, templates, styles, lesson front matter, every lesson family, tests, static generator, ad build mode, build output, sample executables and git status. Never assume files are identical to the 2026-11-13 context snapshot.
3. Record a **verified baseline** with paths, counts, screenshots and test commands in `docs/audits/BASELINE_2026_UPGRADE.md`. Distinguish `observed in repository`, `reported in SITE-CONTEXT.md`, `externally verified`, and `not yet checked`. Do not misrepresent metadata flags as actual successful builds.
4. Build a traceability matrix of present functionality, missing pedagogy, mathematics accuracy, UI defects, code/test debts, resource policy, SEO and future AdSense readiness. Preserve URLs, content, user preferences and local progress where possible.
5. Make a safe feature branch. Do not force push, reset over user changes, replace the entire generator for aesthetic reasons, deploy, activate ads or change external accounts without authorization.
6. **Begin implementation in the same session immediately after the audit**. Do not stop at an attractive design, outline or gap analysis. Work in manageable slices, verify each slice, update progress and continue.

### Snapshot from `SITE-CONTEXT.md` (verify; do not treat as guaranteed live counts)

- Site: `AI & ML Quick Path: From Concepts to Industry` — **not** the earlier `AI, ML & Language Model Engineering Academy` build.
- Existing architecture: **zero-dependency Node.js static-site generator**, Playwright for tests, no backend, no accounts, no analytics. Progress local to each browser under `aimlqp.v1`.
- Reported scale: **50 lessons in 7 parts**, ~98,900 lesson words, ~4,005 minutes of self-study estimates, **432 HTML/CSS diagrams**, 48 lessons with Applied Maths, 166 glossary terms, **8 capstones**, **11 documented company cases**, 3 roadmaps, 7 checkpoints / 25 questions, **92 generated pages** (~4.2 MB / 99 files).
- Levels currently labeled: 11 Beginner, 22 Intermediate, 15 Advanced, 2 Expert; these labels require honest mastery criteria rather than an implied guarantee of expertise.
- Three existing roadmaps: Quick Path (10 stages), ML Engineer (9), AI Engineer (9). The LM specialist material is embedded within the curriculum; consider whether a separate LM route is warranted without duplicating articles or disrupting these established paths.
- Existing visual identity: **lighter, flatter teal theme** (owner decision 2026-11-11); track colors **Quick Path = teal**, **ML = blue**, **language models = violet**. Preserve this identity, make it much more refined.
- Current reported tests as of **2026-11-11**: build 92 pages; 9,463 internal links, zero permitted external links; 52/52 Playwright browser tests passing. These are **historical results, not tests you have run**.
- Current code verification debt: Python execution asserted for 32/50 lesson snippets (other 18 not run); **0/50 lesson C# snippets compiled** (37 expressly not compiled, others lacking claims). `.NET SDK 10.0.400` reportedly installed. `npm run test:examples` has not run due to missing scikit-learn. Manual screen-reader testing and independent editorial review have not been done.
- Known issues: dark-theme token values defined twice; README says 158 glossary terms vs 166 in data; home-page text incorrectly implies external sources can never be linked; diagrams may be repetitive; lesson prose flows into two columns on wide screens; a static test currently fails any external link, making first-party source links inaccessible to readers.
- Future hosting: **Cloudflare Pages free tier** is planned; `npm run build` → `dist`, `NODE_VERSION=22`, `SITE_URL` once chosen; `_headers` exists. No production domain or deployment confirmed yet. GitHub Pages workflow is manual.
- Existing optional **AdSense build mode is OFF by default**, with `ADSENSE_CLIENT`, `SITE_URL` and eventually `ADS_SLOTS`. Preserve it; never fabricate IDs or display ads during this upgrade.

**Critical correction to the previous upgrade prompt:** This is already a sizable 50-lesson / ~99k-word resource, **not** a 41-lesson / 327-words-per-lesson starter site. Do not blindly add hundreds of thin articles, rewrite all content from scratch, switch to Astro without an engineering reason, insist on a standalone full math course before AI, or replace eight valid capstones with generic templates. Audit actual learning quality and fill demonstrated gaps.

---

## 1. Learning outcome and audience: explain, demonstrate, practice, prove

The main audience is a curious fresh learner with no AI/ML experience who may have a little programming knowledge—or may still be learning to program—and **does not want heavy abstract mathematics**. Also serve working Python/C# developers who want to accelerate to advanced applications.

A learner should understand:

1. **What is this?** Explain the idea in ordinary international English with unfamiliar words defined when first used.
2. **Where is it used?** Use a realistic, clearly labeled example, distinguishing illustrative designs from confirmed company implementations.
3. **How does it work?** Show sequential inputs → operations → outputs using tiny data sets before large architectures.
4. **Why does this matter?** Explain the specific problem the concept solves and when another tool might be better.
5. **What maths do I need right here?** If a calculation matters, teach only that calculation, slowly and in context. If no meaningful calculation is necessary, do not force maths into the lesson.
6. **What does the code do?** Show runnable Python and C# paths, explain important lines, prerequisites, expected output, pitfalls and tests.
7. **Can I do it myself?** Provide a change-one-variable task, hands-on lab, 2–5 checks with explanation and an observable result.
8. **Can I use it at work?** Move progressively toward architecture, requirements, security, evaluation, production incidents, deployment, monitoring and critical tradeoffs.

Do not promise that the ~67 hours currently labeled on lessons can make someone an industry expert. Separate **reading effort**, **practice effort**, **project effort** and **ongoing professional experience**. Use explicit capability milestones (can explain / implement / test / operate / make tradeoffs) rather than an automatic expert badge.

Offer friendly paths for: **Start from zero**, **I know some programming**, **I'm a C#/.NET developer**, **I'm a Python developer**, **Focus on ML**, **Focus on Applied AI**, and **Explore Language Models**. Let learners skip known material but show prerequisite notices. Do not require signup, payment or a paid inference provider to read or complete core content.

---

## 2. Mathematics — THE OWNER'S MOST IMPORTANT CONTENT REFINEMENT

### Math teaching philosophy: **at the point of need, never a separate obstacle**

Do **not** turn the site into a mathematics textbook. Do **not** force learners to finish a giant math academy before their first AI/ML exercise. Do **not** paste formula lists, proofs, variable-heavy notation, or two artificial calculations into every topic. Keep the current optional **Maths Map** as a navigable glossary/reference for when a learner wants a refresher.

**Integrate the required maths into the lesson at exactly the moment it becomes relevant**—ideally immediately before the algorithm, diagram or code uses it. The current “Applied Maths – Statistics” section can be retained where helpful, but reorganize it based on *learning flow*, not a fixed site-wide position after code. Lessons without relevant maths should say nothing about a mandatory maths section. Audit the existing 48/50 math sections for correctness, relevance, repetition and pedagogical value. Remove unnecessary examples and improve unclear ones rather than preserving the count.

### Standard math micro-lesson pattern (whenever math genuinely matters)

1. **Everyday situation:** Start with prices, temperatures, study scores, travel times, items sold, messages classified or a small vector; numbers should be easy to compute in your head.
2. **What are we trying to find?** One plain-English question and one tiny input table.
3. **Calculate by hand:** Show each arithmetic step on its own line (e.g. `2 + 4 + 6 = 12`, then `12 ÷ 3 = 4`). Do not skip substitutions or intermediate values.
4. **Only then show a formula** (if it helps). Translate each symbol into the familiar values and include units and rounding rules.
5. **Show why ML/AI uses it:** Tie the resulting number directly back to training, a prediction, a model metric, a token score or the current problem.
6. **Optional visual, not just decoration:** A meaningful labeled diagram, a small table, chart or controlled slider; include a nonvisual numeric/text equivalent.
7. **Try one change:** Ask the learner to change just one number; show an answer-reveal with an explanation, not only a checkmark.
8. **Connect to code:** Where useful, demonstrate the same values using short Python and C# code and confirm both produce the same result.
9. **Dig deeper (optional):** Put formal derivations, proofs and advanced notations behind an accessible `Understand the maths deeper` section, with clear prerequisites.

Keep each math bite compact enough that it **helps the learner continue the lesson**. Length depends on complexity; split only truly difficult sequences into several local steps. No fake claim that advanced ML needs no mathematics—teach progressively and offer deeper mathematics for specialist learners.

### Non-negotiable example benchmark — use this exact degree of clarity

**Averages in data preparation:** An online store sells 2, 4 and 6 items in three days. Add `2 + 4 + 6 = 12`. Divide by the number of days: `12 ÷ 3 = 4`. The average is **4 items per day**. Explain that averaging hides day-to-day differences. Then calculate in Python and C# and show result 4.

**Linear regression:** Suppose `predicted price = 2 × size + 1` with illustrative scaled numbers. For size 3, show `2 × 3 = 6` and `6 + 1 = 7`. Explain that the model learns numbers like 2 and 1; the example is not a real property price model. Plot a few points and permit one-number experimentation.

**Classification precision:** Of ten messages marked spam, eight are truly spam and two are not. `precision = 8 ÷ (8 + 2) = 0.8 = 80%`. Explain why a support team cares about false alarms. Separately contrast recall using an equally clear concrete example.

**Probability:** Three of ten randomly selected support tickets are urgent, so an illustrative empirical rate is `3 ÷ 10 = 30%`. Explain that this small example does not guarantee the next ticket has exactly a 30% probability without assumptions.

**Embedding similarity:** For short toy vectors `[1, 2]` and `[3, 4]`, a dot product is `1 × 3 + 2 × 4 = 11`. Explain that real embedding comparisons also depend on vector length/normalization and that this is a teaching example, not a measured semantic similarity score.

**Gradient descent:** For a toy loss `L(w) = (w − 3)²`, start at `w = 1`. The slope is `2(w−3) = −4`. With learning rate `0.1`, `new w = 1 − 0.1 × (−4) = 1.4`. Check old and new loss explicitly: `4` becomes `2.56`. Explain that this is one toy step, not the behavior of every optimizer.

**Transformer attention:** Start with a story about how a word can use surrounding context. Then use explicitly invented weights 0.75 and 0.25 to combine two simple values; if discussing real self-attention, explain Q/K/V shapes and softmax separately. Never claim these weights are what a real pretrained model learned.

### Curriculum-math mapping: revise each existing lesson

- Data basics, exploration, features → counts, percentages, average, range, missing-rate, variance, basic chart reading.
- Regression → coordinates, lines, coefficients, residual, MAE/MSE/RMSE with 2–4 values.
- Classification and evaluation → fractions, probabilities, threshold, confusion matrix, precision/recall/F1 and class imbalance.
- Unsupervised ML → distance, centroid, nearest neighbor, variance and dimensionality intuition.
- Time series and recommenders → simple trends, seasonal examples, moving averages, scores and similarity.
- Neural networks and training → weighted sum, activation intuition, loss, slope, gradients and one update; full calculus optional.
- Embeddings, transformer, LLM → vector/dot products, matrices/shapes, probabilities, token sampling, attention weights, cross-entropy intuition.
- Fine-tuning, training, GPU → tokens, batches, rates, parameter/bytes arithmetic, precision and realistic memory overhead warnings.
- Application quality, RAG, agents, security, production → test metrics, latency percentiles, error rates, throughput, token cost formulas and simple capacity arithmetic **only when relevant**.
- Conceptual/product/policy lessons → **skip maths when it adds no understanding**.

Make `Maths Map` a useful optional index: topic → one-sentence explanation → tiny worked example → links to lessons using it → optional deeper reading. Mark math difficulty on lessons (“none”, “basic arithmetic”, “algebra”, “advanced optional”), never “advanced maths required” when it is not.

### Math verification and UI tests

- Add machine-checkable tests for every arithmetic result and formula used in visible worked examples, wherever practicable. Cross-check sample outputs independently; no fabricated execution results.
- Distinguish toy numbers, sample datasets and actual sourced statistics with labels.
- Check correctness of units, rounding, denominators, percentages, train/test leakage, probability assumptions and vector shapes.
- Include **small interactive Math Moments**, but only where they improve understanding: average calculator, line/slope, confusion matrix, gradient step, embedding scores and token sampling. They must run locally without external APIs, be keyboard accessible, have predictable outputs, clear reset, valid bounds and a noninteractive fallback.
- Do not make a required math activity a compulsory gate before continuing a lesson.

---

## 3. Extraordinary educational UI/UX: premium, intuitive, measured

**Design goal:** A learner should feel guided by a well-designed technical academy, not stranded inside a textbook, drowned in a dashboard or distracted by a startup marketing page. The UI should be **beautiful because it makes learning calmer and easier**, not because it contains huge graphics, unnecessary gradients or animation.

Preserve the owner's newer **flat, refined teal identity** and existing Quick Path/ML/LM track colors. Improve typography, hierarchy, contrast, space, visual consistency and usability. Do not replace the brand with an unrelated template. Develop a small, cohesive design system and show visual before/after evidence.

### A. Design system and visual polish

- Define semantic tokens for all light/dark/system palettes, typography, spacing, containers, borders, elevations, focus, code blocks, diagrams, tables, tags, alerts, progress and disabled states. **Remove the known duplicate dark-theme token definitions and overlapping CSS overrides.**
- Visual tone: polished global developer education product; restrained teal accent; quiet neutral surfaces; excellent typographic rhythm and generous breathing room. Avoid meaningless big metrics, marketing fluff, unnecessary icons, repetitive nested cards and decoration that consumes reading space.
- Do not invent color-coded conceptual meanings; maintain Quick Path teal, ML blue, LM violet consistently on all roadmaps, tabs, cards and legends. Color alone must not convey status.
- Use a system font stack or licensed bundled fonts; never depend on external font CDNs. Optimize readability across writing, code, math, captions and tables.
- Verify real contrast in light/dark for all states (normal, hover, focus, selected, disabled, error, form inputs, code, maths, diagrams). WCAG 2.2 AA, with at least 4.5:1 normal text contrast and clear 3:1 non-text interaction cues where applicable. Support reduced motion and forced-colors modes where practical.

### B. Navigation should feel effortless

- Responsive desktop syllabus sidebar: complete collapse/restore (content **actually gains the space**), hierarchical groups with progress and active state, stable deep links, remember preference. The existing slim edge tabs should be reviewed for discoverability, accessibility, minimum target size and collision with content; redesign if weak.
- Mobile: accessible drawer with clear open/close, backdrop, Escape behavior, keyboard focus handling and no text strip left after closing. At 320px there must be no horizontal body scroll.
- Compact sticky header with the correct page/section context, accessible search, theme, syllabus, focus mode and progress entry; never let sticky items obscure anchors or keyboard focus.
- Each lesson: breadcrumb, **what you'll learn**, prerequisite, effort estimate, current position, accessible table of contents, previous/next, related lessons, learning tasks and clear completion controls. Avoid excessive repeated navigation bars.
- Search across page titles **and actual searchable lesson text** (not only title term matches); results highlight context meaningfully. Filters for part, track, level, language, maths difficulty, approximate effort and progress; support combined filters, empty states, reset and keyboard interaction.
- Provide **Continue where I left off** for local visitors; a first-time user gets a strong Start Here experience. Keep readable public routes even when local storage is blocked.

### C. Lesson reading experience is the most important screen

- **Audit the current two-column lesson prose on wide screens.** For long-form sequential instruction, prefer a single comfortable main reading column with optional right-hand ToC and full-width diagrams/code when helpful. Use columns for side-by-side comparison and short cards only. Evaluate with real screenshots and reading tests rather than blindly preserving columns.
- Break dense passages into logical short sections, examples, tiny exercises, conceptual diagrams and explanations. Keep enough whitespace without wasting a 1440/1920px display.
- Present Python and C# in synchronized tabs or switcher with equivalent task, correct status badges (Executed / Compiled / Not verified) and specific commands. Language switches retain scroll position/context and do not collapse learners' progress.
- Add **“Explain this diagram”**, “Walk through the code”, “Try changing this value”, optional “Math behind this”, “Show expected output” and “Common error and how to fix it” only when actual content supports them. Every UI action must work.
- Improve current 432 HTML/CSS diagrams: audit relevance, semantics, relationships, text labels, wrapping, accessibility and dark-mode legibility. Rework repetitive or decorative diagrams into meaningful causal visuals, pathways and comparisons. Do not add more diagrams merely to inflate counts. Keep the accessible text description.
- Provide compact reveal-answer quizzes with explanations, error feedback and retry; show *why* an answer is right or wrong. No artificial celebration, confetti or fake qualifications.
- Offer focused print styles, copyable code, deep links to subsections, keyboard-friendly expand/collapse all, no intrusive modal requests, optional distraction-free focus mode and sensible scroll restoration.

### D. Guided, useful personalization (all local)

- First-visit chooser: **New to AI**, **Know basic programming**, **.NET engineer**, **Python engineer**; allow changing later. This is a preference, not account registration.
- Show a concise route with the next meaningful action, prerequisite dependency guidance, progress by topic and separate progress types for reading, exercises and project evidence.
- Use existing `aimlqp.v1` safely: **version and migrate** previous browser data. No destructive key change, silent loss, cloud-sync claims or hidden tracking. Include export/import JSON with schema validation, safe reset and warnings about per-browser/device storage.
- Study calendar, bookmarks, resume and optional checklist features should add meaningful value without bloating the navigation or using a backend. Avoid creating artificial engagement loops.
- Enable lesson feedback without privacy-invasive analytics: a locally generated issue/report link or optional simple correction process; don't invent a functioning backend submission.

### E. Roadmaps, discovery and cross-page consistency

- Preserve current **Quick Path 10**, **ML Engineer 9**, **AI Engineer 9** roadmaps, subject to a justified editorial revision. Make every step a readable accessible node with prerequisites, explanatory microcopy, effort, lesson links, checkpoint and visible directional connectors.
- Offer a third LM/LLM specialist *view* if it helps learners understand architecture/training/fine-tuning, **without duplicating lesson content**; document the decision.
- Roadmap interactions: switch track, expand node, expand all, collapse all, jump to required lessons, continue route; direct links remain valid on refresh and print. Vertical layout on mobile and keyboard-accessible controls. Use arrows only when flow direction is unambiguous.
- Harmonize 7 part landing pages, catalogue, Maths Map, hardware guide, Solve guide, case studies, capstones, assessments, progress, privacy and other page templates with one design system.

### F. Non-negotiable UX acceptance journeys

Test these as concrete scenarios, not just visual screenshots:

1. A first-time visitor opens the home page, identifies the right starting level within one screen, reaches the first lesson, understands the prerequisite and sees the next task.
2. An unfamiliar learner reads a lesson, sees a tiny worked calculation exactly where needed, changes one value, reveals the explanation and continues without confusion.
3. A .NET engineer selects C#, copies/runs a verified sample, sees installation/expected output and understands any Python-only training limitation.
4. A mobile learner at 320/360/390/430px opens the syllabus, searches, changes theme, completes a quiz, navigates back and closes the drawer without overlap or horizontal page scroll.
5. A returning learner resumes progress on the same device, imports exported JSON safely and sees accurate course/project status.
6. A screen-reader/keyboard learner navigates roadmaps, code tabs, progress controls and math interactions without traps, missing labels or misleading ARIA state.
7. A learner searching for a specific error or question finds a meaningful lesson subsection through navigation/search rather than a generic topic hub.

Require documented screenshot/video evidence and test outcomes for those journeys. Aim for premium UX using **evidence of fewer steps, fewer errors, better reading and clearer comprehension**—not subjective superlatives.

---

## 4. Teaching content and complete curriculum, preserving the seven existing parts

Treat `SITE-CONTEXT.md`'s 50-lesson curriculum as an important **existing asset**. Audit it page-by-page. Preserve good explanations, confirmed citations, sensible lesson slugs and existing progression. Make structural changes only with a reason, redirect map and link tests.

### Current parts to preserve and improve

1. **The Big Picture (3):** AI/ML/DL/GenAI, project lifecycle, laptop setup.
2. **Data (4):** types/splits, collection/labeling/SQL, cleaning/EDA, features.
3. **Machine Learning (9):** learning/loss, regression, classification, algorithms, unsupervised, evaluation, improvement, time series, recommenders.
4. **Deep Learning (9):** neural nets, training, vision, text/sequences, transformers, generative models, speech, reinforcement learning, graph neural networks.
5. **Large Language Models (8):** how LLMs work, tokens/sampling, model design, tiny model training, scaling, fine-tuning, local inference, evaluation.
6. **Building AI Applications (12):** model APIs, prompting, embeddings, RAG, advanced RAG, tools/agents, frameworks/MCP, multimodal, evaluation, security, responsible AI, generative/agentic overview.
7. **Production (5):** serving, MLOps, monitoring, cost/scale, end-to-end architecture.

Current lesson pattern: `In plain words → Real-world example → How it works → Python example → .NET (C#) example → Applied Maths - Statistics → Maths behind it → Common mistakes → Quick check`. Preserve good material but **allow relevant math to appear before or during the explanation and code**. No mandatory repetitive template that damages teaching flow.

### Teach toward competence, not just coverage

- Test whether each current lesson actually teaches its title; identify misleading oversimplifications, unproven claims, repeated filler, broken transitions, inconsistent prerequisites, code paths that can't run and labels that exceed demonstrated depth.
- Where justified, add **small missing prerequisite lessons** (basic programming, HTTP/JSON, arrays/DataFrames, SQL, model validation, debugging, arithmetic notation) without forcing experienced developers to reread them. Prefer targeted prerequisite cards and exercises over a new 50-page foundation course.
- At advanced levels, deepen: data leakage and sampling assumptions; causal thinking vs correlation; robustness; reproducible experiments; PyTorch autograd and training; transformer internals and tiny LM checkpoints; data quality/licensing; SFT/LoRA/QLoRA and their tradeoffs; prompt injection and authorization in RAG; evaluation sets and error analysis; production telemetry, reliability, drift, costs and rollback.
- Explicitly compare what Python and C# can *natively* do, when ML.NET or ONNX is appropriate, and when an ASP.NET Core API should call a Python training/inference service. Do not fabricate a C# equivalent of a Python library that doesn't exist.
- For lessons with no paid-access API, offer deterministic local/mock mode. For optional model providers, show server-side configuration, schema validation, cost/usage cautions and data-permission requirements.
- Provide accurate technical prerequisites, code/runtime versions as checked, source links, exercise acceptance and honest verification labels. Don't call an introductory explanation an expert lesson because the subject sounds advanced.
- Curate official references **visible to learners** at the relevant section with descriptive link text, publisher and source review information. Avoid endless bibliography-only citations; don't copy article text or invent videos.

### C# + Python quality debt: resolve early

The context reports **zero C# lesson snippets compiled** and incomplete Python execution evidence. Prioritize this over writing new articles:

- On a machine with the `.NET SDK 10.0.400` reportedly available, verify `dotnet --info`, then compile and test the actual C# snippets (or runnable extracted projects). Do not claim compilation from source appearance or mere syntax highlighting.
- Install declared Python dependencies in a reproducible local environment, run `npm run test:examples`, Python smoke tests/pytest and record which tests cannot run due to CPU/GPU/network/provider restrictions.
- Correct outdated API syntax using official Microsoft, Python, PyTorch, LangChain/LangGraph, Hugging Face and scikit-learn sources. Document versions and minimum requirements; don't silently upgrade dependencies that break learners.
- Make the language-status pills **derive from actual test records** rather than manually optimistic metadata.
- Validate learner-visible expected outputs with real test logs; for nondeterministic model outputs, describe expected shape/range and don't fabricate exact transcripts.

---

## 5. Projects, company cases, learning assessment and hardware

### Existing eight capstones are assets, not placeholders by default

Preserve and upgrade the documented capstones:

1. Customer churn prediction service.
2. Store demand forecasting.
3. Visual defect inspection.
4. Company knowledge assistant (RAG).
5. Order-returns agent with human approval.
6. Train a tiny language model on a laptop.
7. Fully local private assistant.
8. Fine-tune a small model using LoRA.

Evaluate each existing Python and .NET route against actual **runnable code** and constraints. Add incremental mini-labs before capstones where prerequisites are weak. Do not require a certain count of new projects; add only projects that close concrete skill gaps. For every real project: requirements, safe synthetic/licensed data, architecture diagram, setup, exact commands, runnable implementation(s), tests and failure paths, evaluation criteria, security/privacy risks, definition of done, stretch goal and interview-ready evidence. Where native C# isn't viable for a training task, use an honest .NET consumer/client/API integration with Python model services and explain the tradeoff.

### Preserve eleven cases; make their sources accessible

Retain source-supported case studies for Morgan Stanley, Klarna, Indeed, Duolingo, John Deere, Google DeepMind, Intercom, Moderna, Lowe's, GitHub and Toyota **only when source evidence actually supports the claims**. Re-verify first-party source URLs and metric dates. Clearly distinguish documented company facts from **suggested educational example workflows** and their hypothetical technologies. Provide source links on case pages—not only text labels with invisible URLs in `CONTENT_SOURCES.md`.

### Assessment and evidence of mastery

- Preserve 7 part checkpoints and existing 25 questions but improve them for coverage, unambiguous wording, graded reasoning and explanations. Add questions only where skills are not checked. Do not rely exclusively on memorization multiple choice.
- Add practical gates: interpret an output, find a leakage bug, choose an evaluation metric, repair a code example, explain a security threat, defend a system tradeoff.
- Keep learning progress distinct from real verification; **reading a page must not be equivalent to mastering it**. Quizzes and exercises remain self-assessments, not professional certification.
- Provide a skills matrix linking each lesson/project/assessment to observable abilities, and a realistic optional portfolio/readiness guide.

### Hardware guide

Keep existing six system tiers and eight workloads. Explain CPU, RAM, GPU/VRAM, disk, OS, cooling and portability with source-backed specifications, practical limitations and an API-vs-local-vs-cloud decision tree. Teach weight-memory math with a tiny example (`8B parameters × 2 bytes ≈ 16 GB decimal for weights alone`) **without misrepresenting that figure as the total real GPU RAM requirement**. Include gradients/optimizer states, activation and KV cache effects when relevant. Do not invent prices, benchmark claims or purchase recommendations from stale information.

---

## 6. Sources, original content and external-link policy

### Resolve the existing self-contained / no-external-link contradiction

The site currently forbids external links in its static validation, while its content has reputable sources whose URLs live only in `CONTENT_SOURCES.md`. **Improve this intentionally**:

- Keep all essential lessons, CSS, JS, fonts, diagrams, progress and labs self-contained by default: **no external resources needed to read or interact**.
- Permit **explicitly vetted, ordinary external hyperlink anchors** for official educational docs, sources, reference videos and case-study evidence, without loading remote scripts, images, fonts or data automatically. External links are *optional further reading*, never a dependency for the lesson.
- Replace the blanket fail-on-any-external-link test with a **content allowlist/checker**: `https` links, safe targets/rel as applicable, no dummy domains, reputable publisher, descriptive link text, sources registered, review dates and live/link-check state. Keep outbound redirects and third-party embed bans.
- When source verification fails or network is blocked, record `review needed` visibly instead of inventing a working claim. No unsourced expensive hardware numbers or fabricated business metrics.
- Fix README's stale glossary count and the home-page claim that learners have no outside links; use computed counts in public copy when feasible.

Prioritize and periodically verify official: Python documentation, .NET AI/Microsoft Learn, scikit-learn user guide, Google ML Crash Course, PyTorch, Hugging Face, LangChain/LangGraph, FastAPI, Stanford CS336, Full Stack Deep Learning, OWASP LLM Top 10, MLflow, OpenTelemetry and vLLM where relevant. Avoid indiscriminate 30-link lists at the bottom of a beginner lesson; show 1–3 carefully matched resources at the appropriate moment.

Content quality is a first-order product and SEO issue: meaningful original explanations, understandable diagrams, real practice and honest source attribution; no mass-produced duplicate pages or mere paraphrasing of documentation.

---

## 7. SEO, growth, privacy and FUTURE Google AdSense

**AdSense is a roadmap item for later, after the site attracts sustained useful traffic and meets applicable Google requirements. It is NOT part of this launch or upgrade.** No current traffic threshold guarantees approval. Keep the primary website free, valuable, readable and ad-free while you prepare it for optional future activation.

### A. Preserve today's architecture and disabled AdSense implementation

- Inspect the **existing** ad build mode. Keep `ADSENSE_CLIENT`, `SITE_URL`, future `ADS_SLOTS` and its zero-ads default unless the actual repo establishes a better safe mechanism. Do **not** add live AdSense code or a publisher ID, call ad scripts on normal builds, create blank ad slots or ask the owner for credentials now.
- Keep ads completely absent from lessons' teaching content, code, maths moments, diagrams, interactions, quizzes, roadmap flow controls and the home, progress, about, privacy, cookies and 404 pages. The current no-ads page exclusion policy is a useful conservative baseline.
- Build a `MONETIZATION_READINESS.md` that documents optional page eligibility, approved future placements, consent, `ads.txt`, CSP, deployment flags, quality gates and **one-step rollback**—without activating any ad.
- If ads are eventually enabled on some suitable *informational* page, clearly label units as **“Advertisements”** or **“Sponsored links”** as appropriate; keep them separate from links, Next/Previous controls, downloads, code copy and high-interaction surfaces. Use responsive, uncluttered layouts and prevent unexpected content shifts. Do not treat Auto Ads as automatically acceptable without testing how they affect learning.
- Carefully verify the project's present CSP behavior before future monetization. The existing context says the ads build uses **CSP Report-Only** because of nonce concerns; do **not** assume Report-Only blocks anything, nor assert that AdSense has only one possible CSP configuration. Recheck current Google/CSP requirements and document an explicit security tradeoff, staging verification, approved script sources and rollback.

### B. Future privacy/consent requirements

- Today: no third-party ad scripts, no analytics, no accounts; truthful privacy/cookie statements; local browser progress only.
- Before future ads: audit applicable regional requirements, privacy disclosures, cookie/storage behavior, purpose and retention, opt-out options, and use a suitable **Google-certified CMP integrated with IAB TCF where Google requires it** for EEA/UK/Switzerland ad serving. The consent system must not misrepresent consent or block core lessons improperly.
- Do not invent `ads.txt` contents; wait for a real publisher ID and official Google instructions. Do not fabricate a contact email or site owner address; expose config for the actual owner to supply.
- Never invite ad clicks, manipulate engagement, place ads deceptively or promise earnings/approval.

### C. Build lasting discoverability instead of thin SEO pages

- Unique, descriptive titles/metadata, correct H1, semantic headings, crawlable pre-rendered text, internal breadcrumbs, topic hubs, meaningful lesson-to-lesson links, sitemap, robots, Open Graph and configured canonical URL **once the real domain exists**. Do not invent the domain or publish accidental canonical URLs to the wrong host.
- Keep 92 existing routes and stable slugs where possible. Any justified route changes need redirects and navigation regression tests.
- Add structured data only when justified by actual page content and the latest Search Central eligibility rules; no speculative review/rating/course claims.
- Include a Search Console setup guide for after deployment, indexing/coverage checks, source-review process, evergreen update cadence and useful intent-based navigation; no promise of guaranteed ranking.
- Keep Core Web Vitals targets in mind (field LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at the relevant percentile); measure honestly and do not describe a local Lighthouse run as field data. Keep default static output small and fast, especially on low-end phones.
- Show transparent About, editorial principles, corrections process, accessibility, privacy and contact information **only if actually known/configured**. Do not invent an author, reviewer, published date or expertise credentials. Dates must reflect genuine reviews.

**Official policy sources to read and verify again before any future activation:**

- Google Search, people-first content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google SEO Starter Guide: `https://developers.google.com/search/docs/fundamentals/seo-starter-guide`
- Google AdSense best placement practices: `https://support.google.com/adsense/answer/1282097`
- Google AdSense ad placement policies: `https://support.google.com/adsense/answer/1346295`
- Google consent requirements for publishers: `https://support.google.com/adsense/answer/13554116`
- W3C WCAG 2.2: `https://www.w3.org/TR/WCAG22/`

Do not make an implementation decision based on a stale or inaccessible policy without declaring its verification status.

---

## 8. Testing: prove user experience, learning quality and code functionality

Maintain and extend `npm run build`, static validation and Playwright. The historical context says 52/52 Chromium e2e tests and 9,463 internal-link checks passed. **Do not rewrite or weaken them to make a new layout pass.** Preserve the baseline and add purposeful assertions.

### Build and content tests

- All routes generated; correct 7-part hierarchy and links, stable or redirected anchors, one H1 per page, no missing examples/resources, no accidental TODOs or duplicate lesson content.
- Counts computed from data rather than hardcoded stale text. Verify front matter, language badges, real cited sources and link-check status.
- No dependency on remote CSS/fonts/scripts/media during the standard build; outbound reference anchors accepted only via the vetted-link policy.
- Check all visible worked maths for numeric correctness and internal consistency; validate sample code output vs displayed numbers.

### Code verification tests

- `dotnet --info`, compile/test every C# sample possible with actual installed SDK (SDK reported as 10.0.400; verify). Test Python examples in reproducible environment, including scikit-learn and relevant optional dependencies. For missing GPU/provider access, mark `not run` with exact reason, never `pass`.
- Use syntax/build checks, unit/integration tests, negative security tests, mock API modes and appropriate smoke training. Report each lesson's actual status in a generated matrix (`language`, `runtime`, `command`, `result`, `date`, `limits`).
- Check RAG source filtering and no-answer paths, agent human-approval before refund, idempotency, evaluator leakage prevention, deterministic seeded experiments and cross-language JSON contract parity.

### UX and visual tests

- **Viewport sweep:** 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 CSS pixels; both themes plus system mode, 200% zoom and reflow. No body horizontal scrolling; tables and long code scroll *within their own containers* where unavoidable.
- Keyboard-only: tab order, skip link, sidebar collapse/restore, mobile drawer focus/escape, on-page links, roadmaps, accordion aria-expanded, search/filter behavior, C#/Python switch, quizzes, progress import/export/reset and Maths Moments.
- Automated axe accessibility + computed contrast across dynamic hover/focus/selected/error states; also require a real screen-reader manual pass when environment supports one. Never claim full accessibility solely from automated tests.
- Capture before/after screenshots for home, lesson (short and long), math, roadmaps, search/filter, capstones, case studies, progress and hardware; desktop + mobile, light + dark, sidebar expanded/collapsed and print.
- Validate each of the seven learner journeys above and report failed steps, exact reproduction and correction.
- Performance: Lighthouse/PageSpeed lab runs where possible, JS/CSS/asset size budgets, CSS/JS execution errors, cumulative layout shifts and local static-server smoke. Test ad-disabled build for **zero** ad requests and blank slots.

### Quality reporting

Update `QA_REPORT.md` with command, environment, date, executed/pass/fail/skipped, screenshots, defects and remaining limitations. An unrun or manually unverified test is never reported as passed. Include independent mathematics/editorial review as an explicitly open requirement until actually performed.

---

## 9. Implementation stages — MAKE REAL CHANGES, not a plan only

Create or refresh `PROJECT_PLAN.md`, `IMPLEMENTATION_PROGRESS.md` and a **requirements-to-test matrix**. Work incrementally and keep the academy functional after each stage. Do not silently change the product name, original URL namespace, progress schema or branding.

### Stage 0 — Audit and baseline

Read current source fully. Capture exact site inventory, content/lesson quality assessment, current screenshots, installed versions and test status. Identify forced/repetitive maths, current reading friction, duplicate theme tokens, unreadable diagrams, source-link limitations and uncompiled C# code. Map every proposed improvement to a concrete file and acceptance test. **Immediately continue to implementation.**

### Stage 1 — Highest-impact correctness and continuity

Fix duplicate dark token architecture; correct stale computed glossary/home wording; design/implement safe vetted external source hyperlinks without remote runtime dependencies; stabilize progress migrations and existing route compatibility. Run baseline tests and record results.

### Stage 2 — One complete flagship learning journey and design system

Redesign the site shell, syllabus, top bar and reading experience with the new tokens; deliver one fully finished **beginner → core ML → real project** journey with inline math, verified Python/C# samples, diagrams, navigation, quiz and local progress. Test light/dark, 320px/mobile and desktop. Demonstrate before/after, then apply reusable components to all templates.

### Stage 3 — Applied maths integrated into the existing 50 lessons

Audit all reported 48 Applied Maths sections. Move math to the point of need, simplify numbers and explanations, add tiny interactive Math Moments where valuable and accuracy tests. Retain Maths Map as an optional reference. Do not create an extra maths obstacle or inflate lessons with irrelevant calculations.

### Stage 4 — Dual-language executable learning and curriculum depth

Compile all viable C# samples, execute Python tests and repair outdated snippets with official APIs. Expand weak conceptual explanations and missing prerequisites, reinforce advanced trade-offs, improve exercises and checkpoints. Generate honest code verification badges from test evidence.

### Stage 5 — Industry applications and end-to-end projects

Turn the eight existing capstones into rigorously testable portfolio experiences where incomplete. Improve eleven case studies with directly accessible verified sources, realistic synthetic reproductions and separated example architecture. Improve hardware and deployment guidance as evidence supports it.

### Stage 6 — Premium UX platform-wide, accessibility and SEO

Finish all route templates, content search, navigation, roadmaps, Maths Map, study calendar, focus mode, progress and responsive diagrams. Fix all high-severity accessibility problems. Add sitemap/canonical rules only when configured; create editorial-source workflow and future ad activation guide. Keep ads off.

### Stage 7 — Release gate and handoff

Run actual build/static/e2e/code/content/performance checks, review screenshots, fix regressions, document any unverified third-party/GPU work. Provide fully working source, `dist/`, configuration examples, `README.md`, `DEPLOYMENT.md`, `QA_REPORT.md`, `CONTENT_SOURCES.md`, design-system documentation, content inventory, progress checklist, monetization readiness checklist and change log. Do not label incomplete work as finished.

For every stage record:

| Stage | Work actually completed | Files modified | Commands run / pass-fail | Screenshots or evidence | Known limitations | Next actions |
|---|---|---|---|---|---|---|

Small, verified releases are better than a large unfinished rewrite. You may make justified choices but **do not ask the owner for routine approval between stages**. Owner choices such as live domain, public deployment, AdSense activation and real account identifiers are explicitly deferred; keep those as documented configuration blockers only, not blockers for local development.

---

## 10. Final acceptance contract

The upgrade is ready for release only when the following are **demonstrated**, not asserted:

- [ ] Preserves the existing `AI & ML Quick Path` brand, 7-part structure, meaningful 50-lesson foundation, and approved teal/blue/violet identity; justified changes have redirects/documentation.
- [ ] A beginner can reach a real, complete first learning activity without knowing advanced mathematics or needing an account.
- [ ] **Math appears exactly where needed** in each topic; numbers are tiny, hand calculations explicit, notation explained, deeper derivations optional; no forced or unrelated math.
- [ ] Each important concept has a clear explanation, everyday example, actual application, properly explained code, error cases and a way to test understanding.
- [ ] Python/C# code statuses reflect real compile/run evidence and offer honest hybrid patterns for Python-specific training tooling.
- [ ] Original capstones and real-company cases have runnable project/evidence paths and visible, verified citations; no imagined company metrics/private stacks.
- [ ] Visual design is polished and coherent; all lesson templates, diagrams, roadmaps and controls are readable in light/dark, mobile/desktop and print.
- [ ] Sidebar, focus, search, filters, tabs, quizzes, progress migration/export/import, Math Moments and deep links have functioning tests.
- [ ] Accessibility targets WCAG 2.2 AA; report both automated and completed human tests honestly. No overflow at required widths.
- [ ] Static, no-account, no-third-party-runtime content remains deployable to Cloudflare Pages; official *links* are possible without remote dependencies.
- [ ] SEO prioritizes original helpful learning material and clear site structure; no fake ranking, domain, metadata, author or qualification claims.
- [ ] Future Google AdSense is **prepared but disabled**; existing feature flag is preserved, consent/policy obligations documented and zero live ads appear in the normal build.
- [ ] Actual test results, screenshots, remaining failures, architecture decisions and complete editable source/build output are supplied.

### START NOW

**Read `SITE-CONTEXT.md` and `CLAUDE.md`, then inspect the live local repository. Produce a short evidence-backed audit, make a safe development branch, and begin Stage 1 immediately.** Prioritize the owner’s revised requirement: **simple, useful, inline maths; extraordinary learner-centered UI/UX; and a reliable future-AdSense strategy with all ads off today.** Preserve and improve existing educational work instead of rebuilding it from scratch. Continue through stages with real implementation, tests and documented progress—not a plan-only answer.
