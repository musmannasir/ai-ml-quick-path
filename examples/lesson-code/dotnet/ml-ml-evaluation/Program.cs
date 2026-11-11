// From lesson 'ml-evaluation' (ml). Code status: Python executed 2026-11-02 (ml_basics.py metrics, gap_topics.py roc); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Payment>("payments.csv", hasHeader: true, separatorChar: ',');
var pipeline = ml.Transforms.Concatenate("Features", nameof(Payment.Amount), nameof(Payment.Hour), nameof(Payment.NewDevice))
    .Append(ml.BinaryClassification.Trainers.LightGbm(labelColumnName: nameof(Payment.IsFraud)));

var cv = ml.BinaryClassification.CrossValidate(data, pipeline, numberOfFolds: 5, labelColumnName: nameof(Payment.IsFraud));
var aucs = cv.Select(r => r.Metrics.AreaUnderRocCurve).ToArray();
Console.WriteLine($"ROC-AUC {aucs.Average():F3} (min {aucs.Min():F3}, max {aucs.Max():F3})");
var m = cv[0].Metrics;
Console.WriteLine($"PR-AUC {m.AreaUnderPrecisionRecallCurve:F3}  precision {m.PositivePrecision:F3}  recall {m.PositiveRecall:F3}");

var scored = ml.Data.CreateEnumerable<Scored>(cv[0].ScoredHoldOutSet, reuseRowObject: false).ToList();
foreach (var t in new[] { 0.5f, 0.2f, 0.1f, 0.05f })
{
    int flagged = scored.Count(s => s.Probability >= t);
    int caught = scored.Count(s => s.Probability >= t && s.IsFraud);
    int total = scored.Count(s => s.IsFraud);
    Console.WriteLine($"threshold {t}: flagged {flagged}, recall {(double)caught / total:F3}, precision {(flagged == 0 ? 0 : (double)caught / flagged):F3}");
}

public class Payment
{
    [LoadColumn(0)] public float Amount { get; set; }
    [LoadColumn(1)] public float Hour { get; set; }
    [LoadColumn(2)] public float NewDevice { get; set; }
    [LoadColumn(3)] public bool IsFraud { get; set; }
}
public class Scored { public bool IsFraud { get; set; } public float Probability { get; set; } }
