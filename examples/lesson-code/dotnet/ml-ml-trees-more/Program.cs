// From lesson 'ml-trees-more' (ml). Code status: Python executed 2026-11-18 (examples/boosting/adaboost.py); the C# version prints the same numbers
// Package-free AdaBoost with one-question trees (stumps). Same numbers as adaboost.py.
double[] x = Enumerable.Range(1, 10).Select(v => (double)v).ToArray();
int[] y = { 1, 1, 1, -1, -1, -1, 1, 1, 1, -1 };
double[] w = Enumerable.Repeat(0.1, 10).ToArray();
var stumps = new List<(double alpha, double t, int s)>();
Console.WriteLine("round  rule                   weighted error  alpha");
for (int r = 1; r <= 3; r++)
{
    double bestErr = double.MaxValue, bestT = 0; int bestS = 1;
    for (double t = 1.5; t < 10.0; t += 1.0)                      // thresholds between neighbouring points
        foreach (int s in new[] { 1, -1 })                        // s = 1 means "above t is +1"
        {
            double err = 0;
            for (int i = 0; i < 10; i++) if ((x[i] > t ? s : -s) != y[i]) err += w[i];
            if (err < bestErr - 1e-12) { bestErr = err; bestT = t; bestS = s; }
        }
    double alpha = 0.5 * Math.Log((1 - bestErr) / bestErr);
    for (int i = 0; i < 10; i++) w[i] *= Math.Exp(-alpha * y[i] * (x[i] > bestT ? bestS : -bestS));
    double total = w.Sum();
    for (int i = 0; i < 10; i++) w[i] /= total;
    stumps.Add((alpha, bestT, bestS));
    Console.WriteLine($"{r,5}  x > {bestT:F1} gives {(bestS > 0 ? "+1" : "-1")}       {bestErr,14:F3}  {alpha:F3}");
}
int right = 0;
for (int i = 0; i < 10; i++)
{
    double vote = stumps.Sum(st => st.alpha * (x[i] > st.t ? st.s : -st.s));
    if (Math.Sign(vote) == y[i]) right++;
}
Console.WriteLine($"ensemble accuracy after 3 rounds: {right / 10.0:F2}");
Console.WriteLine("weights of the ten points after round 3: " + string.Join(" ", w.Select(v => v.ToString("F3"))));
