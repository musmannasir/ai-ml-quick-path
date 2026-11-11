// From lesson 'd-features' (data). Code status: Python executed 2026-11-02 (ml_basics.py features); C# not compiled (no .NET SDK in the build environment)
using Microsoft.ML;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromEnumerable(LoadSubscriptions());

var pipeline = ml.Transforms.Categorical.OneHotEncoding("PlanEncoded", nameof(Subscription.Plan))
    .Append(ml.Transforms.NormalizeMeanVariance(nameof(Subscription.Seats)))            // scaling
    .Append(ml.Transforms.NormalizeMeanVariance(nameof(Subscription.TenureDays)))
    .Append(ml.Transforms.Text.FeaturizeText("NotesFeatures", nameof(Subscription.Notes))) // text -> numbers
    .Append(ml.Transforms.Concatenate("Features", "PlanEncoded", nameof(Subscription.Seats),
                                      nameof(Subscription.TenureDays), "NotesFeatures"));
var prepared = pipeline.Fit(data);   // fit on TRAINING data only; reuse the fitted pipeline everywhere else

static IEnumerable<Subscription> LoadSubscriptions() => new[]
{
    new Subscription { Plan = "basic", Seats = 1, TenureDays = DaysSince(new DateTime(2026, 1, 5)), Notes = "asked about export" },
    new Subscription { Plan = "team", Seats = 20, TenureDays = DaysSince(new DateTime(2026, 9, 15)), Notes = "" },
};
static float DaysSince(DateTime d) => (float)(new DateTime(2026, 10, 30) - d).TotalDays;   // derived feature

public class Subscription
{
    public string Plan { get; set; } = "";
    public float Seats { get; set; }
    public float TenureDays { get; set; }
    public string Notes { get; set; } = "";
}
