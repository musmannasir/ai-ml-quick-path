// From lesson 'llm-embed-train' (llm). Code status: Python executed 2026-11-19 (examples/embed-train/embed_train.py, NumPy only); no embedding model was trained and no neural framework was run; the C# version prints the same output
// Mean pooling, cosine similarity and the contrastive (InfoNCE) loss, from scratch. Same output as embed_train.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

double[][] tokens = { new[] { 1.0, 2.0 }, new[] { 3.0, 4.0 }, new[] { 5.0, 0.0 } };
var pooled = Enumerable.Range(0, 2).Select(k => tokens.Average(t => t[k])).ToArray();
Console.WriteLine("mean pooling of three token vectors: [" + string.Join(", ", pooled.Select(v => v.ToString("0.0"))) + "]");

double[][] Q = { new[] { 1.0, 0.2, 0.0 }, new[] { 0.1, 1.0, 0.3 }, new[] { 0.0, 0.3, 1.0 } };                       // question vectors
double[][] aBefore = { new[] { 0.4, 0.9, 0.1 }, new[] { 0.9, 0.3, 0.2 }, new[] { 0.2, 0.5, 0.8 } };                 // untrained answers
double[][] aAfter = { new[] { 1.0, 0.3, 0.1 }, new[] { 0.2, 1.0, 0.2 }, new[] { 0.1, 0.2, 1.0 } };                  // after training

double[] Unit(double[] v) { double n = Math.Sqrt(v.Sum(x => x * x)); return v.Select(x => x / n).ToArray(); }
void Report(string name, double[][] A, double tau = 0.1)
{
    var q = Q.Select(Unit).ToArray(); var a = A.Select(Unit).ToArray();
    var sim = q.Select(qi => a.Select(aj => qi.Zip(aj, (x, y) => x * y).Sum()).ToArray()).ToArray();      // cosine similarity of every question with every answer
    double loss = 0; int hits = 0;
    for (int i = 0; i < 3; i++)
    {
        var e = sim[i].Select(s => Math.Exp(s / tau)).ToArray();
        loss += -Math.Log(e[i] / e.Sum());                                                                // InfoNCE: each question should pick its own answer
        if (Array.IndexOf(sim[i], sim[i].Max()) == i) hits++;
    }
    Console.WriteLine(name + ": similarity of question i with answer j");
    foreach (var row in sim) Console.WriteLine("   " + string.Join("  ", row.Select(v => v.ToString("F2"))));
    Console.WriteLine($"   loss {loss / 3:F3}, top-1 accuracy {hits / 3.0:F2}");
}
Report("before training", aBefore);
Report("after training ", aAfter);
