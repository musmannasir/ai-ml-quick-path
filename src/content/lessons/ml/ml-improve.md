---
id: ml-improve
title: Improving and explaining models
module: ml
level: Intermediate
minutes: 90
goal: Tune hyperparameters with grid, random and automated search, reduce overfitting with regularisation and ensembles, and explain predictions with feature importance and Shapley values.
prereqs: ml-evaluation, ml-algorithms
reviewed: 2026-11-02
evidence: A tuning report (search space, best cross-validated score, single test score) and a plain-language explanation of one prediction.
code: Python executed 2026-11-02 (gap_topics.py tune and interp); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
Once you have a working model, three levers improve it. **Tuning** searches for the best hyperparameters (tree depth, learning rate, number of trees). **Grid search** tries every combination; **random search** samples combinations and often finds good ones faster; **AutoML** tools search algorithms and settings for you. **Regularisation** stops overfitting by keeping the model simpler (penalising large weights, limiting tree depth, stopping early). **Ensembles** combine several models (bagging, boosting, stacking) for more stable results. People also need to know **why** a model decided something. **Feature importance** shows which inputs matter overall; **permutation importance** measures how much the score drops when one feature is shuffled; **Shapley values** (the SHAP library) split one specific prediction into contributions from each feature, and the parts add up exactly to the prediction.

```diagram fan Three levers to improve a model
- A working model | Now make it better and explainable | model
- Tuning | Search for the best hyperparameters | process
- Regularisation | Keep the model simpler to stop overfitting | process
- Ensembles | Combine several models for stable results | process
- Explanation | Show people why it decided | output
```

```diagram compare Grid search, random search and AutoML
## Grid search | process
- Tries every combination
## Random search | model
- Samples combinations
- Often finds good ones faster
## AutoML | output
- Searches algorithms and settings for you
```

```diagram compare Ways to regularise
note: All of them keep the model simpler.
## Penalise large weights | process
- Discourages extreme knob values
## Limit tree depth | model
- Shorter trees cannot memorise as much
## Stop early | output
- Stop training before it memorises
```

```diagram compare Ensembles: bagging, boosting and stacking
## Bagging | process
- Combines several models for more stable results
## Boosting | model
- Builds models one by one | Each fixes the last one's mistakes
## Stacking | output
- Combines the answers of different models
```

```diagram compare Global and single-prediction explanations
## Feature importance | process
- Which inputs matter overall
## Permutation importance | model
- Shuffle one feature | See how much the score drops
## Shapley values (SHAP) | output
- Splits one prediction by feature | One contribution per feature
- The parts add up exactly to the prediction
```

## Real-world example
A subscription company's churn model flags a customer at 85% risk. The account manager sees the explanation: very short tenure and four support tickets drive the score. She calls about the support issue instead of offering a discount, which costs less and works better.

```diagram merge Why the churn model flagged one customer
note: Matches the paragraph above: short tenure and four support tickets drive the 85% risk score.
- 85% churn risk | The score the account manager sees | warn
- Very short tenure | Pushes the score up | bad
- Four support tickets | Pushes the score up | bad
```

## How it works
1. Keep the test set aside; tune only with cross-validation on training data.
2. Search the most important hyperparameters first (grid, random or AutoML).
3. Add regularisation if validation scores trail training scores.
4. Retrain with the best settings; evaluate once on the test set.
5. Explain: global importance for the whole model, Shapley values for single predictions.

```diagram lanes Keep the test set out of tuning
note: Tune with cross-validation on training data only. Look at the test set once, at the end.
## Training data
- Cross-validation | Compare hyperparameter settings | process
- Retrain with the best settings | On the training data | model
## Test set
- Set aside | Not used for tuning | store
- Evaluate once | The final honest score | output
```

```diagram flow Steps to a tuned and explained model
- Set the test set aside | Tune with cross-validation only | store
- Search | Most important hyperparameters first | process
- Add regularisation | If validation trails training | process
- Retrain and test once | Best settings, one test score | model
- Explain | Importance overall, Shapley values for one prediction | output
```

## Python example
Tuning a gradient-boosting model with the same budget (18 trials) both ways:
```text Output of gap_topics.py tune (executed)
grid (18 combos)   best CV 0.908  test 0.935  {'learning_rate': 0.3, 'max_depth': 4, 'n_estimators': 100}
random (18 draws)  best CV 0.922  test 0.945  {'learning_rate': 0.21, 'max_depth': 5, 'n_estimators': 242}
customer: tickets=4, tenure=2.7 months, discount=0% | average customer: tickets=2.01, tenure=30.9, discount=10.6%
Shapley: average-customer score 0.143 + contributions (tickets, tenure, discount) [0.241, 0.369, 0.099] = 0.852 (model output 0.852)
```
In words: an average customer scores 14%; short tenure adds 37 points, four tickets add 24, no discount adds 10, total 85%. Which features matter overall (gap_topics.py interp):
```text Output (executed)
permutation importance (MLP): [('f0', 0.312), ('f2', 0.145), ('f1', 0.054), ('noise5', 0.005), ('noise3', -0.001), ('noise4', -0.001)]
```
```python random search (excerpt)
rand = RandomizedSearchCV(GradientBoostingClassifier(random_state=0),
        {"max_depth": randint(2, 6), "learning_rate": loguniform(0.01, 0.5), "n_estimators": randint(50, 300)},
        n_iter=18, cv=4, random_state=0).fit(Xtr, ytr)
```

## .NET (C#) example
ML.NET AutoML searches algorithms and hyperparameters for you (package `Microsoft.ML.AutoML`):
```cs Program.cs
using Microsoft.ML;
using Microsoft.ML.AutoML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Customer>("customers.csv", hasHeader: true, separatorChar: ',');
var split = ml.Data.TrainTestSplit(data, testFraction: 0.2);

var experiment = ml.Auto().CreateBinaryClassificationExperiment(maxExperimentTimeInSeconds: 120);
var result = experiment.Execute(split.TrainSet, labelColumnName: nameof(Customer.Churned));
Console.WriteLine($"best: {result.BestRun.TrainerName}, validation AUC {result.BestRun.ValidationMetrics.AreaUnderRocCurve:F3}");

var test = ml.BinaryClassification.Evaluate(result.BestRun.Model.Transform(split.TestSet), labelColumnName: nameof(Customer.Churned));
Console.WriteLine($"test AUC {test.AreaUnderRocCurve:F3}");   // look at the test set once, at the end

public class Customer
{
    [LoadColumn(0)] public float TenureMonths { get; set; }
    [LoadColumn(1)] public float TicketsLastMonth { get; set; }
    [LoadColumn(2)] public float DiscountPercent { get; set; }
    [LoadColumn(3)] public bool Churned { get; set; }
}
```
ML.NET also offers permutation feature importance on trained models (`PermutationFeatureImportance` on each task catalog) for global explanations.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Shapley contributions (explaining one prediction)
**Where it is used:** splitting one customer's churn score among tickets, tenure and discount.

```formula Shapley sum
prediction = average-customer score + contribution of feature 1 + contribution of feature 2 + ...
```
**In plain words:** start from the score of an average customer. Each feature then adds (or removes) some points. The parts add up exactly to the model's answer.

**Example 1: the lesson's customer.** Average score 0.143. Contributions: tickets +0.241, tenure +0.369, discount +0.099. Sum = 0.143 + 0.241 + 0.369 + 0.099 = 0.852. Short tenure is the biggest reason.

**Example 2: a mixed customer.** Average score 0.20. Contributions: +0.30, −0.10, +0.05. Prediction = 0.20 + 0.30 − 0.10 + 0.05 = 0.45. A negative contribution means that feature pushed the score down.

### Permutation importance (how much a shuffle hurts)
**Where it is used:** finding which inputs the model really uses.

```formula Permutation importance
importance = score before shuffling - score after shuffling that feature
```
**In plain words:** shuffle one column so it carries no information. If the score drops a lot, the model relied on that column.

**Example 1: an important feature.** Accuracy is 0.90. After shuffling f0 it falls to 0.60. Importance = 0.90 − 0.60 = 0.30.

**Example 2: a noise feature.** After shuffling a random noise column, accuracy goes from 0.900 to 0.901. Importance = 0.900 − 0.901 = −0.001, which is zero within chance. This is why the lesson shows tiny negative values for noise.

### Regularisation (a penalty for big weights)
**Where it is used:** keeping a model simple so it does not overfit.

```formula Ridge (L2) regularisation
total loss = error + λ × (sum of weight^2)
(λ, "lambda", is a number you choose; bigger λ means a stronger penalty)
```
**In plain words:** training tries to lower the total. Big weights now cost something, so the model prefers smaller, simpler ones.

**Example 1: large weights.** Error = 10, weights 3 and −2, λ = 0.5. Penalty = 0.5 × (9 + 4) = 6.5. Total = 10 + 6.5 = 16.5.

**Example 2: smaller weights.** Weights 1 and −1 give error 12 (slightly worse fit). Penalty = 0.5 × (1 + 1) = 1. Total = 12 + 1 = 13. 13 is lower than 16.5, so training prefers the simpler model.

### Counting a grid search (why it gets expensive)
**Where it is used:** deciding between grid search and random search with a fixed budget.

```formula Grid size
combinations = (values of setting 1) × (values of setting 2) × ...
```
**In plain words:** a grid tries every combination, so the count multiplies with each new setting.

**Example 1: three settings.** 3 learning rates × 3 depths × 2 tree counts = 18 combinations, each trained once per fold.

**Example 2: one more setting.** Add a fourth setting with 4 values: 18 × 4 = 72 combinations. Random search can still stay at 18 draws.

## Maths behind it
- Search strategies: grid, random, Bayesian optimisation
- Regularisation: L1, L2, early stopping
- Ensembles: bagging, boosting, stacking
- Shapley values (cooperative game theory)
- Permutation importance (statistics)

## Common mistakes
- Tuning against the test set, so its score becomes optimistic.
- Searching dozens of settings when two or three matter.
- Reading a Shapley value as "changing this would change the outcome by this much"; it explains the model, not the real-world cause.

## Quick check
Q: Why can random search beat grid search with the same number of trials?
A: It tries many different values of each setting, while a grid repeats the same few values.

Q: What property do Shapley contributions always have?
A: They add up exactly to the prediction minus the baseline prediction.

Q: Your model scores 0.99 on training and 0.85 on validation. Name two fixes.
A: Regularise (for example limit depth or add weight decay) and get more or cleaner training data.
