// From lesson 'dl-vision-more' (dl). Code status: Python executed 2026-11-18 (examples/vision-more/vision_more.py, NumPy only); PyTorch was not run; the C# version prints the same output
// An edge filter, mixup and the triplet loss, from scratch. Same output as vision_more.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// 1. Edge detection: slide a 3x3 Sobel filter over a tiny image with a vertical edge
double[,] img = new double[6, 6];
for (int r = 0; r < 6; r++) for (int c = 3; c < 6; c++) img[r, c] = 9;      // dark on the left, bright on the right
double[,] sobel = { { -1, 0, 1 }, { -2, 0, 2 }, { -1, 0, 1 } };
var row0 = new List<int>();
for (int c = 0; c < 4; c++)
{
    double sum = 0;
    for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) sum += img[0 + i, c + j] * sobel[i, j];
    row0.Add((int)sum);
}
Console.WriteLine("Sobel response, one row of the 4x4 output: [" + string.Join(", ", row0) + "]");

// 2. Mixup: blend two images and their labels with a weight
double[,] a = { { 0, 1 }, { 1, 0 } }, b = { { 1, 1 }, { 0, 0 } };
double lam = 0.7;
string F(double v) => Math.Round(v, 2).ToString("0.0#");
var mix = new double[2, 2];
for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) mix[i, j] = lam * a[i, j] + (1 - lam) * b[i, j];
Console.WriteLine($"mixup image: [[{F(mix[0, 0])}, {F(mix[0, 1])}], [{F(mix[1, 0])}, {F(mix[1, 1])}]]  label mix: cat {lam:F1}, dog {1 - lam:F1}");

// 3. Triplet loss: pull the positive closer than the negative by at least a margin
double Dist(double[] p, double[] q) => Math.Sqrt(p.Zip(q, (u, v) => (u - v) * (u - v)).Sum());
double[] anchor = { 1, 2 }, positive = { 1.5, 2.5 }, negative = { 4, 6 }, hard = { 1.8, 2.8 };
double dPos = Dist(anchor, positive), dNeg = Dist(anchor, negative), margin = 1.0;
Console.WriteLine($"distance to positive {dPos:F3}, to negative {dNeg:F3}, triplet loss {Math.Max(0, dPos - dNeg + margin):F3}");
double d2 = Dist(anchor, hard);
Console.WriteLine($"with a hard negative at distance {d2:F3}, triplet loss {Math.Max(0, dPos - d2 + margin):F3}");
