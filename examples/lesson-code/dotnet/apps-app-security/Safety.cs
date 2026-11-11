// From lesson 'app-security' (apps). Code status: Python executed 2026-11-02 (quickpath.py pii); C# not compiled (no .NET SDK in the build environment)
using System.Net;
using System.Text.RegularExpressions;

public static partial class Safety
{
    [GeneratedRegex(@"\b(?:\d{4} ){3}\d{4}\b")] private static partial Regex Card();
    [GeneratedRegex(@"[\w.+-]+@[\w-]+\.[\w.]+")] private static partial Regex Email();
    [GeneratedRegex(@"\+?\d[\d ]{8,}\d")] private static partial Regex Phone();

    public static string Redact(string text) =>
        Phone().Replace(Email().Replace(Card().Replace(text, "[CARD]"), "[EMAIL]"), "[PHONE]");

    // Never insert model output into HTML unencoded (prevents script injection).
    public static string ToSafeHtml(string modelOutput) => WebUtility.HtmlEncode(modelOutput);
}

// Console.WriteLine(Safety.Redact("Hi, I'm Dana (dana.r@example.com, +44 7700 900123). Card 4111 1111 1111 1111 was charged twice."));
