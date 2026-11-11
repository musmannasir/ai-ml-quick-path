---
id: dl-neural-nets
title: Neural networks in plain words
module: dl
level: Intermediate
minutes: 90
goal: Explain neurons, layers, activations and backpropagation in plain words, and train a small network in Python and C#.
prereqs: ml-learning
reviewed: 2026-11-02
evidence: Your own network that learns XOR in Python or C#, and a note on what changed when you used a different random seed.
code: Python NumPy executed 2026-11-02 (examples/ai-extras/ai_extras.py nn); PyTorch and C# (TorchSharp) not run (not installed in the build environment)
---
## In plain words
A **neural network** is many tiny calculators, called **neurons**, arranged in **layers**. Each neuron takes numbers in, multiplies each by a **weight**, adds them up, and passes the result through an **activation function** (such as ReLU or tanh) that lets the network bend and combine patterns. The first layer receives the input (pixels, words, numbers); **hidden layers** in the middle build up more and more abstract patterns; the **output layer** gives the answer. "Deep" learning simply means many hidden layers. Training works like any model: predict, measure the loss, then **backpropagation** works out how much each weight contributed to the error, and the optimiser nudges every weight a little. A classic test is **XOR** (output 1 when exactly one of two inputs is 1). A straight-line model cannot learn it; a network with one small hidden layer can.

```diagram layers Layers of a neural network
note: Data moves from the top layer to the bottom layer. "Deep" means many hidden layers.
- Input layer | Receives the raw numbers: pixels, words or measurements | input
- Hidden layers | Neurons build up more and more abstract patterns | process
- Output layer | Gives the answer | output
```

```diagram flow Inside one neuron
- Numbers in | Each number comes from the previous layer | input
- Multiply by weights | Each input has its own weight | process
- Add them up | One total per neuron | process
- Activation function | ReLU or tanh bends the result so patterns can combine | model
- Number out | Passed to the next layer | output
```

```diagram compare Straight-line model and a network on XOR
## Straight-line model | bad
- Cannot learn XOR | One straight rule cannot separate the cases
## Network with one small hidden layer | model
- Can learn XOR | Output is 1 when exactly one of the two inputs is 1
```

```diagram loop One training step
- Predict | Forward pass through the layers | process
- Measure the loss | Compare with the right answer | process
- Backpropagation | Work out how much each weight contributed to the error | model
- Nudge the weights | The optimiser changes every weight a little | output
loop: Repeat for many steps until the loss is small
```

## Real-world example
A manufacturer photographs every product on the line. Hand-written rules for scratches failed because scratches vary in shape and lighting. A neural network trained on a few thousand labelled photos learned to spot them, and now flags parts for a human inspector.

## How it works
1. Choose the layers: input size, hidden layer sizes, output size.
2. Start with small random weights.
3. **Forward pass:** compute the output for a batch of examples.
4. Compute the loss against the right answers.
5. **Backward pass (backpropagation):** compute how each weight should change.
6. Update all weights with an optimiser (such as Adam); repeat for many steps.

```diagram flow The six steps of training
- Choose the layers | Input size, hidden sizes, output size | input
- Random start | Small random weights | process
- Forward pass | Output for a batch of examples | process
- Loss | Compare with the right answers | process
- Backward pass | Backpropagation: how each weight should change | model
- Update weights | Optimiser such as Adam; repeat | output
```

## Python example
A network with 2 inputs, 4 hidden neurons and 1 output, written with NumPy so every step is visible:
```python ai_extras.py nn (excerpt)
h = np.tanh(X @ W1 + b1)                 # hidden layer
p = sig(h @ W2 + b2)                     # output probability
dz2 = (p - y) / len(X)                   # backward pass starts at the output
dW2, db2 = h.T @ dz2, dz2.sum(0)
dh = dz2 @ W2.T * (1 - h ** 2)
dW1, db1 = X.T @ dh, dh.sum(0)
```
```text Output (executed, seed 1)
step    1 loss 0.6712
step  500 loss 0.0052
step 5000 loss 0.0005
predictions: [0.0, 0.999, 0.999, 0.001] targets: [0, 1, 1, 0]
```
With a different random start (`python ai_extras.py nn 0`) the same network got stuck and answered 0.5 for two inputs. Random starting weights matter, which is why real networks use careful initialisation and more neurons. The same model in PyTorch, which does the backward pass for you:
```python PyTorch (requires: pip install torch)
model = torch.nn.Sequential(torch.nn.Linear(2, 8), torch.nn.Tanh(), torch.nn.Linear(8, 1))
optimizer = torch.optim.Adam(model.parameters(), lr=0.05)
for step in range(2000):
    optimizer.zero_grad()
    loss = torch.nn.functional.binary_cross_entropy_with_logits(model(X), y)
    loss.backward()            # backpropagation, done automatically
    optimizer.step()
```

## .NET (C#) example
TorchSharp brings the same library to .NET (package `TorchSharp-cpu`, or the CUDA build for NVIDIA GPUs):
```cs Program.cs
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

torch.random.manual_seed(1);
var x = tensor(new float[] { 0, 0, 0, 1, 1, 0, 1, 1 }).reshape(4, 2);
var y = tensor(new float[] { 0, 1, 1, 0 }).reshape(4, 1);

var model = Sequential(("hidden", Linear(2, 8)), ("tanh", Tanh()), ("out", Linear(8, 1)));
var optimizer = optim.Adam(model.parameters(), lr: 0.05);
var lossFn = BCEWithLogitsLoss();

for (int step = 1; step <= 2000; step++)
{
    optimizer.zero_grad();
    var loss = lossFn.forward(model.forward(x), y);
    loss.backward();                       // backpropagation
    optimizer.step();
    if (step % 500 == 0) Console.WriteLine($"step {step} loss {loss.item<float>():F4}");
}
var probs = sigmoid(model.forward(x)).data<float>().ToArray();
Console.WriteLine(string.Join(", ", probs.Select(p => p.ToString("F3"))));
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Weighted sum and ReLU (what one neuron computes)
**Where it is used:** every neuron in the factory scratch-detector network computes this, then passes the result on.

```formula One neuron with ReLU
z = w1 × x1 + w2 × x2 + b
output = ReLU(z) = the larger of 0 and z
```
x1, x2 are the inputs, w1, w2 are the weights (learned), b is the bias (a learned shift) and z is the raw score.

**In plain words:** the neuron multiplies each input by its weight, adds them up with the bias, then ReLU keeps positive scores and turns negative ones into 0.

**Example 1: neuron stays quiet.** Inputs x1 = 2 (brightness) and x2 = 3 (edge strength), weights 0.5 and -1, bias 1. z = 0.5 × 2 + (-1) × 3 + 1 = 1 - 3 + 1 = -1. ReLU(-1) = 0, so this neuron passes nothing on.

**Example 2: neuron fires.** Inputs x1 = 4 and x2 = 1 with the same weights and bias. z = 0.5 × 4 + (-1) × 1 + 1 = 2 - 1 + 1 = 2. ReLU(2) = 2.

### Sigmoid (turning a score into a probability)
**Where it is used:** the last neuron of a "scratch or no scratch" network turns its score into a number between 0 and 1.

```formula Sigmoid
sigmoid(z) = 1 ÷ (1 + e^(-z))
```
e is about 2.718. A large positive z gives a value near 1; a large negative z gives a value near 0.

**In plain words:** sigmoid squashes any score into the range 0 to 1, so it can be read as a probability.

**Example 1: neutral score.** z = 0 gives e^0 = 1, so sigmoid = 1 ÷ (1 + 1) = 0.5. The network is undecided.

**Example 2: confident score.** z = 2 gives e^(-2) ≈ 0.135, so sigmoid = 1 ÷ 1.135 ≈ 0.881. The network says "88% scratch".

## Maths behind it
- Weighted sums and matrix multiplication (linear algebra)
- Activation functions: ReLU, tanh, sigmoid
- Chain rule and backpropagation (calculus)
- Gradient descent and the Adam optimiser (optimisation)
- Binary cross-entropy loss

## Common mistakes
- Removing the activation function: stacked layers then collapse into one straight-line model.
- Concluding "it doesn't work" after one unlucky random start; try several seeds.
- Using a huge network on a tiny dataset.

```diagram compare Activation function removed or kept
## Without activation functions | bad
- Layers collapse | Stacked layers act like one straight-line model
## With activation functions | output
- Layers bend and combine | The network can learn patterns a straight line cannot
```

## Quick check
Q: What does an activation function add?
A: Non-linearity: the ability to bend and combine patterns, without which many layers act like one straight-line model.

Q: What does backpropagation compute?
A: How much each weight contributed to the error, so every weight can be adjusted in the right direction.

Q: Why can the same network succeed with one seed and fail with another?
A: Training starts from random weights; some starting points lead to poor solutions.
