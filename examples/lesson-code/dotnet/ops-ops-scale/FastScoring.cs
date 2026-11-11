// From lesson 'ops-scale' (ops). Code status: Python executed 2026-11-02 (quickpath.py batching, cache); ONNX export and C# not run (skl2onnx not installed and no .NET SDK in the build environment)
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

public sealed class FastScoring(IMemoryCache cache, IChatClient chat)
{
    private static readonly InferenceSession Session = new("churn.onnx");   // load once

    public float[] ScoreBatch(float[][] rows)
    {
        var input = new DenseTensor<float>(rows.SelectMany(r => r).ToArray(), [rows.Length, 3]);
        string inputName = Session.InputMetadata.Keys.First();
        using var results = Session.Run([NamedOnnxValue.CreateFromTensor(inputName, input)]);
        return results.First().AsEnumerable<long>().Select(x => (float)x).ToArray(); // predicted labels
    }

    public async Task<string> AnswerAsync(string question, CancellationToken ct)
    {
        string key = "faq:" + question.Trim().ToLowerInvariant();
        if (cache.TryGetValue(key, out string? cached)) return cached!;
        var response = await chat.GetResponseAsync(question, new ChatOptions { MaxOutputTokens = 300 }, cancellationToken: ct);
        cache.Set(key, response.Text, TimeSpan.FromHours(6));                 // expire so answers stay fresh
        return response.Text;
    }
}
