# From lesson 'd-basics' (data). Code status: Python executed 2026-11-02 (quickpath.py data); C# not compiled (no .NET SDK in the build environment)
df = pd.DataFrame({
    "size_m2": [52, 75, 110, 64, None, 95], "rooms": [2, 3, 4, 2, 3, 4],
    "city": ["Lisbon", "Porto", "Lisbon", "Braga", "Porto", "Lisbon"],
    "listed_on": pd.to_datetime(["2026-01-10", "2026-02-03", "2026-02-20", "2026-03-01", "2026-03-15", "2026-04-02"]),
    "price_k": [210, 245, 430, 150, 260, 390]})          # the label
print(df.dtypes); print(df.shape, df.isna().sum().to_dict())
