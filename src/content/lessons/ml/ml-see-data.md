---
id: ml-see-data
title: Seeing high-dimensional data
module: ml
level: Intermediate
minutes: 60
maths: basic arithmetic
goal: Explain what PCA, kernel PCA, t-SNE and UMAP each try to keep when they squeeze many features into a 2-D picture, read such pictures safely, and measure how well a picture keeps the neighbours.
prereqs: ml-unsupervised
reviewed: 2026-11-18
evidence: A neighbour-preservation score for at least three 2-D pictures of the same dataset, and a short note on what each picture keeps and loses.
code: Python executed 2026-11-18 (examples/seeing-data/see_data.py); the C# version prints the matching line for the first two columns
---
## In plain words
You cannot draw five or fifty features on a page. To see the shape of the data you squeeze it into two numbers per point and plot those. Squeezing always loses something, so each method chooses what to keep. **PCA** keeps the directions in which the data varies most. **Kernel PCA** does the same after bending the space, so it can follow curved shapes. **t-SNE** and **UMAP** try to keep each point's near neighbours near, which makes groups easy to see. These pictures are for looking, not for measuring. Distances between far-apart groups, the size of groups and the empty space around them can all mean nothing. To avoid fooling yourself, measure how many of each point's true neighbours survive in the picture.

```diagram compare What each method tries to keep
note: Different goals give different pictures of the same data.
## PCA | process
- The directions of greatest spread
- Straight-line squeeze, repeatable
## Kernel PCA | model
- Spread after bending the space
- Can follow curved shapes
## t-SNE and UMAP | output
- Each point's near neighbours
- Great for spotting groups, weak on far distances
```

```diagram flow Checking a picture
note: A quick numeric check beats trusting your eyes.
- Find nearest neighbours in the original space | These are the true neighbours | input
- Find nearest neighbours in the 2-D picture | These are the pictured neighbours | process
- Count how many are in both lists | The share is the neighbour-preservation score | output
```

```diagram compare How not to read a t-SNE picture
note: The picture is a map of neighbourhoods, not of distances.
## Safe to read | output
- Which points belong together
- Whether there are several groups
## Not safe to read | bad
- How far apart two groups are
- Group size, or how empty the space between is
```

## Real-world example
A team has customer records with 40 features and wants to know whether natural segments exist. They run PCA first and see one blurry cloud. They try t-SNE and see five tight islands. Before showing the picture to managers, they measure it: for each customer, how many of its five nearest neighbours in the 40-feature space are also its five nearest neighbours in the picture? The t-SNE picture keeps most of them, so the islands are real neighbourhoods. They also warn that the gaps between islands carry no meaning.

## How it works
1. **Scale** the features first, then pick a method.
2. **Run the method** with its main dial: the number of components for PCA, the "perplexity" (roughly how many neighbours count as near) for t-SNE, the neighbour count for UMAP.
3. **Plot** the two output columns, coloured by any label you already have.
4. **Check** the picture by measuring neighbour preservation, and re-run with another seed or setting to see whether the groups stay.

```maths Neighbour preservation for one point
situation: For one point, its 5 nearest neighbours in the original 5-feature space are the points a, b, c, d and e. In a 2-D picture, its 5 nearest neighbours are a, b, f, g and h. Made-up labels.
find: What share of the true neighbours does the picture keep?
step: Neighbours in both lists (a and b) | 2 = 2
step: Share kept | 2 ÷ 5 = 0.4
result: The picture keeps 0.4 of this point's neighbours, which is 2 out of 5.
why: Averaging this share over all points gives one score for a picture. It tells you how much to trust "these two points look close" in that plot, without relying on how pretty the plot is.
caution: This score only checks neighbours. A picture can score well and still distort the distances between groups.
try: A picture keeps 3 of 5 neighbours for one point and 5 of 5 for another. What is the average of those two points?
answer: (3 ÷ 5 + 5 ÷ 5) ÷ 2 = (0.6 + 1) ÷ 2 = 0.8.
```

## Python example
Sixty points in five features form three groups. The program squeezes them to two columns in four ways, and for each prints the share of every point's 5 nearest neighbours that the picture keeps.

```python see_data.py
"""How well does a 2-D picture keep the neighbours? A check you can apply to any map of high-dimensional data.

60 points in 5 dimensions form three groups. Each method squeezes them to 2 dimensions. For every point we take its
5 nearest neighbours in the original space and count how many are still among its 5 nearest in the picture.
Run:  python see_data.py   (needs numpy and scikit-learn)
"""
import numpy as np
from sklearn.decomposition import PCA, KernelPCA
from sklearn.manifold import TSNE

n = 60
i = np.arange(n)
g = i % 3                                                       # which of three groups
X = np.column_stack([3.0 * g + 0.8 * np.sin(1.7 * i), 2.0 * (g == 1) + 0.8 * np.cos(2.3 * i),
                     1.5 * (g == 2) + 0.8 * np.sin(3.1 * i + 1), 0.8 * np.cos(0.9 * i), 0.8 * np.sin(4.3 * i)])

def nearest(D, k):
    D = D.copy(); np.fill_diagonal(D, np.inf)
    return np.argsort(D, axis=1)[:, :k]

def dist(A):
    return np.sqrt(((A[:, None, :] - A[None, :, :]) ** 2).sum(axis=2))

def preserved(Y, k=5):
    a, b = nearest(dist(X), k), nearest(dist(Y), k)
    return float(np.mean([len(set(a[r]) & set(b[r])) / k for r in range(n)]))

print("share of each point's 5 nearest neighbours kept in the 2-D picture")
print("  first two columns only: %.3f" % preserved(X[:, :2]))
print("  PCA:                    %.3f" % preserved(PCA(n_components=2).fit_transform(X)))
print("  kernel PCA (RBF):       %.3f" % preserved(KernelPCA(n_components=2, kernel="rbf", gamma=0.1).fit_transform(X)))
print("  t-SNE:                  %.3f" % preserved(TSNE(n_components=2, perplexity=10, init="pca", random_state=0).fit_transform(X)))
```
```text Output of see_data.py (executed)
share of each point's 5 nearest neighbours kept in the 2-D picture
  first two columns only: 0.467
  PCA:                    0.470
  kernel PCA (RBF):       0.407
  t-SNE:                  0.733
```
Just taking the first two columns keeps 0.467 of the neighbours, and PCA keeps 0.470, only a little better. The RBF kernel PCA keeps 0.407 with the setting used here; a different setting would give a different score. t-SNE keeps 0.733, much more, because neighbours are exactly what it tries to keep. The t-SNE numbers can differ a little between library versions and settings.

```maths Comparing two pictures
situation: The first two columns keep 0.467 of the neighbours and t-SNE keeps 0.733, from the run above.
find: How much more of the neighbourhood does t-SNE keep, and in what ratio?
step: Difference in the share kept | 0.733 - 0.467 = 0.266
step: How many times as many neighbours are kept | 0.733 ÷ 0.467 ≈ 1.57
result: t-SNE keeps 0.266 more of the neighbours, about 1.57 times as many as the first two columns.
why: A single number lets you choose the method and the dial by evidence. Notice that PCA does not win here: it is built to keep spread, not neighbours.
try: Out of 60 points with 5 neighbours each there are 300 neighbour slots. About how many does t-SNE keep at 0.733?
answer: 300 × 0.733 ≈ 220 of the 300.
```

UMAP works in much the same way as t-SNE, usually runs faster on large data and often keeps more of the broad layout. It is a separate library (`umap-learn`) that was not installed for this guide, so it is not run here.

## .NET (C#) example
.NET has no t-SNE or UMAP library that this guide could verify, so those pictures are made in Python. What you can do in C# is the check itself, which works on any 2-D picture. This program computes the neighbour-preservation score from scratch for the first-two-columns picture. It prints the same 0.467 as the Python run.

```cs Program.cs
// The neighbour-preservation check from see_data.py, written from scratch. It works on any 2-D picture of the data.
// .NET has no ready-made t-SNE or UMAP that this guide could verify, so those are run in Python; here we apply
// the same check to the simplest picture, the first two columns.
const int n = 60;
var X = new double[n][];
for (int i = 0; i < n; i++)
{
    int g = i % 3;                                                // which of three groups
    X[i] = new[] { 3.0 * g + 0.8 * Math.Sin(1.7 * i), 2.0 * (g == 1 ? 1 : 0) + 0.8 * Math.Cos(2.3 * i),
                   1.5 * (g == 2 ? 1 : 0) + 0.8 * Math.Sin(3.1 * i + 1), 0.8 * Math.Cos(0.9 * i), 0.8 * Math.Sin(4.3 * i) };
}
double Dist(double[] a, double[] b, int dims) => Math.Sqrt(Enumerable.Range(0, dims).Sum(k => Math.Pow(a[k] - b[k], 2)));
int[] Nearest(int p, int dims, int k) =>
    Enumerable.Range(0, n).Where(q => q != p).OrderBy(q => Dist(X[p], X[q], dims)).Take(k).ToArray();

int k = 5;
double kept = Enumerable.Range(0, n).Average(p => Nearest(p, 5, k).Intersect(Nearest(p, 2, k)).Count() / (double)k);
Console.WriteLine("share of each point's 5 nearest neighbours kept in the 2-D picture");
Console.WriteLine($"  first two columns only: {kept:F3}");
```

## Maths behind it
- Variance and directions of greatest spread (linear algebra, statistics)
- Distances between points and their nearest neighbours (geometry)
- Averaging a share over all points (arithmetic)

## Common mistakes
- Reading distances between groups, or group sizes, in a t-SNE or UMAP picture.
- Running t-SNE once and believing it. Try other settings and seeds.
- Using a picture as proof that groups exist. Measure with the original features.
- Forgetting to scale the features first.
- Using a 2-D picture as the input to another model without checking what it lost.

## Quick check
Q: What does PCA keep, and what does t-SNE keep?
A: PCA keeps the directions in which the data spreads most. t-SNE keeps each point's near neighbours, so groups show up clearly.

Q: In a t-SNE picture, two groups are drawn far apart. Does it mean they are very different?
A: Not necessarily. t-SNE keeps neighbourhoods, not far distances, so the gap between groups can mean nothing.

Q: How can you check that a 2-D picture is trustworthy?
A: Measure neighbour preservation: for each point, count how many of its nearest neighbours in the original space are still its nearest neighbours in the picture. A high share means the local picture is faithful.

Q: A picture keeps 3 of each point's 5 neighbours. What is the neighbour-preservation score?
A: 3 ÷ 5 = 0.6.
