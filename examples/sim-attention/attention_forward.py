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


def lnorm(x):
    n = len(x)
    mu = sum(x) / n
    sd = math.sqrt(sum((a - mu) ** 2 for a in x) / n + 1e-5)
    return [(a - mu) / sd for a in x]


def block(model, x, back, no_attn=False, no_ffn=False, no_res=False):
    """One Transformer block for one word: attention output joins the word's own vector (add), normalise,
    feed-forward, add, normalise, then scores for every word."""
    s1 = list(x) if no_attn else [(back[k] if no_res else x[k] + back[k]) for k in range(len(x))]
    n1 = lnorm(s1)
    hid = [max(0.0, v + model["b1"][i]) for i, v in enumerate(vec_mat(n1, model["W1"]))]
    g = [v + model["b2"][i] for i, v in enumerate(vec_mat(hid, model["W2"]))]
    s2 = list(n1) if no_ffn else [(g[k] if no_res else n1[k] + g[k]) for k in range(len(n1))]
    n2 = lnorm(s2)
    logits = [v + model["b"][i] for i, v in enumerate(vec_mat(n2, model["Wout"]))]
    return {"s1": s1, "n1": n1, "hid": hid, "g": g, "s2": s2, "n2": n2, "logits": logits, "p": softmax(logits)}


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
    blk = []
    for t in range(T):
        C = []
        for hd in heads:
            C += hd["O"][t]
        blk.append(block(model, X[t], vec_mat(C, model["Wo"])))
    P = [b["p"] for b in blk]
    return heads, P, blk


if __name__ == "__main__":
    model = load()
    words = "the cats near the box sleep .".split()
    heads, P, blk = run(model, words)
    q = 4                                              # the word "box" (position 5), which is about to be followed by a verb
    for h, hd in enumerate(heads):
        print("head %d, row for word %d (%s): %s" % (h + 1, q + 1, words[q], " ".join("%s:%.2f" % (w, a) for w, a in zip(words, hd["A"][q]))))
    top = sorted(range(len(P[q])), key=lambda i: -P[q][i])[:4]
    print("next word after '%s': %s" % (words[q], " ".join("%s:%.2f" % (model["vocab"][i], P[q][i]) for i in top)))
    agree = sum(P[q][model["vocab"].index(v)] for v in ("sleep", "run", "sit"))
    print("probability on verbs that agree with the plural subject: %.3f" % agree)
    heads2, _, _ = run(model, words, causal=False, scaled=False)
    print("no mask, no scaling, head 1, row for word %d: %s" % (q + 1, " ".join("%s:%.2f" % (w, a) for w, a in zip(words, heads2[0]["A"][q]))))
    b = blk[q]
    print("block at word %d: after add+norm %s | feed-forward adds %s | final %s" % (q + 1, " ".join("%.2f" % v for v in b["n1"][:4]), " ".join("%.2f" % v for v in b["g"][:4]), " ".join("%.2f" % v for v in b["n2"][:4])))
    for label, kw in (("no attention", {"no_attn": True}), ("no feed-forward", {"no_ffn": True}), ("no add path", {"no_res": True})):
        C = []
        for hd in heads:
            C += hd["O"][q]
        back = vec_mat(C, model["Wo"])
        X = [model["E"][model["vocab"].index(words[q])][k] + model["P"][q][k] for k in range(model["d"])]
        r = block(model, X, back, **kw)
        agree2 = sum(r["p"][model["vocab"].index(v)] for v in ("sleep", "run", "sit"))
        print("%s: probability on agreeing verbs %.3f" % (label, agree2))
    # Transformer series, part 5: writing one word at a time. Same random numbers as the page (lcg below).
    def lcg(seed):
        st = [seed & 0xFFFFFFFF]

        def nxt():
            st[0] = (st[0] * 1664525 + 1013904223) & 0xFFFFFFFF
            return st[0] / 4294967296
        return nxt

    def write(prompt, temp, topk, mode, seed):
        w, rnd = prompt.split(), lcg(seed)
        while len(w) < model["maxlen"] and w[-1] != ".":
            _, _, blk_ = run(model, w)
            p = softmax([v / temp for v in blk_[len(w) - 1]["logits"]])
            if 0 < topk < len(p):
                order = sorted(range(len(p)), key=lambda i: (-p[i], i))[:topk]
                z = sum(p[i] for i in order)
                p = [p[i] / z if i in order else 0.0 for i in range(len(p))]
            if mode == "greedy":
                i = 0
                for j, v in enumerate(p):
                    if v > p[i]:
                        i = j
            else:
                r, c, i = rnd(), 0.0, None
                for j, v in enumerate(p):
                    c += v
                    if r < c and v > 0:
                        i = j
                        break
                if i is None:
                    i = max(j for j, v in enumerate(p) if v > 0)
            w.append(model["vocab"][i])
        return " ".join(w)

    print("greedy from 'the cats': " + write("the cats", 1.0, 0, "greedy", 7))
    print("sampled from 'the', seed 7: " + write("the", 1.0, 0, "sample", 7))
    print("sampled from 'the', seed 7, top-k 3, temperature 0.5: " + write("the", 0.5, 3, "sample", 7))
    # Transformer series, part 6: the loss at every position of one sentence (training looks at all of them in one pass).
    _, P3, _ = run(model, words)
    L = [-math.log(P3[t][model["vocab"].index(words[t + 1])] + 1e-12) for t in range(len(words) - 1)]
    print("loss per position: " + " ".join("%.2f" % v for v in L) + "  average %.3f  random guessing %.2f" % (sum(L) / len(L), math.log(len(model["vocab"]))))

