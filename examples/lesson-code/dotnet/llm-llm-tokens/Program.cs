// From lesson 'llm-tokens' (llm). Code status: Python executed 2026-11-02 (quickpath.py bpe and sampling); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML.Tokenizers;

var tokenizer = TiktokenTokenizer.CreateForModel("gpt-4o");
string text = "Please refund order 55812; the glass panel arrived cracked.";
IReadOnlyList<int> ids = tokenizer.EncodeToIds(text);
Console.WriteLine($"{ids.Count} tokens: {string.Join(" ", ids)}");

string[] words = { "refund", "replacement", "discount", "apology", "banana" };
double[] logits = { 3.0, 2.5, 1.5, 1.0, -2.0 };
foreach (double t in new[] { 0.2, 1.0, 2.0 })
{
    var exp = logits.Select(l => Math.Exp(l / t)).ToArray();
    double sum = exp.Sum();
    Console.WriteLine($"T={t}: " + string.Join(", ", words.Zip(exp, (w, e) => $"{w} {e / sum:F2}")));
}
