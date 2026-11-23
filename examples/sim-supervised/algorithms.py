"""The calculation behind the "Supervised algorithms side by side" simulation, in plain Python (no packages).

It makes the same made-up points as the page, fits the same four algorithms (k-nearest neighbours, logistic
regression, a decision tree and Gaussian naive Bayes) and prints the same accuracies. scripts/check-sims.mjs
checks that the page's JavaScript agrees with this program.

Run:  python algorithms.py
"""
import math


def lcg(seed):
    s = seed & 0xFFFFFFFF
    def nxt():
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
        return s / 4294967296
    return nxt


def clamp(v):
    return max(-0.98, min(0.98, v))


def make_data(kind, n, seed):
    r = lcg(seed)
    g = lambda: (r() + r() + r() - 1.5) * 2
    X, y = [], []
    for i in range(n):
        c = i % 2
        if kind == "blobs":
            cx, cy = (0.4, 0.3) if c else (-0.4, -0.3)
            x = cx + 0.3 * g(); v = cy + 0.3 * g()
        elif kind == "moons":
            t = r() * math.pi
            if c:
                x = (1 - math.cos(t) - 0.5) / 1.2 + 0.1 * g(); v = (1 - math.sin(t) - 0.5) / 1.0 + 0.1 * g()
            else:
                x = (math.cos(t) - 0.5) / 1.2 + 0.1 * g(); v = (math.sin(t) - 0.25) / 1.0 + 0.1 * g()
        else:
            a = r() * 2 * math.pi
            rad = 0.35 if c else 0.8
            x = rad * math.cos(a) + 0.09 * g(); v = rad * math.sin(a) + 0.09 * g()
        X.append([clamp(x), clamp(v)]); y.append(c)
    return X, y


def fit_knn(X, y, k):
    def predict(p):
        order = sorted(range(len(X)), key=lambda i: ((X[i][0] - p[0]) ** 2 + (X[i][1] - p[1]) ** 2, i))
        kk = min(k, len(order))
        return sum(y[i] for i in order[:kk]) / kk
    return predict


def fit_logistic(X, y, steps):
    n = len(X)
    m, sd = [0.0, 0.0], [0.0, 0.0]
    for f in range(2):
        for q in X:
            m[f] += q[f] / n
        for q in X:
            sd[f] += (q[f] - m[f]) * (q[f] - m[f]) / n
        sd[f] = math.sqrt(sd[f]) or 1.0
    Z = [[(q[0] - m[0]) / sd[0], (q[1] - m[1]) / sd[1]] for q in X]
    w, b = [0.0, 0.0], 0.0
    for _ in range(steps):
        g0 = g1 = gb = 0.0
        for i in range(n):
            p = 1 / (1 + math.exp(-(w[0] * Z[i][0] + w[1] * Z[i][1] + b)))
            e = p - y[i]
            g0 += e * Z[i][0] / n; g1 += e * Z[i][1] / n; gb += e / n
        w[0] -= 0.5 * g0; w[1] -= 0.5 * g1; b -= 0.5 * gb
    return lambda p: 1 / (1 + math.exp(-(w[0] * (p[0] - m[0]) / sd[0] + w[1] * (p[1] - m[1]) / sd[1] + b)))


def gini(ones, n):
    if not n:
        return 0.0
    p = ones / n
    return 2 * p * (1 - p)


def entropy(ones, n):
    if not n:
        return 0.0
    p = ones / n
    return 0.0 if p <= 0 or p >= 1 else -(p * math.log2(p) + (1 - p) * math.log2(1 - p))


def build_tree(X, y, idx, depth, max_depth, measure="gini"):
    imp = entropy if measure == "entropy" else gini
    ones = sum(y[i] for i in idx)
    node = {"p": ones / len(idx) if idx else 0.5}
    if depth >= max_depth or ones == 0 or ones == len(idx) or len(idx) < 2:
        return node
    best = None
    for f in range(2):
        s = sorted(idx, key=lambda i: (X[i][f], i))
        left1 = 0
        for k in range(len(s) - 1):
            left1 += y[s[k]]
            if X[s[k]][f] == X[s[k + 1]][f]:
                continue
            nl, nr = k + 1, len(s) - k - 1
            score = (nl * imp(left1, nl) + nr * imp(ones - left1, nr)) / len(s)
            if best is None or score < best[0] - 1e-12:
                best = (score, f, (X[s[k]][f] + X[s[k + 1]][f]) / 2)
    if best is None:
        return node
    _, f, t = best
    L = [i for i in idx if X[i][f] <= t]
    R = [i for i in idx if not X[i][f] <= t]
    if not L or not R:
        return node
    node.update(f=f, t=t, l=build_tree(X, y, L, depth + 1, max_depth, measure), r=build_tree(X, y, R, depth + 1, max_depth, measure))
    return node


def fit_tree(X, y, depth, measure="gini"):
    root = build_tree(X, y, list(range(len(X))), 0, depth, measure)
    def predict(p):
        n = root
        while "l" in n:
            n = n["l"] if p[n["f"]] <= n["t"] else n["r"]
        return n["p"]
    return predict


def fit_nb(X, y):
    stats = []
    for c in (0, 1):
        pts = [q for q, yy in zip(X, y) if yy == c]
        n = len(pts)
        s = {"prior": n / len(X), "m": [0.0, 0.0], "v": [0.0, 0.0]}
        for f in range(2):
            for q in pts:
                s["m"][f] += q[f] / n
            for q in pts:
                s["v"][f] += (q[f] - s["m"][f]) * (q[f] - s["m"][f]) / n
            s["v"][f] += 1e-3
        stats.append(s)
    def predict(p):
        lp = []
        for s in stats:
            t = math.log(s["prior"])
            for f in range(2):
                t += -0.5 * math.log(2 * math.pi * s["v"][f]) - (p[f] - s["m"][f]) ** 2 / (2 * s["v"][f])
            lp.append(t)
        m = max(lp)
        e0, e1 = math.exp(lp[0] - m), math.exp(lp[1] - m)
        return e1 / (e0 + e1)
    return predict


def accuracy(predict, X, y):
    return sum((1 if predict(p) >= 0.5 else 0) == t for p, t in zip(X, y)) / len(X)


if __name__ == "__main__":
    for kind in ("blobs", "moons", "circles"):
        trX, trY = make_data(kind, 100, 3)
        teX, teY = make_data(kind, 60, 17)
        fits = {"k-nearest (k=5)": fit_knn(trX, trY, 5), "logistic (300 steps)": fit_logistic(trX, trY, 300),
                "tree (depth 3)": fit_tree(trX, trY, 3), "naive Bayes": fit_nb(trX, trY)}
        print(kind + ": " + "; ".join("%s train %.2f test %.2f" % (name, accuracy(f, trX, trY), accuracy(f, teX, teY)) for name, f in fits.items()))
    for kind in ("blobs", "moons", "circles"):
        trX, trY = make_data(kind, 100, 3)
        teX, teY = make_data(kind, 60, 17)
        f = fit_tree(trX, trY, 3, "entropy")
        print(kind + ", tree (depth 3, entropy): train %.2f test %.2f" % (accuracy(f, trX, trY), accuracy(f, teX, teY)))
    trX, trY = make_data("blobs", 100, 3)
    teX, teY = make_data("blobs", 60, 17)
    f = fit_knn(trX, trY, 1)
    print("blobs, k=1: train %.2f test %.2f" % (accuracy(f, trX, trY), accuracy(f, teX, teY)))
