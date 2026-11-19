"""The calculation behind the Phase 6 simulations (rules against learning, the project loop, splits and leakage,
cleaning, scaling, label noise, an LLM call, an agent chain, patches, prompt injection, test-set size, fairness), in
plain Python (no packages). The page does the same calculation in JavaScript (public/assets/sims/fnd.js);
scripts/check-sims.mjs checks that the two agree.

Run:  python apps.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim-supervised"))
from algorithms import lcg, make_data, fit_knn, accuracy  # noqa: E402


def gauss(r):
    return (r() + r() + r() - 1.5) * 2


# ---- rules against learning ----
SPAM_TRAIN = ["win a free prize now", "free money click now", "urgent claim your prize", "cheap pills free offer", "win cash urgent reply", "free gift card click", "claim free reward today", "urgent offer win now"]
HAM_TRAIN = ["meeting moved to noon", "lunch tomorrow with team", "please review the report", "call me after the meeting", "notes from the workshop", "can you send the file", "dinner at seven tonight", "project update attached"]
SPAM_TEST = ["fr33 prize waiting for you", "you won a reward claim today", "limited cash offer inside", "act now to receive money"]
HAM_TEST = ["free for lunch tomorrow", "urgent meeting at noon", "the prize committee agenda", "can we meet and win the client"]
KEYWORDS = ["free", "win", "prize", "urgent", "click", "now", "cash", "offer"]


def rule_accuracy(words, spam, ham):
    hit = sum(1 for m in spam if any(w in m.split() for w in words)) + sum(1 for m in ham if not any(w in m.split() for w in words))
    return hit / (len(spam) + len(ham))


def nb_model():
    vocab = sorted(set(w for m in SPAM_TRAIN + HAM_TRAIN for w in m.split()))
    p = {}
    for cls, msgs in ((1, SPAM_TRAIN), (0, HAM_TRAIN)):
        p[cls] = {w: (sum(1 for m in msgs if w in m.split()) + 1) / (len(msgs) + 2) for w in vocab}
    return vocab, p


def nb_is_spam(model, msg):
    vocab, p = model
    ws = msg.split()
    score = {}
    for cls in (1, 0):
        s = math.log(0.5)
        for w in vocab:
            s += math.log(p[cls][w] if w in ws else 1 - p[cls][w])
        score[cls] = s
    return score[1] > score[0]


def nb_accuracy(model, spam, ham):
    return (sum(1 for m in spam if nb_is_spam(model, m)) + sum(1 for m in ham if not nb_is_spam(model, m))) / (len(spam) + len(ham))


# ---- the project loop ----
STAGES = ["Frame", "Data", "Prepare", "Model", "Evaluate", "Deploy", "Monitor"]
FAULTS = [("Labels are wrong", 4, 1), ("Wrong success measure", 6, 0), ("Test data leaked into training", 6, 2), ("The world changed", 6, 1), ("A feature is not available when predicting", 5, 2)]


# ---- splits and leakage ----
def split_data():
    r = lcg(41)
    y = [20 + 0.5 * t + 5 * math.sin(2 * math.pi * t / 7) + 2 * gauss(r) for t in range(60)]
    leak = [v + 0.2 * gauss(r) for v in y]
    return y, leak


def shuffled(n, seed):
    r = lcg(seed)
    idx = list(range(n))
    for i in range(n - 1, 0, -1):
        j = int(r() * (i + 1))
        idx[i], idx[j] = idx[j], idx[i]
    return idx


def split_mae(mode, feature):
    y, leak = split_data()
    feat = list(range(60)) if feature == "day" else leak
    if mode == "random":
        idx = shuffled(60, 5)
        test = sorted(idx[:15])
    else:
        test = list(range(45, 60))
    train = [i for i in range(60) if i not in test]
    err = 0.0
    for i in test:
        nearest = min(train, key=lambda j: (abs(feat[j] - feat[i]), j))
        err += abs(y[nearest] - y[i])
    return err / len(test)


# ---- cleaning ----
INCOME = [32, 35, 31, None, 34, 36, 33, 37, 35, None, 36, 32, 120, 35, 33, 31, 38, 34, 36, 35]


def clean_stats(method):
    present = [v for v in INCOME if v is not None]
    s = sorted(present)
    med = (s[len(s) // 2 - 1] + s[len(s) // 2]) / 2 if len(s) % 2 == 0 else s[len(s) // 2]
    mean = sum(present) / len(present)
    if method == "drop":
        vals = present
    else:
        fill = {"mean": mean, "median": med, "zero": 0}[method]
        vals = [fill if v is None else v for v in INCOME]
    m = sum(vals) / len(vals)
    ss = sorted(vals)
    md = (ss[len(ss) // 2 - 1] + ss[len(ss) // 2]) / 2 if len(ss) % 2 == 0 else ss[len(ss) // 2]
    sd = math.sqrt(sum((v - m) ** 2 for v in vals) / len(vals))
    return len(vals), m, md, sd


# ---- scaling and encoding ----
PEOPLE = [(25, 30000), (30, 32000), (45, 90000), (50, 95000), (28, 60000), (52, 31000), (35, 62000), (40, 88000)]


def nearest_person(target, scale):
    cols = list(zip(*PEOPLE))
    mean = [sum(c) / len(c) for c in cols]
    sd = [math.sqrt(sum((v - m) ** 2 for v in c) / len(c)) for c, m in zip(cols, mean)]

    def z(p):
        return [(p[0] - mean[0]) / sd[0], (p[1] - mean[1]) / sd[1]] if scale else [p[0], p[1]]
    zt = z(target)
    d = [math.sqrt((z(p)[0] - zt[0]) ** 2 + (z(p)[1] - zt[1]) ** 2) for p in PEOPLE]
    i = min(range(len(PEOPLE)), key=lambda k: (d[k], k))
    return i, d[i]


# ---- label noise ----
def noisy_accuracy(noise):
    X, y = make_data("blobs", 100, 3)
    tx, ty = make_data("blobs", 60, 17)
    r = lcg(77)
    y2 = [1 - c if r() < noise else c for c in y]
    return accuracy(fit_knn(X, y2, 1), tx, ty)


def agreement(p, seed):
    r = lcg(seed)
    same = 0
    for _ in range(200):
        a = r() < p
        b = r() < p
        same += 1 if a == b else 0
    return same / 200


# ---- an LLM call with retries ----
def api_calls(fail, retries=3, calls=20, seed=9):
    r = lcg(seed)
    ok_calls = attempts = wait = 0
    for _ in range(calls):
        a, ok = 0, False
        while a <= retries:
            a += 1
            if r() >= fail:
                ok = True
                break
            wait += 2 ** (a - 1)
        attempts += a
        ok_calls += 1 if ok else 0
    cost = ok_calls * (500 * 3 + 300 * 15) / 1e6
    return ok_calls, attempts, wait, cost


# ---- an agent chain ----
def agent_success(p, n, check, runs=500, seed=5):
    r = lcg(seed)
    wins = 0
    for _ in range(runs):
        good = True
        for _ in range(n):
            ok = r() < p
            if not ok and check > 0 and r() < check:
                ok = r() < p
            if not ok:
                good = False
        wins += 1 if good else 0
    return wins / runs


# ---- patches ----
SQUARE = [[1 if 2 <= r <= 5 and 2 <= c <= 5 else 0 for c in range(8)] for r in range(8)]


def patches(size):
    n = 8 // size
    return [[sum(SQUARE[i * size + a][j * size + b] for a in range(size) for b in range(size)) / (size * size) for j in range(n)] for i in range(n)]


# ---- prompt injection ----
ATTACKS = ["override", "hidden", "exfil"]
STOPS = {"sep": {"override", "hidden"}, "approve": {"hidden", "exfil"}, "least": {"exfil"}}


def injection(guards):
    return {a: not any(a in STOPS[g] for g in guards) for a in ATTACKS}


# ---- test-set size ----
def margin(p, n):
    return 1.96 * math.sqrt(p * (1 - p) / n)


def sample_rates(n, true=0.8, draws=10, seed=5):
    r = lcg(seed)
    return [sum(1 for _ in range(n) if r() < true) / n for _ in range(draws)]


# ---- fairness ----
def groups():
    out = []
    for mu, seed in ((1.0, 51), (0.6, 52)):
        r = lcg(seed)
        out.append([(i % 2, (i % 2) * mu + 0.6 * gauss(r)) for i in range(200)])
    return out


def fair_metrics(g, thr):
    tp = sum(1 for y, s in g if y == 1 and s >= thr)
    pos = sum(1 for y, s in g if y == 1)
    sel = sum(1 for y, s in g if s >= thr)
    ok = sum(1 for y, s in g if (s >= thr) == (y == 1))
    return sel / len(g), tp / pos, ok / len(g)


if __name__ == "__main__":
    for words in (["free", "win", "prize", "urgent"], KEYWORDS):
        print("rules %s: train %.3f, new messages %.3f" % ("+".join(words), rule_accuracy(words, SPAM_TRAIN, HAM_TRAIN), rule_accuracy(words, SPAM_TEST, HAM_TEST)))
    m = nb_model()
    print("learned word weights: train %.3f, new messages %.3f" % (nb_accuracy(m, SPAM_TRAIN, HAM_TRAIN), nb_accuracy(m, SPAM_TEST, HAM_TEST)))
    print("project loop, stages repeated: " + "; ".join("%s -> %d" % (f, d - fx + 1) for f, d, fx in FAULTS))
    for mode in ("random", "time"):
        print("split %s: error with the day number %.2f, with a leaked column %.2f" % (mode, split_mae(mode, "day"), split_mae(mode, "leak")))
    for meth in ("drop", "mean", "median", "zero"):
        n, mean, med, sd = clean_stats(meth)
        print("fill %s: %d values, mean %.2f, median %.2f, spread %.2f" % (meth, n, mean, med, sd))
    for sc in (False, True):
        i, d = nearest_person((48, 60000), sc)
        print("nearest person to age 48, income 60000, %s: person %d, distance %.3f" % ("scaled" if sc else "unscaled", i + 1, d))
    print("accuracy with noisy labels: " + " ".join("%.2f:%.3f" % (n, noisy_accuracy(n)) for n in (0, 0.1, 0.3, 0.45)))
    print("two annotators agree, each wrong 10%% / 30%%: %.3f %.3f" % (agreement(0.1, 11), agreement(0.3, 12)))
    for fail in (0.0, 0.3, 0.6):
        ok, att, wait, cost = api_calls(fail)
        print("20 calls, failure rate %.1f, up to 3 retries: %d succeeded, %d attempts, %d seconds waiting, cost of successful calls %.4f" % (fail, ok, att, wait, cost))
    print("agent success: 5 steps %.3f, 10 steps %.3f, 10 steps with checks %.3f" % (agent_success(0.9, 5, 0), agent_success(0.9, 10, 0), agent_success(0.9, 10, 0.8)))
    print("patches of 1, 2, 4, 8 pixels give 64, 16, 4, 1 tokens; first patch strengths " + " ".join("%.2f" % patches(s)[0][0] for s in (2, 4, 8)))
    for guards in ([], ["sep"], ["sep", "approve"], ["sep", "approve", "least"]):
        print("attacks that work with guards %s: %s" % ("+".join(guards) or "none", " ".join(a for a, v in injection(guards).items() if v) or "none"))
    print("margin of error at 80%%: 20 cases %.3f, 100 cases %.3f, 500 cases %.3f" % (margin(0.8, 20), margin(0.8, 100), margin(0.8, 500)))
    for n in (20, 100, 500):
        s = sample_rates(n)
        print("10 test sets of %d cases, observed pass rate from %.2f to %.2f" % (n, min(s), max(s)))
    a, b = groups()
    for ta, tb in ((0.5, 0.5), (0.5, 0.15)):
        ma, mb = fair_metrics(a, ta), fair_metrics(b, tb)
        print("thresholds %.2f and %.2f: selected %.3f / %.3f, caught %.3f / %.3f, correct %.3f / %.3f" % (ta, tb, ma[0], mb[0], ma[1], mb[1], ma[2], mb[2]))
