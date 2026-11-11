# From lesson 'dl-transformers' (dl). Code status: Python NumPy executed 2026-11-02 (examples/attention/attention_toy.py); C# (TorchSharp) not run (not installed in the build environment)
scores = K @ q_it / np.sqrt(d_k)          # compare the query with every key
scores[position + 1:] = -np.inf           # causal mask: no looking ahead
weights = np.exp(scores - scores[: position + 1].max()); weights /= weights.sum()
output = weights @ V                      # weighted mix of values
