# From lesson 's-lifecycle' (start). Code status: Python executed 2026-11-02 (quickpath.py lifecycle); C# not compiled (no .NET SDK in the build environment)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)   # 2. split
model = RandomForestClassifier(n_estimators=200, min_samples_leaf=20, random_state=0).fit(X_tr, y_tr)  # 4. train
pred = model.predict(X_te)                                                                   # 5. evaluate
joblib.dump(model, path)                                                                     # 6. save
loaded = joblib.load(path)                                                                   #    load and predict
