---
id: dl-sequences
title: Text and sequences: tokens, embeddings and RNNs
module: dl
level: Intermediate
minutes: 75
goal: Explain how text becomes numbers (tokens and embeddings), how word vectors capture meaning, and how recurrent networks process sequences and why transformers replaced them.
prereqs: dl-neural-nets, d-features
reviewed: 2026-11-02
evidence: Word vectors trained on a small corpus you choose, with nearest neighbours for five words and a note on one surprising result.
code: Python executed 2026-11-02 (gap_topics.py wordvec, ai_extras.py rnn); C# (TorchSharp) not run (not installed in the build environment)
---
## In plain words
Text, speech and sensor readings are **sequences**: order matters. To use text, you first split it into **tokens** (words or pieces of words) and give each an id. Each id is then turned into an **embedding**: a list of numbers that represents meaning, so that "cat" and "dog" end up close together. Early **word vectors** (word2vec, GloVe) learned this from the idea that words used in similar places have similar meanings. A **recurrent neural network (RNN)** reads a sequence one step at a time and keeps a **hidden state**, a running memory. **LSTMs** and **GRUs** improved that memory. Their weakness is speed and long memory: each step waits for the previous one, and early words fade. **Transformers** (next lesson) read all positions at once with attention, which is why almost all modern language models use them.

```diagram flow From text to numbers
- Text | A sentence in which order matters | input
- Tokens | Words or pieces of words | process
- Token ids | Each token gets an id | store
- Embeddings | A list of numbers per id that represents meaning | model
- Use | Classify, search, translate or generate | output
```

```diagram loop A recurrent network reading a sequence
- Read the next token | One step at a time | input
- Update the hidden state | The running memory | model
loop: Repeat for every token, then use the final state to predict
```

```diagram compare RNN and transformer
## RNN | warn
- One step at a time | Each step waits for the previous one
- Early words fade | Long memory is weak
## Transformer | model
- All positions at once | Attention lets every token see every other
- Used by almost all modern language models
```

## Real-world example
A job site wanted "software developer" searches to also find "programmer" listings. Word vectors trained on its own job ads placed those terms close together, which improved search before the company moved to a full embedding service.

## How it works
1. Tokenise text into words or sub-words; map each to an id.
2. Look up an embedding vector for each id (learned during training).
3. RNN: update the hidden state with each new token; use the final state to predict.
4. Transformer: let every token look at every other token at once (attention).
5. Use the resulting vectors to classify, search, translate or generate.

```diagram fan One text, many uses of its vectors
- Token vectors | Produced by embeddings and an RNN or transformer | model
- Classify | Assign a label | output
- Search | Find similar meanings | output
- Translate | Read one text, write another | output
- Generate | Write new text | output
```

```diagram merge What the RNN's final state summarises
- Final hidden state | A running summary of everything read so far | model
- First token | Its effect may have faded | warn
- Middle tokens | Mixed into the memory step by step | process
- Last token | Added most recently | input
```

## Python example
Word vectors built from a 23-sentence corpus by counting which words appear together:
```text Output of gap_topics.py wordvec (executed)
nearest to 'cat': [('dog', 0.91), ('mouse', 0.79), ('drank', 0.74)]
nearest to 'king': [('queen', 0.93), ('country', 0.8), ('wears', 0.76)]
nearest to 'paris': [('rome', 0.82), ('berlin', 0.77), ('capital', 0.7)]
```
The vectors learned that cats are like dogs and Paris is like Rome purely from context. Odd neighbours such as "drank" come from the tiny corpus. An RNN's memory changing word by word:
```text Output of ai_extras.py rnn (executed)
after 'the': h = [0.171, 0.389, 0.164, -0.573]
after 'cat': h = [0.826, 0.585, -0.297, 0.458]
after 'sat': h = [-0.625, -0.378, -0.569, 0.197]
```

## .NET (C#) example
An embedding layer feeding an LSTM text classifier in TorchSharp:
```cs Program.cs
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

var classifier = new TextClassifier(vocabSize: 10_000, embeddingSize: 64, hiddenSize: 128, classes: 3);
var tokenIds = tensor(new long[] { 12, 845, 3, 991, 7 }).reshape(1, 5);   // one sentence of 5 token ids
var scores = classifier.forward(tokenIds);
Console.WriteLine(string.Join(", ", scores.softmax(-1).data<float>().ToArray().Select(p => p.ToString("F2"))));

public class TextClassifier : Module<Tensor, Tensor>
{
    private readonly Module<Tensor, Tensor> embed, head;
    private readonly TorchSharp.Modules.LSTM lstm;
    public TextClassifier(long vocabSize, long embeddingSize, long hiddenSize, long classes) : base(nameof(TextClassifier))
    {
        embed = Embedding(vocabSize, embeddingSize);                 // id -> meaning vector
        lstm = LSTM(embeddingSize, hiddenSize, batchFirst: true);    // reads the sequence, keeps a memory
        head = Linear(hiddenSize, classes);
        RegisterComponents();
    }
    public override Tensor forward(Tensor ids)
    {
        var (output, _, _) = lstm.forward(embed.forward(ids));
        return head.forward(output.select(1, -1));                   // use the memory after the last token
    }
}
```
The weights are untrained here, so the probabilities are meaningless until you train it with the loop from [Training deep networks](lesson:dl-training).

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Cosine similarity (how close are two word vectors?)
**Where it is used:** the job site compares word vectors to find that "software developer" and "programmer" are near each other.

```formula Cosine similarity
cosine similarity = (a · b) ÷ (length of a × length of b)
a · b = a1 × b1 + a2 × b2
length of a = sqrt(a1^2 + a2^2)
```
a and b are word vectors. The result is 1 for the same direction, 0 for unrelated, -1 for opposite.

**In plain words:** it measures whether two vectors point the same way, ignoring how long they are.

**Example 1: similar words.** a = (1, 2), b = (2, 3). a · b = 2 + 6 = 8. Lengths: sqrt(5) ≈ 2.236 and sqrt(13) ≈ 3.606. Similarity = 8 ÷ (2.236 × 3.606) = 8 ÷ 8.06 ≈ 0.99.

**Example 2: unrelated words.** a = (1, 0), b = (0, 1). a · b = 0, so similarity = 0.

### RNN hidden state update (carrying memory along a sequence)
**Where it is used:** a simple RNN reads one token at a time and keeps a hidden state as its memory.

```formula Simple RNN step
h_new = tanh(wx × x + wh × h_old + b)
```
x is the current input, h_old is the previous memory, wx and wh are weights, b is a bias, and tanh squashes the result into -1 to 1.

**In plain words:** the new memory mixes the new input with the old memory.

**Example 1: first word.** wx = 0.5, wh = 0.8, b = 0, x = 1, h_old = 0. h_new = tanh(0.5 + 0 + 0) = tanh(0.5) ≈ 0.46.

**Example 2: memory fades.** Next input x = 0, h_old = 0.46. h_new = tanh(0.8 × 0.46) = tanh(0.37) ≈ 0.35. With no new input, the memory shrinks step by step, which is why plain RNNs forget long sequences.

## Maths behind it
- Vectors and cosine similarity (linear algebra)
- Co-occurrence statistics and pointwise mutual information
- Singular value decomposition
- Recurrence and backpropagation through time

## Common mistakes
- Using a word-level vocabulary that cannot handle new words (sub-word tokens solve this).
- Expecting one vector per word to separate meanings ("bank" of a river versus a bank account); contextual models do this.
- Starting a new text project with an RNN when a pretrained transformer would do better.

```diagram compare One vector per word
## Word-level vector | warn
- "bank" has one vector | River bank and bank account share it
## Contextual model | model
- "bank" depends on its sentence | Each meaning gets its own vector
```

## Quick check
Q: What is an embedding?
A: A list of numbers representing a token's meaning, so similar meanings are close together.

Q: Why did transformers replace RNNs for most language tasks?
A: They process all positions at once (fast on GPUs) and handle long-range context better.

Q: What does an RNN's hidden state hold?
A: A running summary of everything it has read so far in the sequence.
