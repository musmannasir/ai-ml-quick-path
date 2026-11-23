// From lesson 'ml-unsupervised' (ml). Code status: Python executed 2026-11-02 (ml_basics.py kmeans, quickpath.py pca and anomaly); added technique snippets (2026-11-05) not run
var pts = new double[][] { new[]{1.0,2}, new[]{2.0,3}, new[]{3.0,1}, new[]{8.0,9}, new[]{9.0,8}, new[]{10.0,10} };
var centres = new[] { (double[])pts[0].Clone(), (double[])pts[3].Clone() };  // start with two points
var label = new int[pts.Length];

for (int round = 0; round < 3; round++)            // repeat a few times
{
    for (int i = 0; i < pts.Length; i++)           // step 1: nearest centre for each point
    {
        double D(double[] c) => Math.Sqrt(Math.Pow(pts[i][0]-c[0], 2) + Math.Pow(pts[i][1]-c[1], 2));
        label[i] = D(centres[0]) <= D(centres[1]) ? 0 : 1;
    }
    for (int k = 0; k < 2; k++)                    // step 2: move the centre to the group mean
    {
        var mine = pts.Where((p, i) => label[i] == k).ToList();
        centres[k] = new[] { mine.Average(p => p[0]), mine.Average(p => p[1]) };
    }
}
Console.WriteLine(string.Join(" | ", centres.Select(c => $"({c[0]:F1}, {c[1]:F1})")));
