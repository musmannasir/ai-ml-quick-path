// Same cases and same numbers as model_compare.py. Written from scratch, so it needs no packages.
const int n = 40;
double[] pTrue = new double[n], y = new double[n], pA = new double[n], pB = new double[n];
for (int i = 0; i < n; i++)
{
    pTrue[i] = Math.Clamp(0.5 + 0.45 * Math.Sin(0.7 * i), 0.03, 0.97);
    y[i] = (i * 0.6180339887498949) % 1.0 < pTrue[i] ? 1 : 0;              // 1 means the event happened
    double logit = Math.Log(pTrue[i] / (1 - pTrue[i]));
    pA[i] = pTrue[i];                                                      // honest probabilities
    pB[i] = Math.Clamp(1 / (1 + Math.Exp(-3 * logit)), 0.001, 0.999);      // overconfident probabilities
}

double CaseLoss(double[] p, int i) => -(y[i] * Math.Log(p[i]) + (1 - y[i]) * Math.Log(1 - p[i]));
void Report(string name, double[] p)
{
    double acc = Enumerable.Range(0, n).Average(i => ((p[i] >= 0.5) == (y[i] == 1)) ? 1.0 : 0.0);
    double ll = Enumerable.Range(0, n).Average(i => CaseLoss(p, i));
    double brier = Enumerable.Range(0, n).Average(i => Math.Pow(p[i] - y[i], 2));
    Console.WriteLine($"model {name}: accuracy {acc:F3}  log loss {ll:F3}  Brier {brier:F3}");
}
Report("A", pA);
Report("B", pB);

double[] d = Enumerable.Range(0, n).Select(i => CaseLoss(pB, i) - CaseLoss(pA, i)).ToArray();   // paired: same case, both models
double mean = d.Average();
double sd = Math.Sqrt(d.Sum(v => Math.Pow(v - mean, 2)) / (n - 1));
double se = sd / Math.Sqrt(n);
Console.WriteLine($"paired difference in log loss (B minus A): mean {mean:F3}  standard error {se:F3}  ratio {mean / se:F2}");

Console.WriteLine("model B calibration: predicted range, cases, average predicted, share that happened");
foreach (double lo in new[] { 0.0, 0.2, 0.4, 0.6, 0.8 })
{
    double hi = lo + 0.2 + (lo == 0.8 ? 1e-9 : 0);
    var rows = Enumerable.Range(0, n).Where(i => pB[i] >= lo && pB[i] < hi).ToArray();
    if (rows.Length > 0)
        Console.WriteLine($"  {lo:F1} to {lo + 0.2:F1}  {rows.Length,2}  {rows.Average(i => pB[i]):F3}  {rows.Average(i => y[i]):F3}");
}
