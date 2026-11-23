// From lesson 'ops-data-debt' (ops). Code status: Python executed 2026-11-19 (examples/data-validation/validate.py, standard library only); the C# version prints the same output
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
