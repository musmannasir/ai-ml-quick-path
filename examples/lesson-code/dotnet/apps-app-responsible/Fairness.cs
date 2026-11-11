// From lesson 'app-responsible' (apps). Code status: Python executed 2026-11-02 (quickpath.py fairness); C# not compiled (no .NET SDK in the build environment)
public record Decision(string Group, bool Qualified, bool Approved);

public static class Fairness
{
    public static void Report(IReadOnlyList<Decision> decisions)
    {
        var approval = decisions.GroupBy(d => d.Group).ToDictionary(g => g.Key, g => g.Average(d => d.Approved ? 1.0 : 0.0));
        var amongQualified = decisions.Where(d => d.Qualified).GroupBy(d => d.Group)
                                      .ToDictionary(g => g.Key, g => g.Average(d => d.Approved ? 1.0 : 0.0));
        foreach (var g in approval.Keys.Order())
            Console.WriteLine($"group {g}: approval {approval[g]:F3}, approval among qualified {(amongQualified.TryGetValue(g, out var q) ? q.ToString("F3") : "n/a")}");
        Console.WriteLine($"demographic parity difference {approval.Values.Max() - approval.Values.Min():F3}");
        Console.WriteLine($"equal opportunity difference {amongQualified.Values.Max() - amongQualified.Values.Min():F3}");
    }
}
