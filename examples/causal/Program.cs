// Confounding, adjustment and a randomised experiment, from scratch. Same output as causal.py. No packages.
const int n = 200;
int[] z = new int[n], treated = new int[n], coin = new int[n];
double[] outcome = new double[n], outcome2 = new double[n];
for (int i = 0; i < n; i++)
{
    z[i] = (i * 0.6180339887498949) % 1.0 < 0.5 ? 1 : 0;                    // 1 = more severe case
    double u = (i * 0.7548776662466927) % 1.0;
    treated[i] = u < (z[i] == 1 ? 0.8 : 0.2) ? 1 : 0;                       // severe cases are treated more often
    double wobble = 0.5 * Math.Sin(5.0 * i);
    outcome[i] = 10 + 4 * z[i] + 2 * treated[i] + wobble;                   // higher is better here
    coin[i] = (i * 0.5698402909980532) % 1.0 < 0.5 ? 1 : 0;                 // treatment decided by a coin flip instead
    outcome2[i] = 10 + 4 * z[i] + 2 * coin[i] + wobble;
}
double Mean(IEnumerable<int> rows, double[] y) => rows.Average(i => y[i]);
var all = Enumerable.Range(0, n);
double naive = Mean(all.Where(i => treated[i] == 1), outcome) - Mean(all.Where(i => treated[i] == 0), outcome);
Console.WriteLine($"treated {treated.Sum()}, untreated {n - treated.Sum()}");
Console.WriteLine($"naive difference in average outcome: {naive:F3}");
double adjusted = 0;
foreach (int g in new[] { 0, 1 })
{
    var m = all.Where(i => z[i] == g).ToList();
    double e = Mean(m.Where(i => treated[i] == 1), outcome) - Mean(m.Where(i => treated[i] == 0), outcome);
    adjusted += e * m.Count / n;
    Console.WriteLine($"  within group z={g} ({m.Count} patients): effect {e:F3}");
}
Console.WriteLine($"adjusted for z (weighted by group size): {adjusted:F3}   true effect: 2");
Console.WriteLine($"randomised experiment, plain difference: {Mean(all.Where(i => coin[i] == 1), outcome2) - Mean(all.Where(i => coin[i] == 0), outcome2):F3}");
