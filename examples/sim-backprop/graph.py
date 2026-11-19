"""The calculation behind the "Backpropagation on a small graph" simulation, in plain Python (no packages).

One neuron: m = w * x, z = m + b, a = tanh(z), loss = (a - y)^2.
Forward pass first, then the chain rule from the loss back to every input, then a check against a tiny nudge
(a numerical gradient). The page does the same calculation in JavaScript; scripts/check-sims.mjs checks the two agree.

Run:  python graph.py
"""
import math


def forward(x, w, b, y):
    m = w * x
    z = m + b
    a = math.tanh(z)
    return {"m": m, "z": z, "a": a, "loss": (a - y) ** 2}


def backward(x, w, b, y):
    f = forward(x, w, b, y)
    d_a = 2 * (f["a"] - y)                 # how the loss changes with a
    d_z = d_a * (1 - f["a"] ** 2)          # times how a changes with z (tanh slope)
    return {"a": d_a, "z": d_z, "m": d_z, "b": d_z, "w": d_z * x, "x": d_z * w}


def nudge(x, w, b, y, which, h=0.0001):
    args = {"x": x, "w": w, "b": b}
    base = forward(x, w, b, y)["loss"]
    args[which] += h
    return (forward(args["x"], args["w"], args["b"], y)["loss"] - base) / h


if __name__ == "__main__":
    x, w, b, y = 2.0, 0.3, 0.1, 1.0
    f = forward(x, w, b, y)
    print("forward: m %.4f  z %.4f  a %.4f  loss %.4f" % (f["m"], f["z"], f["a"], f["loss"]))
    g = backward(x, w, b, y)
    print("backward: dloss/da %.4f  dloss/dz %.4f  dloss/dw %.4f  dloss/db %.4f  dloss/dx %.4f" % (g["a"], g["z"], g["w"], g["b"], g["x"]))
    print("nudge check: w %.4f  b %.4f" % (nudge(x, w, b, y, "w"), nudge(x, w, b, y, "b")))
    for i in range(1, 6):
        g = backward(x, w, b, y)
        w, b = w - 0.1 * g["w"], b - 0.1 * g["b"]
        print("update %d (rate 0.1): w %.4f  b %.4f  loss %.4f" % (i, w, b, forward(x, w, b, y)["loss"]))
