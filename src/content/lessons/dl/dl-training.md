---
id: dl-training
title: Training deep networks well
module: dl
level: Intermediate
minutes: 90
goal: Use batches, epochs, learning rates, optimisers, dropout, normalisation, early stopping, checkpoints and GPUs to train networks reliably.
prereqs: dl-neural-nets
reviewed: 2026-11-02
evidence: Two training runs of one model (with and without regularisation) with training and validation loss curves and the best checkpoint saved.
code: Python dropout demo executed 2026-11-02 (ai_extras.py dropout); PyTorch and C# (TorchSharp) not run (not installed in the build environment); added technique snippets (2026-11-05) not run
---
## In plain words
Training a network well is a craft with a standard toolkit. Data is fed in small **batches** (for example 32 examples); one full pass over the data is an **epoch**. The **learning rate** sets the step size; a **schedule** often warms it up and then lowers it. The **optimiser** (SGD, Adam, AdamW) decides how each step is taken. **Dropout** randomly switches off some neurons during training so the network cannot rely on one path. **Batch or layer normalisation** keeps numbers inside the network in a stable range. **Data augmentation** creates realistic variations (flipped photos, cropped images). **Early stopping** keeps the version with the best **validation** score and stops when it stops improving. **Checkpoints** save progress. A **GPU** runs the maths many times faster, and **mixed precision** uses smaller number formats to save memory and time.

```diagram nest Batch, epoch and training run
note: A batch is a small group of examples used for one update. An epoch is one full pass over the data.
- Training run | Many epochs until early stopping or the limit | process
- Epoch | One full pass over all the training data | process
- Batch | A small group of examples, for example 32 | input
```

```diagram layers Toolkit for stable training
- Data: batches and augmentation | Small groups; realistic variations such as flipped photos | input
- Model: dropout and normalisation | Switch off some neurons; keep numbers in a stable range | model
- Optimiser and learning rate | SGD, Adam or AdamW, with a schedule that warms up then lowers the rate | process
- Safety: validation, early stopping, checkpoints | Keep the best version and save progress | store
- Hardware: GPU and mixed precision | Faster runs; smaller number formats save memory and time | output
```

```diagram compare Dropout during training and in use
## Training | process
- Some neurons off | Randomly switched off so the network cannot rely on one path
## Validation and use | model
- All neurons on | Use eval mode so dropout is off
```

## Real-world example
A medical-imaging start-up has only 3,000 labelled scans. Augmentation (small rotations, brightness changes), dropout and early stopping make results stable from run to run, and checkpoints let a 10-hour training job resume after a power cut instead of starting again.

## How it works
1. Split data into training and validation; create batches.
2. For each epoch: forward, loss, backward, optimiser step for every batch.
3. After each epoch, measure validation loss without dropout (`eval` mode).
4. Save a checkpoint when validation improves; stop after several epochs without improvement.
5. Move model and data to the GPU when one is available.

```diagram loop The training loop with early stopping
- Train on every batch | Forward, loss, backward, optimiser step | process
- Validate in eval mode | Measure validation loss without dropout | process
- Better than before? | If yes, save a checkpoint | store
- Count epochs without improvement | Stop after several | warn
loop: Repeat for the next epoch until early stopping triggers
```

```diagram lanes Training data and validation data
## Training data
- Batches | input
- Forward, loss, backward, update | process
## Validation data
- No augmentation | input
- Measure loss only | output
```

### Related concepts
- **Batch normalisation**: rescales each layer's outputs over a mini-batch so training is more stable and can use higher learning rates. Common in image models. **Layer normalisation** does the same per example and is used in transformers.
  Everyday example: a class has test scores of 2, 4, 6 and 8. Batch normalisation first finds the average (5) and then shifts and shrinks every score so the group is centred on 0 with a spread of about 1. The numbers inside the network then stay small and tidy, whatever the layer before produced.

```diagram flow Batch normalisation
- Collect a layer's outputs for one batch | For example 32 examples at once | input
- Find the average and the spread | One average and one spread for the batch | process
- Shift and shrink each value | The batch is now centred on 0 with a spread of about 1 | model
- Pass the tidy values to the next layer | Training is steadier | output
```

- **Learning-rate schedule**: changing the learning rate during training, typically a short warm-up then a gradual decrease. Almost all large models use one. Everyday example: when you park a car you drive fast on the main road and slow down more and more as you reach the space. Warm-up is the careful first metres (small steps while the network is still random). Decay is the slowing down at the end (small steps for fine adjustment). A **step decay** cuts the rate by a fixed factor every few epochs.

```diagram flow Learning-rate schedule
- Warm-up | A short start with a small learning rate | process
- Peak | The chosen learning rate | model
- Gradual decrease | Smaller steps as training settles | output
```

- **Gradient clipping**: capping the size of gradient updates to stop a single bad batch from breaking training. Everyday example: a speed limiter on a van. The driver may press the pedal hard, but the van never goes above the limit. In the same way, if the gradient (the push that says how to change the weights) is longer than the limit, it is shrunk to the limit but keeps its direction.

```diagram flow Gradient clipping
- Measure the length of the gradient | One number for how big the push is | input
- Compare it with the limit | Is it longer than the limit? | process
- If too long, shrink it to the limit | The direction stays the same | model
- Update the weights | One bad batch can no longer break training | output
```

## Python example
How dropout works (keep 80% of activations, scale survivors so the average stays the same):
```text Output of ai_extras.py dropout (executed)
mask: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1] | output: [1.25, 1.25, 0.0, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25] | mean of many runs ≈ 0.998
```
A complete PyTorch training loop with batches, GPU, early stopping and checkpoints:
```python train.py (requires: pip install torch)
device = "cuda" if torch.cuda.is_available() else "cpu"
model = torch.nn.Sequential(torch.nn.Linear(20, 64), torch.nn.ReLU(), torch.nn.Dropout(0.3), torch.nn.Linear(64, 2)).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
train_dl = torch.utils.data.DataLoader(train_ds, batch_size=32, shuffle=True)
best, patience, bad_epochs = float("inf"), 5, 0
for epoch in range(100):
    model.train()
    for xb, yb in train_dl:
        xb, yb = xb.to(device), yb.to(device)
        loss = torch.nn.functional.cross_entropy(model(xb), yb)
        opt.zero_grad(); loss.backward(); opt.step()
    model.eval()
    with torch.no_grad():
        val = sum(torch.nn.functional.cross_entropy(model(x.to(device)), y.to(device)).item() for x, y in val_dl) / len(val_dl)
    if val < best:
        best, bad_epochs = val, 0
        torch.save(model.state_dict(), "best.pt")          # checkpoint
    else:
        bad_epochs += 1
        if bad_epochs >= patience: break                   # early stopping
```

### More techniques in Python: batch normalisation, gradient clipping, learning-rate schedule
Plain numpy, one idea each (these snippets were not run):
```python training_tricks.py (not run here)
import numpy as np

def batch_norm(x, tiny=1e-5):
    # shift to average 0 and shrink to spread 1; "tiny" avoids dividing by zero
    return (x - x.mean()) / np.sqrt(x.var() + tiny)

def clip(grad, limit):
    length = np.sqrt((grad ** 2).sum())        # length of the gradient
    if length > limit:
        grad = grad * limit / length           # shrink to the limit, same direction
    return grad

def learning_rate(epoch, peak=0.001, warm=4):
    if epoch < warm:
        return peak * epoch / warm             # warm-up: start small
    return peak * 0.1 ** ((epoch - warm) // 10)  # step decay: divide by 10 every 10 epochs

print(batch_norm(np.array([2.0, 4.0, 6.0, 8.0])))
print(clip(np.array([3.0, 4.0]), 1.0))
print(learning_rate(3))
```

## .NET (C#) example
The same pattern in TorchSharp:
```cs Program.cs
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

var device = cuda.is_available() ? CUDA : CPU;
var model = Sequential(("in", Linear(20, 64)), ("relu", ReLU()), ("drop", Dropout(0.3)), ("out", Linear(64, 2)));
model.to(device);
var optimizer = optim.AdamW(model.parameters(), lr: 1e-3, weight_decay: 0.01);
var lossFn = CrossEntropyLoss();
double best = double.MaxValue; int badEpochs = 0;

for (int epoch = 0; epoch < 100 && badEpochs < 5; epoch++)
{
    model.train();
    foreach (var (xb, yb) in Batches(trainX, trainY, batchSize: 32))
    {
        optimizer.zero_grad();
        var loss = lossFn.forward(model.forward(xb.to(device)), yb.to(device));
        loss.backward();
        optimizer.step();
    }
    model.eval();
    using (no_grad())
    {
        double val = lossFn.forward(model.forward(valX.to(device)), valY.to(device)).item<float>();
        if (val < best) { best = val; badEpochs = 0; model.save("best.model.bin"); }   // checkpoint
        else badEpochs++;                                                               // early stopping counter
    }
}
// Batches(...) splits tensors into shuffled mini-batches; trainX/trainY/valX/valY are your tensors.
```

### More techniques in C#: batch normalisation, gradient clipping, learning-rate schedule
The same three ideas in plain C# (not compiled here):
```cs TrainingTricks.cs (not compiled here)
using System;
using System.Linq;

static class TrainingTricks
{
    // Shift to average 0 and shrink to spread 1; "tiny" avoids dividing by zero.
    public static double[] BatchNorm(double[] x, double tiny = 1e-5)
    {
        double mean = x.Average();
        double variance = x.Select(v => (v - mean) * (v - mean)).Average();
        return x.Select(v => (v - mean) / Math.Sqrt(variance + tiny)).ToArray();
    }

    // If the gradient is longer than the limit, shrink it to the limit (same direction).
    public static double[] Clip(double[] grad, double limit)
    {
        double length = Math.Sqrt(grad.Sum(g => g * g));
        return length > limit ? grad.Select(g => g * limit / length).ToArray() : grad;
    }

    // Warm-up for the first epochs, then step decay: divide by 10 every 10 epochs.
    public static double LearningRate(int epoch, double peak = 0.001, int warm = 4) =>
        epoch < warm ? peak * epoch / warm : peak * Math.Pow(0.1, (epoch - warm) / 10);
}
```


## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Gradient descent update (one small step downhill)
**Where it is used:** every training step of a deep network adjusts each weight to lower the loss.

```formula Gradient descent step
new weight = old weight - learning rate × gradient
```
The gradient is how much the loss changes when the weight goes up a little. The learning rate is the step size you choose.

**In plain words:** move the weight a small step in the direction that lowers the loss. A bigger learning rate means bigger steps.

**Example 1: positive gradient.** Weight 0.8, gradient 0.5, learning rate 0.1. New weight = 0.8 - 0.1 × 0.5 = 0.8 - 0.05 = 0.75. The weight goes down because raising it would raise the loss.

**Example 2: negative gradient and a too-large rate.** Weight 0.5, gradient -2, learning rate 0.1. New weight = 0.5 - 0.1 × (-2) = 0.5 + 0.2 = 0.7. With a learning rate of 5 the step would be 0.5 + 10 = 10.5, a huge jump that can make training unstable.

### Dropout (randomly switching neurons off)
**Where it is used:** dropout in the scan classifier reduces overfitting on only 3,000 labelled scans.

```formula Dropout with rescaling
keep probability = p
kept activation = old activation ÷ p
dropped activation = 0
```
**In plain words:** during training each neuron is kept with probability p and zeroed otherwise. Kept values are scaled up by 1 ÷ p so the layer's total stays about the same.

**Example 1: a kept neuron.** p = 0.8 and the activation is 2. Kept value = 2 ÷ 0.8 = 2.5.

**Example 2: expected size.** With p = 0.8, 10 neurons of activation 2 give a normal total of 20. On average 8 are kept: 8 × 2.5 = 20. The total matches, so no change is needed at prediction time.

### Batch normalisation (centring the numbers in a layer)
**Where it is used:** inside image networks, after a layer, so the numbers stay in a steady range.

```formula Batch normalisation
normalised = (x - mean) ÷ sqrt(variance + tiny)
```
The mean is the average of the batch. The variance is the average squared distance from the mean. "tiny" is a very small number, such as 0.00001, that stops a division by zero.

**In plain words:** subtract the average, then divide by the typical spread, so the batch is centred on 0 with a spread of about 1.

**Example 1: four values.** x = 2, 4, 6, 8. Mean = (2 + 4 + 6 + 8) ÷ 4 = 5. Distances from the mean: -3, -1, 1, 3. Squares: 9, 1, 1, 9. Variance = 20 ÷ 4 = 5. Divider = sqrt(5 + 0.00001) ≈ 2.236. Normalised: -3 ÷ 2.236 ≈ -1.342, -1 ÷ 2.236 ≈ -0.447, 1 ÷ 2.236 ≈ 0.447, 3 ÷ 2.236 ≈ 1.342.

**Example 2: identical values.** x = 10, 10, 10, 10. Mean = 10, every distance is 0, so variance = 0. Divider = sqrt(0 + 0.00001) ≈ 0.0032. Normalised = 0 ÷ 0.0032 = 0 for every value. Without "tiny" the divider would be 0 and the answer would break.

### Gradient clipping (a speed limit for updates)
**Where it is used:** language and sequence models, where one odd batch can give a huge gradient.

```formula Gradient clipping
length = sqrt(g1² + g2² + ...)
if length > limit: gradient = gradient × limit ÷ length
```
g1, g2 are the parts of the gradient. If the length is not above the limit, nothing changes.

**In plain words:** if the push is too strong, scale every part down by the same factor so the length equals the limit.

**Example 1: too long.** Gradient (3, 4), limit 1. Length = sqrt(9 + 16) = sqrt(25) = 5. 5 is above 1, so multiply by 1 ÷ 5 = 0.2: (3 × 0.2, 4 × 0.2) = (0.6, 0.8). New length = sqrt(0.36 + 0.64) = 1.

**Example 2: already small.** Gradient (0.3, 0.4), limit 1. Length = sqrt(0.09 + 0.16) = sqrt(0.25) = 0.5. 0.5 is not above 1, so the gradient stays (0.3, 0.4).

### Learning-rate schedule (warm-up, then step decay)
**Where it is used:** almost every large training run changes the learning rate over time.

```formula Warm-up then step decay
if epoch < warm-up epochs: rate = peak × epoch ÷ warm-up epochs
otherwise: rate = peak × 0.1 ^ floor((epoch - warm-up epochs) ÷ 10)
```
floor means round down. Here the rate is divided by 10 every 10 epochs after the warm-up.

**In plain words:** start with small steps, reach the chosen peak, then take smaller steps at the end.

**Example 1: warm-up.** Peak 0.001, warm-up 4 epochs. Epoch 1: 0.001 × 1 ÷ 4 = 0.00025. Epoch 3: 0.001 × 3 ÷ 4 = 0.00075.

**Example 2: decay.** Same schedule. Epoch 8: (8 - 4) ÷ 10 = 0.4, floor = 0, so rate = 0.001 × 0.1^0 = 0.001. Epoch 14: (14 - 4) ÷ 10 = 1, so rate = 0.001 × 0.1 = 0.0001. Epoch 24: (24 - 4) ÷ 10 = 2, so rate = 0.001 × 0.01 = 0.00001.

## Maths behind it
- Stochastic gradient descent, momentum, Adam (optimisation)
- Learning-rate schedules (warm-up, cosine decay)
- Regularisation: dropout, weight decay
- Batch and layer normalisation (statistics)
- Floating-point formats: FP32, FP16, BF16

## Common mistakes
- Forgetting `eval()` mode, so dropout stays on during validation.
- Augmenting validation or test data.
- Keeping the last checkpoint instead of the best one.
- A learning rate so high that the loss becomes "NaN" (not a number).

```diagram compare Which checkpoint to keep
## Keep the last one | bad
- Risk of overfitting | Validation performance may have been better earlier
## Keep the best one | output
- Taken where validation was best | Early stopping protects against overfitting
```

## Quick check
Q: What is the difference between a batch and an epoch?
A: A batch is a small group of examples used for one update; an epoch is one pass over all training data.

Q: Why scale surviving activations in dropout?
A: So the average signal is the same in training and in use, when dropout is off.

Q: What does early stopping protect against?
A: Overfitting: it keeps the model from the point where validation performance was best.
