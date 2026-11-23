"""The calculation behind two simulations, in plain Python (no packages):
  1. "Gradient descent": a ball rolling down a curve (one number to learn).
  2. "Optimiser race": plain gradient descent, momentum and Adam on a long narrow valley (two numbers to learn).
The page does the same calculation in JavaScript; scripts/check-sims.mjs checks that the two agree.

Run:  python dynamics.py
"""
import math

# ---- 1. gradient descent on one number ----
CURVES = {
    "bowl": (lambda x: (x - 3) ** 2, lambda x: 2 * (x - 3)),                                  # one valley, lowest at x = 3
    "valleys": (lambda x: 0.25 * x ** 4 - x ** 2 + 0.3 * x, lambda x: x ** 3 - 2 * x + 0.3),  # two valleys
}


def descend(curve, x, lr, steps):
    f, g = CURVES[curve]
    xs = [x]
    for _ in range(steps):
        x = x - lr * g(x)
        xs.append(x)
    return xs


# ---- 2. optimiser race on f(x, y) = 0.5 * (x^2 + 20 y^2), start at (-4, 1) ----
def lcg(seed):
    s = [seed & 0xFFFFFFFF]

    def nxt():
        s[0] = (s[0] * 1664525 + 1013904223) & 0xFFFFFFFF
        return s[0] / 4294967296
    return nxt


def valley(x, y):
    return 0.5 * (x * x + 20 * y * y)


def race(name, lr, noise, steps, seed=3):
    rnd = lcg(seed)
    x, y = -4.0, 1.0
    vx = vy = mx = my = sx = sy = 0.0
    for t in range(1, steps + 1):
        gx, gy = x, 20 * y
        if noise > 0:                                   # a small batch gives a noisy gradient
            gx += noise * (rnd() + rnd() + rnd() + rnd() - 2) * math.sqrt(3)
            gy += noise * (rnd() + rnd() + rnd() + rnd() - 2) * math.sqrt(3)
        if name == "plain":
            x -= lr * gx
            y -= lr * gy
        elif name == "momentum":
            vx = 0.9 * vx + gx
            vy = 0.9 * vy + gy
            x -= lr * vx
            y -= lr * vy
        else:                                           # Adam
            mx = 0.9 * mx + 0.1 * gx
            my = 0.9 * my + 0.1 * gy
            sx = 0.999 * sx + 0.001 * gx * gx
            sy = 0.999 * sy + 0.001 * gy * gy
            x -= lr * (mx / (1 - 0.9 ** t)) / (math.sqrt(sx / (1 - 0.999 ** t)) + 1e-8)
            y -= lr * (my / (1 - 0.9 ** t)) / (math.sqrt(sy / (1 - 0.999 ** t)) + 1e-8)
    return valley(x, y)


def fmt(v):
    return "%.4f" % v if abs(v) < 1e6 else "%.2e" % v


if __name__ == "__main__":
    for lr in (0.1, 0.9, 1.0, 1.1):
        xs = descend("bowl", 0.0, lr, 5)
        print("bowl, learning rate %.1f, start 0: %s" % (lr, " ".join("%.3f" % v for v in xs)))
    for start in (2.0, -2.0):
        print("valleys, start %.1f, rate 0.05, 200 steps: ends at %.3f" % (start, descend("valleys", start, 0.05, 200)[-1]))
    for lr in (0.02, 0.05, 0.1):
        print("race, rate %.2f, no noise, 60 steps: plain %s, momentum %s, Adam %s" % (lr, fmt(race("plain", lr, 0, 60)), fmt(race("momentum", lr, 0, 60)), fmt(race("adam", lr, 0, 60))))
    print("race, rate 0.05, noise 1, 60 steps: plain %s, momentum %s, Adam %s" % (fmt(race("plain", 0.05, 1, 60)), fmt(race("momentum", 0.05, 1, 60)), fmt(race("adam", 0.05, 1, 60))))
