# From lesson 'ml-unsupervised' (ml). Code status: Python executed 2026-11-02 (ml_basics.py kmeans, quickpath.py pca and anomaly); added technique snippets (2026-11-05) not run
import numpy as np

pts = np.array([[1, 2], [2, 3], [3, 1], [8, 9], [9, 8], [10, 10]], dtype=float)  # made-up points
centres = pts[[0, 3]].copy()                       # start with two of the points as centres

for _ in range(3):                                 # repeat a few times
    dist = np.linalg.norm(pts[:, None] - centres[None], axis=2)  # distance to each centre
    label = dist.argmin(axis=1)                    # step 1: nearest centre for each point
    for k in range(2):
        centres[k] = pts[label == k].mean(axis=0)  # step 2: move the centre to the group mean
print(centres, label)
