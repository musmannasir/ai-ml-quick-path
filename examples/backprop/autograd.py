"""A tiny automatic-differentiation engine (about 30 lines) and a vanishing-gradient demonstration.

Each Value remembers how it was made, so calling backward() can walk back through the calculation and
apply the chain rule. No libraries are needed.
Run:  python autograd.py
"""
import math

class Value:
    def __init__(self, data, parents=(), local=()):
        self.data, self.grad = data, 0.0
        self.parents, self.local = parents, local        # local[i] = d(this) / d(parents[i])
    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        return Value(self.data + o.data, (self, o), (1.0, 1.0))
    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        return Value(self.data * o.data, (self, o), (o.data, self.data))
    def __sub__(self, o):
        return self + (o * -1.0 if isinstance(o, Value) else Value(-o))
    def sigmoid(self):
        s = 1 / (1 + math.exp(-self.data))
        return Value(s, (self,), (s * (1 - s),))
    def backward(self):
        order, seen = [], set()
        def visit(v):                                    # parents before children
            if id(v) not in seen:
                seen.add(id(v))
                for p in v.parents:
                    visit(p)
                order.append(v)
        visit(self)
        self.grad = 1.0
        for v in reversed(order):                        # the chain rule, one step at a time
            for p, d in zip(v.parents, v.local):
                p.grad += d * v.grad

def loss_of(w, b):
    x, y = 2.0, 1.0
    err = (w * x + b).sigmoid() - y
    return err * err

w, b = Value(0.5), Value(-0.3)
loss = loss_of(w, b)
loss.backward()
print("loss %.4f  d loss / d w = %.4f  d loss / d b = %.4f" % (loss.data, w.grad, b.grad))
h = 1e-6                                                 # check against a tiny nudge of w
numeric = (loss_of(Value(0.5 + h), Value(-0.3)).data - loss_of(Value(0.5 - h), Value(-0.3)).data) / (2 * h)
print("numerical check of d loss / d w: %.4f" % numeric)

print("layers  gradient reaching the first layer (sigmoid layers, weight 1)  (ReLU layers, weight 1)")
for n in (1, 5, 10, 20):
    g_sig, z = 1.0, 0.5
    for _ in range(n):
        s = 1 / (1 + math.exp(-z))
        g_sig *= s * (1 - s)                             # each sigmoid layer multiplies the gradient by at most 0.25
        z = s
    print("%6d  %57.2e  %22.1f" % (n, g_sig, 1.0))
