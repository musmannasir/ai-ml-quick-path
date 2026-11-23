"""AdaBoost from scratch with one-question trees ("stumps") on ten points.

Each round: find the stump with the smallest weighted error, give it a vote size (alpha) from its error,
then increase the weight of the points it got wrong so the next stump pays more attention to them.
Run:  python adaboost.py   (needs numpy)
"""
import numpy as np

x = np.arange(1.0, 11.0)
y = np.array([1, 1, 1, -1, -1, -1, 1, 1, 1, -1])
w = np.full(10, 0.1)
stumps = []
print("round  rule                   weighted error  alpha")
for r in range(1, 4):
    best = None
    for t in np.arange(1.5, 10.0, 1.0):                  # thresholds between neighbouring points
        for s in (1, -1):                                # s = 1 means "above t is +1"
            pred = np.where(x > t, s, -s)
            err = float(w[pred != y].sum())
            if best is None or err < best[0] - 1e-12:
                best = (err, t, s)
    err, t, s = best
    alpha = 0.5 * np.log((1 - err) / err)
    pred = np.where(x > t, s, -s)
    w = w * np.exp(-alpha * y * pred)
    w = w / w.sum()
    stumps.append((alpha, t, s))
    print("%5d  x > %.1f gives %+d       %14.3f  %5.3f" % (r, t, s, err, alpha))
vote = sum(a * np.where(x > t, s, -s) for a, t, s in stumps)
print("ensemble accuracy after 3 rounds: %.2f" % np.mean(np.sign(vote) == y))
print("weights of the ten points after round 3:", " ".join("%.3f" % v for v in w))
