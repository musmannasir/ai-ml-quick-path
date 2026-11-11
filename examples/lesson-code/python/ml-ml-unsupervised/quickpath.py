# From lesson 'ml-unsupervised' (ml). Code status: Python executed 2026-11-02 (ml_basics.py kmeans, quickpath.py pca and anomaly); C# not compiled (no .NET SDK in the build environment)
flags = IsolationForest(contamination=0.02, random_state=1).fit_predict(X) == -1
