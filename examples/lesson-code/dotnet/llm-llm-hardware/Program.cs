// From lesson 'llm-hardware' (llm). Code status: Python fit-check arithmetic executed 2026-11-24 (fit_check.py); PyTorch, Hugging Face and runner commands not run (no GPU in the build environment); C# fit check ran, GPU device code compiled only
static (double Weights, double Cache, double Total, bool Fits) FitCheck(double paramsBillion, int bits, int layers, int ctxTokens, double vramGb,
    int kvHeads = 8, int headSize = 128, double workingGb = 1.0)
{
    double weightsGb = paramsBillion * bits / 8;                         // billions of parameters x bytes each = GB
    double cacheBytesPerToken = 2.0 * layers * kvHeads * headSize * 2;    // keys and values, 2 bytes per value
    double cacheGb = cacheBytesPerToken * ctxTokens / 1e9;
    double totalGb = weightsGb + cacheGb + workingGb;
    return (weightsGb, cacheGb, totalGb, totalGb <= vramGb);
}

static double SpeedLimit(double weightsGb, double bandwidthGbPerS) => bandwidthGbPerS / weightsGb;   // every token reads all weights once

var cases = new (string Name, double P, int Bits, int Layers, int Ctx, double Vram)[]
{
    ("8B at 16-bit, 24 GB GPU", 8, 16, 32, 8192, 24),
    ("8B at 4-bit, 16 GB GPU", 8, 4, 32, 8192, 16),
    ("8B at 16-bit, 16 GB GPU", 8, 16, 32, 8192, 16),
    ("70B at 4-bit, 48 GB GPU", 70, 4, 80, 8192, 48),
    ("70B at 16-bit, 48 GB GPU", 70, 16, 80, 8192, 48),
};
foreach (var c in cases)
{
    var r = FitCheck(c.P, c.Bits, c.Layers, c.Ctx, c.Vram);
    Console.WriteLine($"{c.Name}: weights {r.Weights:F2} GB + cache {r.Cache:F2} GB + working 1.00 GB = {r.Total:F2} GB -> {(r.Fits ? "fits" : "does NOT fit")} ({c.Vram - r.Total:+0.00;-0.00} GB)");
}
Console.WriteLine("speed limit at 400 GB/s: " + string.Join(" ", new[] { 16, 8, 4 }.Select(b => $"{b}-bit {SpeedLimit(8.0 * b / 8, 400):F0} tokens/s")));
