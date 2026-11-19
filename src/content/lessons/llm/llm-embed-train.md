---
id: llm-embed-train
title: How embedding models are trained
module: llm
level: Advanced
minutes: 60
maths: algebra
goal: Explain how an embedding model learns to place related texts close together, work out cosine similarity and the contrastive loss for a small batch by hand, and say why the choice of negatives and the temperature matter.
prereqs: app-embeddings, llm-how
reviewed: 2026-11-19
evidence: The cosine similarity table for a batch of three question and answer pairs before and after training, with the contrastive loss and top-1 accuracy for each, and a sentence on what changed.
code: Python executed 2026-11-19 (examples/embed-train/embed_train.py, NumPy only); no embedding model was trained and no neural framework was run; the C# version prints the same output
---
## In plain words
An **embedding model** turns a piece of text into a short list of numbers so that texts with similar meaning get similar lists. The earlier lesson on embeddings used such a model. This lesson shows how one is made. A transformer reads the text and produces one vector per token. A **pooling** step, usually the average of the token vectors, turns them into one vector for the whole text. Training then needs examples of what should be close: a question and its answer, a title and its article, two paraphrases. In a batch of such pairs, every other answer is treated as a wrong answer, called a **negative**. The **contrastive loss** (often called InfoNCE) rewards the model when each question is closest to its own answer and far from the others. A setting called the **temperature** controls how sharply the loss punishes a wrong ranking.

```diagram flow Training an embedding model
note: The model only ever sees which pairs belong together. Everything else follows from that.
- Collect pairs that should be close | Question and answer, title and article | input
- Embed both sides with the same network | Pool the token vectors to one vector | model
- Compare every question with every answer | A table of cosine similarities | process
- Update the network to raise the diagonal | Own answers closer, others farther | output
```

```diagram compare Easy and hard negatives
note: Hard negatives teach the model fine differences. Too hard, and they may be real matches.
## Easy negatives | process
- Answers to unrelated questions
- Quickly learned, teach little after that
## Hard negatives | warn
- Answers that look close but are wrong
- Teach fine differences
- May include unlabelled true matches
```

```diagram compare What the temperature does
note: A small temperature makes the loss look at the gap between the best and the rest.
## Low temperature | warn
- Sharp: a wrong ranking is punished hard
- Can make training unstable
## High temperature | process
- Gentle: all answers share the probability
- Learns slowly and less sharply
```

## Real-world example
A company wants search over its support articles. A general embedding model finds articles on the right topic but often ranks the wrong one first, because many articles are alike. The team collects pairs of real customer questions and the article that solved each, and fine-tunes the embedding model on them with a contrastive loss, using the other articles in each batch as negatives and a few look-alike articles as hard negatives. They measure how often the right article is first (top-1 accuracy) on questions the model did not see, and compare with the general model. They also check that the fine-tuned model still handles questions about topics that were not in the training pairs.

## How it works
1. **Embed.** Pass each text through the network and average the token vectors to get one vector. Scale each vector to length one.
2. **Compare.** The cosine similarity of two unit vectors is their dot product. Compute it for every question against every answer in the batch.
3. **Loss.** Divide the similarities by the temperature, turn each row into probabilities with a softmax, and take minus the logarithm of the probability given to the right answer. Average over the batch.
4. **Update.** Gradient descent changes the network so that the right answers' similarities rise and the others fall.
5. **Use.** At search time, embed the query once, compare with stored vectors, and return the nearest. Larger batches mean more negatives, which usually helps.

```maths Cosine similarity of one pair
situation: A question vector is (1.0, 0.2, 0.0) and its answer from an untrained model is (0.4, 0.9, 0.1).
find: How similar are they by cosine similarity?
step: Dot product, multiplying matching numbers and adding | 1.0 × 0.4 + 0.2 × 0.9 + 0 × 0.1 = 0.58
step: Length of the question vector | sqrt(1 + 0.04) ≈ 1.0198
step: Length of the answer vector | sqrt(0.16 + 0.81 + 0.01) ≈ 0.99
step: Dot product divided by the two lengths | 0.58 ÷ (1.0198 × 0.99) ≈ 0.5745
result: The cosine similarity is about 0.57. One means pointing the same way, 0 unrelated, minus one opposite.
formula: cosine similarity = dot product ÷ (length of a × length of b)
why: Dividing by the lengths means only direction counts, so a long text and a short text on the same subject can still match.
try: What is the cosine similarity of (1, 0) with (0, 1)?
answer: The dot product is 1 × 0 + 0 × 1 = 0, so the similarity is 0. The two lists are unrelated.
```

```maths The contrastive loss for one question, before and after training
situation: One question is compared with three answers, and the first answer is the right one. Before training the similarities (from the table below, rounded) are 0.57, 0.97 and 0.31. After training they are 0.99, 0.38 and 0.13. The temperature is 0.1, so each similarity is divided by 0.1.
find: How large is the loss before and after?
step: Before: the three scores divided by 0.1, then exponentiated, first answer | exp(5.7) ≈ 298.9
step: Before: second answer | exp(9.7) ≈ 16318
step: Before: third answer | exp(3.1) ≈ 22.2
step: Before: total | 298.9 + 16318 + 22.2 = 16639.1
step: Before: probability given to the right answer | 298.9 ÷ 16639.1 ≈ 0.01796
step: Before: loss for this question | -ln(0.01796) ≈ 4.02
step: After: the right answer's score and the total | exp(9.9) ≈ 19930
step: After: total of the three | 19930 + 44.7 + 3.67 ≈ 19978.4
step: After: probability given to the right answer | 19930 ÷ 19978.4 ≈ 0.99758
step: After: loss for this question | -ln(0.99758) ≈ 0.00242
result: Before training the model gives the right answer only 1.8% of the probability, a loss of about 4.02. After training it gives 99.8% and the loss is about 0.0024.
why: The loss falls as the right answer's similarity pulls ahead of the others. This one number is what gradient descent tries to push down.
```

```maths The temperature
situation: Take the same three untrained similarities and use a temperature of 1 instead of 0.1.
find: What probability does the right answer get now?
step: First answer | exp(0.57) ≈ 1.768
step: Second answer | exp(0.97) ≈ 2.638
step: Third answer | exp(0.31) ≈ 1.363
step: Share given to the first answer | 1.768 ÷ (1.768 + 2.638 + 1.363) ≈ 0.3065
result: At temperature 1 the right answer gets 30.7% of the probability. At temperature 0.1 it got only 1.8%.
why: A low temperature makes the model pay for every wrong ranking, so it learns fast and can become unstable. A high temperature spreads the probability and learns slowly. Typical embedding training uses a small value.
```

## Python example
Mean pooling of three token vectors, then the cosine similarity table and the contrastive loss for three question and answer pairs, before and after training. The vectors are fixed by hand, so this shows the loss, not a trained network. No neural framework was run.

```python embed_train.py
"""How an embedding model is trained: mean pooling, cosine similarity and the contrastive (InfoNCE) loss.

Three question and answer pairs are turned into short vectors. The loss is low when each question is closest to its own
answer and far from the other answers in the batch. The vectors are fixed by hand so the numbers repeat.
Run:  python embed_train.py   (needs numpy)
"""
import numpy as np

print("mean pooling of three token vectors:", np.mean([[1, 2], [3, 4], [5, 0]], axis=0).tolist())

Q = np.array([[1.0, 0.2, 0.0], [0.1, 1.0, 0.3], [0.0, 0.3, 1.0]])             # question vectors
A_before = np.array([[0.4, 0.9, 0.1], [0.9, 0.3, 0.2], [0.2, 0.5, 0.8]])      # answer vectors from an untrained model
A_after = np.array([[1.0, 0.3, 0.1], [0.2, 1.0, 0.2], [0.1, 0.2, 1.0]])       # the same answers after training

def unit(M):
    return M / np.linalg.norm(M, axis=1, keepdims=True)

def report(name, A, tau=0.1):
    sim = unit(Q) @ unit(A).T                                  # cosine similarity of every question with every answer
    logits = sim / tau
    probs = np.exp(logits) / np.exp(logits).sum(axis=1, keepdims=True)
    loss = float(-np.log(np.diag(probs)).mean())               # InfoNCE: each question should pick its own answer
    hits = float(np.mean(sim.argmax(axis=1) == np.arange(3)))
    print(name + ": similarity of question i with answer j")
    for row in sim:
        print("   " + "  ".join("%.2f" % v for v in row))
    print("   loss %.3f, top-1 accuracy %.2f" % (loss, hits))

report("before training", A_before)
report("after training ", A_after)
```
```text Output of embed_train.py (executed)
mean pooling of three token vectors: [3.0, 2.0]
before training: similarity of question i with answer j
   0.57  0.97  0.31
   0.93  0.44  0.75
   0.36  0.29  0.94
   loss 3.020, top-1 accuracy 0.33
after training : similarity of question i with answer j
   0.99  0.38  0.13
   0.39  0.99  0.47
   0.17  0.46  0.99
   loss 0.005, top-1 accuracy 1.00
```
Before training, the first question is most similar to the second answer (0.97), not its own (0.57), and only one question in three finds its own answer (accuracy 0.33). The loss is 3.020. After training, every question is closest to its own answer (accuracy 1.00) and the loss is 0.005.

## .NET (C#) example
The same pooling, similarity and loss written from scratch in C#, with no packages, printing the same output. To use an embedding model from C#, call a hosted embedding service through Microsoft.Extensions.AI, or run an exported ONNX model with ONNX Runtime. Training an embedding model is done in Python.

```cs Program.cs
// Mean pooling, cosine similarity and the contrastive (InfoNCE) loss, from scratch. Same output as embed_train.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

double[][] tokens = { new[] { 1.0, 2.0 }, new[] { 3.0, 4.0 }, new[] { 5.0, 0.0 } };
var pooled = Enumerable.Range(0, 2).Select(k => tokens.Average(t => t[k])).ToArray();
Console.WriteLine("mean pooling of three token vectors: [" + string.Join(", ", pooled.Select(v => v.ToString("0.0"))) + "]");

double[][] Q = { new[] { 1.0, 0.2, 0.0 }, new[] { 0.1, 1.0, 0.3 }, new[] { 0.0, 0.3, 1.0 } };                       // question vectors
double[][] aBefore = { new[] { 0.4, 0.9, 0.1 }, new[] { 0.9, 0.3, 0.2 }, new[] { 0.2, 0.5, 0.8 } };                 // untrained answers
double[][] aAfter = { new[] { 1.0, 0.3, 0.1 }, new[] { 0.2, 1.0, 0.2 }, new[] { 0.1, 0.2, 1.0 } };                  // after training

double[] Unit(double[] v) { double n = Math.Sqrt(v.Sum(x => x * x)); return v.Select(x => x / n).ToArray(); }
void Report(string name, double[][] A, double tau = 0.1)
{
    var q = Q.Select(Unit).ToArray(); var a = A.Select(Unit).ToArray();
    var sim = q.Select(qi => a.Select(aj => qi.Zip(aj, (x, y) => x * y).Sum()).ToArray()).ToArray();      // cosine similarity of every question with every answer
    double loss = 0; int hits = 0;
    for (int i = 0; i < 3; i++)
    {
        var e = sim[i].Select(s => Math.Exp(s / tau)).ToArray();
        loss += -Math.Log(e[i] / e.Sum());                                                                // InfoNCE: each question should pick its own answer
        if (Array.IndexOf(sim[i], sim[i].Max()) == i) hits++;
    }
    Console.WriteLine(name + ": similarity of question i with answer j");
    foreach (var row in sim) Console.WriteLine("   " + string.Join("  ", row.Select(v => v.ToString("F2"))));
    Console.WriteLine($"   loss {loss / 3:F3}, top-1 accuracy {hits / 3.0:F2}");
}
Report("before training", aBefore);
Report("after training ", aAfter);
```

## Maths behind it
- Averages of vectors (mean pooling)
- Dot product, vector length and cosine similarity (linear algebra)
- Softmax and the negative logarithm of a probability (probability)
- Exponentials with a temperature scale (algebra)

## Common mistakes
- Using negatives that are really true matches, which teaches the model the wrong thing.
- Training with very small batches, so there are too few negatives.
- Using different pooling or normalisation at search time than at training time.
- Judging the model on the training pairs. Use questions it has not seen.
- Forgetting to check that a fine-tuned model has not lost its general ability.

## Quick check
Q: What does pooling do in an embedding model?
A: It turns the many token vectors of a text into one vector, most often by taking their average.

Q: What are the "negatives" in a batch of question and answer pairs?
A: Every answer that belongs to a different question. The loss pushes each question away from them.

Q: Why divide similarities by a small temperature in the loss?
A: It sharpens the softmax, so the model is punished hard when a wrong answer outranks the right one.

Q: The loss fell from 3.020 to 0.005 in the example. What else changed?
A: Top-1 accuracy rose from 0.33 to 1.00, because every question became closest to its own answer.
