// From lesson 'app-evals' (apps). Code status: Python executed 2026-11-02 (applied_basics.py evals, examples/math/math_for_ai.py abtest); C# not compiled (no .NET SDK in the build environment)
using System.Text.RegularExpressions;
using Microsoft.Extensions.AI;

public record Verdict(bool Supported, int Helpfulness, string Reason);   // Helpfulness 1-5

public static class Evals
{
    public static bool CitesKnownSource(string answer, ISet<string> sourceIds) =>
        Regex.Matches(answer, @"\[([\w#-]+)\]").Select(m => m.Groups[1].Value).Any(sourceIds.Contains);

    public static async Task<Verdict?> JudgeAsync(IChatClient judge, string question, string sources, string answer)
    {
        var response = await judge.GetResponseAsync<Verdict>(
        [
            new(ChatRole.System, "You grade answers. Supported = every claim is backed by the sources. Helpfulness 1-5. Be strict."),
            new(ChatRole.User, $"Question: {question}\nSources:\n{sources}\nAnswer: {answer}"),
        ], new ChatOptions { Temperature = 0 });
        return response.TryGetResult(out var v) ? v : null;
    }
}
