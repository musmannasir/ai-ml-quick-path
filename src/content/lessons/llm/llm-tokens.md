---
id: llm-tokens
title: Tokens and sampling settings
module: llm
level: Intermediate
minutes: 60
goal: Explain how tokenisers split text, why tokens drive cost and limits, and how temperature and top-p change generated text.
prereqs: llm-how
reviewed: 2026-11-02
evidence: Token counts for the same paragraph in two languages, and the same prompt run at three temperatures with your observations.
code: Python executed 2026-11-02 (quickpath.py bpe and sampling); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
LLMs read and write **tokens**, not words. A **tokeniser** splits text into pieces from a fixed **vocabulary**: common words are one token, rare words are split into several. Most use **byte-pair encoding (BPE)**: start from characters and repeatedly merge the most frequent neighbouring pair into a new token. Tokens matter in practice: providers **charge per token**, the **context window** is counted in tokens, and some languages need more tokens for the same meaning. When the model generates, it gives a probability for every possible next token, and **sampling settings** choose one. **Temperature** makes choices sharper (low, more predictable) or flatter (high, more varied). **Top-p** keeps only the most likely tokens whose probabilities add up to p. For extraction and classification use low temperature; for brainstorming, higher.

```diagram flow From text to tokens
note: Common words stay whole. Rare words split into several pieces from the vocabulary.
- Text | Plain words you type | input
- Tokeniser | Splits text into pieces from a fixed vocabulary | process
- Tokens | Each piece is a token | store
- Token ids | Each token becomes a number the model reads | output
```

```diagram flow How byte-pair encoding builds tokens
note: Matches the executed bpe run in this lesson, where the first merge joins l and o.
- Start with characters | Every word is split into single characters | input
- Count neighbouring pairs | Find the pair seen most often | process
- Merge the top pair | The pair becomes one new token | process
- Repeat | Merged tokens can merge again, as lo plus w became low | process
- Vocabulary | Frequent pieces are single tokens | store
```

```diagram fan Why tokens matter
note: One count drives several practical limits.
- Token count | Counted with the model's own tokeniser | process
- Cost | Providers charge per token | output
- Context window | Counted in tokens | output
- Language differences | Some languages need more tokens for the same meaning | warn
```

```diagram compare Temperature and top-p
## Low temperature | model
- Sharper choices
- More predictable
- Use for extraction and classification
## High temperature | warn
- Flatter choices
- More varied
- Use for brainstorming
## Top-p | process
- Keeps the most likely tokens
- Their probabilities add up to p
- Drops the unlikely rest
```

## Real-world example
A company budgeted a summarisation feature by counting characters and was surprised by the bill for Japanese and Arabic documents, which used more tokens per character than English. Counting with the model's own tokeniser fixed the estimate before launch.

## How it works
1. Text is normalised and split into tokens; each token becomes an id.
2. The model reads ids and outputs scores for every token in the vocabulary.
3. Temperature divides the scores; softmax turns them into probabilities.
4. Top-p (or top-k) removes unlikely tokens; one token is sampled.
5. The new token is appended; repeat until a stop token or length limit.

```diagram loop One sampling step, repeated
note: The loop that writes every answer.
- Token ids in | The model reads the ids so far | input
- Scores | One score for every token in the vocabulary | model
- Temperature | Sharpens or flattens the scores | process
- Top-p or top-k | Remove unlikely tokens | process
- Sample one token | Pick from what is left | output
loop: Append the token and repeat until a stop token or the length limit
```

## Python example
Training BPE on a tiny word list, five merges:
```text Output of quickpath.py bpe (executed)
merge 1: 'l'+'o' (seen 5 times)
merge 2: 'lo'+'w' (seen 5 times)
merge 3: 'e'+'s' (seen 4 times)
merge 4: 'es'+'t' (seen 4 times)
merge 5: 'est'+'_' (seen 4 times)
tokens now: {'low': ['low', '_'], 'lower': ['low', 'e', 'r', '_'], 'newest': ['n', 'e', 'w', 'est_'], 'widest': ['w', 'i', 'd', 'est_']}
```
The same next-token scores at three temperatures, and top-p:
```text Output of quickpath.py sampling (executed)
temperature 0.2: refund 0.92, replacement 0.08, discount 0.00, apology 0.00, banana 0.00
temperature 1.0: refund 0.51, replacement 0.31, discount 0.11, apology 0.07, banana 0.00
temperature 2.0: refund 0.37, replacement 0.29, discount 0.17, apology 0.14, banana 0.03
top-p 0.9 keeps: ['refund', 'replacement', 'discount']
```
At high temperature even "banana" gets a 3% chance, which is how odd words slip into creative output.

## .NET (C#) example
Count tokens with `Microsoft.ML.Tokenizers` (plus the data package for the encoding, for example `Microsoft.ML.Tokenizers.Data.O200kBase`), and sample with temperature in plain C#:
```cs Program.cs
using Microsoft.ML.Tokenizers;

var tokenizer = TiktokenTokenizer.CreateForModel("gpt-4o");
string text = "Please refund order 55812; the glass panel arrived cracked.";
IReadOnlyList<int> ids = tokenizer.EncodeToIds(text);
Console.WriteLine($"{ids.Count} tokens: {string.Join(" ", ids)}");

string[] words = { "refund", "replacement", "discount", "apology", "banana" };
double[] logits = { 3.0, 2.5, 1.5, 1.0, -2.0 };
foreach (double t in new[] { 0.2, 1.0, 2.0 })
{
    var exp = logits.Select(l => Math.Exp(l / t)).ToArray();
    double sum = exp.Sum();
    Console.WriteLine($"T={t}: " + string.Join(", ", words.Zip(exp, (w, e) => $"{w} {e / sum:F2}")));
}
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Softmax and temperature (turning scores into probabilities)
**Where it is used:** the sampling step, where the model's scores for every token become chances and temperature sharpens or flattens them.

```formula Softmax with temperature
probability of token i = e^(score_i ÷ T) ÷ (sum of e^(score_j ÷ T) over all tokens j)
```
Here score_i is the model's raw score (logit) for token i, T is the temperature, and e ≈ 2.718. The probabilities always add up to 1.

**In plain words:** a higher score gives a higher chance. A low T makes the gap between scores bigger, so the top token wins almost every time. A high T shrinks the gap, so choices even out.

**Example 1: temperature 1.** Three tokens have scores 2, 1 and 0. e^2 = 7.389, e^1 = 2.718, e^0 = 1. The sum is 11.107. Probabilities: 7.389 ÷ 11.107 = 0.665, 2.718 ÷ 11.107 = 0.245, 1 ÷ 11.107 = 0.090. Check: 0.665 + 0.245 + 0.090 = 1.000.

**Example 2: temperature 0.5 (sharper).** Divide each score by 0.5: 4, 2 and 0. e^4 = 54.598, e^2 = 7.389, e^0 = 1. The sum is 62.987. Probabilities: 0.867, 0.117 and 0.016. The top token rose from 0.665 to 0.867 because the lower temperature widened the gap.

### Token cost estimate (price per million tokens)
**Where it is used:** budgeting a feature before launch, because providers charge per input and output token.

```formula Cost of one request
cost = input tokens × input price ÷ 1,000,000 + output tokens × output price ÷ 1,000,000
```
Prices are stated per 1 million tokens. The prices below are made up to show the arithmetic; use your provider's real price list.

**In plain words:** count the tokens in and out, multiply each by its own price, and add them.

**Example 1: one summary.** 2,000 input tokens at a made-up 2 units per million, and 500 output tokens at 8 units per million. Input: 2,000 × 2 ÷ 1,000,000 = 0.004. Output: 500 × 8 ÷ 1,000,000 = 0.004. Total = 0.008 units.

**Example 2: a busy day.** The same request is made 10,000 times a day: 10,000 × 0.008 = 80 units per day. If a language needs 1.5 times as many tokens for the same text, the input becomes 3,000 tokens, and the cost per request rises to 0.006 + 0.004 = 0.010 units.

## Maths behind it
- Byte-pair encoding (compression algorithm)
- Softmax and temperature scaling (probability)
- Top-k and nucleus (top-p) sampling
- Entropy (how spread out the choices are)

## Common mistakes
- Estimating cost or context use by words or characters instead of tokens.
- Using high temperature for tasks that need exact, repeatable answers.
- Expecting temperature 0 to give identical output on every provider and hardware.

```diagram matrix Which setting for which task
note: Choose by whether you need exact repeatable answers or variety.
x: Low temperature | High temperature
y: Exact answers needed | Variety wanted
- Extraction, classification | Right fit | output
- Risky: odd answers on exact tasks | Common mistake | bad
- Fine, but dull | Predictable, little variety | warn
- Brainstorming | Right fit | output
```

## Quick check
Q: Why do tokens matter for cost?
A: Providers charge per input and output token, and limits such as the context window are counted in tokens.

Q: What does a low temperature do?
A: It sharpens the probabilities so the most likely token is chosen almost every time: predictable output.

Q: How does BPE build its vocabulary?
A: It repeatedly merges the most frequent pair of neighbouring symbols into a new token.
