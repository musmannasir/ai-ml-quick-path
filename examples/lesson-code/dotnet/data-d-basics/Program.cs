// From lesson 'd-basics' (data). Code status: Python executed 2026-11-02 (quickpath.py data); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<House>("houses.csv", hasHeader: true, separatorChar: ',');
foreach (var column in data.Schema) Console.WriteLine($"{column.Name}: {column.Type}");

// 70% train, 30% held out; then split the held-out part into validation and test.
var first = ml.Data.TrainTestSplit(data, testFraction: 0.30, seed: 0);
var second = ml.Data.TrainTestSplit(first.TestSet, testFraction: 0.50, seed: 0);
IDataView train = first.TrainSet, validation = second.TrainSet, test = second.TestSet;

public class House
{
    [LoadColumn(0)] public float SizeM2 { get; set; }
    [LoadColumn(1)] public float Rooms { get; set; }
    [LoadColumn(2)] public string City { get; set; } = "";
    [LoadColumn(3)] public float PriceK { get; set; }   // the label
}
