// From lesson 'app-rag-advanced' (apps). Code status: Python executed 2026-11-02 (quickpath.py chunking and hybrid); C# not compiled (no .NET SDK in the build environment)
using Microsoft.Extensions.AI;

public static class HybridSearch
{
    public static List<string> ReciprocalRankFusion(params IReadOnlyList<string>[] rankings)
    {
        var scores = new Dictionary<string, double>();
        foreach (var ranking in rankings)
            for (int i = 0; i < ranking.Count; i++)
                scores[ranking[i]] = scores.GetValueOrDefault(ranking[i]) + 1.0 / (60 + i + 1);
        return scores.OrderByDescending(kv => kv.Value).Select(kv => kv.Key).ToList();
    }

    public static async Task<string> RewriteQueryAsync(IChatClient chat, string conversation, string question)
    {
        var response = await chat.GetResponseAsync(
        [
            new(ChatRole.System, "Rewrite the user's last question as one short, self-contained search query. Keep codes and names exactly. Reply with the query only."),
            new(ChatRole.User, $"Conversation:\n{conversation}\n\nLast question: {question}"),
        ], new ChatOptions { Temperature = 0 });
        return response.Text.Trim();
    }
}
// var fused = HybridSearch.ReciprocalRankFusion(keywordIds, vectorIds).Take(20).ToList();  then re-rank the top 20.
