# From lesson 'llm-tokens' (llm). Code status: Python executed 2026-11-02 (quickpath.py bpe and sampling)
import math

def softmax_naive(scores):
    exps = [math.exp(s) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]

def softmax_stable(scores):
    biggest = max(scores)                      # subtract the largest score first
    exps = [math.exp(s - biggest) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]

print("small scores, naive :", [round(p, 3) for p in softmax_naive([1, 2])])
print("small scores, stable:", [round(p, 3) for p in softmax_stable([1, 2])])
try:
    softmax_naive([1000, 1001])
except OverflowError as error:
    print("large scores, naive : fails with OverflowError:", error)
print("large scores, stable:", [round(p, 3) for p in softmax_stable([1000, 1001])])
