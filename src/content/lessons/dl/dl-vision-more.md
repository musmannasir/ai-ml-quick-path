---
id: dl-vision-more
title: More computer vision, filters, mixing and metric learning
module: dl
level: Intermediate
minutes: 60
maths: basic arithmetic
goal: Apply an edge filter by hand, explain how mixup and CutMix make training images more varied, and describe how a triplet loss teaches a network to place similar images close together, as in face matching.
prereqs: dl-vision
reviewed: 2026-11-18
evidence: A Sobel filter applied by hand to a 3 by 3 patch, a mixup of two small images with its label mix, and a triplet loss worked out for one easy and one hard negative.
code: Python executed 2026-11-18 (examples/vision-more/vision_more.py, NumPy only); PyTorch was not run; the C# version prints the same output
---
## In plain words
The first computer-vision lesson showed what a convolution does. Three more ideas fill in the picture. **Classic filters** such as the Sobel filter find edges by sliding a small table of numbers over the image; a convolutional network learns tables like these by itself, and its first layers often look like them. **Mixing** methods make training images more varied: **mixup** blends two images and their labels, and **CutMix** pastes a patch of one image into another. They stop a network from memorising the training set. **Metric learning** teaches a network to place images in a space where similar ones are close, using a **triplet loss**: an anchor image, a positive image of the same thing and a negative image of something else. This is how face matching and image search work: the network does not say who is in the picture, it says how close two pictures are.

```diagram flow Edge detection with a filter
note: Where the brightness changes, the filter gives a big number. In flat areas it gives zero.
- Take a 3 by 3 patch of pixels | Small window of the image | input
- Multiply each pixel by the filter number | Left side negative, right side positive | process
- Add the nine products | One number for this patch | model
- Slide the window and repeat | The result is an edge map | output
```

```diagram compare Ways to vary training images
note: All of them make the network see something new each time, which fights overfitting.
## Mixup | process
- Blend two images with a weight
- Blend the two labels with the same weight
## CutMix | model
- Paste a rectangle from one image into another
- Mix the labels by the area of each part
```

```diagram flow Learning a space of similar images
note: The loss is zero once the positive is closer than the negative by at least the margin.
- Pick an anchor, a positive and a negative image | Same thing twice, plus something different | input
- Turn each into a short list of numbers | The network's embedding | model
- Compare the two distances | Positive should be closer by a margin | process
- Update the network where the order is wrong | Pull positives in, push negatives out | output
```

## Real-world example
A building uses a camera to let staff in by their faces. The system does not classify each of 500 employees. It turns every face into a short list of numbers using a network trained with a triplet loss, and stores one list per employee. At the door it turns the new face into a list and checks whether it is close enough to any stored list. New employees can be added without retraining, because the network only needs to measure closeness. The company also tests the threshold with photos taken in poor light, because systems like this can be less reliable for some groups of people unless they are tested and the training data is balanced.

## How it works
1. **Filters.** Slide a small table of numbers over the image, multiply and add at each position. A Sobel filter has negative numbers on the left, positive on the right, so it responds to a change from dark to bright.
2. **Mixup.** Pick a weight between 0 and 1. Blend two images pixel by pixel with that weight, and mix their labels the same way. The network is trained on the blend.
3. **Triplet loss.** For each triplet, compute the distance from the anchor to the positive and to the negative. The loss is the positive distance, minus the negative distance, plus a margin, but never below zero.
4. **Use.** For matching, compare two embeddings by distance and decide with a threshold chosen on validation data.

```maths A Sobel filter on one patch
situation: A 3 by 3 patch is dark on the left and bright on the right: each row is 0, 0, 9. The Sobel filter rows are (-1, 0, 1), (-2, 0, 2) and (-1, 0, 1).
find: What number does the filter give for this patch?
step: Top row of the filter times the patch | -1 × 0 + 0 × 0 + 1 × 9 = 9
step: Middle row (counts double) | -2 × 0 + 0 × 0 + 2 × 9 = 18
step: Bottom row | -1 × 0 + 0 × 0 + 1 × 9 = 9
step: Add the three rows | 9 + 18 + 9 = 36
result: The response is 36, a strong edge. A patch with the same brightness everywhere gives 0.
why: Edges are the first thing a vision network needs. The first convolution layer of a trained network often learns filters that look very much like this one, so you know what its first layer is doing.
try: What does the filter give for a patch with rows 0, 9, 9?
answer: Top row: -1 × 0 + 0 × 9 + 1 × 9 = 9. Middle row: -2 × 0 + 0 × 9 + 2 × 9 = 18. Bottom row 9. Total 36 again, because the edge sits at the first column. It cannot tell where, only that the brightness steps up.
```

```maths Mixup of two images
situation: Two tiny 2 by 2 images, a cat photo and a dog photo. The first has pixels 0, 1 in the top row. The second has 1, 1. Mix them with weight 0.7 for the first. The labels become 70% cat and 30% dog.
find: What are the mixed pixels in the top row, and the mixed label?
step: Top-left pixel | 0.7 × 0 + 0.3 × 1 = 0.3
step: Top-right pixel | 0.7 × 1 + 0.3 × 1 = 1
step: Label share for the first image | 0.7 × 1 + 0.3 × 0 = 0.7
result: The mixed top row is 0.3, 1.0 and the label is 70% cat, 30% dog.
why: The network is asked to be unsure in the same proportion as the blend. This discourages sharp, overconfident boundaries and usually improves accuracy on new images.
```

```maths Triplet loss for an easy and a hard negative
situation: In the embedding space the anchor to positive distance is 0.707. A far negative is at distance 5.0. A hard negative, that looks much like the anchor, is at distance 1.131. The margin is 1.0.
find: What is the loss for each negative?
step: Easy negative: positive distance minus negative distance plus margin | 0.707 - 5 + 1 = -3.293
step: A negative result counts as zero, so the loss is | 0 = 0
step: Hard negative: positive distance minus negative distance plus margin | 0.707 - 1.131 + 1 = 0.576
result: The easy negative gives loss 0 and teaches nothing. The hard negative gives 0.576 and drives learning.
formula: loss = the larger of (distance to positive - distance to negative + margin) and 0
why: Training time is wasted on triplets that are already right. Choosing hard negatives is the main trick in practice.
try: If the hard negative were at distance 1.9 instead, what would the loss be?
answer: 0.707 - 1.9 + 1 = -0.193, so the loss is 0. The negative is now far enough, by more than the margin, and the triplet no longer teaches anything.
```

## Python example
NumPy only: the Sobel filter slid over a 6 by 6 image, a mixup of two small images, and the triplet loss for an easy and a hard negative. PyTorch was not installed for this lesson, so real training of a face network is not shown.

```python vision_more.py
"""Three small computer-vision ideas with NumPy only: an edge filter, mixup, and the triplet loss.

Run:  python vision_more.py
"""
import numpy as np

# 1. Edge detection: slide a 3x3 Sobel filter over a tiny image with a vertical edge
img = np.array([[0, 0, 0, 9, 9, 9]] * 6, dtype=float)     # dark on the left, bright on the right
sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=float)
out = np.zeros((4, 4))
for r in range(4):
    for c in range(4):
        out[r, c] = float((img[r:r + 3, c:c + 3] * sobel_x).sum())
print("Sobel response, one row of the 4x4 output:", out[0].astype(int).tolist())

# 2. Mixup: blend two images and their labels with a weight
a = np.array([[0.0, 1.0], [1.0, 0.0]])
b = np.array([[1.0, 1.0], [0.0, 0.0]])
lam = 0.7
print("mixup image:", (lam * a + (1 - lam) * b).round(2).tolist(), " label mix: cat %.1f, dog %.1f" % (lam, 1 - lam))

# 3. Triplet loss: pull the positive closer than the negative by at least a margin
anchor, positive, negative = np.array([1.0, 2.0]), np.array([1.5, 2.5]), np.array([4.0, 6.0])
d_pos = float(np.linalg.norm(anchor - positive))
d_neg = float(np.linalg.norm(anchor - negative))
margin = 1.0
print("distance to positive %.3f, to negative %.3f, triplet loss %.3f" % (d_pos, d_neg, max(0.0, d_pos - d_neg + margin)))
neg2 = np.array([1.8, 2.8])
d2 = float(np.linalg.norm(anchor - neg2))
print("with a hard negative at distance %.3f, triplet loss %.3f" % (d2, max(0.0, d_pos - d2 + margin)))
```
```text Output of vision_more.py (executed)
Sobel response, one row of the 4x4 output: [0, 36, 36, 0]
mixup image: [[0.3, 1.0], [0.7, 0.0]]  label mix: cat 0.7, dog 0.3
distance to positive 0.707, to negative 5.000, triplet loss 0.000
with a hard negative at distance 1.131, triplet loss 0.576
```
The filter row is 0, 36, 36, 0. It is zero in the flat parts and 36 at the two positions where the window includes the edge. The mixed image is 0.3, 1.0 over 0.7, 0.0 with the label 0.7 cat and 0.3 dog. The triplet loss is 0.000 for the far negative and 0.576 for the hard one.

Four more ideas, named only. **SIFT** is a classic method that finds and describes corner-like points so they can be matched between photos. **SimCLR** trains a network without labels by making two altered copies of one image land close together in the embedding and other images land far away. **Image captioning** feeds the image embedding to a language model that writes a sentence. **Optical flow** estimates how each pixel moves between two video frames. This guide does not run these, because they need larger libraries.

## .NET (C#) example
The same three calculations from scratch in C#, with no packages, printing the same output. For real work, run a trained vision network in C# through ONNX Runtime, as shown in the computer vision lesson.

```cs Program.cs
// An edge filter, mixup and the triplet loss, from scratch. Same output as vision_more.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// 1. Edge detection: slide a 3x3 Sobel filter over a tiny image with a vertical edge
double[,] img = new double[6, 6];
for (int r = 0; r < 6; r++) for (int c = 3; c < 6; c++) img[r, c] = 9;      // dark on the left, bright on the right
double[,] sobel = { { -1, 0, 1 }, { -2, 0, 2 }, { -1, 0, 1 } };
var row0 = new List<int>();
for (int c = 0; c < 4; c++)
{
    double sum = 0;
    for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) sum += img[0 + i, c + j] * sobel[i, j];
    row0.Add((int)sum);
}
Console.WriteLine("Sobel response, one row of the 4x4 output: [" + string.Join(", ", row0) + "]");

// 2. Mixup: blend two images and their labels with a weight
double[,] a = { { 0, 1 }, { 1, 0 } }, b = { { 1, 1 }, { 0, 0 } };
double lam = 0.7;
string F(double v) => Math.Round(v, 2).ToString("0.0#");
var mix = new double[2, 2];
for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) mix[i, j] = lam * a[i, j] + (1 - lam) * b[i, j];
Console.WriteLine($"mixup image: [[{F(mix[0, 0])}, {F(mix[0, 1])}], [{F(mix[1, 0])}, {F(mix[1, 1])}]]  label mix: cat {lam:F1}, dog {1 - lam:F1}");

// 3. Triplet loss: pull the positive closer than the negative by at least a margin
double Dist(double[] p, double[] q) => Math.Sqrt(p.Zip(q, (u, v) => (u - v) * (u - v)).Sum());
double[] anchor = { 1, 2 }, positive = { 1.5, 2.5 }, negative = { 4, 6 }, hard = { 1.8, 2.8 };
double dPos = Dist(anchor, positive), dNeg = Dist(anchor, negative), margin = 1.0;
Console.WriteLine($"distance to positive {dPos:F3}, to negative {dNeg:F3}, triplet loss {Math.Max(0, dPos - dNeg + margin):F3}");
double d2 = Dist(anchor, hard);
Console.WriteLine($"with a hard negative at distance {d2:F3}, triplet loss {Math.Max(0, dPos - d2 + margin):F3}");
```

## Maths behind it
- Convolution as multiply-and-add over a window (arithmetic)
- Weighted averages: mixup is a blend (arithmetic)
- Euclidean distance between embeddings (geometry)
- The larger-of-two rule that keeps a loss at or above zero (arithmetic)

## Common mistakes
- Mixing the pixels but not the labels, which teaches the network wrong answers.
- Using only easy negatives in triplet training and learning nothing.
- Setting the face-match threshold on the training photos.
- Using one filter for every kind of edge. A single Sobel filter finds only edges in one direction.
- Ignoring how a matching system behaves across different groups of people and lighting.

## Quick check
Q: What does a Sobel filter respond to?
A: A change in brightness across the window. It gives a large number at an edge and zero on a flat area.

Q: Why mix the labels in mixup as well as the pixels?
A: The blended image is partly each class, so the correct answer is partly each class. Using the original label would teach a wrong answer.

Q: In a triplet loss, why are easy negatives useless?
A: They are already farther from the anchor than the positive by more than the margin, so the loss is zero and nothing is learned from them.

Q: Why can a face system add a new person without retraining?
A: The network only produces embeddings. A new person is added by storing their embedding, and matching is done by distance.
