// Merging two models by averaging weights, and quantising weights to 4 bits, from scratch.
// Same output as paradigms.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

var X = new List<double[]>();
for (int i = 0; i < 10; i++) for (int j = 0; j < 10; j++) X.Add(new[] { (i + 0.5) / 5 - 1.0, (j + 0.5) / 5 - 1.0 + 0.013 });   // 100 points on a grid (the small offset keeps points off the decision boundary)
int n = X.Count;
int[] taskA = X.Select(p => p[0] > 0 ? 1 : 0).ToArray();                                                              // task A: is the first number positive?
int[] taskB = X.Select(p => p[1] > 0 ? 1 : 0).ToArray();                                                              // task B: is the second number positive?

double[] Train(int[] y, int steps = 300, double lr = 1.0)                                                              // logistic regression by gradient descent
{
    var w = new double[3];
    for (int s = 0; s < steps; s++)
    {
        var g = new double[3];
        for (int k = 0; k < n; k++)
        {
            double p = 1 / (1 + Math.Exp(-(X[k][0] * w[0] + X[k][1] * w[1] + w[2])));
            g[0] += X[k][0] * (p - y[k]) / n; g[1] += X[k][1] * (p - y[k]) / n; g[2] += (p - y[k]) / n;
        }
        for (int d = 0; d < 3; d++) w[d] -= lr * g[d];
    }
    return w;
}
double Accuracy(double[] w, int[] y) => Enumerable.Range(0, n).Average(k => ((X[k][0] * w[0] + X[k][1] * w[1] + w[2] > 0) == (y[k] == 1)) ? 1.0 : 0.0);

var wa = Train(taskA); var wb = Train(taskB);
var merged = wa.Zip(wb, (a, b) => (a + b) / 2).ToArray();                                                              // model merging: average the two weight vectors
string Z(double[] w) => string.Join(" ", w.Select(v => (Math.Round(v, 2) + 0.0).ToString("F2")));                      // avoids printing -0.00
Console.WriteLine($"weights: model A [{Z(wa)}]  model B [{Z(wb)}]");
Console.WriteLine("                 task A  task B");
foreach (var (name, w) in new[] { ("model A", wa), ("model B", wb), ("merged (average)", merged) })
    Console.WriteLine($"{name,-16} {Accuracy(w, taskA),6:F2}  {Accuracy(w, taskB),6:F2}");

double[] weights = { 0.83, -0.41, 0.07, -0.95, 0.30 };                                                                  // quantise to 4 bits: 15 levels from -7 to 7 times a scale
double scale = weights.Max(Math.Abs) / 7;
int[] q = weights.Select(v => (int)Math.Round(v / scale, MidpointRounding.ToEven)).ToArray();
double[] back = q.Select(v => v * scale).ToArray();
Console.WriteLine($"scale {scale:F4}, integers [{string.Join(", ", q)}]");
Console.WriteLine("restored weights [" + string.Join(", ", back.Select(v => Math.Round(v, 3).ToString("0.0##"))) + "]");
var err = weights.Zip(back, (a, b) => Math.Abs(a - b)).ToArray();
Console.WriteLine($"largest error {err.Max():F4}, average error {err.Average():F4}");
