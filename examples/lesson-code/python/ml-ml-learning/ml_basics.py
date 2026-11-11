# From lesson 'ml-learning' (ml). Code status: Python executed 2026-11-02 (examples/ml-basics/ml_basics.py gd and cv); C# not compiled (no .NET SDK in the build environment)
err = (w * x + b) - y                        # how wrong each prediction is
loss = (err ** 2).mean()                     # one number: mean squared error
dw, db = 2 * (err * x).mean(), 2 * err.mean()   # which way to turn each knob
w, b = w - lr * dw, b - lr * db              # small step downhill
