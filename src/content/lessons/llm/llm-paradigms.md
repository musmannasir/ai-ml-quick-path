---
id: llm-paradigms
title: Learning paradigms beyond plain training
module: llm
level: Advanced
minutes: 75
maths: algebra
goal: Describe in plain words few-shot and in-context learning, multi-task and continual learning, meta-learning, double descent, model merging and quantisation-aware training, and work out a weight merge and a 4-bit quantisation by hand.
prereqs: llm-finetune, ml-generalisation
reviewed: 2026-11-19
evidence: A table of two models and their merge scored on two tasks, and a 4-bit quantisation of five weights with the largest and average error, with a sentence on when each technique is worth using.
code: Python executed 2026-11-19 (examples/paradigms/paradigms.py, NumPy only); only merging and quantisation are run, the other paradigms are described; the C# version prints the same output
---
## In plain words
The usual recipe is: collect labelled examples for one task, train a model, test it. Real systems stretch that recipe in several directions. **Few-shot and in-context learning** show a large language model a handful of examples inside the prompt and it follows the pattern without any change to its weights. **Multi-task learning** trains one model on several tasks at once so they share what they learn. **Continual learning** trains on tasks one after another, and the danger is **catastrophic forgetting**: learning task B overwrites what the model knew about task A. **Meta-learning** trains a model to learn new tasks quickly from few examples. **Double descent** is the observation that, as models grow past the size that fits the training data exactly, test error can fall again after having risen. Two practical techniques change the model after training: **model merging** averages the weights of models fine-tuned from the same start, and **quantisation-aware training** trains a model while pretending its weights are stored with few bits, so it loses less when really quantised.

```diagram compare Learning paradigms at a glance
note: Each one changes what is learned, when, or how many examples are needed.
## Few-shot, in context | output
- Examples are put in the prompt
- No weights change
## Multi-task | process
- One model, several tasks together
- Tasks share what they learn
## Continual | warn
- Tasks arrive one after another
- Old skills can be forgotten
## Meta-learning | model
- Learns how to learn
- Adapts from few examples
```

```diagram flow Catastrophic forgetting and one remedy
note: Replaying a small sample of old data while learning the new task is the simplest remedy.
- Train on task A | The model does well on A | input
- Train only on task B | The weights move to suit B | warn
- Performance on A falls | The old skill was overwritten | bad
- Mix a sample of A into the training on B | Replay keeps both skills | output
```

```diagram compare Squeezing weights into fewer bits
note: Training with the rounding in the loop lets the model adapt before the weights are really rounded.
## Post-training quantisation | process
- Train normally, then round the weights
- Quick, may lose some accuracy
## Quantisation-aware training | model
- Simulate the rounding during training
- Usually loses less accuracy
```

```diagram flow Merging two fine-tuned models
note: Works best when both models start from the same base model and the tasks are compatible.
- Start from one base model | Same weights to begin with | input
- Fine-tune two copies on different tasks | Two sets of weights | process
- Average the weights number by number | One merged set of weights | model
- Test the merge on both tasks | It may keep both skills, or neither well | output
```

## Real-world example
A team has one base language model and two fine-tuned versions, one that writes in the company's tone and one that fills in support forms. They try merging by averaging the weights, to avoid running two models. The merged model keeps the tone well but fills in forms less accurately than the specialist. The team tests it on both tasks and finds that a weighted average (two-thirds tone, one-third forms) works better. For the model that goes on a laptop, they squeeze weights from 16 bits to 4 bits and check accuracy on their own questions. They know that a new fine-tune for a third task could make the model forget the first two, so they keep a small replay set of old examples.

## How it works
1. **In context.** Put a few worked examples in the prompt, then the new case. The model continues the pattern. Nothing is stored for later.
2. **Multi-task and continual.** For several tasks at once, mix their data. For tasks in a sequence, mix in a replay of old data, or add small task-specific adapters, to limit forgetting.
3. **Merging.** Average the weights of two models that came from the same base. A weighted average lets you favour one skill.
4. **Quantisation.** Pick a scale from the largest weight. Divide each weight by the scale, round to a whole number in a small range, and store the whole numbers and the scale. To use them, multiply back.
5. **Quantisation-aware training.** Run the rounding inside the training loop so the weights settle at values that survive it.
6. **Meta-learning and double descent.** Meta-learning methods such as MAML train the starting weights so that a few gradient steps on a new task work well. Double descent reminds you that bigger is not always worse: test error can rise and then fall again as a model gets large enough.

```maths Merging two models by averaging their weights
situation: Two small models are trained from zero on two tasks. Task A asks "is the first number positive?" and task B asks "is the second number positive?". Model A has weights (9, 0) and model B has weights (0, 9). Merge them by averaging each weight.
find: What are the merged weights, and how well does the merge do on each task?
step: First merged weight | (9 + 0) ÷ 2 = 4.5
step: Second merged weight | (0 + 9) ÷ 2 = 4.5
step: Average accuracy of model A over both tasks (1.00 on task A, 0.50 on task B) | (1.00 + 0.50) ÷ 2 = 0.75
result: The merged model has weights (4.5, 4.5) and scores 0.75 on each task. Model A alone scores 1.00 on its own task and a coin-flip 0.50 on the other.
why: The merge gives up some accuracy on each task to cover both, and a single model replaces two. Whether that is worth it depends on how much each task matters.
caution: These two tasks are simple and compatible. For large models, merging may do better or worse, and it must be tested.
try: What would an average weighted two-thirds to model A and one-third to model B give for the first weight?
answer: 9 × 2 ÷ 3 + 0 × 1 ÷ 3 = 6. The merge leans towards task A.
```

```maths Quantising a weight to 4 bits
situation: Five weights: 0.83, -0.41, 0.07, -0.95 and 0.30. With 4 bits and a sign we use whole numbers from -7 to 7. The scale is the largest weight in size divided by 7.
find: What is the scale, and what happens to the weight 0.07?
step: The scale | 0.95 ÷ 7 ≈ 0.1357
step: Weight 0.07 divided by the scale | 0.07 ÷ 0.1357 ≈ 0.516
step: Round to the nearest whole number, which is 1, and multiply back | 1 × 0.1357 = 0.1357
step: The error for this weight | 0.1357 - 0.07 = 0.0657
result: The weight 0.07 is stored as the whole number 1 and restored as about 0.136, an error of about 0.066.
why: Storing a small whole number and one shared scale uses far less memory than storing each weight in full. Going from 32 bits to 4 bits makes the weights 8 times smaller: 32 ÷ 4 = 8.
try: How is the weight -0.41 stored?
answer: -0.41 ÷ 0.1357 ≈ -3.02, which rounds to -3, and -3 × 0.1357 = -0.407, an error of only 0.003.
```

```maths How much old skill was forgotten
situation: A model scored 95% on task A. After training only on task B it scores 60% on task A. (Made-up numbers for teaching.) Replay adds 100 old examples to every 1000 new ones.
find: How big is the loss of skill, and what share of the training mix is old data?
step: Points of accuracy lost on task A | 95 - 60 = 35
step: Share of the mix that is old data | 100 ÷ (1000 + 100) ≈ 0.091
result: The model lost 35 points on task A. A replay mix of about 9% old data is a common cheap remedy.
why: Forgetting is not obvious unless you keep testing the old tasks after every new training run.
```

## Python example
Two toy models, each trained on one of two tasks, are merged by averaging weights, and five weights are quantised to 4 bits. No large model or framework is involved. The few-shot, multi-task, continual and meta-learning paradigms are described here but not run.

```python paradigms.py
"""Two ideas from beyond plain supervised learning, in numbers: merging two models by averaging their weights,
and quantising weights to 4 bits.

Run:  python paradigms.py   (needs numpy)
"""
import numpy as np

g = (np.arange(10) + 0.5) / 5 - 1.0                            # -0.9, -0.7, ... 0.9
X = np.array([(a, b + 0.013) for a in g for b in g])           # 100 points on a grid (the small offset keeps points off the decision boundary)
task_a = (X[:, 0] > 0).astype(float)                           # task A: is the first number positive?
task_b = (X[:, 1] > 0).astype(float)                           # task B: is the second number positive?

def train(y, steps=300, lr=1.0):                               # logistic regression by gradient descent: weights and a bias
    w = np.zeros(3)
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(X @ w[:2] + w[2])))
        w = w - lr * np.append(X.T @ (p - y) / len(y), np.mean(p - y))
    return w

def accuracy(w, y):
    return float(np.mean(((X @ w[:2] + w[2]) > 0) == (y == 1)))

wa, wb = train(task_a), train(task_b)
merged = (wa + wb) / 2                                         # model merging: average the two weight vectors
z = lambda w: [round(float(v), 2) + 0.0 for v in w]                   # avoids printing -0.00
print("weights: model A [%.2f %.2f %.2f]  model B [%.2f %.2f %.2f]" % (*z(wa), *z(wb)))
print("                 task A  task B")
for name, w in (("model A", wa), ("model B", wb), ("merged (average)", merged)):
    print("%-16s %6.2f  %6.2f" % (name, accuracy(w, task_a), accuracy(w, task_b)))

weights = np.array([0.83, -0.41, 0.07, -0.95, 0.30])           # quantise to 4 bits: 15 levels from -7 to 7 times a scale
scale = np.abs(weights).max() / 7
q = np.round(weights / scale).astype(int)
back = q * scale
print("scale %.4f, integers %s" % (scale, q.tolist()))
print("restored weights %s" % [round(float(v), 3) for v in back])
print("largest error %.4f, average error %.4f" % (np.abs(weights - back).max(), np.abs(weights - back).mean()))
```
```text Output of paradigms.py (executed)
weights: model A [9.00 0.00 0.00]  model B [0.00 9.00 -0.11]
                 task A  task B
model A            1.00    0.50
model B            0.50    1.00
merged (average)   0.75    0.75
scale 0.1357, integers [6, -3, 1, -7, 2]
restored weights [0.814, -0.407, 0.136, -0.95, 0.271]
largest error 0.0657, average error 0.0226
```
Model A scores 1.00 on task A and 0.50 on task B, and model B the reverse. The merged model scores 0.75 on both. The 4-bit scale is 0.1357 and the integers are 6, -3, 1, -7 and 2. The restored weights are close to the originals, with a largest error of 0.0657 and an average error of 0.0226.

## .NET (C#) example
Merging and 4-bit quantisation written from scratch in C#, with no packages, printing the same output. Real quantisation of large models is done by tools in Python, and the quantised file is run from .NET through ONNX Runtime or a local model server.

```cs Program.cs
// Merging two models by averaging weights, and quantising weights to 4 bits, from scratch.
// Same output as paradigms.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

var X = new List<double[]>();
for (int i = 0; i < 10; i++) for (int j = 0; j < 10; j++) X.Add(new[] { (i + 0.5) / 5 - 1.0, (j + 0.5) / 5 - 1.0 + 0.013 });   // 100 points on a grid (the small offset keeps points off the decision boundary)
int n = X.Count;
int[] taskA = X.Select(p => p[0] > 0 ? 1 : 0).ToArray();                                                              // task A: is the first number positive?
int[] taskB = X.Select(p => p[1] > 0 ? 1 : 0).ToArray();                                                              // task B: is the second number positive?

double[] Train(int[] y, int steps = 300, double lr = 1.0)                                                              // logistic regression by gradient descent
{
    var w = new double[3];
    for (int s = 0; s < steps; s++)
    {
        var g = new double[3];
        for (int k = 0; k < n; k++)
        {
            double p = 1 / (1 + Math.Exp(-(X[k][0] * w[0] + X[k][1] * w[1] + w[2])));
            g[0] += X[k][0] * (p - y[k]) / n; g[1] += X[k][1] * (p - y[k]) / n; g[2] += (p - y[k]) / n;
        }
        for (int d = 0; d < 3; d++) w[d] -= lr * g[d];
    }
    return w;
}
double Accuracy(double[] w, int[] y) => Enumerable.Range(0, n).Average(k => ((X[k][0] * w[0] + X[k][1] * w[1] + w[2] > 0) == (y[k] == 1)) ? 1.0 : 0.0);

var wa = Train(taskA); var wb = Train(taskB);
var merged = wa.Zip(wb, (a, b) => (a + b) / 2).ToArray();                                                              // model merging: average the two weight vectors
string Z(double[] w) => string.Join(" ", w.Select(v => (Math.Round(v, 2) + 0.0).ToString("F2")));                      // avoids printing -0.00
Console.WriteLine($"weights: model A [{Z(wa)}]  model B [{Z(wb)}]");
Console.WriteLine("                 task A  task B");
foreach (var (name, w) in new[] { ("model A", wa), ("model B", wb), ("merged (average)", merged) })
    Console.WriteLine($"{name,-16} {Accuracy(w, taskA),6:F2}  {Accuracy(w, taskB),6:F2}");

double[] weights = { 0.83, -0.41, 0.07, -0.95, 0.30 };                                                                  // quantise to 4 bits: 15 levels from -7 to 7 times a scale
double scale = weights.Max(Math.Abs) / 7;
int[] q = weights.Select(v => (int)Math.Round(v / scale, MidpointRounding.ToEven)).ToArray();
double[] back = q.Select(v => v * scale).ToArray();
Console.WriteLine($"scale {scale:F4}, integers [{string.Join(", ", q)}]");
Console.WriteLine("restored weights [" + string.Join(", ", back.Select(v => Math.Round(v, 3).ToString("0.0##"))) + "]");
var err = weights.Zip(back, (a, b) => Math.Abs(a - b)).ToArray();
Console.WriteLine($"largest error {err.Max():F4}, average error {err.Average():F4}");
```

## Maths behind it
- Averages of weights (arithmetic)
- Rounding to a grid with a scale (arithmetic)
- Percentage change and shares (arithmetic)
- Test error against model size (statistics)

## Common mistakes
- Merging models that did not start from the same base model.
- Trusting a merged or quantised model without testing it on the real tasks.
- Fine-tuning on a new task and never re-testing the old ones.
- Treating in-context examples as training. They help only within that prompt.
- Assuming a bigger model will always overfit more.

## Quick check
Q: What is catastrophic forgetting?
A: A model trained on a new task loses what it had learned about an earlier one, because its weights moved to suit the new task.

Q: Why does merging work best with models from the same base?
A: Their weights start from the same place, so averaging them stays in a region where the model still works.

Q: How much smaller are weights stored with 4 bits instead of 32?
A: Eight times smaller, because 32 ÷ 4 = 8.

Q: What does in-context learning change in the model?
A: Nothing. The examples in the prompt guide the answer for that prompt only.
