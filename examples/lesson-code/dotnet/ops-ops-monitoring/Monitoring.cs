// From lesson 'ops-monitoring' (ops). Code status: Python executed 2026-11-02 (ml_basics.py drift; applied_basics.py latency); C# not compiled (no .NET SDK in the build environment)
using System.Diagnostics.Metrics;

public static class Drift
{
    // Population stability index between training values and live values.
    public static double Psi(double[] expected, double[] actual, int bins = 10)
    {
        double min = expected.Min(), max = expected.Max(), width = (max - min) / bins;
        double Share(double[] v, int b) => Math.Max(1e-4, v.Count(x =>
            Math.Clamp((int)((x - min) / width), 0, bins - 1) == b) / (double)v.Length);
        double psi = 0;
        for (int b = 0; b < bins; b++)
        {
            double e = Share(expected, b), a = Share(actual, b);
            psi += (a - e) * Math.Log(a / e);
        }
        return psi;
    }
}

public sealed class ModelMetrics
{
    private static readonly Meter Meter = new("Churn.Model");
    private readonly Histogram<double> _latency = Meter.CreateHistogram<double>("prediction.latency", "ms");
    private readonly Counter<long> _tokens = Meter.CreateCounter<long>("llm.tokens");

    public void RecordPrediction(double ms, string modelVersion) =>
        _latency.Record(ms, new KeyValuePair<string, object?>("model_version", modelVersion));
    public void RecordTokens(long count, string kind) =>
        _tokens.Add(count, new KeyValuePair<string, object?>("kind", kind));   // kind: input or output
}
// A scheduled job computes Drift.Psi(trainingTenure, lastWeekTenure) and raises an alert above 0.25.
