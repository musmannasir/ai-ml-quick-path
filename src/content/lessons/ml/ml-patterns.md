---
id: ml-patterns
title: Anomalies, patterns and density
module: ml
level: Intermediate
minutes: 60
maths: algebra
goal: Use Mahalanobis distance to judge how unusual a point is given how the features move together, use a kernel density estimate to see where data is crowded, and find shopping-basket rules with support, confidence and lift.
prereqs: ml-unsupervised
reviewed: 2026-11-18
evidence: A small table showing two points at the same straight-line distance but different Mahalanobis distances, and the support, confidence and lift of one rule on a dataset you choose.
code: Python executed 2026-11-18 (examples/patterns/patterns.py); the C# version prints the same numbers
---
## In plain words
Three tools help you find what is unusual and what goes together. First, **Mahalanobis distance** measures how far a point is from the centre of the data, but it takes into account how features move together. Suppose height and weight usually rise together. A person who is tall and light is more unusual than one who is tall and heavy, even if both are the same straight-line distance from the average. Second, a **kernel density estimate** draws a smooth picture of where data is crowded by placing a small bell-shaped bump over every data value and adding the bumps up. Third, **association rules** such as "people who buy bread often buy milk" are found by counting baskets, using three numbers: support, confidence and lift.

```diagram compare Straight-line and Mahalanobis distance
note: Mahalanobis distance asks whether a point fits the usual pattern, not only how far it is.
## Straight-line distance | process
- Counts every direction the same
- Ignores how features move together
## Mahalanobis distance | model
- Stretches along the usual pattern
- Large when a point breaks the pattern
```

```diagram flow How a kernel density estimate is built
note: Where bumps pile up, the estimate is high. Where data is thin, it is low.
- Put a small bell-shaped bump on every data value | The width is a setting called bandwidth | input
- Add all the bumps together | Crowded places pile up | process
- Read the height at any point | High is crowded, low is rare | output
```

```diagram flow The three numbers of an association rule
note: A rule is worth a look when confidence is high and lift is clearly above one.
- Support | How often the items appear together in all baskets | input
- Confidence | Of baskets with the first item, how many also have the second | process
- Lift | How much more often than chance the two go together | output
```

## Real-world example
A card company watches two features of each purchase: the amount, and the distance from the cardholder's home. Large amounts and long distances usually go together on holiday trips, so a large amount far from home is normal. A large amount close to home, or a small amount very far away, breaks the usual pattern. Straight-line distance cannot tell these apart, but Mahalanobis distance flags the odd ones. Separately, a supermarket counts baskets and finds that people who buy bread also buy milk more often than chance, and uses the rule to place the two close together.

## How it works
1. **Mahalanobis.** Find the average of each feature and the covariance table (how each pair of features moves together). Invert that table. For a new point, the squared distance is its difference from the average, times the inverted table, times the same difference again.
2. **Density.** For any value, add up the height of a small bell curve centred on every data value. Divide by the number of values.
3. **Association rules.** Count baskets. Support of a rule is the share of all baskets that contain both items. Confidence is the share of baskets with the first item that also have the second. Lift is the confidence divided by how common the second item is on its own.

```maths Support, confidence and lift
situation: Eight shopping baskets. Bread is in 5 of them, milk is in 6, and both are together in 4. Made-up counts.
find: Support, confidence and lift for the rule "bread then milk".
step: Support (baskets with both, out of all 8) | 4 ÷ 8 = 0.5
step: Confidence (baskets with both, out of baskets with bread) | 4 ÷ 5 = 0.8
step: Share of all baskets that contain milk | 6 ÷ 8 = 0.75
step: Lift (confidence divided by the share with milk) | 0.8 ÷ 0.75 ≈ 1.067
result: Half of all baskets have both. Of the bread baskets, 80% also have milk. Lift is 1.067, only a little above 1.
why: Lift keeps you honest. Milk is already in 75% of baskets, so 80% is only a small step up. A lift of 1 means no link at all, and well above 1 means a real link.
caution: Rules found by counting show a link, not a cause. Moving bread next to milk may change nothing.
try: If milk were in only 40% of baskets, what would the lift of the same rule be?
answer: 0.8 ÷ 0.4 = 2. Now bread baskets have milk twice as often as chance, which is a strong link.
```

## Live simulation
Anomaly detection ranks points by how unusual they are, then a flag rate decides how many to act on.

```sim anom Finding anomalies with a distance score
question: How do we find the unusual points in data when nobody has labelled them?
watch: Each point's score is its distance to its 5th nearest neighbour. A point far from everything gets a high score.
watch: You choose what share of points to flag. Reveal the real anomalies to see how many were caught and how many flags were false alarms.
watch: Raise the share and watch false alarms grow faster than catches.
try: all | Catch all 4 real anomalies with at most 2 false alarms.
predict: At 5% all four real anomalies are caught. You raise the share to 10%. What happens? | More real anomalies are caught | The same four are caught, and the extra flags are false alarms | False alarms fall
answer: 2 | All four were already caught, so the extra flagged points can only be normal points: 5 false alarms at 10%, against 1 at 5%.
leaves-out: 84 made-up points in two dimensions, with 4 planted anomalies we know about. In real work nobody knows the true anomalies, so the flag rate is chosen from the cost of a miss against the cost of a false alarm. Other methods (isolation forest, density) behave differently on real data.
reference: examples/sim-core/core.py
```

## Python example
Three small demonstrations in one file: Mahalanobis distance for two points at nearly the same straight-line distance, a kernel density estimate on twelve values, and the three numbers of a rule on eight baskets.

```python patterns.py
"""Three pattern tools: Mahalanobis distance, kernel density, and association rules (support, confidence, lift).

Run:  python patterns.py   (needs numpy)
"""
import numpy as np

# 1. Mahalanobis distance: how unusual is a point, given how the data usually moves together?
i = np.arange(30)
x = 2.0 * np.sin(0.9 * i)
y = 0.8 * x + 0.3 * np.cos(2.1 * i)                             # y follows x, with a little wobble
P = np.column_stack([x, y])
mu = P.mean(axis=0)
cov = np.cov(P, rowvar=False)
inv = np.linalg.inv(cov)
for q in ((1.5, 1.2), (1.5, -1.2)):                              # same distance from the centre, different direction
    v = np.array(q) - mu
    print("point (%.1f, %.1f): straight-line distance %.3f  Mahalanobis distance %.3f" % (q[0], q[1], np.sqrt(v @ v), np.sqrt(v @ inv @ v)))

# 2. Kernel density: add a small bell curve over every data value
vals = np.array([1.0, 1.2, 1.5, 1.9, 2.1, 2.4, 6.0, 6.3, 6.5, 6.8, 7.1, 12.0])
def density(at, h=0.5):
    return float(np.mean(np.exp(-0.5 * ((at - vals) / h) ** 2) / (h * np.sqrt(2 * np.pi))))
print("density at 2.0: %.3f   at 4.5: %.3f   at 12.0: %.3f" % (density(2.0), density(4.5), density(12.0)))

# 3. Association rules on eight shopping baskets
baskets = [{"bread", "milk"}, {"bread", "eggs"}, {"bread", "milk", "eggs"}, {"milk"},
           {"bread", "milk"}, {"eggs"}, {"bread", "milk", "tea"}, {"tea", "milk"}]
def share(items):
    return sum(items <= b for b in baskets) / len(baskets)
s_both, s_bread, s_milk = share({"bread", "milk"}), share({"bread"}), share({"milk"})
print("bread and milk: support %.3f  confidence(bread -> milk) %.3f  lift %.3f" % (s_both, s_both / s_bread, (s_both / s_bread) / s_milk))
```
```text Output of patterns.py (executed)
point (1.5, 1.2): straight-line distance 1.847  Mahalanobis distance 1.017
point (1.5, -1.2): straight-line distance 1.907  Mahalanobis distance 11.145
density at 2.0: 0.246   at 4.5: 0.001   at 12.0: 0.066
bread and milk: support 0.500  confidence(bread -> milk) 0.800  lift 1.067
```
The two points are almost the same straight-line distance from the centre (1.847 and 1.907), but their Mahalanobis distances are 1.017 and 11.145. The second point goes against the pattern in which y follows x, so it is far more unusual. The density is high at 2.0 (0.246), where several values sit together, and almost zero at 4.5 (0.001), where there is a gap. A single value at 12.0 has a small bump of its own (0.066). In the baskets, the rule bread to milk has support 0.500, confidence 0.800 and lift 1.067.

```maths Comparing the two distances
situation: The second point had a straight-line distance of 1.907 and a Mahalanobis distance of 11.145. The first point had 1.847 and 1.017.
find: How different are the two points under each measure?
step: Ratio of the straight-line distances | 1.907 ÷ 1.847 ≈ 1.03
step: Ratio of the Mahalanobis distances | 11.145 ÷ 1.017 ≈ 10.96
result: By straight-line distance the second point looks only 3% further out. By Mahalanobis distance it is about 11 times further out.
why: The unusual point is not far away, it is in the wrong direction. In many real fraud and fault problems that is exactly the case, which is why Mahalanobis distance is a common anomaly score.
try: A rule of thumb flags points whose Mahalanobis distance is above about 3 in this kind of data. Which of the two points is flagged?
answer: Only the second (11.145 is above 3, while 1.017 is below). Treat 3 as a rough guide, not a law.
```

## .NET (C#) example
Everything here is written from scratch in C#, with no packages: the 2 by 2 inverse is worked out by hand, the density is a simple average of bell curves, and the rule numbers are counts. It prints the same numbers as the Python run. ML.NET also offers PCA-based anomaly detection for the same purpose.

```cs Program.cs
// Same numbers as patterns.py, written from scratch with no packages.
// 1. Mahalanobis distance
int m = 30;
double[] x = Enumerable.Range(0, m).Select(i => 2.0 * Math.Sin(0.9 * i)).ToArray();
double[] y = Enumerable.Range(0, m).Select(i => 0.8 * x[i] + 0.3 * Math.Cos(2.1 * i)).ToArray();   // y follows x, with a little wobble
double mx = x.Average(), my = y.Average();
double sxx = x.Sum(v => (v - mx) * (v - mx)) / (m - 1);
double syy = y.Sum(v => (v - my) * (v - my)) / (m - 1);
double sxy = Enumerable.Range(0, m).Sum(i => (x[i] - mx) * (y[i] - my)) / (m - 1);
double det = sxx * syy - sxy * sxy;                               // inverse of a 2x2 table by hand
foreach (var (qx, qy) in new[] { (1.5, 1.2), (1.5, -1.2) })       // same distance from the centre, different direction
{
    double vx = qx - mx, vy = qy - my;
    double straight = Math.Sqrt(vx * vx + vy * vy);
    double mahal = Math.Sqrt((syy * vx * vx - 2 * sxy * vx * vy + sxx * vy * vy) / det);
    Console.WriteLine($"point ({qx:F1}, {qy:F1}): straight-line distance {straight:F3}  Mahalanobis distance {mahal:F3}");
}

// 2. Kernel density: add a small bell curve over every data value
double[] vals = { 1.0, 1.2, 1.5, 1.9, 2.1, 2.4, 6.0, 6.3, 6.5, 6.8, 7.1, 12.0 };
double Density(double at, double h = 0.5) =>
    vals.Average(v => Math.Exp(-0.5 * Math.Pow((at - v) / h, 2)) / (h * Math.Sqrt(2 * Math.PI)));
Console.WriteLine($"density at 2.0: {Density(2.0):F3}   at 4.5: {Density(4.5):F3}   at 12.0: {Density(12.0):F3}");

// 3. Association rules on eight shopping baskets
var baskets = new List<HashSet<string>> {
    new() { "bread", "milk" }, new() { "bread", "eggs" }, new() { "bread", "milk", "eggs" }, new() { "milk" },
    new() { "bread", "milk" }, new() { "eggs" }, new() { "bread", "milk", "tea" }, new() { "tea", "milk" } };
double Share(params string[] items) => baskets.Count(b => items.All(b.Contains)) / (double)baskets.Count;
double both = Share("bread", "milk"), bread = Share("bread"), milk = Share("milk");
Console.WriteLine($"bread and milk: support {both:F3}  confidence(bread -> milk) {both / bread:F3}  lift {both / bread / milk:F3}");
```

## Maths behind it
- Covariance and the inverse of a 2 by 2 table (linear algebra, statistics)
- The bell curve (normal density) used as a kernel (probability)
- Counting shares: support, confidence and lift (probability)

## Common mistakes
- Using straight-line distance for anomalies when features move together.
- Using a density bandwidth that is far too small (every value its own bump) or too large (everything blurred).
- Calling a rule "interesting" because its confidence is high, without checking lift.
- Treating a basket rule as a cause.
- Computing Mahalanobis distance with too few points. The covariance table needs plenty of data.

## Quick check
Q: Two points are the same straight-line distance from the average. When would they have very different Mahalanobis distances?
A: When the features move together. A point along the usual pattern is close in Mahalanobis terms, and a point against the pattern is far.

Q: What does a lift of exactly 1 mean for an association rule?
A: No link. The two items appear together exactly as often as chance would predict.

Q: What does the bandwidth control in a kernel density estimate?
A: The width of each bell-shaped bump. Small bumps give a spiky picture that follows every value. Large bumps give a blurry picture.

Q: Out of 10 baskets, 6 have bread and 3 have both bread and milk. What is the confidence of "bread then milk"?
A: 3 ÷ 6 = 0.5. Half of the baskets with bread also have milk.
