"""The calculation behind the "Attention" simulation: one attention layer with two heads, in plain Python (no packages).

It reads the same weights file as the page (public/assets/sims/attn-model.js, written by train_tiny.py) and prints
the numbers the page shows for its default sentence. scripts/check-sims.mjs checks that the page's JavaScript agrees.

Run:  python attention_forward.py
"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.normpath(os.path.join(HERE, "..", "..", "public", "assets", "sims", "attn-model.js"))


def load():
    text = open(PATH, encoding="utf-8").read()
    return json.loads(text.split("attn = ", 1)[1].rsplit(";", 1)[0])


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def vec_mat(v, M):
    return [sum(v[i] * M[i][j] for i in range(len(v))) for j in range(len(M[0]))]


def softmax(a):
    m = max(a)
    e = [math.exp(x - m) for x in a]
    z = sum(e)
    return [x / z for x in e]


def run(model, words, causal=True, scaled=True):
    T, dh = len(words), model["dh"]
    ids = [model["vocab"].index(w) for w in words]
    X = [[model["E"][ids[t]][k] + model["P"][t][k] for k in range(model["d"])] for t in range(T)]
    heads = []
    for h in range(model["heads"]):
        Qm = [vec_mat(x, model["Wq"][h]) for x in X]
        Km = [vec_mat(x, model["Wk"][h]) for x in X]
        Vm = [vec_mat(x, model["Wv"][h]) for x in X]
        A, O = [], []
        for t in range(T):
            allowed = [j for j in range(T) if (not causal or j <= t)]
            s = [dot(Qm[t], Km[j]) / (math.sqrt(dh) if scaled else 1.0) for j in allowed]
            sm = softmax(s)
            a = [0.0] * T
            for j, w in zip(allowed, sm):
                a[j] = w
            A.append(a)
            O.append([sum(a[j] * Vm[j][k] for j in range(T)) for k in range(dh)])
        heads.append({"A": A, "O": O})
    P = []
    for t in range(T):
        C = []
        for hd in heads:
            C += hd["O"][t]
        back = vec_mat(C, model["Wo"])
        H = [X[t][k] + back[k] for k in range(model["d"])]
        logits = [v + model["b"][i] for i, v in enumerate(vec_mat(H, model["Wout"]))]
        P.append(softmax(logits))
    return heads, P


if __name__ == "__main__":
    model = load()
    words = "the cats near the box sleep .".split()
    heads, P = run(model, words)
    q = 4                                              # the word "box" (position 5), which is about to be followed by a verb
    for h, hd in enumerate(heads):
        print("head %d, row for word %d (%s): %s" % (h + 1, q + 1, words[q], " ".join("%s:%.2f" % (w, a) for w, a in zip(words, hd["A"][q]))))
    top = sorted(range(len(P[q])), key=lambda i: -P[q][i])[:4]
    print("next word after '%s': %s" % (words[q], " ".join("%s:%.2f" % (model["vocab"][i], P[q][i]) for i in top)))
    agree = sum(P[q][model["vocab"].index(v)] for v in ("sleep", "run", "sit"))
    print("probability on verbs that agree with the plural subject: %.3f" % agree)
    heads2, _ = run(model, words, causal=False, scaled=False)
    print("no mask, no scaling, head 1, row for word %d: %s" % (q + 1, " ".join("%s:%.2f" % (w, a) for w, a in zip(words, heads2[0]["A"][q]))))
