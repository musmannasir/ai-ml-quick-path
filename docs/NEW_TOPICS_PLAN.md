# Plan: cover the topics from `InitialData/topics` that the guide does not explain yet

Status 2026-11-23: plan only, nothing is built. Source: 34 pictures in `D:\ClaudeApps\AIGuideApp\InitialData\topics`
(32 topic pictures and 2 cover or end slides). Result of the check: 26 topics are explained, 6 are only partly covered,
4 are not covered. This plan closes all of the gaps in four batches, plus one optional batch.

## Approach (applies to every batch)
- **Where:** short sections inside existing lessons, written in plain words. No new lessons, so the lesson count (72), the
  roadmaps and the page count stay the same. Each new section follows the lesson rules in `CLAUDE.md`: defined terms,
  at least one diagram per new concept, a maths moment where a calculation matters (the build checks every step), numbers
  labelled as made-up, and a `leaves-out` note on any simulation.
- **Facts:** every statement about a technique is checked against its original paper or the model documentation before it is
  written. Papers worth linking are registered in `src/data/sources.mjs` (`[text](source:id)`) and checked with `npm run check:links`.
  The pictures are the starting point, not the source of truth.
- **Code:** only where it teaches something (stable softmax). Each new code block needs `npm run extract:code` and
  `npm run verify:code` (Python runs, C# compiles).
- **Glossary and dates:** new terms go into `GLOSSARY` in `src/data/reference.mjs`; each changed lesson gets `updated: <date>` in its front matter.
- **Definition of done per batch:** `build`, `check:maths`, `check:sims`, `test:static` (also with `SITE_URL` set), `test:e2e:edge`, a pull request,
  merge, then Cloudflare builds. I then check the live pages.

## Batch A: fine-tuning variants (lesson `llm-finetune`)
Closes: LoRA-FA, VeRA, Delta-LoRA and LoRA+ (the picture "5 Techniques to Fine-Tune LLMs").
- New section "Other LoRA variants" after plain LoRA, in plain words: what each one changes, what it saves, and what it risks.
  - LoRA-FA: freeze A too and train only B. Fewer trainable numbers and less activation memory.
  - VeRA: A and B are random, frozen and shared across layers; only two small scaling vectors are trained.
  - Delta-LoRA: the big matrix W also moves, using the change in B times A, without storing a full gradient for W.
  - LoRA+: same shapes as LoRA, but B learns with a higher learning rate than A.
- Diagram `compare` of the five variants (what is frozen, what is trained).
- Maths moment: trainable numbers for one 4096 by 4096 layer at rank 8 for each variant (LoRA 65,536; LoRA-FA 32,768; VeRA 4,104; LoRA+ 65,536;
  Delta-LoRA 65,536 plus W updated). All numbers are computed, not quoted.
- Simulation: a third view "LoRA variants" in the existing `lora` module (rank and width sliders, trainable numbers and share of the full matrix per variant),
  with its numbers added to `examples/sim-llm/llm.py` so `check:sims` keeps matching.
- Glossary: LoRA-FA, VeRA, Delta-LoRA, LoRA+. Sources: the four original papers, after I check their abstracts.

## Batch B: how an answer is generated (lessons `llm-how`, `app-llm-api`, `ops-monitoring`)
Closes: prefill and decode, compute-bound against memory-bound, the chat template, inter-token latency (ITL), the chain-of-next-words formula.
- `llm-how`: new section "Two phases: prefill and decode". Prefill reads the whole prompt at once; decode writes one token at a time and reuses the stored keys and values.
  Plain explanation of why the first is limited by computing and the second by memory speed. Diagram `flow`.
- `llm-how`: short section "The chat template": how system, user and assistant messages become one token list, with a made-up example.
- `llm-how`: maths moment for the chain of probabilities, P(the cat sat) = P(the) × P(cat | the) × P(sat | the cat), with made-up numbers, and why logs are used.
- `tf5` simulation (writing one word at a time): label the first step "prefill" and later steps "decode" in the table. No change to the calculation.
- `app-llm-api` and `ops-monitoring`: add inter-token latency next to time to first token, with the meaning of each and a made-up worked example.
- Glossary: prefill, decode, chat template, ITL, TTFT (if missing).

## Batch C: modern transformer parts (lessons `dl-transformers`, `llm-design`, `llm-tokens`)
Closes: cross-attention, RMSNorm, RoPE, grouped-query attention (GQA), SwiGLU, stable softmax.
- `dl-transformers`: expand the encoder-decoder part with cross-attention: queries come from the decoder, keys and values from the encoder. A small made-up translation
  example and a diagram.
- `dl-transformers`, in "Related concepts": RMSNorm (normalising without subtracting the average), RoPE (position by rotating the query and key), SwiGLU (a gated feed-forward layer),
  each in a few plain lines with a diagram.
- `llm-design` plus the `mb` simulation: add "attention heads" and "key and value heads" settings so GQA shows up as a smaller key-value cache (readout and Python twin updated).
- `llm-tokens`: maths moment "softmax without overflow": subtract the largest score first, same probabilities (1000 and 1001 give 0.27 and 0.73), and a short Python and C# example of a stable softmax.
- Glossary: cross-attention, RMSNorm, RoPE, GQA, SwiGLU.

## Batch D: classic machine learning gaps (lesson `ml-algorithms`)
Closes: entropy and information gain for decision trees, the SVM soft margin, a worked naive Bayes example.
- Decision trees: entropy as a second way to measure a mixed node, and information gain as the choice of split, with a worked example and a diagram. The `sup` simulation gets a switch "Gini or entropy" for the tree
  (calculation in `sup.js`, Python twin in `examples/sim-supervised/algorithms.py`).
- Support vector machine: the soft margin and the setting C (how many mistakes you allow), in plain words with a diagram.
- Naive Bayes: a maths moment with two words and two classes (made up), then the independence assumption and why it is "naive".

## Optional Batch E: validate generated SQL (lesson `app-security`)
The "How an LLM generates your answer" picture ends with "generated SQL still needs validation". A short worked example: allow only read-only queries, check against a list of tables,
run with a read-only account, with Python and C# code (both verified). Recommended only if you want a hands-on example.

## Order and size
A then B then C then D (E last if wanted). Each batch is one pull request. Touched files per batch: 3 to 6 lessons, 1 data file, up to 2 simulations,
`llm.py` or `algorithms.py`, `check-sims.mjs`, e2e checks for changed simulations, `reference.mjs` (glossary), `docs/SIMULATIONS_FULL_PLAN.md`.

## Decisions for the owner
1. Sections inside lessons (recommended) or new lessons? New lessons would change the lesson count, roadmaps, glossary links, sitemap and the "72 lessons" wording everywhere.
2. Link the original papers for the LoRA variants (recommended: yes, as registered sources)?
3. Include the three simulation changes (variants view, GQA readout, Gini or entropy switch)? They add accuracy checks and tests, and they make the topics visible.
4. Include optional Batch E?
5. Start with Batch A?

## Risks
- The pictures are summaries. Where a paper differs from a picture, the paper wins and I will say so.
- Simulation changes touch tests that pin exact numbers (`check-sims`, e2e); each change updates its Python twin and its test in the same pull request.
- Adding code blocks means running the C# compile check on this machine (needs the .NET SDK and network access for packages).
