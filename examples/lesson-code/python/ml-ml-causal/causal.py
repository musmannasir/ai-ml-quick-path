# From lesson 'ml-causal' (ml). Code status: Python executed 2026-11-19 (examples/causal/causal.py, NumPy only); the C# version prints the same output
"""Why a plain comparison can mislead: a confounder, an adjustment, and a randomised experiment.

200 patients. A hidden factor z (1 = a more severe case) raises the outcome by 4 and makes treatment more likely.
The treatment itself adds exactly 2 to the outcome, so the true effect is 2. Data come from a repeatable rule.
Run:  python causal.py   (needs numpy)
"""
import numpy as np

n = 200
i = np.arange(n)
z = ((i * 0.6180339887498949) % 1.0 < 0.5).astype(int)                 # 1 = more severe case
u = (i * 0.7548776662466927) % 1.0
treated = (u < np.where(z == 1, 0.8, 0.2)).astype(int)                 # severe cases are treated more often
wobble = 0.5 * np.sin(5.0 * i)
outcome = 10 + 4 * z + 2 * treated + wobble                            # higher is better here

naive = outcome[treated == 1].mean() - outcome[treated == 0].mean()
print("treated %d, untreated %d" % (treated.sum(), n - treated.sum()))
print("naive difference in average outcome: %.3f" % naive)
effects, weights = [], []
for g in (0, 1):
    m = z == g
    e = outcome[m & (treated == 1)].mean() - outcome[m & (treated == 0)].mean()
    effects.append(e); weights.append(m.sum() / n)
    print("  within group z=%d (%d patients): effect %.3f" % (g, m.sum(), e))
print("adjusted for z (weighted by group size): %.3f   true effect: 2" % sum(e * w for e, w in zip(effects, weights)))

coin = ((i * 0.5698402909980532) % 1.0 < 0.5).astype(int)              # treatment decided by a coin flip instead
outcome2 = 10 + 4 * z + 2 * coin + wobble
print("randomised experiment, plain difference: %.3f" % (outcome2[coin == 1].mean() - outcome2[coin == 0].mean()))
