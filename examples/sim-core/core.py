"""The calculation behind the Phase 2 simulations (regression, classification, bias and variance, cross-validation,
clustering, PCA, anomalies), in plain Python (no packages). The page does the same calculation in JavaScript
(public/assets/sims/core.js); scripts/check-sims.mjs checks that the two agree.

Run:  python core.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim-supervised"))
from algorithms import lcg, make_data, fit_knn, fit_logistic  # noqa: E402


def gauss(r):
    return (r() + r() + r() - 1.5) * 2


# ---- regression ----
def reg_data(seed, n, noise, outlier):
    r = lcg(seed)
    X, Y = [], []
    for _ in range(n):
        x = -0.9 + 1.8 * r()
        X.append(x)
        Y.append(1.5 * x + 0.3 + noise * gauss(r))
    if outlier:
        X.append(0.9)
        Y.append(-1.5)
    return X, Y


def ols(X, Y, lam):
    n = len(X)
    mx, my = sum(X) / n, sum(Y) / n
    sxx = sum((x - mx) ** 2 for x in X)
    sxy = sum((x - mx) * (y - my) for x, y in zip(X, Y))
    a = sxy / (sxx + lam)
    return a, my - a * mx


def mse(X, Y, a, b):
    return sum((y - (a * x + b)) ** 2 for x, y in zip(X, Y)) / len(X)


def r2(X, Y, a, b):
    my = sum(Y) / len(Y)
    return 1 - sum((y - (a * x + b)) ** 2 for x, y in zip(X, Y)) / sum((y - my) ** 2 for y in Y)


# ---- classification ----
def cls_data(seed, n):
    r = lcg(seed)
    X, y = [], []
    for i in range(n):
        c = i % 2
        cx, cy = (0.22, 0.18) if c else (-0.22, -0.18)
        X.append([cx + 0.3 * gauss(r), cy + 0.3 * gauss(r)])
        y.append(c)
    return X, y


def confusion(p, y, thr):
    tp = sum(1 for a, c in zip(p, y) if a >= thr and c == 1)
    fp = sum(1 for a, c in zip(p, y) if a >= thr and c == 0)
    fn = sum(1 for a, c in zip(p, y) if a < thr and c == 1)
    tn = sum(1 for a, c in zip(p, y) if a < thr and c == 0)
    return tp, fp, fn, tn


def roc_auc(p, y):
    order = sorted(range(len(p)), key=lambda i: (-p[i], i))
    P, N = sum(y), len(y) - sum(y)
    tp = fp = 0
    pts = [(0.0, 0.0)]
    for i in order:
        if y[i] == 1:
            tp += 1
        else:
            fp += 1
        pts.append((fp / N, tp / P))
    return sum((pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2 for i in range(1, len(pts)))


# ---- bias and variance ----
def poly_data(seed, n, noise):
    r = lcg(seed)
    X, Y = [], []
    for _ in range(n):
        x = -1 + 2 * r()
        X.append(x)
        Y.append(math.sin(3 * x) + noise * gauss(r))
    return X, Y


def poly_fit(X, Y, deg):
    m = deg + 1
    A = [[sum(x ** (i + j) for x in X) for j in range(m)] for i in range(m)]
    b = [sum(y * x ** i for x, y in zip(X, Y)) for i in range(m)]
    for c in range(m):
        piv = max(range(c, m), key=lambda r_: abs(A[r_][c]))
        A[c], A[piv] = A[piv], A[c]
        b[c], b[piv] = b[piv], b[c]
        for r_ in range(c + 1, m):
            f = A[r_][c] / A[c][c]
            for k in range(c, m):
                A[r_][k] -= f * A[c][k]
            b[r_] -= f * b[c]
    w = [0.0] * m
    for i in range(m - 1, -1, -1):
        w[i] = (b[i] - sum(A[i][j] * w[j] for j in range(i + 1, m))) / A[i][i]
    return w


def poly_mse(w, X, Y):
    return sum((y - sum(c * x ** i for i, c in enumerate(w))) ** 2 for x, y in zip(X, Y)) / len(X)


# ---- cross-validation ----
def folds(n, k, seed):
    r = lcg(seed)
    idx = list(range(n))
    for i in range(n - 1, 0, -1):
        j = int(r() * (i + 1))
        idx[i], idx[j] = idx[j], idx[i]
    fold = [0] * n
    for pos, i in enumerate(idx):
        fold[i] = pos % k
    return fold


def cv_scores(X, y, k, seed, kk):
    fold = folds(len(X), k, seed)
    out = []
    for f in range(k):
        tr = [i for i in range(len(X)) if fold[i] != f]
        te = [i for i in range(len(X)) if fold[i] == f]
        pred = fit_knn([X[i] for i in tr], [y[i] for i in tr], kk)
        out.append(sum(1 for i in te if (1 if pred(X[i]) >= 0.5 else 0) == y[i]) / len(te))
    return out


# ---- clustering ----
def blobs3(n, seed):
    r = lcg(seed)
    C = [(-0.6, -0.5), (0.6, -0.4), (0.0, 0.6)]
    X = []
    for i in range(n):
        c = C[i % 3]
        x = c[0] + 0.18 * gauss(r)
        y = c[1] + 0.18 * gauss(r)
        X.append([x, y])
    return X


def d2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def kmeans(X, k, seed, max_iter=30):
    r = lcg(seed)
    pick = []
    while len(pick) < k:
        i = int(r() * len(X))
        if i not in pick:
            pick.append(i)
    C = [list(X[i]) for i in pick]
    prev, hist = None, []
    for _ in range(max_iter):
        lab = [min(range(k), key=lambda c: (d2(p, C[c]), c)) for p in X]
        inertia = sum(d2(p, C[l]) for p, l in zip(X, lab))
        hist.append(("assign", inertia))
        if lab == prev:
            break
        prev = lab
        for c in range(k):
            m = [p for p, l in zip(X, lab) if l == c]
            if m:
                C[c] = [sum(p[0] for p in m) / len(m), sum(p[1] for p in m) / len(m)]
        hist.append(("move", sum(d2(p, C[l]) for p, l in zip(X, lab))))
    return hist[-1][1], len(hist)


def dbscan(X, eps, min_pts):
    n = len(X)
    nb = [[j for j in range(n) if d2(X[i], X[j]) <= eps * eps] for i in range(n)]
    lab = [None] * n
    c = -1
    for i in range(n):
        if lab[i] is not None or len(nb[i]) < min_pts:
            continue
        c += 1
        lab[i] = c
        queue = list(nb[i])
        while queue:
            j = queue.pop(0)
            if lab[j] is None:
                lab[j] = c
                if len(nb[j]) >= min_pts:
                    queue.extend(nb[j])
    return lab


# ---- PCA ----
def pca_data(seed, n):
    r = lcg(seed)
    X = []
    ca, sa = math.cos(math.radians(30)), math.sin(math.radians(30))
    for _ in range(n):
        t, e = 0.6 * gauss(r), 0.15 * gauss(r)
        X.append([t * ca - e * sa, t * sa + e * ca])
    mx, my = sum(p[0] for p in X) / n, sum(p[1] for p in X) / n
    return [[p[0] - mx, p[1] - my] for p in X]


def pca_stats(X):
    n = len(X)
    sxx = sum(p[0] ** 2 for p in X) / n
    syy = sum(p[1] ** 2 for p in X) / n
    sxy = sum(p[0] * p[1] for p in X) / n
    return sxx, syy, sxy


def var_along(s, deg):
    t = math.radians(deg)
    return s[0] * math.cos(t) ** 2 + 2 * s[2] * math.sin(t) * math.cos(t) + s[1] * math.sin(t) ** 2


# ---- anomalies ----
ODD = [[0.9, 0.85], [-0.9, 0.7], [0.8, -0.9], [-0.85, -0.8]]


def anomaly_data(seed, n):
    r = lcg(seed)
    X = [[0.25 * gauss(r), 0.25 * gauss(r)] for _ in range(n)]
    return X + [list(p) for p in ODD]


def knn_scores(X, k):
    out = []
    for i, p in enumerate(X):
        ds = sorted(math.sqrt(d2(p, q)) for j, q in enumerate(X) if j != i)
        out.append(ds[k - 1])
    return out


def flag(scores, contamination):
    cnt = math.ceil(contamination * len(scores) - 1e-9)
    order = sorted(range(len(scores)), key=lambda i: (-scores[i], i))
    return set(order[:cnt])


if __name__ == "__main__":
    X, Y = reg_data(5, 12, 0.3, False)
    a, b = ols(X, Y, 0)
    print("regression: slope %.3f intercept %.3f MSE %.4f R2 %.3f" % (a, b, mse(X, Y, a, b), r2(X, Y, a, b)))
    Xo, Yo = reg_data(5, 12, 0.3, True)
    ao, bo = ols(Xo, Yo, 0)
    print("with one outlier: slope %.3f intercept %.3f R2 %.3f" % (ao, bo, r2(Xo, Yo, ao, bo)))
    print("ridge slopes (penalty 0, 1, 5): " + " ".join("%.3f" % ols(X, Y, lam)[0] for lam in (0, 1, 5)))
    bx, by = cls_data(11, 100)
    pr = fit_logistic(bx, by, 300)
    p = [pr(q) for q in bx]
    for thr in (0.2, 0.5, 0.8):
        tp, fp, fn, tn = confusion(p, by, thr)
        print("classification, threshold %.1f: tp %d fp %d fn %d tn %d precision %.3f recall %.3f" % (thr, tp, fp, fn, tn, tp / max(1, tp + fp), tp / max(1, tp + fn)))
    print("area under the ROC curve: %.3f" % roc_auc(p, by))
    for n_train, noise in ((15, 0.25), (50, 0.25)):
        X, Y = poly_data(3, n_train, noise)
        Xt, Yt = poly_data(4, 200, noise)
        row = []
        for deg in (1, 3, 7, 9):
            w = poly_fit(X, Y, deg)
            row.append("deg %d train %.3f test %.3f" % (deg, poly_mse(w, X, Y), poly_mse(w, Xt, Yt)))
        print("polynomials, %d points, noise %.2f: %s" % (n_train, noise, "; ".join(row)))
    cx, cy = make_data("blobs", 40, 21)
    for kk in (1, 3):
        print("cross-validation, 5 folds, k-nearest k=%d: %s" % (kk, " ".join("%.2f" % v for v in cv_scores(cx, cy, 5, 7, kk))))
    B = blobs3(60, 5)
    print("k-means on three blobs, k=3, seeds 1-6: inertia " + " ".join("%.3f" % kmeans(B, 3, s)[0] for s in range(1, 7)))
    print("elbow, seed 1, k=1..8: " + " ".join("%.2f" % kmeans(B, k, 1)[0] for k in range(1, 9)))
    mx, _ = make_data("moons", 200, 3)
    lab = dbscan(mx, 0.2, 4)
    print("DBSCAN on moons, eps 0.2, min points 4: clusters %d, noise %d" % (max([l for l in lab if l is not None], default=-1) + 1, sum(1 for l in lab if l is None)))
    print("k-means on moons, k=2: inertia %.3f" % kmeans(mx, 2, 1)[0])
    P = pca_data(8, 40)
    s = pca_stats(P)
    best = (0.5 * math.degrees(math.atan2(2 * s[2], s[0] - s[1]))) % 180
    tot = s[0] + s[1]
    print("PCA: best axis %.1f degrees; variance kept at 0 %.3f, 90 %.3f, best %.3f" % (best, var_along(s, 0) / tot, var_along(s, 90) / tot, var_along(s, best) / tot))
    A = anomaly_data(6, 80)
    sc = knn_scores(A, 5)
    for c in (0.02, 0.05, 0.1):
        fl = flag(sc, c)
        caught = sum(1 for i in fl if i >= 80)
        print("anomalies, flag %d%%: flagged %d, real anomalies caught %d of 4, false alarms %d" % (round(c * 100), len(fl), caught, len(fl) - caught))
