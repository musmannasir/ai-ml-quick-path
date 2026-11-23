---
id: ml-model-compare
title: Comparing models and trusting probabilities
module: ml
level: Intermediate
minutes: 75
maths: algebra
goal: Compare two models fairly on the same cases, use log loss and the Brier score to judge the probabilities they give, and check with a calibration table whether "80%" really means about 8 in 10.
prereqs: ml-classification, ml-evaluation
reviewed: 2026-11-18
evidence: A comparison of two models on one dataset with accuracy, log loss, a paired difference with its standard error, and a calibration table, plus a sentence saying which model you would use and whether the gap could be chance.
code: Python executed 2026-11-18 (examples/model-compare/model_compare.py); the C# version prints the same numbers
---
## In plain words
Accuracy only asks whether a model landed on the right side of 50%. Two models can have the same accuracy and still be very different, because one says "55%" when it is unsure and the other says "99%" and is sometimes wrong. If people will act on the percentage (call a customer, hold a payment), the percentage itself must be trustworthy. **Log loss** and the **Brier score** judge the probabilities, not just the yes or no. A **calibration table** checks the promise: among all the cases where the model said about 80%, did about 80% really happen? Finally, when two scores differ, you must ask whether the gap is real or just luck. You do that by comparing the models case by case on the same cases, which is called a **paired comparison**.

```diagram compare Same accuracy, different trust
note: Accuracy cannot tell these two apart. Log loss and calibration can.
## Honest probabilities | output
- Says about 70% and is right about 7 times in 10
- Confident only when the evidence is strong
## Overconfident probabilities | bad
- Says 99% and is wrong more often than that
- Same yes and no answers, worse numbers
```

```diagram flow What each score looks at
note: Pick the score that matches how the model's number will be used.
- Accuracy | Yes or no at one cut-off | input
- Log loss and Brier score | How good the probability itself is | model
- Calibration table | Whether the percentages match what happened | output
```

```diagram flow Comparing two models fairly
note: Use the same cases for both models, then look at the difference per case.
- Score both models on the same cases | One score per case | input
- Subtract the two scores case by case | One difference per case | process
- Compare the average difference with its spread | Is the gap bigger than chance? | output
```

## Real-world example
A bank has two models that flag payments that might be fraud. Both flag the same payments at the 50% line, so they have the same accuracy on the test set. But the fraud team does not just read yes or no. They sort by the percentage and review the top ones first, and they set a policy: "above 90%, block the card at once". For that policy the percentages must be honest. If the model says 95% and the real rate is 70%, the bank blocks too many good customers. The team compares the models by log loss and by a calibration table, and finds one model is overconfident.

## How it works
1. Score each model on the same test cases. Use accuracy at the cut-off you plan to use, and also log loss and the Brier score.
2. Look at the calibration table: group the cases by the percentage the model gave, and compare the average percentage with the share that really happened.
3. For each test case, work out the difference in loss between the two models. Take the average difference and its standard error.
4. Decide. A difference more than about two standard errors from zero is probably real. Smaller than that could be chance, so you may need more test cases.

**Log loss** is the average "surprise" of the model at what really happened. If the event happened, the surprise is minus the natural logarithm of the probability the model gave it. If the event did not happen, it is minus the logarithm of one minus that probability.

```maths Log loss: how surprised is the model?
situation: Four cases. In the first three the event really happened, and the model gave it 90%, 50% and 10%. In the fourth the event did not happen, but the model said 99%. Numbers are made up for teaching.
find: How much does each answer cost, and which mistake costs most?
step: Event happened, model said 90% | -ln(0.9) ≈ 0.105
step: Event happened, model said 50% | -ln(0.5) ≈ 0.693
step: Event happened, model said 10% | -ln(0.1) ≈ 2.303
step: Event did not happen, model said 99% (so it gave "no" only 1%) | -ln(0.01) ≈ 4.605
result: Being right and confident costs 0.105. Being unsure costs 0.693. Being confidently wrong costs 4.605, more than forty times as much.
formula: log loss = the average of -ln(probability the model gave to what really happened)
means: ln is the natural logarithm. A probability near 1 gives a loss near 0. A probability near 0 gives a very large loss.
why: Log loss punishes confident mistakes hard. That is what you want when a percentage drives a decision, and it is why it is the usual loss for training classifiers.
caution: A single wrong 99% case can dominate the average, so check how many such cases there are before trusting one number.
try: The model said 80% and the event happened. What is the loss, and is it bigger or smaller than for 90%?
answer: -ln(0.8) ≈ 0.223. It is bigger than 0.105, because the model was a little less sure of the thing that happened.
```

## Python example
The cases come from a repeatable rule: 40 cases, an event that happens with a known chance. Model A reports the true chance. Model B ranks cases the same way but is overconfident: its percentages are pushed towards 0 and 1.

```python model_compare.py
"""Two models, one set of cases: accuracy, log loss, Brier score, a paired comparison and a calibration table.

Model A reports the true chance for each case. Model B reports the same ranking but is overconfident:
its probabilities are pushed towards 0 and 1. The cases are generated by a repeatable rule, so the numbers
are the same on every run and in the C# version.
Run:  python model_compare.py   (needs numpy)
"""
import numpy as np

n = 40
i = np.arange(n)
p_true = np.clip(0.5 + 0.45 * np.sin(0.7 * i), 0.03, 0.97)
y = ((i * 0.6180339887498949) % 1.0 < p_true).astype(float)      # 1 means the event happened
logit = np.log(p_true / (1 - p_true))
p_a = p_true                                                      # honest probabilities
p_b = np.clip(1 / (1 + np.exp(-3 * logit)), 0.001, 0.999)         # overconfident probabilities

def case_loss(p):                                                 # log loss of each single case
    return -(y * np.log(p) + (1 - y) * np.log(1 - p))

for name, p in (("A", p_a), ("B", p_b)):
    acc = float(np.mean((p >= 0.5) == (y == 1)))
    print("model %s: accuracy %.3f  log loss %.3f  Brier %.3f" % (name, acc, case_loss(p).mean(), np.mean((p - y) ** 2)))

d = case_loss(p_b) - case_loss(p_a)                               # paired: the same case under both models
se = d.std(ddof=1) / np.sqrt(n)
print("paired difference in log loss (B minus A): mean %.3f  standard error %.3f  ratio %.2f" % (d.mean(), se, d.mean() / se))

print("model B calibration: predicted range, cases, average predicted, share that happened")
for lo in (0.0, 0.2, 0.4, 0.6, 0.8):
    m = (p_b >= lo) & (p_b < lo + 0.2 + (1e-9 if lo == 0.8 else 0))
    if m.any():
        print("  %.1f to %.1f  %2d  %.3f  %.3f" % (lo, lo + 0.2, m.sum(), p_b[m].mean(), y[m].mean()))
```
```text Output of model_compare.py (executed)
model A: accuracy 0.800  log loss 0.483  Brier 0.155
model B: accuracy 0.800  log loss 0.745  Brier 0.171
paired difference in log loss (B minus A): mean 0.262  standard error 0.170  ratio 1.54
model B calibration: predicted range, cases, average predicted, share that happened
  0.0 to 0.2  16  0.034  0.250
  0.4 to 0.6   5  0.545  0.600
  0.8 to 1.0  19  0.963  0.895
```
Both models are right on 80% of cases (accuracy 0.800), yet model B has the worse log loss (0.745 against 0.483) and the worse Brier score (0.171 against 0.155). Accuracy hid the difference.

```maths Is the gap real? The paired comparison
situation: For each of the 40 cases we worked out model B's loss minus model A's loss. The average of those 40 differences is 0.262. Their standard error, which says how much that average would wobble from one set of cases to another, is 0.170.
find: Is a gap of 0.262 bigger than chance?
step: Divide the gap by its standard error | 0.262 ÷ 0.170 ≈ 1.54
result: The gap is about 1.54 standard errors from zero. A common rule of thumb asks for about 2 or more, so this gap could still be chance with only 40 cases.
formula: ratio = mean difference ÷ standard error
means: The standard error is the spread of the 40 differences divided by the square root of 40.
why: Without this step you might ship the "better" model because it scored 0.262 lower when luck alone could explain it. More test cases shrink the standard error and make the answer clearer.
caution: The rule of about 2 is a rough guide, not a law. It assumes the cases are independent of each other.
try: With four times as many cases, and the same average gap, the standard error would be half as large (0.085). What would the ratio be?
answer: 0.262 ÷ 0.085 ≈ 3.08. Four times the data doubles the ratio, which would be convincing evidence that model B really is worse.
```

The calibration table shows why B is worse. Among the 16 cases where B said under 20%, it averaged 0.034, but the event happened 0.250 of the time. Among the 19 cases where it said over 80%, it averaged 0.963 but the event happened 0.895 of the time. B is too sure at both ends.

```maths Reading one row of the calibration table
situation: In the lowest row, model B gave an average of 0.034 to 16 cases, and the event really happened in 0.250 of them.
find: How many events did B expect, how many happened, and how big is the gap?
step: Events B expected | 16 × 0.034 ≈ 0.544
step: Events that really happened | 16 × 0.25 = 4
step: Gap between the promise and what happened (as shares) | 0.250 - 0.034 = 0.216
result: B expected about half an event in this row and 4 happened. B said "almost never" about cases that are really one in four.
why: A calibration table turns "trust the percentage" into something you can check. If a row's two numbers are far apart, the percentage means something different from what it says.
try: In the top row, B averaged 0.963 and the event happened 0.895 of the time. How big is that gap?
answer: 0.963 - 0.895 = 0.068. B over-promised by about 7 points on its most confident cases.
```

If a model's probabilities are off but its ranking is good, you can repair them without retraining by fitting a small correction on held-out data. **Platt scaling** fits a smooth S-curve; **isotonic regression** fits a staircase. Both are available in scikit-learn.

## .NET (C#) example
This is the same comparison written from scratch in C# with no packages. It prints exactly the same numbers. ML.NET reports log loss for a trained model, and the same formulas apply.

```cs Program.cs
// Same cases and same numbers as model_compare.py. Written from scratch, so it needs no packages.
const int n = 40;
double[] pTrue = new double[n], y = new double[n], pA = new double[n], pB = new double[n];
for (int i = 0; i < n; i++)
{
    pTrue[i] = Math.Clamp(0.5 + 0.45 * Math.Sin(0.7 * i), 0.03, 0.97);
    y[i] = (i * 0.6180339887498949) % 1.0 < pTrue[i] ? 1 : 0;              // 1 means the event happened
    double logit = Math.Log(pTrue[i] / (1 - pTrue[i]));
    pA[i] = pTrue[i];                                                      // honest probabilities
    pB[i] = Math.Clamp(1 / (1 + Math.Exp(-3 * logit)), 0.001, 0.999);      // overconfident probabilities
}

double CaseLoss(double[] p, int i) => -(y[i] * Math.Log(p[i]) + (1 - y[i]) * Math.Log(1 - p[i]));
void Report(string name, double[] p)
{
    double acc = Enumerable.Range(0, n).Average(i => ((p[i] >= 0.5) == (y[i] == 1)) ? 1.0 : 0.0);
    double ll = Enumerable.Range(0, n).Average(i => CaseLoss(p, i));
    double brier = Enumerable.Range(0, n).Average(i => Math.Pow(p[i] - y[i], 2));
    Console.WriteLine($"model {name}: accuracy {acc:F3}  log loss {ll:F3}  Brier {brier:F3}");
}
Report("A", pA);
Report("B", pB);

double[] d = Enumerable.Range(0, n).Select(i => CaseLoss(pB, i) - CaseLoss(pA, i)).ToArray();   // paired: same case, both models
double mean = d.Average();
double sd = Math.Sqrt(d.Sum(v => Math.Pow(v - mean, 2)) / (n - 1));
double se = sd / Math.Sqrt(n);
Console.WriteLine($"paired difference in log loss (B minus A): mean {mean:F3}  standard error {se:F3}  ratio {mean / se:F2}");

Console.WriteLine("model B calibration: predicted range, cases, average predicted, share that happened");
foreach (double lo in new[] { 0.0, 0.2, 0.4, 0.6, 0.8 })
{
    double hi = lo + 0.2 + (lo == 0.8 ? 1e-9 : 0);
    var rows = Enumerable.Range(0, n).Where(i => pB[i] >= lo && pB[i] < hi).ToArray();
    if (rows.Length > 0)
        Console.WriteLine($"  {lo:F1} to {lo + 0.2:F1}  {rows.Length,2}  {rows.Average(i => pB[i]):F3}  {rows.Average(i => y[i]):F3}");
}
```

## Maths behind it
- Natural logarithm and log loss (information theory)
- Brier score as mean squared error of probabilities (statistics)
- Standard error of an average difference (statistics)
- Calibration as comparing predicted and observed rates (probability)

## Common mistakes
- Comparing models by accuracy alone when a percentage drives the decision.
- Comparing scores computed on different cases or different splits. Use the same cases for both models.
- Declaring a winner from a small gap on a small test set without checking the standard error.
- Checking calibration on the training data. Use cases the model has not seen.
- Forgetting that a model can rank well and still give poor percentages. Fix the percentages with Platt or isotonic scaling, on held-out data.

## Quick check
Q: Two fraud models both have 80% accuracy. Why might you still prefer one?
A: Accuracy ignores how confident each model was. The one with the lower log loss and the better calibration table gives percentages you can use for decisions such as "block above 90%".

Q: A model says 99% for a case where the event did not happen. Why does log loss treat this so harshly?
A: Log loss takes minus the logarithm of the probability given to what really happened, here 1%, which is about 4.6. A confident wrong answer costs far more than an unsure one.

Q: Model B scores 0.262 worse than model A, with a standard error of 0.170. Can you be sure B is worse?
A: Not yet. The ratio is about 1.54, below the rough guide of 2, so chance could explain the gap. Collect more test cases and repeat the paired comparison.

Q: In a calibration table, the 80 to 100% row shows an average prediction of 0.96 but an observed rate of 0.90. What does it mean?
A: The model is overconfident in that range. It promises 96% and delivers 90%. You can correct this with Platt scaling or isotonic regression fitted on held-out data.
