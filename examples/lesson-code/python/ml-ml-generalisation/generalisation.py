# From lesson 'ml-generalisation' (ml). Code status: Python executed 2026-11-18 (examples/generalisation/generalisation.py); the C# version prints the same numbers
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
