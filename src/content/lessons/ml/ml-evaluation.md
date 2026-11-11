---
id: ml-evaluation
title: Measuring models honestly
module: ml
level: Intermediate
minutes: 90
goal: Choose the right metric for the problem, use cross-validation, read ROC and precision-recall results, and handle rare classes with thresholds and class weights.
prereqs: ml-classification, ml-regression
reviewed: 2026-11-02
evidence: An evaluation report with the metric choice justified, cross-validated scores with spread, and a threshold table for one classifier.
code: Python executed 2026-11-02 (ml_basics.py metrics, gap_topics.py roc); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
A model is only as good as the way you measure it. **Accuracy** (share of correct answers) is misleading when one class is rare: if 2% of payments are fraud, "never fraud" is 98% accurate and useless. Use **precision**, **recall** and **F1** (their balance) for rare classes. **ROC-AUC** measures how well the model ranks positives above negatives across all thresholds (0.5 is guessing, 1 is perfect). **PR-AUC** (precision-recall area) is more honest when positives are rare. For numbers, use **MAE**, **RMSE** and **R²**. **Cross-validation** trains and tests on several different splits and averages the results, so one lucky split does not fool you. For rare classes, choose the **threshold** deliberately and consider **class weights**, which make mistakes on the rare class cost more during training.

```diagram compare Why accuracy misleads on rare classes
note: Numbers from the run below: 1,000 transactions, 20 fraudulent.
## Always say not fraud | bad
- Accuracy 0.980
- Recall 0.000: catches no fraud
## The model | output
- Accuracy 0.965
- Recall 0.750: catches 15 of 20
```

```diagram compare Which metric for which problem
## Rare classes | warn
- Precision, recall and F1
- PR-AUC is more honest
## Ranking quality | model
- ROC-AUC across all thresholds
- 0.5 is guessing, 1 is perfect
## Numbers | process
- MAE, RMSE and R²
```

```diagram matrix Confusion matrix for the fraud example
note: Counts follow from the run below: 15 caught, 5 missed, 30 false alarms.
x: Flagged as fraud | Not flagged
y: Really fraud | Really not fraud
- True positive | 15 frauds caught | output
- False negative | 5 frauds missed | bad
- False positive | 30 false alarms | warn
- True negative | Normal payments left alone | output
```

```diagram loop Cross-validation
note: One lucky split cannot fool you, because the score is an average over several splits.
- Split the data | A different part is held out each round | store
- Train | On the part that is not held out | model
- Test | On the held-out part | process
- Record the score | One score per round | output
loop: Repeat for each split, then average the scores and report the spread
```

## Real-world example
The [Klarna case](case:klarna) shows a related lesson for AI assistants: an automation rate alone was not enough, and the company later reported re-investing in human support to protect service quality. Choosing what to measure shapes what you build.

```diagram compare The Klarna lesson: what to measure
## One measure alone | warn
- Automation rate only
- Does not show service quality
## Measures chosen with care | output
- Include service quality
- Re-investing in human support | The company later reported doing this
```

## How it works
1. Match the metric to the decision (cost of false alarms versus misses).
2. Compare with a baseline on the same data.
3. Use cross-validation (or a time-based split for time data) and report the spread.
4. For classifiers, build a threshold table: alerts, precision and recall at each threshold.
5. Pick the operating threshold with the business; re-check on the untouched test set once.

```diagram flow Honest evaluation steps
- Match the metric | To the cost of false alarms and misses | input
- Baseline | Compare on the same data | process
- Cross-validate | Time-based split for time data; report the spread | process
- Threshold table | Alerts, precision and recall at each threshold | model
- Choose the threshold | With the business | warn
- Test set once | The untouched final check | output
```

```diagram bar Train, validation and test split
note: Illustrative proportions only. The test set stays untouched until the final check.
- Train | 60 | model
- Validation | 20 | process
- Test | 20 | output
```

```diagram compare Threshold and class weights for rare classes
note: Both shift the balance between precision and recall.
## Threshold | warn
- Chosen deliberately
- Lower it to catch more positives | The cost is more alerts
## Class weights | model
- Rare-class mistakes cost more | Applied during training
- Shift the scores in a similar way
```

## Python example
1,000 transactions, 20 fraudulent; the model catches 15 and raises 30 false alarms:
```text Output of ml_basics.py metrics (executed)
accuracy=0.965 precision=0.333 recall=0.750 f1=0.462
'always not fraud' accuracy=0.980 with recall=0.000
```
A useless rule beats the model on accuracy. A larger imbalanced example (3.5% fraud) with a threshold table:
```text Output of gap_topics.py roc (executed)
positives in test set: 85 of 2400 (3.5%)
class_weight=None    : ROC-AUC 0.852  PR-AUC 0.227  recall@0.5 0.012  precision@0.5 0.333
class_weight=balanced: ROC-AUC 0.858  PR-AUC 0.200  recall@0.5 0.800  precision@0.5 0.107
threshold 0.5 : flagged    3  recall 0.012  precision 0.333
threshold 0.2 : flagged   48  recall 0.118  precision 0.208
threshold 0.1 : flagged  133  recall 0.482  precision 0.308
threshold 0.05: flagged  419  recall 0.729  precision 0.148
PR-AUC of a random guess = positive rate = 0.035; ROC-AUC of a random guess = 0.500
```
At the default 0.5 the model catches 1 fraud in 85. Lowering the threshold to 0.05 catches 73%, at the cost of more alerts. Class weights shift the scores in a similar way.

## .NET (C#) example
Cross-validation, the full metric set and a threshold table in ML.NET:
```cs Program.cs
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Payment>("payments.csv", hasHeader: true, separatorChar: ',');
var pipeline = ml.Transforms.Concatenate("Features", nameof(Payment.Amount), nameof(Payment.Hour), nameof(Payment.NewDevice))
    .Append(ml.BinaryClassification.Trainers.LightGbm(labelColumnName: nameof(Payment.IsFraud)));

var cv = ml.BinaryClassification.CrossValidate(data, pipeline, numberOfFolds: 5, labelColumnName: nameof(Payment.IsFraud));
var aucs = cv.Select(r => r.Metrics.AreaUnderRocCurve).ToArray();
Console.WriteLine($"ROC-AUC {aucs.Average():F3} (min {aucs.Min():F3}, max {aucs.Max():F3})");
var m = cv[0].Metrics;
Console.WriteLine($"PR-AUC {m.AreaUnderPrecisionRecallCurve:F3}  precision {m.PositivePrecision:F3}  recall {m.PositiveRecall:F3}");

var scored = ml.Data.CreateEnumerable<Scored>(cv[0].ScoredHoldOutSet, reuseRowObject: false).ToList();
foreach (var t in new[] { 0.5f, 0.2f, 0.1f, 0.05f })
{
    int flagged = scored.Count(s => s.Probability >= t);
    int caught = scored.Count(s => s.Probability >= t && s.IsFraud);
    int total = scored.Count(s => s.IsFraud);
    Console.WriteLine($"threshold {t}: flagged {flagged}, recall {(double)caught / total:F3}, precision {(flagged == 0 ? 0 : (double)caught / flagged):F3}");
}

public class Payment
{
    [LoadColumn(0)] public float Amount { get; set; }
    [LoadColumn(1)] public float Hour { get; set; }
    [LoadColumn(2)] public float NewDevice { get; set; }
    [LoadColumn(3)] public bool IsFraud { get; set; }
}
public class Scored { public bool IsFraud { get; set; } public float Probability { get; set; } }
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Accuracy against precision, recall and F1 (rare classes)
**Where it is used:** the fraud example with 1,000 transactions, 20 of them fraud.

```formula Metrics from the confusion matrix
accuracy  = (TP + TN) ÷ all
precision = TP ÷ (TP + FP)
recall    = TP ÷ (TP + FN)
F1 = 2 × precision × recall ÷ (precision + recall)
```
**In plain words:** TP = fraud caught, FP = false alarms, FN = fraud missed, TN = normal payments passed. Accuracy hides rare-class failure; recall and precision show it.

**Example 1: the fraud model.** It catches 15 of 20 frauds (TP = 15, FN = 5) and raises 30 false alarms (FP = 30). Normal payments = 1,000 − 20 = 980, so TN = 980 − 30 = 950. Accuracy = (15 + 950) ÷ 1,000 = 0.965. Precision = 15 ÷ 45 = 0.333. Recall = 15 ÷ 20 = 0.75. F1 = 2 × 0.333 × 0.75 ÷ (0.333 + 0.75) = 0.5 ÷ 1.083 = 0.462.

**Example 2: "always not fraud".** TP = 0, FP = 0, FN = 20, TN = 980. Accuracy = 980 ÷ 1,000 = 0.98, higher than the model. Recall = 0 ÷ 20 = 0. It looks best and catches nothing.

### The threshold trade-off (flagged, precision and recall)
**Where it is used:** the threshold table for 2,400 transactions with 85 frauds.

```formula Counts at a threshold
caught (TP) = recall × all real positives
precision = TP ÷ flagged
recall    = TP ÷ all real positives
```
**In plain words:** a lower threshold flags more items. Recall goes up and precision usually goes down.

**Example 1: threshold 0.5.** 3 items flagged, 1 of them real fraud. Precision = 1 ÷ 3 = 0.333. Recall = 1 ÷ 85 = 0.012. Almost no fraud is caught.

**Example 2: threshold 0.05.** 419 items flagged. Recall 0.729 means TP = 0.729 × 85 = 62. Precision = 62 ÷ 419 = 0.148. Recall = 62 ÷ 85 = 0.729. Many more frauds are caught, but about 6 of 7 alerts are false alarms.

### Base rate (what a random guess scores)
**Where it is used:** deciding whether a PR-AUC or accuracy number is good.

```formula Base rate
base rate = number of positives ÷ all examples
accuracy of "always negative" = 1 - base rate
```
**In plain words:** the base rate is how common the rare class is. A random guess has a PR-AUC equal to it, so a PR-AUC of 0.20 is only meaningful when compared with it.

**Example 1: the larger test set.** 85 positives in 2,400 transactions: base rate = 85 ÷ 2,400 = 0.035, or 3.5%. A model with PR-AUC 0.20 is about 0.20 ÷ 0.035 = 5.7 times better than a random guess.

**Example 2: "never fraud".** If 2% of payments are fraud, the base rate is 0.02 and "always not fraud" has accuracy 1 − 0.02 = 0.98.

## Maths behind it
- Confusion matrix, precision, recall, F1 (statistics)
- ROC curve and area under the curve
- Precision-recall curve and average precision
- Cross-validation and confidence intervals (statistics)
- Base rates and Bayes' theorem

## Common mistakes
- Reporting accuracy on imbalanced data.
- Picking the threshold by looking at the test set again and again.
- Oversampling the rare class before splitting, which copies test-like rows into training.

## Quick check
Q: Why is accuracy misleading for fraud detection?
A: Fraud is rare, so predicting "never fraud" already scores very high accuracy while catching nothing.

Q: What does ROC-AUC 0.85 mean in plain words?
A: Pick one fraud and one normal payment at random: 85% of the time the model scores the fraud higher.

Q: Why use cross-validation?
A: One split can be lucky or unlucky; averaging several splits gives a more reliable score and shows the spread.
