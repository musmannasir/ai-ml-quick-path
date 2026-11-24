---
id: ml-bayes
title: Thinking in probabilities
module: ml
level: Advanced
minutes: 75
maths: algebra
goal: Update a belief with Bayes' rule, read a small Bayesian network, explain how a Markov chain Monte Carlo sampler explores a distribution, and follow a one-number Kalman filter.
prereqs: ml-evaluation
reviewed: 2026-11-19
updated: 2026-11-24
evidence: Bayes' rule worked for a test with its false alarms, a probability of rain given wet grass from a small network, and the estimate and uncertainty after each measurement of a Kalman filter.
code: Python executed 2026-11-19 (examples/bayes/bayes.py, standard library only); the C# version prints the same output
---
## In plain words
Most models give one answer. A probabilistic model says how sure it is, and updates as evidence arrives. The rule for updating is **Bayes' rule**: start with a prior belief, multiply by how well each possibility explains the new evidence, and divide so that the beliefs add up to one again. It answers questions like: if a medical test is positive, how likely is the disease? The answer is often much lower than people expect, because most positive results come from the many healthy people. A **Bayesian network** draws the causes and effects as a diagram with a table of chances at each node, and lets you ask "given this, how likely is that?". When the maths is too hard to do exactly, **Markov chain Monte Carlo (MCMC)** wanders through the possible answers, spending more time where they are more likely, and the visits form a picture of the distribution. **Variational inference** instead fits a simple shape to the distribution. A **Kalman filter** is Bayes' rule for a moving thing: it combines a prediction with a noisy measurement and says how uncertain it still is.

```diagram compare Bayes' rule as updating
note: The prior is what you believed. The posterior is what you believe after the evidence.
## Prior | process
- What you believed before
- For example how common a disease is
## Posterior | output
- What you believe after the evidence
- Updated by how well each option explains it
```

```visual A positive test in counts of 10,000 people
file: bayes-people
alt: Two horizontal bars. The first splits 10,000 people into 100 who are ill and 9,900 who are healthy. The second zooms in on the 585 people with a positive test: 90 are really ill and 495 are healthy people with a false alarm. Text below says 90 divided by 585 is about 15 percent, not 90 percent.
caption: Counting people shows why a positive test on a rare illness is usually a false alarm: most positives come from the large healthy group.
```

```diagram flow Metropolis sampling
note: The sampler needs only ratios of likelihoods, not the hard normalising constant.
- Propose a nearby new value | A small random step | input
- Compare how well the new value explains the data | The ratio of likelihoods | process
- Move if better, or sometimes if worse | Otherwise stay put | model
- Record the position and repeat | The visits form the posterior | output
```

```diagram compare Exact inference and sampling
note: Use exact methods when they are feasible, and sampling when they are not.
## Exact (enumeration) | output
- Adds up every possibility
- Gives exact answers, slow for big networks
## Sampling (MCMC) | process
- Draws many examples from the distribution
- Approximate but works for huge models
```

```diagram flow Kalman filter: one update
note: The gain decides how much to trust the measurement against the current estimate.
- Start with an estimate and its uncertainty | Where we think it is, and how sure | input
- Compute the gain from the two uncertainties | Big gain when the estimate is vague | process
- Move the estimate towards the measurement | By the gain times the surprise | model
- Shrink the uncertainty | The new estimate is more certain | output
```

## Real-world example
A hospital screens for a rare disease. The test finds the disease in 90% of people who have it, and wrongly flags 5% of people who do not. Only 1 in 100 people has the disease. A patient tests positive. Most people guess the chance of disease is about 90%. Bayes' rule says it is closer to 15%, because the many healthy people produce more false alarms than the few sick people produce true positives. The hospital therefore follows every positive with a second, more accurate test. A navigation unit in a car uses a Kalman filter in the same spirit: it combines a prediction of where the car is with each noisy GPS reading.

## How it works
1. **Bayes' rule.** For each possibility, multiply its prior by the chance of the evidence under it. Divide each result by the total so they add up to one.
2. **Networks.** Each node has a table of chances given its parents. To answer a question, add up the joint chance of every combination consistent with the evidence, then divide.
3. **MCMC.** Start anywhere. Propose a nearby value. Move to it if its likelihood is higher, and otherwise move with a chance equal to the ratio of likelihoods. After a warm-up, the visits are samples from the posterior.
4. **Kalman filter.** For one number, the gain is the current uncertainty divided by that uncertainty plus the measurement's uncertainty. The estimate moves by the gain times the surprise, and the uncertainty shrinks by the same factor.
5. **Related tools.** **Bayesian optimisation** chooses the next setting to try by modelling what it has seen, and is popular for tuning expensive models. **Probabilistic programming** languages let you write a model and ask for its posterior.

```maths Bayes' rule for a medical test
situation: 1 person in 100 has a disease. The test is positive for 90% of people who have it, and for 5% of people who do not. A patient tests positive. Made-up numbers.
find: What is the chance that the patient has the disease?
step: Sick people who test positive, per person | 0.01 × 0.9 = 0.009
step: Healthy people who test positive, per person | 0.99 × 0.05 = 0.0495
step: All positive tests per person | 0.009 + 0.0495 = 0.0585
step: Share of positives who are really sick | 0.009 ÷ 0.0585 ≈ 0.154
result: About 15%, not 90%. Most positive results come from the large healthy group.
formula: chance of disease given positive = (chance sick and positive) ÷ (chance of any positive)
why: The result depends on how common the disease is. The same test on a group where the disease is common would give a much higher answer. This is the idea behind spam filters and many diagnostic models.
try: If 10 people in 100 had the disease instead, what would the chance be?
answer: 0.1 × 0.9 = 0.09 and 0.9 × 0.05 = 0.045, so 0.09 ÷ (0.09 + 0.045) = 0.667. With a more common disease a positive test is far more convincing.
```

```maths Rain given wet grass, from a small network
situation: Rain has chance 0.2. The sprinkler is on with chance 0.01 when it rains and 0.4 when it does not. The grass is wet with chance 0.99 if both rain and sprinkler, 0.8 if only rain, 0.9 if only the sprinkler, and 0 if neither. Made-up numbers.
find: Given the grass is wet, how likely is it that it rained?
step: Rain and sprinkler both, grass wet | 0.2 × 0.01 × 0.99 = 0.00198
step: Rain without the sprinkler, grass wet | 0.2 × 0.99 × 0.8 = 0.1584
step: All wet-grass cases with rain | 0.00198 + 0.1584 = 0.16038
step: No rain, sprinkler on, grass wet | 0.8 × 0.4 × 0.9 = 0.288
step: All wet-grass cases | 0.16038 + 0.288 = 0.44838
step: Rain given wet grass | 0.16038 ÷ 0.44838 ≈ 0.3577
result: The grass is wet in about 45% of days and, on a wet day, it rained about 36% of the time.
why: Rain was 20% likely at first. Wet grass raised it to 36%, but the sprinkler explains much of the wet grass, so the rise is modest. This "explaining away" is typical of networks.
```

```maths One Metropolis decision for a coin
situation: A coin showed 7 heads in 10 flips. The likelihood of a chance p of heads is p to the power 7 times (1 minus p) to the power 3. The sampler is at p = 0.5 and proposes 0.6, then 0.9.
find: Does it move, and with what chance?
step: Likelihood at the current value 0.5 | 0.5^7 × 0.5^3 ≈ 0.000977
step: Likelihood at the proposal 0.6 | 0.6^7 × 0.4^3 ≈ 0.001792
step: Ratio, proposal over current | 0.001792 ÷ 0.000977 ≈ 1.834
step: Likelihood at the second proposal 0.9 | 0.9^7 × 0.1^3 ≈ 0.000478
step: Ratio for 0.9 | 0.000478 ÷ 0.000977 ≈ 0.489
result: A ratio above 1 means it always moves to 0.6. A ratio of 0.489 means it moves to 0.9 about 49% of the time and otherwise stays.
why: Always accepting better values and sometimes accepting worse ones lets the sampler climb to the likely region without getting stuck, and spend time in proportion to how likely each value is.
```

```maths One Kalman update
situation: The estimate starts at 0 with a very large uncertainty (variance 100). The first measurement is 5.1 and the measurement uncertainty (variance) is 1.
find: What are the new estimate and its uncertainty?
step: The gain, uncertainty over uncertainty plus measurement noise | 100 ÷ (100 + 1) ≈ 0.9901
step: New estimate, moved by the gain times the surprise (5.1 minus 0) | 0 + 0.9901 × 5.1 ≈ 5.0495
step: New uncertainty | (1 - 0.9901) × 100 ≈ 0.99
result: The estimate jumps to about 5.05 and the uncertainty falls from 100 to about 0.99.
why: When we know almost nothing, the first measurement is nearly all of what we know. As the uncertainty shrinks, the gain falls and each new measurement moves the estimate less.
try: With the uncertainty now 0.99, what is the gain for the next measurement?
answer: 0.99 ÷ (0.99 + 1) ≈ 0.4975. The filter now gives the new measurement about half the weight.
```

## Live simulation
A positive test is evidence, not proof. The numbers behind it are easiest to see as counts of people.

```sim bay How likely is illness after a positive test?
question: Why does a positive result from a good test often still mean "probably fine"?
watch: Out of 10,000 people, the first bar splits them into ill and healthy. The second bar shows only those with a positive test.
watch: When the illness is rare, a small false-alarm rate on a large healthy group can produce more false alarms than true cases.
watch: A second independent positive test changes the odds again.
try: rare | Make the illness rare (1% or less) and see the chance of illness after a positive test drop below 20%.
try: twice | Starting from an illness that affects at least 5% of people, switch on the second positive test and bring the chance of illness to 90% or more.
predict: A test catches 95% of illnesses and clears 90% of healthy people. Only 1% of people are ill. You test positive. About how likely are you to be ill? | About 95% | About 50% | Under 10%
answer: 3 | Of 10,000 people, 100 are ill and 95 of them test positive. Of 9,900 healthy people, 990 also test positive. So 95 of 1,085 positives are really ill: about 9%.
leaves-out: Made-up percentages, whole-person counts, and the assumption that the two tests are independent. Real tests are often not independent of each other, and the chance of illness for a particular person depends on more than the average rate.
reference: examples/sim-ai/ai.py
```

## Python example
Three demonstrations: enumeration in a small Bayesian network, a Metropolis sampler for a coin that showed 7 heads in 10 flips, and a Kalman filter with five noisy measurements of one number. A small repeatable random generator makes the numbers repeat.

```python bayes.py
"""Thinking in probabilities: a small Bayesian network, a Metropolis (MCMC) sampler for a coin, and a one-number Kalman filter.

Run:  python bayes.py
"""
import math

# 1. A tiny Bayesian network: rain, sprinkler, wet grass. What is the chance of rain, given the grass is wet?
p_rain = 0.2
p_spr = {True: 0.01, False: 0.4}                                    # sprinkler on, given rain / no rain
p_wet = {(True, True): 0.99, (True, False): 0.8, (False, True): 0.9, (False, False): 0.0}   # wet, given (rain, sprinkler)
joint = {}
for rain in (True, False):
    for spr in (True, False):
        pr = (p_rain if rain else 1 - p_rain) * (p_spr[rain] if spr else 1 - p_spr[rain]) * p_wet[(rain, spr)]
        joint[(rain, spr)] = pr
p_w = sum(joint.values())
print("chance the grass is wet: %.4f   chance of rain given wet grass: %.4f" % (p_w, sum(v for (r, s), v in joint.items() if r) / p_w))

# 2. Metropolis sampler for a coin's chance of heads after 7 heads in 10 flips, starting from a flat prior
state = 2024
def rnd():
    global state
    state = (1103515245 * state + 12345) % (2 ** 31)
    return state / 2 ** 31
like = lambda p: p ** 7 * (1 - p) ** 3
p, samples = 0.5, []
for step in range(20000):
    q = p + (rnd() - 0.5) * 0.3                                    # propose a nearby value
    if 0 < q < 1 and rnd() < like(q) / like(p):                    # accept if likelier, or sometimes if less likely
        p = q
    if step >= 2000:
        samples.append(p)
mean = sum(samples) / len(samples)
sd = math.sqrt(sum((s - mean) ** 2 for s in samples) / len(samples))
print("MCMC posterior mean %.3f, spread %.3f   (exact answer: mean 0.667, spread 0.131)" % (mean, sd))

# 3. Kalman filter for one unknown number, measured five times with noise of variance 1
est, var = 0.0, 100.0                                              # a vague starting guess
print("measurement  estimate  uncertainty (variance)")
for z in (5.1, 4.8, 5.3, 4.9, 5.0):
    gain = var / (var + 1.0)                                       # how much to trust the new measurement
    est, var = est + gain * (z - est), (1 - gain) * var
    print("%11.1f  %8.3f  %12.3f" % (z, est, var))
```
```text Output of bayes.py (executed)
chance the grass is wet: 0.4484   chance of rain given wet grass: 0.3577
MCMC posterior mean 0.664, spread 0.132   (exact answer: mean 0.667, spread 0.131)
measurement  estimate  uncertainty (variance)
        5.1     5.050         0.990
        4.8     4.925         0.498
        5.3     5.050         0.332
        4.9     5.012         0.249
        5.0     5.010         0.200
```
The network gives 0.4484 for wet grass and 0.3577 for rain given wet grass, as in the hand calculation. The sampler's posterior mean is 0.664 against an exact 0.667, and its spread 0.132 against an exact 0.131, so 20000 steps gave a good picture. The Kalman estimate settles near 5.0 and its uncertainty falls from 0.990 to 0.200 over five measurements.

## .NET (C#) example
Enumeration, Metropolis sampling and a Kalman filter written from scratch in C#, with no packages, printing the same output. For larger probabilistic models in .NET, Microsoft's Infer.NET library was built for this purpose; this guide did not run it, so the code here is plain C#.

```cs Program.cs
// A tiny Bayesian network by enumeration, a Metropolis sampler and a Kalman filter, from scratch.
// Same output as bayes.py. No packages.
double pRain = 0.2;
var pSpr = new Dictionary<bool, double> { [true] = 0.01, [false] = 0.4 };                       // sprinkler on, given rain / no rain
var pWet = new Dictionary<(bool, bool), double> { [(true, true)] = 0.99, [(true, false)] = 0.8, [(false, true)] = 0.9, [(false, false)] = 0.0 };
double pW = 0, pRainAndWet = 0;
foreach (bool rain in new[] { true, false })
    foreach (bool spr in new[] { true, false })
    {
        double pr = (rain ? pRain : 1 - pRain) * (spr ? pSpr[rain] : 1 - pSpr[rain]) * pWet[(rain, spr)];
        pW += pr; if (rain) pRainAndWet += pr;
    }
Console.WriteLine($"chance the grass is wet: {pW:F4}   chance of rain given wet grass: {pRainAndWet / pW:F4}");

// Metropolis sampler for a coin's chance of heads after 7 heads in 10 flips, starting from a flat prior
long state = 2024;
double Rnd() { state = (1103515245L * state + 12345) % (1L << 31); return state / (double)(1L << 31); }
double Like(double p) => Math.Pow(p, 7) * Math.Pow(1 - p, 3);
double pc = 0.5; var samples = new List<double>();
for (int step = 0; step < 20000; step++)
{
    double q = pc + (Rnd() - 0.5) * 0.3;                                                       // propose a nearby value
    if (q > 0 && q < 1 && Rnd() < Like(q) / Like(pc)) pc = q;                                   // accept if likelier, or sometimes if less likely
    if (step >= 2000) samples.Add(pc);
}
double mean = samples.Average();
double sd = Math.Sqrt(samples.Sum(s => (s - mean) * (s - mean)) / samples.Count);
Console.WriteLine($"MCMC posterior mean {mean:F3}, spread {sd:F3}   (exact answer: mean 0.667, spread 0.131)");

// Kalman filter for one unknown number, measured five times with noise of variance 1
double est = 0.0, variance = 100.0;                                                             // a vague starting guess
Console.WriteLine("measurement  estimate  uncertainty (variance)");
foreach (double m in new[] { 5.1, 4.8, 5.3, 4.9, 5.0 })
{
    double gain = variance / (variance + 1.0);                                                  // how much to trust the new measurement
    est += gain * (m - est); variance = (1 - gain) * variance;
    Console.WriteLine($"{m,11:F1}  {est,8:F3}  {variance,12:F3}");
}
```

## Maths behind it
- Conditional probability and Bayes' rule (probability)
- Joint probability by multiplying along a network (probability)
- Ratios of likelihoods (algebra)
- Weighted averages: the Kalman gain (algebra)

## Common mistakes
- Ignoring how common the thing is (the prior) when reading a test result.
- Treating the Metropolis samples before warm-up as if they were from the posterior.
- Running a sampler once and trusting it. Check by starting from different places.
- Believing a network's arrows prove causation. They are your assumptions.
- Setting a Kalman filter's noise values at random instead of from what you know of the sensor.

## Quick check
Q: A rare disease has a test that is right 90% of the time, yet a positive result means only about a 15% chance of disease. Why?
A: Healthy people vastly outnumber sick people, so even a small false-alarm rate produces more false positives than the true positives from the few sick people.

Q: What does Metropolis sampling need from the model?
A: Only the ratio of likelihoods between two values, which avoids the hard step of normalising the distribution.

Q: In a Kalman filter, what happens to the gain as the uncertainty shrinks?
A: It falls, so each new measurement moves the estimate less.

Q: Why use sampling instead of exact enumeration for a large network?
A: Adding up every combination becomes impossibly large, while sampling gives an approximate answer from many drawn examples.
