"""Mathematics and probability for AI: small, checkable demonstrations.

Runtime prerequisites: Python 3.10+, NumPy. Standard library otherwise.
Run:  python math_for_ai.py [topic|all]
Topics: notation functions matrices eigen chain multivar optimize numerics
        prob bayes rv dist clt abtest mle info
All numbers are synthetic or textbook examples. Fixed seeds make output repeatable.
"""
import math
import sys

import numpy as np


def notation():
    x = [2, 4, 6]
    print("x =", x, "| sum Σx_i =", sum(x), "| mean (1/n)Σx_i =", sum(x) / len(x), "| product Πx_i =", math.prod(x))
    scores = {"cat": 0.2, "dog": 0.7, "bird": 0.1}
    print("argmax over scores:", max(scores, key=scores.get), "| max value:", max(scores.values()))


def functions():
    print(f"exp(0)={math.exp(0):.3f} exp(1)={math.exp(1):.3f} ln(e)={math.log(math.e):.3f} ln(1)={math.log(1):.3f}")
    print(f"log rule: ln(2*8)={math.log(16):.4f} equals ln2+ln8={math.log(2) + math.log(8):.4f}")
    sig = lambda z: 1 / (1 + math.exp(-z))
    print(f"sigmoid(-2)={sig(-2):.3f} sigmoid(0)={sig(0):.3f} sigmoid(2)={sig(2):.3f}")
    z = np.array([2.0, 1.0, 0.1])
    p = np.exp(z) / np.exp(z).sum()
    print("softmax([2, 1, 0.1]) =", np.round(p, 3), "sum =", round(float(p.sum()), 3))


def matrices():
    A = np.array([[1, 2, 3], [4, 5, 6]])
    B = np.array([[1, 0], [0, 1], [1, 1]])
    print("A (2x3) @ B (3x2) =", (A @ B).tolist(), "shape", (A @ B).shape)
    print("A transpose shape:", A.T.shape)
    M = np.array([[4.0, 7.0], [2.0, 6.0]])
    print("inverse of [[4,7],[2,6]] =", np.round(np.linalg.inv(M), 2).tolist())
    # Solve: 2 tickets*x + 1 hour*y = 50 ; 1x + 3y = 55  (x, y unknown prices)
    coeffs, rhs = np.array([[2.0, 1.0], [1.0, 3.0]]), np.array([50.0, 55.0])
    print("solve 2x+y=50, x+3y=55 ->", np.round(np.linalg.solve(coeffs, rhs), 2).tolist())
    R = np.array([[0.0, -1.0], [1.0, 0.0]])          # rotate 90 degrees
    print("rotate [1,0] by 90 degrees ->", (R @ np.array([1.0, 0.0])).tolist())


def eigen():
    S = np.array([[2.0, 1.0], [1.0, 2.0]])
    vals, vecs = np.linalg.eigh(S)
    print("eigenvalues of [[2,1],[1,2]]:", np.round(vals, 3).tolist())
    print("eigenvector for 3:", np.round(vecs[:, 1], 3).tolist(), "check S@v =", np.round(S @ vecs[:, 1], 3).tolist())
    rng = np.random.default_rng(0)
    h = rng.normal(170, 10, 500)                     # height cm
    w = 0.9 * (h - 170) + rng.normal(0, 4, 500) + 70 # weight kg, correlated
    X = np.column_stack([h, w]); X = X - X.mean(0)
    U, s, Vt = np.linalg.svd(X, full_matrices=False)
    explained = s**2 / (s**2).sum()
    print("PCA explained variance ratio:", np.round(explained, 3).tolist())
    print("first principal direction:", np.round(Vt[0] * np.sign(Vt[0][0]), 3).tolist())


def chain():
    x, t = 2.0, 1.0            # input and target
    w, b = 0.5, 0.0
    z = w * x + b
    y = 1 / (1 + math.exp(-z))
    L = (y - t) ** 2
    dL_dy = 2 * (y - t); dy_dz = y * (1 - y); dz_dw = x
    grad = dL_dy * dy_dz * dz_dw
    eps = 1e-6
    yp = 1 / (1 + math.exp(-((w + eps) * x + b)))
    num = ((yp - t) ** 2 - L) / eps
    print(f"forward: z={z:.3f} y={y:.4f} loss={L:.4f}")
    print(f"chain rule dL/dw = {dL_dy:.4f} * {dy_dz:.4f} * {dz_dw:.1f} = {grad:.5f}")
    print(f"numerical check  = {num:.5f}")


def multivar():
    f = lambda x, y: x**2 + 3 * x * y
    x, y, h = 1.0, 2.0, 1e-6
    analytic = (2 * x + 3 * y, 3 * x)
    numeric = ((f(x + h, y) - f(x, y)) / h, (f(x, y + h) - f(x, y)) / h)
    print("f(x,y)=x^2+3xy at (1,2): gradient analytic", analytic, "numeric", tuple(round(v, 3) for v in numeric))
    print("Hessian [[d2f/dx2, d2f/dxdy],[d2f/dydx, d2f/dy2]] = [[2, 3], [3, 0]]")


def optimize():
    grad = lambda p: np.array([2 * p[0], 20 * p[1]])      # f = x^2 + 10 y^2
    f = lambda p: p[0] ** 2 + 10 * p[1] ** 2
    def run(name, step):
        p, state = np.array([5.0, 5.0]), {}
        for i in range(1, 1001):
            p = step(p, grad(p), state, i)
            if f(p) < 1e-3:
                return f"{name:<9} reached f<0.001 in {i} steps"
        return f"{name:<9} not converged, f={f(p):.4f}"
    def gd(p, g, s, i): return p - 0.05 * g
    def momentum(p, g, s, i):
        s["v"] = 0.9 * s.get("v", 0) + g; return p - 0.01 * s["v"]
    def adam(p, g, s, i, lr=0.5, b1=0.9, b2=0.999):
        s["m"] = b1 * s.get("m", 0) + (1 - b1) * g; s["v"] = b2 * s.get("v", 0) + (1 - b2) * g * g
        mh, vh = s["m"] / (1 - b1**i), s["v"] / (1 - b2**i); return p - lr * mh / (np.sqrt(vh) + 1e-8)
    for name, step in [("SGD", gd), ("momentum", momentum), ("Adam", adam)]:
        print(run(name, step))


def numerics():
    print("0.1 + 0.2 =", repr(0.1 + 0.2), "| equal to 0.3?", 0.1 + 0.2 == 0.3, "| isclose?", math.isclose(0.1 + 0.2, 0.3))
    with np.errstate(over="ignore"):
        big = np.float16(70000.0)
    print("float16 max:", float(np.finfo(np.float16).max), "| float16(70000) =", big)
    z = np.array([1000.0, 1001.0])
    with np.errstate(over="ignore", invalid="ignore"):
        naive = np.exp(z) / np.exp(z).sum()
    stable = np.exp(z - z.max()) / np.exp(z - z.max()).sum()
    print("naive softmax([1000,1001]) =", naive.tolist(), "| stable =", np.round(stable, 3).tolist())
    lse = z.max() + np.log(np.exp(z - z.max()).sum())
    print(f"log-sum-exp = {lse:.4f}")


def prob():
    outcomes = [(a, b) for a in range(1, 7) for b in range(1, 7)]
    p7 = sum(a + b == 7 for a, b in outcomes) / 36
    rng = np.random.default_rng(42)
    sims = rng.integers(1, 7, (100_000, 2)).sum(1)
    print(f"P(sum=7) exact={p7:.4f} simulated={np.mean(sims == 7):.4f}")
    # Conditional: given the first die is 6, probability the sum is at least 10
    given = [(a, b) for a, b in outcomes if a == 6]
    print(f"P(sum>=10 | first=6) = {sum(a + b >= 10 for a, b in given)}/{len(given)} = {sum(a + b >= 10 for a, b in given) / len(given):.3f}")


def bayes():
    prior, sens, fpr = 0.01, 0.90, 0.05
    evidence = sens * prior + fpr * (1 - prior)
    print(f"P(disease | positive) = {sens}*{prior} / {evidence:.4f} = {sens * prior / evidence:.3f}")
    p_spam, p_free_spam, p_free_ham = 0.20, 0.40, 0.02
    post = p_free_spam * p_spam / (p_free_spam * p_spam + p_free_ham * (1 - p_spam))
    print(f"P(spam | contains 'free') = {post:.3f}")


def rv():
    faces = np.arange(1, 7)
    e = faces.mean(); var = ((faces - e) ** 2).mean()
    print(f"die: E[X]={e:.3f} Var[X]={var:.3f} SD={math.sqrt(var):.3f}")
    payoff = {"lose 10": (-10, 0.7), "win 50": (50, 0.3)}
    print("expected value of the bet:", sum(v * p for v, p in payoff.values()))


def dist():
    n, p, k = 10, 0.1, 2
    print(f"Binomial P(X=2 | n=10, p=0.1) = {math.comb(n, k) * p**k * (1 - p)**(n - k):.4f}")
    lam = 3
    print(f"Poisson P(X=0 | λ=3) = {math.exp(-lam):.4f}; P(X=5) = {math.exp(-lam) * lam**5 / math.factorial(5):.4f}")
    rng = np.random.default_rng(1)
    x = rng.normal(100, 15, 200_000)
    for kk in (1, 2, 3):
        print(f"Normal: share within {kk} SD = {np.mean(np.abs(x - 100) < kk * 15):.3f}")
    probs = np.array([0.7, 0.2, 0.1])
    draws = rng.choice(["the", "a", "an"], size=10_000, p=probs)
    print("categorical sample frequencies:", {w: round(float(np.mean(draws == w)), 3) for w in ["the", "a", "an"]})


def clt():
    rng = np.random.default_rng(3)
    for n in (1, 5, 30):
        means = rng.uniform(0, 1, (20_000, n)).mean(1)
        print(f"n={n:>2}: mean of sample means={means.mean():.3f} SD={means.std():.3f} (theory {math.sqrt(1 / 12 / n):.3f})")
    conv, visits = 120, 1000
    p = conv / visits; se = math.sqrt(p * (1 - p) / visits)
    print(f"conversion {p:.3f}, 95% CI ≈ [{p - 1.96 * se:.3f}, {p + 1.96 * se:.3f}]")


def abtest():
    ca, na, cb, nb = 200, 2000, 240, 2000
    pa, pb = ca / na, cb / nb
    pool = (ca + cb) / (na + nb)
    se = math.sqrt(pool * (1 - pool) * (1 / na + 1 / nb))
    z = (pb - pa) / se
    pval = 2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2))))
    print(f"A {pa:.3f} vs B {pb:.3f}: z={z:.2f}, two-sided p={pval:.3f}")


def mle():
    flips = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1]
    grid = np.linspace(0.01, 0.99, 99)
    ll = [sum(math.log(p) if f else math.log(1 - p) for f in flips) for p in grid]
    print(f"7 heads in 10: best p on grid = {grid[int(np.argmax(ll))]:.2f}; closed form = {sum(flips) / len(flips):.2f}")
    y_true, p_model = 1, 0.8
    print(f"negative log-likelihood of label 1 with p=0.8: {-math.log(p_model):.4f} (this is the cross-entropy loss)")


def info():
    H = lambda ps: -sum(p * math.log2(p) for p in ps if p > 0)
    print(f"entropy fair coin = {H([0.5, 0.5]):.3f} bits; 90/10 coin = {H([0.9, 0.1]):.3f} bits; fair die = {H([1/6]*6):.3f} bits")
    p = np.array([0.7, 0.2, 0.1]); q = np.array([0.5, 0.3, 0.2])
    ce = -(p * np.log(q)).sum(); hp = -(p * np.log(p)).sum(); kl = (p * np.log(p / q)).sum()
    print(f"H(p)={hp:.4f} nats, cross-entropy H(p,q)={ce:.4f}, KL(p||q)={kl:.4f} (= H(p,q) - H(p))")
    print(f"perplexity at loss 2.0 nats = {math.exp(2.0):.2f}")


TOPICS = dict(notation=notation, functions=functions, matrices=matrices, eigen=eigen, chain=chain, multivar=multivar,
              optimize=optimize, numerics=numerics, prob=prob, bayes=bayes, rv=rv, dist=dist, clt=clt, abtest=abtest,
              mle=mle, info=info)

if __name__ == "__main__":
    choice = sys.argv[1] if len(sys.argv) > 1 else "all"
    for name, fn in TOPICS.items():
        if choice in (name, "all"):
            print(f"--- {name} ---")
            fn()
