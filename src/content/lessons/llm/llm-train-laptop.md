---
id: llm-train-laptop
title: Train a small language model on your laptop
module: llm
level: Advanced
minutes: 120
goal: Train a character-level language model end to end on a laptop, read training and validation loss, save and reload checkpoints, and run the same loop as a tiny transformer.
prereqs: llm-design, dl-training
reviewed: 2026-11-02
evidence: Your training log with train and validation loss, a reloaded checkpoint giving the same validation loss, and samples before and after training.
code: Python NumPy model executed 2026-11-02 (examples/tiny-lm/tiny_char_lm_numpy.py, about 2 seconds on CPU); PyTorch transformer and C# (TorchSharp) not run (not installed in the build environment)
---
## In plain words
You can train a real language model on any laptop if you keep it small. This lesson trains one that reads three characters and predicts the next, on 2,200 characters of original text. It shows every real step of LLM training: building a vocabulary, making (context → next token) pairs, measuring **cross-entropy loss**, updating weights, watching **training** and **validation** loss, saving **checkpoints** and **sampling** text. It is not a production LLM: those use transformers with billions of weights, trillions of tokens and many GPUs. But the loop is the same, which is why engineers test their whole pipeline on a tiny model first. A model guessing randomly among 29 characters has a loss of about 3.37; lower is better. When training loss keeps falling but validation loss stops improving, the model is starting to **overfit**.

```diagram flow Training pair: three characters in, one out
note: The model reads three characters and predicts the next one.
- Three characters | The context the model reads | input
- Model | Scores every character in the vocabulary | model
- Predicted next character | Compared with the real next character | output
```

```diagram compare Training loss versus validation loss
## Training loss | process
- Measured on text the model learns from
- Keeps falling as training goes on
## Validation loss | output
- Measured on held-out text
- Stops improving when overfitting starts
```

```diagram nest Tiny model, same loop as a big one
note: A tiny model tests the whole pipeline cheaply.
- Production LLM | Transformers, billions of weights, many GPUs | model
- Same training loop | Data, loss, update, log, checkpoint, sample | process
- Tiny laptop model | Three characters in, 2,200 characters of text | input
```

## Real-world example
Before renting expensive GPUs to train a domain model, an engineer runs the full pipeline (data, tokeniser, training, logging, checkpoints, evaluation) on a tiny model in minutes. Bugs found here cost seconds instead of a day of GPU time.

```diagram compare Tiny test first versus big run first
## Tiny model first | output
- Whole pipeline runs in minutes
- Bugs cost seconds
## Big run first | bad
- Bugs found after renting expensive GPUs
- Can cost a day of GPU time
```

## How it works
1. Read text; build the vocabulary (here: characters).
2. Make training pairs: previous characters → next character; split 90% train, 10% validation.
3. Initialise random weights; predict; compute cross-entropy loss.
4. Backpropagate and update; use a learning-rate schedule.
5. Log train and validation loss; save checkpoints; reload and check.
6. Sample text to see what the model learned.

```diagram flow Laptop training pipeline
note: Steps 1 and 2, then the repeating loop below, then checks.
- Read text | Build the vocabulary (here characters) | input
- Make pairs | Previous characters to next character; 90% train, 10% validation | process
- Predict | Random weights at first; compute cross-entropy loss | model
- Update weights | Backpropagate with a learning-rate schedule | process
- Log and checkpoint | Train and validation loss; save, reload, check | store
- Sample text | See what the model learned | output
```

```diagram loop The training loop
- Predict next character | Using the current weights | model
- Measure loss | Cross-entropy against the real character | process
- Backpropagate | Find how each weight should change | process
- Update weights | Following the learning-rate schedule | process
loop: Repeat for thousands of steps, logging train and validation loss
```

```diagram bar Data split
note: Illustrative figure from the lesson text: 90% train, 10% validation.
- Training pairs | 90 | process
- Validation pairs | 10 | output
```

## Python example
```text Output of tiny_char_lm_numpy.py (executed)
Characters: 2208, vocabulary: 29, train pairs: 1987, val pairs: 221
Uniform-guess loss would be ln(29) = 3.367
Step    0  train 3.372  val 3.371
Sample before training: 'thepe, uxosmyu v rbvmfj aqpoizzrqqiasmglwyhngogiwdp.vtdw,gbktd,'
Step 1500  train 0.812  val 0.818
Step 3000  train 0.644  val 0.784
Step 4500  train 0.615  val 0.793
Step 6000  train 0.559  val 0.761
Checkpoint reloaded, val loss 0.761
Sample after training:  'the engineer s tei reads the wteq learns when the remorised tha'
```
The loss starts at the random-guess level, falls fast, and after step 1,500 the gap between training and validation widens (early overfitting on this tiny text). The sample turns from noise into real words. The next step up, `examples/tiny-lm/tiny_gpt_pytorch.py`, replaces this network with a 2-block transformer (64-character context, AdamW, cosine learning-rate schedule, gradient clipping, best-checkpoint saving):
```python tiny_gpt_pytorch.py (excerpt; requires torch)
for it in range(max_iters + 1):
    xb, yb = get_batch("train")                  # targets are the inputs shifted by one character
    _, loss = model(xb, yb)
    opt.zero_grad(set_to_none=True)
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step(); sched.step()
```

## .NET (C#) example
A character-level model in TorchSharp: embeddings → linear layer → next-character scores (a bigram neural model):
```cs Program.cs
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

string text = File.ReadAllText("corpus.txt").ToLowerInvariant();
var chars = text.Distinct().OrderBy(c => c).ToArray();
var index = chars.Select((c, i) => (c, i)).ToDictionary(p => p.c, p => (long)p.i);
var ids = tensor(text.Select(c => index[c]).ToArray());
long n = ids.shape[0];
var inputs = ids.slice(0, 0, n - 1, 1);                     // every character except the last
var targets = ids.slice(0, 1, n, 1);                         // the character that follows each one

var model = Sequential(("embed", Embedding(chars.Length, 32)), ("out", Linear(32, chars.Length)));
var optimizer = optim.AdamW(model.parameters(), lr: 0.01);
for (int step = 0; step <= 2000; step++)
{
    optimizer.zero_grad();
    var loss = functional.cross_entropy(model.forward(inputs), targets);
    loss.backward();
    optimizer.step();
    if (step % 500 == 0) Console.WriteLine($"step {step} loss {loss.item<float>():F3}");
}
model.save("tiny-lm.bin");                                    // checkpoint
```
The first printed loss should be close to ln(vocabulary size), the random-guess level, and then fall.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Cross-entropy loss and the random-guess level
**Where it is used:** the training loss and validation loss printed by the tiny model, which start near the guessing level.

```formula Loss for one next-character prediction
loss = -ln(probability the model gave to the correct character)
random-guess loss = ln(vocabulary size)
```
ln is the natural logarithm. The loss is 0 if the model is certain and right, and grows as the probability for the right character falls.

**In plain words:** the loss measures how surprised the model was by the real next character. A model that guesses evenly has a known starting loss.

**Example 1: the starting point.** The vocabulary has 29 characters, so a guess gives each a probability of 1 ÷ 29 and the loss is ln(29) = 3.367. The lesson's step 0 loss, 3.372, is very close.

**Example 2: a few probabilities.** If the model gives the correct character 0.5, the loss is -ln(0.5) = 0.693. If it gives only 0.1, the loss is -ln(0.1) = 2.303. Giving 0.1 is penalised more than three times as much as giving 0.5.

### The train/validation gap (spotting overfitting)
**Where it is used:** reading the printed losses to decide when to stop training.

```formula Gap
gap = validation loss - training loss
```
A small gap means the model does as well on unseen text as on text it trained on. A growing gap suggests memorising.

**In plain words:** subtract the two losses at each step. If the gap keeps growing, the model is learning the training text rather than the language.

**Example 1: step 1,500.** Training 0.812, validation 0.818. Gap = 0.818 - 0.812 = 0.006, which is tiny.

**Example 2: step 4,500.** Training 0.615, validation 0.793. Gap = 0.793 - 0.615 = 0.178. The gap grew from 0.006 to 0.178 while training loss kept falling, which is early overfitting on this small text.

## Maths behind it
- Cross-entropy and log-likelihood
- Backpropagation and gradient descent
- Learning-rate schedules, gradient clipping
- Perplexity (loss turned into "number of choices")

## Common mistakes
- Comparing runs with different data splits or seeds and blaming the setting you changed.
- Validation text that repeats training text, which makes validation loss look too good.
- Saving only the weights, then resuming training with a fresh optimiser.

```diagram compare Checkpoint saving
## Weights only | bad
- Resuming starts with a fresh optimiser
- The optimiser's saved state is lost
## Weights plus optimiser state | output
- Resume where you stopped
- Reload and check the validation loss
```

## Quick check
Q: Why is the starting loss about 3.37?
A: Random weights give roughly equal chances to 29 characters, and the loss of a uniform guess is ln(29) ≈ 3.37.

Q: What does a widening gap between training and validation loss mean?
A: The model is starting to overfit: it learns the training text better without improving on new text.

Q: Why train a tiny model before a big one?
A: To test the whole pipeline cheaply and catch bugs before spending on large hardware.
