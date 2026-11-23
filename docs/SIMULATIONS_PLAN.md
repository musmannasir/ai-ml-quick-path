# Plan: live simulations for AI concepts

Status: plan only (2026-11-19). Nothing is built yet. Source of the idea: the owner's sample page
`https-ssl-explained.html` ("How HTTPS and SSL work: simple explanation and live simulation").

> **Scope widened 2026-11-19:** see `docs/SIMULATIONS_FULL_PLAN.md` (all 72 lessons checked, 52 modules, Transformer series). Sections 5, 6 and 10 of this file are replaced by it; sections 1 to 4, 7 and 8 still apply.

## 1. What the sample does well (analysis)

The sample is one page with five numbered sections. Only section 4 is a simulation. The other four prepare for it and explain it afterwards.

| Part of the sample | What it does | Why it works |
| --- | --- | --- |
| 1. What is it? | One everyday picture (postcard against locked box) plus a short definition list | The learner has the idea before seeing any detail |
| 2. Three promises | Three cards: what the technique guarantees | Gives the learner a checklist to look for in the simulation |
| 3. The handshake | Five numbered steps, then an analogy (paint mixing) in four rows | Shows the steps once, slowly, with no interaction |
| 4. Simulation | See 1.1 below | Learner changes one thing and watches the result change |
| 5. Why it works | Table (each attack against each mode), two "why" cards, an honest-limits callout, a "simplifications" note | Turns what was watched into understanding, and says what the demo leaves out |

### 1.1 Anatomy of the simulation block

1. **Step A, inputs.** A small form (username, password) with fake values and a note: "use fake values; nothing leaves your browser".
2. **Step B, scenario.** Segmented choices (HTTP or HTTPS; three attacker moves), a pace slider, a "step by step" switch. One variable at a time, with a tip: "run it on HTTP first, then HTTPS, and compare".
3. **Run controls.** Start, Pause, Next step, Reset.
4. **Narrator bar.** "Step 3 of 7", a plain-words title, one sentence, a thin progress bar.
5. **Verdict banner.** Green or red outcome, one headline and one sentence.
6. **Scene.** An SVG with the actors (browser, routers, server, attacker), a wire, and animated packets that carry labels. Visual state changes when something happens (a tunnel appears, a lock appears, the attacker flashes, a warning page pops up).
7. **Three log panels.** What each actor sees at the same moment (browser, hacker, server). This is the strongest idea in the sample: the learner sees the same event from three viewpoints.
8. **Real computation.** The encrypted bytes shown are produced by the browser's own cryptography, so the output is genuine and not a drawing.

### 1.2 Engine design in the sample

- Each scenario is an async function that narrates, logs, animates and waits.
- A run id cancels any old run when Reset or a setting is changed.
- `sleep` and `move` obey Pause and the speed slider; step mode waits for the Next button.
- It works without the crypto API (a fallback), and shows an error in the narrator bar if something fails.

### 1.3 What must NOT be copied

| Sample choice | Problem for this project | Replacement |
| --- | --- | --- |
| One large inline `<script>` and many inline `style=""` | CSP forbids both; the build only allows the one hashed script | One external file `public/assets/sim.js` (same origin, loaded only on pages that have a simulation) and classes in `app.css` |
| Hard-coded hex colours | Colours live only in `src/design/tokens.mjs`; both themes must pass contrast 4.5:1 | New tokens (section 4.3) |
| Emoji as the main visuals | Renders differently per platform, weak for screen readers | Simple SVG shapes and labels; an emoji may decorate but never carry meaning |
| `min-width: 760px` SVG inside a scroll box | Poor on phones | Scene is drawn on a responsive `viewBox`; below 640 px it switches to a vertical layout |
| Animation always on | Motion sensitivity | Respect `prefers-reduced-motion`: show steps without moving packets |
| No live region | Screen-reader users hear nothing | The narrator bar is `aria-live="polite"` |
| Page-specific code | Not reusable | A generic engine plus small per-simulation data or modules |

## 2. What the owner asked for

For each concept: a **simulation section** that explains that concept with the best UI/UX and visuals. It must:

- keep the current layout and the simple-words style undisturbed;
- follow the guide rules (Python and .NET in every lesson, honest numbers, no outside resources, WCAG 2.2 AA, both themes, 320 to 1920 px);
- be planned and built in batches.

## 3. Decisions to take (recommended defaults in bold)

| # | Question | Options |
| --- | --- | --- |
| S1 | Where does a simulation sit in a lesson? | **A new optional section `## Live simulation` after "How it works" and before "Python example"** / inside "How it works" / a separate page per simulation |
| S2 | How many lessons get one? | **About 30 of 72 in three waves, only where watching change beats reading** / all 72 |
| S3 | How is it built? | **A generic engine (`sim.js`) with two kinds: step-through (data only) and compute (small JS module)** / one hand-made script per lesson |
| S4 | First simulations for a pilot | **Neural network playground, token generation, supervised comparison (section 10.5)**; replaces the earlier choice of three lessons |
| S5 | Add a catalogue page of all simulations? | **Yes, `simulations.html`, a filterable list that links to each lesson section** / no |

## 4. Design

### 4.1 Where it goes in the lesson

New optional section `## Live simulation`, placed between `How it works` and `Python example` (the build already allows optional sections; order is enforced, so the section list in `src/lib/markdown.mjs` gets one more allowed title and one more position rule).

It uses the existing report style: bordered panel, numbered blue badge, full lesson width (like diagrams, code and tables; the 72ch limit applies only to prose). It sits BELOW the text, never beside it.

The section has a fixed inner structure so every simulation feels the same:

1. **Question line.** One sentence: "What happens to X when you change Y?"
2. **Controls** (Step A and B of the sample, merged into one card): 1 to 3 inputs, a scenario switch, Run, Pause, Next, Reset, Pace.
3. **Narrator bar** with step count, title, sentence, progress bar (live region).
4. **Scene** (the picture that moves).
5. **Readouts.** Two to three panels that show the same moment from different viewpoints, as the sample's three logs. For ML, for example: "the data", "the model", "the score". On phones they become tabs.
6. **Verdict.** What the learner should now notice, in one or two sentences.
7. **"What this leaves out"** note (the sample's "Simplifications" card). Required, so no simulation overclaims.

The section reads in plain words first (a short "what to watch for" list of 2 to 3 bullets) so it also works with scripts off and for print (see 4.6).

### 4.2 Authoring: the `sim` block

A fenced block in the lesson markdown, in the same style as `diagram` and `maths`:

```
```sim kmeans Watch k-means group points
kind: compute
question: What happens to the groups when you change k?
watch: Points change colour when they join a group.
watch: The group centres move until they stop moving.
control: k | range 2..5 | 3
control: data | choice | two blobs, three blobs, one smear
leaves-out: Real data has many more columns, and k-means can get stuck in a poor answer.
```
```

Two kinds:

- **`kind: steps` (step-through).** The whole simulation is data: actors, ordered steps, what each actor logs, which visual state changes, the verdict. The generic engine plays it. Good for processes (a request travelling, a training loop, a RAG pipeline). Authoring cost is low and needs no JavaScript.
- **`kind: compute`.** Needs real calculation (gradient descent, k-means, softmax, tokenising, the bias and variance curve). A small module `public/assets/sims/<id>.js` registers `{ init, run(state), draw }` with the engine. The engine supplies controls, narrator bar, pause and step handling, themes and tests; the module supplies only the maths and the drawing.

The build parses the block, checks it (known kind, control ranges, a `leaves-out:` line, a matching module file for `compute`), and renders the static markup: the controls, the empty scene and the readouts, plus the plain-text "what to watch for" list. `sim.js` then brings it to life. If scripts are off, the static part still reads as a described figure.

### 4.3 Files

```
src/lib/sim.mjs                 parse + validate + render the static markup (like diagram.mjs)
public/assets/sim.js            engine: run id and cancel, pause, step, speed, narrator, tabs, reduced motion
public/assets/sims/<id>.js      one small module per compute simulation
public/assets/app.css           sim styles (section "Simulations" at the end)
src/design/tokens.mjs           new tokens: sim-actor-a/b/c, sim-good, sim-bad, sim-warn, sim-wire, sim-scene-bg
scripts/check-sims.mjs          lint: every sim block valid, modules exist, defaults match the examples (see 4.5)
tests/e2e.mjs                   new checks (section 7)
src/data/sims.mjs               catalogue (id, lesson, kind, minutes) for simulations.html
```

`sim.js` is loaded only on pages with a simulation (a `<script src>` is allowed by the CSP; no inline script is added). No library, no outside file, no canvas library: SVG and DOM only.

### 4.4 Visual design

- **One visual language** for all simulations: actors are rounded rectangles with a short label; data moves as small labelled chips; the "good" state is green, the "problem" state is red, "unknown" is grey. Colour is never the only signal: every state also has a word or a shape (tick, cross).
- **Both themes** come from tokens only. Scene backgrounds follow the theme.
- **Layout:** desktop shows controls on the left and the scene on the right (like the sample), readouts underneath in a row. Tablet stacks controls above the scene. Phone stacks everything and turns the readouts into tabs; the scene redraws in a vertical arrangement.
- **Motion:** easing for packets, 200 to 400 ms for state changes, a "pace" slider, Pause, and Step. With `prefers-reduced-motion` the engine jumps from step to step and highlights instead of moving.
- **Typography and spacing:** inherit the guide's tokens, no new fonts.
- **Print:** the simulation is replaced by its static "what to watch for" text and a final-state snapshot caption (the engine does not run in print).
- **Focus mode:** the simulation stays visible; ads are never placed near it (existing rule).

### 4.5 Honesty and the Python and .NET rule

- A simulation shows **real computation** done in the browser, never a drawing of an imagined result. Data is generated by a fixed formula or a repeatable random generator; the section says "made-up data".
- For every `compute` simulation, its **default settings must give the same numbers as the lesson's Python and C# example output** (those programs already use repeatable generators). `check-sims.mjs` runs the module in Node with the default controls and compares the headline numbers with the text between the markers in the lesson's output block. If they differ, the build fails.
- Where the browser version is an approximation (for example fewer training steps so it runs fast), the `leaves-out:` line says so.
- Simulations teach; the Python and C# examples remain the place where the learner runs real code. Each simulation ends with a link to its own examples.

### 4.6 Accessibility

- Every control is a real `<input>`, `<select>` or `<button>` with a label; arrow-key operable.
- The narrator bar is a polite live region; log entries are not announced one by one (only the narrator is).
- The scene has a `role="img"` label that describes the starting state; the readouts hold the same facts as text, so nothing is visible only in the drawing.
- Focus is visible; the Next button is reachable in step mode; Escape does not trap focus.
- Text contrast 4.5:1 in both themes (the e2e check measures it).
- No flashing faster than 3 times a second. The sample's red flash is replaced by a single outline pulse.
- Works with scripts off (static text) and with storage blocked.
- Progress: a simulation is not required for completion. A "tried the simulation" tick is stored with the lesson (`exercise:`-style key `sim:<id>`, shown in the progress page; `migrate()` is not needed because it only adds a new key type, but the export validator gets the new prefix).

## 5. Which concepts (about 30, three waves)

Rule: a lesson gets a simulation only if **changing a setting and watching the outcome teaches more than a paragraph**. Lessons about tools, setup or policy do not (for example `s-setup`, `ops-architecture`, `app-responsible` get none).

### Wave 1: foundations of learning (10)

| Lesson | Simulation | Kind | Learner changes | Learner sees |
| --- | --- | --- | --- | --- |
| `ml-learning` | Rules against learning | steps | Number of examples | A rule list breaking, a model improving |
| `ml-regression` | Fit a line | compute | Drag points, slope and intercept | Error bars shrink; the best line found |
| `ml-classification` | Decision boundary | compute | Model type, add points | Boundary moves; confusion counts update |
| `ml-generalisation` | Bias and variance | compute | Model size (degree) | Training and test error curves split |
| `ml-evaluation` | Threshold slider | compute | Threshold | Precision, recall and the confusion table move |
| `ml-clustering` | k-means | compute | k, data shape | Points recolour; centres move |
| `ml-trees-more` | Tree splitting | steps | Depth | Regions split; impurity falls |
| `d-clean-eda` | Missing and outliers | compute | Fill method | Mean and chart change |
| `ml-improve` | Learning curves | compute | Data size, model size | Which fix helps |
| `s-lifecycle` | Project loop | steps | Where a fault appears | Which stage must repeat |

### Wave 2: deep learning and language models (12)

| Lesson | Simulation | Kind |
| --- | --- | --- |
| `dl-neural-nets` | Signals through a small network (weights and activations) | compute |
| `dl-training` | Gradient descent on a bowl; learning rate too small or large | compute |
| `dl-backprop` | Backward pass through a tiny graph | steps |
| `dl-vision` | Convolution filter sliding over an image | compute |
| `dl-sequences` | Hidden state passing along a sentence | steps |
| `dl-transformers` | Attention weights between words | compute |
| `llm-tokens` | Type text and watch it split into tokens | compute |
| `llm-how` | Next-word choice with temperature and top-p | compute |
| `llm-embed-train` | Contrastive pull and push of three pairs | compute |
| `llm-paradigms` | Model merge and 4-bit rounding | compute |
| `dl-rl-value` | Grid world value spreading | compute |
| `dl-gen-more` | Noise removed step by step (diffusion idea) | steps |

### Wave 3: applications and production (8)

| Lesson | Simulation | Kind |
| --- | --- | --- |
| `app-embeddings` | Points on a map; nearest neighbours | compute |
| `app-rag` | A question travelling: split, embed, retrieve, answer | steps (the sample's structure, with three viewpoints: user, retriever, model) |
| `app-agents` | Plan, tool call, observe loop | steps |
| `app-security` | Prompt injection against a guarded and an unguarded assistant (same shape as the sample's attacker choice) | steps |
| `ops-serving` | Requests, batching and latency | compute |
| `ops-monitoring` | Drift: a stream whose mean shifts; alert threshold | compute |
| `ops-data-debt` | Bad rows passing or caught by checks | steps |
| `ml-recommenders` | Ratings matrix and a recommendation | compute |

Not in a wave but possible later: `ai-search` (maze search), `ml-bayes` (belief update), `ml-causal` (confounder), `ml-timeseries` (smoothing window).

The numbers above (30) are a target. The owner can cut or reorder any row.

## 6. Delivery plan

### 6.1 Phase 0: engine and pilot (first)

1. Add the tokens, the `sim` block parser/validator/static renderer, CSS, and `sim.js` with controls, narrator bar, pause, step, speed, reset, reduced motion, tabs on phones.
2. (Superseded by section 10.5.) Pilot three lessons, one of each shape, and review them with the owner before going on:
   - `ml-generalisation` (compute, charts),
   - `dl-backprop` (steps, flow),
   - `llm-tokens` (compute, text).
3. Checks that must pass for the pilot: build, `check-sims`, static, e2e (new checks included), a manual look at 320, 768 and 1440 px in light and dark, keyboard-only run, reduced motion on.

Decision gate: the owner approves the look and feel. Then waves start.

### 6.2 Per-lesson steps (repeatable, about the cost of one lesson)

1. Write the `## Live simulation` section and its `sim` block (and the module if `compute`).
2. Make the defaults match the lesson's example output; add the markers for `check-sims`.
3. Add the glossary terms the simulation introduces, if any.
4. Build, `check:sims`, `check:maths`, `check:diagrams`, static, e2e; extract and verify code if code changed.
5. Log in `docs/SIMULATIONS_PLAN.md` (progress section) and update counts.

### 6.3 Waves

| Phase | Lessons | Cost | Note |
| --- | --- | --- | --- |
| 0 | engine and 3 pilots | large (once) | decision gate |
| 1 | 7 more of wave 1 | moderate | mostly `compute` with charts |
| 2 | wave 2 (12) | largest | transformer and attention need the most care |
| 3 | wave 3 (8) + `simulations.html` catalogue | moderate | mostly `steps`, cheap once the engine exists |
| 4 | polish: screen-reader pass, phone test, print, performance | small | see 8 |

Suggested pace, as with the outline plan: one batch of 5 to 6 simulations at a time, committed and pushed after each, with the owner able to stop and review between batches.

### 6.4 Docs to update when it ships

`CLAUDE.md` (new section "Simulations": block syntax, files, rules), `README.md` (counts), `QA_REPORT.md`, `PROJECT_PLAN.md`, `docs/DESIGN_SYSTEM.md` (tokens and component), `migration-src` notes and a run of `UpdateMigration.exe --no-pause`.

## 7. Tests and checks

- `scripts/check-sims.mjs` (new, in `npm test`): block syntax; every `control:` has a valid type and default; a `leaves-out:` line exists; compute module present and exports the expected functions; **default output equals the lesson example output**.
- `tests/static-checks.mjs`: sim markup has labelled controls; no inline `style=`; no inline script; `sim.js` is the only added script; zero outside addresses.
- `tests/e2e.mjs` additions (Edge): for each pilot, Run reaches the last step; Pause stops it; Next advances one step; Reset clears; keyboard-only run; the narrator has `aria-live`; with `prefers-reduced-motion` no moving element; no horizontal scroll at 320 px; contrast in both themes; the "tried it" tick is saved and exported; storage blocked does not break it.
- Performance budget: each simulation module under 20 KB, the engine under 40 KB, start-up under 100 ms on a normal laptop, no work while the section is off screen.
- The existing counts (lessons per part, glossary) stay data-driven.

## 8. Risks and how they are handled

| Risk | Handling |
| --- | --- |
| Simulation shows a number that differs from the lesson | `check-sims` compares defaults with the real example output |
| Layout of lessons feels heavier | One optional section, collapsed to its question line until opened? (Decision S6 below) |
| Too much JavaScript | Engine written once; modules small; loaded only where used |
| Phones | Vertical scene, tabs for readouts, tested at 320 px |
| Motion sensitivity | Reduced motion mode; no fast flashing |
| Cost grows with 30 lessons | Batches, a decision gate, and `steps` simulations that need no code |
| A simulation over-simplifies | Required "What this leaves out" note |
| Maintenance | One engine, one visual language, tokens only, tests per simulation |

**S6 (extra decision):** show the simulation open, or collapsed behind a "Try it" button? Recommended: **open on desktop, collapsed on phones**, so long lessons stay short on small screens.

## 9. What I need from the owner

1. Answers to S1 to S6, or approval of the bold defaults.
2. Approval of the three pilot lessons (S4), or other choices.
3. Go-ahead to start Phase 0.

## 10. Core-concept focus (added 2026-11-19, replaces the order in sections 5 and 6)

The owner asked for simulations on the **core concepts first**: how a neural network works, how tokens are generated, and how supervised and unsupervised algorithms behave. This section maps those concepts to the lessons that already teach them, and changes the order of work.

### 10.1 What already exists, and why it is not enough

The guide has eight small calculators (`widget:` in maths moments: mean, line, confusion, gradient, dot, softmax, weighted, memory). Each one computes a single formula for numbers the learner types. They do not show a **process**: no network that learns, no text that turns into tokens and grows one token at a time, no clusters that move. Simulations are the next level up. The calculators stay; several simulations reuse their formulas (softmax, gradient, dot, weighted, confusion, line).

### 10.2 Flagship simulations (16) and the lessons that use them

One simulation module can appear in several lessons through a `preset:` line (for example the network playground opens with "forward pass only" in `dl-neural-nets`, "learning rate and dropout" in `dl-training`, and "backward pass" in `dl-backprop`). So 16 modules cover about 30 lesson sections, and a learner meets the same tool again and already knows how to use it.

| # | Core concept | Simulation (what is on screen) | What the learner changes | Real computation in the browser | Home lesson | Also appears in (preset) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **How a neural network works** | Network drawn as layers; line thickness and colour show weight size and sign; each neuron shows its number; a map shows what the network predicts; a loss curve falls as it trains | Dataset (line, XOR, circle), layers and neurons, activation, learning rate; Step, Train, Reset; "follow one example" | A small multilayer network trained by gradient descent in plain JavaScript | `dl-neural-nets` | `dl-training` (learning rate, dropout, overfit on tiny data), `dl-backprop` (backward arrows, one example), `ml-learning` |
| 2 | **Loss and gradient descent** | A ball on a bowl (one weight, then two); step arrows; loss number | Learning rate, start point, steps | The real update rule | `ml-learning` | `dl-training`, `dl-backprop` |
| 3 | **How tokens are produced** | Three linked stages: text becomes tokens (BPE merges shown one by one), tokens become ids, ids give scores | Type any text; number of merges | A real byte-pair-encoding trainer on a small bundled text | `llm-tokens` | `dl-sequences`, `llm-how` |
| 4 | **How a language model generates text** | The loop: context, scores, probability bars, pick one, append, repeat; context window filling up | Temperature, top-k, top-p, greedy or sample, prompt, Step or Auto | A tiny next-token model trained in the browser on a small bundled text (counts of word pairs and triples) | `llm-how` | `llm-tokens` (temperature preset), `llm-design`, `llm-train-laptop`, `llm-scale` |
| 5 | **Attention** | A sentence; click a word to see who it looks at (arc thickness); the score table underneath | Word clicked, head, temperature of the softmax | Dot products and softmax from a small fixed toy embedding, with the arithmetic shown | `dl-transformers` | `llm-how` |
| 6 | **Supervised: choose and compare algorithms** | A 2D scatter; the background shows each algorithm's decision map; train and test accuracy; confusion counts | Dataset, click to add or move points, algorithm (k-nearest neighbours, logistic regression, decision tree, naive Bayes), its main setting (k, depth) | Each algorithm written in plain JavaScript | `ml-algorithms` | `ml-classification` (threshold slider and confusion matrix), `ml-model-compare`, `ml-generalisation` (settings too high), `ml-trees-more` |
| 7 | **Regression** | Points, the line, residual bars, error and R² | Drag points; drag the line; "fit best line" | Least squares | `ml-regression` | `ml-linear-deeper` |
| 8 | **Bias and variance** | Polynomial fitted to noisy points; training and test error curves | Degree, noise, number of points | Polynomial least squares | `ml-generalisation` | `ml-improve` (learning curves) |
| 9 | **Unsupervised: clustering** | Points; k-means in two visible phases (assign, move centres); elbow chart | k, data shape, Step; DBSCAN: eps and min points | k-means and DBSCAN in plain JavaScript | `ml-unsupervised` | `ml-clustering`, `ml-patterns` |
| 10 | **Unsupervised: compression and anomalies** | Points with the main axis (PCA) rotating; share of variance; anomaly scores and a threshold | Data stretch, number of components, contamination | PCA by power iteration; a simple distance-based anomaly score | `ml-unsupervised` | `ml-patterns`, `ml-see-data` |
| 11 | **Convolution** | An image grid; a small filter slides; the feature map fills in | Filter (edge, blur, custom), stride, padding | Real convolution | `dl-vision` | `dl-vision-more` |
| 12 | **Sequences (RNN)** | A sentence; a hidden-state bar updates word by word | Sentence, forget strength | The real recurrence with fixed small weights | `dl-sequences` | |
| 13 | **Generative: diffusion and autoencoder** | An image or points; noise added step by step, then removed | Number of steps, noise level | Real forward noising; a simple learned denoiser for toy data | `dl-generative` | `dl-gen-more` |
| 14 | **Reinforcement learning** | A small grid; the agent moves; values spread as colour | Reward, discount, exploration, Step or Auto | Q-learning | `dl-rl` | `dl-rl-value`, `dl-rl-policy` |
| 15 | **Embeddings, RAG and agents** | A 2D map of word or sentence points; a query lands near its neighbours; then the RAG pipeline (split, embed, retrieve, answer) with viewpoints user, retriever, model; an agent loop (plan, tool, observe) | Query, number of chunks, a bad chunk, a tool error | Cosine similarity on a small bundled embedding table (hand-built, labelled illustrative); the pipeline is step-through | `app-embeddings` | `app-rag`, `app-rag-advanced`, `app-agents`, `app-security` (injection against a guarded and an unguarded assistant) |
| 16 | **Recommenders** | A ratings grid; a user and an item as "taste" lists; the predicted rating | User, item, number of tastes | Dot product and a tiny factorisation | `ml-recommenders` | |

### 10.3 Where the idea does NOT apply

Setup, tools, process and policy lessons teach by doing or by checklist, so they get no simulation: `s-setup`, `s-python-refresher`, `s-csharp-refresher`, `d-collect`, `app-frameworks`, `app-responsible`, `ops-architecture`, `ops-mlops`. Borderline, and for later only: `s-lifecycle` (a loop picture is enough), `ops-serving` and `ops-scale` (a small latency simulation), `ops-monitoring` (drift), `ops-data-debt`, `llm-scale` and `llm-finetune` (memory and rounding bars).

### 10.4 Honesty rules specific to these simulations

- The neural network, the tokeniser and the next-token model are **real but tiny**, trained live in the page. The section says so in a "What this leaves out" note and never claims to show the output of a real large model.
- The bundled text for the tokeniser and the token generator is written for this guide (no copied text) and shown in full on the page. Its size and vocabulary are stated.
- The attention and embedding tables are small hand-set toy tables, labelled "illustrative", with the arithmetic visible.
- Floating-point differences between JavaScript and Python are small. `check-sims` compares headline numbers to a stated number of decimals, with a fixed seed and fixed iteration counts in both languages.

### 10.5 New order of work

| Phase | Content | Notes |
| --- | --- | --- |
| 0 | Engine (section 4) and **three pilots: #1 neural network playground, #4 token generation, #6 supervised comparison** | These are the three examples the owner named. Each is a different shape (network drawing, text pipeline, scatter plot), so together they test the engine. Decision gate after them. |
| 1 | #2, #3, #7, #8, #9, #10 | Finishes "how models learn", tokens, supervised and unsupervised basics. |
| 2 | #5, #11, #12, #13, #14 | Deep learning concepts. |
| 3 | #15, #16, and the `simulations.html` page ("Simulation lab", grouped as: How a neural network works, How a language model generates text, Supervised learning, Unsupervised learning, Applications) | Pipelines and the catalogue. |
| 4 | Presets in the other lessons listed in 10.2; polish and tests | Cheap once the modules exist. |

The earlier waves in section 5 are replaced by this table; the lessons there that are not in 10.2 (for example `d-clean-eda`, `ml-evaluation` as its own simulation, `ops-monitoring`) stay as optional later work.

### 10.6 Effort in plain terms

- Engine: one large piece of work, done once.
- Each flagship module: about the cost of writing one lesson plus its drawing code. The neural network playground and the token generator are the two biggest; #2, #7, #8 and #12 are small.
- Each preset in another lesson: small (a few lines and a short paragraph).
- Per module, the same checks as in section 7, plus a Python and C# version of the same computation in the lesson's examples where the lesson does not already have one.

## Progress

- 2026-11-19: plan written. Not started.
- 2026-11-19: owner asked for core concepts first (neural network, tokens, supervised and unsupervised). Section 10 added: 16 flagship simulations mapped to lessons with presets; pilots changed; order of work replaced.
