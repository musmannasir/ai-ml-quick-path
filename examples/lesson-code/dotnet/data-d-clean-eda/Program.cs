// From lesson 'd-clean-eda' (data). Code status: Python executed 2026-11-02 (examples/ml-basics/ml_basics.py quality, gap_topics.py viz); C# not compiled (no .NET SDK in the build environment)
var tickets = LoadTickets();   // your data access code

var cleaned = tickets
    .GroupBy(t => t.TicketId).Select(g => g.First())                       // remove duplicates
    .Select(t => t with { Channel = string.IsNullOrWhiteSpace(t.Channel)
                                    ? "unknown" : t.Channel.Trim().ToLowerInvariant() })
    .ToList();
var invalid = cleaned.Where(t => t.MinutesToReply is < 0 or > 24 * 60).Select(t => t.TicketId).ToList();
Console.WriteLine($"rows {cleaned.Count}, out-of-range ids: {string.Join(", ", invalid)}");

foreach (var g in cleaned.Where(t => !invalid.Contains(t.TicketId)).GroupBy(t => t.Channel))
{
    var sorted = g.Select(t => t.MinutesToReply).Order().ToList();
    Console.WriteLine($"{g.Key}: count {sorted.Count}, mean {sorted.Average():F1}, median {sorted[sorted.Count / 2]:F1}");
}

public record Ticket(int TicketId, string? Channel, double MinutesToReply);
