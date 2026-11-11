// From lesson 'ml-regression' (ml). Code status: Python executed 2026-11-02 (examples/gap-topics/gap_topics.py regression); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<House>("houses.csv", hasHeader: true, separatorChar: ',');
var split = ml.Data.TrainTestSplit(data, testFraction: 0.25);

var pipeline = ml.Transforms.Categorical.OneHotEncoding("CityEncoded", nameof(House.City))
    .Append(ml.Transforms.Concatenate("Features", nameof(House.SizeM2), nameof(House.Rooms), "CityEncoded"))
    .Append(ml.Regression.Trainers.FastTree(labelColumnName: nameof(House.PriceK)));
var model = pipeline.Fit(split.TrainSet);

var m = ml.Regression.Evaluate(model.Transform(split.TestSet), labelColumnName: nameof(House.PriceK));
Console.WriteLine($"MAE {m.MeanAbsoluteError:F2}  RMSE {m.RootMeanSquaredError:F2}  R² {m.RSquared:F3}");

var engine = ml.Model.CreatePredictionEngine<House, PricePrediction>(model);
Console.WriteLine(engine.Predict(new House { SizeM2 = 80, Rooms = 3, City = "Porto" }).PriceK);

public class House
{
    [LoadColumn(0)] public float SizeM2 { get; set; }
    [LoadColumn(1)] public float Rooms { get; set; }
    [LoadColumn(2)] public string City { get; set; } = "";
    [LoadColumn(3)] public float PriceK { get; set; }
}
public class PricePrediction { [ColumnName("Score")] public float PriceK { get; set; } }
