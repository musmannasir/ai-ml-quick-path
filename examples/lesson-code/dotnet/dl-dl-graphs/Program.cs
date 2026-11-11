// From lesson 'dl-graphs' (dl). Code status: Python executed 2026-11-02 (gap_topics.py gnn); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
int n = 8;
var edges = new (int, int)[] { (0,1),(0,2),(1,2),(1,3),(2,3),(3,4),(4,5),(5,6),(5,7),(6,7),(4,6) };
var neighbours = Enumerable.Range(0, n).Select(i => new List<int> { i }).ToArray();   // include itself
foreach (var (a, b) in edges) { neighbours[a].Add(b); neighbours[b].Add(a); }

var score = new double[n, 2];
score[0, 0] = 1; score[7, 1] = 1;                     // only two labelled nodes
for (int round = 0; round < 3; round++)
{
    var next = new double[n, 2];
    for (int i = 0; i < n; i++)
        foreach (int j in neighbours[i])
            for (int c = 0; c < 2; c++) next[i, c] += score[j, c] / neighbours[i].Count;
    next[0, 0] = 1; next[0, 1] = 0; next[7, 0] = 0; next[7, 1] = 1;   // keep known labels fixed
    score = next;
}
for (int i = 0; i < n; i++) Console.Write($"{(score[i, 1] > score[i, 0] ? 1 : 0)} ");
