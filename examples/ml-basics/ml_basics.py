"""Small, self-contained ML demonstrations used by several lessons.

Runtime prerequisites: Python 3.10+, NumPy, pandas, scikit-learn (tested 1.8.0).
Run:  python ml_basics.py [gd|metrics|quality|kmeans|features|cv|drift|all]
All data is synthetic and generated with fixed seeds.
"""
import sys

import numpy as np
import pandas as pd


def gradient_descent():
    """Fit y = w*x + b by gradient descent on mean squared error."""
    x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y = np.array([3.1, 4.9, 7.2, 8.8, 11.1])        # roughly y = 2x + 1
    w, b, lr = 0.0, 0.0, 0.02
    for step in range(1, 2001):
        err = (w * x + b) - y
        loss = (err ** 2).mean()
        dw, db = 2 * (err * x).mean(), 2 * err.mean()  # derivatives of the loss
        w, b = w - lr * dw, b - lr * db
        if step in (1, 10, 100, 2000):
            print(f"step {step:4d}: loss={loss:.4f} w={w:.3f} b={b:.3f}")


def metrics():
    """Worked confusion-matrix example: 1,000 transactions, 20 are fraud."""
    tp, fn, fp, tn = 15, 5, 30, 950
    precision = tp / (tp + fp)
    recall = tp / (tp + fn)
    f1 = 2 * precision * recall / (precision + recall)
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    print(f"accuracy={accuracy:.3f} precision={precision:.3f} recall={recall:.3f} f1={f1:.3f}")
    print(f"'always not fraud' accuracy={(fp + tn) / 1000:.3f} with recall=0.000")


def quality():
    df = pd.DataFrame({
        "ticket_id": [1, 2, 2, 3, 4, 5],
        "channel": ["email", "chat", "chat", "Email ", None, "phone"],
        "minutes_to_reply": [12, 5, 5, -3, 40, 2000],
    })
    print("rows:", len(df), "| duplicate ids:", int(df["ticket_id"].duplicated().sum()),
          "| missing channel:", int(df["channel"].isna().sum()))
    df = df.drop_duplicates("ticket_id")
    df["channel"] = df["channel"].str.strip().str.lower().fillna("unknown")
    bad = df[(df["minutes_to_reply"] < 0) | (df["minutes_to_reply"] > 24 * 60)]
    print("out-of-range reply times:", bad["ticket_id"].tolist())
    print("channels after cleaning:", sorted(df["channel"].unique()))


def kmeans():
    from sklearn.cluster import KMeans
    rng = np.random.default_rng(0)
    # Two customer groups: (orders per month, average basket in USD)
    a = rng.normal([2, 30], [0.5, 5], (50, 2))
    b = rng.normal([8, 90], [1.0, 10], (50, 2))
    X = np.vstack([a, b])
    km = KMeans(n_clusters=2, n_init=10, random_state=0).fit(X)
    for c in sorted(km.cluster_centers_.tolist()):
        print(f"cluster centre: orders/month={c[0]:.1f}, basket=${c[1]:.0f}")
    print("cluster sizes:", sorted(np.bincount(km.labels_).tolist()))


def features():
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    df = pd.DataFrame({"plan": ["basic", "pro", "basic", "team"], "seats": [1, 5, 2, 20],
                       "signup": pd.to_datetime(["2026-01-05", "2026-03-10", "2026-06-01", "2026-09-15"])})
    df["tenure_days"] = (pd.Timestamp("2026-10-30") - df["signup"]).dt.days   # derived feature
    ct = ColumnTransformer([("plan", OneHotEncoder(), ["plan"]),
                            ("num", StandardScaler(), ["seats", "tenure_days"])])
    X = ct.fit_transform(df)
    print("feature names:", list(ct.get_feature_names_out()))
    print("shape:", X.shape)


def cross_validation():
    from sklearn.datasets import make_classification
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_score
    from sklearn.tree import DecisionTreeClassifier
    X, y = make_classification(n_samples=300, n_features=20, n_informative=5, random_state=0)
    for name, model in [("logistic regression", LogisticRegression(max_iter=1000)),
                        ("deep decision tree", DecisionTreeClassifier(random_state=0))]:
        model.fit(X, y)
        train_acc = model.score(X, y)
        cv = cross_val_score(model, X, y, cv=5)
        print(f"{name:<20} train={train_acc:.2f} cv mean={cv.mean():.2f} (+/- {cv.std():.2f})")


def drift():
    """Population Stability Index between a training sample and live data."""
    rng = np.random.default_rng(1)
    train = rng.normal(50, 10, 5000)       # e.g. basket size at training time
    same = rng.normal(50, 10, 5000)
    shifted = rng.normal(58, 12, 5000)     # live data after a pricing change
    edges = np.quantile(train, np.linspace(0, 1, 11))
    edges[0], edges[-1] = -np.inf, np.inf

    def psi(expected, actual):
        e = np.histogram(expected, edges)[0] / len(expected)
        a = np.histogram(actual, edges)[0] / len(actual)
        e, a = np.clip(e, 1e-6, None), np.clip(a, 1e-6, None)
        return float(((a - e) * np.log(a / e)).sum())

    print(f"PSI same distribution: {psi(train, same):.3f}")
    print(f"PSI shifted distribution: {psi(train, shifted):.3f}")


DEMOS = {"gd": gradient_descent, "metrics": metrics, "quality": quality, "kmeans": kmeans,
         "features": features, "cv": cross_validation, "drift": drift}

if __name__ == "__main__":
    choice = sys.argv[1] if len(sys.argv) > 1 else "all"
    for name, fn in DEMOS.items():
        if choice in (name, "all"):
            print(f"--- {name} ---")
            fn()
