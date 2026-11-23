# From lesson 'llm-paradigms' (llm). Code status: Python executed 2026-11-19 (examples/paradigms/paradigms.py, NumPy only); only merging and quantisation are run, the other paradigms are described; the C# version prints the same output
"""Two ideas from beyond plain supervised learning, in numbers: merging two models by averaging their weights,
and quantising weights to 4 bits.

Run:  python paradigms.py   (needs numpy)
"""
import numpy as np

g = (np.arange(10) + 0.5) / 5 - 1.0                            # -0.9, -0.7, ... 0.9
X = np.array([(a, b + 0.013) for a in g for b in g])           # 100 points on a grid (the small offset keeps points off the decision boundary)
task_a = (X[:, 0] > 0).astype(float)                           # task A: is the first number positive?
task_b = (X[:, 1] > 0).astype(float)                           # task B: is the second number positive?

def train(y, steps=300, lr=1.0):                               # logistic regression by gradient descent: weights and a bias
    w = np.zeros(3)
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(X @ w[:2] + w[2])))
        w = w - lr * np.append(X.T @ (p - y) / len(y), np.mean(p - y))
    return w

def accuracy(w, y):
    return float(np.mean(((X @ w[:2] + w[2]) > 0) == (y == 1)))

wa, wb = train(task_a), train(task_b)
merged = (wa + wb) / 2                                         # model merging: average the two weight vectors
z = lambda w: [round(float(v), 2) + 0.0 for v in w]                   # avoids printing -0.00
print("weights: model A [%.2f %.2f %.2f]  model B [%.2f %.2f %.2f]" % (*z(wa), *z(wb)))
print("                 task A  task B")
for name, w in (("model A", wa), ("model B", wb), ("merged (average)", merged)):
    print("%-16s %6.2f  %6.2f" % (name, accuracy(w, task_a), accuracy(w, task_b)))

weights = np.array([0.83, -0.41, 0.07, -0.95, 0.30])           # quantise to 4 bits: 15 levels from -7 to 7 times a scale
scale = np.abs(weights).max() / 7
q = np.round(weights / scale).astype(int)
back = q * scale
print("scale %.4f, integers %s" % (scale, q.tolist()))
print("restored weights %s" % [round(float(v), 3) for v in back])
print("largest error %.4f, average error %.4f" % (np.abs(weights - back).max(), np.abs(weights - back).mean()))
