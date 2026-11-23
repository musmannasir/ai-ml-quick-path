# From lesson 'ml-regression' (ml). Code status: Python executed 2026-11-02 (examples/gap-topics/gap_topics.py regression)
for deg in (1, 3, 9, 15):
    m = make_pipeline(StandardScaler(), PolynomialFeatures(deg), LinearRegression()).fit(x[tr], y[tr])
