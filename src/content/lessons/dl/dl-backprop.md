---
id: dl-backprop
title: Backpropagation and automatic differentiation
module: dl
level: Intermediate
minutes: 75
maths: algebra
goal: Follow the chain rule through a small calculation by hand, see how automatic differentiation does the same thing for any model, and recognise why gradients can vanish in deep stacks of layers.
prereqs: dl-neural-nets
reviewed: 2026-11-18
evidence: A hand-worked gradient for a one-neuron model that matches a program's gradient and a tiny numerical check, plus a sentence on why sigmoid stacks lose gradient.
code: Python executed 2026-11-18 (examples/backprop/autograd.py, standard library only); PyTorch was not run for this lesson; the C# version prints the same numbers
---
## In plain words
Training a network means asking, for every weight: if I nudge this weight up a little, does the loss go up or down, and by how much? That answer is the **gradient**. A network may have millions of weights, so we need a fast way to get all of them at once. **Backpropagation** is that way. First run the network forward and record every step. Then walk backwards from the loss, and at each step use the **chain rule**: how much the output changes with this step, times how much this step changes with the one before. **Automatic differentiation** (autograd) is the same idea built into libraries such as PyTorch, so you never write the gradients yourself. A loss that must pass its signal back through many layers can fade to almost nothing. That is the **vanishing gradient** problem, and it explains why activation choice and skip connections matter.

```diagram flow Forward pass, then backward pass
note: The forward pass records. The backward pass uses the record to hand out blame.
- Forward: compute each step and remember it | From inputs to the loss | input
- Backward: start with gradient one at the loss | One unit of blame | process
- Multiply by each step's slope going back | The chain rule | model
- Read the gradient at every weight | Used to update the weights | output
```

```diagram compare Three ways to get a gradient
note: Use the numerical check to test the other two. Never use it to train.
## By hand | process
- Write the chain rule yourself
- Good for learning, error-prone for big models
## Numerical nudge | warn
- Change a weight a tiny amount and watch the loss
- Slow: one run per weight
## Automatic differentiation | output
- Library records steps, applies the chain rule
- Fast and exact, used for training
```

```diagram flow Why gradients vanish
note: Each sigmoid layer passes on at most a quarter of the gradient.
- The loss sends back a gradient | Strength one at the end | input
- Each sigmoid layer scales it by under a quarter | The signal shrinks | warn
- After many layers almost nothing is left | Early layers barely learn | bad
```

## Real-world example
An engineer builds a deep network for a language task and finds that its first layers never improve, while the last layers learn quickly. She prints the size of the gradient at each layer, and it shrinks by a large factor at every step backwards. The cause is a stack of sigmoid layers. Switching to ReLU layers with skip connections, which pass the gradient along without shrinking it, fixes the problem. Her check was a printout of gradient sizes, and the explanation is the chain rule.

## How it works
1. **Forward pass.** Compute the output of every step and keep the values.
2. **Local slopes.** Each step knows its own slope: how its output changes if one input changes. For a sum the slope is 1. For a product it is the other factor. For a sigmoid it is the output times one minus the output.
3. **Backward pass.** Start at the loss with a gradient of 1. Going back through each step, multiply the gradient so far by that step's slope. Where several paths meet, add their gradients.
4. **Update.** Use each weight's gradient to move it a small step downhill.

```maths The chain rule on a one-neuron model
situation: One neuron: z = w × x + b, then s = sigmoid(z), then loss = (s - y) squared. The input is x = 2 and the target is y = 1. The weight is w = 0.5 and the bias is b = -0.3. Made-up numbers.
find: How does the loss change if we nudge w, and if we nudge b?
step: Forward: the weighted sum | 0.5 × 2 + (-0.3) = 0.7
step: Forward: the sigmoid of 0.7 | 1 ÷ (1 + exp(-0.7)) ≈ 0.6682
step: Forward: the error | 0.6682 - 1 = -0.3318
step: Forward: the loss | (-0.3318)^2 ≈ 0.1101
step: Backward: slope of the loss with respect to the error | 2 × (-0.3318) = -0.6636
step: Backward: slope of the sigmoid (output times one minus output) | 0.6682 × (1 - 0.6682) ≈ 0.2217
step: Chain rule for w (the slope of z with respect to w is x = 2) | -0.6636 × 0.2217 × 2 ≈ -0.2943
step: Chain rule for b (the slope of z with respect to b is 1) | -0.6636 × 0.2217 × 1 ≈ -0.1471
result: The gradients are about -0.294 for w and -0.147 for b. Both are negative, so making w or b larger lowers the loss.
formula: d loss / d w = (d loss / d error) × (d error / d z) × (d z / d w)
means: Each factor is the slope of one step. Multiplying them gives the slope of the whole chain.
why: This is exactly what every training library does for every weight. Backpropagation is this multiplication, organised so that shared steps are computed once.
try: Which weight changes the loss more, w or b, and why?
answer: w. Its last factor is x = 2, while b's last factor is 1, so a nudge to w is multiplied by the input.
```

```maths Checking a gradient with a nudge
situation: A simple function f(w) = w squared, at w = 3. We know its slope is 2 × w = 6. We check it by nudging w up and down by 0.001, the way you would check an autograd result.
find: Does the numerical check agree with the formula?
step: f at w = 3.001 | 3.001^2 = 9.006001
step: f at w = 2.999 | 2.999^2 = 8.994001
step: Change over the width of the nudge | (9.006001 - 8.994001) ÷ (2 × 0.001) = 6
result: The numerical slope is 6, the same as the formula.
why: When you write a new layer or a custom loss, comparing its gradient with this nudge test is the quickest way to find a bug.
caution: Use it only for checking. It needs two extra runs per weight, which is far too slow for training.
try: What is the numerical slope of f(w) = w squared at w = 5, using a nudge of 0.001?
answer: 5.001^2 = 25.010001 and 4.999^2 = 24.990001. The difference is 0.02 and 0.02 ÷ 0.002 = 10, which equals 2 × 5.
```

## Python example
A tiny autograd engine in about 30 lines. Each number remembers how it was made, and `backward()` applies the chain rule. It computes the same gradients as the hand calculation, checks one by a nudge, and then shows how the gradient fades through stacks of sigmoid layers. It needs no libraries. PyTorch was not installed for this lesson, so the PyTorch equivalent (`loss.backward()`) is described, not run.

```python autograd.py
"""A tiny automatic-differentiation engine (about 30 lines) and a vanishing-gradient demonstration.

Each Value remembers how it was made, so calling backward() can walk back through the calculation and
apply the chain rule. No libraries are needed.
Run:  python autograd.py
"""
import math

class Value:
    def __init__(self, data, parents=(), local=()):
        self.data, self.grad = data, 0.0
        self.parents, self.local = parents, local        # local[i] = d(this) / d(parents[i])
    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        return Value(self.data + o.data, (self, o), (1.0, 1.0))
    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        return Value(self.data * o.data, (self, o), (o.data, self.data))
    def __sub__(self, o):
        return self + (o * -1.0 if isinstance(o, Value) else Value(-o))
    def sigmoid(self):
        s = 1 / (1 + math.exp(-self.data))
        return Value(s, (self,), (s * (1 - s),))
    def backward(self):
        order, seen = [], set()
        def visit(v):                                    # parents before children
            if id(v) not in seen:
                seen.add(id(v))
                for p in v.parents:
                    visit(p)
                order.append(v)
        visit(self)
        self.grad = 1.0
        for v in reversed(order):                        # the chain rule, one step at a time
            for p, d in zip(v.parents, v.local):
                p.grad += d * v.grad

def loss_of(w, b):
    x, y = 2.0, 1.0
    err = (w * x + b).sigmoid() - y
    return err * err

w, b = Value(0.5), Value(-0.3)
loss = loss_of(w, b)
loss.backward()
print("loss %.4f  d loss / d w = %.4f  d loss / d b = %.4f" % (loss.data, w.grad, b.grad))
h = 1e-6                                                 # check against a tiny nudge of w
numeric = (loss_of(Value(0.5 + h), Value(-0.3)).data - loss_of(Value(0.5 - h), Value(-0.3)).data) / (2 * h)
print("numerical check of d loss / d w: %.4f" % numeric)

print("layers  gradient reaching the first layer (sigmoid layers, weight 1)  (ReLU layers, weight 1)")
for n in (1, 5, 10, 20):
    g_sig, z = 1.0, 0.5
    for _ in range(n):
        s = 1 / (1 + math.exp(-z))
        g_sig *= s * (1 - s)                             # each sigmoid layer multiplies the gradient by at most 0.25
        z = s
    print("%6d  %57.2e  %22.1f" % (n, g_sig, 1.0))
```
```text Output of autograd.py (executed)
loss 0.1101  d loss / d w = -0.2943  d loss / d b = -0.1471
numerical check of d loss / d w: -0.2943
layers  gradient reaching the first layer (sigmoid layers, weight 1)  (ReLU layers, weight 1)
     1                                                   2.35e-01                     1.0
     5                                                   6.08e-04                     1.0
    10                                                   3.48e-07                     1.0
    20                                                   1.14e-13                     1.0
```
The loss is 0.1101 and the gradients are -0.2943 and -0.1471, matching the hand calculation. The numerical check gives -0.2943 as well. In the last table, a gradient of strength 1 reaching one sigmoid layer shrinks to 0.235. After 5 layers it is 0.000608, after 10 it is 0.000000348, and after 20 it is about 0.000000000000114. With ReLU layers and weight 1 it stays at 1.0.

```maths Why a stack of sigmoids vanishes
situation: The slope of a sigmoid is never more than 0.25. Suppose each sigmoid layer passes on its best case, 0.25, and the gradient starts at 1.
find: How much gradient is left after 4 and after 10 layers?
step: After 4 layers | 0.25 × 0.25 × 0.25 × 0.25 = 0.00390625
step: After 10 layers | 0.25^10 ≈ 0.00000095
step: ReLU layers pass the gradient on at slope 1 when they are active | 1 × 1 × 1 × 1 = 1
result: After 10 sigmoid layers about one millionth of the gradient is left, even in the best case. ReLU layers keep all of it.
why: Early layers get almost no learning signal, so they barely change. This is the main reason that deep networks moved from sigmoid to ReLU, and why residual (skip) connections help.
caution: The opposite problem also exists: if each step multiplies by more than 1, the gradient explodes. Gradient clipping is the usual guard.
try: A layer passes on 0.9 of the gradient. How much is left after 10 such layers?
answer: 0.9^10 ≈ 0.349. Even a mild loss of 10% per layer leaves about a third after 10 layers, and far less after 50.
```

A last remark on what networks can represent. The **universal approximation** result says that a network with one hidden layer and enough neurons can imitate any reasonable function to any accuracy. It tells you the model class is rich enough, not that training will find the right weights or that the network will be small.

## .NET (C#) example
TorchSharp offers autograd in C# in the same way PyTorch does, but it needs a native library. To show the idea without it, this version builds the same tiny engine from scratch in C#. It needs no packages and prints the same numbers as the Python run.

```cs Program.cs
// A tiny automatic-differentiation engine in C#. Same numbers as autograd.py. No packages.
using System.Globalization;
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

Value LossOf(Value w, Value b)
{
    double x = 2.0, y = 1.0;
    Value err = (w * x + b).Sigmoid() - y;
    return err * err;
}

var w = new Value(0.5); var b = new Value(-0.3);
Value loss = LossOf(w, b);
loss.Backward();
Console.WriteLine($"loss {loss.Data:F4}  d loss / d w = {w.Grad:F4}  d loss / d b = {b.Grad:F4}");
double h = 1e-6;                                                  // check against a tiny nudge of w
double numeric = (LossOf(new Value(0.5 + h), new Value(-0.3)).Data - LossOf(new Value(0.5 - h), new Value(-0.3)).Data) / (2 * h);
Console.WriteLine($"numerical check of d loss / d w: {numeric:F4}");

Console.WriteLine("layers  gradient reaching the first layer (sigmoid layers, weight 1)  (ReLU layers, weight 1)");
foreach (int n in new[] { 1, 5, 10, 20 })
{
    double gSig = 1.0, z = 0.5;
    for (int i = 0; i < n; i++)
    {
        double s = 1 / (1 + Math.Exp(-z));
        gSig *= s * (1 - s);                                      // each sigmoid layer multiplies the gradient by at most 0.25
        z = s;
    }
    Console.WriteLine($"{n,6}  {gSig.ToString("0.00e+00").PadLeft(57)}  {1.0.ToString("F1").PadLeft(22)}");
}

class Value
{
    public double Data, Grad;
    readonly Value[] parents; readonly double[] local;             // local[i] = d(this) / d(parents[i])
    public Value(double data, Value[]? parents = null, double[]? local = null)
    { Data = data; this.parents = parents ?? Array.Empty<Value>(); this.local = local ?? Array.Empty<double>(); }
    public static Value operator +(Value a, Value b) => new(a.Data + b.Data, new[] { a, b }, new[] { 1.0, 1.0 });
    public static Value operator *(Value a, Value b) => new(a.Data * b.Data, new[] { a, b }, new[] { b.Data, a.Data });
    public static Value operator +(Value a, double b) => a + new Value(b);
    public static Value operator *(Value a, double b) => a * new Value(b);
    public static Value operator -(Value a, double b) => a + new Value(-b);
    public Value Sigmoid() { double s = 1 / (1 + Math.Exp(-Data)); return new Value(s, new[] { this }, new[] { s * (1 - s) }); }
    public void Backward()
    {
        var order = new List<Value>(); var seen = new HashSet<Value>();
        void Visit(Value v)                                       // parents before children
        {
            if (!seen.Add(v)) return;
            foreach (var p in v.parents) Visit(p);
            order.Add(v);
        }
        Visit(this);
        Grad = 1.0;
        for (int i = order.Count - 1; i >= 0; i--)                // the chain rule, one step at a time
            for (int k = 0; k < order[i].parents.Length; k++)
                order[i].parents[k].Grad += order[i].local[k] * order[i].Grad;
    }
}
```

## Maths behind it
- The chain rule (calculus)
- Derivative of a sum, a product and the sigmoid (calculus)
- The numerical derivative as a difference quotient (calculus)
- Repeated multiplication of numbers below 1 (arithmetic)

## Common mistakes
- Forgetting that a weight used in two places gets the sum of two gradients.
- Training with a numerical gradient. It is only for checking.
- Using many sigmoid or tanh layers in a deep network and wondering why early layers do not learn.
- Not checking a custom layer's gradient against a nudge test.
- Reading "universal approximation" as a promise that a small network will train well.

## Quick check
Q: In one sentence, what does backpropagation compute?
A: The gradient of the loss with respect to every weight, by running the chain rule backwards through the steps recorded in the forward pass.

Q: Why is the numerical nudge test used only for checking?
A: It needs extra runs for each weight, so it is far too slow for training, but it is a reliable way to catch bugs in a hand-written gradient.

Q: A network of 20 sigmoid layers trains very slowly in its early layers. What is the likely cause, and what can you try?
A: Vanishing gradients: each sigmoid passes on at most a quarter of the gradient. Use ReLU-type activations, skip connections or normalisation layers.

Q: A weight is used in two places in the network. How is its gradient found?
A: Work out the gradient along each path and add them together.
