---
id: ops-data-debt
title: Data validation and technical debt in ML systems
module: ops
level: Intermediate
minutes: 60
maths: basic arithmetic
goal: Write simple validation rules that stop bad rows reaching a model, compare training data with live data to catch shifts, and name the kinds of technical debt that build up in machine-learning systems.
prereqs: ops-mlops
reviewed: 2026-11-19
evidence: A validation report for a small dataset (rule, rows failing, rows kept) and a comparison of one feature's average in training and live data with a sentence on what you would do.
code: Python executed 2026-11-19 (examples/data-validation/validate.py, standard library only); the C# version prints the same output
---
## In plain words
A model is only as good as the rows it is given. Bad rows come in quietly: a sensor sends -4 for an age, a country appears with a new spelling, an amount is missing, a pipeline repeats a record, or a value is 300 when it is usually 50. **Data validation** means writing rules that every row must pass, and checking them before training and again before serving. A failed rule either stops the pipeline, drops the row or raises an alert, depending on how serious it is. A second check compares the **live data** with the **training data**: if the average of a feature has moved a long way, the model is being asked about a world it never saw. Beyond data, ML systems collect **technical debt**: shortcuts that make a change cheap now and expensive later. Naming the kinds of debt helps you notice them early.

```diagram flow Validate before training and before serving
note: The same rules run twice. Bad data should be stopped at both doors.
- New data arrives | From a file, database or event stream | input
- Check every row against the rules | Missing values, ranges, allowed values, repeats | process
- Decide: stop, drop the row or alert | Depends on how serious the failure is | model
- Pass only clean rows on | To training or to the live model | output
```

```diagram compare Rules that catch different problems
note: Use a mix. Each kind of rule catches things the others miss.
## Row rules | process
- Range, allowed values, missing values
- Catch broken or impossible rows
## Table rules | model
- Unique ids, row counts, column names
- Catch repeats and silent schema changes
## Shift checks | warn
- Compare live averages with training
- Catch a changed world
```

```diagram compare Where ML technical debt hides
note: Most of it is in the code and data around the model, not in the model.
## In the code | warn
- Glue code to join libraries
- Tangled data pipelines
- Old experiments left in place
## In the data and use | bad
- Inputs other teams change without warning
- Other systems quietly using the predictions
- A model that influences its own future data
```

## Real-world example
A retailer's model predicts the amount a customer will spend. One morning its predictions double. Nobody changed the model. A source system had started sending amounts in cents instead of euros, so an amount of 50 became 5000. A range check on the amount would have flagged the first batch in seconds, and the live-versus-training average would have shown a huge shift. The team now runs both checks on every batch and has a rule: a failure above a set share of rows stops the pipeline and sends a message to the data owner.

## How it works
1. **Write the rules.** For each column: is it required, what type, what range, what allowed values. For the table: ids unique, columns present, a reasonable number of rows.
2. **Run them on every batch.** Count how many rows fail each rule and keep the counts.
3. **Choose a response.** Stop for serious failures (a missing column), drop or repair a row for minor ones, and always log the counts.
4. **Compare live with training.** For each important feature, compare the live average with the training average, and alert when the shift is larger than expected.
5. **Pay down the debt.** Keep the pipeline simple, delete dead experiments, write down who uses the predictions, and test the whole path, not only the model.

```maths Reading a validation report
situation: Ten rows were checked. Two have an impossible age. After all rules and removing the repeated id, only 4 rows are kept.
find: What share failed the age rule, and what share was dropped overall?
step: Share failing the age rule | 2 ÷ 10 = 0.2
step: Rows dropped overall | 10 - 4 = 6
step: Share kept | 4 ÷ 10 = 0.4
result: 20% of rows fail the age rule, and 60% of all rows were dropped.
why: A rule that drops a lot of data is a signal in itself. If 60% of rows are bad, find the cause at the source instead of quietly training on what is left.
caution: Dropping bad rows can bias the data, for example if the bad rows all come from one region. Report what you dropped.
try: If a fix at the source brings the failing rows down to 1 in 10 and nothing else changes, what share is kept?
answer: 9 ÷ 10 = 0.9 of the rows pass the age rule. Other rules may still drop some.
```

```maths Comparing live with training
situation: The average amount in the training data is 52.00. In the live batch it is 79.94. These come from the run below.
find: How big is the shift, and how big is it compared with the training average?
step: Shift in the average | 79.94 - 52 = 27.94
step: Shift as a share of the training average | 27.94 ÷ 52 ≈ 0.537
result: The live average is 27.94 higher, about 54% above the training average.
why: A shift this large means the model is being asked about amounts it rarely saw. In this batch one row of 300 does most of the damage, which is exactly the kind of case the range rule catches.
try: Without that one row (the 300), the other 8 amounts add up to 419.5. What is their average?
answer: 419.5 ÷ 8 = 52.4375, close to the training average of 52. The whole shift came from one row.
```

```maths Hidden interactions grow quickly
situation: A model uses 6 input features, each supplied by a different system. Any two of them might interact, for example one team changing how a value is measured while another relies on it.
find: How many pairs of inputs could interact?
step: Pairs of 6 inputs | 6 × 5 ÷ 2 = 15
result: There are 15 pairs to think about, and the number grows quickly: 12 inputs give 66 pairs.
why: This is one reason that changing one input can change the model in unexpected ways, and why tests and documentation for the whole pipeline matter.
```

## Live simulation
Data checks are cheap insurance. See what they catch, and what they cannot.

```sim val Data checks and a schema change
question: How do checks on incoming data protect a model, and what do they miss?
watch: Each check is a small rule. Turn them on and off and see which rows fail which rule.
watch: Rename a column, as a data supplier might without warning.
watch: Compare a run with a column check against a run with only row checks.
try: stop | Turn on the column check, rename the column, and see the pipeline stop.
try: silent | Rename the column with only the email and country checks on, and see rows pass with nothing noticed.
predict: A data supplier renames a column. You have row checks only on the other columns. What happens? | The pipeline stops with a clear message | Nothing is noticed, and the model silently loses a column | The model fixes it by itself
answer: 2 | The renamed column simply looks empty, and no check looks at it. Seven rows still pass. A check on the shape of the data (the columns) is what catches this.
leaves-out: Ten made-up rows and five hand-written checks. Real pipelines use a validation library, check statistics as well as rules, and decide what to do with failing rows (reject, repair or quarantine).
reference: examples/sim-ops/ops.py
```

## Python example
Ten rows with deliberate problems, four rules, a unique-id check, and a comparison of the live average with the training average. It uses only the standard library. Libraries such as Great Expectations or Pandera let you write the same kind of rules in a reusable way, but they were not run for this lesson.

```python validate.py
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
```
```text Output of validate.py (executed)
rule                       rows failing
age between 0 and 120      2
country is PT, ES or FR    1
amount is present          1
amount at most 200         1
id is unique               1
rows kept: 4 of 10
average amount: training 52.00, live 79.94, shift 27.94
```
Two rows fail the age rule, one the country rule, one has a missing amount, one has an amount above 200, and one repeats an id. Four of the ten rows are kept. The live average amount is 79.94 against 52.00 in training, a shift of 27.94.

## .NET (C#) example
The same rules written from scratch in C#, with no packages, printing the same output. In .NET you can also put validation attributes on your record types, or use a validation library such as FluentValidation.

```cs Program.cs
// Row-by-row data validation and a simple training-versus-live check. Same output as validate.py. No packages.
var rows = new List<(int id, int age, string country, double? amount)>
{
    (1, 34, "PT", 52.0), (2, 29, "ES", 48.5),
    (3, -4, "PT", 51.0),        // impossible age
    (4, 41, "XX", 60.0),        // unknown country
    (5, 38, "FR", null),        // missing amount
    (6, 52, "FR", 55.5),
    (6, 52, "FR", 55.5),        // duplicate id
    (7, 150, "ES", 47.0),       // impossible age
    (8, 26, "PT", 300.0),       // far outside the usual range
    (9, 45, "ES", 50.0),
};
var rules = new (string name, Func<(int id, int age, string country, double? amount), bool> test)[]
{
    ("age between 0 and 120", r => r.age >= 0 && r.age <= 120),
    ("country is PT, ES or FR", r => r.country is "PT" or "ES" or "FR"),
    ("amount is present", r => r.amount != null),
    ("amount at most 200", r => r.amount == null || r.amount <= 200),
};
Console.WriteLine("rule                       rows failing");
foreach (var (name, test) in rules) Console.WriteLine($"{name,-26} {rows.Count(r => !test(r))}");
var seen = new HashSet<int>(); int dups = 0; var clean = new List<(int id, int age, string country, double? amount)>();
foreach (var r in rows)
{
    bool repeated = !seen.Add(r.id);
    if (repeated) dups++;
    if (!repeated && rules.All(t => t.test(r))) clean.Add(r);
}
Console.WriteLine($"{"id is unique",-26} {dups}");
Console.WriteLine($"rows kept: {clean.Count} of {rows.Count}");

double[] train = { 52.0, 48.5, 51.0, 60.0, 55.5, 47.0, 50.0 };
double[] live = rows.Where(r => r.amount != null).Select(r => r.amount!.Value).ToArray();
Console.WriteLine($"average amount: training {train.Average():F2}, live {live.Average():F2}, shift {live.Average() - train.Average():F2}");
```

### Kinds of technical debt in ML systems
A 2015 paper by Google engineers, "Hidden Technical Debt in Machine Learning Systems", pointed out that the model is a small part of a real system and most debt is in the code and data around it. Common forms:
- **Glue code:** large amounts of code that only join a general-purpose library to your system.
- **Pipeline jungles:** data preparation that grew step by step into a tangle nobody dares change.
- **Dead experimental paths:** old branches of code kept "in case" that add complexity.
- **Undeclared consumers:** other systems that quietly use your model's output, so you cannot change it safely.
- **Feedback loops:** a model whose predictions influence the data it will be trained on next.
- **Configuration debt:** settings spread across files with no checks.

## Maths behind it
- Shares and percentages of failing rows (arithmetic)
- Averages and the shift between two averages (statistics)
- Counting pairs: n times n minus 1, over 2 (combinatorics)

## Common mistakes
- Validating only at training time and not at serving time.
- Silently dropping bad rows without recording how many.
- Setting a range rule from last month's data so tightly that normal growth triggers alarms.
- Treating a shift in one feature average as proof the model is wrong, without looking at the rows behind it.
- Leaving old experiments and unused features in the pipeline.

## Quick check
Q: Why run the same validation before training and before serving?
A: Bad data can enter at either point. Training on it spoils the model, and serving on it gives wrong answers even from a good model.

Q: A validation run drops 60% of the rows. What should you do?
A: Treat it as a signal. Find out why so many rows fail, at the source, and report what was dropped instead of quietly training on the rest.

Q: What does a large shift between live and training averages tell you?
A: The model is being asked about data unlike what it learned from. Look at the rows behind the shift, then consider fixing the source or retraining.

Q: What is a feedback loop in an ML system?
A: A model whose predictions change the data it will later learn from, which can make it reinforce its own mistakes.
