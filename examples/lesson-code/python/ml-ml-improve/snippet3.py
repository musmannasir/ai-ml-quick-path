# From lesson 'ml-improve' (ml). Code status: Python executed 2026-11-02 (gap_topics.py tune and interp); C# not compiled (no .NET SDK in the build environment)
rand = RandomizedSearchCV(GradientBoostingClassifier(random_state=0),
        {"max_depth": randint(2, 6), "learning_rate": loguniform(0.01, 0.5), "n_estimators": randint(50, 300)},
        n_iter=18, cv=4, random_state=0).fit(Xtr, ytr)
