# From lesson 'ml-timeseries' (ml). Code status: Python executed 2026-11-02 (gap_topics.py timeseries); C# not compiled (no .NET SDK in the build environment)
feats = pd.DataFrame({"lag7": s.shift(7), "lag14": s.shift(14), "t": np.arange(364)}, index=days)
feats = pd.concat([feats, pd.get_dummies(days.dayofweek, prefix="dow").set_index(days).astype(float)], axis=1).dropna()
