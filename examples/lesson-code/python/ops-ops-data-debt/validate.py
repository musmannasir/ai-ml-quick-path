# From lesson 'ops-data-debt' (ops). Code status: Python executed 2026-11-19 (examples/data-validation/validate.py, standard library only); the C# version prints the same output
"""Data validation: check every row against simple rules before it reaches a model, and compare training data with live data.

Run:  python validate.py
"""
rows = [
    {"id": 1, "age": 34, "country": "PT", "amount": 52.0},
    {"id": 2, "age": 29, "country": "ES", "amount": 48.5},
    {"id": 3, "age": -4, "country": "PT", "amount": 51.0},       # impossible age
    {"id": 4, "age": 41, "country": "XX", "amount": 60.0},       # unknown country
    {"id": 5, "age": 38, "country": "FR", "amount": None},       # missing amount
    {"id": 6, "age": 52, "country": "FR", "amount": 55.5},
    {"id": 6, "age": 52, "country": "FR", "amount": 55.5},       # duplicate id
    {"id": 7, "age": 150, "country": "ES", "amount": 47.0},      # impossible age
    {"id": 8, "age": 26, "country": "PT", "amount": 300.0},      # far outside the usual range
    {"id": 9, "age": 45, "country": "ES", "amount": 50.0},
]
rules = {
    "age between 0 and 120": lambda r: r["age"] is not None and 0 <= r["age"] <= 120,
    "country is PT, ES or FR": lambda r: r["country"] in ("PT", "ES", "FR"),
    "amount is present": lambda r: r["amount"] is not None,
    "amount at most 200": lambda r: r["amount"] is None or r["amount"] <= 200,
}
print("rule                       rows failing")
for name, test in rules.items():
    print("%-26s %d" % (name, sum(1 for r in rows if not test(r))))
seen, dups, clean = set(), 0, []
for r in rows:
    repeated = r["id"] in seen
    dups += repeated
    seen.add(r["id"])
    if not repeated and all(t(r) for t in rules.values()):
        clean.append(r)
print("%-26s %d" % ("id is unique", dups))
print("rows kept: %d of %d" % (len(clean), len(rows)))

train = [52.0, 48.5, 51.0, 60.0, 55.5, 47.0, 50.0]
live = [r["amount"] for r in rows if r["amount"] is not None]
mean = lambda xs: sum(xs) / len(xs)
print("average amount: training %.2f, live %.2f, shift %.2f" % (mean(train), mean(live), mean(live) - mean(train)))
