// ASP.NET Core minimal API: support-email summarizer with Microsoft.Extensions.AI.
// Prerequisites: .NET 8+ SDK; packages Microsoft.Extensions.AI and Microsoft.Extensions.AI.OpenAI.
// Configuration: dotnet user-secrets set "Llm:ApiKey" "<key>"; set Llm:Model in appsettings.json.
// Status: written against the Microsoft.Extensions.AI API documented on Microsoft Learn
// (IChatClient, GetResponseAsync<T>, checked 2026-10-30). Not compiled in the academy build
// environment (no .NET SDK there). Package names and versions change: check NuGet before pinning.
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.AI;
using OpenAI;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddChatClient(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var apiKey = config["Llm:ApiKey"] ?? throw new InvalidOperationException("Llm:ApiKey is not configured.");
    var model = config["Llm:Model"] ?? throw new InvalidOperationException("Llm:Model is not configured.");
    return new OpenAIClient(apiKey).GetChatClient(model).AsIChatClient();
});

var app = builder.Build();

app.MapPost("/summaries", async (SummaryRequest request, IChatClient chat, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(request.EmailText) || request.EmailText.Length > 8_000)
        return Results.ValidationProblem(new Dictionary<string, string[]>
            { ["emailText"] = ["Provide between 1 and 8000 characters."] });

    var messages = new List<ChatMessage>
    {
        new(ChatRole.System, "Summarize the support email. priority must be low, medium or high. Do not invent details."),
        new(ChatRole.User, request.EmailText)
    };

    // GetResponseAsync<T> asks the model for JSON matching EmailSummary and deserializes it.
    ChatResponse<EmailSummary> response = await chat.GetResponseAsync<EmailSummary>(messages, cancellationToken: ct);

    if (!response.TryGetResult(out var summary) || !EmailSummary.IsValid(summary))
        return Results.Problem("The model returned an invalid summary. Route this email to a person.", statusCode: 502);

    return Results.Ok(summary);
});

app.Run();

public sealed record SummaryRequest([property: Required] string EmailText);

public sealed record EmailSummary(string Summary, string Priority, string NextAction)
{
    private static readonly HashSet<string> Allowed = ["low", "medium", "high"];
    public static bool IsValid(EmailSummary? s) =>
        s is not null && !string.IsNullOrWhiteSpace(s.Summary) &&
        Allowed.Contains(s.Priority) && !string.IsNullOrWhiteSpace(s.NextAction);
}
