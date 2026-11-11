"""Demonstrations for the 14 lessons that complete the curriculum.

Runtime prerequisites: Python 3.10+, NumPy, pandas, scikit-learn. Matplotlib is
optional (used only by the `viz` demo to save a chart). All data is synthetic and
seeds are fixed, so output is repeatable on the same library versions.
Run:  python gap_topics.py [topic|all]
Topics: sql pyclass viz regression svm roc tune wordvec timeseries recsys vision
        speech gnn pg interp
"""
import itertools
import math
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent


# ---------------------------------------------------------------- 1. SQL
def sql():
    con = sqlite3.connect(":memory:")
    con.executescript("""
        CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, country TEXT);
        CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id),
                             amount REAL, ordered_on TEXT);
        INSERT INTO customers VALUES (1,'Ana','PT'),(2,'Ben','UK'),(3,'Chen','SG'),(4,'Dana','UK');
        INSERT INTO orders VALUES (1,1,40,'2026-09-01'),(2,1,60,'2026-10-02'),(3,2,15,'2026-10-03'),
                                  (4,3,120,'2026-10-05'),(5,3,80,'2026-10-20'),(6,2,25,'2026-10-21');
    """)
    q1 = """SELECT c.country, COUNT(o.id) AS orders, ROUND(SUM(o.amount),2) AS revenue
            FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
            GROUP BY c.country ORDER BY revenue DESC"""
    print(pd.read_sql(q1, con).to_string(index=False))
    # Feature table for ML: one row per customer, computed in the database.
    q2 = """SELECT c.id, COUNT(o.id) AS n_orders, COALESCE(AVG(o.amount),0) AS avg_amount,
                   MAX(o.ordered_on) AS last_order
            FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id"""
    print(pd.read_sql(q2, con).to_string(index=False))
    # Parameterised query: never build SQL by string concatenation with user input.
    name = "Ben' OR '1'='1"
    rows = con.execute("SELECT id FROM customers WHERE name = ?", (name,)).fetchall()
    print(f"parameterised lookup for {name!r} returns {rows} (injection attempt treated as plain text)")


# ---------------------------------------------------------------- 2. Python classes and errors
class InvalidReadingError(ValueError):
    """Raised when a sensor reading is outside its physical range."""


@dataclass(frozen=True)
class Reading:
    sensor: str
    celsius: float

    def __post_init__(self):
        if not -50 <= self.celsius <= 150:
            raise InvalidReadingError(f"{self.sensor}: {self.celsius} °C is outside -50..150")


class ReadingBuffer:
    """Keeps the latest N valid readings and reports their mean."""

    def __init__(self, size: int):
        self.size, self._items = size, []

    def add(self, r: Reading) -> None:
        self._items = (self._items + [r])[-self.size:]

    def mean(self) -> float:
        if not self._items:
            raise ValueError("no readings yet")
        return sum(r.celsius for r in self._items) / len(self._items)

    def __len__(self) -> int:
        return len(self._items)


def pyclass():
    buf, rejected = ReadingBuffer(size=3), 0
    for sensor, value in [("t1", 21.0), ("t1", 22.5), ("t1", 900.0), ("t1", 23.0), ("t1", 24.5)]:
        try:
            buf.add(Reading(sensor, value))
        except InvalidReadingError as err:
            rejected += 1
            print(f"rejected: {err}")
    print(f"kept {len(buf)} readings, mean {buf.mean():.2f} °C, rejected {rejected}")
    try:
        ReadingBuffer(3).mean()
    except ValueError as err:
        print(f"empty buffer -> ValueError: {err}")


# ---------------------------------------------------------------- 3. Data collection, labelling, visualisation
def viz():
    from sklearn.metrics import cohen_kappa_score
    rng = np.random.default_rng(0)
    truth = rng.choice(["bug", "billing", "other"], size=200, p=[0.5, 0.3, 0.2])
    def labeller(err):  # each annotator mislabels a share of tickets at random
        out = truth.copy()
        flip = rng.random(200) < err
        out[flip] = rng.choice(["bug", "billing", "other"], size=flip.sum())
        return out
    a, b = labeller(0.10), labeller(0.25)
    print(f"raw agreement {np.mean(a == b):.3f}, Cohen's kappa {cohen_kappa_score(a, b):.3f}")
    df = pd.DataFrame({"minutes": rng.gamma(2, 15, 500).round(1), "channel": rng.choice(["chat", "email"], 500)})
    print(df.groupby("channel")["minutes"].describe()[["count", "mean", "50%", "max"]].round(1).to_string())
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(6, 3.5))
        for ch, grp in df.groupby("channel"):
            ax.hist(grp["minutes"], bins=30, alpha=0.6, label=ch)
        ax.set_xlabel("Minutes to first reply"); ax.set_ylabel("Tickets"); ax.legend(); ax.set_title("Reply time by channel")
        out = HERE / "reply_times.png"
        fig.tight_layout(); fig.savefig(out, dpi=100); plt.close(fig)
        print(f"chart saved: {out.name}")
    except ImportError:
        print("matplotlib not installed; skipping chart")


# ---------------------------------------------------------------- 4. Regression and bias-variance
def regression():
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import PolynomialFeatures, StandardScaler
    rng = np.random.default_rng(1)
    x = np.sort(rng.uniform(0, 10, 40)).reshape(-1, 1)          # house size (tens of m²)
    y = 50 + 12 * x.ravel() + 8 * np.sin(x.ravel()) + rng.normal(0, 6, 40)   # price (thousands)
    idx = rng.permutation(40); tr, te = idx[:28], idx[28:]
    for deg in (1, 3, 9, 15):
        # Scale x first: raw x**15 reaches 1e15 and makes the fit numerically unstable.
        m = make_pipeline(StandardScaler(), PolynomialFeatures(deg), LinearRegression()).fit(x[tr], y[tr])
        p_tr, p_te = m.predict(x[tr]), m.predict(x[te])
        print(f"degree {deg:>2}: train RMSE {math.sqrt(mean_squared_error(y[tr], p_tr)):6.2f} | "
              f"test MAE {mean_absolute_error(y[te], p_te):7.2f} RMSE {math.sqrt(mean_squared_error(y[te], p_te)):7.2f} "
              f"R² {r2_score(y[te], p_te):6.3f}")


# ---------------------------------------------------------------- 5. SVM
def svm():
    from sklearn.datasets import make_circles
    from sklearn.model_selection import cross_val_score
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
    X, y = make_circles(n_samples=400, noise=0.1, factor=0.4, random_state=0)
    for name, model in [("linear kernel", SVC(kernel="linear")), ("RBF kernel", SVC(kernel="rbf", C=1.0))]:
        acc = cross_val_score(make_pipeline(StandardScaler(), model), X, y, cv=5).mean()
        print(f"{name:<14} accuracy {acc:.3f}")
    Xs = X.copy(); Xs[:, 0] *= 1000                                # one feature in very different units
    raw = cross_val_score(SVC(kernel="rbf"), Xs, y, cv=5).mean()
    scaled = cross_val_score(make_pipeline(StandardScaler(), SVC(kernel="rbf")), Xs, y, cv=5).mean()
    print(f"badly scaled feature: without scaling {raw:.3f}, with StandardScaler {scaled:.3f}")
    fitted = make_pipeline(StandardScaler(), SVC(kernel="rbf")).fit(X, y)
    print(f"support vectors used: {fitted[-1].n_support_.sum()} of {len(X)} points")


# ---------------------------------------------------------------- 6. ROC-AUC, PR curves, imbalance
def roc():
    from sklearn.datasets import make_classification
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import average_precision_score, precision_score, recall_score, roc_auc_score
    from sklearn.model_selection import train_test_split
    X, y = make_classification(n_samples=6000, n_features=10, n_informative=4, weights=[0.97], flip_y=0.01, random_state=2)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.4, stratify=y, random_state=2)
    print(f"positives in test set: {yte.sum()} of {len(yte)} ({yte.mean():.1%})")
    for cw in (None, "balanced"):
        m = LogisticRegression(max_iter=1000, class_weight=cw).fit(Xtr, ytr)
        s = m.predict_proba(Xte)[:, 1]; p = (s >= 0.5).astype(int)
        print(f"class_weight={str(cw):<8}: ROC-AUC {roc_auc_score(yte, s):.3f}  PR-AUC {average_precision_score(yte, s):.3f}  "
              f"recall@0.5 {recall_score(yte, p):.3f}  precision@0.5 {precision_score(yte, p, zero_division=0):.3f}")
    m = LogisticRegression(max_iter=1000).fit(Xtr, ytr); s = m.predict_proba(Xte)[:, 1]
    for t in (0.5, 0.2, 0.1, 0.05):
        p = (s >= t).astype(int)
        print(f"threshold {t:<4}: flagged {p.sum():>4}  recall {recall_score(yte, p):.3f}  precision {precision_score(yte, p, zero_division=0):.3f}")
    print(f"PR-AUC of a random guess = positive rate = {yte.mean():.3f}; ROC-AUC of a random guess = 0.500")


# ---------------------------------------------------------------- 7. Tuning and Shapley explanations
def tune():
    from sklearn.datasets import make_classification
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, train_test_split
    from scipy.stats import loguniform, randint
    X, y = make_classification(n_samples=800, n_features=12, n_informative=5, random_state=3)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=3)
    grid = GridSearchCV(GradientBoostingClassifier(random_state=0),
                        {"max_depth": [2, 3, 4], "learning_rate": [0.03, 0.1, 0.3], "n_estimators": [100, 200]}, cv=4).fit(Xtr, ytr)
    rand = RandomizedSearchCV(GradientBoostingClassifier(random_state=0),
                              {"max_depth": randint(2, 6), "learning_rate": loguniform(0.01, 0.5), "n_estimators": randint(50, 300)},
                              n_iter=18, cv=4, random_state=0).fit(Xtr, ytr)
    for name, s in [("grid (18 combos)", grid), ("random (18 draws)", rand)]:
        bp = {k: (round(float(v), 3) if isinstance(v, float) else int(v)) for k, v in s.best_params_.items()}
        print(f"{name:<18} best CV {s.best_score_:.3f}  test {s.score(Xte, yte):.3f}  {bp}")
    # Exact Shapley values for one prediction of a small 3-feature model (what SHAP approximates).
    # Churn data with three named features (synthetic): support tickets last month, tenure in months, discount (%).
    rng = np.random.default_rng(8)
    tickets, tenure, discount = rng.poisson(2, 1000), rng.uniform(1, 60, 1000), rng.choice([0, 10, 20], 1000)
    logit = -1.0 + 0.6 * tickets - 0.05 * tenure - 0.04 * discount
    ys = (rng.random(1000) < 1 / (1 + np.exp(-logit))).astype(int)
    Xs = np.column_stack([tickets, tenure, discount]).astype(float)
    model = LogisticRegression(max_iter=1000).fit(Xs, ys)
    probs = model.predict_proba(Xs)[:, 1]
    background = Xs.mean(axis=0); x0 = Xs[int(np.argmin(np.abs(probs - 0.85)))]   # a customer scored about 0.85
    print(f"customer: tickets={x0[0]:.0f}, tenure={x0[1]:.1f} months, discount={x0[2]:.0f}% | average customer: "
          f"tickets={background[0]:.2f}, tenure={background[1]:.1f}, discount={background[2]:.1f}%")
    f = lambda present: model.predict_proba([np.where(present, x0, background)])[0, 1]
    phi = []
    for i in range(3):
        others = [j for j in range(3) if j != i]; total = 0.0
        for k in range(3):
            for S in itertools.combinations(others, k):
                w = math.factorial(k) * math.factorial(3 - k - 1) / math.factorial(3)
                with_i = np.isin(range(3), S + (i,)); without = np.isin(range(3), S)
                total += w * (f(with_i) - f(without))
        phi.append(total)
    base, pred = f(np.zeros(3, bool)), f(np.ones(3, bool))
    print(f"Shapley: average-customer score {base:.3f} + contributions (tickets, tenure, discount) "
          f"{np.round(phi, 3).tolist()} = {base + sum(phi):.3f} (model output {pred:.3f})")


# ---------------------------------------------------------------- 8. Word vectors
def wordvec():
    stop = set("the a is of . and in".split())          # function words carry little meaning here
    corpus = ("the cat chased the mouse . the dog chased the cat . the cat drank milk . the dog drank water . "
              "the cat ate fish . the dog ate meat . a kitten is a young cat . a puppy is a young dog . "
              "the cat sleeps on the sofa . the dog sleeps on the sofa . the king rules the country . "
              "the queen rules the country . the king wears a crown . the queen wears a crown . "
              "the king and the queen live in the palace . the cat and the dog live in the house . "
              "paris is the capital of france . rome is the capital of italy . berlin is the capital of germany . "
              "paris is a big city . rome is a big city . berlin is a big city .").split()
    corpus = [w for w in corpus if w not in stop]
    vocab = sorted(set(corpus)); ix = {w: i for i, w in enumerate(vocab)}
    C = np.zeros((len(vocab), len(vocab)))
    for i, w in enumerate(corpus):                                   # count neighbours within 2 words
        for j in range(max(0, i - 2), min(len(corpus), i + 3)):
            if i != j:
                C[ix[w], ix[corpus[j]]] += 1
    total = C.sum(); row = C.sum(1, keepdims=True); col = C.sum(0, keepdims=True)
    ppmi = np.maximum(np.log((C * total) / (row @ col) + 1e-12), 0)  # positive pointwise mutual information
    U, S, _ = np.linalg.svd(ppmi)
    V = U[:, :10] * S[:10]                                           # 10-dimensional word vectors
    V /= np.linalg.norm(V, axis=1, keepdims=True)
    def nearest(w, k=3):
        sims = V @ V[ix[w]]
        return [(vocab[j], round(float(sims[j]), 2)) for j in np.argsort(-sims) if vocab[j] != w][:k]
    for w in ("cat", "king", "paris"):
        print(f"nearest to {w!r}: {nearest(w)}")


# ---------------------------------------------------------------- 9. Time series
def timeseries():
    from sklearn.linear_model import LinearRegression
    rng = np.random.default_rng(4)
    days = pd.date_range("2025-01-01", periods=364, freq="D")
    weekly = np.tile([0.8, 0.9, 1.0, 1.0, 1.1, 1.4, 1.3], 52)
    sales = (100 + 0.15 * np.arange(364)) * weekly + rng.normal(0, 6, 364)
    s = pd.Series(sales, index=days)
    test = s.index >= "2025-11-01"                                   # train on the past, test on the future
    actual = s[test]
    naive = s.shift(1)[test]                                         # yesterday's value
    seasonal = s.shift(7)[test]                                      # same weekday last week
    feats = pd.DataFrame({"lag7": s.shift(7), "lag14": s.shift(14), "t": np.arange(364)}, index=days)
    feats = pd.concat([feats, pd.get_dummies(days.dayofweek, prefix="dow").set_index(days).astype(float)], axis=1).dropna()
    tr = feats.index < "2025-11-01"
    reg = LinearRegression().fit(feats[tr], s[feats.index][tr])
    model = pd.Series(reg.predict(feats[~tr]), index=feats.index[~tr])
    for name, pred in [("naive (yesterday)", naive), ("seasonal naive (last week)", seasonal), ("linear model with lags + weekday", model)]:
        print(f"{name:<34} MAE {np.mean(np.abs(actual - pred)):6.2f}")
    print(f"test period: {actual.index.min().date()} to {actual.index.max().date()} ({len(actual)} days)")


# ---------------------------------------------------------------- 10. Recommender systems
def recsys():
    rng = np.random.default_rng(5)
    n_users, n_items, k = 60, 40, 3
    P, Q = rng.normal(0, 1, (n_users, k)), rng.normal(0, 1, (n_items, k))
    full = np.clip(3 + P @ Q.T + rng.normal(0, 0.3, (n_users, n_items)), 1, 5)
    mask = rng.random((n_users, n_items)) < 0.3                       # each user rated about 30% of items
    obs = np.argwhere(mask); rng.shuffle(obs)
    test, train = obs[:150], obs[150:]
    mu = full[tuple(train.T)].mean()
    item_mean = np.full(n_items, mu)
    for i in range(n_items):
        r = [full[u, j] for u, j in train if j == i]
        if r: item_mean[i] = np.mean(r)
    U, V = rng.normal(0, 0.1, (n_users, k)), rng.normal(0, 0.1, (n_items, k))
    bu, bi = np.zeros(n_users), np.zeros(n_items)
    for epoch in range(60):                                         # matrix factorisation by SGD
        for u, i in train:
            err = full[u, i] - (mu + bu[u] + bi[i] + U[u] @ V[i])
            bu[u] += 0.02 * (err - 0.02 * bu[u]); bi[i] += 0.02 * (err - 0.02 * bi[i])
            U[u], V[i] = U[u] + 0.02 * (err * V[i] - 0.05 * U[u]), V[i] + 0.02 * (err * U[u] - 0.05 * V[i])
    rmse = lambda pred: math.sqrt(np.mean([(full[u, i] - pred(u, i)) ** 2 for u, i in test]))
    print(f"held-out RMSE: global mean {rmse(lambda u, i: mu):.3f} | item mean {rmse(lambda u, i: item_mean[i]):.3f} | "
          f"matrix factorisation {rmse(lambda u, i: mu + bu[u] + bi[i] + U[u] @ V[i]):.3f}")
    u = 0; unseen = np.where(~mask[u])[0]
    scores = mu + bu[u] + bi[unseen] + V[unseen] @ U[u]
    top = unseen[np.argsort(-scores)[:3]]
    print(f"top-3 unseen items for user 0: {top.tolist()} predicted {np.round(np.sort(scores)[::-1][:3], 2).tolist()} "
          f"true {np.round(full[u, top], 2).tolist()}")


# ---------------------------------------------------------------- 11. Detection and segmentation maths
def iou(a, b):
    x1, y1 = max(a[0], b[0]), max(a[1], b[1]); x2, y2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    return inter / (area(a) + area(b) - inter)


def vision():
    truth, pred = (10, 10, 60, 60), (20, 15, 70, 65)                # boxes as (x1, y1, x2, y2)
    print(f"IoU of predicted vs true box = {iou(truth, pred):.3f} (counts as a hit at IoU >= 0.5)")
    boxes = [((10, 10, 60, 60), 0.92), ((12, 12, 62, 61), 0.85), ((100, 40, 150, 90), 0.80), ((14, 9, 58, 63), 0.40)]
    keep = []
    for box, score in sorted(boxes, key=lambda b: -b[1]):             # non-maximum suppression
        if all(iou(box, k[0]) < 0.5 for k in keep):
            keep.append((box, score))
    print(f"non-maximum suppression keeps {len(keep)} of {len(boxes)} boxes: {[s for _, s in keep]}")
    true_mask = np.zeros((10, 10), bool); true_mask[2:8, 2:8] = True
    pred_mask = np.zeros((10, 10), bool); pred_mask[3:9, 2:7] = True
    inter = (true_mask & pred_mask).sum(); union = (true_mask | pred_mask).sum()
    print(f"segmentation: mask IoU {inter / union:.3f}, Dice {2 * inter / (true_mask.sum() + pred_mask.sum()):.3f}")
    print(f"vision transformer: a 224×224 image in 16×16 patches = {(224 // 16) ** 2} tokens")


# ---------------------------------------------------------------- 12. Speech
def wer(ref: str, hyp: str) -> float:
    r, h = ref.split(), hyp.split()
    d = np.zeros((len(r) + 1, len(h) + 1), int); d[:, 0] = range(len(r) + 1); d[0, :] = range(len(h) + 1)
    for i, j in itertools.product(range(1, len(r) + 1), range(1, len(h) + 1)):
        d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (r[i - 1] != h[j - 1]))
    return d[-1, -1] / len(r)


def speech():
    sr = 16_000
    t = np.arange(sr) / sr                                            # one second of audio
    audio = 0.6 * np.sin(2 * np.pi * 440 * t) + 0.3 * np.sin(2 * np.pi * 880 * t)
    spectrum = np.abs(np.fft.rfft(audio)); freqs = np.fft.rfftfreq(len(audio), 1 / sr)
    peaks = freqs[np.argsort(-spectrum)[:2]]
    print(f"strongest frequencies: {sorted(peaks.astype(int).tolist())} Hz")
    win, hop = int(0.025 * sr), int(0.010 * sr)
    n_frames = 1 + (len(audio) - win) // hop
    print(f"25 ms windows every 10 ms: {n_frames} frames of {win} samples for 1 s of audio")
    ref = "please refund order five five eight one two"
    hyp = "please refund the order five five eight one"
    print(f"word error rate = {wer(ref, hyp):.3f} (1 insertion + 1 deletion over 8 reference words)")


# ---------------------------------------------------------------- 13. Graph neural networks
def gnn():
    from sklearn.linear_model import LogisticRegression
    edges = [(0, 1), (0, 2), (1, 2), (1, 3), (2, 3), (3, 4), (4, 5), (5, 6), (5, 7), (6, 7), (4, 6)]
    n = 8
    A = np.eye(n)                                                     # adjacency with self-loops
    for a, b in edges:
        A[a, b] = A[b, a] = 1
    d = A.sum(1); A_hat = A / np.sqrt(np.outer(d, d))                 # symmetric normalisation (as in GCN)
    X = np.eye(n)                                                     # no node features: one-hot identity
    H = A_hat @ A_hat @ X                                             # two rounds of message passing
    labelled = {0: 0, 7: 1}                                           # only two nodes have labels
    clf = LogisticRegression(C=10).fit(H[list(labelled)], list(labelled.values()))
    print("predicted community per node:", clf.predict(H).tolist())
    print("node 3 neighbours:", sorted({b for a, b in edges if a == 3} | {a for a, b in edges if b == 3}),
          "| node 4 neighbours:", sorted({b for a, b in edges if a == 4} | {a for a, b in edges if b == 4}))


# ---------------------------------------------------------------- 14. Policy gradients (REINFORCE)
def pg():
    rng = np.random.default_rng(6)
    true_means = np.array([0.2, 0.5, 0.8])                            # three ad layouts, click probabilities
    theta = np.zeros(3); baseline = 0.0
    for step in range(1, 3001):
        probs = np.exp(theta - theta.max()); probs /= probs.sum()
        a = rng.choice(3, p=probs)
        r = float(rng.random() < true_means[a])
        baseline += 0.01 * (r - baseline)                             # running average reward
        grad = -probs; grad[a] += 1                                   # ∇ log π(a)
        theta += 0.1 * (r - baseline) * grad                          # REINFORCE update
        if step in (1, 500, 3000):
            print(f"step {step:4d}: policy {np.round(probs, 3).tolist()}  average reward {baseline:.3f}")


# ---------------------------------------------------------------- 15. Interpretability and ablation
def interp():
    from sklearn.datasets import make_classification
    from sklearn.inspection import permutation_importance
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_score, train_test_split
    from sklearn.neural_network import MLPClassifier
    X, y = make_classification(n_samples=1500, n_features=6, n_informative=3, n_redundant=0, shuffle=False, random_state=7)
    names = ["f0", "f1", "f2", "noise3", "noise4", "noise5"]
    base = cross_val_score(LogisticRegression(max_iter=1000), X, y, cv=5).mean()
    print(f"ablation study (drop one feature, retrain, 5-fold accuracy); all features {base:.3f}")
    for i, nm in enumerate(names):
        acc = cross_val_score(LogisticRegression(max_iter=1000), np.delete(X, i, axis=1), y, cv=5).mean()
        print(f"  without {nm:<7} {acc:.3f} ({acc - base:+.3f})")
    Xtr, Xte, ytr, yte = train_test_split(X, y, random_state=7)
    mlp = MLPClassifier(hidden_layer_sizes=(16,), max_iter=2000, random_state=7).fit(Xtr, ytr)
    pi = permutation_importance(mlp, Xte, yte, n_repeats=10, random_state=7)
    order = np.argsort(-pi.importances_mean)
    print("permutation importance (MLP):", [(names[i], round(float(pi.importances_mean[i]), 3)) for i in order])
    hidden = np.maximum(0, Xte @ mlp.coefs_[0] + mlp.intercepts_[0])  # the network's hidden activations (ReLU)
    prop = (Xte[:, 1] > 0).astype(int)                                # property: is feature f1 positive?
    probe = cross_val_score(LogisticRegression(max_iter=1000), hidden, prop, cv=5).mean()
    print(f"linear probe: hidden layer predicts 'f1 > 0' with accuracy {probe:.3f} (chance about 0.5)")


TOPICS = dict(sql=sql, pyclass=pyclass, viz=viz, regression=regression, svm=svm, roc=roc, tune=tune, wordvec=wordvec,
              timeseries=timeseries, recsys=recsys, vision=vision, speech=speech, gnn=gnn, pg=pg, interp=interp)

if __name__ == "__main__":
    choice = sys.argv[1] if len(sys.argv) > 1 else "all"
    for name, fn in TOPICS.items():
        if choice in (name, "all"):
            print(f"--- {name} ---")
            fn()
