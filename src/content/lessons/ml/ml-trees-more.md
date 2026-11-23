---
id: ml-trees-more
title: More ensemble methods, AdaBoost by hand
module: ml
level: Intermediate
minutes: 75
maths: algebra
goal: Explain how AdaBoost builds a strong model from many weak ones by re-weighting its mistakes, follow three rounds by hand, and place AdaBoost next to bagging, gradient boosting and discriminant analysis.
prereqs: ml-algorithms
reviewed: 2026-11-18
evidence: The three rounds of AdaBoost on a small dataset, with each round's weighted error, vote size and the weights after the round, written out and matching a program's output.
code: Python executed 2026-11-18 (examples/boosting/adaboost.py); the C# version prints the same numbers
---
## In plain words
One simple rule, such as "the answer is yes if x is above 3.5", is a weak model. It is wrong a lot. **Boosting** builds a strong model by adding weak models one after another, each one focusing on the cases the earlier ones got wrong. **AdaBoost** was the first practical boosting method. It keeps a weight for every training case. After each round it makes the weights of the mistakes bigger, so the next simple rule has to pay attention to them. Each rule also gets a vote size that grows when the rule is accurate. The final answer is a weighted vote of all the rules. Boosting is different from **bagging**: bagging trains many models independently and averages them to reduce variance, while boosting trains them in sequence to reduce bias.

```diagram loop The AdaBoost loop
note: Each pass fixes what the last pass left wrong.
- Find the best simple rule | Smallest weighted error on the current weights | model
- Work out its vote size | Accurate rules get big votes | process
- Raise the weights of its mistakes | The next rule must look at them | warn
- Add the rule to the team | Final answer is the weighted vote | output
loop: Repeat for a fixed number of rounds
```

```diagram compare Bagging and boosting
note: Same idea of many models, opposite ways of building them.
## Bagging (random forest) | process
- Models trained independently on random samples
- Averages them to reduce variance
- Easy to run in parallel
## Boosting (AdaBoost, gradient boosting) | model
- Models trained one after another
- Each focuses on earlier mistakes, to reduce bias
- Can overfit noisy data if run too long
```

```diagram flow How the final vote is made
note: Every rule votes plus or minus one, scaled by its vote size.
- Each rule votes plus one or minus one | Its answer for this case | input
- Multiply each vote by its vote size | Accurate rules count for more | process
- Add them up and take the sign | Positive means yes, negative means no | output
```

## Real-world example
A bank screens loan applications. A single rule such as "income below a limit" is right about two times in three, which is not enough. A boosted model combines hundreds of such small rules, each added after checking which applications the team so far gets wrong. The applications that every earlier rule missed get the most attention, so the team learns the awkward cases. Gradient boosting, used in XGBoost, LightGBM and CatBoost, follows the same idea with a different way of measuring mistakes, and it is the usual first choice for tables of business data.

## How it works
1. Give every training case the same weight, so the weights add up to 1.
2. Try every simple rule (a threshold on one feature, in either direction) and keep the one with the smallest total weight of mistakes. That total is the weighted error.
3. Work out the rule's vote size from its error: **alpha = 0.5 × ln((1 − error) ÷ error)**. An error below one half gives a positive vote.
4. Multiply the weight of each wrongly answered case by e raised to alpha, and each rightly answered case by e raised to minus alpha. Then divide all weights by their total so they add up to 1 again.
5. Repeat for the chosen number of rounds. The answer is the sign of the sum of vote size times answer over all rules.

```maths A vote size from a weighted error
situation: In round 1 the best rule is wrong on 3 of 10 cases, and every case has weight 0.1. These are the numbers in the run below.
find: How big is this rule's vote?
step: The weighted error | 3 × 0.1 = 0.3
step: One minus the error | 1 - 0.3 = 0.7
step: Ratio of right to wrong weight | 0.7 ÷ 0.3 ≈ 2.333
step: Half the natural logarithm of that ratio | 0.5 × ln(2.333) ≈ 0.424
result: The first rule gets a vote of about 0.424.
formula: alpha = 0.5 × ln((1 - error) ÷ error)
means: When the error is small the ratio is large and the vote is big. At an error of exactly one half the ratio is 1, the logarithm is 0 and the rule gets no vote.
why: The vote size is the way AdaBoost trusts good rules more. A rule no better than a coin flip is ignored.
try: A rule with weighted error 0.1 would get what vote size?
answer: (1 - 0.1) ÷ 0.1 = 9, and 0.5 × ln(9) ≈ 1.099. An accurate rule gets a vote more than twice as large as the 0.424 rule.
```

```maths Raising the weight of mistakes
situation: After round 1 the rule was wrong on 3 cases and right on 7, and its vote size was 0.424. Every case started at weight 0.1.
find: What are the new weights?
step: Growth for a wrong case | exp(0.424) ≈ 1.528
step: Weight of a wrong case before dividing | 0.1 × 1.528 ≈ 0.153
step: Shrink for a right case | exp(-0.424) ≈ 0.654
step: Weight of a right case before dividing | 0.1 × 0.654 ≈ 0.065
step: Total of all weights | 3 × 0.153 + 7 × 0.065 ≈ 0.914
step: New weight of a wrong case | 0.153 ÷ 0.914 ≈ 0.167
step: New weight of a right case | 0.065 ÷ 0.914 ≈ 0.071
result: Each of the 3 mistakes now weighs 0.167, up from 0.1, and each of the 7 correct cases weighs 0.071, down from 0.1.
why: After this step the mistakes together carry half of all the weight (3 × 0.167 is about 0.5), so the next rule cannot ignore them.
```

## Python example
AdaBoost written from scratch on ten points on a line, with three rounds. Each round tries thresholds between neighbouring points, in both directions, and keeps the one with the smallest weighted error.

```python adaboost.py
"""AdaBoost from scratch with one-question trees ("stumps") on ten points.

Each round: find the stump with the smallest weighted error, give it a vote size (alpha) from its error,
then increase the weight of the points it got wrong so the next stump pays more attention to them.
Run:  python adaboost.py   (needs numpy)
"""
import numpy as np

x = np.arange(1.0, 11.0)
y = np.array([1, 1, 1, -1, -1, -1, 1, 1, 1, -1])
w = np.full(10, 0.1)
stumps = []
print("round  rule                   weighted error  alpha")
for r in range(1, 4):
    best = None
    for t in np.arange(1.5, 10.0, 1.0):                  # thresholds between neighbouring points
        for s in (1, -1):                                # s = 1 means "above t is +1"
            pred = np.where(x > t, s, -s)
            err = float(w[pred != y].sum())
            if best is None or err < best[0] - 1e-12:
                best = (err, t, s)
    err, t, s = best
    alpha = 0.5 * np.log((1 - err) / err)
    pred = np.where(x > t, s, -s)
    w = w * np.exp(-alpha * y * pred)
    w = w / w.sum()
    stumps.append((alpha, t, s))
    print("%5d  x > %.1f gives %+d       %14.3f  %5.3f" % (r, t, s, err, alpha))
vote = sum(a * np.where(x > t, s, -s) for a, t, s in stumps)
print("ensemble accuracy after 3 rounds: %.2f" % np.mean(np.sign(vote) == y))
print("weights of the ten points after round 3:", " ".join("%.3f" % v for v in w))
```
```text Output of adaboost.py (executed)
round  rule                   weighted error  alpha
    1  x > 3.5 gives -1                0.300  0.424
    2  x > 9.5 gives -1                0.214  0.650
    3  x > 6.5 gives +1                0.182  0.752
ensemble accuracy after 3 rounds: 1.00
weights of the ten points after round 3: 0.125 0.125 0.125 0.102 0.102 0.102 0.065 0.065 0.065 0.125
```
Round 1 finds the rule "above 3.5 means −1" with weighted error 0.300 and vote 0.424, exactly as in the hand calculation. The three points it got wrong now carry more weight, so round 2 looks elsewhere (above 9.5). Three rounds are enough to classify all ten points (accuracy 1.00), although no single rule could.

```maths A final vote by hand
situation: The three rules and their votes are in the table above. Take the point x = 1, whose true answer is +1. Rule 1 says +1 (it is not above 3.5, and the rule gives minus one above). Rule 2 says +1. Rule 3 says −1 (it is not above 6.5, and the rule gives plus one above).
find: What does the team of three say for x = 1?
step: Vote sizes with signs | 0.424 + 0.650 - 0.752 = 0.322
result: The sum is positive, so the team answers +1, which is correct, even though rule 3 disagreed. For x = 10, whose true answer is −1, the three rules say −1, −1 and +1, which sums to −0.424 − 0.650 + 0.752 = −0.322, so the team answers −1, again correct.
why: This is why a team of weak rules can beat each member. Their mistakes fall on different cases, and the vote sizes let the accurate rules overrule the others.
try: Rule 3 is wrong about x = 1 and has the biggest vote (0.752). Why does the team still get x = 1 right?
answer: The other two rules together have 0.424 + 0.650 = 1.074, which is more than 0.752. Two moderately good rules outvote one very good rule.
```

## .NET (C#) example
ML.NET has boosted-tree trainers (`FastTree`, `LightGbm`) but no plain AdaBoost, so this version is AdaBoost written from scratch in C#. It needs no packages and prints the same numbers.

```cs Program.cs
// Package-free AdaBoost with one-question trees (stumps). Same numbers as adaboost.py.
double[] x = Enumerable.Range(1, 10).Select(v => (double)v).ToArray();
int[] y = { 1, 1, 1, -1, -1, -1, 1, 1, 1, -1 };
double[] w = Enumerable.Repeat(0.1, 10).ToArray();
var stumps = new List<(double alpha, double t, int s)>();
Console.WriteLine("round  rule                   weighted error  alpha");
for (int r = 1; r <= 3; r++)
{
    double bestErr = double.MaxValue, bestT = 0; int bestS = 1;
    for (double t = 1.5; t < 10.0; t += 1.0)                      // thresholds between neighbouring points
        foreach (int s in new[] { 1, -1 })                        // s = 1 means "above t is +1"
        {
            double err = 0;
            for (int i = 0; i < 10; i++) if ((x[i] > t ? s : -s) != y[i]) err += w[i];
            if (err < bestErr - 1e-12) { bestErr = err; bestT = t; bestS = s; }
        }
    double alpha = 0.5 * Math.Log((1 - bestErr) / bestErr);
    for (int i = 0; i < 10; i++) w[i] *= Math.Exp(-alpha * y[i] * (x[i] > bestT ? bestS : -bestS));
    double total = w.Sum();
    for (int i = 0; i < 10; i++) w[i] /= total;
    stumps.Add((alpha, bestT, bestS));
    Console.WriteLine($"{r,5}  x > {bestT:F1} gives {(bestS > 0 ? "+1" : "-1")}       {bestErr,14:F3}  {alpha:F3}");
}
int right = 0;
for (int i = 0; i < 10; i++)
{
    double vote = stumps.Sum(st => st.alpha * (x[i] > st.t ? st.s : -st.s));
    if (Math.Sign(vote) == y[i]) right++;
}
Console.WriteLine($"ensemble accuracy after 3 rounds: {right / 10.0:F2}");
Console.WriteLine("weights of the ten points after round 3: " + string.Join(" ", w.Select(v => v.ToString("F3"))));
```

### Two relatives, in a few lines
- **Discriminant analysis (LDA and QDA).** A classifier that assumes each class is a bell-shaped cloud. Linear discriminant analysis gives every class the same shape and draws straight boundaries. Quadratic discriminant analysis lets each class have its own shape and draws curved boundaries. Both are fast, need little data and are useful baselines when the clouds really are roughly bell-shaped.
- **KD-trees.** A way of splitting space into boxes so that a nearest-neighbour search checks only a few boxes instead of every point. It makes k-nearest-neighbours faster on low-dimensional data and helps little in very high dimensions.

## Maths behind it
- Weighted error and the vote size formula (statistics)
- Exponential growth and decay of weights (algebra)
- Natural logarithm (algebra)
- Weighted vote and the sign function (arithmetic)

## Common mistakes
- Boosting on very noisy labels. The method keeps raising the weight of the noisy cases and fits the noise.
- Running far too many rounds. Choose the number of rounds on validation data.
- Using deep trees as the weak rule. The rules should be simple, or each one overfits alone.
- Comparing boosting and bagging as if they fix the same problem. Boosting lowers bias; bagging lowers variance.

## Quick check
Q: What is the main difference between bagging and boosting?
A: Bagging trains models independently on random samples and averages them, which lowers variance. Boosting trains models in sequence, each focused on earlier mistakes, which lowers bias.

Q: In AdaBoost, what happens to the weights of the cases a rule got wrong?
A: They are multiplied up and then all weights are divided by their total, so the mistakes carry more weight in the next round.

Q: A rule has a weighted error of exactly 0.5. What vote size does it get?
A: Zero, because the ratio of right to wrong weight is 1 and the logarithm of 1 is 0. It is no better than a coin flip, so it is ignored.

Q: When would you use linear discriminant analysis instead of a boosted model?
A: As a quick baseline when you have little data and the classes look like bell-shaped clouds of similar shape. Boosted trees usually win on larger, messier tables.
