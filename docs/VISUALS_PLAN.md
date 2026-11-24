# Plan: concept visuals for the whole guide

Status 2026-11-23: plan only, nothing is built. Request from the owner: add the kind of visuals found in `InitialData/topics`
to every concept where they help.

**Owner requirement (2026-11-23): the existing boxes-and-arrows diagrams stay.** Each concept gets tabs. One tab, "Boxes", is the
current diagram, unchanged. The other tab, "Visual", holds the proper visual (illustrated card, heat map, annotated picture and so on).
Visuals are added over time; a diagram without a visual yet looks exactly as it does today (no tabs).

## 1. What kinds of visuals the pictures show
The 34 pictures use two styles.
- **Concept card:** one idea, one friendly hand-drawn scene, a big title, one sentence. Example: "Next-token prediction" (a machine offering
  candidate words 30, 60 and 90 for the sentence "Returns are allowed within ..."), "Self-attention" (arrows from "them" back to "headphones").
  Good for a first picture of an idea.
- **Cheat-sheet poster:** many numbered panels on one page, with formulas, small charts and short bullets. Example: "Math behind large
  language models" (11 panels). Good for revision and for seeing how the parts fit together.

## 2. What the guide has today
Every lesson already has 3 to 31 diagrams (boxes and arrows built in HTML and CSS) and 61 live simulations. What is missing is
(a) a memorable first picture of each concept, (b) pictures of things that are not flows (a grid of attention, a margin, a ball rolling downhill,
a forger and a detective), and (c) one-page summaries. Boxes-and-arrows diagrams are the right tool for flows and stay as they are.

## 3. Rules that apply
- **Do not reuse the pictures in the folder.** They come from other creators (named accounts and logos are on them). We draw our own, with our own wording.
- Nothing is loaded from other sites. Our own files are allowed (the site already serves `og-image.png`).
- Every visual has a text alternative, works in light and dark themes, has text contrast of at least 4.5:1, and does not cause sideways scrolling at 320 px.
- Facts, numbers and examples in a visual must agree with the lesson. Made-up numbers are labelled "illustrative".
- No inline styles or scripts (the site security policy).

## 4. Ways to build them (decision for the owner)
| Option | What it is | Good | Limit |
|---|---|---|---|
| A. New diagram types in the existing system | More block types written in the lesson text (a grid or heat map, a sentence with arrows, a curve with labels, a before/after pair) and drawn in HTML, CSS and inline SVG from the site's colour tokens | Free of images, themes and accessibility come built in, all checked by the build and tests | Clean and technical, not hand-drawn or cartoon |
| B. Our own SVG illustration files | A drawn scene per concept (simple objects and a friendly robot mascot), stored as `.svg` files in `public/assets/art/`, shown with a fenced block such as `card <name>` | Closest to the "concept card" look, small files, sharp at any size | I can write simple flat SVG scenes by hand, but I cannot produce polished character artwork. Detailed characters need an illustrator or a drawing tool |
| C. Cheat-sheet pages | One printable HTML page per part (and a few cross-cutting ones) with numbered panels, built from lesson data and shown in the guide and as PDF | Strong for revision, reuses maths already checked by the build | Each page is a design task; formulas must come from the lessons |

Recommendation: do A and C first, add B for a short list of "hero" concepts after the owner has chosen a style from a pilot.

## 5. Topics where a visual helps
Kind: **A** = new diagram type or a diagram in the current system, **B** = illustrated concept card, **C** = cheat sheet, **S** = already has a simulation (the visual is a static first picture).
Priority 1 means the biggest gain for beginners.

### Part 1: The big picture
| Lesson | Visual | Kind | Priority |
|---|---|---|---|
| s-what-is-ai | AI, machine learning, deep learning and generative AI as nested circles | A | 1 |
| s-what-is-ai | Rules written by hand versus a rule learned from examples | B | 1 |
| s-lifecycle | The project loop from idea to production as a road with stops | B | 2 |
| s-setup | The tools on a laptop as a stack | A | 3 |

### Part 2: Data
| Lesson | Visual | Kind | Priority |
|---|---|---|---|
| d-basics | Training, validation and test sets as practice, mock exam and final exam | B | 1 |
| d-basics | Data leakage: the answer sheet seen in advance | B | 1 |
| d-clean-eda | Missing values, outliers and duplicates on a small table | A | 2 |
| d-features | One-hot encoding and scaling before and after | A | 2 |
| d-collect | Label quality: two people labelling the same item differently | B | 3 |

### Part 3: Machine learning
| Lesson | Visual | Kind | Priority |
|---|---|---|---|
| ml-learning | Gradient descent as a ball rolling down a hill | B, S | 1 |
| ml-learning, ml-generalisation | Underfitting, a good fit and overfitting on the same points | A | 1 |
| ml-generalisation | Bias and variance as four darts on a board | A | 1 |
| ml-evaluation, ml-classification | Confusion matrix as four boxes with a real example | A | 1 |
| ml-evaluation | Precision and recall as a net catching fish | B | 1 |
| ml-evaluation | Cross-validation folds taking turns as the test part | A | 2 |
| ml-regression | A line, the gaps to the points (residuals) and R squared | A, S | 2 |
| ml-classification | The S-shaped curve of logistic regression | A | 2 |
| ml-algorithms | k-nearest neighbours as asking the neighbours | B | 1 |
| ml-algorithms | A decision tree as twenty questions | B | 1 |
| ml-algorithms | A random forest as many trees voting | B | 2 |
| ml-algorithms | Boosting as each new tree fixing the last one's mistakes | B | 2 |
| ml-algorithms | A support vector machine margin and the setting C | A | 2 |
| ml-algorithms | Which algorithm for which data (poster) | C | 1 |
| ml-unsupervised | k-means in three steps (assign, move, repeat) | A, S | 2 |
| ml-unsupervised, ml-see-data | PCA as the best shadow of a 3D object | B | 2 |
| ml-patterns | An anomaly as the odd dot out | A | 3 |
| ml-bayes | A test with a 1% disease rate shown as 1,000 people in boxes | A | 1 |
| ml-causal | Simpson's paradox as two groups that reverse the trend | A, S | 2 |
| ml-causal | Correlation is not causation (ice cream and sunburn) | B | 2 |
| ml-recommenders | Users by items grid with the gaps to fill | A, S | 2 |
| ml-timeseries | Trend, season and noise added together | A | 2 |
| ml-improve | Regularisation as a leash on the weights | B | 3 |

### Part 4: Deep learning
| Lesson | Visual | Kind | Priority |
|---|---|---|---|
| dl-neural-nets | One neuron as inputs, weights, a sum and an activation | A | 1 |
| dl-neural-nets | Layers as a pipeline from pixels to a decision | B | 1 |
| dl-neural-nets | Activation functions side by side (step, ReLU, sigmoid) | A | 2 |
| dl-backprop | Forward pass, error, backward pass | A, S | 2 |
| dl-training | Dropout as random players sitting out; learning-rate too small and too big | B, A | 2 |
| dl-vision | A filter sliding over an image; pooling | A, S | 1 |
| dl-vision | Classification, detection and segmentation of the same photo | A | 2 |
| dl-sequences | An RNN unrolled over a sentence | A, S | 2 |
| dl-sequences | Words as points on a map (embeddings) | A | 1 |
| dl-transformers | Self-attention: "them" looks back at "headphones" | B, S | 1 |
| dl-transformers | A grid of attention weights (heat map) | A, S | 1 |
| dl-transformers | Multi-head attention as several readers with different questions | B | 2 |
| dl-transformers | Encoder and decoder, with cross-attention arrows | A | 2 |
| dl-transformers | One transformer block, annotated | A, S | 1 |
| dl-generative | Autoencoder as squeeze and rebuild | A, S | 2 |
| dl-generative | A GAN as a forger and a detective | B | 1 |
| dl-generative, dl-gen-more | Diffusion as noise added step by step, then removed | A, S | 1 |
| dl-graphs | Message passing between neighbours | A, S | 2 |
| dl-rl | The agent, environment, action and reward loop | B | 1 |
| dl-rl-value | A Q-table filling up | A | 2 |
| dl-speech | Sound wave to spectrogram to text | A, S | 2 |

### Part 5: Large language models
| Lesson | Visual | Kind | Priority |
|---|---|---|---|
| llm-tokens | Text cut into tokens and token numbers | A, S | 1 |
| llm-tokens | Temperature as a flat or a sharp set of bars | A, S | 1 |
| llm-how | Next-token prediction as pick, append, repeat | B, S | 1 |
| llm-how | Pretraining, instruction tuning, preference tuning as three schools | B | 1 |
| llm-how | Prefill (read at once) and decode (write one by one) | A | 2 |
| llm-how | The context window as a desk of limited size | B | 1 |
| llm-how | Why models make things up (confident guess) | B | 2 |
| llm-design | The model builder: where the parameters sit | A, S | 2 |
| llm-design | Mixture of experts as a router and specialists | B | 2 |
| llm-design | Grouped-query attention sharing keys | A | 3 |
| llm-embed-train | Pulling similar texts closer, pushing others away | A, S | 2 |
| llm-finetune | LoRA as two thin sheets taped to a big one | B, S | 1 |
| llm-finetune | Quantisation as rounding prices | A, S | 2 |
| llm-finetune | DPO and RLHF as "this one, not that one" | B | 2 |
| llm-scale, llm-train-laptop | Where memory goes in training (weights, optimiser, activations) | A | 1 |
| llm-local | Running a model locally as a stack | A | 3 |
| llm-eval | Perplexity and judging answers | A, S | 3 |
| llm part, whole | LLM maths in one page (poster) | C | 1 |

### Part 6: AI applications
| Lesson | Visual | Kind | Priority |
|---|---|---|---|
| app-llm-api | One request and one streamed reply | A, S | 2 |
| app-prompting | System, user and examples as parts of one prompt | A | 2 |
| app-embeddings | Documents as points; the nearest points to a question | A, S | 1 |
| app-rag | The RAG pipeline as a librarian (find pages, then answer) | B, S | 1 |
| app-rag-advanced | Chunk size and overlap on a page of text | A, S | 1 |
| app-rag-advanced | Hybrid search and re-ranking as two lists merged | A | 2 |
| app-agents, app-genai-agentic | The agent loop: think, use a tool, observe, repeat | B | 1 |
| app-frameworks | MCP as a universal plug between model and tools | B | 2 |
| app-security | Prompt injection: a note hidden in a document | B, S | 1 |
| app-responsible | Fairness: the same score threshold treating two groups differently | A, S | 2 |
| app-multimodal | Image, text and audio entering one model | A | 3 |
| app-evals | A test set, a judge and a score | A, S | 2 |
| whole part | RAG and agents in one page (poster) | C | 2 |

### Part 7: Production
| Lesson | Visual | Kind | Priority |
|---|---|---|---|
| ops-mlops | A pipeline from data to a release | A | 2 |
| ops-mlops | A canary release: 5% of users first | B | 2 |
| ops-monitoring | Data drift and concept drift (two curves moving apart) | A, S | 1 |
| ops-serving | Batching: one bus instead of many cars | B | 2 |
| ops-serving, ops-scale | Caching: a shortcut for repeated questions | B | 2 |
| ops-scale | Cost and latency levers | A | 3 |
| ops-architecture | A reference architecture for an AI app | A | 2 |
| whole part | Production checklist (poster) | C | 2 |

### Cheat-sheet posters (kind C)
One per part (7), plus: LLM maths, algorithm chooser, metrics (accuracy, precision, recall, F1, ROC), RAG and agents, production checklist.
Total about 12.

### Count
About 95 visuals: roughly 40 concept cards (B), 45 new or improved diagrams (A) and 12 cheat sheets (C), of which about 40 are priority 1.

## 6. How a visual appears in a lesson (tab approach)
Every visual is a second tab of a diagram that already exists. Nothing is removed.

```
 Diagram: How attention works
 [ Boxes ]  [ Visual ]          <- two tabs; "Boxes" is selected first
 -------------------------------------------------
  (current boxes-and-arrows diagram)   or   (the illustrated / annotated visual)
```

- **In the lesson text:** the visual is a second fenced block placed straight after its diagram: a ```` ```visual <file-or-type> <Title> ```` block with
  `alt:`, `caption:` and (for drawn visuals) `file:` lines. The build joins the two into one figure with a tab list. A diagram with no `visual` block is rendered exactly as now.
- **Behaviour:** tabs follow the same accessible pattern the roadmaps page already uses (tab list, arrow keys, Home and End, `aria-selected`, focus kept).
  Without JavaScript both parts show one under the other, so nothing is hidden from a reader whose script fails. The last chosen tab is remembered in the existing
  preferences (a new `prefs.visualTab`, with a migrate step) so a reader who prefers visuals gets them on every lesson, and a switch at the top of a lesson sets all of them at once.
- **Print and focus mode:** print shows the boxes tab (compact) and, when a visual exists, the visual after it, both labelled; focus mode keeps the chosen tab.
- **Checks:** the build fails on a `visual` block with no preceding diagram, no `alt:`, a missing file, or an external address; the static tests check alt text and tab markup; the browser tests check keyboard use, the remembered tab, both themes and 320 px.
- **Lesson rule:** the boxes tab and the visual tab must say the same thing (same labels, same numbers). A visual cannot show a fact the boxes and the text do not.
- **Cheat sheets** are separate pages (not tabs), linked from the part pages.
- **Simulations** stay as they are; a visual can be the first picture of the idea that a simulation then lets the reader try.

## 7. Phases and effort
| Phase | Work | Output | Size |
|---|---|---|---|
| 0 | Pilot of 5 visuals in two styles (one A-style diagram and one B-style card for the same concepts); the owner chooses | Style decision | small |
| 1 | Build the support: the tab wrapper (Boxes and Visual tabs, remembered choice, no-script fallback, print), the `visual` block and new visual types (heat map, annotated sentence, curve with labels, before/after), tests (alt text, contrast in both themes, 320 px, print), design tokens for the illustration colours | Infrastructure | medium |
| 2 | Priority 1 visuals across all parts (about 40) | Visible gain everywhere | large, in 4 to 5 pull requests by part |
| 3 | Cheat sheets (about 12) with PDF | Revision material | medium |
| 4 | Priority 2 and 3 visuals (about 55) | Full coverage | large |

## 8. Decisions for the owner
1. Which look for the Visual tab: clean technical drawings (A), hand-drawn cards (B), or both (recommended: both, starting with a pilot)? The tab approach is decided: Boxes stay, Visual is added beside them.
2. Who draws the illustrated cards? I can produce simple flat SVG scenes with objects and a friendly robot mascot. For characters like the person with a magnifier in the pictures, you would need an illustrator or an image tool; I can then place the files and write the checks.
3. Cheat sheets as web pages plus PDF (recommended) or PDF only?
4. Start with Phase 1 (the tab support, with 3 to 5 pilot visuals so the owner can judge the look)?

## 9. Risks
- Illustrations add weight to every page. Cards are SVG (small), loaded only on the lesson that uses them.
- Decoration without meaning confuses beginners. Each visual must carry one idea, and the text must work without it.
- Two styles can look inconsistent. The pilot and one shared set of colours and line weights prevent that.
