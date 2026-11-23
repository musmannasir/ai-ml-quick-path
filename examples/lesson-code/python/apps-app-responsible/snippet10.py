# From lesson 'app-responsible' (apps). Code status: Python executed 2026-11-02 (quickpath.py fairness)
rates = df.groupby("group")["approved"].mean()
tpr = df[df.qualified].groupby("group")["approved"].mean()
