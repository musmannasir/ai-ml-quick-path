---
id: ml-unsupervised
title: Unsupervised learning: groups, compression and anomalies
module: ml
level: Intermediate
minutes: 75
goal: Group similar items with clustering, compress many columns with PCA, and flag unusual records with anomaly detection, all without labels.
prereqs: ml-algorithms
reviewed: 2026-11-02
evidence: A clustering or anomaly-detection result on your own data, with each group or flag explained in business words.
code: Python executed 2026-11-02 (ml_basics.py kmeans, quickpath.py pca and anomaly); C# not compiled (no .NET SDK in the build environment); added technique snippets (2026-11-05) not run
---
## In plain words
Often you have data but no answers attached. **Unsupervised learning** finds structure anyway. **Clustering** puts similar items into groups: k-means picks k group centres and moves them until each item is near its centre. **Dimensionality reduction** squeezes many related columns into a few: **PCA** (principal component analysis) finds the main directions in which the data varies. It is useful for charts, speed and noise removal. **Anomaly detection** flags records that do not fit the normal pattern, such as an unusual payment or a strange sensor reading; **Isolation Forest** does this by noticing that odd points are easy to separate from the rest. Results need a person to interpret them: a cluster is only useful if someone can name it and act on it.

```diagram compare Supervised and unsupervised learning
## Supervised | model
- Examples come with answers (labels)
- Learns to predict the answer
## Unsupervised | process
- No answers attached
- Finds structure: groups, fewer columns, oddities
```

```diagram fan Three jobs of unsupervised learning
- Data with no labels | Rows and columns, no answers | input
- Clustering | Puts similar items into groups (k-means) | output
- Dimensionality reduction | Squeezes many columns into a few (PCA) | output
- Anomaly detection | Flags records that do not fit (Isolation Forest) | output
```

```diagram loop How k-means finds groups
- Pick k centres | k is the number of groups you want | input
- Assign each item | To its nearest centre | process
- Move each centre | To the middle of its items | model
loop: Repeat until each item is near its centre and the centres stop moving
```

```diagram flow PCA: many columns into a few
note: Useful for charts, speed and noise removal.
- Many related columns | Many measurements per item | input
- Find the main directions | The directions in which the data varies most | process
- Keep the strongest few | Components that explain most of the variation | model
- Few columns | Easier to plot and faster to use | output
```

```diagram compare Normal points and anomalies
note: Isolation Forest relies on this: odd points are easy to separate from the rest.
## Normal records | output
- Sit together in a crowd
- Hard to separate from each other
## Anomalies | warn
- Sit far from the crowd
- Easy to separate from the rest
```

## Real-world example
A bank cannot label every fraud type in advance, because fraudsters invent new tricks. It runs anomaly detection on card payments, and unusual ones (large amount, odd hour, new country) go to analysts. Their decisions become labels that later train a supervised fraud model.

```diagram flow The bank's anomaly pipeline
note: Analysts' decisions become labels, so unsupervised work later feeds supervised learning.
- Card payments | No fraud labels in advance | input
- Anomaly detection | Flags the unusual ones | process
- Analysts review | Large amount, odd hour, new country | warn
- Labels | Their decisions become labels | store
- Supervised fraud model | Trained on those labels later | model
```

## How it works
1. Pick features and scale them.
2. Clustering: choose k, run k-means, read the group centres and sizes, give each group a name.
3. PCA: fit on scaled data; keep components that explain most of the variation.
4. Anomalies: train an anomaly detector on mostly normal data; review the most unusual records.
5. Validate with people: do the groups or flags make business sense?

```diagram flow Unsupervised workflow with people in the loop
- Scale the features | So no column dominates | input
- Run the method | Clusters, PCA or anomaly detector | model
- Interpret | Name each group, review the most unusual records | process
- Validate with people | Do the groups or flags make business sense? | output
```

## Python example
```text Output of ml_basics.py kmeans (executed) — two customer groups found without labels
cluster centre: orders/month=2.0, basket=$31
cluster centre: orders/month=7.9, basket=$90
cluster sizes: [50, 50]
```
```text Output of quickpath.py pca (executed) — 10 columns driven by 2 hidden factors
10 columns -> variance explained by first components: [0.49, 0.481, 0.004, 0.004]
2 components keep 97.1% of the information
```
```python quickpath.py anomaly (excerpt)
flags = IsolationForest(contamination=0.02, random_state=1).fit_predict(X) == -1
```
```text Output (executed) — 1,000 payments, 20 of them unusual (larger amounts at night)
flagged 20 of 1000 | real anomalies caught 19/20 | normal flagged by mistake 1
```

### More techniques in Python: the k-means centre update
The earlier code lets a library do the work. This small numpy version shows the two repeated steps: assign each point to the nearest centre, then move each centre to the mean of its points.
```python kmeans_step.py (not run here)
import numpy as np

pts = np.array([[1, 2], [2, 3], [3, 1], [8, 9], [9, 8], [10, 10]], dtype=float)  # made-up points
centres = pts[[0, 3]].copy()                       # start with two of the points as centres

for _ in range(3):                                 # repeat a few times
    dist = np.linalg.norm(pts[:, None] - centres[None], axis=2)  # distance to each centre
    label = dist.argmin(axis=1)                    # step 1: nearest centre for each point
    for k in range(2):
        centres[k] = pts[label == k].mean(axis=0)  # step 2: move the centre to the group mean
print(centres, label)
```

## .NET (C#) example
K-means clustering and PCA-based anomaly detection in ML.NET:
```cs Program.cs
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromEnumerable(LoadCustomers());
var features = ml.Transforms.Concatenate("Features", nameof(Customer.OrdersPerMonth), nameof(Customer.Basket))
    .Append(ml.Transforms.NormalizeMeanVariance("Features"));

var clustering = features.Append(ml.Clustering.Trainers.KMeans("Features", numberOfClusters: 2)).Fit(data);
var engine = ml.Model.CreatePredictionEngine<Customer, ClusterPrediction>(clustering);
Console.WriteLine($"cluster {engine.Predict(new Customer { OrdersPerMonth = 8, Basket = 95 }).ClusterId}");

var anomalies = features.Append(ml.AnomalyDetection.Trainers.RandomizedPca("Features", rank: 1)).Fit(data);
var scored = ml.Data.CreateEnumerable<AnomalyPrediction>(anomalies.Transform(data), reuseRowObject: false);
Console.WriteLine($"flagged {scored.Count(p => p.IsAnomaly)} unusual customers");

static IEnumerable<Customer> LoadCustomers() => /* your data */ Array.Empty<Customer>();
public class Customer { public float OrdersPerMonth { get; set; } public float Basket { get; set; } }
public class ClusterPrediction { [ColumnName("PredictedLabel")] public uint ClusterId { get; set; } }
public class AnomalyPrediction { [ColumnName("PredictedLabel")] public bool IsAnomaly { get; set; } public float Score { get; set; } }
```
For spikes in a time series (sudden jumps in sales or traffic), ML.NET's `DetectIidSpike` transform in `Microsoft.ML.TimeSeries` is the simplest option.

### More techniques in C#: the k-means centre update
The same two steps in plain C#, with the same made-up points.
```cs KMeansStep.cs (not compiled here)
var pts = new double[][] { new[]{1.0,2}, new[]{2.0,3}, new[]{3.0,1}, new[]{8.0,9}, new[]{9.0,8}, new[]{10.0,10} };
var centres = new[] { (double[])pts[0].Clone(), (double[])pts[3].Clone() };  // start with two points
var label = new int[pts.Length];

for (int round = 0; round < 3; round++)            // repeat a few times
{
    for (int i = 0; i < pts.Length; i++)           // step 1: nearest centre for each point
    {
        double D(double[] c) => Math.Sqrt(Math.Pow(pts[i][0]-c[0], 2) + Math.Pow(pts[i][1]-c[1], 2));
        label[i] = D(centres[0]) <= D(centres[1]) ? 0 : 1;
    }
    for (int k = 0; k < 2; k++)                    // step 2: move the centre to the group mean
    {
        var mine = pts.Where((p, i) => label[i] == k).ToList();
        centres[k] = new[] { mine.Average(p => p[0]), mine.Average(p => p[1]) };
    }
}
Console.WriteLine(string.Join(" | ", centres.Select(c => $"({c[0]:F1}, {c[1]:F1})")));
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Cluster centres and distance (k-means)
**Where it is used:** k-means finds two customer groups by repeating "assign to the nearest centre, then move the centre".

```formula k-means centre and assignment
centre = the average of the points in the group (per column)
distance = sqrt( (a1 - c1)^2 + (a2 - c2)^2 )
(each point joins the centre with the smallest distance)
```
**In plain words:** the centre is the average customer of a group. A new point joins the group whose centre is closest.

**Example 1: finding a centre.** Three customers have 2 orders a month each and baskets of $30, $34 and $29. Centre = (2, (30 + 34 + 29) ÷ 3) = (2, 93 ÷ 3) = (2, 31).

**Example 2: assigning a customer.** Centres A = (2, 31) and B = (8, 90). A new customer is (7, 85). Distance to A = sqrt(5^2 + 54^2) = sqrt(25 + 2,916) = sqrt(2,941) = 54.2. Distance to B = sqrt(1^2 + 5^2) = sqrt(26) = 5.1. B is closer, so the customer joins B. (The basket column dominates here; scaling the columns first is wise.)

### Variance explained (PCA)
**Where it is used:** deciding how many components to keep.

```formula Share of variance explained
share of a component = variance of that component ÷ total variance
kept = sum of the shares of the components you keep
```
**In plain words:** each component carries a share of the information in the data. Keep enough components to reach a share you are happy with.

**Example 1: the lesson's run.** The first two components explain 0.49 and 0.481. Kept = 0.49 + 0.481 = 0.971, so 97.1%.

**Example 2: four components.** Variances 4, 3, 2, 1. Total = 10, so shares are 0.4, 0.3, 0.2, 0.1. Keeping two gives 0.4 + 0.3 = 0.7, only 70%. Keeping three gives 90%.

### Flag counts and the contamination setting (anomaly detection)
**Where it is used:** the Isolation Forest run on 1,000 payments.

```formula Flags, precision and recall
flagged = contamination × number of rows
precision = real anomalies among the flagged ÷ flagged
recall    = real anomalies among the flagged ÷ all real anomalies
```
**In plain words:** contamination is your guess of the share of anomalies, and it sets how many rows get flagged.

**Example 1: the lesson's run.** Contamination 0.02 × 1,000 rows = 20 flagged. 19 of the 20 are real, and there are 20 real anomalies. Precision = 19 ÷ 20 = 0.95. Recall = 19 ÷ 20 = 0.95.

**Example 2: a setting that is too high.** Contamination 0.05 × 1,000 = 50 flagged. Even if all 20 real anomalies are caught, precision = 20 ÷ 50 = 0.40. More alerts, but 3 in 5 are false alarms.

## Maths behind it
- Distance measures and centroids (k-means)
- Eigenvectors and singular value decomposition (PCA)
- Isolation and random partitioning (Isolation Forest)
- Probability distributions and outliers (statistics)

## Common mistakes
- Clustering unscaled data, so one big-number column decides everything.
- Treating clusters as truth; they are suggestions that need business sense.
- Expecting anomaly detection to explain why something is odd; it only says it is unusual.

## Quick check
Q: You have no labels but want customer segments. Which technique?
A: Clustering, such as k-means.

Q: What does "2 components keep 97.1% of the information" mean?
A: Two combined columns describe almost all the variation of the original ten, so you can use two instead of ten.

Q: Why combine anomaly detection with human review?
A: Unusual is not the same as wrong; people confirm real problems, and their decisions become labels for future models.
