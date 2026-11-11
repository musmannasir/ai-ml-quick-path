"""Quick Path demonstrations: one small, runnable example per idea.

Runtime prerequisites: Python 3.10+, NumPy, pandas, scikit-learn (joblib comes with it).
Run:  python quickpath.py [demo|all]
Demos: env rules_vs_ml lifecycle data anomaly pca bpe bigram sampling llm_size lora
       chunking hybrid pii fairness cache
All data is synthetic or written for this guide. Seeds are fixed so output repeats.
"""
import collections
import math
import os
import platform
import re
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent


def env():
    import sklearn
    print(f"Python {platform.python_version()} on {platform.system()} | CPU cores: {os.cpu_count()}")
    print(f"numpy {np.__version__} | pandas {pd.__version__} | scikit-learn {sklearn.__version__}")
    try:
        import torch
        print(f"PyTorch {torch.__version__} | GPU available: {torch.cuda.is_available()}")
    except ImportError:
        print("PyTorch not installed (needed only for deep-learning lessons)")


SPAM = [
    ("WIN a free phone now, click this link", 1), ("Your account is locked, send your password", 1),
    ("Claim your cash prize today, limited offer", 1), ("Cheap loans approved instantly", 1),
    ("You have been selected for a holiday, reply YES", 1), ("Urgent: verify your bank details now", 1),
    ("Congratulations, you won a gift card", 1), ("Earn money from home, sign up bonus", 1),
    ("Exclusive deal: trial ends tonight, act now", 1), ("Final notice: your reward expires today", 1),
    ("Is the meeting room free at 3 pm?", 0), ("Please review the sprint notes", 0),
    ("Can you send me the report by Friday?", 0), ("Thanks for your help yesterday", 0),
    ("The build failed, can you take a look", 0), ("Team meeting moved to 3 pm", 0),
    ("Happy birthday, have a great day", 0), ("I pushed the fix, tests pass now", 0),
    ("Could we move the review to Monday?", 0), ("Feel free to call me after lunch", 0),
    ("The invoice is in the shared folder", 0), ("Let me know when the client confirms", 0),
    ("Your parcel was delivered to reception", 0), ("Lunch menu for the offsite is attached", 0),
]


def make_messages(n=240, seed=0):
    """Synthetic messages built from templates: spam and normal mail share some words (like 'free')."""
    rng = np.random.default_rng(seed)
    spam_parts = (["claim", "win", "urgent", "verify", "exclusive", "final notice"], ["your prize", "a gift card", "your account", "cash reward", "a free trial"],
                  ["now", "today", "before midnight", "click the link", "reply YES"])
    ham_parts = (["please review", "can we discuss", "reminder about", "thanks for", "is the room free for"], ["the sprint notes", "the invoice", "the client call", "the design review", "lunch"],
                 ["on Monday", "this afternoon", "before standup", "when you are free", "at 3 pm"])
    msgs = []
    for i in range(n):
        parts, label = (spam_parts, 1) if i % 2 == 0 else (ham_parts, 0)
        msgs.append((" ".join(rng.choice(p) for p in parts), label))
    return msgs


def rules_vs_ml():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import make_pipeline
    msgs = make_messages()
    texts, y = [t for t, _ in msgs], np.array([l for _, l in msgs])
    x_tr, x_te, y_tr, y_te = train_test_split(texts, y, test_size=0.5, stratify=y, random_state=0)
    rule = np.array([1 if "free" in t else 0 for t in x_te])                      # hand-written rule
    model = make_pipeline(TfidfVectorizer(), LogisticRegression()).fit(x_tr, y_tr)  # learned from 120 examples
    learned = model.predict(x_te)
    for name, pred in [("rule: contains 'free'", rule), ("learned model", learned)]:
        print(f"{name:<22} accuracy {np.mean(pred == y_te):.2f}  spam caught {int(((pred == 1) & (y_te == 1)).sum())}/{int(y_te.sum())}  "
              f"false alarms {int(((pred == 1) & (y_te == 0)).sum())}")
    print("example message:", repr(x_te[0]), "-> spam" if learned[0] else "-> not spam")


def lifecycle():
    import joblib
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, recall_score
    from sklearn.model_selection import train_test_split
    rng = np.random.default_rng(0)
    n = 2000
    df = pd.DataFrame({"tenure_months": rng.integers(1, 72, n), "tickets_last_month": rng.poisson(1.5, n),
                       "monthly_fee": rng.choice([10, 20, 40], n)})
    risk = -1.5 - 0.05 * df.tenure_months + 0.7 * df.tickets_last_month + 0.02 * df.monthly_fee
    df["churned"] = (rng.random(n) < 1 / (1 + np.exp(-risk))).astype(int)                 # 1. data
    X, y = df.drop(columns="churned"), df.churned
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)   # 2. split
    model = RandomForestClassifier(n_estimators=200, min_samples_leaf=20, random_state=0).fit(X_tr, y_tr)  # 3. train
    pred = model.predict(X_te)                                                               # 4. evaluate
    print(f"churn rate {y.mean():.1%} | baseline accuracy (always 'stays') {1 - y_te.mean():.3f}")
    print(f"model accuracy {accuracy_score(y_te, pred):.3f} | recall on churners {recall_score(y_te, pred):.3f}")
    path = Path(tempfile.gettempdir()) / "churn_model.joblib"
    joblib.dump(model, path)                                                                 # 5. save
    loaded = joblib.load(path)                                                               # 6. load and predict
    customer = pd.DataFrame([{"tenure_months": 3, "tickets_last_month": 4, "monthly_fee": 40}])
    print(f"saved {path.stat().st_size // 1024} KB | new customer churn probability {loaded.predict_proba(customer)[0, 1]:.2f}")


def data():
    df = pd.DataFrame({
        "size_m2": [52, 75, 110, 64, None, 95],
        "rooms": [2, 3, 4, 2, 3, 4],
        "city": ["Lisbon", "Porto", "Lisbon", "Braga", "Porto", "Lisbon"],
        "listed_on": pd.to_datetime(["2026-01-10", "2026-02-03", "2026-02-20", "2026-03-01", "2026-03-15", "2026-04-02"]),
        "price_k": [210, 245, 430, 150, 260, 390],            # the label we want to predict
    })
    print(df.dtypes.to_string())
    print(f"shape {df.shape} | missing values per column: {df.isna().sum().to_dict()}")
    print(f"features: {[c for c in df.columns if c != 'price_k']} | label: price_k")


def anomaly():
    from sklearn.ensemble import IsolationForest
    rng = np.random.default_rng(1)
    normal = np.column_stack([rng.normal(60, 20, 980), rng.normal(14, 3, 980)])     # amount, hour of day
    odd = np.column_stack([rng.normal(180, 60, 20), rng.normal(4, 2, 20)])          # larger amounts, at night
    X = np.vstack([normal, odd]); truth = np.r_[np.zeros(980), np.ones(20)]
    flags = IsolationForest(contamination=0.02, random_state=1).fit_predict(X) == -1
    print(f"flagged {flags.sum()} of {len(X)} | real anomalies caught {int((flags & (truth == 1)).sum())}/20 | "
          f"normal flagged by mistake {int((flags & (truth == 0)).sum())}")


def pca():
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(2)
    size = rng.normal(0, 1, 500); usage = rng.normal(0, 1, 500)
    cols = [size + rng.normal(0, .2, 500) for _ in range(5)] + [usage + rng.normal(0, .2, 500) for _ in range(5)]
    X = StandardScaler().fit_transform(np.column_stack(cols))      # 10 measurements driven by 2 hidden factors
    ratios = PCA().fit(X).explained_variance_ratio_
    print(f"10 columns -> variance explained by first components: {np.round(ratios[:4], 3).tolist()}")
    print(f"2 components keep {ratios[:2].sum():.1%} of the information")


def bpe():
    words = collections.Counter("low low low lower lower newest newest newest widest".split())
    vocab = {tuple(w) + ("_",): c for w, c in words.items()}
    for step in range(1, 6):
        pairs = collections.Counter()
        for sym, c in vocab.items():
            for a, b in zip(sym, sym[1:]):
                pairs[(a, b)] += c
        best = max(pairs, key=pairs.get)
        merged = {}
        for sym, c in vocab.items():
            out, i = [], 0
            while i < len(sym):
                if i < len(sym) - 1 and (sym[i], sym[i + 1]) == best:
                    out.append(sym[i] + sym[i + 1]); i += 2
                else:
                    out.append(sym[i]); i += 1
            merged[tuple(out)] = c
        vocab = merged
        print(f"merge {step}: {best[0]!r}+{best[1]!r} (seen {pairs[best]} times)")
    print("tokens now:", {"".join(k).rstrip("_"): list(k) for k in vocab})


def bigram():
    text = ("the support team answers the ticket . the team closes the ticket . "
            "the customer thanks the team . the customer opens a ticket .").split()
    counts = collections.defaultdict(collections.Counter)
    for a, b in zip(text, text[1:]):
        counts[a][b] += 1
    probs = {w: {n: round(c / sum(cs.values()), 2) for n, c in cs.items()} for w, cs in counts.items()}
    print("P(next | 'the') =", probs["the"])
    word, out = "the", ["the"]
    for _ in range(6):
        word = counts[word].most_common(1)[0][0]; out.append(word)
    print("greedy generation:", " ".join(out))


def sampling():
    words = ["refund", "replacement", "discount", "apology", "banana"]
    logits = np.array([3.0, 2.5, 1.5, 1.0, -2.0])
    for t in (0.2, 1.0, 2.0):
        p = np.exp(logits / t); p /= p.sum()
        print(f"temperature {t}: " + ", ".join(f"{w} {q:.2f}" for w, q in zip(words, p)))
    p = np.exp(logits); p /= p.sum(); order = np.argsort(-p)
    keep = order[: int(np.searchsorted(np.cumsum(p[order]), 0.9) + 1)]
    print(f"top-p 0.9 keeps: {[words[i] for i in keep]}")


def llm_size():
    def params(vocab, d, layers, ctx):
        return vocab * d + ctx * d + layers * 12 * d * d          # embeddings + positions + blocks (approx.)
    for name, cfg in [("laptop tiny", (8_000, 256, 6, 256)), ("small", (32_000, 768, 12, 1024)), ("medium", (50_000, 2048, 24, 4096))]:
        p = params(*cfg)
        print(f"{name:<12} vocab {cfg[0]:>6} width {cfg[1]:>4} layers {cfg[2]:>2} context {cfg[3]:>4} -> "
              f"{p / 1e6:8.1f} M parameters | weights bf16 {p * 2 / 1e9:6.2f} GB | full training state ~{p * 16 / 1e9:6.1f} GB")


def lora():
    d = 4096
    full = d * d
    for r in (8, 16, 64):
        print(f"rank {r:>2}: one {d}x{d} matrix trains {2 * d * r:,} numbers instead of {full:,} ({2 * d * r / full:.2%})")
    layers, targets = 32, 2   # e.g. query and value projections in each of 32 layers
    print(f"rank 16 on 2 matrices x 32 layers: {layers * targets * 2 * d * 16 / 1e6:.1f} M trainable parameters")


POLICY = """Annual leave. Full-time employees receive 25 days of paid annual leave per year. Part-time employees receive leave in proportion to their hours.

Carry over. Up to 5 unused days can be carried into the next year. Carried days expire on 31 March.

Requesting leave. Submit requests in the HR portal at least 10 working days ahead. Managers reply within 3 working days.

Sick leave. Sick leave is separate from annual leave. Tell your manager on the first day of absence."""


def chunking():
    words = POLICY.split()
    fixed = [" ".join(words[i:i + 25]) for i in range(0, len(words), 25)]
    paras = [p.strip() for p in POLICY.split("\n\n")]
    print(f"{len(words)} words | fixed 25-word chunks: {len(fixed)} | example cut: ...{fixed[0][-40:]!r}")
    print(f"paragraph chunks: {len(paras)} | each starts with a heading: {[p.split('.')[0] for p in paras]}")
    overlap = [" ".join(words[i:i + 25]) for i in range(0, len(words), 15)]
    print(f"25-word chunks with 10-word overlap: {len(overlap)}")


DOCS = {
    "kb1": "Pump PX-7 shows error E-4021 when the inlet valve is blocked. Clean the valve and restart.",
    "kb2": "General pump maintenance: check pressure weekly and replace seals every year.",
    "kb3": "Error E-5100 on compressor CX-2 means overheating. Let it cool before restarting.",
    "kb4": "If a pump will not start, check the power supply and the inlet valve.",
}


def hybrid():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    ids, texts = list(DOCS), list(DOCS.values())
    tok = lambda s: re.findall(r"[a-z0-9-]+", s.lower())
    docs_tok = [tok(t) for t in texts]; avg = np.mean([len(d) for d in docs_tok]); N = len(texts)
    def bm25(q, k1=1.5, b=0.75):
        scores = []
        for d in docs_tok:
            s = 0.0
            for term in tok(q):
                n = sum(term in x for x in docs_tok)
                if n == 0: continue
                idf = math.log(1 + (N - n + .5) / (n + .5)); f = d.count(term)
                s += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * len(d) / avg))
            scores.append(s)
        return np.array(scores)
    vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 4)).fit(texts)    # stand-in for an embedding model
    rank = lambda sc: [ids[i] for i in np.argsort(-sc, kind="stable")]
    for q in ["E-4021", "pump won't power up"]:
        sem = cosine_similarity(vec.transform([q]), vec.transform(texts))[0]; kw = bm25(q)
        rrf = collections.Counter()
        for r in (rank(kw), rank(sem)):
            for pos, d in enumerate(r, 1):
                rrf[d] += 1 / (60 + pos)
        print(f"query {q!r}: keyword {rank(kw)} | vector {rank(sem)} | fused (RRF) {[d for d, _ in rrf.most_common()]}")


def pii():
    text = "Hi, I'm Dana (dana.r@example.com, +44 7700 900123). Card 4111 1111 1111 1111 was charged twice."
    rules = [(r"[\w.+-]+@[\w-]+\.[\w.]+", "[EMAIL]"), (r"\+?\d[\d ]{8,}\d", "[PHONE]"), (r"\b(?:\d{4} ){3}\d{4}\b", "[CARD]")]
    out = text
    for pattern, tag in [rules[2], rules[0], rules[1]]:      # cards first so they are not mistaken for phones
        out = re.sub(pattern, tag, out)
    print("before:", text); print("after: ", out)


def fairness():
    rng = np.random.default_rng(3)
    group = rng.choice(["A", "B"], 4000, p=[0.7, 0.3])
    qualified = rng.random(4000) < np.where(group == "A", 0.5, 0.5)       # same true rate in both groups
    score = qualified * 0.6 + rng.normal(0.2, 0.2, 4000) - (group == "B") * 0.15   # a biased score
    approved = score > 0.5
    df = pd.DataFrame({"group": group, "qualified": qualified, "approved": approved})
    rates = df.groupby("group")["approved"].mean(); tpr = df[df.qualified].groupby("group")["approved"].mean()
    print(f"approval rate A {rates['A']:.3f}  B {rates['B']:.3f}  -> demographic parity difference {rates['A'] - rates['B']:.3f}")
    print(f"approval rate among qualified A {tpr['A']:.3f}  B {tpr['B']:.3f}  -> equal opportunity difference {tpr['A'] - tpr['B']:.3f}")


def cache():
    rng = np.random.default_rng(4)
    faq = [f"question {i}" for i in range(40)]
    weights = 1 / np.arange(1, 41); weights /= weights.sum()          # a few questions are very common
    stream = rng.choice(faq, 5000, p=weights)
    seen, hits = set(), 0
    for q in stream:
        hits += q in seen; seen.add(q)
    cost_per_call = 0.002
    print(f"5000 requests, {len(seen)} distinct | cache hits {hits} ({hits / 5000:.1%}) | "
          f"model calls {5000 - hits} | cost {5000 * cost_per_call:.2f} -> {(5000 - hits) * cost_per_call:.2f} (illustrative price)")


def _churn_model():
    from sklearn.linear_model import LogisticRegression
    rng = np.random.default_rng(7)
    X = np.column_stack([rng.integers(1, 72, 2000), rng.uniform(10, 120, 2000), rng.integers(0, 8, 2000)])
    y = (0.04 * X[:, 2] - 0.03 * X[:, 0] + 0.01 * X[:, 1] + rng.normal(0, 0.6, 2000) > 0.2).astype(int)
    return LogisticRegression(max_iter=1000).fit(X, y), X, y


def serving():
    """A real HTTP model server using only the standard library (stands in for FastAPI or ASP.NET Core)."""
    import json, threading, time, urllib.request
    from http.server import BaseHTTPRequestHandler, HTTPServer
    model, _, _ = _churn_model()                               # loaded ONCE at startup, not per request
    VERSION = "churn-logreg-v3"

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def do_GET(self):
            if self.path != "/health": return self._send(404, {"error": "not found"})
            self._send(200, {"status": "ok", "model_version": VERSION})
        def do_POST(self):
            if self.path != "/predict": return self._send(404, {"error": "not found"})
            try:
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                row = [[float(body["tenure_months"]), float(body["monthly_charge"]), float(body["support_calls"])]]
            except (KeyError, ValueError, TypeError):
                return self._send(400, {"error": "need tenure_months, monthly_charge, support_calls as numbers"})
            p = float(model.predict_proba(row)[0, 1])
            self._send(200, {"churn_probability": round(p, 3), "model_version": VERSION})
        def _send(self, code, obj):
            data = json.dumps(obj).encode()
            self.send_response(code); self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)

    server = HTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()

    def call(method, path, payload=None):
        req = urllib.request.Request(f"http://127.0.0.1:{port}{path}", method=method,
                                     data=None if payload is None else json.dumps(payload).encode(),
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e: return e.code, json.loads(e.read())

    print("GET  /health  ->", *call("GET", "/health"))
    print("POST /predict ->", *call("POST", "/predict", {"tenure_months": 3, "monthly_charge": 95, "support_calls": 6}))
    print("POST /predict ->", *call("POST", "/predict", {"tenure_months": "three"}))
    times = []
    for _ in range(200):
        t = time.perf_counter(); call("POST", "/predict", {"tenure_months": 24, "monthly_charge": 60, "support_calls": 1})
        times.append((time.perf_counter() - t) * 1000)
    print(f"200 requests on this machine: p50 {np.percentile(times, 50):.1f} ms  p95 {np.percentile(times, 95):.1f} ms")
    server.shutdown()


def registry():
    """A tiny model registry: every candidate is stored with its data hash and metrics; a gate decides promotion."""
    import hashlib, json
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.metrics import roc_auc_score
    from sklearn.model_selection import train_test_split
    _, X, y = _churn_model()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
    data_hash = hashlib.sha256(Xtr.tobytes()).hexdigest()[:12]
    from sklearn.linear_model import LogisticRegression
    candidates = {"v3 logistic regression": LogisticRegression(max_iter=1000),
                  "v4 gradient boosting": GradientBoostingClassifier(random_state=0),
                  "v5 gradient boosting, 2 trees": GradientBoostingClassifier(n_estimators=2, random_state=0)}
    registry, champion = [], None
    for name, m in candidates.items():
        auc = roc_auc_score(yte, m.fit(Xtr, ytr).predict_proba(Xte)[:, 1])
        entry = {"model": name, "data_sha256": data_hash, "test_auc": round(auc, 3)}
        gate = champion is None or auc >= champion["test_auc"] + 0.005    # must beat the champion by a margin
        entry["decision"] = "promote" if gate else "reject (not better than champion)"
        if gate: champion = entry
        registry.append(entry)
    for e in registry: print(json.dumps(e))
    print("champion:", champion["model"])


def batching():
    """Why servers batch: one call per row versus one call for many rows (timings are for this machine only)."""
    import time
    model, X, _ = _churn_model()
    rows = X[:2000]
    t = time.perf_counter()
    for r in rows: model.predict_proba(r.reshape(1, -1))
    one = time.perf_counter() - t
    t = time.perf_counter(); model.predict_proba(rows); batch = time.perf_counter() - t
    print(f"2000 predictions one at a time: {one * 1000:.0f} ms | as one batch: {batch * 1000:.1f} ms | "
          f"about {one / batch:.0f}x faster")


DEMOS = dict(env=env, rules_vs_ml=rules_vs_ml, lifecycle=lifecycle, data=data, anomaly=anomaly, pca=pca, bpe=bpe,
             bigram=bigram, sampling=sampling, llm_size=llm_size, lora=lora, chunking=chunking, hybrid=hybrid,
             pii=pii, fairness=fairness, cache=cache, serving=serving, registry=registry, batching=batching)

if __name__ == "__main__":
    choice = sys.argv[1] if len(sys.argv) > 1 else "all"
    for name, fn in DEMOS.items():
        if choice in (name, "all"):
            print(f"--- {name} ---")
            fn()
