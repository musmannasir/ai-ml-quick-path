# Outline gap analysis and plan to add the missing topics

Written 2026-11-18. Source: the owner's file "AI & ML Complete Guide Course Outline.md" (16 parts, 79 modules, 392 lessons).
Method: a keyword scan of about 370 terms from the outline's topic and maths columns against the 50 lessons, the glossary, the 11 cases and the 8 capstones.
"Not found" means the term never appears on the site. A lesson might still touch the idea in other words, so each item must be re-checked by reading before a lesson is written.
For Parts 14 to 16 the outline's topic lists were not read in full, only the module and lesson titles.

## 1. What the outline has that the guide does not

### 1.1 Terms not found anywhere on the site

| Outline part | Topics not found |
|---|---|
| 1 Programming and tools | List comprehensions, recursion, SIMD and fast numeric code, SQL window functions. The Python and C# language lessons themselves. |
| 2 Mathematics for ML | Determinants, matrix inverse, partial derivatives, Jacobian and Hessian, integrals, binomial and Poisson distributions, the central limit theorem, convex functions, Lagrange multipliers and KKT. |
| 3 Working with data | Parquet, web scraping, imputation methods, target encoding, feature selection. |
| 4 Core ML principles | Bias-variance trade-off, curse of dimensionality, no free lunch, log loss, paired comparison of models. |
| 5 Supervised learning | The normal equation, Poisson and other generalised linear models, KD-trees, discriminant analysis (LDA, QDA), AdaBoost, focal loss, Gaussian process regression. |
| 6 Unsupervised and recommenders | Silhouette score, hierarchical clustering, DBSCAN and HDBSCAN, Gaussian mixture models and EM, spectral clustering, t-SNE and UMAP, kernel PCA, topic models, Mahalanobis distance, association rules, kernel density estimation, two-tower retrieval. |
| 7 Deep learning fundamentals | Universal approximation, automatic differentiation, computational graphs, vanishing and exploding gradients, label smoothing, mixup. |
| 8 Computer vision | SIFT, LeNet, MobileNet, CutMix, the R-CNN family, triplet loss, SimCLR, image captioning, optical flow. |
| 9 NLP, sequences, speech | Stemming and lemmatisation, stop words, named-entity recognition, hidden Markov models, BLEU, ROUGE and METEOR, bidirectional RNNs, keyword spotting. |
| 10 Transformers and LLMs | Training sentence-embedding models (everything else scanned appears at least once). |
| 11 Generative models | Denoising autoencoders, the reparameterisation trick, VQ-VAE, DCGAN, mode collapse, StyleGAN, CycleGAN, pix2pix, normalising flows, DDPM and DDIM, latent diffusion, flow matching, ControlNet and inpainting, music and video generation. |
| 12 Reinforcement learning | Monte Carlo methods, temporal-difference learning, SARSA, eligibility traces, the deadly triad, DQN and Rainbow, advantage estimation, actor-critic, DDPG and TD3, AlphaZero and MCTS, offline RL, reward shaping. |
| 13 Specialised branches | Kalman filters, node embeddings, Bayesian networks, MCMC, variational inference, causal graphs, and all of classical AI: breadth-first and heuristic search, constraint satisfaction, logic, planning, genetic algorithms. |
| 14 LLM applications | A lesson on chat APIs by that name (the idea is in "Calling an LLM from your application"; probably only a naming difference). |
| 15 MLOps | Technical debt in ML systems, data validation, cloud ML platforms. |
| 16 Advanced and research | PAC learning, Rademacher complexity, double descent, loss landscapes, meta-learning, multi-task learning, continual learning, quantisation-aware training, model merging, neuro-symbolic AI, reading and reproducing papers. |

### 1.2 Named only once (in a list or the glossary, not taught)

Eigenvalues, Markov chains, maximum likelihood, bootstrap, lasso, naive Bayes, support vector machines, random forests, PCA, k-means, dropout,
residual connections, ResNet, YOLO, U-Net, LSTM, BERT, GANs, Bellman equations, ARIMA, Holt-Winters, federated learning, AutoML, alignment.
These are candidates for a short section inside an existing lesson, not for a new lesson.

### 1.3 Things the outline has that this guide deliberately does not copy

- **A programming course (Part 1) and a full mathematics course (Part 2).** The guide's audience can already code a little, and the owner's rule is that maths is taught at the point of need (CLAUDE.md rule 1). These are covered by a short optional refresher and by maths moments, not by two new parts. See decision D2.
- **16 parts, per-module labs, per-part projects, five-question quizzes per lesson, 392 lessons.** The guide keeps its 7 parts, its 8 capstones and its quick-check template.

## 2. What the guide has that the outline does not

Keep all of these. Do not remove or reshape them to match the outline.

- The "Solve any case" decision guide, the 11 company cases with source checks, the hardware guide (6 tiers, 8 workloads, memory arithmetic), the 12-week plan, 3 roadmaps, the ML-engineer versus AI-engineer page, progress and study calendar, interview-readiness signals.
- Human-approval agents, reliability and capacity maths (availability of chained services, backoff, Little's law, latency percentiles), speculative decoding and mixture of experts as short topics.
- A 166-term glossary, the maths map with checked worked examples, code status from real compile and run results, a vetted source register.

## 3. Rules the new lessons must follow

Taken from CLAUDE.md. Nothing in this plan changes the page layout, the stylesheet, the lesson template or the plain-words voice.

1. **Same template.** Front matter, then `In plain words` (50 words or more), `Real-world example`, `How it works`, `Python example`, `.NET (C#) example`, optional `Applied Maths - Statistics`, `Maths behind it`, `Common mistakes`, `Quick check` (2 to 5 questions). No new section types, no new CSS.
2. **Plain words.** Short sentences, every term defined on first use, concrete inputs and outputs, no "for dummies" labels. Read a finished lesson aloud against an existing one (for example `ml-regression`) for tone.
3. **Maths at the point of need.** One or more ```` ```maths ```` moments inside the section where the idea first appears: an everyday situation, tiny numbers, one hand step per line, then the formula and why AI uses it. The build checks every step. Set front matter `maths:` honestly; use `none` when no calculation is needed. No proofs in the main text.
4. **At least 3 diagrams**, one per concept the lesson introduces. They must pass `npm run check:diagrams` (3 or more steps in step diagrams, unique titles, every number also stated in the lesson text, no invented figures).
5. **Python and C# in every lesson.** Where .NET has no mature library (for example MCMC, many generative models), the C# example is an honest .NET consumer or a from-scratch version, and the lesson says so. Never invent a C# library that does not exist.
6. **Honesty.** No invented facts, benchmarks, prices or citations. Quoted output must come from a real run (`examples/` plus `npm run test:examples`). Code is only labelled "ran" or "compiled" by `npm run verify:code`, never by hand. New company facts need a source in `src/data/sources.mjs` and a dated note.
7. **Outside links only through the register**, as `[text](source:id)`, 1 to 3 per lesson at most, added to `LESSON_REFS`.
8. **Data files, not templates.** Adding a lesson means: create the file, add its id to a group in `MODULES` (`src/data/curriculum.mjs`), optionally add it to a roadmap node, add glossary terms, then build and test.

## 4. Decisions needed from the owner

| # | Question | Recommended default |
|---|---|---|
| D1 | Keep exactly 7 parts, or add a new group or part for classical AI (search, logic, planning) and causal inference? | Keep 7 parts. Add a new **group** named "Beyond learning: other AI methods" inside Part 3, so no navigation, roadmap or page template changes. |
| D2 | Add a refresher for Python and C# basics and for the maths prerequisites (matrices, derivatives, distributions)? | Add two optional short lessons in Part 1, clearly marked skippable, plus the maths moments in the lessons that need them. Do not copy the outline's Parts 1 and 2. |
| D3 | How many new lessons in total? | About 22 (section 5). The guide grows from 50 to about 72 lessons and about 67 to about 95 study hours. |
| D4 | Should the 12-week plan stay at 12 weeks? | Yes. New lessons are marked "extension" on the plan and the roadmaps, and are not required for the core path. |

## 5. Plan: new lessons, by batch

Each batch is small enough for one working session and ends with a full check run and a commit. Counts of lessons are estimates.
Placement uses the existing parts and groups. Ids are proposals.

### Batch 1: Part 3 Machine learning (highest value, closest to existing lessons) - 7 lessons

| Proposed lesson | Covers (from the gaps above) | Group | Python | C# |
|---|---|---|---|---|
| `ml-generalisation` Bias, variance and the limits of learning | Bias-variance, curse of dimensionality, no free lunch, learning curves | Measure and improve | scikit-learn learning curves | ML.NET with the same data, or from scratch |
| `ml-model-compare` Comparing models and trusting probabilities | Log loss, paired comparison, calibration (deeper than today) | Measure and improve | scikit-learn | ML.NET metrics |
| `ml-linear-deeper` Linear models under the hood | Normal equation, generalised linear models, Poisson regression, focal loss, cost-sensitive learning | How learning works | NumPy then scikit-learn | MathNet-style arrays, ML.NET |
| `ml-trees-more` More ensemble methods | AdaBoost, LDA and QDA as short sections, KD-trees as a note | How learning works | scikit-learn | ML.NET where available, otherwise honest note |
| `ml-clustering` Clustering beyond k-means | Silhouette, hierarchical, DBSCAN, Gaussian mixtures and EM, spectral (brief) | new group "More unsupervised methods" | scikit-learn | ML.NET clustering plus from-scratch DBSCAN |
| `ml-see-data` Seeing high-dimensional data | t-SNE, UMAP, kernel PCA | More unsupervised methods | scikit-learn, umap-learn | Python produces the plot data; C# loads and charts it (stated) |
| `ml-patterns` Anomalies, patterns and density | Mahalanobis distance, kernel density, association rules | More unsupervised methods | scikit-learn, mlxtend | from-scratch C# support, confidence, lift |

Also fold into existing lessons as short sections (no new page): imputation and target encoding and feature selection into `d-clean-eda` and `d-features`; two-tower retrieval and implicit feedback into `ml-recommenders`; log-loss mention into `ml-evaluation`.

### Batch 2: Part 4 Deep learning - 6 lessons

| Proposed lesson | Covers | Placement |
|---|---|---|
| `dl-backprop` Backpropagation and autograd | Computational graphs, chain rule by hand, automatic differentiation, vanishing and exploding gradients, universal approximation (a paragraph) | Neural networks |
| `dl-nlp-classic` Classical text processing | Stemming and lemmatisation, stop words, named-entity recognition, hidden Markov models (idea only), BLEU, ROUGE, bidirectional RNNs | Model families |
| `dl-vision-more` More computer vision | Classic filters and SIFT, architecture history (LeNet, MobileNet), CutMix and mixup, triplet loss and face matching, SimCLR, captioning, optical flow | Model families |
| `dl-gen-more` More generative models | VAE details and the reparameterisation trick, GAN stability and mode collapse, normalising flows, DDPM and latent diffusion, ControlNet, music and video as brief sections | Model families |
| `dl-rl-value` Reinforcement learning: value methods | Monte Carlo, temporal-difference, SARSA, eligibility traces, DQN and the deadly triad | Model families |
| `dl-rl-policy` Reinforcement learning: policy methods | Advantage, actor-critic, DDPG and TD3, AlphaZero and MCTS, offline RL, reward shaping | Model families |

Fold into `dl-training`: label smoothing and mixup as short sections.

### Batch 3: new group "Beyond learning: other AI methods" in Part 3, and Part 7 - 5 lessons

| Proposed lesson | Covers | Placement |
|---|---|---|
| `ai-search` Search and games | Breadth-first and heuristic search, minimax | Beyond learning |
| `ai-logic-plan` Logic, constraints and planning | Constraint satisfaction, propositional and first-order logic, automated planning, genetic algorithms | Beyond learning |
| `ml-causal` Cause and effect | Confounding, experiments, causal graphs, uplift | Beyond learning |
| `ml-bayes` Thinking in probabilities | Bayesian networks, MCMC, variational inference (idea level), Kalman filter as a short section | Beyond learning |
| `ops-data-debt` Data validation and technical debt in ML | Data validation, schema checks, technical debt | Part 7 |

Cloud ML platforms (SageMaker, Azure ML, Vertex) are only added with registered, dated sources and **no prices**; otherwise skipped.

### Batch 4: Part 5 and Part 1 extras - 4 lessons

| Proposed lesson | Covers | Placement |
|---|---|---|
| `llm-embed-train` Training embedding models | Sentence-embedding training, contrastive loss | Part 5 |
| `llm-paradigms` Learning paradigms | Meta-learning, multi-task, continual learning, double descent, loss landscapes (idea level), quantisation-aware training, model merging | Part 5 |
| `s-python-refresher` Python in 90 minutes for this guide (optional) | Comprehensions, recursion, collections, files | Part 1 |
| `s-csharp-refresher` C# in 90 minutes for this guide (optional) | LINQ, generics, async, `Span<T>` and SIMD in one place | Part 1 |

### Out of scope unless the owner asks

PAC learning and Rademacher complexity as full lessons (a short "deeper reading" mention only), neuro-symbolic AI, a "reading papers" lesson, and any copy of outline Parts 1 and 2. Reason: they conflict with the guide's audience and the maths-at-the-point-of-need rule.

## 6. Steps for every lesson (the same loop each time)

1. Read the matching outline rows and one similar existing lesson. List the 3 to 5 ideas to teach and the one tiny calculation per idea.
2. Write the lesson file in `src/content/lessons/<part>/<id>.md` with correct front matter (`maths:`, `prereqs`, `reviewed`, `evidence`, a `code:` note about Python only).
3. Add the example code to `examples/` if the output is quoted; run it; paste the real output.
4. Add the id to `MODULES`, add glossary terms, add `LESSON_REFS` entries for any registered source, optionally add the lesson to a roadmap node and adjust that step's effort range.
5. Run, in order: `npm run extract:code`, `npm run verify:code`, `npm run build`, `npm run check:maths`, `npm run check:diagrams`, `npm run test:static`, `npm run test:e2e` (and `npm run check:links` if a source was added).
6. Look at the rendered lesson once on desktop and once at 390 px, in light and dark. Compare tone with an existing lesson.
7. Commit the lesson with its test updates. Update `IMPLEMENTATION_PROGRESS.md`.

## 7. What changes when the lesson count grows

These hard-coded places need updating, each with a stated reason, never by weakening a test:

- Tests that check "50 lessons": the catalogue filter test (total, Part 3 count, Intermediate count, maths-level sum, "1 of 50" exercises). Make them read the count from the data where possible.
- Public text with counts: `README.md`, `SITE-CONTEXT.md`, `CLAUDE.md` (structure line and part counts), the about page, the home page (computed from data already), `IMPLEMENTATION_PROGRESS.md`.
- Roadmap and plan: step effort ranges, the plan's hours, "Extension" labels. The 12-week plan keeps its core lessons.
- The migration pack in `migration-src` (if the owner still uses it).
- `qa/code-status.json` is regenerated by `npm run verify:code`; never edited by hand.

## 8. Risks and how to handle them

| Risk | Handling |
|---|---|
| Voice drifts from "plain words" as topics get harder | Every lesson opens with an everyday example, defines each term at first use, and moves the formal detail into a `deeper:` line. Compare against `ml-regression` before committing. |
| Too many lessons make the guide feel heavy | Mark extension lessons clearly; keep the core path and the 12-week plan unchanged; roadmaps get optional steps. |
| .NET has no library for some methods | Say so in the lesson and show a from-scratch C# version or a C# client of Python output. Never claim a library that does not exist. |
| Facts and figures go stale or get invented | Quote only what a source states or a real run printed; register sources; label every number as toy or measured. |
| Test and count churn | Do the data-driven test change once in Batch 1, so later batches need no test edits. |
| Token and time cost | Work one batch per session, write lessons from the template, and automate the check loop in section 6. |

## 9. Suggested order and size

| Batch | New lessons | Rough effort |
|---|---|---|
| 1 Part 3 ML | 7 | largest value; start here |
| 2 Part 4 deep learning | 6 | moderate; reinforcement learning needs real runs |
| 3 Other AI methods and production | 5 | moderate |
| 4 Part 5 and refreshers | 4 | smaller |
| Total | 22 | about 50 to about 72 lessons |

Nothing in this plan has been started. Next step, once the owner answers D1 to D4: write Batch 1, `ml-generalisation` first, as the pilot lesson, and review it before writing the rest.

## Progress on the outline plan

- 2026-11-18, Batch 1 pilot: `ml-generalisation` (Bias, variance and the limits of learning) written, with 3 maths moments, 4 diagrams, a Python example whose output was run, and a from-scratch C# example that compiled and ran with identical output. Guide now has 51 lessons and 93 pages. Lesson counts in tests now come from the built site. Decisions D1 to D4 were taken at their recommended defaults. Next: `ml-model-compare`, `ml-linear-deeper`, `ml-trees-more`, `ml-clustering`, `ml-see-data`, `ml-patterns`.
