---
id: ml-linear-deeper
title: Linear models under the hood
module: ml
level: Intermediate
minutes: 75
maths: algebra
goal: Solve a linear regression with the normal equation instead of a library call, see how one change (a log link) turns it into a count model, and choose a decision threshold from the real cost of each kind of mistake.
prereqs: ml-regression, ml-classification
reviewed: 2026-11-18
evidence: The same line fitted by the normal equation and by a library, with both sets of numbers shown, plus a cost table that justifies one threshold.
code: Python executed 2026-11-18 (examples/linear-deeper/linear_deeper.py); the C# version prints the same numbers
---
## In plain words
In the regression lesson a library found the best line for you. Underneath, that is one piece of algebra called the **normal equation**: it gives the best slope and intercept directly, with no repeated tries. It is worth seeing once, because it explains why a column of ones carries the intercept, why features on very different scales cause trouble, and why highly similar features make the answer unstable. Two ideas then stretch the same model. A **generalised linear model** keeps the straight-line part but connects it to the answer through a link, so it can predict counts or probabilities instead of any number. And **cost-sensitive learning** accepts that mistakes are not equal: when a missed case costs ten times a false alarm, the best cut-off is not 50%.

```diagram flow The normal equation in four steps
note: One calculation gives the best line. No repeated guessing is needed.
- Put the features in a table X | Add a column of ones for the intercept | input
- Work out XtX and Xty | Two small tables built from X and the answers | process
- Solve XtX times w equals Xty | The unknown w holds slope and intercept | model
- Use w to predict | Prediction is X times w | output
```

```diagram compare Normal equation and gradient descent
note: Both reach the same line. They differ in how they get there and when they stop working well.
## Normal equation | process
- One calculation
- Fine for a few features
- Slows down with very many features
## Gradient descent | model
- Many small steps
- Works for huge data and any model
- Needs a learning rate
```

```diagram compare Plain and generalised linear models
note: The straight-line part is the same. The link changes what the answer means.
## Plain linear model | process
- Answer is any number
- Good for prices and times
## Generalised linear model | model
- A link connects the line to the answer
- Log link: counts. Logit link: probabilities
```

## Real-world example
A property website predicts a flat's price from its size. A data scientist first uses a library call. A reviewer asks, "How do I know the numbers are right?" The scientist solves the normal equation directly on six flats and shows that the slope and intercept match the library to three decimals. The same company also predicts how many support calls a district will make per day. Calls are counts: never negative, often small, and the spread grows with the average. They use a Poisson model with a log link, which cannot predict a negative count. And for a loan-risk alert, where missing a risky loan costs far more than a needless review, they pick the cut-off from the total cost, not from 50%.

## How it works
1. **The line by algebra.** For one feature, write the table X with a column of ones and a column of sizes. The best weights satisfy XtX times w = Xty. For two unknowns this is two equations you can solve by hand.
2. **When it breaks.** If two features carry nearly the same information, XtX is almost impossible to invert and the weights become unstable. This is called **multicollinearity**. Drop one feature or use ridge regression.
3. **The link.** A Poisson model says the logarithm of the expected count is a straight line in the features. Taking the exponential gives the count, which is always positive.
4. **The cost.** To choose a threshold, count how many cases are missed and how many are false alarms at each cut-off, multiply by the cost of each, and pick the cheapest.

```maths The normal equation by hand with three points
situation: Three points: sizes 1, 2 and 3 with prices 2, 4 and 5. We want the best line price = intercept + slope × size. These are made-up numbers.
find: What are the intercept and the slope?
step: Number of points n | 3 = 3
step: Sum of the sizes | 1 + 2 + 3 = 6
step: Sum of the sizes squared | 1^2 + 2^2 + 3^2 = 14
step: Sum of the prices | 2 + 4 + 5 = 11
step: Sum of size times price | 1 × 2 + 2 × 4 + 3 × 5 = 25
step: Determinant of XtX (n times the sum of squares, minus sum times sum) | 3 × 14 - 6 × 6 = 6
step: Intercept | (14 × 11 - 6 × 25) ÷ 6 ≈ 0.667
step: Slope | (3 × 25 - 6 × 11) ÷ 6 = 1.5
result: The best line is price = 0.667 + 1.5 × size.
formula: w = (XtX)^-1 Xt y
means: XtX is a small table of sums built from the features. Solving with it gives the weights that make the squared errors as small as possible.
why: Every linear regression, whether in scikit-learn, ML.NET or a neural network's last layer, is finding this same answer or an approximation to it. Knowing the algebra tells you what to check when a fit looks wrong.
caution: The determinant is zero when features repeat each other, and then there is no unique answer.
try: Use the line to predict the price at size 4.
answer: 0.667 + 1.5 × 4 = 6.667. At size 4 the line predicts a price of about 6.67.
```

```maths A log link turns a line into a count
situation: A Poisson model says the logarithm of the expected number of calls is 0.5 + 0.3 × x, where x is the number of open incidents. These coefficients are made up.
find: How many calls does it expect for 2 incidents, and for 4?
step: The straight-line part for x = 2 | 0.5 + 0.3 × 2 = 1.1
step: Undo the logarithm with the exponential | exp(1.1) ≈ 3.004
step: The straight-line part for x = 4 | 0.5 + 0.3 × 4 = 1.7
step: Undo the logarithm | exp(1.7) ≈ 5.474
step: Two more incidents multiply the expected calls by | exp(0.3 × 2) ≈ 1.822
result: The model expects about 3.0 calls for 2 incidents and about 5.5 for 4. Each extra incident multiplies the expected calls by about 1.35, never subtracts below zero.
why: The link guarantees a positive count and makes effects multiply, which matches how many counts behave. Logistic regression is the same idea with a logit link, and it is why its output is between 0 and 1.
try: What does the model expect for x = 0?
answer: 0.5 + 0.3 × 0 = 0.5, and exp(0.5) ≈ 1.649. With no open incidents it still expects about 1.6 calls, which is the baseline.
```

## Python example
Six flats, made-up numbers. The program solves the normal equation, checks it against scikit-learn, and then evaluates four thresholds by total cost, where a missed case costs 10 and a false alarm costs 1.

```python linear_deeper.py
"""Linear regression under the hood: the normal equation, then a cost-sensitive threshold.

Part 1 solves for the best line with the normal equation (w = (XtX)^-1 Xt y) and checks it against scikit-learn.
Part 2 picks a decision threshold by total cost when a missed case costs 10 times a false alarm.
Run:  python linear_deeper.py   (needs numpy and scikit-learn)
"""
import numpy as np
from sklearn.linear_model import LinearRegression

size = np.array([50.0, 60.0, 70.0, 80.0, 90.0, 100.0])             # square metres
price = np.array([150.0, 172.0, 205.0, 226.0, 255.0, 270.0])       # thousands (made-up numbers)
X = np.column_stack([np.ones_like(size), size])                    # a column of ones carries the intercept
w = np.linalg.solve(X.T @ X, X.T @ price)                          # the normal equation
print("normal equation: intercept %.3f  slope %.3f" % (w[0], w[1]))
lib = LinearRegression().fit(size.reshape(-1, 1), price)
print("scikit-learn:    intercept %.3f  slope %.3f" % (lib.intercept_, lib.coef_[0]))
print("prediction for 75 square metres: %.1f" % (w[0] + w[1] * 75))

score = np.array([0.05, 0.10, 0.20, 0.30, 0.35, 0.45, 0.55, 0.60, 0.70, 0.80, 0.90, 0.95])
label = np.array([0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1])             # 1 means a real case
print("threshold  missed  false alarms  total cost (miss = 10, false alarm = 1)")
for t in (0.1, 0.3, 0.5, 0.7):
    flagged = score >= t
    missed = int(np.sum((label == 1) & ~flagged))
    false_alarms = int(np.sum((label == 0) & flagged))
    print("%9.1f  %6d  %12d  %10d" % (t, missed, false_alarms, 10 * missed + false_alarms))
```
```text Output of linear_deeper.py (executed)
normal equation: intercept 26.571  slope 2.486
scikit-learn:    intercept 26.571  slope 2.486
prediction for 75 square metres: 213.0
threshold  missed  false alarms  total cost (miss = 10, false alarm = 1)
      0.1       0             5           5
      0.3       0             3           3
      0.5       1             1          11
      0.7       2             0          20
```
Both ways give the same line (intercept 26.571, slope 2.486), which predicts 213.0 for 75 square metres. In the cost table, the cut-off of 0.5 that looks natural costs 11. The lower cut-off of 0.3 flags more cases but costs only 3, because it misses nobody.

```maths Choosing a threshold by cost
situation: At each cut-off we counted the real cases missed and the false alarms, from the run above. A miss costs 10 and a false alarm costs 1.
find: Which cut-off gives the lowest total cost?
step: Cut-off 0.1 (0 missed, 5 false alarms) | 10 × 0 + 5 = 5
step: Cut-off 0.3 (0 missed, 3 false alarms) | 10 × 0 + 3 = 3
step: Cut-off 0.5 (1 missed, 1 false alarm) | 10 × 1 + 1 = 11
step: Cut-off 0.7 (2 missed, 0 false alarms) | 10 × 2 + 0 = 20
result: Cut-off 0.3 is cheapest at 3. The "obvious" 0.5 costs more than three times as much.
why: The best threshold depends on the business, not on the model. When misses are expensive, lower the cut-off and accept more false alarms.
caution: These costs are invented and the test set is only 12 cases. In practice use real costs and many more cases, and pick the cut-off on validation data, not on the test set.
try: If a miss cost only 2, which of the four cut-offs would be cheapest?
answer: 0.1: 2 × 0 + 5 = 5. 0.3: 2 × 0 + 3 = 3. 0.5: 2 × 1 + 1 = 3. 0.7: 2 × 2 + 0 = 4. Cut-offs 0.3 and 0.5 tie at 3, so with cheaper misses the natural middle cut-off is as good.
```

## .NET (C#) example
The normal equation for two unknowns is solved by hand here, so no packages are needed. It prints the same numbers as the Python version. In ML.NET the `Sdca` and `Ols` regression trainers solve the same problem for you.

```cs Program.cs
// Same numbers as linear_deeper.py. The normal equation is solved by hand for two unknowns, so no packages are needed.
double[] size = { 50, 60, 70, 80, 90, 100 };
double[] price = { 150, 172, 205, 226, 255, 270 };
int n = size.Length;

// X has a column of ones and a column of sizes. XtX is a 2x2 table and Xty is a list of 2 numbers.
double a = n, b = size.Sum(), d = size.Sum(s => s * s);          // XtX = [[a, b], [b, d]]
double e = price.Sum(), f = size.Zip(price, (s, p) => s * p).Sum();   // Xty = [e, f]
double det = a * d - b * b;                                       // determinant of XtX
double intercept = (d * e - b * f) / det;                         // solve the 2x2 system
double slope = (a * f - b * e) / det;
Console.WriteLine($"normal equation: intercept {intercept:F3}  slope {slope:F3}");
Console.WriteLine($"prediction for 75 square metres: {intercept + slope * 75:F1}");

double[] score = { 0.05, 0.10, 0.20, 0.30, 0.35, 0.45, 0.55, 0.60, 0.70, 0.80, 0.90, 0.95 };
int[] label = { 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1 };             // 1 means a real case
Console.WriteLine("threshold  missed  false alarms  total cost (miss = 10, false alarm = 1)");
foreach (double t in new[] { 0.1, 0.3, 0.5, 0.7 })
{
    int missed = 0, falseAlarms = 0;
    for (int i = 0; i < score.Length; i++)
    {
        bool flagged = score[i] >= t;
        if (label[i] == 1 && !flagged) missed++;
        if (label[i] == 0 && flagged) falseAlarms++;
    }
    Console.WriteLine($"{t,9:F1}  {missed,6}  {falseAlarms,12}  {10 * missed + falseAlarms,10}");
}
```

## Maths behind it
- The normal equation and matrix algebra (linear algebra)
- Determinant of a 2 by 2 table (linear algebra)
- The logarithm and exponential as inverses (algebra)
- Expected cost of decisions (decision theory)

## Common mistakes
- Forgetting the column of ones, which forces the line through the origin.
- Feeding two features that say nearly the same thing (multicollinearity) and trusting the weights.
- Using a plain linear model for counts and getting negative predictions.
- Choosing a 50% threshold because it is the default, without looking at the cost of each mistake.
- Tuning the cut-off on the test set. Use validation data.

## Quick check
Q: Why do we add a column of ones to the features?
A: It lets the model learn the intercept as one more weight. Without it the line must pass through zero.

Q: Why use a log link for a model of counts?
A: The exponential of any number is positive, so predicted counts can never be negative, and each unit of a feature multiplies the expected count.

Q: A missed fraud costs 50 and a false alarm costs 1. Should the cut-off be above or below 50%?
A: Below. Misses are far more expensive, so flag more cases and accept extra false alarms.

Q: Two features are almost copies of each other. What goes wrong in the normal equation?
A: XtX becomes nearly impossible to invert, so the weights are unstable and can change a lot with tiny changes in the data. Remove one feature or use ridge regression.
