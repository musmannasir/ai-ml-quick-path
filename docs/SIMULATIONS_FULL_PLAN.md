# Plan: simulations for every concept that a simulation explains well

Status: plan only (2026-11-19). Nothing is built. This plan **widens the scope** of `docs/SIMULATIONS_PLAN.md`. That file still holds the engine design, the visual language, accessibility rules, tests and risks (its sections 1 to 4, 7 and 8). This file replaces its sections 5, 6 and 10 (which lessons, and in what order).

The owner's examples (neural network, tokens, supervised and unsupervised learning, Transformers) were samples. Every one of the 72 lessons was checked against one question: **does watching a thing change when the learner changes a setting teach more than a paragraph and a diagram?**

Result: **66 of 72 lessons get a simulation or a preset of one. They are served by 52 modules.** Four lessons clearly get none, and two are optional.

## 1. Test used to decide

A concept gets a simulation when at least one of these is true:

1. It is a **process with steps** that the learner cannot see in a still picture (a request travelling, a tokeniser merging, a training loop).
2. It has a **setting whose effect is surprising** (learning rate, k, temperature, threshold, chunk size).
3. It is **geometry** (decision boundaries, clusters, filters sliding over an image).
4. It has a **trade-off** (precision against recall, bias against variance, fairness against accuracy).
5. It has a **hidden middle** (what happens inside a network, inside attention, inside a pipeline).

A concept gets **no** simulation when it is a tool, setup, syntax, policy or a checklist, or when a faithful simulation would need a real large model that the page cannot run (we never fake one).

## 2. Added to the design (on top of the first plan)

These three ideas make the simulations teach better, not just look good. All three are cheap once the engine exists.

- **Predict first.** Before pressing Run, the learner picks what they expect ("Will the loss fall, rise or wobble?"). After the run the page says whether they were right. People remember a corrected guess far better than a shown result.
- **Try this challenges.** Each simulation has two or three small goals ("Make the network separate the circle data", "Get the answer with fewer than 5 chunks"). The page detects success itself. Challenges feed the existing exercise progress (`exercise:` ticks), so the plan and progress pages show them.
- **Three viewpoints.** From the HTTPS sample: where it helps, the same moment is shown from several actors (for example user, retriever and model in RAG; data, model and score in training).

## 3. The Transformer series (flagship)

A Transformer is too big for one picture, so it becomes **six linked simulations that share one tiny real model**.

**The shared model.** A tiny Transformer: vocabulary of about 24 tokens, 8 numbers per token, 2 attention heads, 1 block. It is trained **once, offline**, by a small NumPy script in the repo (`examples/transformer-tiny/train.py`) on a small bundled set of simple sentences written for the guide. The trained weights ship as one small JSON file (target under 20 KB) beside the page. The browser runs the **real forward pass** with those weights, and the lesson's Python and C# programs run the same forward pass and print the same numbers (checked to 4 decimals by `check-sims`). The page says plainly: this is a toy model, not a large language model.

| Part | Where | What is on screen | What the learner does | What they understand |
| --- | --- | --- | --- | --- |
| T1 From text to vectors | `dl-transformers` | Sentence split into tokens; each token looks up a row of numbers (bars); a position pattern is added | Type a sentence; toggle "position on/off" | Why words need numbers, and why order must be added |
| T2 One attention head | `dl-transformers` | For each token: Query, Key and Value vectors; a score grid (Query times Key, shrunk); softmax turns each row into weights (heat map); weighted sum of Values | Click a token to follow it; toggle "causal mask"; change the shrink factor | What "looking at other words" means, in actual numbers |
| T3 Many heads | `dl-transformers` | Two heads side by side with different heat maps, then joined | Switch head; compare patterns | Why more than one head |
| T4 The block | `dl-transformers` | One token's vector travels: attention, add, normalise, feed-forward, add, normalise (bar chart after each stage) | Step through; hide a stage | What a block does, and why the "add" (residual) path exists |
| T5 Output and generation | `llm-how` | Last vector becomes scores for every token, then probabilities; the chosen token is appended and the loop repeats; a **cache** switch greys out work that is reused | Temperature, top-k, greedy or sample, cache on or off | How a Transformer writes one token at a time, and what the key-value cache saves |
| T6 Training against using | `dl-transformers`, `llm-train-laptop` | Training: every position predicts its next token at once, with a loss per position; using: one token at a time | Toggle mode; change the sentence | Why training is parallel and generation is not |

Extra: a **context length slider** on T2 shows the score grid growing as n × n, to make "long inputs cost more" visible (it already has a maths moment).

## 4. The modules (52)

Size: **S** = step-through, data only, no new JavaScript; **M** = small compute module; **L** = large compute module.
"Preset" = the same module reused in another lesson with different starting settings.

### 4.1 Start and data (6)

| Id | Simulation | Lesson (home) | Presets in | Size |
| --- | --- | --- | --- | --- |
| M01 | Rules against learning: write rules for spam and watch them break; the same task learned from examples | `s-what-is-ai` | `ml-learning` | M |
| M02 | The project loop: inject a fault (bad data, wrong metric, drift) and see which stage must repeat | `s-lifecycle` | `ops-mlops` | S |
| M03 | Splits and leakage: random against time split; the same model scored with and without leakage | `d-basics` | `ml-evaluation`, `ml-timeseries` | M |
| M04 | Missing values and outliers: choose how to fill, watch mean, median and a chart move | `d-clean-eda` | | M |
| M05 | Scaling and encoding: the same nearest-neighbour question before and after scaling | `d-features` | `ml-algorithms` | M |
| M06 | Label noise and annotator agreement: flip some labels, watch accuracy and agreement fall (optional) | `d-collect` | `app-evals` | M |

### 4.2 Machine learning core (15)

| Id | Simulation | Home | Presets in | Size |
| --- | --- | --- | --- | --- |
| M10 | Loss and gradient descent: ball on a bowl, learning rate, steps | `ml-learning` | `dl-training`, `dl-backprop` | M |
| M11 | Regression: drag points, residual bars, R²; ridge and lasso shrink the weights | `ml-regression` | `ml-linear-deeper` | M |
| M12 | Classification: boundary, threshold slider, confusion matrix, ROC point; calibration curve | `ml-classification` | `ml-model-compare`, `ml-evaluation` | L |
| M13 | **Algorithm playground**: k-nearest neighbours, logistic regression, tree, naive Bayes, boosting rounds on the same scatter; click to add points | `ml-algorithms` | `ml-trees-more`, `ml-generalisation`, `ml-model-compare` | L |
| M14 | Bias, variance and learning curves: polynomial degree, noise, data size | `ml-generalisation` | `ml-improve` | M |
| M15 | Evaluation: cross-validation folds animated; precision and recall against the threshold | `ml-evaluation` | `ml-model-compare` | M |
| M16 | **Clustering**: k-means (assign, then move) with an elbow chart; DBSCAN eps and min points; hierarchical merges | `ml-unsupervised` | `ml-clustering` | L |
| M17 | PCA and seeing high dimensions: rotating axis, variance explained; projection that keeps neighbours | `ml-unsupervised` | `ml-see-data` | M |
| M18 | Anomalies and density: score every point; threshold and contamination | `ml-patterns` | `ml-unsupervised` | M |
| M19 | Recommenders: ratings grid, taste lists, predicted rating, cold start | `ml-recommenders` | | M |
| M20 | Time series: moving average, trend and season, forecast horizon, time-ordered test | `ml-timeseries` | | M |
| M21 | Thinking in probabilities: base rate and a test (the "positive test, how likely ill?" sliders); belief update | `ml-bayes` | `ml-evaluation` | M |
| M22 | Cause and effect: a hidden confounder; Simpson's paradox by switching the grouping | `ml-causal` | | M |
| M23 | Search and games: maze with breadth-first, depth-first and A*; game tree with minimax and pruning | `ai-search` | | L |
| M24 | Logic and planning: constraint puzzle by backtracking; a plan built step by step | `ai-logic-plan` | | M |

### 4.3 Neural networks and deep learning (11 modules, 17 with the Transformer parts)

| Id | Simulation | Home | Presets in | Size |
| --- | --- | --- | --- | --- |
| M30 | **Neural network playground**: layers drawn with weights as line thickness; train live on line, XOR or circle data; loss curve; "follow one example" | `dl-neural-nets` | `ml-learning`, `dl-training`, `dl-backprop` | L |
| M31 | Training dynamics: learning rate, batch size, dropout, batch norm; optimiser race (plain, momentum, Adam) on a landscape | `dl-training` | | L |
| M32 | Backpropagation on a small graph: forward numbers, then gradients flowing back, one node at a time | `dl-backprop` | `dl-neural-nets` | M |
| M33 | Convolution and CNN: filter slides over an image, stride, padding, pooling; boxes, overlap (IoU) and non-maximum suppression | `dl-vision` | `dl-vision-more` | L |
| M34 | Sequences: hidden state updating word by word; embedding map | `dl-sequences` | | M |
| M35 | Classic text: bag of words, TF-IDF weights, tagging a sentence | `dl-nlp-classic` | `app-rag-advanced` | M |
| **T1 to T6** | **Transformer series** (section 3) | `dl-transformers`, `llm-how` | `llm-train-laptop` | L (shared model) |
| M37 | Generative models: autoencoder squeezing and rebuilding; a generator and a discriminator playing against each other; diffusion adding and removing noise | `dl-generative` | `dl-gen-more` | L |
| M38 | Graph networks: messages passing round a small graph, round by round | `dl-graphs` | | M |
| M39 | Speech: wave to spectrogram with a window-size slider (real FFT in the page) | `dl-speech` | `app-multimodal` | M |
| M40 | Reinforcement learning: bandit with epsilon, grid world Q-learning, policy gradient in a tiny maze | `dl-rl` | `dl-rl-value`, `dl-rl-policy` | L |

### 4.4 Language models (6)

| Id | Simulation | Home | Presets in | Size |
| --- | --- | --- | --- | --- |
| M50 | **Tokens**: text to byte-pair merges, one merge at a time, then ids | `llm-tokens` | `dl-sequences`, `llm-how` | M |
| M51 | **Generation loop**: scores, probability bars, temperature, top-k, top-p; context window filling; cost meter | `llm-tokens` and `llm-how` | `llm-design` | L |
| M52 | Model builder: choose layers, width and heads; parameter count, memory and training tokens update; plus "watch a tiny model learn to write" (loss falling, samples improving) | `llm-design` | `llm-scale`, `llm-train-laptop` | L |
| M53 | Embedding training: pairs pulled together and negatives pushed apart on a map; temperature | `llm-embed-train` | `app-embeddings` | M |
| M54 | Adapting models: LoRA (two thin matrices instead of one big), quantisation bits against error and size, blending two models | `llm-finetune` | `llm-local`, `llm-paradigms` | L |
| M55 | Evaluating language models: perplexity on the tiny model; one benchmark question scored several ways (optional) | `llm-eval` | | M |

### 4.5 Applications (9)

| Id | Simulation | Home | Presets in | Size |
| --- | --- | --- | --- | --- |
| M60 | Embeddings and vector search: map of points, query lands near neighbours, nearest-neighbour count | `app-embeddings` | | M |
| M61 | **RAG pipeline**: split, embed, retrieve, answer, with three viewpoints (user, retriever, model); chunk size, hybrid blend, re-ranking | `app-rag` | `app-rag-advanced` | L |
| M63 | An LLM call: request and response, streaming, retry on error, token cost | `app-llm-api` | `ops-serving` | S |
| M64 | Agent loop: plan, tool, observe; approval gate; chance of success falling along a chain | `app-agents` | `app-genai-agentic` | M |
| M65 | Multimodal: image cut into patches that become tokens; a document pipeline | `app-multimodal` | | M |
| M66 | Prompt injection: attacker choices against a guarded and an unguarded assistant (the HTTPS sample's pattern) | `app-security` | `app-responsible` | S |
| M67 | Evaluating apps: test-set size against margin of error; pass rate | `app-evals` | `llm-eval` | M |
| M68 | Fairness: one threshold or one per group; selection rate, error rates and accuracy move | `app-responsible` | `ml-evaluation` | M |
| M69 | Tools and MCP: the message flow between client, server and tool (like a handshake) | `app-frameworks` | `app-agents` | S |

(M62 was dropped: prompt engineering would need a real large model, which a page cannot run.)

### 4.6 Production (5)

| Id | Simulation | Home | Presets in | Size |
| --- | --- | --- | --- | --- |
| M70 | Data validation: rows pass or fail checks; schema change breaks a pipeline | `ops-data-debt` | `d-clean-eda` | S |
| M71 | Safe release: pipeline gates, a canary slider, automatic rollback | `ops-mlops` | | M |
| M72 | Drift monitoring: a stream whose mean shifts; alert threshold; false alarms | `ops-monitoring` | `ml-evaluation` | M |
| M73 | Serving and scaling: requests, queue, batch size, latency, cost, autoscaling | `ops-serving` | `ops-scale` | L |
| M74 | Production architecture: follow a request through the parts; break one part and see the effect | `ops-architecture` | | S |

## 5. Lesson by lesson (all 72)

Legend: **Sim** = home of a module, **Preset** = reuses a module, **None** = no simulation.

| Part | Lesson | Result | Module |
| --- | --- | --- | --- |
| 1 | `s-what-is-ai` | Sim | M01 |
| 1 | `s-lifecycle` | Sim | M02 |
| 1 | `s-setup` | None (a checklist) | |
| 1 | `s-python-refresher` | None (syntax) | |
| 1 | `s-csharp-refresher` | None (syntax) | |
| 2 | `d-basics` | Sim | M03 |
| 2 | `d-collect` | Sim (optional) | M06 |
| 2 | `d-clean-eda` | Sim | M04 |
| 2 | `d-features` | Sim | M05 |
| 3 | `ml-learning` | Sim | M10 (+ M01, M30 presets) |
| 3 | `ml-regression` | Sim | M11 |
| 3 | `ml-linear-deeper` | Preset | M11 |
| 3 | `ml-classification` | Sim | M12 |
| 3 | `ml-algorithms` | Sim | M13 |
| 3 | `ml-trees-more` | Preset | M13 |
| 3 | `ml-model-compare` | Preset | M12, M13, M15 |
| 3 | `ml-evaluation` | Sim | M15 |
| 3 | `ml-generalisation` | Sim | M14 |
| 3 | `ml-improve` | Preset | M14 |
| 3 | `ml-unsupervised` | Sim | M16, M17 |
| 3 | `ml-clustering` | Preset | M16 |
| 3 | `ml-patterns` | Sim | M18 |
| 3 | `ml-see-data` | Preset | M17 |
| 3 | `ml-recommenders` | Sim | M19 |
| 3 | `ml-timeseries` | Sim | M20 |
| 3 | `ml-bayes` | Sim | M21 |
| 3 | `ml-causal` | Sim | M22 |
| 3 | `ai-search` | Sim | M23 |
| 3 | `ai-logic-plan` | Sim | M24 |
| 4 | `dl-neural-nets` | Sim | M30 |
| 4 | `dl-training` | Sim | M31 (+ M30 preset) |
| 4 | `dl-backprop` | Sim | M32 |
| 4 | `dl-vision` | Sim | M33 |
| 4 | `dl-vision-more` | Preset | M33 |
| 4 | `dl-sequences` | Sim | M34 (+ M50 preset) |
| 4 | `dl-nlp-classic` | Sim | M35 |
| 4 | `dl-transformers` | Sim | T1 to T4, T6 |
| 4 | `dl-generative` | Sim | M37 |
| 4 | `dl-gen-more` | Preset | M37 |
| 4 | `dl-graphs` | Sim | M38 |
| 4 | `dl-speech` | Sim | M39 |
| 4 | `dl-rl` | Sim | M40 |
| 4 | `dl-rl-value` | Preset | M40 |
| 4 | `dl-rl-policy` | Preset | M40 |
| 5 | `llm-tokens` | Sim | M50, M51 |
| 5 | `llm-how` | Sim | T5, M51 |
| 5 | `llm-design` | Sim | M52 |
| 5 | `llm-train-laptop` | Preset | M52, T6 |
| 5 | `llm-scale` | Preset | M52 |
| 5 | `llm-embed-train` | Sim | M53 |
| 5 | `llm-finetune` | Sim | M54 |
| 5 | `llm-local` | Preset | M54 (quantisation) |
| 5 | `llm-paradigms` | Preset | M54 (blending, rounding) |
| 5 | `llm-eval` | Sim (optional) | M55 |
| 6 | `app-embeddings` | Sim | M60 |
| 6 | `app-rag` | Sim | M61 |
| 6 | `app-rag-advanced` | Preset | M61 |
| 6 | `app-llm-api` | Sim | M63 |
| 6 | `app-agents` | Sim | M64 |
| 6 | `app-genai-agentic` | Preset | M64 |
| 6 | `app-multimodal` | Sim | M65 |
| 6 | `app-security` | Sim | M66 |
| 6 | `app-evals` | Sim | M67 |
| 6 | `app-responsible` | Sim | M68 |
| 6 | `app-frameworks` | Sim | M69 |
| 6 | `app-prompting` | None (needs a real model) | |
| 7 | `ops-data-debt` | Sim | M70 |
| 7 | `ops-mlops` | Sim | M71 |
| 7 | `ops-monitoring` | Sim | M72 |
| 7 | `ops-serving` | Sim | M73 |
| 7 | `ops-scale` | Preset | M73 |
| 7 | `ops-architecture` | Sim | M74 |

Count: 4 None, 2 optional (`d-collect`, `llm-eval`), 66 with a simulation or preset.

## 6. Order of work

Ordered by how central the concept is, then by what the owner named first.

| Phase | Modules | Why first |
| --- | --- | --- |
| 0 | Engine and **four pilots: M30 neural network, M50 + M51 tokens and generation, T2 attention, M13 supervised playground** | The owner's named examples. Four different shapes (network drawing, text pipeline, matrix heat map, scatter plot) test the engine. Decision gate after them. |
| 1 | Rest of the Transformer series (T1, T3, T4, T5, T6), M10, M31, M32 | Completes "how a neural network works" and "how a Transformer works" |
| 2 | M11, M12, M14, M15, M16, M17, M18 | Supervised and unsupervised core |
| 3 | M52, M53, M54, M60, M61 | Language models and retrieval |
| 4 | M33, M34, M35, M37, M38, M39, M40 | The rest of deep learning |
| 5 | M19, M20, M21, M22, M23, M24 | Remaining machine learning and classic AI |
| 6 | M01 to M06, M63 to M69 | Start, data and application lessons |
| 7 | M70 to M74, optional M55, the `simulations.html` catalogue ("Simulation lab", grouped by topic), polish, screen-reader pass | Production and finish |

Each phase is a batch like the outline batches: build, check, commit and push, then wait for the owner to say go.

## 7. Effort (honest, in plain terms)

- Engine plus four pilots: the largest single piece of work.
- **S** modules (about 8): about the cost of a short lesson. No new code.
- **M** modules (about 26): about one lesson plus drawing code each.
- **L** modules (about 12, plus the Transformer series): the heaviest. The playground, clustering, generative, reinforcement learning, serving and the Transformer series are the largest.
- Presets (about 20 lesson sections): small.
- Every module also needs a **Python and C# computation** of its headline numbers where the lesson does not already have one, so the page numbers can be checked against real code.
- Total: about 52 modules plus the Transformer series, in about 8 batches after the engine. This is a large programme; the phase order means the owner gets the core concepts first and can stop or re-plan at any gate.

## 8. Rules that apply to every module

From the first plan, unchanged: real computation only, repeatable data, "made-up data" label, a "What this leaves out" note, default numbers equal the lesson example output, no outside resources, no inline script or style, tokens for colour, reduced motion respected, polite live region, keyboard operable, works from `file://`, 320 to 1920 px, both themes, loaded only on pages that use it.

New for this plan:

- A shared tiny model (Transformer series, tokeniser text, generation model) is **trained by a script in `examples/` and shipped as a small JSON file**. The script, its seed and the file size are stated in the lesson.
- No simulation claims to show the behaviour of a real large model.
- Bundled texts and data are written for the guide, not copied.

## 9. Decisions for the owner

| # | Question | Recommended |
| --- | --- | --- |
| F1 | Approve this wider scope (66 lessons, 52 modules)? | Yes, in the phase order above, with a gate after Phase 0 |
| F2 | Transformer series: shared tiny model with weights trained offline and shipped as JSON | Yes |
| F3 | Add "Predict first" and "Try this" challenges to every simulation | Yes |
| F4 | Keep `d-collect` (M06) and `llm-eval` (M55) as optional | Yes, decide when their phase arrives |
| F5 | Pilot set: M30, M50 + M51, T2, M13 | Yes |

## Progress

- 2026-11-19: plan written.
- 2026-11-19: Phase 0 built. Engine (`src/lib/sim.mjs`, `public/assets/sim.js`, styles, `--sim-*` tokens, `check-sims`, static and e2e checks) and four pilot simulations in five modules: neural network playground (`dl-neural-nets`), tokens and generation loop (`llm-tokens`), one attention layer on a tiny trained model (`dl-transformers`), supervised algorithms (`ml-algorithms`). JavaScript and Python print the same numbers (`npm run check:sims`). Decisions taken in the build: challenge ticks use a separate storage key; the attention model has attention only (no feed-forward block yet; T4 will retrain it); C# mirrors of the calculations are not written yet. Waiting for the owner's review (gate).
- 2026-11-19: Phase 1 built. Transformer series T1, T4, T5, T6 (with T2 and T3 from Phase 0) on one retrained tiny model (now with a feed-forward network and layer normalisation, gradients checked numerically, 2.4e-08), plus M10 gradient descent (`ml-learning`), M31 optimiser race (`dl-training`) and M32 backpropagation (`dl-backprop`). `check-sims` compares seven Python programs with the page code. Decisions: the series shares one model and one logic file (`attn.js`); M31 ships the optimiser race and gradient noise, and **dropout and batch normalisation move to Phase 5** with the regularisation modules; layer normalisation has no learned scale or shift (stated on the page); T5 and T6 are in `llm-how` and `dl-transformers` (a preset in `llm-train-laptop` is still open).
- 2026-11-19: Phase 2 built. M11 regression (`ml-regression`), M12 classification threshold, confusion matrix and ROC (`ml-classification`), M14 bias and variance (`ml-generalisation`), M15 cross-validation folds (`ml-evaluation`), M16 k-means, elbow and DBSCAN (`ml-unsupervised`), M17 PCA (`ml-unsupervised`), M18 anomalies (`ml-patterns`). One shared calculation file (`core.js`) and one Python twin (`core.py`), 8 programs now checked by `check-sims`. Left out for later: hierarchical clustering (M16), the calibration curve (M12), precision and recall against the threshold as a separate chart (M15; the threshold view lives in M12), lasso (M11), and the boosting rounds and click-to-add points of M13.
- 2026-11-19: Phase 3 built. M52 model builder and a count model learning to write (`llm-design`), M53 embedding training (`llm-embed-train`), M54 LoRA and quantisation (`llm-finetune`), M60 vector search (`app-embeddings`), M61 retrieval pipeline over a made-up document (`app-rag`). One calculation file (`llm.js`) with a Python twin (`llm.py`); 9 programs now checked by `check-sims`. Decisions: the "learning to write" part uses a count model, not a trained network, and says so; the RAG simulation scores chunks by keyword weights and checks whether the answer text reaches the model, because no real language model runs in the page. Left for later: blending two models (M54), hybrid blend and re-ranking (M61), the presets in `llm-scale`, `llm-local`, `llm-paradigms`, `llm-train-laptop` and `app-rag-advanced`.
- 2026-11-19: Phase 4 built. M33 convolution (`dl-vision`), M34 running state (`dl-sequences`), M35 TF-IDF (`dl-nlp-classic`), M37 autoencoder and diffusion noise (`dl-generative`), M38 message passing (`dl-graphs`), M39 spectrogram (`dl-speech`), M40 bandit and grid-world Q-learning (`dl-rl`). One calculation file (`dl.js`) with a Python twin (`dl.py`); 10 programs now checked by `check-sims`. Left for later: boxes, IoU and non-maximum suppression (M33), the embedding map (M34), tagging a sentence (M35), the GAN (M37), policy gradient (M40), and the presets in `dl-vision-more`, `dl-gen-more`, `dl-rl-value`, `dl-rl-policy`, `app-rag-advanced` and `app-multimodal`.
- 2026-11-19: Phase 5 built. M19 recommender (`ml-recommenders`), M20 forecasting (`ml-timeseries`), M21 probability of a test result (`ml-bayes`), M22 Simpson's paradox (`ml-causal`), M23 maze search and a minimax game tree with pruning (`ai-search`), M24 map colouring by backtracking (`ai-logic-plan`). One calculation file (`ai.js`) with a Python twin (`ai.py`); 11 programs now checked by `check-sims`. Left for later: taste lists and hidden factors (M19), a random-split leakage view (M20), belief update across several tests beyond two (M21), a causal graph drawing (M22), building a plan step by step (M24).
- 2026-11-19: Phase 6 built. M01 rules against learning (`s-what-is-ai`), M02 project loop (`s-lifecycle`), M03 splits and leakage (`d-basics`), M04 cleaning (`d-clean-eda`), M05 scaling and encoding (`d-features`), M06 label noise (`d-collect`), M63 LLM call with retries (`app-llm-api`), M64 agent chain (`app-agents`), M65 image patches (`app-multimodal`), M66 prompt injection guards (`app-security`), M67 test-set size (`app-evals`), M68 fairness thresholds (`app-responsible`), M69 tool messages (`app-frameworks`). One calculation file (`fnd.js`) with a Python twin (`apps.py`); 12 programs now checked by `check-sims`. Decisions: M63 streams no real model (simulated failures, placeholder prices and speeds, said on the page); M66 is a simplified table of which guard stops which invented attack, with real defences described as partial; M69 uses the common tool-calling message names and tells the reader to check the specification. Left for later: the second-model blend in M01, annotator-disagreement review in M06, real streaming animation in M63, and the presets in `ml-linear-deeper`, `ml-model-compare`, `ml-evaluation`, `ml-timeseries`, `ops-mlops` and `llm-eval`.
- 2026-11-19: Phase 7 built, and the plan is complete. M70 data checks (`ops-data-debt`), M71 canary release (`ops-mlops`), M72 drift alerts (`ops-monitoring`), M73 serving and scaling (`ops-serving`), M74 request through a production system (`ops-architecture`), optional M55 perplexity and answer scoring (`llm-eval`). The `simulations.html` "Simulation lab" page lists every simulation by part and is in the sidebar. An automated structural accessibility check runs over every simulation page in light and dark themes. 13 programs checked by `check-sims`. **Totals:** 61 simulations in 51 lessons, 13 Python twins, 124 browser checks. **Not done:** a real screen-reader session (needs a person with the tool), C# versions of the simulation maths, challenge ticks in the progress export, and the preset blocks listed under earlier phases.
