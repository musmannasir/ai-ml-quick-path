"""Deep learning and expert-topic demonstrations with NumPy and scikit-learn.

Runtime prerequisites: Python 3.10+, NumPy, scikit-learn.
Run:  python ai_extras.py [nn|conv|rnn|dropout|qlearn|diffusion|algos|all]
All data is synthetic; seeds are fixed.
"""
import sys

import numpy as np


def nn(seed: int = 1):
    """A 2-4-1 neural network learns XOR with hand-written backpropagation.
    Seed 1 converges. Seed 0 gets stuck in a poor local minimum (try it): initialisation matters."""
    rng = np.random.default_rng(seed)
    X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
    y = np.array([[0], [1], [1], [0]], dtype=float)
    W1, b1 = rng.normal(0, 1, (2, 4)), np.zeros(4)
    W2, b2 = rng.normal(0, 1, (4, 1)), np.zeros(1)
    sig = lambda z: 1 / (1 + np.exp(-z))
    for step in range(1, 5001):
        h = np.tanh(X @ W1 + b1)                 # hidden layer
        p = sig(h @ W2 + b2)                     # output probability
        loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
        dz2 = (p - y) / len(X)                   # gradient of BCE wrt output logit
        dW2, db2 = h.T @ dz2, dz2.sum(0)
        dh = dz2 @ W2.T * (1 - h ** 2)
        dW1, db1 = X.T @ dh, dh.sum(0)
        for P, G in ((W1, dW1), (b1, db1), (W2, dW2), (b2, db2)):
            P -= 1.0 * G
        if step in (1, 500, 5000):
            print(f"step {step:4d} loss {loss:.4f}")
    print("predictions:", np.round(p.ravel(), 3).tolist(), "targets:", y.ravel().astype(int).tolist())


def conv():
    img = np.array([[0, 0, 9, 9, 9]] * 5, dtype=float)      # dark left, bright right
    kernel = np.array([[-1, 0, 1]] * 3, dtype=float)         # vertical-edge detector
    out = np.array([[(img[i:i + 3, j:j + 3] * kernel).sum() for j in range(3)] for i in range(3)])
    print("image rows:", img[0].tolist(), "(all 5 rows identical)")
    print("convolution output (3x3):", out.tolist())


def rnn():
    rng = np.random.default_rng(1)
    Wx, Wh = rng.normal(0, 0.5, (3, 4)), rng.normal(0, 0.5, (4, 4))
    tokens = {"the": [1, 0, 0], "cat": [0, 1, 0], "sat": [0, 0, 1]}
    h = np.zeros(4)
    for word, x in tokens.items():
        h = np.tanh(np.array(x) @ Wx + h @ Wh)        # new memory depends on input AND old memory
        print(f"after '{word}': h = {np.round(h, 3).tolist()}")


def dropout():
    rng = np.random.default_rng(2)
    a = np.ones(10); keep = 0.8
    mask = rng.random(10) < keep
    print("mask:", mask.astype(int).tolist(), "| output:", np.round(a * mask / keep, 2).tolist(), "| mean of many runs ≈",
          round(float(np.mean([(a * (rng.random(10) < keep) / keep).mean() for _ in range(20000)])), 3))


def qlearn():
    """Q-learning in a 1-D corridor of 5 cells. Start at 0, reward +1 at cell 4."""
    rng = np.random.default_rng(3)
    Q = np.zeros((5, 2))                               # actions: 0 = left, 1 = right
    alpha, gamma, eps = 0.5, 0.9, 0.2
    for episode in range(200):
        s = 0
        while s != 4:
            a = int(rng.integers(2)) if rng.random() < eps else int(np.argmax(Q[s]))
            s2 = max(0, s - 1) if a == 0 else s + 1
            r = 1.0 if s2 == 4 else 0.0
            Q[s, a] += alpha * (r + gamma * Q[s2].max() * (s2 != 4) - Q[s, a])
            s = s2
    print("Q-values (left, right) per cell:", np.round(Q[:4], 3).tolist())
    print("learned policy:", ["right" if np.argmax(q) == 1 else "left" for q in Q[:4]])


def diffusion():
    T = 1000
    betas = np.linspace(1e-4, 0.02, T)                 # linear noise schedule (as in the 2020 DDPM paper)
    alpha_bar = np.cumprod(1 - betas)
    for t in (1, 100, 500, 1000):
        ab = alpha_bar[t - 1]
        print(f"step {t:4d}: signal weight sqrt(ab)={np.sqrt(ab):.3f}, noise weight sqrt(1-ab)={np.sqrt(1 - ab):.3f}")


def algos():
    from sklearn.datasets import make_moons
    from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_score
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.tree import DecisionTreeClassifier
    X, y = make_moons(n_samples=600, noise=0.3, random_state=0)
    models = {"logistic regression": LogisticRegression(), "k-nearest neighbours": KNeighborsClassifier(15),
              "decision tree (depth 5)": DecisionTreeClassifier(max_depth=5, random_state=0),
              "random forest": RandomForestClassifier(200, random_state=0),
              "gradient boosting": GradientBoostingClassifier(random_state=0)}
    for name, m in models.items():
        s = cross_val_score(m, X, y, cv=5)
        print(f"{name:<24} accuracy {s.mean():.3f} (+/- {s.std():.3f})")


DEMOS = dict(nn=nn, conv=conv, rnn=rnn, dropout=dropout, qlearn=qlearn, diffusion=diffusion, algos=algos)

if __name__ == "__main__":
    choice = sys.argv[1] if len(sys.argv) > 1 else "all"
    if choice == "nn" and len(sys.argv) > 2:
        nn(int(sys.argv[2])); sys.exit()
    for name, fn in DEMOS.items():
        if choice in (name, "all"):
            print(f"--- {name} ---")
            fn()
