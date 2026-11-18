// DBSCAN and the silhouette score written from scratch (ML.NET offers k-means but not DBSCAN).
// Same points and the same DBSCAN line as clustering.py.
var pts = new List<(double x, double y)>();
foreach (var (cx, cy) in new[] { (0.0, 0.0), (5.0, 0.0), (2.5, 4.0) })
    for (int j = 0; j < 10; j++)
    {
        double r = 0.3 + 0.12 * (j % 5);
        pts.Add((cx + r * Math.Cos(j * 2.399963), cy + r * Math.Sin(j * 2.399963)));
    }
pts.Add((10.0, 10.0)); pts.Add((-4.0, 6.0));                      // two stray points
int n = pts.Count;
double Dist(int a, int b) => Math.Sqrt(Math.Pow(pts[a].x - pts[b].x, 2) + Math.Pow(pts[a].y - pts[b].y, 2));

// DBSCAN: a point with at least minPts points within eps (itself included) is a core point; clusters grow from core points.
const double eps = 1.2; const int minPts = 4;
int[] label = Enumerable.Repeat(-2, n).ToArray();                 // -2 = not visited, -1 = noise
List<int> Near(int p) => Enumerable.Range(0, n).Where(q => Dist(p, q) <= eps).ToList();
int cluster = 0;
for (int p = 0; p < n; p++)
{
    if (label[p] != -2) continue;
    var seeds = Near(p);
    if (seeds.Count < minPts) { label[p] = -1; continue; }
    label[p] = cluster;
    var queue = new Queue<int>(seeds);
    while (queue.Count > 0)
    {
        int q = queue.Dequeue();
        if (label[q] == -1) label[q] = cluster;                   // a noise point next to a core point joins the cluster
        if (label[q] != -2) continue;
        label[q] = cluster;
        var more = Near(q);
        if (more.Count >= minPts) foreach (int m in more) queue.Enqueue(m);
    }
    cluster++;
}

// Silhouette: for each point, a = average distance inside its cluster, b = average distance to the nearest other cluster.
var keep = Enumerable.Range(0, n).Where(i => label[i] >= 0).ToList();
double silhouette = keep.Average(i =>
{
    var own = keep.Where(j => label[j] == label[i] && j != i).ToList();
    double a = own.Count == 0 ? 0 : own.Average(j => Dist(i, j));
    double b = keep.Where(j => label[j] != label[i]).GroupBy(j => label[j]).Min(g => g.Average(j => Dist(i, j)));
    return own.Count == 0 ? 0 : (b - a) / Math.Max(a, b);
});
var sizes = Enumerable.Range(0, cluster).Select(c => label.Count(l => l == c));
Console.WriteLine($"{"DBSCAN",-18} clusters {cluster}  sizes [{string.Join(", ", sizes)}]  noise {label.Count(l => l == -1)}  silhouette {silhouette:F3}");
