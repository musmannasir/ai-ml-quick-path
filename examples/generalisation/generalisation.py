"""Bias and variance, seen through one dial: how many neighbours a k-nearest-neighbours model averages.

Small k follows every wobble in the training data (flexible). Large k averages almost everything (simple).
The data are 60 points on a sine curve plus a repeatable wobble that stands in for noise, so the numbers
are the same on every run and in the C# version. Even-numbered points train the model; odd-numbered points test it.
Run:  python generalisation.py   (needs numpy and scikit-learn)
"""
import numpy as np
from sklearn.neighbors import KNeighborsRegressor

n = 60
i = np.arange(n)
x = (6 / 59) * i + np.where(i % 2 == 1, 0.013, 0.0)   # the small offset avoids equal distances
y = np.sin(x) + 0.35 * np.sin(17.0 * i + 1.0)         # curve plus wobble
train = i % 2 == 0
test = ~train

def rmse(a, b):
    return float(np.sqrt(np.mean((a - b) ** 2)))

print("wobble alone (the error no model can remove): %.3f" % rmse(0.35 * np.sin(17.0 * i + 1.0), 0))
print("always predict the training average: test RMSE %.3f" % rmse(y[test], y[train].mean()))
print(" k  train RMSE  test RMSE")
for k in (1, 3, 5, 9, 15, 29):
    model = KNeighborsRegressor(n_neighbors=k).fit(x[train].reshape(-1, 1), y[train])
    print("%2d  %10.3f  %9.3f" % (k, rmse(y[train], model.predict(x[train].reshape(-1, 1))),
                                  rmse(y[test], model.predict(x[test].reshape(-1, 1)))))
