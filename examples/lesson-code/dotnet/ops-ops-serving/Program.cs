// From lesson 'ops-serving' (ops). Code status: Python executed 2026-11-02 (quickpath.py serving, standard-library HTTP server); FastAPI and C# not run (FastAPI not installed and no .NET SDK in the build environment)
using Microsoft.Extensions.ML;
using Microsoft.ML.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddPredictionEnginePool<Customer, ChurnPrediction>()
    .FromFile(modelName: "churn", filePath: "model.zip", watchForChanges: true);
builder.Services.AddHealthChecks();
var app = builder.Build();

const string ModelVersion = "churn-fasttree-v3";
app.MapHealthChecks("/health");

app.MapPost("/predict", (Customer c, PredictionEnginePool<Customer, ChurnPrediction> pool) =>
{
    if (c.TenureMonths is < 0 or > 600 || c.MonthlyCharge < 0 || c.SupportCalls < 0)
        return Results.BadRequest(new { error = "values out of range" });
    var p = pool.Predict(modelName: "churn", example: c);
    return Results.Ok(new { churnProbability = Math.Round(p.Probability, 3), modelVersion = ModelVersion });
});
app.Run();

public sealed class Customer
{
    public float TenureMonths { get; set; }
    public float MonthlyCharge { get; set; }
    public float SupportCalls { get; set; }
}
public sealed class ChurnPrediction
{
    [ColumnName("PredictedLabel")] public bool Churn { get; set; }
    public float Probability { get; set; }
}
