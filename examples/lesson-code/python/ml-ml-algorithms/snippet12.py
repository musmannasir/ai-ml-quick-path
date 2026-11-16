# From lesson 'ml-algorithms' (ml). Code status: Python executed 2026-11-02 (examples/ai-extras/ai_extras.py algos, gap_topics.py svm); added technique snippets (2026-11-05) not run
for name, model in models.items():
    s = cross_val_score(model, X, y, cv=5)          # same folds, same metric for every model
    print(f"{name:<24} accuracy {s.mean():.3f} (+/- {s.std():.3f})")
