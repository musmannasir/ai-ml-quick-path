---
id: ml-timeseries
title: Time-series forecasting
module: ml
level: Intermediate
minutes: 75
goal: Forecast values over time with trend and seasonality, beat simple baselines, and always test on the future.
prereqs: ml-regression, ml-evaluation
reviewed: 2026-11-02
evidence: A forecast for a series you choose, compared with naive and seasonal-naive baselines on a later period, with MAE for each.
code: Python executed 2026-11-02 (gap_topics.py timeseries); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
A **time series** is a measurement repeated over time: daily sales, hourly website visits, monthly energy use. **Forecasting** predicts the next values. Most series mix a **trend** (slowly going up or down), **seasonality** (patterns that repeat, like busy weekends or December), and random **noise**. Because order matters, you train on the past and test on the future, never with a random split. Every forecast must beat two simple **baselines**: "same as yesterday" (**naive**) and "same as the same day last week" (**seasonal naive**). Models then use **lag features** (the value 7 or 14 days ago), calendar features (weekday, holidays) and outside signals (weather, promotions). Common methods are exponential smoothing, ARIMA, gradient-boosted trees with lag features and, for many related series, neural forecasting models.

```diagram merge What a time series is made of
note: Most series mix these three parts.
- The series | Daily sales, hourly visits, monthly energy use | output
- Trend | Slowly going up or down | process
- Seasonality | Patterns that repeat, like busy weekends or December | model
- Noise | Random ups and downs | warn
```

```diagram compare Random split and time split
note: Order matters, so you train on the past and test on the future.
## Random split | bad
- Mixes past and future rows
- The model peeks at the future
## Time split | output
- Train before a date
- Test after it
```

```diagram compare The two baselines every forecast must beat
## Naive | process
- Same as yesterday
## Seasonal naive | model
- Same as the same day last week
```

```diagram fan Features for a forecasting model
- Forecasting model | Predicts the next values | model
- Lag features | The value 7 or 14 days ago | input
- Calendar features | Weekday, holidays | input
- Outside signals | Weather, promotions | input
```

```diagram layers Common forecasting methods
note: From simple to heavier. Gradient-boosted trees use lag features.
- Exponential smoothing | Simple method | process
- ARIMA | Classic statistical method | process
- Gradient-boosted trees with lag features | Tables of features built from the past | model
- Neural forecasting models | For many related series | model
```

## Real-world example
A grocery chain forecasts daily demand for each product in each store to order fresh food. Too much means waste; too little means empty shelves. Weekday, holiday and promotion features beat last year's spreadsheet rule, measured on the most recent months.

```diagram fan Grocery demand forecast
note: Too much stock means waste. Too little means empty shelves.
- Weekday, holiday and promotion features | Past demand plus calendar signals | input
- Daily demand forecast | One per product per store | output
- Order of fresh food | Avoids waste and empty shelves | output
```

## How it works
1. Plot the series; look for trend, seasonality, gaps and outliers.
2. Split by time: train before a date, test after it.
3. Compute naive and seasonal-naive forecasts.
4. Build features from the past only: lags, rolling averages, calendar features.
5. Train, forecast the test period, compare MAE with the baselines.
6. Repeat at several cut-off dates (walk-forward validation) before trusting it.

```diagram flow Forecasting steps
- Plot the series | Trend, seasonality, gaps, outliers | input
- Split by time | Train before a date, test after | store
- Baselines | Naive and seasonal naive | process
- Build features | Lags, rolling averages, calendar, from the past only | process
- Train and forecast | Then compare MAE with the baselines | model
- Walk-forward check | Repeat at several cut-off dates | output
```

```diagram loop Walk-forward validation
note: Trust the forecast only after it holds up at several cut-off dates.
- Choose a cut-off date | Train only on data before it | store
- Forecast after the date | Compare with what really happened | model
- Record MAE | Next to the baselines | output
loop: Move the cut-off date later and repeat
```

## Python example
A year of synthetic daily sales with a rising trend and a weekend peak; the last 60 days are the test period:
```text Output of gap_topics.py timeseries (executed)
naive (yesterday)                  MAE  27.45
seasonal naive (last week)         MAE   5.93
linear model with lags + weekday   MAE   5.60
test period: 2025-11-01 to 2025-12-30 (60 days)
```
"Yesterday" fails because Friday differs from Saturday. "Same day last week" already captures the weekly pattern and is hard to beat; the model improves on it a little, which is normal.
```python lag and weekday features (excerpt)
feats = pd.DataFrame({"lag7": s.shift(7), "lag14": s.shift(14), "t": np.arange(364)}, index=days)
feats = pd.concat([feats, pd.get_dummies(days.dayofweek, prefix="dow").set_index(days).astype(float)], axis=1).dropna()
```

## .NET (C#) example
ML.NET forecasting with singular spectrum analysis (package `Microsoft.ML.TimeSeries`):
```cs Program.cs
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
```
Always compare this forecast's MAE with "same day last week" on the most recent weeks.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### MAE of a forecast (comparing baselines)
**Where it is used:** the MAE of "same as yesterday" and "same as last week" on the test period.

```formula Mean absolute error (MAE)
MAE = (sum of |actual - forecast|) ÷ number of forecasts
naive forecast for a day          = value of the previous day
seasonal naive forecast for a day = value of the same weekday last week
```
**In plain words:** the average size of the forecast mistake, in the units of the series (units sold).

**Example 1: naive.** Actual sales: Thu 100, Fri 120, Sat 200, Sun 190. Naive forecasts for Fri, Sat, Sun are 100, 120, 200. Mistakes: 20, 80, 10. MAE = 110 ÷ 3 = 36.7.

**Example 2: seasonal naive.** The same days last week were Fri 118, Sat 205, Sun 185. Mistakes: 2, 5, 5. MAE = 12 ÷ 3 = 4.0. Using the weekly pattern cuts the mistake from 36.7 to 4.0 in this made-up week.

### Exponential smoothing (a forecast that fades old data)
**Where it is used:** the simple smoothing method listed with the common forecasting methods.

```formula Simple exponential smoothing
new forecast = α × latest actual value + (1 - α) × old forecast
(α, "alpha", is between 0 and 1)
```
**In plain words:** the forecast moves toward the latest value. A large α reacts fast; a small α changes slowly and smooths noise.

**Example 1: α = 0.5.** Old forecast 100, latest actual 120. New forecast = 0.5 × 120 + 0.5 × 100 = 60 + 50 = 110.

**Example 2: α = 0.1.** The same numbers: 0.1 × 120 + 0.9 × 100 = 12 + 90 = 102. The forecast barely moves, which is useful when the latest value may be noise.

### Percentage improvement over a baseline
**Where it is used:** reading the lesson's MAE table honestly.

```formula Improvement
improvement = (baseline MAE - new MAE) ÷ baseline MAE
```
**In plain words:** how much of the baseline's mistake the new method removes, as a share.

**Example 1: seasonal naive against naive.** (27.45 − 5.93) ÷ 27.45 = 21.52 ÷ 27.45 = 0.784, so 78% lower error.

**Example 2: the model against seasonal naive.** (5.93 − 5.60) ÷ 5.93 = 0.33 ÷ 5.93 = 0.056, only about 6% lower. A small gain over a strong baseline is normal.

## Maths behind it
- Trend and seasonal decomposition
- Autocorrelation and lag features
- Exponential smoothing, ARIMA (time-series statistics)
- Singular spectrum analysis
- Prediction intervals (statistics)

## Common mistakes
- Random train/test splits, which let the model see the future.
- A rolling average that includes the day being predicted (leakage).
- Forgetting holidays and promotions, which explain many spikes.

## Quick check
Q: Why must the test period come after the training period?
A: In real use you only know the past; a random split leaks future information into training.

Q: What is a seasonal naive forecast?
A: Predicting each value with the value one season earlier, such as the same weekday last week.

Q: Why show a forecast range, not only one number?
A: Planners need to know the uncertainty to decide safety stock or staffing.
