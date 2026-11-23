"""Train the tiny attention model used by the "Attention" simulation. NumPy only, no deep-learning framework.

The model is deliberately small: 21 words, 8 numbers per word, one Transformer block (attention with 2 heads of 4
numbers, add, normalise, a small feed-forward network of 16 hidden units, add, normalise) and an output layer. It learns one thing: the verb must agree in number with the subject, even
when another noun sits in between ("the cats near the box sleep ."). Training uses 108 made-up sentences, all of the form
"the NOUN near the NOUN VERB .", from a tiny grammar.

Run:   python train_tiny.py            (trains, checks the result, writes public/assets/sims/attn-model.js)
       python train_tiny.py --check    (only checks the hand-written gradients against numerical ones)
The weights are rounded to 4 decimals in the file. The page and attention_forward.py both read that file, so they
calculate with exactly the same numbers.
"""
import json, math, os, sys
import numpy as np

SING = ["cat", "dog", "bird"]
PLUR = ["cats", "dogs", "birds"]
OBJ_S = ["box", "rug", "mat"]
OBJ_P = ["boxes", "rugs", "mats"]
VERBS_S = ["sleeps", "runs", "sits"]
VERBS_P = ["sleep", "run", "sit"]
VOCAB = ["the", "near", "."] + SING + PLUR + OBJ_S + OBJ_P + VERBS_S + VERBS_P
IDX = {w: i for i, w in enumerate(VOCAB)}
D, H, DH, MAXLEN, F = 8, 2, 4, 8, 16
EPS = 1e-5


def sentences():
    out = []
    for subj, verbs in ((SING, VERBS_S), (PLUR, VERBS_P)):
        for n in subj:
            for v in verbs:
                for o in OBJ_S + OBJ_P:
                    out.append(["the", n, "near", "the", o, v, "."])
    return out


def softmax(a):
    a = a - a.max(axis=-1, keepdims=True)
    e = np.exp(a)
    return e / e.sum(axis=-1, keepdims=True)


def lnorm(x):
    mu = x.mean(axis=1, keepdims=True)
    sd = np.sqrt(((x - mu) ** 2).mean(axis=1, keepdims=True) + EPS)
    return (x - mu) / sd, sd


def lnback(dy, y, sd):
    return (dy - dy.mean(axis=1, keepdims=True) - y * (dy * y).mean(axis=1, keepdims=True)) / sd


def init(rng):
    s = 0.35
    return {
        "E": rng.randn(len(VOCAB), D) * s, "P": rng.randn(MAXLEN, D) * s,
        "Wq": rng.randn(H, D, DH) * s, "Wk": rng.randn(H, D, DH) * s, "Wv": rng.randn(H, D, DH) * s,
        "Wo": rng.randn(H * DH, D) * s, "W1": rng.randn(D, F) * s, "b1": np.zeros(F), "W2": rng.randn(F, D) * s, "b2": np.zeros(D), "Wout": rng.randn(D, len(VOCAB)) * s, "b": np.zeros(len(VOCAB)),
    }


def forward(p, ids, keep=False):
    T = len(ids)
    X = p["E"][ids] + p["P"][:T]
    mask = np.triu(np.ones((T, T)), 1) * -1e9
    heads, A_all, Q_all, K_all, V_all = [], [], [], [], []
    for h in range(H):
        Q, K, V = X @ p["Wq"][h], X @ p["Wk"][h], X @ p["Wv"][h]
        A = softmax(Q @ K.T / math.sqrt(DH) + mask)
        heads.append(A @ V); A_all.append(A); Q_all.append(Q); K_all.append(K); V_all.append(V)
    C = np.concatenate(heads, axis=1)
    N1, sd1 = lnorm(X + C @ p["Wo"])
    Fh = np.maximum(0, N1 @ p["W1"] + p["b1"])
    N2, sd2 = lnorm(N1 + Fh @ p["W2"] + p["b2"])
    logits = N2 @ p["Wout"] + p["b"]
    cache = (ids, X, Q_all, K_all, V_all, A_all, C, (N1, sd1, Fh, N2, sd2))
    return logits, cache


def loss_and_grads(p, batch):
    g = {k: np.zeros_like(v) for k, v in p.items()}
    total, count = 0.0, 0
    for sent in batch:
        ids = [IDX[w] for w in sent]
        T = len(ids)
        logits, (ids, X, Q_all, K_all, V_all, A_all, C, (N1, sd1, Fh, N2, sd2)) = forward(p, ids)
        P = softmax(logits)
        dl = np.zeros_like(P)
        for t in range(T - 1):                                   # predict word t+1 from position t
            total += -math.log(P[t, ids[t + 1]] + 1e-12); count += 1
            dl[t] = P[t]; dl[t, ids[t + 1]] -= 1
        g["Wout"] += N2.T @ dl; g["b"] += dl.sum(axis=0)
        dS2 = lnback(dl @ p["Wout"].T, N2, sd2)
        g["W2"] += Fh.T @ dS2; g["b2"] += dS2.sum(axis=0)
        dFp = (dS2 @ p["W2"].T) * (Fh > 0)
        g["W1"] += N1.T @ dFp; g["b1"] += dFp.sum(axis=0)
        dH = lnback(dS2 + dFp @ p["W1"].T, N1, sd1)
        dX = dH.copy()
        g["Wo"] += C.T @ dH
        dC = dH @ p["Wo"].T
        for h in range(H):
            dO = dC[:, h * DH:(h + 1) * DH]
            A, Q, K, V = A_all[h], Q_all[h], K_all[h], V_all[h]
            dA = dO @ V.T
            dV = A.T @ dO
            dS = A * (dA - (dA * A).sum(axis=1, keepdims=True)) / math.sqrt(DH)
            dQ, dK = dS @ K, dS.T @ Q
            g["Wq"][h] += X.T @ dQ; g["Wk"][h] += X.T @ dK; g["Wv"][h] += X.T @ dV
            dX += dQ @ p["Wq"][h].T + dK @ p["Wk"][h].T + dV @ p["Wv"][h].T
        np.add.at(g["E"], ids, dX); g["P"][:T] += dX
    for k in g:
        g[k] /= count
    return total / count, g


def check_gradients():
    rng = np.random.RandomState(1)
    p = init(rng)
    batch = [["the", "cats", "near", "the", "box", "sleep", "."], ["the", "cat", "runs", "."]]
    _, g = loss_and_grads(p, batch)
    worst = 0.0
    for name in p:
        for _ in range(6):
            idx = tuple(rng.randint(0, s) for s in p[name].shape)
            old = p[name][idx]; eps = 1e-5
            p[name][idx] = old + eps; lp, _ = loss_and_grads(p, batch)
            p[name][idx] = old - eps; lm, _ = loss_and_grads(p, batch)
            p[name][idx] = old
            num = (lp - lm) / (2 * eps)
            worst = max(worst, abs(num - g[name][idx]) / max(1e-8, abs(num) + abs(g[name][idx])))
    print("largest relative gradient difference: %.2e (should be far below 1e-4)" % worst)
    return worst < 1e-4


def agreement(p):
    """Share of probability the model puts on verbs that agree with the subject, at the position before the verb."""
    tot = []
    for sent in sentences():
        ids = [IDX[w] for w in sent]
        logits, _ = forward(p, ids)
        P = softmax(logits)
        vpos = [i for i, w in enumerate(sent) if w in VERBS_S + VERBS_P][0] - 1
        want = VERBS_S if sent[1] in SING else VERBS_P
        tot.append(sum(P[vpos, IDX[w]] for w in want))
    return float(np.mean(tot)), float(np.min(tot))


def train():
    rng = np.random.RandomState(0)
    p = init(rng)
    m = {k: np.zeros_like(v) for k, v in p.items()}; v2 = {k: np.zeros_like(v) for k, v in p.items()}
    data = sentences()
    lr, b1, b2 = 0.03, 0.9, 0.999
    for step in range(1, 801):
        loss, g = loss_and_grads(p, data)
        for k in p:
            m[k] = b1 * m[k] + (1 - b1) * g[k]; v2[k] = b2 * v2[k] + (1 - b2) * g[k] ** 2
            p[k] -= lr * (m[k] / (1 - b1 ** step)) / (np.sqrt(v2[k] / (1 - b2 ** step)) + 1e-8)
        if step % 200 == 0:
            a, lo = agreement(p)
            print("step %4d  loss %.4f  agreement: mean %.3f, worst %.3f" % (step, loss, a, lo))
    return p


def write_js(p, path):
    r = lambda a: np.round(a, 4).tolist()
    model = {"vocab": VOCAB, "d": D, "heads": H, "dh": DH, "maxlen": MAXLEN, "E": r(p["E"]), "P": r(p["P"]),
             "Wq": r(p["Wq"]), "Wk": r(p["Wk"]), "Wv": r(p["Wv"]), "Wo": r(p["Wo"]), "W1": r(p["W1"]), "b1": r(p["b1"]), "W2": r(p["W2"]), "b2": r(p["b2"]), "ffn": F, "Wout": r(p["Wout"]), "b": r(p["b"])}
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Weights of the tiny attention model, written by examples/sim-attention/train_tiny.py (rounded to 4 decimals). */\n")
        f.write("window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} };\nwindow.AIQPSim.models = window.AIQPSim.models || {};\n")
        f.write("window.AIQPSim.models.attn = " + json.dumps(model, separators=(",", ":")) + ";\n")
    return model


if __name__ == "__main__":
    ok = check_gradients()
    if "--check" in sys.argv:
        sys.exit(0 if ok else 1)
    if not ok:
        sys.exit("gradient check failed")
    p = train()
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
    out = os.path.normpath(os.path.join(root, "public", "assets", "sims", "attn-model.js"))
    write_js(p, out)
    print("wrote", out, os.path.getsize(out), "bytes")
