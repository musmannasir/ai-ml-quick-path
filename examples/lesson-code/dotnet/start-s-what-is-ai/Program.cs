// From lesson 's-what-is-ai' (start). Code status: Python executed 2026-11-02 (examples/quickpath/quickpath.py rules_vs_ml); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
var messages = new[]
{
    new Message { Text = "claim your prize now click the link", IsSpam = true },
    new Message { Text = "please review the sprint notes on Monday", IsSpam = false },
    // ... add a few hundred labelled messages
};
IDataView data = ml.Data.LoadFromEnumerable(messages);

// Learn the rule instead of writing it: text -> numbers -> logistic regression.
var pipeline = ml.Transforms.Text.FeaturizeText("Features", nameof(Message.Text))
    .Append(ml.BinaryClassification.Trainers.SdcaLogisticRegression(labelColumnName: nameof(Message.IsSpam)));
var model = pipeline.Fit(data);

var engine = ml.Model.CreatePredictionEngine<Message, SpamPrediction>(model);
var result = engine.Predict(new Message { Text = "final notice cash reward click the link" });
Console.WriteLine($"Spam: {result.IsSpam} (probability {result.Probability:P0})");

public class Message { public string Text { get; set; } = ""; public bool IsSpam { get; set; } }
public class SpamPrediction
{
    [ColumnName("PredictedLabel")] public bool IsSpam { get; set; }
    public float Probability { get; set; }
}
