---
id: ops-mlops
title: "MLOps: versioning, pipelines and safe releases"
module: ops
level: Advanced
minutes: 90
goal: Make model training repeatable and releases safe by versioning data, code and models, recording metrics in a registry, and promoting a new model only when it passes a gate.
prereqs: ops-serving, ml-evaluation
reviewed: 2026-11-02
evidence: A training pipeline that records data hash, parameters and metrics for every run, plus a promotion rule that rejected at least one candidate.
code: Python executed 2026-11-02 (quickpath.py registry); MLflow and C# not run (MLflow not installed and no .NET SDK in the build environment)
---
## In plain words
**MLOps** is DevOps for machine learning: the habits and tools that make models repeatable, traceable and safe to change. Normal software has one moving part, the code. ML has three: **code**, **data** and the **model** produced from them. If any one changes, the result changes. So you **version all three**: code in Git, data by a snapshot or a content hash, and models in a **model registry** (a catalogue of every trained model with its metrics, the data it saw and its status such as "candidate", "production" or "archived"). Training runs as a **pipeline** (a script or workflow that goes from raw data to a saved, tested model with no manual steps), so anyone can rerun it. A new model is released only if it passes a **promotion gate**: written rules such as "must beat the current production model, the **champion**, on the same test set by a clear margin, and must pass fairness and speed checks". Safe rollout methods include **shadow mode** (the new model runs on live traffic but its answers are only logged), **canary release** (a small share of users get it first) and **A/B testing** (a planned comparison of business results). Always keep the previous model ready for **rollback**.

```diagram merge Three moving parts in ML
note: Change any one and the result changes, so version all three.
- The result you get | predictions and decisions | output
- Code | versioned in Git | input
- Data | a snapshot or a content hash | store
- Model | kept in the model registry | model
```

```diagram flow Life of a model in the registry
note: The registry records metrics, data seen and status for each model.
- Trained | model saved with metrics and data hash | model
- Candidate | waiting to be compared | process
- Production | the champion serving users | output
- Archived | replaced, but kept for rollback | store
```

```diagram flow The promotion gate
note: Same test set for both models, rules written down in advance.
- Candidate model | newly trained | model
- Frozen test set | never used for training | input
- Gate rules | beat the champion by a clear margin, pass fairness and speed checks | process
- Decision | promote or reject | output
```

```diagram compare Three safe ways to release a new model
## Shadow mode | process
- New model runs on live traffic
- Its answers are only logged
- Users never see them
## Canary release | warn
- A small share of users get the new model first
- Watch the metrics before widening
## A/B testing | output
- A planned comparison of business results
- Two groups, one model each
```

## Real-world example
A lender retrains its credit-risk model every month. The pipeline pulls a dated data snapshot, trains, evaluates and writes everything to the registry. One month, a more complex model scores slightly lower than the champion on the frozen test set. The gate rejects it automatically, and the champion stays in production. Months later an auditor asks why a loan was refused in March; the registry shows exactly which model, data snapshot and threshold were used.

```diagram flow The lender's monthly cycle
- Dated data snapshot | pulled by the pipeline | input
- Train and evaluate | on the frozen test set | process
- Write to the registry | model, data snapshot, threshold | store
- Gate | complex model scored slightly lower | warn
- Champion stays | the new model is rejected | output
```

## How it works
1. Freeze a **test set** that no candidate model ever trains on.
2. Write the pipeline: load data snapshot, record its hash, prepare features, train, evaluate, save.
3. Log every run: parameters, metrics, data hash, code commit, and the model file.
4. Compare the candidate with the champion on the same test set; apply the gate.
5. If it passes, run it in shadow mode or as a canary; watch business and technical metrics.
6. Promote it to production, keep the old model for rollback, and record the decision.
7. Schedule retraining (time-based or triggered by drift, see [Monitoring](lesson:ops-monitoring)).

```diagram loop The MLOps pipeline
loop: Retrain on a schedule or when drift is detected
- Freeze test set | no candidate trains on it | input
- Train | snapshot, hash, features | process
- Log the run | parameters, metrics, data hash, commit | store
- Compare with champion | apply the gate | process
- Shadow or canary | watch the metrics | warn
- Promote | keep the old model for rollback | output
```

### Related concepts
- **Feature store**: a shared system that computes features once and serves the same values for training (history) and for live predictions (latest values). It prevents training-serving skew, where the live feature is computed differently from the training one.

```diagram fan Feature store
note: One definition of each feature, used in both places.
- Feature store | computes each feature once | store
- Training | historical values | process
- Live predictions | latest values | output
```

- **Data versioning tools** keep dataset snapshots next to code versions so a run can be reproduced exactly.
- **CI/CD for ML**: automated tests on data (schema, ranges), on the model (gate metrics) and on the service (API tests) every time something changes.

```diagram fan CI/CD for ML
note: Every change triggers all three kinds of test.
- Something changes | data, code or model | input
- Data tests | schema and ranges | process
- Model tests | gate metrics | process
- Service tests | API tests | process
```

## Python example
A tiny registry: three candidates are trained on the same data (same hash) and must beat the champion by at least 0.005 AUC (a ranking-quality score from 0.5 to 1, see [Evaluation](lesson:ml-evaluation)):
```text Output of quickpath.py registry (executed)
{"model": "v3 logistic regression", "data_sha256": "f87b8c5b834b", "test_auc": 0.877, "decision": "promote"}
{"model": "v4 gradient boosting", "data_sha256": "f87b8c5b834b", "test_auc": 0.874, "decision": "reject (not better than champion)"}
{"model": "v5 gradient boosting, 2 trees", "data_sha256": "f87b8c5b834b", "test_auc": 0.848, "decision": "reject (not better than champion)"}
champion: v3 logistic regression
```
The lesson in this output: the more advanced model is **not** automatically better. On this data the simple model wins, and the gate protects production from a downgrade.

With **MLflow**, a popular open-source tracking tool, the same logging looks like this:
```python train.py (MLflow; not run here)
import mlflow, mlflow.sklearn
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score

mlflow.set_experiment("churn")
with mlflow.start_run():
    params = {"n_estimators": 200, "max_depth": 3}
    model = GradientBoostingClassifier(**params).fit(X_train, y_train)
    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    mlflow.log_params(params)
    mlflow.log_param("data_sha256", data_hash)
    mlflow.log_metric("test_auc", auc)
    mlflow.sklearn.log_model(model, "model", registered_model_name="churn")
```

## .NET (C#) example
ML.NET has no built-in registry, so a .NET team often stores a small manifest next to each model file (or uses MLflow or a cloud registry through its API). This console step trains, evaluates and applies the gate:
```cs TrainAndGate.cs
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
var data = ml.Data.LoadFromTextFile<Customer>("data/churn-2026-10.csv", hasHeader: true, separatorChar: ',');
string dataHash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes("data/churn-2026-10.csv")))[..12];
var split = ml.Data.TrainTestSplit(data, testFraction: 0.3, seed: 0);

var pipeline = ml.Transforms.Concatenate("Features", "TenureMonths", "MonthlyCharge", "SupportCalls")
    .Append(ml.BinaryClassification.Trainers.FastTree());
var model = pipeline.Fit(split.TrainSet);
double auc = ml.BinaryClassification.Evaluate(model.Transform(split.TestSet)).AreaUnderRocCurve;

var champion = JsonSerializer.Deserialize<Manifest>(File.ReadAllText("models/production.json"))!;
bool promote = auc >= champion.TestAuc + 0.005;
var manifest = new Manifest($"churn-{DateTime.UtcNow:yyyyMMdd-HHmm}", dataHash, auc, promote ? "promote" : "reject");
File.WriteAllText($"models/{manifest.Version}.json", JsonSerializer.Serialize(manifest));
ml.Model.Save(model, data.Schema, $"models/{manifest.Version}.zip");
if (promote) File.Copy($"models/{manifest.Version}.json", "models/production.json", overwrite: true);
Console.WriteLine($"{manifest.Version}: AUC {auc:F3} vs champion {champion.TestAuc:F3} -> {manifest.Decision}");

public sealed record Manifest(string Version, string DataSha256, double TestAuc, string Decision);

public sealed class Customer
{
    [LoadColumn(0)] public float TenureMonths { get; set; }
    [LoadColumn(1)] public float MonthlyCharge { get; set; }
    [LoadColumn(2)] public float SupportCalls { get; set; }
    [LoadColumn(3), ColumnName("Label")] public bool Churned { get; set; }   // trainers look for "Label" by default
}
```
Run it in a CI pipeline (for example GitHub Actions or Azure DevOps) so training is never a manual, unrepeatable step.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Uncertainty of a test score (is a small difference real?)
**Where it is used:** the release gate, when a new model scores slightly differently from the champion on the frozen test set.

```formula Standard error of an accuracy
standard error = sqrt( p × (1 - p) / n )
rough 95% range = p ± 1.96 × standard error
p = accuracy as a decimal, n = number of test rows
```
**In plain words:** a score from a limited test set is a little noisy. The standard error says how much. Differences smaller than the range may be luck.

**Example 1: 400 test rows.** Accuracy p = 0.90. Standard error = sqrt(0.9 × 0.1 / 400) = sqrt(0.000225) = 0.015. Range = 0.90 ± 1.96 × 0.015 = 0.90 ± 0.029. A challenger at 0.91 is inside that range, so the gain is not proven.

**Example 2: 2,500 test rows.** Same p = 0.90. Standard error = sqrt(0.09 / 2500) = 0.006. Range = 0.90 ± 1.96 × 0.006 = 0.90 ± 0.012. A bigger test set gives a tighter range.

### Comparing two groups in an A/B test (a two-proportion z-score)
**Where it is used:** a canary or A/B release, comparing the champion and the new model on live traffic.

```formula Two-proportion z-score
p = (successes A + successes B) / (n A + n B)
standard error = sqrt( p × (1 - p) × (1/n A + 1/n B) )
z = (rate B - rate A) / standard error
```
**In plain words:** z says how many standard errors apart the two rates are. As a common rule of thumb, a z above about 2 (or below -2) is unlikely to be luck alone.

**Example 1: 1,000 users each.** A: 100 successes (10%). B: 130 successes (13%). p = 230 / 2000 = 0.115. Standard error = sqrt(0.115 × 0.885 × 0.002) = sqrt(0.00020355) = 0.0143. z = 0.03 / 0.0143 = 2.1. Likely a real difference.

**Example 2: only 100 users each.** A: 10 successes, B: 13 successes. The rates are the same, 10% and 13%. p = 23 / 200 = 0.115. Standard error = sqrt(0.101775 × 0.02) = 0.0451. z = 0.03 / 0.0451 = 0.66. Too small to tell; keep testing.

## Maths behind it
- Cryptographic hash functions (fingerprinting data)
- Hypothesis testing and statistical significance (A/B tests)
- ROC AUC (comparing candidates)

## Common mistakes
- Comparing a new model on a different test set from the champion's.
- Not recording which data trained a model, so results cannot be reproduced.
- Promoting a model because it is newer or more complex, not because it is better.
- No rollback plan.

```diagram compare Fair and unfair model comparison
## Different test sets | bad
- Candidate and champion scored on different data
- The comparison means nothing
## Same frozen test set | output
- Both models scored on identical data
- The gate decision can be trusted
```

## Quick check
Q: What three things must be versioned in ML, and why?
A: Code, data and the model, because changing any one of them changes the result.

Q: What is shadow mode?
A: The new model runs on real traffic but its answers are only logged and compared, not shown to users.

Q: In the registry demo, why was gradient boosting rejected?
A: Its test AUC (0.874) did not beat the champion (0.877) by the required margin.
