// From lesson 'ml-algorithms' (ml). Code status: Python executed 2026-11-02 (examples/ai-extras/ai_extras.py algos, gap_topics.py svm); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Row>("moons.csv", hasHeader: true, separatorChar: ',');
var prep = ml.Transforms.Concatenate("Features", nameof(Row.X1), nameof(Row.X2))
    .Append(ml.Transforms.NormalizeMeanVariance("Features"));

var trainers = new (string Name, IEstimator<ITransformer> Trainer)[]
{
    ("logistic regression", ml.BinaryClassification.Trainers.SdcaLogisticRegression()),
    ("linear SVM",          ml.BinaryClassification.Trainers.LinearSvm()),
    ("random forest",       ml.BinaryClassification.Trainers.FastForest()),
    ("boosted trees",       ml.BinaryClassification.Trainers.FastTree()),
    ("LightGBM",            ml.BinaryClassification.Trainers.LightGbm()),
};
foreach (var (name, trainer) in trainers)
{
    var results = ml.BinaryClassification.CrossValidateNonCalibrated(data, prep.Append(trainer), numberOfFolds: 5);
    Console.WriteLine($"{name,-20} accuracy {results.Average(r => r.Metrics.Accuracy):F3}");
}

public class Row
{
    [Microsoft.ML.Data.LoadColumn(0)] public float X1 { get; set; }
    [Microsoft.ML.Data.LoadColumn(1)] public float X2 { get; set; }
    [Microsoft.ML.Data.LoadColumn(2), Microsoft.ML.Data.ColumnName("Label")] public bool Label { get; set; }
}
