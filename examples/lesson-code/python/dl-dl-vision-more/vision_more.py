# From lesson 'dl-vision-more' (dl). Code status: Python executed 2026-11-18 (examples/vision-more/vision_more.py, NumPy only); PyTorch was not run; the C# version prints the same output
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
