// From lesson 's-lifecycle' (start). Code status: Python executed 2026-11-02 (quickpath.py lifecycle); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Customer>("customers.csv", hasHeader: true, separatorChar: ',');
var split = ml.Data.TrainTestSplit(data, testFraction: 0.25);                         // split

var pipeline = ml.Transforms.Concatenate("Features", nameof(Customer.TenureMonths),
        nameof(Customer.TicketsLastMonth), nameof(Customer.MonthlyFee))
    .Append(ml.BinaryClassification.Trainers.FastTree(labelColumnName: nameof(Customer.Churned))); // package Microsoft.ML.FastTree
var model = pipeline.Fit(split.TrainSet);                                             // train

var metrics = ml.BinaryClassification.Evaluate(model.Transform(split.TestSet), labelColumnName: nameof(Customer.Churned));
Console.WriteLine($"Accuracy {metrics.Accuracy:F3} | recall on churners {metrics.PositiveRecall:F3}"); // evaluate

ml.Model.Save(model, data.Schema, "churn-model.zip");                                 // save
var loaded = ml.Model.Load("churn-model.zip", out _);                                 // load in the API
var engine = ml.Model.CreatePredictionEngine<Customer, ChurnPrediction>(loaded);
Console.WriteLine(engine.Predict(new Customer { TenureMonths = 3, TicketsLastMonth = 4, MonthlyFee = 40 }).Probability);

public class Customer
{
    [LoadColumn(0)] public float TenureMonths { get; set; }
    [LoadColumn(1)] public float TicketsLastMonth { get; set; }
    [LoadColumn(2)] public float MonthlyFee { get; set; }
    [LoadColumn(3)] public bool Churned { get; set; }
}
public class ChurnPrediction { [ColumnName("PredictedLabel")] public bool Churned { get; set; } public float Probability { get; set; } }
