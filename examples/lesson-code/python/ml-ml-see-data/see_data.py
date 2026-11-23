# From lesson 'ml-see-data' (ml). Code status: Python executed 2026-11-18 (examples/seeing-data/see_data.py); the C# version prints the matching line for the first two columns
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
