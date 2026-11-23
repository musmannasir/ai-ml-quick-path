---
id: ml-clustering
title: Clustering beyond k-means
module: ml
level: Intermediate
minutes: 75
maths: basic arithmetic
goal: Choose between k-means, hierarchical clustering, DBSCAN and Gaussian mixtures for a given shape of data, and score a clustering with the silhouette score without being fooled by stray points.
prereqs: ml-unsupervised
reviewed: 2026-11-18
evidence: A table comparing at least three clustering methods on one dataset with cluster sizes, noise points and silhouette scores, plus a sentence saying which you would use and why.
code: Python executed 2026-11-18 (examples/clustering/clustering.py); the C# DBSCAN and silhouette print the same line as the Python run
---
## In plain words
k-means is the clustering method most people learn first, but it makes strong assumptions: you must say how many groups there are, every group is round and about the same size, and every point must belong to a group, even a stray one. Other methods relax one assumption each. **Hierarchical clustering** builds a family tree of merges, so you can cut it at any number of groups. **DBSCAN** finds groups as dense crowds of points and labels the lonely points as **noise**, so you do not need to say the number of groups. A **Gaussian mixture** treats each group as a bell-shaped cloud and gives every point a soft share in each group. To compare clusterings you can use the **silhouette score**, which asks of every point whether it sits closer to its own group than to the nearest other group.

```diagram compare Four ways to cluster
note: Pick by the shape of your data and by what you must decide in advance.
## k-means | process
- You choose the number of groups
- Round groups of similar size
## Hierarchical | model
- Builds a tree of merges
- Cut the tree to get any number of groups
## DBSCAN | output
- Finds dense crowds, no number needed
- Leaves stray points as noise
## Gaussian mixture | warn
- Bell-shaped groups of different shape
- Soft membership for each point
```

```diagram flow How DBSCAN grows a cluster
note: A core point is one with enough neighbours inside the radius.
- Count neighbours within a radius | Enough of them makes it a core point | input
- Start a cluster from the core point | Its neighbours join | process
- Keep spreading through core points | The cluster grows to the edge of the crowd | model
- Leave unreached points as noise | They are not in any group | warn
```

```diagram flow Reading a silhouette score
note: The score runs from minus one to one. Higher is better separated.
- Average distance to the points in my own group | Call it a | input
- Average distance to the nearest other group | Call it b | process
- Score is (b minus a) over the larger | Near one means well placed | output
```

## Real-world example
A shop clusters its customers by how often they buy and how much they spend. Most customers form a few clear crowds. A handful of buyers spend enormous amounts on one-off orders. k-means is forced to put these buyers in some group, which drags that group's centre towards them and spoils the segment. DBSCAN marks them as noise, so the marketing team looks at them separately and the main segments stay clean. Later the team wants a tree they can show managers, so they use hierarchical clustering to explain how the segments merge.

## How it works
1. **Scale the features** so that no one feature dominates the distances.
2. **Pick a method** from the diagram above. For unknown group counts or stray points, try DBSCAN. For an explainable tree, use hierarchical clustering. For overlapping round groups, try a Gaussian mixture.
3. **Set its dial:** the number of groups for k-means and mixtures, the radius and the minimum neighbours for DBSCAN.
4. **Score and look.** Compute the silhouette score, look at group sizes and noise, and plot the groups if you can. Score alone is not enough.

```maths Silhouette score for one point
situation: A point sits in group A. Its average distance to the other points in group A is 0.5. Its average distance to the points in the nearest other group is 2.0. Made-up numbers.
find: What is this point's silhouette score?
step: Gap between the nearest other group and its own group | 2 - 0.5 = 1.5
step: The larger of the two distances | 2 = 2
step: Silhouette score | 1.5 ÷ 2 = 0.75
result: The score is 0.75. The point sits much closer to its own group than to the next one.
formula: silhouette = (b - a) ÷ the larger of a and b, where a = own-group distance, b = nearest-other-group distance
means: A score near 1 means the point is well inside its group. Near 0 means it is on the border. Below 0 means it is probably in the wrong group.
why: Averaging this score over all points gives one number for a whole clustering, which lets you compare different methods or different numbers of groups.
try: A second point has a = 1.5 and b = 1.5. What is its score, and what does it mean?
answer: (1.5 - 1.5) ÷ 1.5 = 0. The point sits exactly on the border between two groups.
```

## Python example
The data is 32 points: three tight groups of 10, plus two stray points far away, made by a repeatable rule. The program runs four methods and prints cluster sizes, noise points and the silhouette score, then tries k-means with different numbers of groups.

```python clustering.py
"""Four ways to cluster the same 32 points, and the silhouette score to compare them.

Three tight groups plus two stray points. Points come from a repeatable rule, so numbers repeat.
Run:  python clustering.py   (needs numpy and scikit-learn)
"""
import numpy as np
from sklearn.cluster import DBSCAN, AgglomerativeClustering, KMeans
from sklearn.metrics import silhouette_score
from sklearn.mixture import GaussianMixture

pts = []
for cx, cy in ((0.0, 0.0), (5.0, 0.0), (2.5, 4.0)):
    for j in range(10):
        r = 0.3 + 0.12 * (j % 5)
        pts.append((cx + r * np.cos(j * 2.399963), cy + r * np.sin(j * 2.399963)))
pts += [(10.0, 10.0), (-4.0, 6.0)]                                # two stray points
X = np.array(pts)

def report(name, labels):
    found = sorted(set(labels) - {-1})
    sizes = [int(np.sum(labels == c)) for c in found]
    noise = int(np.sum(labels == -1))
    keep = labels != -1
    sil = silhouette_score(X[keep], labels[keep])
    print("%-18s clusters %d  sizes %s  noise %d  silhouette %.3f" % (name, len(found), sizes, noise, sil))

report("DBSCAN", DBSCAN(eps=1.2, min_samples=4).fit_predict(X))
report("k-means (k=3)", KMeans(n_clusters=3, n_init=10, random_state=0).fit_predict(X))
report("hierarchical (Ward)", AgglomerativeClustering(n_clusters=3, linkage="ward").fit_predict(X))
report("Gaussian mixture", GaussianMixture(n_components=3, random_state=0).fit_predict(X))
for k in (2, 3, 4, 5):
    print("k-means with k=%d: silhouette %.3f" % (k, silhouette_score(X, KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(X))))
```
```text Output of clustering.py (executed)
DBSCAN             clusters 3  sizes [10, 10, 10]  noise 2  silhouette 0.831
k-means (k=3)      clusters 3  sizes [11, 11, 10]  noise 0  silhouette 0.695
hierarchical (Ward) clusters 3  sizes [12, 10, 10]  noise 0  silhouette 0.695
Gaussian mixture   clusters 3  sizes [10, 12, 10]  noise 0  silhouette 0.695
k-means with k=2: silhouette 0.478
k-means with k=3: silhouette 0.695
k-means with k=4: silhouette 0.744
k-means with k=5: silhouette 0.779
```
DBSCAN finds the three real groups of 10 and calls the two stray points noise. Its score is 0.831. The other three methods must place every point somewhere, so the two stray points join groups (sizes 11, 11, 10, or 12, 10, 10), and the score drops to 0.695. Ward hierarchical clustering and the Gaussian mixture reached the same grouping and the same score.

```maths The silhouette can reward a bad choice
situation: k-means was run with 2, 3, 4 and 5 groups on the same 32 points. The silhouette scores from the run above are 0.478, 0.695, 0.744 and 0.779.
find: Which number of groups does the silhouette favour, and is that right?
step: Gain from 3 groups to 4 | 0.744 - 0.695 = 0.049
step: Gain from 4 groups to 5 | 0.779 - 0.744 = 0.035
result: The score keeps rising up to 5 groups, so it favours 5. But the data has 3 real groups and 2 stray points. The extra groups are just the stray points getting a group of their own.
why: A silhouette score does not know what you want. Isolated points form tight little groups of one or two and raise the average. Always read the score together with the cluster sizes and a plot.
caution: This is a lesson about this particular data. On other data the silhouette often picks the right number of groups.
try: How many points does each of the extra groups contain when k = 5, given there are two stray points?
answer: At most one or two points each. Groups that small are a sign that the extra groups are strays, not real segments.
```

## .NET (C#) example
ML.NET has k-means but no DBSCAN, so this version writes DBSCAN and the silhouette score from scratch in C#. It needs no packages and prints the same DBSCAN line as the Python run: three clusters of 10, two noise points, silhouette 0.831. Hierarchical clustering and Gaussian mixtures are shown in Python only, because no .NET library for them is part of this guide's verified set.

```cs Program.cs
// DBSCAN and the silhouette score written from scratch (ML.NET offers k-means but not DBSCAN).
// Same points and the same DBSCAN line as clustering.py.
var pts = new List<(double x, double y)>();
foreach (var (cx, cy) in new[] { (0.0, 0.0), (5.0, 0.0), (2.5, 4.0) })
    for (int j = 0; j < 10; j++)
    {
        double r = 0.3 + 0.12 * (j % 5);
        pts.Add((cx + r * Math.Cos(j * 2.399963), cy + r * Math.Sin(j * 2.399963)));
    }
pts.Add((10.0, 10.0)); pts.Add((-4.0, 6.0));                      // two stray points
int n = pts.Count;
double Dist(int a, int b) => Math.Sqrt(Math.Pow(pts[a].x - pts[b].x, 2) + Math.Pow(pts[a].y - pts[b].y, 2));

// DBSCAN: a point with at least minPts points within eps (itself included) is a core point; clusters grow from core points.
const double eps = 1.2; const int minPts = 4;
int[] label = Enumerable.Repeat(-2, n).ToArray();                 // -2 = not visited, -1 = noise
List<int> Near(int p) => Enumerable.Range(0, n).Where(q => Dist(p, q) <= eps).ToList();
int cluster = 0;
for (int p = 0; p < n; p++)
{
    if (label[p] != -2) continue;
    var seeds = Near(p);
    if (seeds.Count < minPts) { label[p] = -1; continue; }
    label[p] = cluster;
    var queue = new Queue<int>(seeds);
    while (queue.Count > 0)
    {
        int q = queue.Dequeue();
        if (label[q] == -1) label[q] = cluster;                   // a noise point next to a core point joins the cluster
        if (label[q] != -2) continue;
        label[q] = cluster;
        var more = Near(q);
        if (more.Count >= minPts) foreach (int m in more) queue.Enqueue(m);
    }
    cluster++;
}

// Silhouette: for each point, a = average distance inside its cluster, b = average distance to the nearest other cluster.
var keep = Enumerable.Range(0, n).Where(i => label[i] >= 0).ToList();
double silhouette = keep.Average(i =>
{
    var own = keep.Where(j => label[j] == label[i] && j != i).ToList();
    double a = own.Count == 0 ? 0 : own.Average(j => Dist(i, j));
    double b = keep.Where(j => label[j] != label[i]).GroupBy(j => label[j]).Min(g => g.Average(j => Dist(i, j)));
    return own.Count == 0 ? 0 : (b - a) / Math.Max(a, b);
});
var sizes = Enumerable.Range(0, cluster).Select(c => label.Count(l => l == c));
Console.WriteLine($"{"DBSCAN",-18} clusters {cluster}  sizes [{string.Join(", ", sizes)}]  noise {label.Count(l => l == -1)}  silhouette {silhouette:F3}");
```

## Maths behind it
- Euclidean distance between points (geometry)
- Average distance within and between groups (statistics)
- The silhouette score formula (statistics)
- Bell-shaped (Gaussian) distributions for mixtures (probability)

## Common mistakes
- Clustering without scaling the features first.
- Trusting the silhouette score alone, especially when stray points exist.
- Forcing every point into a group when some are genuinely unusual.
- Choosing the number of groups by the score alone instead of by what the groups mean for the business.
- Treating cluster numbers as meaningful. Cluster 0 is just a label.

## Quick check
Q: Your data has a few very unusual points and you do not know the number of groups. Which method do you try first?
A: DBSCAN. It finds dense groups without being told how many, and it leaves the unusual points as noise.

Q: What does a silhouette score near 0 mean for a point?
A: The point is on the border between two groups. It is about as close to another group as to its own.

Q: Why did k-means with 5 groups get a higher silhouette than with 3 on the example data?
A: The two stray points formed small groups of their own, which raises the average. The extra groups are not real segments, which is why you read group sizes too.

Q: When would you pick hierarchical clustering over k-means?
A: When you want a tree you can cut at different levels and explain, or when you do not want to fix the number of groups in advance.
