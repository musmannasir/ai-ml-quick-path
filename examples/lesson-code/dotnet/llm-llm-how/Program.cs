// From lesson 'llm-how' (llm). Code status: Python executed 2026-11-02 (quickpath.py bigram); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
var text = "the support team answers the ticket . the team closes the ticket . the customer thanks the team . the customer opens a ticket ."
    .Split(' ');
var counts = new Dictionary<string, Dictionary<string, int>>();
for (int i = 0; i < text.Length - 1; i++)
{
    if (!counts.TryGetValue(text[i], out var next)) counts[text[i]] = next = new();
    next[text[i + 1]] = next.GetValueOrDefault(text[i + 1]) + 1;
}
var afterThe = counts["the"];
int total = afterThe.Values.Sum();
foreach (var (word, n) in afterThe) Console.WriteLine($"P({word} | the) = {(double)n / total:F2}");
