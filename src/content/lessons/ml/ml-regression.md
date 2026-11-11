---
id: ml-regression
title: Regression: predicting a number
module: ml
level: Beginner
minutes: 75
goal: Train regression models that predict numbers, judge them with MAE, RMSE and R², and choose the right model complexity.
prereqs: ml-learning, d-features
reviewed: 2026-11-02
evidence: A regression model on a dataset you choose with MAE, RMSE and R² on a test set, compared with a baseline that predicts the average.
code: Python executed 2026-11-02 (examples/gap-topics/gap_topics.py regression); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
**Regression** predicts a number: a price, a delivery time, next month's energy use. **Linear regression** draws the best straight line (or flat surface) through the data. More flexible models, such as decision trees, boosted trees or polynomial curves, can follow bends. You judge regression with three numbers. **MAE** (mean absolute error) is the average size of a mistake, in the same units as the target ("we are 5,000 off on average"). **RMSE** (root mean squared error) punishes big mistakes more. **R²** says how much of the variation the model explains: 1 is perfect, 0 is no better than always predicting the average. The right complexity is the one with the best error on **test** data, not training data.

```diagram compare Regression and classification
## Regression | model
- Predicts a number
- Examples: a price, a delivery time, energy use
## Classification | process
- Picks a category
- Examples: spam or not spam, fraud or not
```

```diagram compare Simple and flexible regression models
note: Flexible models follow bends in the data, but too much flexibility memorises noise.
## Linear regression | process
- Best straight line or flat surface
- Simple and easy to explain
## Flexible models | model
- Decision trees, boosted trees, polynomial curves
- Can follow bends in the data
```

```diagram compare The three error measures
note: Smaller error is better for MAE and RMSE. R² is better the closer it is to 1.
## MAE | output
- Average size of a mistake
- Same units as the target
- Example: 5,000 off on average
## RMSE | warn
- Punishes big mistakes more
- Use when large errors are costly
## R² | model
- Share of the variation explained
- 1 is perfect
- 0 is no better than the average
```

## Real-world example
An energy supplier predicts each building's daily electricity use from temperature, day of week and building size, to buy the right amount of power a day ahead. Large mistakes are expensive, so they choose models by RMSE and check MAE to explain accuracy to managers.

```diagram fan Daily electricity use: inputs to one number
note: The supplier predicts each building's daily use and picks models by RMSE.
- Temperature, day of week, building size | The features | input
- Regression model | Learns from past days | model
- Predicted daily electricity use | One number per building | output
```

## How it works
1. Choose the target number and the features.
2. Split into training and test sets.
3. Baseline: always predict the training average.
4. Train a linear model, then more flexible ones.
5. Compare MAE, RMSE and R² on the test set; pick the simplest model that is clearly best.

```diagram flow Steps of a regression project
- Target and features | Choose the number to predict | input
- Split | Training set and test set | store
- Baseline | Always predict the training average | process
- Train models | Linear first, then more flexible | model
- Compare on test data | MAE, RMSE and R² | output
- Pick | The simplest model that is clearly best | output
```

```diagram compare Complexity: training error against test error
note: Matches the run below: training error keeps falling, test error is best at degree 3 and worst at degree 15.
## Too simple | warn
- Both errors stay fairly high
## Best on test data | output
- Test error is lowest
- Degree 3 in the run below
## Too complex | bad
- Training error is very low
- Test error rises: it memorised noise
- Degree 15 in the run below
```

## Python example
House prices (thousands) against size, 28 training and 12 test houses; polynomial degree controls how bendy the curve can be:
```python gap_topics.py regression (excerpt)
for deg in (1, 3, 9, 15):
    m = make_pipeline(StandardScaler(), PolynomialFeatures(deg), LinearRegression()).fit(x[tr], y[tr])
```
```text Output (executed)
degree  1: train RMSE   7.91 | test MAE    5.16 RMSE    6.45 R²  0.969
degree  3: train RMSE   7.46 | test MAE    4.74 RMSE    5.84 R²  0.975
degree  9: train RMSE   3.69 | test MAE    4.82 RMSE    6.22 R²  0.972
degree 15: train RMSE   3.01 | test MAE    6.94 RMSE    8.82 R²  0.943
```
Training error keeps falling as the curve gets bendier, but test error is best at degree 3 and worst at degree 15. Degree 15 memorises noise. Pick degree 3.

## .NET (C#) example
Regression in ML.NET with a boosted-tree trainer (packages `Microsoft.ML`, `Microsoft.ML.FastTree`):
```cs Program.cs
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
```
Swap `FastTree` for `Sdca` (linear) or `LightGbm` (package `Microsoft.ML.LightGbm`) and compare the same metrics.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### MAE and RMSE (average mistake size)
**Where it is used:** the test MAE and RMSE columns for house prices.

```formula MAE and RMSE
MAE  = (sum of |prediction - actual|) ÷ n
RMSE = square root of ( sum of (prediction - actual)^2 ÷ n )
```
**In plain words:** MAE is the average size of a mistake. RMSE squares the mistakes first, so large ones count more. Both are in the units of the target (thousands).

**Example 1: four houses.** Actual 200, 250, 300, 400; predicted 195, 260, 290, 380. Mistakes: −5, 10, −10, −20. MAE = (5 + 10 + 10 + 20) ÷ 4 = 11.25. RMSE = sqrt((25 + 100 + 100 + 400) ÷ 4) = sqrt(156.25) = 12.5.

**Example 2: same MAE, different RMSE.** Mistakes 5, 5, 5, 5 give MAE = 5 and RMSE = 5. Mistakes 0, 0, 0, 20 also give MAE = 20 ÷ 4 = 5, but RMSE = sqrt(400 ÷ 4) = 10. RMSE reveals the one large mistake.

### R² (how much variation is explained)
**Where it is used:** the R² column, which compares the model with always predicting the average.

```formula R squared
R² = 1 - (sum of (actual - prediction)^2) ÷ (sum of (actual - mean of actual)^2)
```
**In plain words:** 1 is perfect, 0 means no better than always guessing the average, and below 0 means worse than that.

**Example 1: a good model.** Actual 2, 4, 6, 8 (mean 5). Spread = 9 + 1 + 1 + 9 = 20. Predictions 3, 4, 6, 7 give mistakes 1, 0, 0, 1, so squared mistakes sum = 2. R² = 1 − 2 ÷ 20 = 0.90.

**Example 2: always the average.** Predicting 5 every time: squared mistakes sum = 9 + 1 + 1 + 9 = 20. R² = 1 − 20 ÷ 20 = 0.

**Example 3: worse than the average.** Predictions 8, 6, 4, 2: mistakes 6, 2, −2, −6, squares sum = 36 + 4 + 4 + 36 = 80. R² = 1 − 80 ÷ 20 = −3.

### The best straight line (least squares)
**Where it is used:** linear regression, the degree-1 model.

```formula Least squares line
slope = sum of (x - mean x)(y - mean y) ÷ sum of (x - mean x)^2
intercept = mean y - slope × mean x
prediction = intercept + slope × x
```
**In plain words:** the slope says how much the price rises for each extra square metre. The intercept makes the line pass through the average point.

**Example 1: fitting.** Sizes 50, 60, 70, 80 m² and prices 160, 190, 200, 230 (thousands). Mean x = 65, mean y = 195. Differences in x: −15, −5, 5, 15; in y: −35, −5, 5, 35. Sum of products = 525 + 25 + 25 + 525 = 1,100. Sum of squares of x differences = 225 + 25 + 25 + 225 = 500. Slope = 1,100 ÷ 500 = 2.2. Intercept = 195 − 2.2 × 65 = 52.

**Example 2: predicting.** A 75 m² house: 52 + 2.2 × 75 = 217 thousand. A 200 m² house would give 52 + 440 = 492, but the data only covers 50 to 80 m², so that prediction is a risky guess far outside what the model saw.

## Maths behind it
- Linear regression and least squares (linear algebra, statistics)
- Polynomial features
- Error metrics: MAE, RMSE, R² (statistics)
- Regularisation: ridge and lasso (optimisation)

## Common mistakes
- Choosing the model with the lowest training error.
- Reporting only R²; people understand "on average 5,000 off" (MAE) better.
- Predicting far outside the range of the training data (a 1,000 m² house when training stopped at 150).

## Quick check
Q: When is RMSE more useful than MAE?
A: When large mistakes are especially costly, because RMSE punishes them more.

Q: What does R² = 0 mean?
A: The model is no better than always predicting the average.

Q: Training error falls but test error rises as the model gets more complex. What should you do?
A: Choose the complexity where test error is lowest; beyond it the model is overfitting.
