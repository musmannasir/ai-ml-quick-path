// From lesson 'ml-see-data' (ml). Code status: Python executed 2026-11-18 (examples/seeing-data/see_data.py); the C# version prints the matching line for the first two columns
// The neighbour-preservation check from see_data.py, written from scratch. It works on any 2-D picture of the data.
// .NET has no ready-made t-SNE or UMAP that this guide could verify, so those are run in Python; here we apply
// the same check to the simplest picture, the first two columns.
const int n = 60;
var X = new double[n][];
for (int i = 0; i < n; i++)
{
    int g = i % 3;                                                // which of three groups
    X[i] = new[] { 3.0 * g + 0.8 * Math.Sin(1.7 * i), 2.0 * (g == 1 ? 1 : 0) + 0.8 * Math.Cos(2.3 * i),
                   1.5 * (g == 2 ? 1 : 0) + 0.8 * Math.Sin(3.1 * i + 1), 0.8 * Math.Cos(0.9 * i), 0.8 * Math.Sin(4.3 * i) };
}
double Dist(double[] a, double[] b, int dims) => Math.Sqrt(Enumerable.Range(0, dims).Sum(k => Math.Pow(a[k] - b[k], 2)));
int[] Nearest(int p, int dims, int k) =>
    Enumerable.Range(0, n).Where(q => q != p).OrderBy(q => Dist(X[p], X[q], dims)).Take(k).ToArray();

int k = 5;
double kept = Enumerable.Range(0, n).Average(p => Nearest(p, 5, k).Intersect(Nearest(p, 2, k)).Count() / (double)k);
Console.WriteLine("share of each point's 5 nearest neighbours kept in the 2-D picture");
Console.WriteLine($"  first two columns only: {kept:F3}");
