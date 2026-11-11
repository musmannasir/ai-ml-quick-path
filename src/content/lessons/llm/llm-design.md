---
id: llm-design
title: Designing a language model
module: llm
level: Advanced
minutes: 75
goal: Choose tokeniser, vocabulary, width, depth, heads and context length for a model, estimate its size and memory, and plan experiments.
prereqs: llm-tokens, dl-transformers
reviewed: 2026-11-02
evidence: A design sheet for a small model with parameter count, memory estimate, training data plan and three experiments that each change one setting.
code: Python executed 2026-11-02 (quickpath.py llm_size); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
---
## In plain words
Designing an LLM means choosing a handful of numbers and writing down why. **Vocabulary size**: how many tokens the tokeniser knows (bigger means shorter sequences but a bigger embedding table). **Width** (model dimension): how many numbers represent each token. **Depth**: how many transformer blocks. **Heads**: how many attention heads per block (width divided by heads is the size of each head). **Context length**: how many tokens it can read at once (longer costs more memory). Plus choices about position encoding, normalisation and whether to share the input and output embedding tables. These settings decide the **parameter count**, which decides memory, speed and how much training data you need. Research on scaling found that for a fixed compute budget, model size and training data should grow together; a widely used rule of thumb is roughly 20 training tokens per parameter. A design is a hypothesis: test it with experiments that change one setting at a time.

```diagram layers Design choices that set the model's size
note: These choices together decide the parameter count.
- Context length | How many tokens it can read at once; longer costs more memory | process
- Heads | Attention heads per block; width divided by heads is each head's size | process
- Depth | How many transformer blocks | model
- Width (model dimension) | How many numbers represent each token | model
- Vocabulary size | How many tokens the tokeniser knows; sets the embedding table | input
```

```diagram merge Settings decide the cost of the model
note: Parameter count is the hub that drives memory, speed and data needs.
- Parameter count | Memory, speed and how much training data you need | output
- Vocabulary size | Bigger means shorter sequences but a bigger embedding table | input
- Width | Numbers per token | input
- Depth | Number of transformer blocks | input
- Context length | Tokens read at once | input
```

```diagram compare Vocabulary size trade-off
## Bigger vocabulary | process
- Shorter token sequences
- Bigger embedding table
## Smaller vocabulary | store
- Longer token sequences
- Smaller embedding table
```

## Real-world example
A software company wanted a tiny on-device model for code completion in its own scripting language. A design of about 30 million parameters with a custom tokeniser and 512-token context fitted the device's memory and speed limits; experiments compared deeper-and-narrower against shallower-and-wider at the same size.

## How it works
1. Fix the constraints: data available, compute budget, memory and speed targets.
2. Train or choose a tokeniser; count tokens in your data.
3. Pick width, depth, heads and context; compute parameters.
4. Estimate memory for training and for use (see [Scaling up](lesson:llm-scale)).
5. Plan the training tokens (around 20 per parameter as a starting rule of thumb).
6. Run small experiments, one change at a time; record the results.

```diagram flow Design workflow
note: Each step feeds the next. Experiments may send you back to change a setting.
- Fix constraints | Data, compute, memory and speed targets | input
- Tokeniser | Train or choose one; count tokens in your data | process
- Pick settings | Width, depth, heads and context; compute parameters | model
- Estimate memory | For training and for use | process
- Plan training tokens | Around 20 per parameter as a starting rule of thumb | process
- Run experiments | One change at a time; record results | output
```

```diagram compare One change at a time
## Several changes at once | bad
- Results improve or worsen
- You cannot tell which setting caused it
## One change at a time | output
- Compare against the same baseline
- Any change is traced to one choice
```

### Related concepts
- **Mixture of experts (MoE)**: instead of one large feed-forward block per layer, the model has many smaller "expert" blocks and a router that sends each token to only a few of them. The model has many parameters in total but uses only a fraction per token, so it is cheaper to run than a dense model of the same total size. All experts must still fit in memory.
- **Dense model**: the usual design, where every parameter is used for every token.
- **Long context**: models that accept hundreds of thousands of tokens. Longer context costs more memory (the KV cache grows with length) and models may still miss facts in the middle of very long inputs, so retrieval (RAG) is often still better.

```diagram compare Dense model versus mixture of experts
## Dense model | model
- Every parameter is used for every token
- The usual design
## Mixture of experts | process
- A router sends each token to only a few experts
- Many parameters, a fraction used per token
- Cheaper to run than a same-size dense model
- All experts must still fit in memory
```

```diagram flow Long context costs memory
note: Retrieval (RAG) is often still better than very long inputs.
- Longer input | Hundreds of thousands of tokens | input
- KV cache grows | More memory with length | warn
- Facts in the middle | May still be missed | bad
```

## Python example
Approximate size of three designs (embeddings + positions + 12 × width² per block), with memory for weights in 16-bit and for full training:
```text Output of quickpath.py llm_size (executed)
laptop tiny  vocab   8000 width  256 layers  6 context  256 ->      6.8 M parameters | weights bf16   0.01 GB | full training state ~   0.1 GB
small        vocab  32000 width  768 layers 12 context 1024 ->    110.3 M parameters | weights bf16   0.22 GB | full training state ~   1.8 GB
medium       vocab  50000 width 2048 layers 24 context 4096 ->   1318.7 M parameters | weights bf16   2.64 GB | full training state ~  21.1 GB
```
The tiny design trains on any laptop. The 110-million-parameter design (similar in size to early GPT-2) needs a decent GPU. The 1.3-billion design needs a large GPU or several.
```python parameter estimate
def params(vocab, d, layers, ctx):
    return vocab * d + ctx * d + layers * 12 * d * d     # embeddings + positions + transformer blocks
```

## .NET (C#) example
The same design calculator in C#, handy inside a planning tool or an internal web app:
```cs Program.cs
var designs = new (string Name, long Vocab, long Width, long Layers, long Context)[]
{
    ("laptop tiny", 8_000, 256, 6, 256),
    ("small", 32_000, 768, 12, 1_024),
    ("medium", 50_000, 2_048, 24, 4_096),
};
foreach (var d in designs)
{
    long parameters = d.Vocab * d.Width + d.Context * d.Width + d.Layers * 12 * d.Width * d.Width;
    double weightsGb = parameters * 2 / 1e9;          // 16-bit weights
    double trainingGb = parameters * 16 / 1e9;        // weights + gradients + optimiser state (rule of thumb)
    long tokensNeeded = parameters * 20;              // rule-of-thumb training tokens
    Console.WriteLine($"{d.Name,-12} {parameters / 1e6,8:F1} M params | weights {weightsGb:F2} GB | training ~{trainingGb:F1} GB | ~{tokensNeeded / 1e9:F1} B tokens");
}
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Parameter count (how big the model is)
**Where it is used:** the design calculator in this lesson, which adds up the embedding table, position table and transformer blocks.

```formula Approximate parameter count
parameters = vocab × width + context × width + layers × 12 × width^2
```
vocab = number of tokens the tokeniser knows, width = numbers per token (model dimension), context = longest sequence, layers = number of transformer blocks. The 12 × width^2 per block is a common rough estimate.

**In plain words:** one table for the tokens, one for the positions, and a fixed-size block repeated once per layer.

**Example 1: the laptop design.** vocab 8,000, width 256, layers 6, context 256. Token table: 8,000 × 256 = 2,048,000. Position table: 256 × 256 = 65,536. Blocks: 6 × 12 × 65,536 = 4,718,592. Total = 6,832,128, about 6.8 million.

**Example 2: a smaller made-up design.** vocab 1,000, width 64, layers 2, context 128. Token table: 1,000 × 64 = 64,000. Positions: 128 × 64 = 8,192. Blocks: 2 × 12 × 4,096 = 98,304. Total = 170,496. Most of the size here is in the blocks, while in the laptop design the token table is a bigger share than it is here.

### Memory and training tokens from the parameter count
**Where it is used:** checking that a design fits the memory and data you have.

```formula Memory and data rules of thumb
weights memory = parameters × bytes per parameter
full training memory ≈ parameters × 16 bytes
training tokens ≈ parameters × 20
```
16-bit weights use 2 bytes each. The 16 bytes covers weights, gradients and optimiser state; the 20 tokens per parameter is a starting guide, not a law.

**In plain words:** multiply the parameter count by a number of bytes to get memory, and by about 20 to get the amount of text to plan for.

**Example 1: the laptop design.** 6,832,128 × 2 = 13,664,256 bytes, about 0.01 GB for the 16-bit weights. Full training: 6,832,128 × 16 = about 109 million bytes, about 0.1 GB. Tokens: 6,832,128 × 20 = about 137 million.

**Example 2: the 110-million design.** 110,300,000 × 2 = 220,600,000 bytes, about 0.22 GB. Full training: 110,300,000 × 16 = 1.76 billion bytes, about 1.8 GB. Tokens: 110,300,000 × 20 = about 2.2 billion.

## Maths behind it
- Parameter counting (linear algebra)
- Scaling laws and compute-optimal training
- Attention complexity (grows with the square of context length)
- Floating-point formats and memory arithmetic

## Common mistakes
- Changing several settings at once, so you cannot tell what helped.
- A vocabulary so large that the embedding table eats most of a small model.
- Designing for a long context you do not need; attention cost grows quickly with length.

## Quick check
Q: What does weight tying (sharing input and output embeddings) save?
A: One vocabulary-by-width table of parameters.

Q: Roughly how many training tokens does the 20-per-parameter rule suggest for a 110-million-parameter model?
A: About 2.2 billion tokens.

Q: Why test one change at a time?
A: So you can attribute any improvement or problem to that specific choice.
