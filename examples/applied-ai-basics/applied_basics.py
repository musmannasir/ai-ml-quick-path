"""Small applied-AI demonstrations: cosine similarity, an eval harness, latency budgets.

Runtime prerequisites: Python 3.10+, NumPy.
Run:  python applied_basics.py [cosine|evals|latency|all]
Vectors and timings are synthetic illustrations, not measurements of a real model.
"""
import json
import sys

import numpy as np


def cosine():
    # Toy 3-dimensional "embeddings" (real ones have hundreds or thousands of dimensions).
    vecs = {
        "annual leave policy": np.array([0.9, 0.1, 0.0]),
        "vacation days": np.array([0.8, 0.2, 0.1]),
        "printer is jammed": np.array([0.0, 0.2, 0.9]),
    }
    q = vecs["vacation days"]
    for text, v in vecs.items():
        sim = float(q @ v / (np.linalg.norm(q) * np.linalg.norm(v)))
        print(f"cos('vacation days', '{text}') = {sim:.3f}")


def evals():
    """Score recorded model outputs against expectations: JSON validity and required facts."""
    cases = [
        {"id": "t1", "output": '{"priority": "high", "summary": "Cracked panel, needs replacement"}',
         "expect_priority": "high", "must_mention": "replacement"},
        {"id": "t2", "output": '{"priority": "low", "summary": "Asks for invoice copy"}',
         "expect_priority": "low", "must_mention": "invoice"},
        {"id": "t3", "output": 'Sure! {"priority": "medium"}',
         "expect_priority": "medium", "must_mention": "password"},
        {"id": "t4", "output": '{"priority": "medium", "summary": "Login fails after reset"}',
         "expect_priority": "high", "must_mention": "login"},
    ]
    results = []
    for c in cases:
        try:
            data = json.loads(c["output"])
            valid = True
        except json.JSONDecodeError:
            data, valid = {}, False
        ok_priority = data.get("priority") == c["expect_priority"]
        ok_fact = c["must_mention"] in data.get("summary", "").lower()
        results.append((c["id"], valid, ok_priority, ok_fact))
        print(f"{c['id']}: json={'ok' if valid else 'FAIL'} priority={'ok' if ok_priority else 'FAIL'} "
              f"fact={'ok' if ok_fact else 'FAIL'}")
    n = len(results)
    print(f"json valid {sum(r[1] for r in results)}/{n}, priority correct {sum(r[2] for r in results)}/{n}, "
          f"all checks pass {sum(all(r[1:]) for r in results)}/{n}")


def latency():
    rng = np.random.default_rng(7)
    ttft = rng.gamma(4, 0.08, 500)                       # seconds to first token
    output_tokens = rng.integers(80, 400, 500)
    decode_rate = rng.normal(60, 8, 500).clip(20)        # tokens per second while generating
    total = ttft + output_tokens / decode_rate
    print(f"TTFT p50={np.percentile(ttft, 50):.2f}s p95={np.percentile(ttft, 95):.2f}s")
    print(f"total p50={np.percentile(total, 50):.2f}s p95={np.percentile(total, 95):.2f}s")
    print(f"share of requests over a 5 s budget: {(total > 5).mean():.1%}")


DEMOS = {"cosine": cosine, "evals": evals, "latency": latency}

if __name__ == "__main__":
    choice = sys.argv[1] if len(sys.argv) > 1 else "all"
    for name, fn in DEMOS.items():
        if choice in (name, "all"):
            print(f"--- {name} ---")
            fn()
