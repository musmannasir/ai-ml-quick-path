// From lesson 'ml-patterns' (ml). Code status: Python executed 2026-11-18 (examples/patterns/patterns.py); the C# version prints the same numbers
// Same numbers as patterns.py, written from scratch with no packages.
// 1. Mahalanobis distance
int m = 30;
double[] x = Enumerable.Range(0, m).Select(i => 2.0 * Math.Sin(0.9 * i)).ToArray();
double[] y = Enumerable.Range(0, m).Select(i => 0.8 * x[i] + 0.3 * Math.Cos(2.1 * i)).ToArray();   // y follows x, with a little wobble
double mx = x.Average(), my = y.Average();
double sxx = x.Sum(v => (v - mx) * (v - mx)) / (m - 1);
double syy = y.Sum(v => (v - my) * (v - my)) / (m - 1);
double sxy = Enumerable.Range(0, m).Sum(i => (x[i] - mx) * (y[i] - my)) / (m - 1);
double det = sxx * syy - sxy * sxy;                               // inverse of a 2x2 table by hand
foreach (var (qx, qy) in new[] { (1.5, 1.2), (1.5, -1.2) })       // same distance from the centre, different direction
{
    double vx = qx - mx, vy = qy - my;
    double straight = Math.Sqrt(vx * vx + vy * vy);
    double mahal = Math.Sqrt((syy * vx * vx - 2 * sxy * vx * vy + sxx * vy * vy) / det);
    Console.WriteLine($"point ({qx:F1}, {qy:F1}): straight-line distance {straight:F3}  Mahalanobis distance {mahal:F3}");
}

// 2. Kernel density: add a small bell curve over every data value
double[] vals = { 1.0, 1.2, 1.5, 1.9, 2.1, 2.4, 6.0, 6.3, 6.5, 6.8, 7.1, 12.0 };
double Density(double at, double h = 0.5) =>
    vals.Average(v => Math.Exp(-0.5 * Math.Pow((at - v) / h, 2)) / (h * Math.Sqrt(2 * Math.PI)));
Console.WriteLine($"density at 2.0: {Density(2.0):F3}   at 4.5: {Density(4.5):F3}   at 12.0: {Density(12.0):F3}");

// 3. Association rules on eight shopping baskets
var baskets = new List<HashSet<string>> {
    new() { "bread", "milk" }, new() { "bread", "eggs" }, new() { "bread", "milk", "eggs" }, new() { "milk" },
    new() { "bread", "milk" }, new() { "eggs" }, new() { "bread", "milk", "tea" }, new() { "tea", "milk" } };
double Share(params string[] items) => baskets.Count(b => items.All(b.Contains)) / (double)baskets.Count;
double both = Share("bread", "milk"), bread = Share("bread"), milk = Share("milk");
Console.WriteLine($"bread and milk: support {both:F3}  confidence(bread -> milk) {both / bread:F3}  lift {both / bread / milk:F3}");
