"""Toy scaled dot-product attention with hand-picked numbers.

This is NOT taken from a real model. The vectors are chosen by hand so the
arithmetic is easy to follow. Real models learn Q, K and V projections from data.

Runtime prerequisites: Python 3.10+, NumPy 1.24+.
Run:  python attention_toy.py
"""
import numpy as np

tokens = ["The", "cat", "sat", "because", "it", "was", "tired"]

# 2-dimensional toy keys. Dimension 0 ~ "is an animal/noun that can be tired",
# dimension 1 ~ "is a function word". Hand-picked for illustration only.
K = np.array([
    [0.0, 1.0],   # The
    [2.0, 0.1],   # cat
    [0.3, 0.2],   # sat
    [0.0, 1.0],   # because
    [0.5, 0.5],   # it
    [0.1, 0.8],   # was
    [0.4, 0.1],   # tired
])
# Values carry the information that gets mixed. Here V = identity-like labels
# so you can see which token's information dominates the output.
V = np.eye(len(tokens))

# Query for the token "it": it "asks" for an animal-like noun.
q_it = np.array([1.5, 0.0])

d_k = K.shape[1]
scores = K @ q_it / np.sqrt(d_k)          # one score per earlier token
# Causal mask: "it" (position 4) may only look at positions 0..4.
position = tokens.index("it")
scores[position + 1:] = -np.inf
weights = np.exp(scores - scores[: position + 1].max())
weights = weights / weights.sum()          # softmax -> sums to 1
output = weights @ V                       # weighted mix of value vectors

print("Raw scores (q·k / sqrt(d_k)):")
for tok, s in zip(tokens, scores):
    print(f"  {tok:>8}: {s:6.2f}" if np.isfinite(s) else f"  {tok:>8}:  masked")
print("Attention weights for 'it':")
for tok, w in zip(tokens, weights):
    print(f"  {tok:>8}: {w:.3f}")
print(f"Weights sum to {weights.sum():.3f}")
print(f"Largest weight: {tokens[int(np.argmax(weights))]!r}")
