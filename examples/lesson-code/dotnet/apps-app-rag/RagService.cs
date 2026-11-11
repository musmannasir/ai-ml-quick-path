// From lesson 'app-rag' (apps). Code status: Python executed 2026-11-02 (examples/rag-leave-policy/rag_leave_policy.py, offline with TF-IDF standing in for embeddings); C# not compiled (no .NET SDK in the build environment)
using System.Numerics.Tensors;
using Microsoft.Extensions.AI;

public record Chunk(string Id, string Text, string[] AllowedRoles, ReadOnlyMemory<float> Vector);

public class RagService(IChatClient chat, IEmbeddingGenerator<string, Embedding<float>> embedder, List<Chunk> index)
{
    private const float MinScore = 0.35f;     // tune on your evaluation set

    public static async Task<List<Chunk>> IngestAsync(IEmbeddingGenerator<string, Embedding<float>> embedder,
        IEnumerable<(string Id, string Text, string[] Roles)> passages)
    {
        var list = passages.ToList();
        var vectors = await embedder.GenerateAsync(list.Select(p => p.Text));
        return list.Zip(vectors, (p, v) => new Chunk(p.Id, p.Text, p.Roles, v.Vector)).ToList();
    }

    public async Task<string> AskAsync(string question, string userRole)
    {
        var q = await embedder.GenerateVectorAsync(question);
        var hits = index.Where(c => c.AllowedRoles.Contains(userRole))                 // permissions BEFORE ranking
                        .Select(c => (c, score: TensorPrimitives.CosineSimilarity(c.Vector.Span, q.Span)))
                        .OrderByDescending(h => h.score).Take(3).ToList();
        if (hits.Count == 0 || hits[0].score < MinScore)
            return "I can't find this in the documents you can access. Please contact HR.";

        string sources = string.Join("\n", hits.Select(h => $"[{h.c.Id}] {h.c.Text}"));
        var response = await chat.GetResponseAsync(
        [
            new(ChatRole.System, "Answer using ONLY the sources. Cite source ids in square brackets. If the sources do not contain the answer, say you don't know."),
            new(ChatRole.User, $"Sources:\n{sources}\n\nQuestion: {question}"),
        ], new ChatOptions { Temperature = 0 });
        return response.Text;
    }
}
