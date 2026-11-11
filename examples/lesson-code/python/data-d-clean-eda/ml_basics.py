# From lesson 'd-clean-eda' (data). Code status: Python executed 2026-11-02 (examples/ml-basics/ml_basics.py quality, gap_topics.py viz); C# not compiled (no .NET SDK in the build environment)
df = df.drop_duplicates("ticket_id")
df["channel"] = df["channel"].str.strip().str.lower().fillna("unknown")
bad = df[(df["minutes_to_reply"] < 0) | (df["minutes_to_reply"] > 24 * 60)]
