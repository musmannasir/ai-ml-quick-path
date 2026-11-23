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
