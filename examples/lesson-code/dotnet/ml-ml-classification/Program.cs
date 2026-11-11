// From lesson 'ml-classification' (ml). Code status: Python executed 2026-11-02 (examples/spam-classifier/spam_classifier.py); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Message>("messages.tsv", hasHeader: true, separatorChar: '\t');
var split = ml.Data.TrainTestSplit(data, testFraction: 0.3);

var pipeline = ml.Transforms.Text.FeaturizeText("Features", nameof(Message.Text))
    .Append(ml.BinaryClassification.Trainers.SdcaLogisticRegression(labelColumnName: nameof(Message.IsSpam)));
var model = pipeline.Fit(split.TrainSet);

var m = ml.BinaryClassification.Evaluate(model.Transform(split.TestSet), labelColumnName: nameof(Message.IsSpam));
Console.WriteLine($"Precision {m.PositivePrecision:F2}  Recall {m.PositiveRecall:F2}  F1 {m.F1Score:F2}");
Console.WriteLine(m.ConfusionMatrix.GetFormattedConfusionTable());

var engine = ml.Model.CreatePredictionEngine<Message, SpamPrediction>(model);
var p = engine.Predict(new Message { Text = "Click now to claim your free prize" });
const float threshold = 0.3f;                 // chosen from business costs, not left at 0.5 by habit
Console.WriteLine($"probability {p.Probability:F2} -> {(p.Probability >= threshold ? "spam" : "not spam")}");

public class Message
{
    [LoadColumn(0)] public string Text { get; set; } = "";
    [LoadColumn(1)] public bool IsSpam { get; set; }
}
public class SpamPrediction { [ColumnName("PredictedLabel")] public bool IsSpam { get; set; } public float Probability { get; set; } }
