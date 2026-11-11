// From lesson 'ml-recommenders' (ml). Code status: Python executed 2026-11-02 (gap_topics.py recsys); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Trainers;

var ml = new MLContext(seed: 0);
IDataView ratings = ml.Data.LoadFromEnumerable(LoadRatings());
var split = ml.Data.TrainTestSplit(ratings, testFraction: 0.2);

var options = new MatrixFactorizationTrainer.Options
{
    MatrixColumnIndexColumnName = "UserKey", MatrixRowIndexColumnName = "ItemKey",
    LabelColumnName = nameof(Rating.Label), NumberOfIterations = 30, ApproximationRank = 8,
};
var pipeline = ml.Transforms.Conversion.MapValueToKey("UserKey", nameof(Rating.UserId))
    .Append(ml.Transforms.Conversion.MapValueToKey("ItemKey", nameof(Rating.ItemId)))
    .Append(ml.Recommendation().Trainers.MatrixFactorization(options));
var model = pipeline.Fit(split.TrainSet);

var m = ml.Regression.Evaluate(model.Transform(split.TestSet), labelColumnName: nameof(Rating.Label));
Console.WriteLine($"held-out RMSE {m.RootMeanSquaredError:F3}");

var engine = ml.Model.CreatePredictionEngine<Rating, RatingPrediction>(model);
var top = Enumerable.Range(1, 40).Select(item => (item, engine.Predict(new Rating { UserId = 1, ItemId = item }).Score))
    .OrderByDescending(x => x.Score).Take(3);
Console.WriteLine(string.Join(", ", top.Select(t => $"item {t.item}: {t.Score:F2}")));

static IEnumerable<Rating> LoadRatings() => /* your data */ Array.Empty<Rating>();
// The rating column is called Label because the trainer writes its prediction to a column called Score.
public class Rating { public float UserId { get; set; } public float ItemId { get; set; } public float Label { get; set; } }
public class RatingPrediction { public float Score { get; set; } }
