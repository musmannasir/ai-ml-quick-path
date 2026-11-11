---
id: ml-algorithms
title: The main ML algorithms and when to use each
module: ml
level: Intermediate
minutes: 90
goal: Explain in plain words how linear models, k-nearest neighbours, decision trees, random forests, gradient boosting, support vector machines and naive Bayes work, and choose between them.
prereqs: ml-regression, ml-classification
reviewed: 2026-11-02
evidence: A cross-validated comparison of at least four algorithms on one dataset, with your choice explained by accuracy, speed and explainability.
code: Python executed 2026-11-02 (examples/ai-extras/ai_extras.py algos, gap_topics.py svm); C# not compiled (no .NET SDK in the build environment); added technique snippets (2026-11-05) not run
---
## In plain words
You do not need dozens of algorithms. These cover most industry work with tables of data:

| Algorithm | How it works in one sentence | Good at | Watch out |
|---|---|---|---|
| Linear / logistic regression | Adds up weighted features | Fast, explainable, strong baseline | Only straight-line patterns |
| k-nearest neighbours | Copies the answer of the most similar past examples | Simple, no training | Slow on big data; needs scaling |
| Decision tree | A flowchart of yes/no questions | Very explainable | Overfits easily |
| Random forest | Averages many trees trained on random samples | Robust default | Bigger, slower to predict |
| Gradient boosting (XGBoost, LightGBM, CatBoost) | Builds trees one by one, each fixing the last one's mistakes | Usually the most accurate on tables | Needs tuning; can overfit |
| Support vector machine | Draws the boundary with the widest gap between classes | Small/medium data, clear structure | Slow on large data; needs scaling |
| Naive Bayes | Counts how often words or values appear in each class | Very fast text baseline | Assumes features are independent |

For images, audio and free text, **neural networks** (Part 4) usually win; for tables, **gradient boosting** usually wins.

```diagram compare Linear models, nearest neighbours and naive Bayes
## Linear / logistic regression | process
- Adds up weighted features
- Fast and explainable
- Only straight-line patterns
## k-nearest neighbours | input
- Copies the most similar past examples | Takes their answer
- No training, but slow on big data
## Naive Bayes | store
- Counts words or values in each class | How often each one appears
- Very fast text baseline
```

```diagram compare Three ways to use decision trees
## Decision tree | process
- A flowchart of yes/no questions
- Very explainable, overfits easily
## Random forest | model
- Averages many trees trained on random samples
- Robust default
## Gradient boosting | output
- Builds trees one by one
- Each fixes the last one's mistakes
- Usually the most accurate on tables
```

```diagram compare Support vector machine: the widest gap
note: Needs scaled features. It suits small and medium data and is slow on large data.
## Many lines could separate the classes | warn
- Some lines sit very close to one class
## The support vector machine picks one | output
- The boundary with the widest gap | Between the classes
```

```diagram matrix Which algorithm family for which data
x: Tables of data | Images, audio, free text
y: Usually best | Strong simple baseline
- Gradient boosting | Usually wins on tables | output
- Neural networks (Part 4) | Usually win here | model
- Linear / logistic regression | Fast and explainable | process
- Naive Bayes for text | Very fast text baseline | process
```

## Real-world example
An insurer predicts claim fraud. Gradient boosting is most accurate, but regulators require clear reasons for decisions, so the insurer uses logistic regression for the decision and the boosted model to discover useful features, then explains decisions with reason codes.

```diagram compare Insurer's two models
note: Matches the paragraph above: accuracy and explainability pull in different directions.
## Gradient boosting | model
- Most accurate
- Used to discover useful features
## Logistic regression | output
- Clear reasons, as regulators require
- Makes the decision, with reason codes
```

## How it works
1. Start with a simple baseline (logistic or linear regression).
2. Try a random forest and a gradient-boosting model.
3. Compare them with the same cross-validation folds and the same metric.
4. Weigh accuracy against speed, memory and explainability.
5. Tune the best one or two (see [Improving models](lesson:ml-improve)).

```diagram flow Choosing an algorithm
- Simple baseline | Logistic or linear regression | process
- Try stronger models | Random forest and gradient boosting | model
- Compare fairly | Same cross-validation folds, same metric | process
- Weigh the trade-offs | Accuracy, speed, memory, explainability | warn
- Tune the best one or two | See the lesson on improving models | output
```

### Related concepts
Other problem types you will meet in industry:
- **Uplift modelling**: predicts who will change behaviour *because of* an action (for example a discount), not just who will buy. It needs data from an experiment with a control group.
- **Survival analysis**: predicts *when* something will happen (a customer leaves, a machine fails), handling cases where it has not happened yet.
- **Causal inference**: methods for estimating the effect of an action from data, beyond correlation. A/B tests are the simplest and most reliable form.
- **Ranking (learning to rank)**: ordering items such as search results; used in search engines and recommenders.

```diagram compare Other problem types in industry
## Uplift modelling | model
- Who changes behaviour because of an action
- Needs a control group
## Survival analysis | process
- When something will happen
- Handles cases not yet happened
## Causal inference | output
- Effect of an action, beyond correlation
- A/B tests are the simplest form
## Ranking | input
- Orders items such as search results
- Used in search and recommenders
```

#### Bagging (many models, one vote)
**Bagging** means "bootstrap aggregating". You train many models, each on its own random re-sample of the data, then let them vote (for classes) or average (for numbers). A **bootstrap sample** is a new data set of the same size, made by picking rows at random *with replacement*: a row that was picked goes back in the bag and can be picked again. Everyday example: ask five friends to guess how many sweets are in a jar. Each friend sees only a handful of sweets, so each guess is a little off in its own way. The average of the five guesses is usually closer than a single guess. A random forest is bagging with decision trees (plus random choice of columns).

```diagram flow Bagging: re-sample, train, combine
note: Each model sees a different random re-sample of the same data.
- Training data | All rows | input
- Random re-samples | Pick rows with replacement, many times | process
- One model per sample | Each model learns slightly different quirks | model
- Vote or average | Classes vote; numbers are averaged | output
```

## Python example
Five algorithms on curved, overlapping synthetic data ("two moons"), 5-fold cross-validation:
```text Output of ai_extras.py algos (executed)
logistic regression      accuracy 0.867 (+/- 0.034)
k-nearest neighbours     accuracy 0.908 (+/- 0.009)
decision tree (depth 5)  accuracy 0.892 (+/- 0.021)
random forest            accuracy 0.907 (+/- 0.016)
gradient boosting        accuracy 0.893 (+/- 0.019)
```
Logistic regression can only draw a straight line, so it trails on curved data. The others are within about 1.5 points of each other, which is inside the spread: no clear single winner.

Support vector machines on two rings of points, and why scaling matters:
```text Output of gap_topics.py svm (executed)
linear kernel  accuracy 0.543
RBF kernel     accuracy 1.000
badly scaled feature: without scaling 0.808, with StandardScaler 1.000
support vectors used: 39 of 400 points
```
```python compare models fairly
for name, model in models.items():
    s = cross_val_score(model, X, y, cv=5)          # same folds, same metric for every model
    print(f"{name:<24} accuracy {s.mean():.3f} (+/- {s.std():.3f})")
```

### More techniques in Python: bagging
A tiny bagging demo with plain numpy: each "model" is just the mean of its own bootstrap sample (a stand-in for a real model, to show the idea).
```python bagging_demo.py (not run here)
import numpy as np

rng = np.random.default_rng(0)
data = np.array([10, 12, 11, 13, 9, 14, 8, 12, 11, 10])   # ten made-up values

estimates = []
for _ in range(5):                                         # five "models"
    sample = rng.choice(data, size=len(data), replace=True)  # bootstrap: pick with replacement
    estimates.append(sample.mean())                        # each model learns from its own sample

print("each model says:", estimates)
print("bagged answer (the average):", np.mean(estimates))  # combine by averaging
# For classes, count the votes instead: np.bincount(votes).argmax()
```

## .NET (C#) example
Compare several ML.NET trainers with cross-validation (packages `Microsoft.ML`, `Microsoft.ML.FastTree`, `Microsoft.ML.LightGbm`):
```cs Program.cs
using Microsoft.ML;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Row>("moons.csv", hasHeader: true, separatorChar: ',');
var prep = ml.Transforms.Concatenate("Features", nameof(Row.X1), nameof(Row.X2))
    .Append(ml.Transforms.NormalizeMeanVariance("Features"));

var trainers = new (string Name, IEstimator<ITransformer> Trainer)[]
{
    ("logistic regression", ml.BinaryClassification.Trainers.SdcaLogisticRegression()),
    ("linear SVM",          ml.BinaryClassification.Trainers.LinearSvm()),
    ("random forest",       ml.BinaryClassification.Trainers.FastForest()),
    ("boosted trees",       ml.BinaryClassification.Trainers.FastTree()),
    ("LightGBM",            ml.BinaryClassification.Trainers.LightGbm()),
};
foreach (var (name, trainer) in trainers)
{
    var results = ml.BinaryClassification.CrossValidateNonCalibrated(data, prep.Append(trainer), numberOfFolds: 5);
    Console.WriteLine($"{name,-20} accuracy {results.Average(r => r.Metrics.Accuracy):F3}");
}

public class Row
{
    [Microsoft.ML.Data.LoadColumn(0)] public float X1 { get; set; }
    [Microsoft.ML.Data.LoadColumn(1)] public float X2 { get; set; }
    [Microsoft.ML.Data.LoadColumn(2), Microsoft.ML.Data.ColumnName("Label")] public bool Label { get; set; }
}
```

### More techniques in C#: bagging
A tiny bagging demo in plain C#: the same idea as the Python snippet (each "model" is the mean of its own bootstrap sample).
```cs BaggingDemo.cs (not compiled here)
var data = new double[] { 10, 12, 11, 13, 9, 14, 8, 12, 11, 10 };  // ten made-up values
var rng = new Random(0);
var estimates = new List<double>();

for (int m = 0; m < 5; m++)                        // five "models"
{
    double sum = 0;
    for (int i = 0; i < data.Length; i++)
        sum += data[rng.Next(data.Length)];        // pick with replacement
    estimates.Add(sum / data.Length);              // each model learns from its own sample
}

Console.WriteLine("each model says: " + string.Join(", ", estimates));
Console.WriteLine("bagged answer (the average): " + estimates.Average());
// For classes, count the votes instead: votes.GroupBy(v => v).MaxBy(g => g.Count())!.Key
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Distance (how similar two examples are, for k-nearest neighbours)
**Where it is used:** k-nearest neighbours finds the closest past examples and copies their answer.

```formula Straight-line distance
distance = sqrt( (a1 - b1)^2 + (a2 - b2)^2 + ... )
(a1, a2 are the features of one example; b1, b2 are those of another)
```
**In plain words:** subtract feature by feature, square, add up and take the square root. A small distance means similar examples.

**Example 1: two customers.** A = (age 30, monthly spend 40) and B = (age 34, monthly spend 43). Differences: 4 and 3. Squares: 16 and 9. Sum = 25. Distance = sqrt(25) = 5.

**Example 2: why scaling matters.** A = (age 30, salary 50,000) and B = (age 60, salary 50,100). Differences: 30 and 100. Squares: 900 and 10,000. Sum = 10,900. Distance = sqrt(10,900) = 104.4. Age contributes only 900 ÷ 10,900 = 8% of the sum, so salary swamps it. Scaling both columns first fixes this.

### Gini impurity (how mixed a tree node is)
**Where it is used:** a decision tree picks the yes/no question that makes the groups purer.

```formula Gini impurity
Gini = 1 - sum of (share of each class)^2
(0 = pure group; 0.5 = the worst mix for two classes)
```
**In plain words:** it measures how mixed a group is. The tree prefers splits that lower it.

**Example 1: a 50/50 node.** 10 examples, 5 of each class. Gini = 1 − (0.5^2 + 0.5^2) = 1 − (0.25 + 0.25) = 0.50, the most mixed.

**Example 2: a nearly pure node.** 9 of 10 examples are one class. Gini = 1 − (0.9^2 + 0.1^2) = 1 − (0.81 + 0.01) = 0.18. A node with all 10 of one class has Gini = 1 − (1 + 0) = 0.

### Mean and spread across folds (comparing models fairly)
**Where it is used:** the "accuracy 0.908 (+/- 0.009)" lines from 5-fold cross-validation.

```formula Mean and standard deviation of fold scores
mean = (s1 + s2 + ... + sk) ÷ k
standard deviation = square root of ( sum of (s - mean)^2 ÷ k )
```
**In plain words:** the mean is the typical score over the folds. The standard deviation shows how much it moves from fold to fold. A gap between two models smaller than that movement is not a clear win.

**Example 1: five fold scores.** 0.90, 0.92, 0.91, 0.89, 0.93. Mean = 4.55 ÷ 5 = 0.91. Distances: −0.01, 0.01, 0, −0.02, 0.02; squares: 0.0001, 0.0001, 0, 0.0004, 0.0004; sum = 0.001; ÷ 5 = 0.0002; square root = 0.014.

**Example 2: a close race.** k-nearest neighbours scored 0.908 (spread 0.009) and the random forest 0.907 (spread 0.016). The difference is 0.908 − 0.907 = 0.001, far smaller than either spread, so there is no clear winner.

### Bagging (bootstrap samples, voting and averaging)
**Where it is used:** random forests and any "many models, one answer" method.

```formula Bagging
chance a given row is NOT in a bootstrap sample = (1 - 1/n)^n   (about 0.37 for large n)
chance a given row IS in the sample = 1 - (1 - 1/n)^n          (about 0.63 for large n)
class answer = the class with the most votes
number answer = (p1 + p2 + ... + pm) ÷ m
(n = number of rows; m = number of models; p = one model's prediction)
```
**In plain words:** when you pick n rows out of n with replacement, each pick misses a given row with chance (1 − 1/n). You make n picks, so you multiply that n times. About a third of the rows are left out of each sample. Those left-out rows are a free test set for that model. Voting or averaging then cancels the quirks of single models.

**Example 1: 10 rows.** Each pick misses a given row with chance 1 − 1/10 = 0.9. After 10 picks: 0.9^10 = 0.3487. So about 35% of rows are left out and 65% are in.

**Example 2: 100 rows.** Each pick misses with chance 1 − 1/100 = 0.99. After 100 picks: 0.99^100 = 0.3660. The number is already close to 1 ÷ e = 0.3679, the limit for very large n.

**Example 3: voting.** Five models say: yes, no, yes, yes, no. Votes: 3 yes and 2 no. The bagged answer is yes (3 of 5 votes).

**Example 4: averaging.** Five models predict a price: 10, 12, 11, 13, 9. Sum = 10 + 12 + 11 + 13 + 9 = 55. Average = 55 ÷ 5 = 11. The single predictions are 9 to 13 apart, but the average, 11, sits in the middle.

## Maths behind it
- Linear models and logistic function
- Distance metrics (k-nearest neighbours)
- Entropy and Gini impurity (decision trees)
- Bagging and boosting (ensemble methods)
- Margins and kernels (support vector machines)
- Bayes' theorem (naive Bayes)

## Common mistakes
- Comparing models on different data splits, so luck decides the winner.
- Forgetting to scale features for kNN and SVMs.
- Choosing the most complex model when a simpler one is within the noise.

## Quick check
Q: Which algorithm family usually wins on tabular business data?
A: Gradient-boosted trees (such as XGBoost or LightGBM).

Q: Why might a bank choose logistic regression over a slightly more accurate model?
A: It is easy to explain and audit, which regulation may require.

Q: How does a random forest reduce overfitting compared with one tree?
A: It averages many trees trained on different random samples, which cancels out individual trees' quirks.
