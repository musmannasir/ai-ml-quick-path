// From lesson 'ml-unsupervised' (ml). Code status: Python executed 2026-11-02 (ml_basics.py kmeans, quickpath.py pca and anomaly); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromEnumerable(LoadCustomers());
var features = ml.Transforms.Concatenate("Features", nameof(Customer.OrdersPerMonth), nameof(Customer.Basket))
    .Append(ml.Transforms.NormalizeMeanVariance("Features"));

var clustering = features.Append(ml.Clustering.Trainers.KMeans("Features", numberOfClusters: 2)).Fit(data);
var engine = ml.Model.CreatePredictionEngine<Customer, ClusterPrediction>(clustering);
Console.WriteLine($"cluster {engine.Predict(new Customer { OrdersPerMonth = 8, Basket = 95 }).ClusterId}");

var anomalies = features.Append(ml.AnomalyDetection.Trainers.RandomizedPca("Features", rank: 1)).Fit(data);
var scored = ml.Data.CreateEnumerable<AnomalyPrediction>(anomalies.Transform(data), reuseRowObject: false);
Console.WriteLine($"flagged {scored.Count(p => p.IsAnomaly)} unusual customers");

static IEnumerable<Customer> LoadCustomers() => /* your data */ Array.Empty<Customer>();
public class Customer { public float OrdersPerMonth { get; set; } public float Basket { get; set; } }
public class ClusterPrediction { [ColumnName("PredictedLabel")] public uint ClusterId { get; set; } }
public class AnomalyPrediction { [ColumnName("PredictedLabel")] public bool IsAnomaly { get; set; } public float Score { get; set; } }
