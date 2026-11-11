---
id: dl-transformers
title: Transformers and attention
module: dl
level: Intermediate
minutes: 90
goal: Explain attention with queries, keys and values, the parts of a transformer block, and the three transformer families (encoder, decoder, encoder-decoder).
prereqs: dl-sequences
reviewed: 2026-11-02
evidence: The attention toy reproduced by hand for one word, and a table matching three of your tasks to a transformer family.
code: Python NumPy executed 2026-11-02 (examples/attention/attention_toy.py); C# (TorchSharp) not run (not installed in the build environment)
---
## In plain words
**Attention** lets each word decide which other words matter for understanding it. In "The cat sat because it was tired", the word "it" should pay attention to "cat". Each word produces three things: a **query** (what am I looking for?), a **key** (what do I offer?) and a **value** (what information do I pass on?). Each word compares its query with every key, turns the scores into weights that add up to 1, and takes a weighted mix of the values. **Multi-head attention** runs several of these in parallel, so different heads can follow different relationships (grammar, meaning, position). A **transformer block** combines attention with a small neural network, plus shortcuts (**residual connections**) and **normalisation** that keep deep stacks trainable. **Positional information** tells the model the word order. There are three families: **encoder-only** (BERT-style: understand text, great for classification and embeddings), **decoder-only** (GPT-style: generate text one token at a time; most chat LLMs), and **encoder-decoder** (T5-style: read one text, write another, as in translation).

```diagram fan Each word produces three things
- One word | For example "it" | input
- Query | What am I looking for? | process
- Key | What do I offer? | process
- Value | What information do I pass on? | store
```

```diagram merge Attention builds a new meaning for "it"
note: The weights add up to 1. In the lesson's toy run, "cat" got the largest weight for "it".
- New vector for "it" | A weighted mix of the values | output
- Value of "The" | Small weight | input
- Value of "cat" | Largest weight | model
- Value of "sat" and the rest | Weights from the query-key comparison | input
```

```diagram layers A transformer block
- Attention | Each token looks at the others | model
- Residual connection and normalisation | Shortcuts that keep deep stacks trainable | process
- Small neural network | Processes each position | model
- Residual connection and normalisation | Again, around the small network | process
```

```diagram compare Three transformer families
## Encoder-only | model
- BERT-style | Understand text
- Good for classification and embeddings
## Decoder-only | output
- GPT-style | Generate one token at a time
- Most chat LLMs
## Encoder-decoder | process
- T5-style | Read one text, write another
- Translation
```

## Real-world example
A legal-tech company uses an encoder-only model to classify contract clauses quickly and cheaply, and a decoder-only LLM to draft summaries. Picking the right family for each task cut costs compared with sending everything to the large LLM.

## How it works
1. Turn tokens into embeddings and add position information.
2. For each token compute query, key and value vectors.
3. Score every pair (query with key), scale, and turn scores into weights.
4. In decoders, hide future tokens (a **causal mask**) so the model cannot cheat.
5. Mix values by the weights; repeat in many heads and many blocks.
6. A final layer turns each position's vector into scores for the next token or class.

```diagram flow Attention step by step
- Embeddings plus position | Tokens as numbers with word order | input
- Query, key, value | Computed for each token | process
- Score every pair | Query with key, then turn scores into weights | process
- Causal mask | In decoders, hide future tokens | warn
- Mix the values | Weighted by the weights; many heads and blocks | model
- Final layer | Scores for the next token or class | output
```

```diagram lanes Visible words for "it" with the causal mask
note: Taken from the toy run in this lesson.
## Words before and at "it"
- The, cat, sat, because | Receive weights | input
- it | Receives a weight too | input
## Words after "it"
- was | Weight 0 because it is hidden | bad
- tired | Weight 0 because it is hidden | bad
```

## Python example
A hand-made toy (not a real model) where the query for "it" is chosen to look for animals:
```text Output of attention_toy.py (executed)
Attention weights for 'it':
       The: 0.075
       cat: 0.622
       sat: 0.102
   because: 0.075
        it: 0.127
       was: 0.000
     tired: 0.000
Weights sum to 1.000
Largest weight: 'cat'
```
"was" and "tired" get 0 because the causal mask hides words that come later.
```python core of attention (excerpt)
scores = K @ q_it / np.sqrt(d_k)          # compare the query with every key
scores[position + 1:] = -np.inf           # causal mask: no looking ahead
weights = np.exp(scores - scores[: position + 1].max()); weights /= weights.sum()
output = weights @ V                      # weighted mix of values
```

## .NET (C#) example
Causal self-attention for one head in TorchSharp:
```cs Program.cs
using TorchSharp;
using static TorchSharp.torch;

int T = 7, d = 16;                                         // 7 tokens, 16 numbers each
var x = randn(T, d);                                       // token embeddings + positions
var wq = randn(d, d); var wk = randn(d, d); var wv = randn(d, d);   // learned in a real model

var q = x.matmul(wq); var k = x.matmul(wk); var v = x.matmul(wv);
var scores = q.matmul(k.transpose(0, 1)) / Math.Sqrt(d);   // every token compared with every token
var causal = ones(T, T).tril();                            // 1 = allowed, 0 = future
scores = scores.masked_fill(causal.eq(0), double.NegativeInfinity);
var weights = scores.softmax(-1);                          // each row sums to 1
var output = weights.matmul(v);                            // (7, 16)
Console.WriteLine($"weights {string.Join("x", weights.shape)}, output {string.Join("x", output.shape)}");
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Attention scores and softmax (who should I look at?)
**Where it is used:** each token in a transformer scores every other token to decide how much to read from it.

```formula Scaled dot-product attention weights
score = (q · k) ÷ sqrt(d)
weight_i = e^(score_i) ÷ (sum of e^(score_j) over all tokens j)
```
q is the query vector of the current token, k is a key vector of another token, q · k is the dot product (multiply matching entries, then add), d is the vector length. The weights add up to 1.

**In plain words:** a higher score means more attention. Softmax turns the scores into shares that add up to 1.

**Example 1: clear winner.** q = (1, 2), key A = (3, 1), key B = (1, 0), d = 2 so sqrt(d) ≈ 1.414. q · A = 3 + 2 = 5, score ≈ 3.54. q · B = 1 + 0 = 1, score ≈ 0.71. e^3.54 ≈ 34.3 and e^0.71 ≈ 2.03, total ≈ 36.3. Weights: A ≈ 34.3 ÷ 36.3 ≈ 0.94 and B ≈ 2.03 ÷ 36.3 ≈ 0.06.

**Example 2: tie.** If both scores are 1, both e^1 values are equal, so each weight is 0.5. The token reads equally from both.

### Why long inputs cost more (counting attention scores)
**Where it is used:** choosing a context length and understanding why long prompts are slower.

```formula Number of attention scores
scores per layer and head = n × n
```
n is the number of tokens in the input.

**In plain words:** every token looks at every token, so doubling the input length makes four times as many scores.

**Example 1: 1,000 tokens.** 1,000 × 1,000 = 1,000,000 scores.

**Example 2: 2,000 tokens.** 2,000 × 2,000 = 4,000,000 scores, which is 4 times more for 2 times the text.

## Maths behind it
- Dot product and matrix multiplication (linear algebra)
- Softmax (probability)
- Scaled dot-product attention
- Residual connections and layer normalisation
- Positional encodings (sinusoidal, rotary)

## Common mistakes
- Forgetting the causal mask when training a text generator, so it learns to copy the answer.
- Using a huge decoder-only LLM for simple classification that a small encoder handles better and cheaper.
- Assuming attention weights are a full explanation of model decisions; they are one clue.

```diagram compare Picking the right family
## Simple classification | output
- Small encoder-only model | Cheaper and often better
## Writing text | model
- Decoder-only LLM | Generates one token at a time
## Wrong choice | bad
- Huge LLM for simple classification | Costs more than needed
```

## Quick check
Q: What do query, key and value mean in plain words?
A: What a token is looking for, what each token offers for matching, and the information each token passes on.

Q: Which family powers most chat assistants?
A: Decoder-only transformers.

Q: What does the causal mask do?
A: It stops each token from seeing tokens that come after it, so the model must predict the future honestly.
