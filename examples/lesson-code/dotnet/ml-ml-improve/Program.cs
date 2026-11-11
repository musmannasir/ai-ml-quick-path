// From lesson 'ml-improve' (ml). Code status: Python executed 2026-11-02 (gap_topics.py tune and interp); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.AutoML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Customer>("customers.csv", hasHeader: true, separatorChar: ',');
var split = ml.Data.TrainTestSplit(data, testFraction: 0.2);

var experiment = ml.Auto().CreateBinaryClassificationExperiment(maxExperimentTimeInSeconds: 120);
var result = experiment.Execute(split.TrainSet, labelColumnName: nameof(Customer.Churned));
Console.WriteLine($"best: {result.BestRun.TrainerName}, validation AUC {result.BestRun.ValidationMetrics.AreaUnderRocCurve:F3}");

var test = ml.BinaryClassification.Evaluate(result.BestRun.Model.Transform(split.TestSet), labelColumnName: nameof(Customer.Churned));
Console.WriteLine($"test AUC {test.AreaUnderRocCurve:F3}");   // look at the test set once, at the end

public class Customer
{
    [LoadColumn(0)] public float TenureMonths { get; set; }
    [LoadColumn(1)] public float TicketsLastMonth { get; set; }
    [LoadColumn(2)] public float DiscountPercent { get; set; }
    [LoadColumn(3)] public bool Churned { get; set; }
}
