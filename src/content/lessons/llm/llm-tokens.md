---
id: llm-tokens
title: Tokens and sampling settings
module: llm
level: Intermediate
minutes: 60
maths: algebra
goal: Explain how tokenisers split text, why tokens drive cost and limits, and how temperature and top-p change generated text.
prereqs: llm-how
reviewed: 2026-11-02
updated: 2026-11-24
evidence: Token counts for the same paragraph in two languages, and the same prompt run at three temperatures with your observations.
code: Python executed 2026-11-02 (quickpath.py bpe and sampling)
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

```visual A sentence cut into tokens and ids
file: tokens-split
alt: The sentence Please refund my broken headphones is shown cut into seven pieces called tokens: Please, refund, my, broken, head, phones and a full stop. Each token has an arrow down to a made-up id number. Common words stay whole, while headphones is split into head and phones.
caption: Text is split into tokens from a fixed vocabulary, and each token becomes a number. The split and the ids here are illustrative.
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

```visual The same scores at three temperatures
file: temperature-bars
alt: Three small bar charts of the same five next-word scores. At temperature 0.2 refund has 0.92 and replacement 0.08, the others 0. At 1.0 refund 0.51, replacement 0.31, discount 0.11, apology 0.07, banana 0. At 2.0 the bars are flatter: refund 0.37, replacement 0.29, discount 0.17, apology 0.14, banana 0.03.
caption: A low temperature makes one word dominate; a high temperature flattens the chances so odd words, like banana, slip in.
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

```maths Top-k sampling: keep the best few tokens, then rescale
situation: For the next token, the model gives "blue" a probability of 0.5, "grey" 0.3 and "loud" 0.2. With top-k set to 2, only the two most likely tokens are kept.
find: What are the probabilities of "blue" and "grey" after "loud" is removed?
step: Add up what is kept | 0.5 + 0.3 = 0.8
step: New share of "blue" | 0.5 ÷ 0.8 = 0.625
step: New share of "grey" | 0.3 ÷ 0.8 = 0.375
step: Check that the new shares add up to 1 | 0.625 + 0.375 = 1
result: "blue" **62.5%**, "grey" **37.5%**, and "loud" can no longer be picked.
why: Sampling settings shape how a model chooses among its probabilities. Top-k and top-p remove unlikely tokens; temperature makes the choice sharper or flatter. The calculator below shows temperature at work on three scores.
widget: softmax 2,1,0,1
try: With top-k set to 1, what happens?
answer: Only "blue" is kept: 0.5 ÷ 0.5 = 1 = 100%. The model always picks its most likely token, so the same prompt gives the same answer every time. That is useful for extraction tasks and dull for creative writing.
deeper: The model first produces raw scores called logits. Softmax turns them into probabilities: each probability is e raised to the score, divided by the sum of e raised to every score. Temperature divides the scores before softmax, so a temperature below 1 widens the gaps between scores and a temperature above 1 narrows them.
```

```maths Softmax without overflow
situation: A model gives two next-token scores, 1000 and 1001. Softmax would work out e to the power of each score. A computer cannot store e^1000: the number is too large and the program fails or returns "not a number". The fix is to subtract the largest score from every score first.
find: What are the probabilities, without ever building a huge number?
step: Subtract the largest score from each score (the scores become 1000 − 1001 = −1 and 0) | 1000 − 1001 = −1
step: Powers of e: e^0 = 1 and e^−1 is about 0.368; add them | 1 + 0.368 = 1.368
step: Probability of the larger score | 1 ÷ 1.368 ≈ 0.731
step: Probability of the smaller score | 0.368 ÷ 1.368 ≈ 0.269
result: The probabilities are **0.731** and **0.269**, the same as for the scores 1 and 2, because only the gap between the scores matters.
formula: softmax(x) = e^(x − max) ÷ sum of e^(x − max)
why: Softmax only depends on the differences between scores, so shifting all of them by the same amount changes nothing. Subtracting the largest makes every power at most 1, which a computer can always store. Every real library does this.
caution: A score gap of 1 is used so the numbers are easy to check. Real scores differ more and use many tokens.
try: The scores are 5 and 5. What are the probabilities?
answer: After subtracting 5 both become 0, so each power is 1 and each probability is 1 ÷ 2 = 0.5. Equal scores give equal chances.
```

```python stable_softmax.py
import math

def softmax_naive(scores):
    exps = [math.exp(s) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]

def softmax_stable(scores):
    biggest = max(scores)                      # subtract the largest score first
    exps = [math.exp(s - biggest) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]

print("small scores, naive :", [round(p, 3) for p in softmax_naive([1, 2])])
print("small scores, stable:", [round(p, 3) for p in softmax_stable([1, 2])])
try:
    softmax_naive([1000, 1001])
except OverflowError as error:
    print("large scores, naive : fails with OverflowError:", error)
print("large scores, stable:", [round(p, 3) for p in softmax_stable([1000, 1001])])
```
```text Output of stable_softmax.py (executed 2026-11-23)
small scores, naive : [0.269, 0.731]
small scores, stable: [0.269, 0.731]
large scores, naive : fails with OverflowError: math range error
large scores, stable: [0.269, 0.731]
```

## Live simulation
Two small simulations show the two halves of this lesson. The first builds a tokeniser from a short text so you can watch text turn into tokens. The second writes text one token at a time so you can see what temperature, top-k and top-p do. Both are tiny stand-ins: they run the same loop as a large language model, on a model small enough to read in full.

```sim bpe How text becomes tokens
question: Why are common words one token while rare words are split into pieces?
watch: At 0 merges every letter is its own token. Each merge joins the most common neighbouring pair in the training text.
watch: Common words such as "the" become one token after a few merges. Rare words stay in pieces for much longer.
watch: The same sentence needs fewer tokens as merges are learned, which is how a tokeniser saves space and cost.
try: short | Learn enough merges that the word "newest" needs only two tokens or fewer.
try: unseen | Type a letter that is not in the training text (for example z) and see that it gets no token id.
predict: After 12 merges, will the word "lowest" be a single token? | Yes, one token | No, several tokens
answer: 2 | "lowest" appears only twice in this small text, so its pieces are not joined until merge 42 of 50. The very common word "the" is one token from merge 3.
leaves-out: The tokeniser learns from about 60 words, so its merges are very different from those of a real tokeniser, which learns from huge amounts of text and works on bytes. Only letters and apostrophes are kept here, and a letter never seen in the training text gets no id (a real tokeniser falls back to raw bytes).
reference: examples/sim-tokens/bpe_tokens.py
```

```sim gen How a language model writes text
question: What do temperature, top-k and top-p change when a model chooses its next token?
watch: The bars show the chance of each possible next word. The faint bar is the chance at temperature 1 with no filters; the solid bar is the chance with your settings.
watch: A low temperature makes the most likely word stand out. A high temperature spreads the chance more evenly.
watch: Top-k and top-p remove unlikely words before the choice. Words that are removed show "out".
try: greedy | Choose "Greedy" and write 10 tokens. Then press "Start again" and see that you get the same text every time.
try: hot | Set the temperature to 1.5 or more and write tokens until the model picks a word that had less than a 15% chance at temperature 1.
predict: You lower the temperature from 1 to 0.2. What happens to the chance of the most likely next word? | It goes up | It goes down | It stays the same
answer: 1 | Dividing the scores by a small temperature makes the biggest one stand out more. After "the cat", "sat" goes from 31% at temperature 1 to 77% at 0.2.
leaves-out: This model is not a neural network. It is a table of how often each word followed the previous one or two words in a text of 209 tokens (words and full stops) written for this guide, so it can only repeat patterns from that text. A large language model scores its next token with a neural network that reads the whole context window, but the loop around it (scores, temperature, top-k, top-p, choose, append, repeat) is the same.
reference: examples/sim-tokens/gen_tokens.py
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

The same stable softmax in C#. Here the naive version does not raise an error: it quietly returns "not a number" (NaN), which is worse.
```cs StableSoftmax.cs
static double[] SoftmaxNaive(double[] scores)
{
    var exps = scores.Select(Math.Exp).ToArray();
    double total = exps.Sum();
    return exps.Select(e => e / total).ToArray();
}

static double[] SoftmaxStable(double[] scores)
{
    double biggest = scores.Max();              // subtract the largest score first
    var exps = scores.Select(s => Math.Exp(s - biggest)).ToArray();
    double total = exps.Sum();
    return exps.Select(e => e / total).ToArray();
}

string Show(double[] p) => string.Join(", ", p.Select(v => v.ToString("F3")));

Console.WriteLine("small scores, naive : " + Show(SoftmaxNaive(new[] { 1.0, 2.0 })));
Console.WriteLine("small scores, stable: " + Show(SoftmaxStable(new[] { 1.0, 2.0 })));
Console.WriteLine("large scores, naive : " + Show(SoftmaxNaive(new[] { 1000.0, 1001.0 })));
Console.WriteLine("large scores, stable: " + Show(SoftmaxStable(new[] { 1000.0, 1001.0 })));
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
