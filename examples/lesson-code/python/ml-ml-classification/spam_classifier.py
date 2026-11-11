# From lesson 'ml-classification' (ml). Code status: Python executed 2026-11-02 (examples/spam-classifier/spam_classifier.py); C# not compiled (no .NET SDK in the build environment)
model = make_pipeline(TfidfVectorizer(lowercase=True), LogisticRegression(max_iter=1000))
model.fit(x_train, y_train)
proba = model.predict_proba(["Click now to claim your free prize"])[0][1]
