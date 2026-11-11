// From lesson 'ops-architecture' (ops). Code status: C# and FastAPI service not compiled or run (no .NET SDK or FastAPI in the build environment); Dockerfile not built (no Docker in the build environment)
using System.Net.Http.Json;
using System.Text.Json.Serialization;

// Program.cs:
// builder.Services.AddHttpClient<ClassifierClient>(c =>
// {
//     c.BaseAddress = new Uri(builder.Configuration["Classifier:BaseUrl"]!);
//     c.Timeout = TimeSpan.FromSeconds(5);
// }).AddStandardResilienceHandler();          // package Microsoft.Extensions.Http.Resilience

public sealed record ClassifyResponse(
    [property: JsonPropertyName("label")] string Label,
    [property: JsonPropertyName("score")] double Score,
    [property: JsonPropertyName("model_version")] string ModelVersion,
    [property: JsonPropertyName("request_id")] string RequestId);

public sealed class ClassifierClient(HttpClient http, IConfiguration config, ILogger<ClassifierClient> log)
{
    public async Task<ClassifyResponse?> ClassifyAsync(string text, CancellationToken ct)
    {
        try
        {
            using var msg = new HttpRequestMessage(HttpMethod.Post, "/v1/classify")
            {
                Content = JsonContent.Create(new { text, request_id = Guid.NewGuid().ToString("N") })
            };
            msg.Headers.Add("X-Api-Key", config["Classifier:ApiKey"]);   // from user secrets or a vault
            using var res = await http.SendAsync(msg, ct);
            if (!res.IsSuccessStatusCode) return null;
            var result = await res.Content.ReadFromJsonAsync<ClassifyResponse>(cancellationToken: ct);
            return result is { Score: >= 0 and <= 1 } ? result : null;     // validate before use
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            log.LogWarning(ex, "Classifier unavailable; falling back to manual triage");
            return null;                                                  // caller routes to the manual queue
        }
    }
}
