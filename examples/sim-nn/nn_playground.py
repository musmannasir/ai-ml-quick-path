"""The calculation behind the "Neural network playground" simulation, in plain Python (no packages).

It trains the same small network as the page, on the same made-up points, with the same starting weights,
and prints the same headline numbers. The page runs this calculation in JavaScript; scripts/check-sims.mjs
checks that the two agree to four decimal places.

Run:  python nn_playground.py
"""
import math


def lcg(seed):
    s = seed & 0xFFFFFFFF
    def nxt():
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
        return s / 4294967296
    return nxt


def make_data(kind, n, seed):
    r, X, y = lcg(seed), [], []
    while len(X) < n:
        a, b = r() * 2 - 1, r() * 2 - 1
        if kind == "line":
            s = 0.8 * a + 0.6 * b; ok = abs(s) > 0.12; label = 1 if s > 0 else 0
        elif kind == "xor":
            ok = abs(a) > 0.12 and abs(b) > 0.12; label = 1 if a * b > 0 else 0
        else:
            d = math.sqrt(a * a + b * b); ok = abs(d - 0.55) > 0.08 and d < 1.0; label = 1 if d < 0.55 else 0
        if ok:
            X.append([a, b]); y.append(label)
    return X, y


ACT = {
    "tanh": (math.tanh, lambda a: 1 - a * a),
    "relu": (lambda z: z if z > 0 else 0.0, lambda a: 1.0 if a > 0 else 0.0),
    "sigmoid": (lambda z: 1 / (1 + math.exp(-z)), lambda a: a * (1 - a)),
}


def make_net(hidden, act, seed):
    sizes = [2] + hidden + [1]
    r, W, B = lcg(seed), [], []
    for l in range(len(sizes) - 1):
        lim = math.sqrt(6 / (sizes[l] + sizes[l + 1]))
        W.append([[(r() * 2 - 1) * lim for _ in range(sizes[l])] for _ in range(sizes[l + 1])])
        B.append([0.0] * sizes[l + 1])
    return {"sizes": sizes, "W": W, "B": B, "act": act}


def forward(net, x):
    A, f, last = [list(x)], ACT[net["act"]][0], len(net["W"]) - 1
    for l in range(last + 1):
        prev, out = A[l], []
        for j in range(len(net["W"][l])):
            z = net["B"][l][j]
            for i in range(len(prev)):
                z += net["W"][l][j][i] * prev[i]
            out.append(1 / (1 + math.exp(-z)) if l == last else f(z))
        A.append(out)
    return A


def evaluate(net, X, y):
    loss, hit, eps = 0.0, 0, 1e-12
    for k in range(len(X)):
        p = forward(net, X[k])[-1][0]
        loss += -(y[k] * math.log(p + eps) + (1 - y[k]) * math.log(1 - p + eps))
        hit += (1 if p > 0.5 else 0) == y[k]
    return loss / len(X), hit / len(X)


def train_epoch(net, X, y, lr):
    L, n, d = len(net["W"]), len(X), ACT[net["act"]][1]
    gW = [[[0.0] * len(row) for row in m] for m in net["W"]]
    gB = [[0.0] * len(v) for v in net["B"]]
    for k in range(n):
        A = forward(net, X[k])
        delta = [A[L][0] - y[k]]
        for l in range(L - 1, -1, -1):
            for j in range(len(delta)):
                gB[l][j] += delta[j] / n
                for i in range(len(A[l])):
                    gW[l][j][i] += delta[j] * A[l][i] / n
            if l > 0:
                nxt = []
                for i in range(len(A[l])):
                    s = 0.0
                    for j in range(len(delta)):
                        s += net["W"][l][j][i] * delta[j]
                    nxt.append(s * d(A[l][i]))
                delta = nxt
    for l in range(L):
        for j in range(len(net["W"][l])):
            net["B"][l][j] -= lr * gB[l][j]
            for i in range(len(net["W"][l][j])):
                net["W"][l][j][i] -= lr * gW[l][j][i]


if __name__ == "__main__":
    # The page's default set-up: XOR data, one hidden layer of 4 tanh units, learning rate 0.5.
    trX, trY = make_data("xor", 100, 11)
    teX, teY = make_data("xor", 60, 23)
    net = make_net([4], "tanh", 5)
    for epoch in range(401):
        if epoch in (0, 50, 100, 200, 400):
            tl, ta = evaluate(net, trX, trY)
            vl, va = evaluate(net, teX, teY)
            print("epoch %3d  train_loss %.4f  train_acc %.4f  test_loss %.4f  test_acc %.4f" % (epoch, tl, ta, vl, va))
        train_epoch(net, trX, trY, 0.5)
    # The same data with one hidden unit: a single unit can only draw a straight boundary, so XOR is out of reach.
    net1 = make_net([1], "tanh", 5)
    for epoch in range(401):
        train_epoch(net1, trX, trY, 0.5)
    tl, ta = evaluate(net1, trX, trY)
    vl, va = evaluate(net1, teX, teY)
    print("one hidden unit, epoch 401  train_loss %.4f  train_acc %.4f  test_loss %.4f  test_acc %.4f" % (tl, ta, vl, va))
