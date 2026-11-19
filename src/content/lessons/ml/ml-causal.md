---
id: ml-causal
title: Cause and effect, an introduction to causal inference
module: ml
level: Intermediate
minutes: 75
maths: basic arithmetic
goal: Explain why a plain comparison of treated and untreated groups can mislead, remove the bias by adjusting for a confounder or by randomising, and read a simple causal diagram.
prereqs: ml-evaluation
reviewed: 2026-11-19
evidence: A table showing the naive effect, the adjusted effect and the randomised effect for one dataset, with a sentence saying which you trust and why.
code: Python executed 2026-11-19 (examples/causal/causal.py, NumPy only); the C# version prints the same output
---
## In plain words
A model can learn that two things go together. It cannot, by itself, tell whether one causes the other. Ice-cream sales and drowning both rise in summer, but ice cream does not drown anyone. Heat drives both. That hidden driver is a **confounder**. Causal questions are the ones businesses care about: does this discount raise sales, does this treatment help patients, does this feature keep users? A plain comparison of the people who got the discount with those who did not can be badly wrong, because the people who got it may differ in other ways. Two honest fixes exist. In a **randomised experiment** a coin decides who gets the treatment, so no hidden factor can line up with it. When you cannot randomise, you can **adjust**: compare like with like, within groups of people who are similar on the confounder. A **causal diagram** draws the arrows you believe in, so you know what to adjust for. **Uplift modelling** estimates the effect of an action on each person, so you act only where it helps.

```diagram compare Correlation and causation
note: Prediction asks what goes with what. Causal inference asks what would change if we acted.
## Correlation | process
- Two things move together
- Good enough to predict
## Causation | model
- Changing one changes the other
- Needed to decide what to do
```

```diagram flow How a confounder creates a false effect
note: The confounder drives both the treatment and the outcome, so the comparison is unfair.
- A hidden factor, such as how severe a case is | It affects who gets treated | warn
- More severe cases get the treatment more often | Treated and untreated groups differ | process
- Severe cases also have different outcomes | The difference gets blamed on the treatment | bad
```

```diagram compare Two ways to get a fair comparison
note: Randomising is the strongest. Adjusting only handles the factors you measured.
## Randomise | output
- A coin decides who is treated
- Groups are alike on everything, measured or not
## Adjust | process
- Compare like with like within groups
- Only fixes confounders you have recorded
```

```diagram flow Reading a causal diagram
note: Draw an arrow from cause to effect. A factor with arrows into both is a confounder.
- Draw each variable as a node | Treatment, outcome and other factors | input
- Draw arrows for the effects you believe in | From cause to effect | process
- Find factors with arrows into both ends | These are the confounders | model
- Adjust for them, or randomise | Then the comparison is fair | output
```

## Real-world example
A hospital compares patients who got a new treatment with those who did not, and finds that the treated patients did worse. The treatment looks harmful. But doctors gave the treatment mainly to the most seriously ill patients, and serious illness is what makes outcomes worse. Severity is the confounder. When the analysts compare treated and untreated patients with the same severity, the treatment helps. A randomised trial would have avoided the problem by deciding treatment with a coin. A marketing team uses the same idea with discounts: if the discount was sent mostly to loyal customers, the raw comparison overstates its effect.

## How it works
1. **Write the question as an effect.** Compare the outcome with and without the treatment for the same kind of person.
2. **Draw the diagram.** List the factors that affect both the treatment and the outcome.
3. **Choose the fix.** Randomise if you can. Otherwise compare within groups of the confounder and combine the group effects, weighting each group by its size.
4. **Check what you assumed.** Adjusting only removes the bias from the factors you included. A confounder you did not measure still biases the answer.
5. **Use it.** For each person, an uplift model predicts how much the action changes the outcome, so you contact only those who will respond because of it.

```maths A false effect from a confounder, by hand
situation: 20 patients. In the severe group, 8 of 10 get the treatment. In the mild group, 2 of 10 do. Severe cases score 4 points higher on this outcome. The treatment itself adds exactly 2 points. Baselines are 14 for severe and 10 for mild. Made-up numbers.
find: What does the plain comparison of treated against untreated say, and what is the true effect?
step: Average outcome of the treated (8 severe at 16, 2 mild at 12) | (8 × 16 + 2 × 12) ÷ 10 = 15.2
step: Average outcome of the untreated (2 severe at 14, 8 mild at 10) | (2 × 14 + 8 × 10) ÷ 10 = 10.8
step: The plain difference | 15.2 - 10.8 = 4.4
result: The plain comparison says the treatment adds 4.4 points. The true effect is 2. The extra 2.4 is the confounder: the treated group contained mostly severe cases.
why: Without looking inside each group you would report an effect more than twice the real one. The same mistake in the other direction can make a helpful treatment look harmful.
try: Compare within the severe group only. What is the effect there?
answer: Treated severe patients average 16 and untreated severe patients average 14, so the effect is 16 - 14 = 2, which is the true effect.
```

## Python example
200 patients from a repeatable rule. A hidden factor z (1 means a more severe case) raises the outcome by 4 and makes treatment more likely. The treatment adds exactly 2, so the true effect is 2. The program compares treated and untreated in three ways: plainly, adjusted for z, and in a randomised version where a coin decides treatment.

```python causal.py
"""Why a plain comparison can mislead: a confounder, an adjustment, and a randomised experiment.

200 patients. A hidden factor z (1 = a more severe case) raises the outcome by 4 and makes treatment more likely.
The treatment itself adds exactly 2 to the outcome, so the true effect is 2. Data come from a repeatable rule.
Run:  python causal.py   (needs numpy)
"""
import numpy as np

n = 200
i = np.arange(n)
z = ((i * 0.6180339887498949) % 1.0 < 0.5).astype(int)                 # 1 = more severe case
u = (i * 0.7548776662466927) % 1.0
treated = (u < np.where(z == 1, 0.8, 0.2)).astype(int)                 # severe cases are treated more often
wobble = 0.5 * np.sin(5.0 * i)
outcome = 10 + 4 * z + 2 * treated + wobble                            # higher is better here

naive = outcome[treated == 1].mean() - outcome[treated == 0].mean()
print("treated %d, untreated %d" % (treated.sum(), n - treated.sum()))
print("naive difference in average outcome: %.3f" % naive)
effects, weights = [], []
for g in (0, 1):
    m = z == g
    e = outcome[m & (treated == 1)].mean() - outcome[m & (treated == 0)].mean()
    effects.append(e); weights.append(m.sum() / n)
    print("  within group z=%d (%d patients): effect %.3f" % (g, m.sum(), e))
print("adjusted for z (weighted by group size): %.3f   true effect: 2" % sum(e * w for e, w in zip(effects, weights)))

coin = ((i * 0.5698402909980532) % 1.0 < 0.5).astype(int)              # treatment decided by a coin flip instead
outcome2 = 10 + 4 * z + 2 * coin + wobble
print("randomised experiment, plain difference: %.3f" % (outcome2[coin == 1].mean() - outcome2[coin == 0].mean()))
```
```text Output of causal.py (executed)
treated 100, untreated 100
naive difference in average outcome: 4.312
  within group z=0 (100 patients): effect 2.000
  within group z=1 (100 patients): effect 1.981
adjusted for z (weighted by group size): 1.990   true effect: 2
randomised experiment, plain difference: 2.005
```
The plain difference is 4.312, more than twice the true effect of 2, because treated patients were mostly severe. Within each group of z the effect is 2.000 and 1.981. Combined with weights for the group sizes it gives 1.990, close to 2. In the randomised version the plain difference is 2.005, because the coin makes the groups alike.

```maths Combining the group effects
situation: Within the mild group (100 patients) the effect is 2.000. Within the severe group (100 patients) it is 1.981. Each group is half of the 200 patients.
find: What is the adjusted effect?
step: Weight of each group | 100 ÷ 200 = 0.5
step: Weighted sum of the two effects | 2.000 × 0.5 + 1.981 × 0.5 ≈ 1.99
step: Bias in the plain comparison | 4.312 - 2 = 2.312
result: The adjusted effect is about 1.99, within 0.01 of the truth. The plain comparison was off by 2.312.
why: Averaging the within-group effects removes the confounder's pull. The small gap from 2 is chance in this sample.
caution: This worked because z is the only confounder and we measured it. In real data there are usually others you cannot see.
try: If the mild group had 150 patients and the severe group 50, with the same two effects, what would the adjusted effect be?
answer: 2.000 × 0.75 + 1.981 × 0.25 = 1.5 + 0.495 = 1.995. The larger group counts for more.
```

## .NET (C#) example
Plain comparison, adjustment and randomisation written from scratch in C#, with no packages, printing the same output. Microsoft's ecosystem has no mainstream causal-inference library for .NET, so causal modelling is usually done in Python with libraries such as DoWhy or EconML, and the results are used from .NET.

```cs Program.cs
// Confounding, adjustment and a randomised experiment, from scratch. Same output as causal.py. No packages.
const int n = 200;
int[] z = new int[n], treated = new int[n], coin = new int[n];
double[] outcome = new double[n], outcome2 = new double[n];
for (int i = 0; i < n; i++)
{
    z[i] = (i * 0.6180339887498949) % 1.0 < 0.5 ? 1 : 0;                    // 1 = more severe case
    double u = (i * 0.7548776662466927) % 1.0;
    treated[i] = u < (z[i] == 1 ? 0.8 : 0.2) ? 1 : 0;                       // severe cases are treated more often
    double wobble = 0.5 * Math.Sin(5.0 * i);
    outcome[i] = 10 + 4 * z[i] + 2 * treated[i] + wobble;                   // higher is better here
    coin[i] = (i * 0.5698402909980532) % 1.0 < 0.5 ? 1 : 0;                 // treatment decided by a coin flip instead
    outcome2[i] = 10 + 4 * z[i] + 2 * coin[i] + wobble;
}
double Mean(IEnumerable<int> rows, double[] y) => rows.Average(i => y[i]);
var all = Enumerable.Range(0, n);
double naive = Mean(all.Where(i => treated[i] == 1), outcome) - Mean(all.Where(i => treated[i] == 0), outcome);
Console.WriteLine($"treated {treated.Sum()}, untreated {n - treated.Sum()}");
Console.WriteLine($"naive difference in average outcome: {naive:F3}");
double adjusted = 0;
foreach (int g in new[] { 0, 1 })
{
    var m = all.Where(i => z[i] == g).ToList();
    double e = Mean(m.Where(i => treated[i] == 1), outcome) - Mean(m.Where(i => treated[i] == 0), outcome);
    adjusted += e * m.Count / n;
    Console.WriteLine($"  within group z={g} ({m.Count} patients): effect {e:F3}");
}
Console.WriteLine($"adjusted for z (weighted by group size): {adjusted:F3}   true effect: 2");
Console.WriteLine($"randomised experiment, plain difference: {Mean(all.Where(i => coin[i] == 1), outcome2) - Mean(all.Where(i => coin[i] == 0), outcome2):F3}");
```

## Maths behind it
- Averages and differences of averages (statistics)
- Weighted averages by group size (arithmetic)
- Conditional comparison: within a group (probability)
- Randomisation: a coin removes the link between treatment and other factors (probability)

## Common mistakes
- Reading a difference between treated and untreated groups as the effect of the treatment.
- Adjusting for a factor that is caused by the treatment, which can hide part of the real effect.
- Believing an adjusted result removes every confounder. It only removes the ones you measured.
- Running a model that predicts the outcome and using it to choose actions without asking what the action changes.
- Using an uplift model without checking it on a randomised sample.

## Quick check
Q: What is a confounder?
A: A factor that affects both who gets the treatment and the outcome, so it can make a comparison of treated and untreated groups unfair.

Q: Why does randomisation give a fair comparison?
A: A coin decides who is treated, so the groups are alike on every other factor, measured or not.

Q: In the example, the plain difference was 4.312 and the true effect was 2. Why?
A: The treated group had far more severe cases, and severe cases score higher on the outcome for reasons unrelated to the treatment. The plain difference mixed the two.

Q: What can adjusting not do?
A: It cannot remove the bias from a confounder you did not measure.
