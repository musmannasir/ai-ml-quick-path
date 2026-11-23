"""Thinking in probabilities: a small Bayesian network, a Metropolis (MCMC) sampler for a coin, and a one-number Kalman filter.

Run:  python bayes.py
"""
import math

# 1. A tiny Bayesian network: rain, sprinkler, wet grass. What is the chance of rain, given the grass is wet?
p_rain = 0.2
p_spr = {True: 0.01, False: 0.4}                                    # sprinkler on, given rain / no rain
p_wet = {(True, True): 0.99, (True, False): 0.8, (False, True): 0.9, (False, False): 0.0}   # wet, given (rain, sprinkler)
joint = {}
for rain in (True, False):
    for spr in (True, False):
        pr = (p_rain if rain else 1 - p_rain) * (p_spr[rain] if spr else 1 - p_spr[rain]) * p_wet[(rain, spr)]
        joint[(rain, spr)] = pr
p_w = sum(joint.values())
print("chance the grass is wet: %.4f   chance of rain given wet grass: %.4f" % (p_w, sum(v for (r, s), v in joint.items() if r) / p_w))

# 2. Metropolis sampler for a coin's chance of heads after 7 heads in 10 flips, starting from a flat prior
state = 2024
def rnd():
    global state
    state = (1103515245 * state + 12345) % (2 ** 31)
    return state / 2 ** 31
like = lambda p: p ** 7 * (1 - p) ** 3
p, samples = 0.5, []
for step in range(20000):
    q = p + (rnd() - 0.5) * 0.3                                    # propose a nearby value
    if 0 < q < 1 and rnd() < like(q) / like(p):                    # accept if likelier, or sometimes if less likely
        p = q
    if step >= 2000:
        samples.append(p)
mean = sum(samples) / len(samples)
sd = math.sqrt(sum((s - mean) ** 2 for s in samples) / len(samples))
print("MCMC posterior mean %.3f, spread %.3f   (exact answer: mean 0.667, spread 0.131)" % (mean, sd))

# 3. Kalman filter for one unknown number, measured five times with noise of variance 1
est, var = 0.0, 100.0                                              # a vague starting guess
print("measurement  estimate  uncertainty (variance)")
for z in (5.1, 4.8, 5.3, 4.9, 5.0):
    gain = var / (var + 1.0)                                       # how much to trust the new measurement
    est, var = est + gain * (z - est), (1 - gain) * var
    print("%11.1f  %8.3f  %12.3f" % (z, est, var))
