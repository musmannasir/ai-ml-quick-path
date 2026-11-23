// From lesson 'llm-tokens' (llm). Code status: Python executed 2026-11-02 (quickpath.py bpe and sampling)
static double[] SoftmaxNaive(double[] scores)
{
    var exps = scores.Select(Math.Exp).ToArray();
    double total = exps.Sum();
    return exps.Select(e => e / total).ToArray();
}

static double[] SoftmaxStable(double[] scores)
{
    double biggest = scores.Max();              // subtract the largest score first
    var exps = scores.Select(s => Math.Exp(s - biggest)).ToArray();
    double total = exps.Sum();
    return exps.Select(e => e / total).ToArray();
}

string Show(double[] p) => string.Join(", ", p.Select(v => v.ToString("F3")));

Console.WriteLine("small scores, naive : " + Show(SoftmaxNaive(new[] { 1.0, 2.0 })));
Console.WriteLine("small scores, stable: " + Show(SoftmaxStable(new[] { 1.0, 2.0 })));
Console.WriteLine("large scores, naive : " + Show(SoftmaxNaive(new[] { 1000.0, 1001.0 })));
Console.WriteLine("large scores, stable: " + Show(SoftmaxStable(new[] { 1000.0, 1001.0 })));
