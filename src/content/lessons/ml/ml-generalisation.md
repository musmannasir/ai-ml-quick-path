---
id: ml-generalisation
title: Bias, variance and the limits of learning
module: ml
level: Intermediate
minutes: 75
maths: basic arithmetic
goal: Explain the two ways a model goes wrong (too simple, too flexible), read training and test error to tell which one you have, and know why more features and more data change the answer.
prereqs: ml-learning, ml-evaluation
reviewed: 2026-11-18
evidence: A table of training and test error for at least five settings of one model dial, with a written sentence saying which setting you would ship and why.
code: Python executed 2026-11-18 (examples/generalisation/generalisation.py); the C# version prints the same numbers
---
## In plain words
Every model makes mistakes for three reasons. First, it may be **too simple** to follow the real pattern. A straight line cannot follow a curve. That kind of mistake is called **bias**. Second, it may be **too flexible**: it follows the random wobble in the training data as if it were the pattern, so a different training sample gives a very different model. That kind of mistake is called **variance**. Third, the data itself has **noise** that no model can predict. Making a model more flexible lowers bias and raises variance. Your job is to find the middle, where the error on new data is lowest. You find it by watching two numbers together: the error on the training data and the error on test data.

```diagram compare Too simple and too flexible
note: Both models are wrong, in opposite ways. Neither is the one you want.
## Too simple (high bias) | warn
- Misses the real pattern
- Error is high on training data and on test data
- Same model on every training sample
## Too flexible (high variance) | bad
- Copies the wobble in the training data
- Tiny training error, large test error
- Gives a different model on every training sample
```

```diagram flow How to read the two errors
note: The gap between the two errors, and the level of both, tell you what to do next.
- Look at training error | Is it already high? | input
- Look at test error | Is it much higher than training error? | model
- Choose the fix | High both: more flexible model. Big gap: simpler model or more data | output
```

```diagram compare The three sources of error
note: You can reduce the first two. You cannot reduce the third.
## Bias | warn
- The model is too simple
- Fix: a more flexible model or better features
## Variance | process
- Too sensitive to its training sample
- Fix: simpler model, more data, or averaging
## Noise | bad
- Randomness in the data itself
- No model can remove it
```

## Real-world example
A delivery company predicts how long each delivery takes. Their first model is a single rule: "time = distance × 3 minutes". It is wrong in the same way every day, because traffic and stairs matter too. That is bias. Their second model asks about 200 details, such as the exact street and the weather hour by hour. It is nearly perfect on last year's deliveries and poor on this month's, because it memorised last year's accidents. That is variance. The model they ship sits in between, and they pick it by looking at error on deliveries the model never saw.

## How it works
1. Pick one dial that controls flexibility: tree depth, the number of neighbours, the degree of a curve, or the strength of regularisation.
2. For each dial setting, train on the training rows and measure the error on both the training rows and the test rows.
3. Read the pair. Both high: too simple. Training low and test high: too flexible. Both low and close: good.
4. Compare the best test error with the **noise floor**: the error you would get from the random part alone. If you are close to it, stop tuning. More work on the model cannot help much.

Bias and variance can be seen with a tiny hand calculation. Suppose the true answer is 10. You train a model four times on four different training samples and look at what each trained model predicts for that one case.

```maths Bias and variance from four predictions
situation: The true answer for one delivery is 10 minutes. A simple model and a flexible model are each trained four times, on four different samples of past deliveries. The simple model predicts 13, 14, 14 and 15. The flexible model predicts 6, 14, 8 and 12. These are made-up numbers for teaching.
find: How far is each model from the truth on average (bias), and how much do its four answers differ from each other (variance)?
step: Simple model, its average answer | (13 + 14 + 14 + 15) ÷ 4 = 14
step: Simple model, bias (average answer minus the truth) | 14 - 10 = 4
step: Simple model, variance (average squared distance from its own average) | ((13 - 14)^2 + (14 - 14)^2 + (14 - 14)^2 + (15 - 14)^2) ÷ 4 = 0.5
step: Flexible model, its average answer | (6 + 14 + 8 + 12) ÷ 4 = 10
step: Flexible model, bias | 10 - 10 = 0
step: Flexible model, variance | ((6 - 10)^2 + (14 - 10)^2 + (8 - 10)^2 + (12 - 10)^2) ÷ 4 = 10
result: The simple model is off by 4 every time but gives almost the same answer. The flexible model is right on average but its answers swing widely.
formula: expected squared error = bias squared + variance (+ noise)
means: Bias squared is the average miss, squared. Variance is how much the answers spread out. Noise is the part nobody can predict; this example has none.
why: Training error cannot show you this, because it only sees one trained model. Comparing training and test error is the practical way to see whether a model's problem is bias or variance.
caution: Real bias and variance cannot be measured exactly from one dataset. This hand calculation shows the idea with answers we chose.
try: Check the formula for the simple model by a different route: take each of its four answers' squared distance from the truth and average them. Does it equal bias squared plus variance?
answer: (13 - 10)^2 + (14 - 10)^2 + (14 - 10)^2 + (15 - 10)^2 = 9 + 16 + 16 + 25 = 66, and 66 ÷ 4 = 16.5. Bias squared is 4 × 4 = 16 and the variance is 0.5, so 16 + 0.5 = 16.5. Both routes agree.
```

```diagram flow What a learning curve shows
note: Plot error against the number of training rows. The gap shows whether more data would help.
- Few training rows | Training error is low, test error is high | warn
- More training rows | The two errors move towards each other | process
- Many training rows | If both are high and close, more data will not help; make the model more flexible | output
```

### More features need many more examples
Adding features seems free: more information can only help. It is not free. With more features, the same number of rows covers a smaller and smaller share of the possible cases. This is the **curse of dimensionality**.

```maths Why more features need many more rows
situation: You cut each feature into 10 ranges, such as age 20 to 29, 30 to 39 and so on. You want at least one example in every combination of ranges, so the model has seen something like each case.
find: How many examples do you need as you add features?
step: With 1 feature there are 10 combinations | 10^1 = 10
step: With 2 features | 10^2 = 100
step: With 3 features | 10^3 = 1000
step: With 10 features | 10^10 = 10000000000
result: Ten features cut this way give ten billion combinations. No dataset is that big.
why: In many dimensions, almost every new case is far from every training row, so "similar past examples" are not similar at all. Distance-based methods such as k-nearest neighbours suffer first. The usual remedies are fewer, better features, simpler models, and more data.
caution: Real data is not spread evenly across all combinations, so the true need is smaller. The direction of the problem is real: each added feature makes the data thinner.
try: You have 3 features and 1000 rows, and you add a fourth feature cut into the same 10 ranges. How many combinations are there now, and how many rows per combination on average?
answer: 10^4 = 10000 combinations. Spread over 1000 rows that is 1000 ÷ 10000 = 0.1 rows per combination, so most combinations have no example at all.
```

```diagram flow Why more features can hurt
note: Each new feature is only worth it if it carries real signal.
- Add a feature | More information, if it is useful | input
- The data thins out | Fewer rows per combination of values | warn
- Variance rises | The model fits chance patterns | bad
```

### Two limits to remember
- **No free lunch.** No single model is best on every problem. A model works when its built-in assumptions (a line, a tree, similar inputs have similar outputs) fit the data. That is why you compare models on your own data and keep a baseline.
- **Occam's razor.** When two models perform equally well on test data, choose the simpler one. It is easier to explain, cheaper to run and less likely to be fragile.

## Live simulation
Overfitting and underfitting are two ends of one dial. Turn the dial and watch both errors.

```sim bv Bias, variance and the wiggly curve
question: Why does a more flexible model do better on training data but sometimes worse on new data?
watch: The grey curve is the real pattern (a sine wave). The dots are noisy samples of it. The coloured curve is the polynomial fitted to the dots.
watch: Degree 1 is a straight line: too stiff to follow the wave (high bias). A high degree can pass through every dot and swing wildly in between (high variance).
watch: The second chart shows training error always falling, while the error on new points falls and then rises. Try more training points.
try: overfit | With 15 points, choose degree 7 or more and make the error on new points more than 3 times the training error.
try: more | Raise the training points to 50 or more at degree 7 or more, and bring the two errors within 1.5 times of each other.
predict: With 15 points and degree 9, how will the error on new points compare with the training error? | About the same | Much higher | Lower
answer: 2 | A degree-9 curve has 10 free numbers to fit 15 noisy points, so it chases the noise. Its error on new points is far larger than on the points it saw.
leaves-out: One input, a made-up sine pattern and polynomials only. Real models overfit in other ways (deep trees, many features), and the usual cures there include regularisation, simpler models and more data. Error on new points here uses a fresh made-up sample.
reference: examples/sim-core/core.py
```

## Python example
The run below uses 60 points on a curve plus a repeatable wobble that stands in for noise. Even-numbered points train the model and odd-numbered points test it. The dial is the number of neighbours k that a k-nearest-neighbours model averages: k = 1 copies the nearest training point (very flexible), and k = 29 averages nearly everything (very simple).

```python generalisation.py
import numpy as np
from sklearn.neighbors import KNeighborsRegressor

n = 60
i = np.arange(n)
x = (6 / 59) * i + np.where(i % 2 == 1, 0.013, 0.0)   # the small offset avoids equal distances
y = np.sin(x) + 0.35 * np.sin(17.0 * i + 1.0)         # curve plus wobble
train = i % 2 == 0
test = ~train

def rmse(a, b):
    return float(np.sqrt(np.mean((a - b) ** 2)))

print("wobble alone (the error no model can remove): %.3f" % rmse(0.35 * np.sin(17.0 * i + 1.0), 0))
print("always predict the training average: test RMSE %.3f" % rmse(y[test], y[train].mean()))
print(" k  train RMSE  test RMSE")
for k in (1, 3, 5, 9, 15, 29):
    model = KNeighborsRegressor(n_neighbors=k).fit(x[train].reshape(-1, 1), y[train])
    print("%2d  %10.3f  %9.3f" % (k, rmse(y[train], model.predict(x[train].reshape(-1, 1))),
                                  rmse(y[test], model.predict(x[test].reshape(-1, 1)))))
```
```text Output of generalisation.py (executed)
wobble alone (the error no model can remove): 0.249
always predict the training average: test RMSE 0.762
 k  train RMSE  test RMSE
 1       0.000      0.394
 3       0.300      0.246
 5       0.250      0.274
 9       0.321      0.315
15       0.358      0.367
29       0.750      0.755
```
Read the table the way step 3 describes. At k = 1 the training error is 0.000 (the model memorised every training point) but the test error is 0.394: too flexible. At k = 29 both errors are about 0.75, no better than always predicting the average (0.762): too simple. The best test error is at k = 3, which is 0.246, almost exactly the wobble alone (0.249).

```maths How far each setting is from the best possible
situation: The wobble alone gives an error of 0.249. No model can beat that on average. Your test errors come from the run above.
find: How much avoidable error does each setting have?
step: k = 1, test error minus the floor | 0.394 - 0.249 = 0.145
step: k = 3, test error minus the floor | 0.246 - 0.249 = -0.003
step: k = 29, test error minus the floor | 0.755 - 0.249 = 0.506
result: k = 3 is as good as this data allows. k = 1 wastes 0.145 on variance. k = 29 wastes 0.506 on bias.
why: A gap to the noise floor tells you whether further tuning is worth your time. At k = 3 the gap is essentially zero, so stop tuning and ship it.
caution: The small negative number is possible because test error is measured on only 30 test points, so it wobbles a little. It does not mean the model beats the noise.
try: Which setting would you choose if you want a simpler model and can accept 0.02 more error than the best one?
answer: k = 5 has test error 0.274. That is 0.274 - 0.246 = 0.028 more than the best, which is a little over the limit. k = 3 is the better choice here, and k = 5 is the nearest simpler alternative.
```

## .NET (C#) example
ML.NET has no ready-made k-nearest-neighbours trainer, so this version is written from scratch with plain C#. It needs no packages. It uses the same data and prints the same numbers as the Python version.
```cs Program.cs
// k-nearest-neighbours regression written from scratch, so it needs no packages.
// Same data and same numbers as generalisation.py.
const int n = 60;
double[] x = new double[n], y = new double[n];
for (int i = 0; i < n; i++)
{
    x[i] = 6.0 / 59 * i + (i % 2 == 1 ? 0.013 : 0.0);          // the small offset avoids equal distances
    y[i] = Math.Sin(x[i]) + 0.35 * Math.Sin(17.0 * i + 1.0);    // curve plus wobble
}
int[] train = Enumerable.Range(0, n).Where(i => i % 2 == 0).ToArray();   // even points train the model
int[] test = Enumerable.Range(0, n).Where(i => i % 2 == 1).ToArray();    // odd points test it

// Predict one point: the average of the y values of the k closest training points.
double Predict(double at, int k) =>
    train.OrderBy(j => Math.Abs(x[j] - at)).Take(k).Average(j => y[j]);

double Rmse(int[] rows, int k) =>
    Math.Sqrt(rows.Average(i => Math.Pow(y[i] - Predict(x[i], k), 2)));

double wobble = Math.Sqrt(Enumerable.Range(0, n).Average(i => Math.Pow(0.35 * Math.Sin(17.0 * i + 1.0), 2)));
double mean = train.Average(j => y[j]);
double baseline = Math.Sqrt(test.Average(i => Math.Pow(y[i] - mean, 2)));
Console.WriteLine($"wobble alone (the error no model can remove): {wobble:F3}");
Console.WriteLine($"always predict the training average: test RMSE {baseline:F3}");
Console.WriteLine(" k  train RMSE  test RMSE");
foreach (int k in new[] { 1, 3, 5, 9, 15, 29 })
    Console.WriteLine($"{k,2}  {Rmse(train, k),10:F3}  {Rmse(test, k),9:F3}");
```
In a real project you would use a library trainer such as a decision tree or `FastTree` in ML.NET and sweep its depth setting the same way: train, measure both errors, read the pair.

## Maths behind it
- Expected squared error as bias squared plus variance plus noise (statistics)
- Root mean squared error (statistics)
- Counting combinations: powers of 10 (arithmetic)
- Distance between points in many dimensions (geometry)

## Common mistakes
- Judging a model by training error alone. A model that copies the data scores perfectly and still fails.
- Tuning against the test rows again and again. Then the test error is no longer honest. Keep a validation set for tuning and touch the test set once.
- Adding many features "just in case". Each one thins the data and invites chance patterns.
- Chasing a lower test error when you are already at the noise floor. The remaining error is not the model's fault.
- Reading a small test set too closely. With few test rows, differences of a few hundredths are noise.

## Quick check
Q: Training error is 0.01 and test error is 0.40. Is the model too simple or too flexible, and what do you try first?
A: Too flexible (high variance): it fits the training data but not new data. Try a simpler model, stronger regularisation, fewer features or more training data.

Q: Training error is 0.70 and test error is 0.72. What does that tell you?
A: Both are high and close together, so the model is too simple (high bias). More data will not help much; try a more flexible model or better features.

Q: Why does adding more features sometimes make test results worse?
A: Each new feature spreads the same rows over many more combinations of values, so the data becomes thin and the model can fit chance patterns. This is the curse of dimensionality.

Q: Two models give the same test error. One is a simple tree and the other is a large ensemble. Which do you choose, and why?
A: The simple one. When test performance is equal, the simpler model is easier to explain, cheaper to run and less fragile (Occam's razor).
