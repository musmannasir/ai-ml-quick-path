# From lesson 'ml-unsupervised' (ml). Code status: Python executed 2026-11-02 (ml_basics.py kmeans, quickpath.py pca and anomaly); added technique snippets (2026-11-05) not run
flags = IsolationForest(contamination=0.02, random_state=1).fit_predict(X) == -1
