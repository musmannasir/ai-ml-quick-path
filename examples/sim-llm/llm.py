"""The calculation behind the Phase 3 simulations (model builder, learning to write, embedding training, LoRA and
quantisation, vector search, retrieval for RAG), in plain Python (no packages). The page does the same calculation in
JavaScript (public/assets/sims/llm.js); scripts/check-sims.mjs checks that the two agree.

Run:  python llm.py
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "sim-tokens"))
from gen_tokens import CORPUS, lcg, split, train, counts  # noqa: E402


def gauss(r):
    return (r() + r() + r() - 1.5) * 2


# ---- model builder: sizes by simple formulas ----
def params(layers, d, vocab):
    return 12 * layers * d * d + vocab * d            # attention 4 d^2 + feed-forward 8 d^2 per layer, plus the word table


def weight_bytes(n, bits):
    return n * bits / 8


def kv_bytes_per_token(layers, d, bits):
    return 2 * layers * d * bits / 8                  # one key and one value vector per layer


def fit_check(params_b, bits, layers, ctx, vram, kv_heads=8, head_size=128, working=1.0):
    w = params_b * bits / 8
    c = 2 * layers * kv_heads * head_size * 2 * ctx / 1e9
    t = w + c + working
    return w, c, t, t <= vram


def speed_limit(weights_gb, bandwidth):
    return bandwidth / weights_gb


def kv_bytes_grouped(layers, d, bits, group):
    return kv_bytes_per_token(layers, d, bits) / group  # group query heads share one key and value head


def train_flops(n, tokens):
    return 6 * n * tokens


# ---- learning to write: a count model trained on more and more text ----
def sentences():
    out = []
    for s in CORPUS.split("."):
        s = s.strip()
        if s:
            out.append(split(s) + ["."])
    return out


def train_tokens():
    return [w for i, sent in enumerate(sentences()) if i % 4 != 3 for w in sent]


def train_len():
    return len(train_tokens())


def holdout_loss(n_train):
    """Loss on every fourth sentence, which the model never reads, after reading the first n_train words of the rest."""
    vocab = len(set(split(CORPUS)))
    model = train(" ".join(train_tokens()[:n_train]))
    total, cnt = 0.0, 0
    for i, sent in enumerate(sentences()):
        if i % 4 != 3:
            continue
        for j in range(1, len(sent)):
            c = counts(model, sent[max(0, j - 2):j])
            tot = sum(c.values())
            total += -math.log((c.get(sent[j], 0) + 0.1) / (tot + 0.1 * vocab))
            cnt += 1
    return total / cnt


# ---- embedding training: pull a word toward its group, push it from other groups ----
WORDS = ["cat", "dog", "bird", "fish", "bread", "rice", "soup", "cake", "car", "bus", "train", "boat"]


def emb_init():
    r = lcg(4)
    return [[(r() * 2 - 1) * 0.8, (r() * 2 - 1) * 0.8] for _ in WORDS]


def emb_step(P, tau, lr):
    n = len(P)
    G = [[0.0, 0.0] for _ in P]
    loss = 0.0
    for i in range(n):
        g = i // 4
        j = g * 4 + (i % 4 + 1) % 4
        cand = [j] + [k for k in range(n) if k // 4 != g]
        z = [-((P[i][0] - P[k][0]) ** 2 + (P[i][1] - P[k][1]) ** 2) / tau for k in cand]
        m = max(z)
        e = [math.exp(v - m) for v in z]
        s = sum(e)
        q = [v / s for v in e]
        loss += -math.log(q[0])
        for idx, k in enumerate(cand):
            coef = q[idx] - (1 if idx == 0 else 0)
            for a in range(2):
                diff = P[i][a] - P[k][a]
                G[i][a] += coef * (-2 * diff / tau)
                G[k][a] += coef * (2 * diff / tau)
    for i in range(n):
        for a in range(2):
            P[i][a] -= lr * G[i][a] / n
    return loss / n


def emb_accuracy(P):
    ok = 0
    for i in range(len(P)):
        best = min((k for k in range(len(P)) if k != i), key=lambda k: ((P[i][0] - P[k][0]) ** 2 + (P[i][1] - P[k][1]) ** 2, k))
        ok += 1 if best // 4 == i // 4 else 0
    return ok / len(P)


# ---- LoRA: a big change written as two thin matrices ----
def lora_target():
    r = lcg(7)
    A = [[0.5 * gauss(r) for _ in range(2)] for _ in range(8)]
    B = [[0.5 * gauss(r) for _ in range(8)] for _ in range(2)]
    M = [[sum(A[i][k] * B[k][j] for k in range(2)) + 0.05 * gauss(r) for j in range(8)] for i in range(8)]
    return M


def frob(M):
    return math.sqrt(sum(v * v for row in M for v in row))


def low_rank_error(M, rank):
    R = [row[:] for row in M]
    base = frob(M)
    for _ in range(rank):
        v = [1 / math.sqrt(8)] * 8
        for _ in range(60):
            u = [sum(R[i][j] * v[j] for j in range(8)) for i in range(8)]
            nu = math.sqrt(sum(x * x for x in u))
            u = [x / nu for x in u]
            w = [sum(R[i][j] * u[i] for i in range(8)) for j in range(8)]
            sig = math.sqrt(sum(x * x for x in w))
            v = [x / sig for x in w]
        for i in range(8):
            for j in range(8):
                R[i][j] -= sig * u[i] * v[j]
    return frob(R) / base


def lora_variants(d, r):
    return {"lora": 2 * d * r, "fa": d * r, "vera": d + r, "plus": 2 * d * r, "delta": 2 * d * r}


# ---- quantisation: store each weight in fewer bits ----
def quant_weights():
    r = lcg(9)
    return [0.05 * gauss(r) for _ in range(400)]


def quant_rmse(W, bits):
    levels = 2 ** (bits - 1) - 1
    scale = max(abs(w) for w in W) / levels
    err = 0.0
    for w in W:
        q = math.floor(w / scale + 0.5) * scale
        err += (w - q) ** 2
    return math.sqrt(err / len(W))


# ---- vector search: made-up 2-D positions for 24 words in 4 topics ----
TOPICS = [("animals", ["cat", "dog", "bird", "fish", "horse", "mouse"]), ("food", ["bread", "rice", "soup", "cake", "pasta", "apple"]),
          ("vehicles", ["car", "bus", "train", "boat", "plane", "bike"]), ("places", ["park", "city", "farm", "beach", "lake", "hill"])]


def vs_points():
    r = lcg(12)
    pts = []
    for t, (_, words) in enumerate(TOPICS):
        ang = math.radians(20 + 90 * t)
        for w in words:
            pts.append((w, t, 0.8 * math.cos(ang) + 0.12 * gauss(r), 0.8 * math.sin(ang) + 0.12 * gauss(r)))
    return pts


def vs_search(pts, q, k, metric):
    def score(p):
        if metric == "cos":
            return (p[2] * q[0] + p[3] * q[1]) / (math.hypot(p[2], p[3]) * math.hypot(q[0], q[1]))
        return -math.hypot(p[2] - q[0], p[3] - q[1])
    order = sorted(range(len(pts)), key=lambda i: (-score(pts[i]), i))
    return [pts[i][0] for i in order[:k]]


# ---- RAG: split a made-up document into chunks, score them against a question ----
DOC = ("Riverbend Library lets members borrow up to six books at one time. A book can be kept for twenty one days. "
       "Members may renew a book twice, unless another member has reserved it. Late books cost ten cents for each day. "
       "The library never charges more than five dollars for one late book. Reserved books wait at the front desk for four days. "
       "Study rooms can be booked for two hours at a time. Members who need a room for longer must ask a librarian. "
       "The reading room opens at eight in the morning and closes at six in the evening on weekdays. "
       "On Saturdays it closes at two in the afternoon. The library is closed on Sundays. A new member card is free for residents. "
       "Visitors pay a deposit of ten dollars, which is returned when the card is handed back.")
QUESTIONS = [("How many books can I borrow at once?", "six books"), ("How much is the late fee for each day?", "ten cents"),
             ("When does the library close on Saturdays?", "two in the afternoon"), ("How much is the deposit for visitors?", "ten dollars")]
STOP = set("the a an of at is are how much many can i do does when on for to and in per each it be by or than who may up".split())


def words_of(text):
    return text.lower().replace(".", " ").replace(",", " ").split()


def chunk(size, overlap):
    w = words_of(DOC)
    step = max(1, size - overlap)
    out, i = [], 0
    while i < len(w):
        out.append(w[i:i + size])
        if i + size >= len(w):
            break
        i += step
    return out


def tfidf_rank(chunks, question):
    docs = [[t for t in c if t not in STOP] for c in chunks]
    qt = [t for t in words_of(question) if t not in STOP]
    n = len(docs)
    idf = {}
    for t in set(sum(docs, []) + qt):
        df = sum(1 for d in docs if t in d)
        idf[t] = math.log((n + 1) / (df + 1)) + 1

    def vec(tokens):
        v = {}
        for t in tokens:
            v[t] = v.get(t, 0) + idf[t]
        return v

    def cos(a, b):
        num = sum(a[t] * b.get(t, 0) for t in a)
        den = math.sqrt(sum(x * x for x in a.values())) * math.sqrt(sum(x * x for x in b.values()))
        return num / den if den else 0.0

    qv = vec(qt)
    sc = [cos(qv, vec(d)) for d in docs]
    return sorted(range(n), key=lambda i: (-sc[i], i)), sc


def rag_hit(size, overlap, k, qi):
    chunks = chunk(size, overlap)
    order, _ = tfidf_rank(chunks, QUESTIONS[qi][0])
    text = " ".join(" ".join(chunks[i]) for i in order[:k])
    return QUESTIONS[qi][1] in text


if __name__ == "__main__":
    for name, (L, d, V) in (("toy", (1, 8, 21)), ("GPT-2 small shape", (12, 768, 50257)), ("7B-class shape", (32, 4096, 32000)), ("70B-class shape", (80, 8192, 32000))):
        n = params(L, d, V)
        print("%s: %d parameters, weights %.2f GB at 16 bits, %.2f GB at 4 bits, cache %.0f KB per token" % (name, n, weight_bytes(n, 16) / 1e9, weight_bytes(n, 4) / 1e9, kv_bytes_per_token(L, d, 16) / 1e3))
    print("training work for the 7B-class shape on 140 billion words of text: %.2e operations" % train_flops(params(32, 4096, 32000), 140e9))
    print("held-out loss by training words: " + " ".join("%d:%.3f" % (n, holdout_loss(n)) for n in (10, 30, 60, 100, train_len())))
    P = emb_init()
    out = ["step 0 loss %.3f neighbours %.2f" % (emb_step([p[:] for p in P], 0.5, 0.0), emb_accuracy(P))]
    for s in range(1, 101):
        loss = emb_step(P, 0.5, 0.3)
        if s in (5, 20, 100):
            out.append("step %d loss %.3f neighbours %.2f" % (s, loss, emb_accuracy(P)))
    print("embedding training, temperature 0.5: " + "; ".join(out))
    M = lora_target()
    print("rank-r error of a made-up update (relative): " + " ".join("r=%d:%.3f" % (r, low_rank_error(M, r)) for r in (1, 2, 3, 4)))
    print("one 4096 by 4096 layer: %d weights to change, LoRA rank 8 trains %d (%.2f%%)" % (4096 * 4096, 2 * 4096 * 8, 100 * 2 * 4096 * 8 / (4096 * 4096)))
    print("cache per token, 7B-class shape at 16 bits, query heads per key-value head 1/4/8: " + " ".join("%.1f KB" % (kv_bytes_grouped(32, 4096, 16, g) / 1e3) for g in (1, 4, 8)))
    for name, p, b, layers, ctx, vram in (("8B 16-bit 24 GB", 8, 16, 32, 8192, 24), ("8B 4-bit 16 GB", 8, 4, 32, 8192, 16), ("8B 16-bit 16 GB", 8, 16, 32, 8192, 16), ("70B 4-bit 48 GB", 70, 4, 80, 8192, 48), ("70B 16-bit 48 GB", 70, 16, 80, 8192, 48)):
        w, c, t, ok = fit_check(p, b, layers, ctx, vram)
        print("hardware fit check, %s, 8192 tokens: weights %.2f cache %.2f total %.2f %s" % (name, w, c, t, "fits" if ok else "does not fit"))
    print("hardware speed limit at 400 GB/s, 8B: " + " ".join("%d-bit %.1f" % (b, speed_limit(8 * b / 8, 400)) for b in (16, 8, 4)) + "; 70B 4-bit at 1000 GB/s: %.1f" % speed_limit(35, 1000))
    for d, r in ((4096, 8), (4096, 64), (768, 8)):
        v = lora_variants(d, r)
        print("LoRA variants, %d by %d layer, rank %d: LoRA %d, LoRA-FA %d, VeRA %d, LoRA+ %d, Delta-LoRA %d" % (d, d, r, v["lora"], v["fa"], v["vera"], v["plus"], v["delta"]))
    W = quant_weights()
    print("quantisation error (RMSE) by bits: " + " ".join("%d:%.5f" % (b, quant_rmse(W, b)) for b in (8, 6, 4, 3, 2)))
    pts = vs_points()
    for q in ((0.5, 0.45), (0.0, 0.9)):
        print("search near (%.2f, %.2f), 5 nearest: cosine %s | distance %s" % (q[0], q[1], " ".join(vs_search(pts, q, 5, "cos")), " ".join(vs_search(pts, q, 5, "euclid"))))
    print("chunks of 10, 30, 60 words (no overlap): %d %d %d" % tuple(len(chunk(s, 0)) for s in (10, 30, 60)))
    for s in (10, 20, 30, 60, 80):
        print("size %d, no overlap, top 1: answer found for questions %s" % (s, "".join("yes " if rag_hit(s, 0, 1, q) else "no  " for q in range(4)).strip()))
    print("size 20, overlap 10, top 2: " + " ".join("yes" if rag_hit(20, 10, 2, q) else "no" for q in range(4)))
