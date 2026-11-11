// From lesson 'ml-timeseries' (ml). Code status: Python executed 2026-11-02 (gap_topics.py timeseries); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;
using Microsoft.ML.Transforms.TimeSeries;

var ml = new MLContext(seed: 0);
var history = LoadDailySales();                      // oldest first
IDataView data = ml.Data.LoadFromEnumerable(history);

var pipeline = ml.Forecasting.ForecastBySsa(
    outputColumnName: nameof(SalesForecast.Forecast), inputColumnName: nameof(DailySales.Sales),
    windowSize: 7, seriesLength: 56, trainSize: history.Count, horizon: 14,
    confidenceLevel: 0.95f,
    confidenceLowerBoundColumn: nameof(SalesForecast.Lower), confidenceUpperBoundColumn: nameof(SalesForecast.Upper));
var model = pipeline.Fit(data);

var engine = model.CreateTimeSeriesEngine<DailySales, SalesForecast>(ml);
var f = engine.Predict();
for (int day = 0; day < f.Forecast.Length; day++)
    Console.WriteLine($"day +{day + 1}: {f.Forecast[day]:F0} (range {f.Lower[day]:F0}–{f.Upper[day]:F0})");

static List<DailySales> LoadDailySales() => /* your data */ new();
public class DailySales { public float Sales { get; set; } }
public class SalesForecast { public float[] Forecast { get; set; } = []; public float[] Lower { get; set; } = []; public float[] Upper { get; set; } = []; }
