// From lesson 'llm-design' (llm). Code status: Python executed 2026-11-02 (quickpath.py llm_size); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
var designs = new (string Name, long Vocab, long Width, long Layers, long Context)[]
{
    ("laptop tiny", 8_000, 256, 6, 256),
    ("small", 32_000, 768, 12, 1_024),
    ("medium", 50_000, 2_048, 24, 4_096),
};
foreach (var d in designs)
{
    long parameters = d.Vocab * d.Width + d.Context * d.Width + d.Layers * 12 * d.Width * d.Width;
    double weightsGb = parameters * 2 / 1e9;          // 16-bit weights
    double trainingGb = parameters * 16 / 1e9;        // weights + gradients + optimiser state (rule of thumb)
    long tokensNeeded = parameters * 20;              // rule-of-thumb training tokens
    Console.WriteLine($"{d.Name,-12} {parameters / 1e6,8:F1} M params | weights {weightsGb:F2} GB | training ~{trainingGb:F1} GB | ~{tokensNeeded / 1e9:F1} B tokens");
}
