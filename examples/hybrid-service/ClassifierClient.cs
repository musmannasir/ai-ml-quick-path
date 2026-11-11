// Typed HttpClient used by ASP.NET Core to call the Python classifier service.
// Register: builder.Services.AddHttpClient<ClassifierClient>(c =>
//     { c.BaseAddress = new Uri(builder.Configuration["Classifier:BaseUrl"]!); c.Timeout = TimeSpan.FromSeconds(5); })
//   .AddStandardResilienceHandler();   // Microsoft.Extensions.Http.Resilience: retries, circuit breaker, timeouts
// Status: conceptual sample, not compiled in the academy build environment.
using System.Net.Http.Json;
using System.Text.Json.Serialization;

// Python uses snake_case JSON; map names explicitly instead of relying on defaults.
public sealed record ClassifyResponse(
    [property: JsonPropertyName("label")] string Label,
    [property: JsonPropertyName("score")] double Score,
    [property: JsonPropertyName("model_version")] string ModelVersion,
    [property: JsonPropertyName("request_id")] string RequestId);

public sealed class ClassifierClient(HttpClient http, IConfiguration config)
{
    public async Task<ClassifyResponse?> ClassifyAsync(string text, CancellationToken ct)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "/v1/classify")
        {
            Content = JsonContent.Create(new { text, request_id = Guid.NewGuid().ToString("N") })
        };
        message.Headers.Add("X-Api-Key", config["Classifier:ApiKey"]);
        using var response = await http.SendAsync(message, ct);
        if (!response.IsSuccessStatusCode) return null;          // caller falls back to manual triage
        var result = await response.Content.ReadFromJsonAsync<ClassifyResponse>(cancellationToken: ct);
        return result is { Score: >= 0 and <= 1 } ? result : null;  // validate before use
    }
}
