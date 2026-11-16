# From lesson 'dl-graphs' (dl). Code status: Python executed 2026-11-02 (gap_topics.py gnn)
d = A.sum(1); A_hat = A / np.sqrt(np.outer(d, d))     # normalised connections (with self-links)
H = A_hat @ A_hat @ X                                  # two rounds of message passing
clf = LogisticRegression(C=10).fit(H[list(labelled)], list(labelled.values()))
