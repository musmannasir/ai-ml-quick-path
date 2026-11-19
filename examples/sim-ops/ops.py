"""The calculation behind the Phase 7 simulations (data checks, a safe release, drift alerts, serving and scaling,
a production request, and two ways to score a language model), in plain Python (no packages). The page does the same
calculation in JavaScript (public/assets/sims/ops.js); scripts/check-sims.mjs checks that the two agree.

Run:  python ops.py
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "sim-supervised"))
sys.path.insert(0, os.path.join(HERE, "..", "sim-llm"))
from algorithms import lcg  # noqa: E402
from llm import holdout_loss, train_len  # noqa: E402


def gauss(r):
    return (r() + r() + r() - 1.5) * 2


# ---- data checks ----
ROWS = [(34, "a@x.com", "UK"), (-3, "b@x.com", "UK"), (29, "c.x.com", "US"), (41, "d@x.com", "XX"), (250, "e@x.com", "DE"),
        (None, "f@x.com", "US"), (52, "g@x.com", "DE"), (38, "", "UK"), (27, "i@x.com", "US"), (45, "j@x.com", "FR")]
CHECKS = ["schema", "age_present", "age_range", "email", "country"]


def validate(enabled, renamed):
    """Returns (rows passing, failures per check, whether the pipeline stopped)."""
    if renamed and "schema" in enabled:
        return 0, {"schema": 10}, True
    fails = {c: 0 for c in enabled if c != "schema"}
    passing = 0
    for age, email, country in ROWS:
        a = None if renamed else age
        bad = False
        if "age_present" in enabled and a is None:
            fails["age_present"] += 1
            bad = True
        if "age_range" in enabled and (a is None or not 0 <= a <= 120):
            fails["age_range"] += 1
            bad = True
        if "email" in enabled and "@" not in email:
            fails["email"] += 1
            bad = True
        if "country" in enabled and country not in ("UK", "US", "DE", "FR"):
            fails["country"] += 1
            bad = True
        passing += 0 if bad else 1
    return passing, fails, False


# ---- a safe release ----
SCENARIOS = {"same": (0.05, 0.05), "slight": (0.05, 0.08), "bad": (0.05, 0.15)}


def release(scenario, share, thr):
    old, new = SCENARIOS[scenario]
    r = lcg(13)
    cn = kn = ce = ke = 0
    for _ in range(2000):
        canary = r() < share
        err = r() < (new if canary else old)
        if canary:
            cn += 1
            ce += 1 if err else 0
        else:
            kn += 1
            ke += 1 if err else 0
    rc, rk = ce / max(1, cn), ke / max(1, kn)
    decision = "wait" if cn < 30 else ("roll back" if rc - rk > thr / 100 else "promote")
    return cn, ce, rc, rk, decision


# ---- drift alerts ----
def drift(shift, window, thr):
    r = lcg(21)
    x = [50 + 5 * gauss(r) + (shift if t >= 60 else 0) for t in range(100)]
    base = sum(x[:40]) / 40
    sd = math.sqrt(sum((v - base) ** 2 for v in x[:40]) / 40)
    alerts = []
    for t in range(40, 100):
        m = sum(x[t - window + 1:t + 1]) / window
        if abs((m - base) / (sd / math.sqrt(window))) > thr:
            alerts.append(t)
    false = sum(1 for t in alerts if t < 60)
    first = next((t for t in alerts if t >= 60), None)
    return false, (None if first is None else first - 60)


# ---- serving and scaling ----
def serve(lam, servers, batch, autoscale, seed=17):
    r = lcg(seed)
    t, arr = 0.0, []
    while True:
        t += -math.log(1 - r()) / lam
        if t >= 200:
            break
        arr.append(t)
    queue, busy, n, nxt, lat, sec = [], [0.0] * 6, servers, 0, [], 0.0
    for k in range(2000):
        T = k * 0.1
        while nxt < len(arr) and arr[nxt] <= T:
            queue.append(arr[nxt])
            nxt += 1
        if autoscale and k % 10 == 0:
            if len(queue) > 5 * n:
                n = min(6, n + 1)
            elif not queue and n > 1 and busy[n - 1] <= T:
                n -= 1
        for s in range(n):
            if busy[s] <= T and queue:
                take, queue = queue[:batch], queue[batch:]
                fin = T + 0.2 + 0.05 * len(take)
                busy[s] = fin
                lat.extend(fin - a for a in take)
        sec += n * 0.1
    lat.sort()
    p50 = lat[int(0.5 * (len(lat) - 1))] if lat else 0.0
    p95 = lat[int(0.95 * (len(lat) - 1))] if lat else 0.0
    return len(lat), p50, p95, len(queue), sec / 200 * 2


# ---- a production request ----
PARTS = ["Client", "Gateway", "Sign-in check", "Cache", "Model server", "Vector store", "Logging"]
EFFECT = {"Client": ("failed", "Nothing reaches the system; the person sees an error in the app."),
          "Gateway": ("failed", "Requests cannot enter, so every request fails."),
          "Sign-in check": ("failed", "The system refuses requests it cannot check. It fails safe, not open."),
          "Cache": ("degraded", "Every request goes to the model, so answers are slower and cost more, but they still work."),
          "Model server": ("failed", "There is nothing to compute the answer, so requests fail unless a fallback exists."),
          "Vector store": ("degraded", "The model answers without the documents it should have used, so answers may be wrong or vague."),
          "Logging": ("degraded", "Users see no change, but nobody can see errors or costs, so problems go unnoticed.")}


# ---- two ways to score a language model ----
ANSWERS = [("Paris", "Paris"), ("The capital is Paris.", "Paris"), ("paris, France", "Paris"), ("Lyon", "Paris")]


def norm(s):
    return " ".join(s.lower().replace(".", " ").replace(",", " ").split())


def score(kind, ans, gold):
    a, g = norm(ans), norm(gold)
    if kind == "exact":
        return 1.0 if ans == gold else 0.0
    if kind == "normalised":
        return 1.0 if a == g else 0.0
    if kind == "contains":
        return 1.0 if g in a else 0.0
    at, gt = a.split(), g.split()
    ov = sum(min(at.count(w), gt.count(w)) for w in set(gt))
    if ov == 0:
        return 0.0
    p, rc = ov / len(at), ov / len(gt)
    return 2 * p * rc / (p + rc)


if __name__ == "__main__":
    for en, ren in ((CHECKS[1:], False), (["email", "country"], False), (["schema"] + CHECKS[1:], True), (["email", "country"], True)):
        p, f, stop = validate(en, ren)
        print("checks %s, column renamed %s: %d of 10 rows pass, failures %s%s" % ("+".join(en), "yes" if ren else "no", p, " ".join("%s:%d" % kv for kv in f.items()), ", pipeline stopped" if stop else ""))
    for sc, share, thr in (("same", 0.05, 3), ("slight", 0.05, 2), ("bad", 0.05, 3), ("bad", 0.01, 3), ("slight", 0.05, 4)):
        cn, ce, rc, rk, dec = release(sc, share, thr)
        print("release %s, %d%% canary, roll back above %d points: canary %d requests with %d wrong (%.3f), others %.3f, decision %s" % (sc, round(share * 100), thr, cn, ce, rc, rk, dec))
    for shift, w, thr in ((5, 7, 3), (5, 3, 2), (2, 14, 3), (0, 3, 2)):
        print("drift, shift %d, window %d, alert above %d: false alarms %d, days to alert %s" % (shift, w, thr, *((lambda r: (r[0], "none" if r[1] is None else r[1]))(drift(shift, w, thr)))))
    for lam, s, b, a in ((6, 1, 1, False), (6, 1, 4, False), (6, 2, 1, False), (12, 1, 4, True), (8, 1, 4, False)):
        served, p50, p95, q, cost = serve(lam, s, b, a)
        print("serving, %d requests a second, %d server(s), batch %d, autoscaling %s: served %d, median %.2f s, slowest 5%% over %.2f s, waiting at end %d, cost per hour $%.2f" % (lam, s, b, "on" if a else "off", served, p50, p95, q, cost))
    for part in PARTS:
        print("if %s breaks: %s" % (part, EFFECT[part][0]))
    print("perplexity after reading 10, 60 and %d words: " % train_len() + " ".join("%.2f" % math.exp(holdout_loss(n)) for n in (10, 60, train_len())))
    for kind in ("exact", "normalised", "contains", "f1"):
        print("scoring by %s: %s" % (kind, " ".join("%.2f" % score(kind, a, g) for a, g in ANSWERS)))
