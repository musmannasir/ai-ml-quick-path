// From lesson 'ops-mlops' (ops). Code status: Python executed 2026-11-02 (quickpath.py registry); MLflow and C# not run (MLflow not installed and no .NET SDK in the build environment)
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
var data = ml.Data.LoadFromTextFile<Customer>("data/churn-2026-10.csv", hasHeader: true, separatorChar: ',');
string dataHash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes("data/churn-2026-10.csv")))[..12];
var split = ml.Data.TrainTestSplit(data, testFraction: 0.3, seed: 0);

var pipeline = ml.Transforms.Concatenate("Features", "TenureMonths", "MonthlyCharge", "SupportCalls")
    .Append(ml.BinaryClassification.Trainers.FastTree());
var model = pipeline.Fit(split.TrainSet);
double auc = ml.BinaryClassification.Evaluate(model.Transform(split.TestSet)).AreaUnderRocCurve;

var champion = JsonSerializer.Deserialize<Manifest>(File.ReadAllText("models/production.json"))!;
bool promote = auc >= champion.TestAuc + 0.005;
var manifest = new Manifest($"churn-{DateTime.UtcNow:yyyyMMdd-HHmm}", dataHash, auc, promote ? "promote" : "reject");
File.WriteAllText($"models/{manifest.Version}.json", JsonSerializer.Serialize(manifest));
ml.Model.Save(model, data.Schema, $"models/{manifest.Version}.zip");
if (promote) File.Copy($"models/{manifest.Version}.json", "models/production.json", overwrite: true);
Console.WriteLine($"{manifest.Version}: AUC {auc:F3} vs champion {champion.TestAuc:F3} -> {manifest.Decision}");

public sealed record Manifest(string Version, string DataSha256, double TestAuc, string Decision);

public sealed class Customer
{
    [LoadColumn(0)] public float TenureMonths { get; set; }
    [LoadColumn(1)] public float MonthlyCharge { get; set; }
    [LoadColumn(2)] public float SupportCalls { get; set; }
    [LoadColumn(3), ColumnName("Label")] public bool Churned { get; set; }   // trainers look for "Label" by default
}
