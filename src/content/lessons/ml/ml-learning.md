---
id: ml-learning
title: How a model learns: loss, training and overfitting
module: ml
level: Beginner
minutes: 75
maths: algebra
goal: Explain what a model, parameters and a loss are, how training reduces the loss step by step, and how to spot overfitting and underfitting.
prereqs: d-basics
reviewed: 2026-11-02
evidence: Your own run of the training loop with a printed loss that falls, and a train-versus-validation comparison that shows overfitting.
code: Python executed 2026-11-02 (examples/ml-basics/ml_basics.py gd and cv)
---
## In plain words
A **model** is a formula with adjustable knobs called **parameters** (or **weights**). At the start the knobs are random, so predictions are bad. The **loss** is one number that says how wrong the predictions are on the training examples. **Training** repeats a simple loop: make predictions, measure the loss, turn every knob a little in the direction that lowers the loss, and repeat. The method that finds that direction is called **gradient descent**; the size of each turn is the **learning rate**. Too big and training jumps around; too small and it crawls. A model that learns the training data too exactly, including its noise, is **overfitting**: great on training data, worse on new data. A model too simple to capture the pattern is **underfitting**. The goal is the middle: good on data it has never seen. Settings you choose before training, such as the learning rate or tree depth, are called **hyperparameters**.

```diagram flow What a model, parameters and loss are
note: The knobs (parameters) are what training changes. The loss is the single score of how wrong the answers are.
- Example inputs | The training examples | input
- Model with knobs | Adjustable parameters (weights) | model
- Predictions | The model's current answers | output
- Loss | One number: how wrong the predictions are | warn
```

```diagram loop The training loop
- Predict | Run the examples through the model | process
- Measure the loss | How wrong were the answers? | warn
- Find the direction | Which way should each knob turn to lower the loss (gradient descent)? | process
- Turn the knobs a little | The step size is the learning rate | model
loop: Repeat until the loss stops improving
```

```diagram compare Learning rate: the size of each turn
## Too big | bad
- The loss jumps around or grows
- Training never settles
## Just right | output
- The loss falls steadily
- Training settles on good knobs
## Too small | warn
- The loss falls very slowly
- Training crawls
```

```diagram compare Underfitting, a good fit and overfitting
note: The goal is the middle column: good on data the model has never seen.
## Underfitting | warn
- Model too simple for the pattern
- Weak on training data and on new data
## Good fit | output
- Captures the real pattern
- Good on new data
## Overfitting | bad
- Memorises the training data and its noise
- Great on training data, worse on new data
```

```diagram compare Parameters and hyperparameters
## Parameters | model
- The knobs inside the model
- Learned during training
- Example: weights
## Hyperparameters | input
- Settings you choose before training
- Not learned by the model
- Examples: learning rate, tree depth
```

## Real-world example
A delivery company predicts delivery time. An early model memorised every past route and scored almost perfectly on old trips, but was 20 minutes off on new addresses. A simpler model with sensible features was slightly worse on old trips but much better on new ones, so that one went live.

```diagram compare Two delivery-time models
note: Same story as the paragraph above: the simpler model went live because it did better on new addresses.
## Memorising model | bad
- Almost perfect on old trips
- About 20 minutes off on new addresses
## Simpler model, sensible features | output
- Slightly worse on old trips
- Much better on new addresses, so it went live
```

## How it works
1. Start with random parameters.
2. Predict on a batch of training examples.
3. Compute the loss (how wrong).
4. Compute which way each parameter should move to reduce the loss.
5. Move every parameter a small step that way.
6. Repeat until the loss stops improving; check validation data to catch overfitting.

```diagram lanes Training data and validation data
note: Training data changes the knobs. Validation data only checks, so it reveals overfitting.
## Training data
- Predict | Used to change the knobs | process
- Loss falls | Training score looks good | output
## Validation data
- Predict | Never used to change the knobs | process
- Compare scores | A big gap to the training score means overfitting | warn
```

```maths One step of gradient descent on a toy loss
situation: A model has one adjustable number, a weight called w. For this toy example the loss (how wrong the model is) is (w − 3)². The loss is 0 when w is 3, but the model does not know that. It starts at w = 1.
find: After one training step with learning rate 0.1, what is the new w, and did the loss go down?
step: Loss at the start | (1 − 3)^2 = 4
step: Slope of the loss at w = 1 (for this loss the slope is 2 × (w − 3)) | 2 × (1 − 3) = −4
step: Move against the slope, a small step | 1 − 0.1 × (−4) = 1.4
step: Loss after the step | (1.4 − 3)^2 = 2.56
result: w moved from 1 to **1.4**, and the loss fell from 4 to **2.56**.
formula: new weight = old weight − learning rate × slope
means: The slope says which way is uphill. Subtracting it moves downhill. The learning rate decides how big the step is.
why: This is training. A real model repeats this small step thousands of times for millions of weights at once. The slope for all weights together is called the gradient, which gives the method its name: gradient descent.
caution: This is one step on a made-up loss with one weight. Real losses are bumpy, and real optimisers add extra tricks, so real training does not behave this neatly.
widget: gradient 1,0.1
try: Use a learning rate of 1 instead of 0.1. What is the new w and the new loss?
answer: New w = 1 − 1 × (−4) = 5. New loss = (5 − 3)² = 4. The step jumped right over the best value 3 and landed just as far away on the other side, so the loss did not improve at all. A learning rate that is too large makes training bounce or even get worse.
deeper: The slope 2 × (w − 3) is the derivative of (w − 3)² with respect to w. With many weights, the derivative for each weight is collected into a vector called the gradient. Backpropagation is the method that computes this gradient efficiently for a neural network using the chain rule.
```

## Live simulation
Learning is a search for numbers that make the loss small. Gradient descent does the search with one simple rule, and you can watch it work.

```sim gd Gradient descent: a ball rolling down a curve
question: How does a model learn by moving a number downhill, and what does the learning rate change?
watch: The ball is the model's one number, x. The curve is the loss: lower is better. Each dot is one step.
watch: Each step moves x by the learning rate times the slope. Where the curve is flat, steps become small.
watch: Try very small and very large learning rates, and try the two-valley curve from different starting points.
try: fast | On the bowl, get the loss below 0.01 in 15 steps or fewer.
try: blow | Raise the learning rate until the loss grows instead of shrinking.
try: local | On the two-valley curve, find a starting point from which the ball settles in the shallower valley.
predict: The bowl's lowest point is x = 3. With learning rate 1.0, starting at 0, where does the ball go? | It settles at 3 | It bounces between 0 and 6 forever | It blows up
answer: 2 | Each step is 1.0 times the slope. From 0 the slope is -6, so x jumps to 6. From 6 the slope is +6, so x jumps back to 0, and so on. A slightly smaller rate settles, a slightly larger one blows up.
leaves-out: One number to learn, where a real model learns millions at once. The curves are made-up examples, and real loss surfaces cannot be drawn like this. Momentum and Adam are in the training lesson.
reference: examples/sim-training/dynamics.py
```

## Python example
Fitting a straight line `y = w·x + b` to data that roughly follows `y = 2x + 1`:
```python ml_basics.py gd (excerpt)
err = (w * x + b) - y                        # how wrong each prediction is
loss = (err ** 2).mean()                     # one number: mean squared error
dw, db = 2 * (err * x).mean(), 2 * err.mean()   # which way to turn each knob
w, b = w - lr * dw, b - lr * db              # small step downhill
```
```text Output (executed, learning rate 0.02)
step    1: loss=57.2220 w=1.002 b=0.281
step   10: loss=0.0565 w=2.106 b=0.616
step  100: loss=0.0316 w=2.055 b=0.815
step 2000: loss=0.0214 w=1.990 b=1.050
```
The loss falls fast and the knobs settle near 2 and 1. Overfitting in action, comparing a simple model with a deep decision tree on 300 synthetic examples:
```text Output of ml_basics.py cv (executed)
logistic regression  train=0.86 cv mean=0.83 (+/- 0.02)
deep decision tree   train=1.00 cv mean=0.80 (+/- 0.06)
```
The tree is perfect on training data (1.00) but worse on unseen data (0.80): it memorised.

## .NET (C#) example
The same training loop in plain C#, no libraries, so you can see every step:
```cs Program.cs
double[] x = { 1, 2, 3, 4, 5 };
double[] y = { 3.1, 4.9, 7.2, 8.8, 11.1 };
double w = 0, b = 0, lr = 0.02;

for (int step = 1; step <= 2000; step++)
{
    double dw = 0, db = 0, loss = 0;
    for (int i = 0; i < x.Length; i++)
    {
        double err = (w * x[i] + b) - y[i];
        loss += err * err / x.Length;
        dw += 2 * err * x[i] / x.Length;
        db += 2 * err / x.Length;
    }
    w -= lr * dw;
    b -= lr * db;
    if (step is 1 or 10 or 100 or 2000) Console.WriteLine($"step {step,4}: loss={loss:F4} w={w:F3} b={b:F3}");
}
```
It uses the same data and settings as the Python version. In real projects ML.NET, TorchSharp or PyTorch run this loop for you.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Loss as mean squared error (one number for "how wrong")
**Where it is used:** the loss line in the gradient descent example.

```formula Mean squared error (MSE)
loss = (sum of (prediction - actual)^2) ÷ n
```
**In plain words:** find each mistake, square it so it is positive, and average. Lower is better.

**Example 1: a poor line.** Data: x = 1, 2, 3 and actual y = 3, 5, 7. The line "prediction = 1 × x + 0" gives 1, 2, 3. Mistakes: −2, −3, −4. Squares: 4, 9, 16. Loss = 29 ÷ 3 = 9.67.

**Example 2: a perfect line.** The line "prediction = 2 × x + 1" gives 3, 5, 7, so every mistake is 0 and loss = 0 ÷ 3 = 0.

### One gradient descent step (turning the knobs downhill)
**Where it is used:** the update lines w = w − lr × dw and b = b − lr × db.

```formula Gradient descent update
error = prediction - actual
dw = 2 × average of (error × x)
db = 2 × average of error
new w = w - learning rate × dw
new b = b - learning rate × db
```
**In plain words:** dw and db say which way the loss rises. Each knob moves the opposite way by a small step set by the learning rate.

**Example 1: a small learning rate.** Start with w = 1, b = 0 on the data above (errors −2, −3, −4). dw = 2 × (−2×1 − 3×2 − 4×3) ÷ 3 = 2 × (−20 ÷ 3) = −13.33. db = 2 × (−2 − 3 − 4) ÷ 3 = −6. With learning rate 0.02: new w = 1 − 0.02 × (−13.33) = 1.267 and new b = 0 − 0.02 × (−6) = 0.12. The loss falls from 9.67 to 5.87.

**Example 2: too big a learning rate.** With learning rate 0.2: new w = 1 + 0.2 × 13.33 = 3.667 and new b = 0 + 0.2 × 6 = 1.2. The step jumped past the best values (w = 2, b = 1), and the loss rises to 14.34. Too big a step makes training jump around.

### The train-test gap (spotting overfitting)
**Where it is used:** comparing the logistic regression with the deep decision tree.

```formula Overfitting gap
gap = training score - cross-validation (unseen data) score
```
**In plain words:** a big gap means the model memorised the training data.

**Example 1: a healthy model.** Logistic regression: train 0.86, cv mean 0.83. Gap = 0.86 − 0.83 = 0.03, which is small.

**Example 2: an overfitting model.** Deep tree: train 1.00, cv mean 0.80. Gap = 1.00 − 0.80 = 0.20. It is perfect on what it has seen and worse than the simple model on new data.

**Example 3: underfitting.** A model with train 0.60 and cv 0.59 has a gap of only 0.01, but both scores are low: the model is too simple. A small gap alone is not enough; look at the scores too.

## Maths behind it
- Loss functions: mean squared error, cross-entropy
- Derivatives and gradients (calculus)
- Gradient descent (optimisation)
- Bias–variance trade-off (statistics)

## Common mistakes
- Judging a model by its training score.
- A learning rate so high that the loss grows instead of shrinking.
- Making the model bigger to fix overfitting; usually you need more data, simpler models or regularisation.

## Quick check
Q: What is the loss?
A: One number that measures how wrong the model's predictions are on the examples; training tries to make it smaller.

Q: Training score 1.00, validation score 0.80. What is happening?
A: Overfitting: the model memorised the training data instead of learning the general pattern.

Q: What is the difference between a parameter and a hyperparameter?
A: Parameters are learned during training (weights); hyperparameters are chosen by you before training (learning rate, tree depth).
