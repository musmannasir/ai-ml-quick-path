# From lesson 's-what-is-ai' (start). Code status: Python executed 2026-11-02 (examples/quickpath/quickpath.py rules_vs_ml); C# not compiled (no .NET SDK in the build environment)
rule = np.array([1 if "free" in t else 0 for t in x_te])                       # hand-written rule
model = make_pipeline(TfidfVectorizer(), LogisticRegression()).fit(x_tr, y_tr)   # learned from examples
learned = model.predict(x_te)
