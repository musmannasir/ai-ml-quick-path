# From lesson 'dl-neural-nets' (dl). Code status: Python NumPy executed 2026-11-02 (examples/ai-extras/ai_extras.py nn); PyTorch and C# (TorchSharp) not run (not installed in the build environment)
h = np.tanh(X @ W1 + b1)                 # hidden layer
p = sig(h @ W2 + b2)                     # output probability
dz2 = (p - y) / len(X)                   # backward pass starts at the output
dW2, db2 = h.T @ dz2, dz2.sum(0)
dh = dz2 @ W2.T * (1 - h ** 2)
dW1, db1 = X.T @ dh, dh.sum(0)
