---
id: llm-eval
title: Evaluating language models
module: llm
level: Advanced
minutes: 60
goal: Evaluate language models with perplexity, benchmarks and your own task tests, and avoid contamination and misleading comparisons.
prereqs: llm-train-laptop
reviewed: 2026-11-02
evidence: An evaluation report for two models on your own 50-question task set, with failure examples and a recommendation.
code: Perplexity values computed 2026-11-02 from the executed tiny-model run; C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
---
## In plain words
Different questions need different tests. **Perplexity** turns a model's loss on held-out text into "how many equally likely choices it is unsure between": lower is better. It is useful for comparing models that share a tokeniser on the same text, but says little about usefulness. **Benchmarks** are standard test sets for skills such as knowledge, reasoning or coding; they allow comparisons between models but can be **contaminated** (the test questions leaked into training data) and may not match your work. **Task evaluations** test exactly what your product needs, on your own examples; they decide in practice. **Human evaluation** catches quality that numbers miss. Results go into a **model card**: intended use, data, results and known limits.

```diagram compare Four ways to evaluate a model
## Perplexity | process
- Loss on held-out text as number of choices
- Lower is better
- Says little about usefulness
## Benchmarks | store
- Standard test sets
- Allow comparisons between models
- Can be contaminated
## Task evaluations | output
- Your own examples
- Test exactly what your product needs
- Decide in practice
## Human evaluation | model
- Catches quality numbers miss
```

```diagram layers What a model card records
- Known limits | What the model should not be trusted for | warn
- Results | How it scored, with the exact settings | output
- Data | What it was trained and tested on | store
- Intended use | What the model is for | input
```

```diagram flow How benchmark contamination happens
- Test questions | Published as a standard benchmark | input
- Leak into training data | The model sees the answers | bad
- Inflated score | Looks better than it really is | warn
```

## Real-world example
Two open models scored about the same on public benchmarks. On the company's own 300-question evaluation, one followed the required citation format far more reliably. The internal test decided.

```diagram compare Public benchmark versus own task test
## Public benchmarks | store
- Two open models scored about the same
## Company's own 300-question test | output
- One model followed the citation format better
- This test decided
```

## How it works
1. Keep evaluation data separate from training data from the start; check for overlap.
2. Perplexity: for comparing models with the same tokeniser on held-out text.
3. Benchmarks: note exact settings (prompt format, number of examples).
4. Task tests: 50–500 realistic cases with expected outcomes and automatic checks.
5. Human review of a sample; write the model card with limits.

```diagram flow Evaluation workflow
- Separate evaluation data | Keep it apart from training data; check for overlap | input
- Perplexity | Same tokeniser, held-out text | process
- Benchmarks | Note prompt format and number of examples | process
- Task tests | 50-500 realistic cases with automatic checks | model
- Human review and model card | Review a sample; write down the limits | output
```

```diagram matrix Choosing the right test
note: Match the test to the question you are asking.
x: Compare models | Decide to ship
y: Quick number | Realistic use
- Perplexity | Same tokeniser and same text only | process
- Benchmarks | Standard, but may be contaminated | store
- Not enough on its own | Numbers can miss quality | warn
- Task test plus human review | Decides whether it ships | output
```

## Python example
Perplexity is the exponential of the average loss. From the tiny model trained on a laptop:
```text Computed from the executed tiny-model losses
untrained (loss 3.371)   -> perplexity e^3.371 ≈ 29.1  (like guessing among all 29 characters)
step 1500 (val 0.818)    -> perplexity e^0.818 ≈ 2.27
step 6000 (val 0.761)    -> perplexity e^0.761 ≈ 2.14
```
```python perplexity
import math
print(round(math.exp(0.761), 2))   # 2.14
```
Character-level perplexity cannot be compared with a word-piece model's perplexity: the units differ. And this validation text overlaps the training text, so it is optimistic.

## .NET (C#) example
Perplexity from the probabilities a model gave to the correct tokens, in plain C#:
```cs Program.cs
// Probabilities the model assigned to each correct next token in a held-out sentence.
double[] correctTokenProbabilities = { 0.42, 0.10, 0.65, 0.31, 0.08, 0.55 };

double averageLoss = correctTokenProbabilities.Average(p => -Math.Log(p));   // cross-entropy in nats
double perplexity = Math.Exp(averageLoss);
Console.WriteLine($"average loss {averageLoss:F3} nats, perplexity {perplexity:F2}");
```
For task evaluations from .NET, run your test cases through `IChatClient` and score them as shown in [Evaluating AI apps](lesson:app-evals).

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Cross-entropy and perplexity (how surprised the model is)
**Where it is used:** the perplexity number used to compare models on held-out text.

```formula Loss and perplexity
loss per token = -ln(probability given to the correct token)
average loss = (sum of the loss per token) ÷ (number of tokens)
perplexity = e^(average loss)
```
ln is the natural logarithm and e ≈ 2.718. Lower loss and lower perplexity are better.

**In plain words:** a model that gave the right token a high chance has a small loss. Perplexity turns the average loss into "about how many equally likely choices the model was unsure between".

**Example 1: six tokens.** Probabilities given to the correct tokens: 0.42, 0.10, 0.65, 0.31, 0.08, 0.55. Losses: 0.868, 2.303, 0.431, 1.171, 2.526, 0.598. Sum = 7.897. Average = 7.897 ÷ 6 = 1.316. Perplexity = e^1.316 = 3.73.

**Example 2: a model that guesses.** If every correct token gets probability 0.25, each loss is -ln(0.25) = 1.386, so the average is 1.386 and the perplexity is e^1.386 = 4.0. That matches "choosing among 4 equally likely options".

### Accuracy and its margin of error (is the difference real?)
**Where it is used:** a task evaluation, such as the company's own 300-question test, where the score comes from a limited sample.

```formula Approximate 95% interval for an accuracy
accuracy p = correct answers ÷ questions n
standard error = sqrt( p × (1 - p) ÷ n )
interval ≈ p ± 1.96 × standard error
```
This is a rough rule that works best when n is not tiny and p is not very close to 0 or 1.

**In plain words:** a test score is an estimate. The fewer the questions, the wider the range in which the true score may lie.

**Example 1: 300 questions.** 252 correct, so p = 252 ÷ 300 = 0.84. Standard error = sqrt(0.84 × 0.16 ÷ 300) = sqrt(0.000448) = 0.0212. Margin = 1.96 × 0.0212 = 0.041. Interval: about 0.80 to 0.88.

**Example 2: only 50 questions.** 40 correct, so p = 0.80. Standard error = sqrt(0.80 × 0.20 ÷ 50) = sqrt(0.0032) = 0.0566. Margin = 1.96 × 0.0566 = 0.111. Interval: about 0.69 to 0.91. A gap of a few points between two models on 50 questions is within this noise.

## Maths behind it
- Cross-entropy and perplexity (information theory)
- Accuracy and exact match (statistics)
- Confidence intervals for scores (statistics)
- Data contamination checks (n-gram overlap)

## Common mistakes
- Comparing perplexity across different tokenisers.
- Trusting public benchmarks over your own task tests.
- Reporting one run without noting prompt format and settings.

```diagram compare Perplexity across tokenisers
## Same tokeniser | output
- Same text, same units
- Perplexity can be compared
## Different tokenisers | bad
- Units differ, such as characters and word pieces
- Do not compare perplexity
```

## Quick check
Q: What does a perplexity of 2.14 mean intuitively?
A: On average the model is as unsure as choosing among about two equally likely options.

Q: What is benchmark contamination?
A: Test questions (or close copies) appearing in training data, which inflates scores.

Q: Which evaluation should decide whether a model ships in your product?
A: A task evaluation on realistic examples from your own use case, plus human review.
