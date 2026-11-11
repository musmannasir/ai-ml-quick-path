// From lesson 'app-llm-api' (apps). Code status: Python validator executed 2026-11-02 (examples/llm-summarizer/python, offline mode and 4 unit tests); live model calls and C# not run (no API key, no .NET SDK in the build environment)
using Microsoft.Extensions.AI;
using OpenAI;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddChatClient(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new OpenAIClient(config["Llm:ApiKey"]).GetChatClient(config["Llm:Model"]).AsIChatClient();
});
var app = builder.Build();

app.MapPost("/summaries", async (SummaryRequest request, IChatClient chat, CancellationToken ct) =>
{
    var messages = new List<ChatMessage>
    {
        new(ChatRole.System, "Summarise the support email. priority must be low, medium or high. Do not invent details."),
        new(ChatRole.User, request.EmailText),
    };
    ChatResponse<EmailSummary> response = await chat.GetResponseAsync<EmailSummary>(messages, cancellationToken: ct);
    if (!response.TryGetResult(out var s) || s is null || s.Priority is not ("low" or "medium" or "high"))
        return Results.Problem("Invalid model output; route this email to a person.", statusCode: 502);
    Console.WriteLine($"tokens in {response.Usage?.InputTokenCount}, out {response.Usage?.OutputTokenCount}");
    return Results.Ok(s);
});
app.Run();

public record SummaryRequest(string EmailText);
public record EmailSummary(string Summary, string Priority, string NextAction);
