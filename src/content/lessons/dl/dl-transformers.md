---
id: dl-transformers
title: Transformers and attention
module: dl
level: Intermediate
minutes: 90
maths: algebra
goal: Explain attention with queries, keys and values, the parts of a transformer block, and the three transformer families (encoder, decoder, encoder-decoder).
prereqs: dl-sequences
reviewed: 2026-11-02
updated: 2026-11-24
evidence: The attention toy reproduced by hand for one word, and a table matching three of your tasks to a transformer family.
code: Python NumPy executed 2026-11-02 (examples/attention/attention_toy.py)
---
## In plain words
**Attention** lets each word decide which other words matter for understanding it. In "The cat sat because it was tired", the word "it" should pay attention to "cat". Each word produces three things: a **query** (what am I looking for?), a **key** (what do I offer?) and a **value** (what information do I pass on?). Each word compares its query with every key, turns the scores into weights that add up to 1, and takes a weighted mix of the values. **Multi-head attention** runs several of these in parallel, so different heads can follow different relationships (grammar, meaning, position). A **transformer block** combines attention with a small neural network, plus shortcuts (**residual connections**) and **normalisation** that keep deep stacks trainable. **Positional information** tells the model the word order. There are three families: **encoder-only** (BERT-style: understand text, great for classification and embeddings), **decoder-only** (GPT-style: generate text one token at a time; most chat LLMs), and **encoder-decoder** (T5-style: read one text, write another, as in translation).

```diagram fan Each word produces three things
- One word | For example "it" | input
- Query | What am I looking for? | process
- Key | What do I offer? | process
- Value | What information do I pass on? | store
```

```visual Three heads, three questions
file: multi-head
alt: Three rows, each showing the sentence The cat sat because it. In each row an arc runs from the word it to a different word: head 1 to cat, head 2 to sat, head 3 to because.
caption: Several attention heads read the same sentence, each with its own question. What each head learns is found by training.
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

```visual One transformer block, step by step
file: transformer-block
alt: A vertical stack of steps. Words come in as number lists, go through attention, then an add-and-normalise step, then a small neural network, then another add-and-normalise step, and come out to the next block. Two dashed shortcut arrows run on the right: the input is added back after attention and again after the small network. A note says a model stacks many such blocks.
caption: Attention, then a small network, each followed by adding the input back and normalising. The shortcuts keep very deep stacks trainable.
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

```visual A grid of attention weights
file: attention-heatmap
alt: A seven by seven grid for the sentence The cat sat because it was tired. Each row is a word, each column is a word it can look at. Cells hold made-up attention weights, darker for larger, and each row adds up to 1. Cells above the diagonal are greyed out because the causal mask hides later words. In the row for it, 0.75 goes to cat and 0.25 to sat.
caption: Each row shows how one word spreads its attention over the words before it. Later words are hidden by the causal mask.
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

```visual Words that "it" takes from
file: attention-it
alt: The sentence "The cat sat because it was tired" with one box per word. Two arcs run from "cat" and "sat" to "it"; the arc from "cat" is much thicker and is labelled 0.75, the one from "sat" is labelled 0.25. "The" and "because" are about 0. The words "was" and "tired" have dashed outlines because the causal mask hides them, so their weight is 0.
caption: "it" takes most of its information from "cat" (0.75) and some from "sat" (0.25). The words after it are hidden. The weights are made up, as in the maths box below.
```

```maths Attention as a weighted mix
situation: In the sentence "The cat sat because it was tired", the model is working on the word "it". Attention lets "it" take information from other words. Suppose, with invented weights, it gives 0.75 of its attention to "cat" and 0.25 to "sat". To keep the sum small, each word's information is one number here: 10 for "cat" and 2 for "sat".
find: What does "it" receive after mixing the two words?
step: Share taken from "cat" | 0.75 × 10 = 7.5
step: Share taken from "sat" | 0.25 × 2 = 0.5
step: Add the shares | 7.5 + 0.5 = 8
step: Check that the attention weights add up to 1 | 0.75 + 0.25 = 1
result: "it" receives **8**, a value much closer to "cat" (10) than to "sat" (2).
formula: new value = weight₁ × value₁ + weight₂ × value₂   (the weights add up to 1)
why: This weighted mix is what an attention layer does for every word, using all the other words. It is how the model works out that "it" refers to the cat.
caution: The weights 0.75 and 0.25 are made up for this example. They are not what any real trained model learned. In a real transformer each word is a long list of numbers, and the weights come from comparing "query" and "key" vectors and passing the scores through softmax, as the next part of the lesson explains.
widget: weighted 0.75,10,0.25,2
try: The weights change to 0.5 and 0.5. What does "it" receive now?
answer: 0.5 × 10 + 0.5 × 2 = 5 + 1 = 6. With equal attention the result sits halfway between the two words. Attention is useful because the weights are not equal: the model learns where to look.
deeper: In real self-attention each token is turned into three vectors: a query, a key and a value. The score between two tokens is the dot product of one token's query with the other's key, divided by the square root of the vector length. Softmax turns each token's scores into weights that add up to 1, and the output is the weighted sum of the value vectors.
```

### Related concepts

#### Cross-attention (how a decoder reads an encoder)
In an encoder-decoder model such as a translator, the **encoder** reads the whole input first and turns each input word into a vector. The **decoder** then writes the output one word at a time. **Cross-attention** is the step where the decoder looks back at the encoder: the **queries** come from the words the decoder has written so far, and the **keys and values** come from the encoder's output. Ordinary self-attention looks within one text; cross-attention looks from one text to another. Made-up example: the decoder is about to write the English word after "the". Its query matches the French word "chat" best, so it takes most of its information from there.

```diagram flow Cross-attention in a translator
note: Weights are made up for illustration: chat 0.8, le 0.1, dort 0.1.
- Encoder reads "le chat dort" | One vector per French word | input
- Keys and values | Come from the encoder output | store
- Decoder has written "the" | Its current state becomes the query | process
- Cross-attention | The query is scored against every French word's key | model
- Next word: "cat" | Mostly taken from the vector for "chat" | output
```

```visual Cross-attention in a translator
file: cross-attention
alt: The French words le, chat and dort on the left. On the right the English so far, the, and an empty slot for the next word. Three lines run from the French words to the slot, with weights 0.1, 0.8 and 0.1, the thick one from chat. The next word is cat.
caption: The decoder's query is compared with every encoder word, and most of the weight falls on chat, so the next English word is cat. The weights are made up.
```

#### RMSNorm (a simpler normalisation)
A transformer keeps its numbers in a steady range by **normalising** them. Classic layer normalisation subtracts the average and then divides by the spread. **RMSNorm** skips the subtraction and divides only by the **root mean square** (square every number, take the average, then the square root). It is cheaper and works about as well, so many recent models use it.

```maths RMSNorm of two numbers
situation: A tiny vector has two numbers, 1 and 7.
find: What is the vector after RMSNorm?
step: Square each number | 1 × 1 = 1
step: Square the second number | 7 × 7 = 49
step: Average of the squares | (1 + 49) ÷ 2 = 25
step: Root mean square: the number that times itself gives 25 | 5 × 5 = 25
step: Divide the first number by 5 | 1 ÷ 5 = 0.2
step: Divide the second number by 5 | 7 ÷ 5 = 1.4
result: The vector becomes **0.2 and 1.4**.
formula: RMSNorm(x) = x ÷ √(average of x²)   (real layers also multiply by a learned scale)
why: The numbers keep their proportions (the second is still 7 times the first) but now have a steady size, which keeps training stable.
caution: Real vectors have thousands of numbers, and a learned scale is applied afterwards.
```

#### RoPE (position by rotation)
A transformer must know word order. **RoPE** (rotary position embedding) does this by rotating each word's query and key vectors by an angle that depends on the word's position. When two words are compared, the result then depends on how far apart they are, not on where they stand in the text. Many recent models use it. Everyday example: two clock hands; what matters is the angle between them, not the time on the clock.

```diagram flow RoPE: position by rotation
- Query and key for a word | Vectors made from the word | input
- Rotate by the word's position | A bigger position means a bigger angle | process
- Compare two rotated vectors | The score depends on the distance between the words | model
- Attention weights | Nearby and far words are treated by their gap | output
```

#### SwiGLU (a gated feed-forward layer)
Each block has a small **feed-forward** network after attention. In the older design it is two matrices with one bending step between them. **SwiGLU** adds a **gate**: one path computes a value, a second path computes how much of it to let through, and the two are multiplied number by number. It uses three matrices instead of two, and many recent models use it because it tends to work better at the same size.

```diagram flow SwiGLU: a feed-forward layer with a gate
- Input vector | One word's numbers after attention | input
- Value path | A matrix gives the candidate numbers | process
- Gate path | A second matrix and a smooth bend decide how much passes | model
- Multiply, then project back | Gate times value, then a third matrix | process
- Output vector | Same size as the input | output
```

## Live simulation
Attention is easiest to understand with real numbers. The tiny model below was trained for this guide on made-up sentences. It has one Transformer block with two attention heads. The page runs its real forward pass, so every number shown is calculated, not drawn. Four simulations follow the path of a sentence through the model: numbers, attention, the block, and training against using.

```sim tf1 From words to numbers
question: How does a Transformer turn a sentence into numbers, and why does it add a second set of numbers for position?
watch: Each word is looked up in a table and becomes a row of 8 numbers. The table was learned in training.
watch: Each place in the sentence also has its own row of 8 numbers. The two rows are added to give what the first layer receives.
watch: The readout compares the two "the" rows in the sentence. Switch the position numbers off and the distance falls to zero.
try: same | Switch off the position numbers and see the two "the" rows become identical.
predict: In "the cats near the box sleep .", the word "the" appears twice. Without position numbers, what would the model see for the two "the" words? | Two different rows | The same row twice | Two rows that cancel out
answer: 2 | The word table gives one row per word, wherever the word sits. Only the position numbers make the two "the" rows differ, which lets later layers tell the places apart.
leaves-out: A real model has thousands of numbers per word and tens of thousands of tokens (see the tokens lesson), and many use a different way of marking position. The numbers here were learned, so on their own they do not mean anything you can read.
```

```sim attn One attention layer, step by step
question: When a word is about to be followed by a verb, which earlier word does the model look at, and how do the numbers decide it?
watch: Each row of the grid is one word looking back. The weights in a row add up to 1, and a darker cell means more attention.
watch: Open the arithmetic table: each weight comes from a score (query times key, divided by 2) turned into a weight by softmax.
watch: Compare the two heads. Head 1 spreads its attention over nearby words. Head 2, at the word before the verb, looks back at the plural subject when there is one.
try: subject | Choose Head 2 and a plural sentence, select the word before the verb, and find the row where the subject gets at least 90% of the attention.
try: future | Switch off the causal mask and see weights appear on words that come later in the sentence.
predict: In "the cats near the box ...", the next word is a verb. To choose "sleep" rather than "sleeps", which earlier word must the model use? | the | cats | near | box
answer: 2 | The verb must agree with its subject, "cats", and not with the nearest noun, "box". The model has to carry the subject's number forward to the word before the verb.
leaves-out: This model has 21 words, 8 numbers per word, one block with two heads, and it learned only one thing: verbs agree in number with their subject. A large model has thousands of numbers per word, dozens of layers and many heads, plus feed-forward layers and normalisation that are left out here. Turning off the mask or the scaling shows what the scores would do, but the trained model always uses both.
reference: examples/sim-attention/attention_forward.py
```

```sim tf4 One Transformer block, stage by stage
question: What happens to one word's numbers inside a Transformer block, and what breaks when a part is removed?
watch: Each row is the same word's 8 numbers after one stage. Colour shows the sign and strength of each number.
watch: After a normalise stage the 8 numbers have average 0 and spread 1. The add stages keep the word's own information while new information is mixed in.
watch: Switch a part off and watch the chance on the right kind of verb. The model was trained with every part on, so this shows what each part contributes.
try: nores | Switch off the add path, choose the word before the verb, and see the chance on verbs that agree fall below 60%.
predict: What is the job of the "add" path around attention? | It makes the model bigger | It lets the word keep its own information while attention mixes in new information | It removes the oldest words
answer: 2 | The block output is the input plus what attention (and then the feed-forward network) adds. Without the add, each layer would have to rebuild the word from scratch.
leaves-out: One block, where a large model stacks dozens. The normalise step here has no learned scale and shift, which real layers usually have. The model learned one rule (verbs agree in number with their subject), so only that behaviour shows.
reference: examples/sim-attention/attention_forward.py
```

```sim tf6 Training against using
question: Why can a Transformer learn from every word of a sentence at once, but must write one word at a time?
watch: In training mode every row (one position, one prediction) is filled in one pass, because the causal mask hides later words from each position.
watch: The loss of a row is the negative natural log of the chance on the real next word. The average loss is what training tries to lower.
watch: In using mode the rows appear one at a time, because each new word has to exist before the next one can be predicted.
try: serial | Switch to using mode and press "Next word" until every word is written.
predict: A sentence of 7 words is used for training. How many passes through the model give a loss for all 6 predictions? | 6, one per word | 1, all positions at once | 7
answer: 2 | With the causal mask, the model can predict every position's next word in the same pass. Writing is different: the next word is not known until it has been chosen.
leaves-out: Training also changes the weights after each pass, which this page does not do; it only shows the loss of a model that is already trained. In using mode the page reveals the same rows one at a time. A real writing loop feeds the model's own choices back in, as the writing simulation in the lesson on how large language models work does.
reference: examples/sim-attention/attention_forward.py
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
