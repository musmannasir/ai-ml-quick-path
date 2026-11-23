"""The calculation behind the Phase 4 simulations (convolution, a running state over a sentence, word weights,
autoencoder and diffusion, message passing on a graph, spectrogram, reinforcement learning), in plain Python (no
packages). The page does the same calculation in JavaScript (public/assets/sims/dl.js); scripts/check-sims.mjs checks
that the two agree.

Run:  python dl.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim-supervised"))
from algorithms import lcg  # noqa: E402


def gauss(r):
    return (r() + r() + r() - 1.5) * 2


# ---- convolution ----
IMAGES = {
    "bar": [[1 if c in (3, 4) else 0 for c in range(8)] for _ in range(8)],
    "square": [[1 if 2 <= r <= 5 and 2 <= c <= 5 else 0 for c in range(8)] for r in range(8)],
    "diagonal": [[1 if r == c else 0 for c in range(8)] for r in range(8)],
}
KERNELS = {
    "vertical edge": [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
    "horizontal edge": [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
    "blur": [[1 / 9] * 3 for _ in range(3)],
}


def conv2d(img, ker, stride, pad):
    n, k = len(img), len(ker)
    P = [[0] * (n + 2 * pad) for _ in range(n + 2 * pad)]
    for r in range(n):
        for c in range(n):
            P[r + pad][c + pad] = img[r][c]
    size = (n + 2 * pad - k) // stride + 1
    return [[sum(P[i * stride + a][j * stride + b] * ker[a][b] for a in range(k) for b in range(k)) for j in range(size)] for i in range(size)]


def maxpool2(m):
    s = len(m) // 2
    return [[max(m[2 * i][2 * j], m[2 * i][2 * j + 1], m[2 * i + 1][2 * j], m[2 * i + 1][2 * j + 1]) for j in range(s)] for i in range(s)]


# ---- a running state over a sentence ----
SENTENCES = [[("great", 1), ("opening", 0), ("but", 0), ("dull", -1), ("slow", -1), ("ending", 0)],
             [("awful", -1), ("start", 0), ("then", 0), ("improves", 1), ("gets", 0), ("great", 1)]]


def run_state(sent, a, b):
    h, out = 0.0, []
    for _, x in sent:
        h = math.tanh(a * h + b * x)
        out.append(h)
    return out


# ---- word weights ----
DOCS = ["great film great acting loved the film", "boring film slow plot hated the plot", "great plot fast acting loved it", "slow boring ending hated it"]
STOP = {"the", "it"}


def tf_vectors(use_idf):
    docs = [[w for w in d.split() if w not in STOP] for d in DOCS]
    n = len(docs)
    vocab = sorted(set(w for d in docs for w in d))
    idf = {w: (math.log((n + 1) / (sum(1 for d in docs if w in d) + 1)) + 1 if use_idf else 1.0) for w in vocab}
    return [{w: d.count(w) * idf[w] for w in vocab if w in d} for d in docs]


def cosine(a, b):
    num = sum(a[w] * b.get(w, 0) for w in a)
    return num / (math.sqrt(sum(v * v for v in a.values())) * math.sqrt(sum(v * v for v in b.values())))


# ---- autoencoder and diffusion ----
def ae_data():
    r = lcg(21)
    u = [gauss(r) for _ in range(8)]
    v = [gauss(r) for _ in range(8)]
    X = []
    for _ in range(40):
        z1, z2 = gauss(r), 0.6 * gauss(r)
        X.append([z1 * u[i] + z2 * v[i] + 0.1 * gauss(r) for i in range(8)])
    mean = [sum(row[i] for row in X) / 40 for i in range(8)]
    return [[row[i] - mean[i] for i in range(8)] for row in X]


def components(X, count):
    n = len(X)
    C = [[sum(X[k][i] * X[k][j] for k in range(n)) / n for j in range(8)] for i in range(8)]
    out = []
    for _ in range(count):
        w = [1 / math.sqrt(8)] * 8
        lam = 0.0
        for _ in range(80):
            y = [sum(C[i][j] * w[j] for j in range(8)) for i in range(8)]
            lam = math.sqrt(sum(t * t for t in y))
            w = [t / lam for t in y]
        out.append(w)
        for i in range(8):
            for j in range(8):
                C[i][j] -= lam * w[i] * w[j]
    return out


def reconstruct(x, comps):
    out = [0.0] * 8
    for w in comps:
        s = sum(x[i] * w[i] for i in range(8))
        for i in range(8):
            out[i] += s * w[i]
    return out


def ae_error(X, comps):
    num = sum((X[k][i] - reconstruct(X[k], comps)[i]) ** 2 for k in range(len(X)) for i in range(8))
    den = sum(X[k][i] ** 2 for k in range(len(X)) for i in range(8))
    return math.sqrt(num / den)


SIGNAL = [math.sin(2 * math.pi * i / 32) for i in range(32)]


def alpha_bar(t):
    a = 1.0
    for s in range(1, t + 1):
        a *= 1 - (0.01 + 0.29 * (s - 1) / 19)
    return a


def noisy(t, eps):
    ab = alpha_bar(t)
    return [math.sqrt(ab) * s + math.sqrt(1 - ab) * e for s, e in zip(SIGNAL, eps)]


def rms(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)) / len(a))


# ---- message passing on a graph ----
EDGES = [(0, 1), (1, 2), (2, 3), (3, 4), (1, 5), (4, 5)]


def neighbours():
    nb = [[] for _ in range(6)]
    for a, b in EDGES:
        nb[a].append(b)
        nb[b].append(a)
    return nb


def message_round(h, w):
    nb = neighbours()
    return [w * h[i] + (1 - w) * sum(h[j] for j in nb[i]) / len(nb[i]) for i in range(6)]


# ---- spectrogram ----
def signal():
    out = []
    for n in range(512):
        v = math.sin(2 * math.pi * (100 if n < 256 else 250) * n / 1000)
        if n == 300:
            v += 3
        out.append(v)
    return out


def spectrogram(sig, N):
    hop = N // 2
    frames = (len(sig) - N) // hop + 1
    win = [0.5 - 0.5 * math.cos(2 * math.pi * k / (N - 1)) for k in range(N)]
    out = []
    for f in range(frames):
        seg = [sig[f * hop + k] * win[k] for k in range(N)]
        row = []
        for b in range(N // 2 + 1):
            re = sum(seg[k] * math.cos(2 * math.pi * b * k / N) for k in range(N))
            im = sum(seg[k] * math.sin(2 * math.pi * b * k / N) for k in range(N))
            row.append(math.sqrt(re * re + im * im))
        out.append(row)
    return out


# ---- reinforcement learning ----
MOVES = [(0, 1), (1, 0), (0, -1), (-1, 0)]    # up, right, down, left
GOAL, PIT = 15, 6


def grid_step(s, a):
    x, y = s % 4, s // 4
    x = min(3, max(0, x + MOVES[a][0]))
    y = min(3, max(0, y + MOVES[a][1]))
    t = y * 4 + x
    if t == GOAL:
        return t, 1.0, True
    if t == PIT:
        return t, -1.0, True
    return t, -0.04, False


def best(q):
    b = 0
    for i in range(1, 4):
        if q[i] > q[b]:
            b = i
    return b


def q_learn(eps, alpha, gamma, episodes, seed):
    r = lcg(seed)
    Q = [[0.0] * 4 for _ in range(16)]
    for _ in range(episodes):
        s = 0
        for _ in range(40):
            a = int(r() * 4) if r() < eps else best(Q[s])
            t, rew, done = grid_step(s, a)
            Q[s][a] += alpha * (rew + (0 if done else gamma * max(Q[t])) - Q[s][a])
            s = t
            if done:
                break
    return Q


def greedy_path(Q):
    s, path = 0, [0]
    for _ in range(12):
        s, _, done = grid_step(s, best(Q[s]))
        path.append(s)
        if done:
            break
    return path


def bandit(eps, pulls, seed=3):
    p = [0.3, 0.5, 0.7]
    r = lcg(seed)
    est, n, got = [0.0] * 3, [0] * 3, 0.0
    for _ in range(pulls):
        if r() < eps:
            a = int(r() * 3)
        else:
            a = 0
            for i in (1, 2):
                if est[i] > est[a]:
                    a = i
        rew = 1 if r() < p[a] else 0
        n[a] += 1
        est[a] += (rew - est[a]) / n[a]
        got += p[a]
    return n, est, pulls * 0.7 - got


if __name__ == "__main__":
    m = conv2d(IMAGES["bar"], KERNELS["vertical edge"], 1, 0)
    print("bar with vertical edge filter, row 3 of the map: " + " ".join("%d" % v for v in m[3]) + "; map size %d" % len(m))
    print("output sizes for an 8 by 8 image, 3 by 3 filter: stride 1 pad 0 -> %d, stride 2 pad 0 -> %d, stride 1 pad 1 -> %d, after 2 by 2 max pool of the first -> %d" % (len(m), len(conv2d(IMAGES["bar"], KERNELS["vertical edge"], 2, 0)), len(conv2d(IMAGES["bar"], KERNELS["vertical edge"], 1, 1)), len(maxpool2(m))))
    for img, ker in (("square", "horizontal edge"), ("square", "vertical edge"), ("diagonal", "blur")):
        mm = conv2d(IMAGES[img], KERNELS[ker], 1, 0)
        print("%s with %s: strongest response %.2f, weakest %.2f" % (img, ker, max(max(r) for r in mm), min(min(r) for r in mm)))
    for a in (0.9, 0.3):
        print("running state, memory %.1f, sentence 1: %s" % (a, " ".join("%.3f" % v for v in run_state(SENTENCES[0], a, 1.0))))
    print("running state, memory 0.9, sentence 2: " + " ".join("%.3f" % v for v in run_state(SENTENCES[1], 0.9, 1.0)))
    for idf in (False, True):
        v = tf_vectors(idf)[0]
        top = sorted(v.items(), key=lambda kv: (-kv[1], kv[0]))[:3]
        print("document 1 top words, %s: %s" % ("with idf" if idf else "counts only", " ".join("%s:%.3f" % kv for kv in top)))
    V = tf_vectors(True)
    print("similarity of document 1 to all four (with idf): " + " ".join("%.3f" % cosine(V[0], d) for d in V))
    X = ae_data()
    comps = components(X, 4)
    print("autoencoder with 1 to 4 numbers in the middle, share of the data lost: " + " ".join("%d:%.3f" % (k, ae_error(X, comps[:k])) for k in range(1, 5)))
    r = lcg(5)
    eps = [gauss(r) for _ in range(32)]
    print("diffusion, signal kept (alpha bar) and distance from the clean signal: " + " ".join("t=%d %.3f %.3f" % (t, alpha_bar(t), rms(noisy(t, eps), SIGNAL)) for t in (0, 5, 10, 20)))
    r2 = lcg(6)
    g2 = [gauss(r2) for _ in range(32)]
    ab = alpha_bar(10)
    xt = noisy(10, eps)
    out = []
    for e in (0, 0.1, 0.3, 0.5):
        guess = [a + e * b for a, b in zip(eps, g2)]
        x0 = [(x - math.sqrt(1 - ab) * g) / math.sqrt(ab) for x, g in zip(xt, guess)]
        out.append("%.1f:%.3f" % (e, rms(x0, SIGNAL)))
    print("diffusion at t=10, rebuilt signal error by error in the noise guess: " + " ".join(out))
    h = [1.0, 0, 0, 0, 0, 0]
    rows = {0: h}
    for k in range(1, 11):
        h = message_round(h, 0.4)
        rows[k] = h
    for k in (1, 2, 3, 5, 10):
        print("graph, round %d: %s spread %.3f" % (k, " ".join("%.3f" % v for v in rows[k]), max(rows[k]) - min(rows[k])))
    sig = signal()
    for N in (32, 128):
        sp = spectrogram(sig, N)
        peak = lambda row: max(range(len(row)), key=lambda b: (row[b], -b)) * 1000 / N
        print("spectrogram, window %d: %d frames, %d bins, peak frequency first frame %.1f Hz, last frame %.1f Hz" % (N, len(sp), len(sp[0]), peak(sp[0]), peak(sp[-1])))
    for ep in (1, 3, 10, 50):
        Q = q_learn(0.2, 0.5, 0.9, ep, 5)
        path = greedy_path(Q)
        print("grid world, %d episodes: greedy path %s (%s)" % (ep, ">".join(str(s) for s in path), "reaches the goal" if path[-1] == GOAL else "does not reach the goal"))
    for e in (0.0, 0.1, 0.5):
        n, est, reg = bandit(e, 500)
        print("bandit, epsilon %.1f, 500 pulls: pulls %s estimates %s regret %.1f" % (e, n, " ".join("%.2f" % v for v in est), reg))
