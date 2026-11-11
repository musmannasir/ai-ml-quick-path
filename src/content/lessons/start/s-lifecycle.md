---
id: s-lifecycle
title: How an AI or ML project runs from idea to production
module: start
level: Beginner
minutes: 75
goal: Walk through the full project lifecycle (problem, data, baseline, model, evaluation, deployment, monitoring) and run every step on a small example.
prereqs: s-what-is-ai
reviewed: 2026-11-02
evidence: The lifecycle script run on your machine, plus a written problem statement for a project idea with its success measure and baseline.
code: Python executed 2026-11-02 (quickpath.py lifecycle); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
Every AI or ML project, small or huge, follows the same loop. **First, define the problem** in business terms and decide how success will be measured ("reduce customer churn; catch at least half of customers who will leave"). **Second, get data** and check it. **Third, build a baseline**: the simplest possible answer, such as "nobody will leave". **Fourth, train a model** and **evaluate** it on data it has not seen, comparing with the baseline. **Fifth, deploy** it so people or systems can use it. **Sixth, monitor** it, because the world changes and models get worse over time. Then you repeat. Most project time goes into data and evaluation, not into choosing a fancy algorithm. LLM projects follow the same loop: the "model" step may be a prompt, retrieval or fine-tuning, but you still need data to test it and monitoring after launch.

```diagram loop The project lifecycle
note: Six steps, then you go round again.
- Define the problem | Business terms and a success measure | input
- Get data | Collect it and check it | store
- Build a baseline | The simplest possible answer | process
- Train and evaluate | On data the model has not seen | model
- Deploy | So people or systems can use it | output
- Monitor | The world changes and models get worse | warn
loop: Repeat when monitoring shows quality dropping
```

```diagram compare Baseline and model on the same goal
note: Both ideas are explained in the text above and in the example below.
## Baseline | process
- What it is | The simplest possible answer
- Example | Nobody will leave
## Model | model
- What it is | Trained, then evaluated on data it has not seen
- Judged by | Comparison with the baseline
```

## Real-world example
A phone company loses customers every month. The team agrees on a goal: find customers likely to leave so the retention team can call them. They pull 2 years of customer data, train a model, check it catches enough leavers, put it behind an API that the CRM system calls every night, and watch weekly whether its predictions still match reality.

```diagram flow The phone company churn project
- Goal | Find customers likely to leave | input
- Data | 2 years of customer data | store
- Model | Trained and checked to catch enough leavers | model
- API | The CRM system calls it every night | process
- Retention team | Calls the customers it flags | output
- Weekly check | Do predictions still match reality? | warn
```

## How it works
1. **Problem:** what decision will the model support, and what does "good" mean?
2. **Data:** collect, clean and split into training and test sets.
3. **Baseline:** a trivial rule to beat.
4. **Model:** train and tune.
5. **Evaluate:** on unseen data, with the metric that matches the business goal.
6. **Deploy:** save the model and serve it (API or batch job).
7. **Monitor:** track quality, data changes and cost; retrain when needed.

```diagram lanes Lifecycle steps grouped by stage
## Before the model
- Problem | What decision, what is good | input
- Data | Collect, clean, split | store
- Baseline | A trivial rule to beat | process
## Build and check
- Model | Train and tune | model
- Evaluate | Unseen data, matching metric | process
## After the model
- Deploy | Serve as an API or batch job | output
- Monitor | Quality, data changes, cost | warn
```

## Python example
The whole loop on 2,000 synthetic customers:
```python quickpath.py lifecycle (excerpt)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)   # 2. split
model = RandomForestClassifier(n_estimators=200, min_samples_leaf=20, random_state=0).fit(X_tr, y_tr)  # 4. train
pred = model.predict(X_te)                                                                   # 5. evaluate
joblib.dump(model, path)                                                                     # 6. save
loaded = joblib.load(path)                                                                   #    load and predict
```
```text Output (executed)
churn rate 20.2% | baseline accuracy (always 'stays') 0.798
model accuracy 0.818 | recall on churners 0.238
saved 1073 KB | new customer churn probability 0.66
```
This result teaches the most important lifecycle lesson. Accuracy (81.8%) looks fine, but the "nobody leaves" baseline already gets 79.8%. The model only catches 24% of leavers, which does not meet the goal. The next step is not deployment: it is lowering the decision threshold or improving the data (see [Measuring models](lesson:ml-evaluation)).

## .NET (C#) example
The same loop in ML.NET, including saving and loading the model file:
```cs Program.cs
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Customer>("customers.csv", hasHeader: true, separatorChar: ',');
var split = ml.Data.TrainTestSplit(data, testFraction: 0.25);                         // split

var pipeline = ml.Transforms.Concatenate("Features", nameof(Customer.TenureMonths),
        nameof(Customer.TicketsLastMonth), nameof(Customer.MonthlyFee))
    .Append(ml.BinaryClassification.Trainers.FastTree(labelColumnName: nameof(Customer.Churned))); // package Microsoft.ML.FastTree
var model = pipeline.Fit(split.TrainSet);                                             // train

var metrics = ml.BinaryClassification.Evaluate(model.Transform(split.TestSet), labelColumnName: nameof(Customer.Churned));
Console.WriteLine($"Accuracy {metrics.Accuracy:F3} | recall on churners {metrics.PositiveRecall:F3}"); // evaluate

ml.Model.Save(model, data.Schema, "churn-model.zip");                                 // save
var loaded = ml.Model.Load("churn-model.zip", out _);                                 // load in the API
var engine = ml.Model.CreatePredictionEngine<Customer, ChurnPrediction>(loaded);
Console.WriteLine(engine.Predict(new Customer { TenureMonths = 3, TicketsLastMonth = 4, MonthlyFee = 40 }).Probability);

public class Customer
{
    [LoadColumn(0)] public float TenureMonths { get; set; }
    [LoadColumn(1)] public float TicketsLastMonth { get; set; }
    [LoadColumn(2)] public float MonthlyFee { get; set; }
    [LoadColumn(3)] public bool Churned { get; set; }
}
public class ChurnPrediction { [ColumnName("PredictedLabel")] public bool Churned { get; set; } public float Probability { get; set; } }
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Accuracy, baseline and recall (is the model really better?)
**Where it is used:** the "build a baseline" and "evaluate" steps of the loop.

```formula Accuracy and recall
accuracy = correct answers ÷ all answers
recall   = real churners caught ÷ all real churners
```
**In plain words:** accuracy counts all right answers. Recall counts only how many of the people who really leave you caught. When leavers are rare, accuracy can look fine while recall is poor.

**Example 1: model against baseline.** A test set has 500 customers: 100 leave and 400 stay. The baseline "nobody leaves" is right for 400, so accuracy = 400 ÷ 500 = 0.80 and recall = 0 ÷ 100 = 0. A model catches 24 leavers and wrongly flags 10 stayers. Correct = 24 + (400 − 10) = 414, so accuracy = 414 ÷ 500 = 0.828 and recall = 24 ÷ 100 = 0.24. Accuracy barely beats the baseline and recall is low.

**Example 2: a lower threshold.** The team lowers the decision threshold. Now the model catches 60 leavers and wrongly flags 80 stayers. Correct = 60 + (400 − 80) = 380, so accuracy = 380 ÷ 500 = 0.76 and recall = 60 ÷ 100 = 0.60. Accuracy fell below the baseline, but the goal ("catch at least half of leavers") is met. Pick the measure that matches the goal.

### Train and test split (how many rows go where)
**Where it is used:** the "split" step, with a test share of 0.25 and a class share kept equal in both parts.

```formula Split sizes
test rows  = all rows × test share
train rows = all rows - test rows
rows of one class in a part = part size × class share
```
**In plain words:** you set aside a share of rows the model never sees. "Stratified" means each part keeps the same class shares as the whole data.

**Example 1: sizes.** With 2,000 customers and a test share of 0.25: test rows = 2,000 × 0.25 = 500 and train rows = 2,000 − 500 = 1,500.

**Example 2: keeping the leaver share.** If 20% of customers leave, a stratified split puts 500 × 0.20 = 100 leavers in the test part and 1,500 × 0.20 = 300 in the training part. Both parts keep the 20% share.

## Maths behind it
- Sampling and train/test splitting (statistics)
- Classification metrics: accuracy, recall (statistics)
- Decision trees and ensembles (algorithms)

## Common mistakes
- Skipping the baseline, so a weak model looks good.
- Choosing a metric (accuracy) that does not match the goal (catch leavers).
- Treating deployment as the end; without monitoring, quality silently drops.

```diagram flow Why a baseline and the right metric matter
note: Numbers come from the executed example in this lesson.
- Baseline always says stays | Accuracy 0.798 | process
- Model | Accuracy 0.818, looks fine | model
- Check recall on leavers | Only 0.238 of leavers caught | warn
- Not ready to deploy | Improve the threshold or the data first | bad
```

## Quick check
Q: Why build a baseline before a model?
A: It shows what a trivial answer already achieves, so you can tell whether the model adds real value.

Q: The model has 81.8% accuracy and the baseline 79.8%. Is it ready?
A: Not for this goal: it catches only 24% of leavers. Improve recall first, for example with a lower threshold or better data.

Q: Why is monitoring part of the lifecycle?
A: Data and behaviour change over time, so a model that was good at launch can become wrong without anyone noticing.
