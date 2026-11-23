"""Linear regression under the hood: the normal equation, then a cost-sensitive threshold.

Part 1 solves for the best line with the normal equation (w = (XtX)^-1 Xt y) and checks it against scikit-learn.
Part 2 picks a decision threshold by total cost when a missed case costs 10 times a false alarm.
Run:  python linear_deeper.py   (needs numpy and scikit-learn)
"""
import numpy as np
from sklearn.linear_model import LinearRegression

size = np.array([50.0, 60.0, 70.0, 80.0, 90.0, 100.0])             # square metres
price = np.array([150.0, 172.0, 205.0, 226.0, 255.0, 270.0])       # thousands (made-up numbers)
X = np.column_stack([np.ones_like(size), size])                    # a column of ones carries the intercept
w = np.linalg.solve(X.T @ X, X.T @ price)                          # the normal equation
print("normal equation: intercept %.3f  slope %.3f" % (w[0], w[1]))
lib = LinearRegression().fit(size.reshape(-1, 1), price)
print("scikit-learn:    intercept %.3f  slope %.3f" % (lib.intercept_, lib.coef_[0]))
print("prediction for 75 square metres: %.1f" % (w[0] + w[1] * 75))

score = np.array([0.05, 0.10, 0.20, 0.30, 0.35, 0.45, 0.55, 0.60, 0.70, 0.80, 0.90, 0.95])
label = np.array([0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1])             # 1 means a real case
print("threshold  missed  false alarms  total cost (miss = 10, false alarm = 1)")
for t in (0.1, 0.3, 0.5, 0.7):
    flagged = score >= t
    missed = int(np.sum((label == 1) & ~flagged))
    false_alarms = int(np.sum((label == 0) & flagged))
    print("%9.1f  %6d  %12d  %10d" % (t, missed, false_alarms, 10 * missed + false_alarms))
