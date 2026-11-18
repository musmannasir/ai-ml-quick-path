"""Three pattern tools: Mahalanobis distance, kernel density, and association rules (support, confidence, lift).

Run:  python patterns.py   (needs numpy)
"""
import numpy as np

# 1. Mahalanobis distance: how unusual is a point, given how the data usually moves together?
i = np.arange(30)
x = 2.0 * np.sin(0.9 * i)
y = 0.8 * x + 0.3 * np.cos(2.1 * i)                             # y follows x, with a little wobble
P = np.column_stack([x, y])
mu = P.mean(axis=0)
cov = np.cov(P, rowvar=False)
inv = np.linalg.inv(cov)
for q in ((1.5, 1.2), (1.5, -1.2)):                              # same distance from the centre, different direction
    v = np.array(q) - mu
    print("point (%.1f, %.1f): straight-line distance %.3f  Mahalanobis distance %.3f" % (q[0], q[1], np.sqrt(v @ v), np.sqrt(v @ inv @ v)))

# 2. Kernel density: add a small bell curve over every data value
vals = np.array([1.0, 1.2, 1.5, 1.9, 2.1, 2.4, 6.0, 6.3, 6.5, 6.8, 7.1, 12.0])
def density(at, h=0.5):
    return float(np.mean(np.exp(-0.5 * ((at - vals) / h) ** 2) / (h * np.sqrt(2 * np.pi))))
print("density at 2.0: %.3f   at 4.5: %.3f   at 12.0: %.3f" % (density(2.0), density(4.5), density(12.0)))

# 3. Association rules on eight shopping baskets
baskets = [{"bread", "milk"}, {"bread", "eggs"}, {"bread", "milk", "eggs"}, {"milk"},
           {"bread", "milk"}, {"eggs"}, {"bread", "milk", "tea"}, {"tea", "milk"}]
def share(items):
    return sum(items <= b for b in baskets) / len(baskets)
s_both, s_bread, s_milk = share({"bread", "milk"}), share({"bread"}), share({"milk"})
print("bread and milk: support %.3f  confidence(bread -> milk) %.3f  lift %.3f" % (s_both, s_both / s_bread, (s_both / s_bread) / s_milk))
