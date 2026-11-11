---
id: d-features
title: Feature engineering: turning raw data into model inputs
module: data
level: Intermediate
minutes: 90
goal: Encode categories, scale numbers, create useful features from dates and text, and avoid data leakage by using pipelines.
prereqs: d-clean-eda
reviewed: 2026-11-02
evidence: A pipeline that prepares a mixed dataset (numbers, categories, dates, text) and one new feature that measurably improves a model.
code: Python executed 2026-11-02 (ml_basics.py features); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
Models only understand numbers, so you must turn raw columns into numeric **features**. **One-hot encoding** turns a category such as plan = basic/pro/team into three yes/no columns. **Scaling** puts numbers on similar ranges so a column measured in thousands does not drown out one measured in single digits. **Derived features** add meaning: "days since sign-up" from a date, "orders per month" from two counts, "hour of day" from a timestamp. **Text features** turn words into numbers, for example by counting important words (TF-IDF) or, later in this guide, with embeddings. The biggest danger is **data leakage**: letting information from the test set, or from the future, sneak into training. Wrapping all steps in a **pipeline** that is fitted on training data only prevents it. Good features usually help more than switching algorithms.

```diagram fan Raw columns become numeric features
note: Each column type gets its own transformation.
- Raw data | Columns of different types | input
- Category | One-hot encoding: yes/no columns | process
- Number | Scaling: similar ranges | process
- Date | Derived features such as days since sign-up | process
- Text | TF-IDF word weights or embeddings | process
```

```diagram compare One-hot encoding of the plan column
note: Matches the executed output in the Python example: one column became three.
## Before | input
- plan | basic, pro or team
## After | output
- plan_basic | yes or no
- plan_pro | yes or no
- plan_team | yes or no
```

```diagram compare Leaky and safe preparation
## Data leakage | bad
- What happens | Information from the test set or the future sneaks into training
## Pipeline fitted on training data only | output
- What happens | Steps learn from training data and are then applied unchanged
```

## Real-world example
A software company predicts which trial users will buy. Raw data has a sign-up date and a count of logins. Adding "logins per week since sign-up" and "used the export feature: yes/no" raises the model's quality more than trying five different algorithms did.

```diagram flow Features added in the trial-user example
- Raw data | Sign-up date and a count of logins | input
- Derived feature | Logins per week since sign-up | process
- Yes/no feature | Used the export feature | process
- Better model | Higher quality than trying five algorithms | output
```

## How it works
1. List columns and their types.
2. Choose a transformation per type: one-hot for categories, scaling for numbers, date parts for dates, TF-IDF or embeddings for text.
3. Create derived features from business knowledge.
4. Put all steps in one pipeline with the model.
5. Fit the pipeline on training data only; apply it unchanged to validation, test and production data.

```diagram lanes Fit once, apply everywhere
## Training data
- Fit the pipeline | Steps learn their settings here only | model
- Train the model | On the transformed training data | process
## Other data
- Validation and test data | Apply the fitted pipeline unchanged | input
- Production data | Apply the same fitted pipeline | output
```

## Python example
```python ml_basics.py features (excerpt)
df["tenure_days"] = (pd.Timestamp("2026-10-30") - df["signup"]).dt.days   # derived feature
ct = ColumnTransformer([("plan", OneHotEncoder(), ["plan"]),
                        ("num", StandardScaler(), ["seats", "tenure_days"])])
X = ct.fit_transform(df)
```
```text Output (executed)
feature names: ['plan__plan_basic', 'plan__plan_pro', 'plan__plan_team', 'num__seats', 'num__tenure_days']
shape: (4, 5)
```
The one plan column became three yes/no columns, and the date became a number of days. In real projects add `OneHotEncoder(handle_unknown="ignore")` so a new plan name in production does not crash the pipeline.

## .NET (C#) example
ML.NET chains the same transformations into one pipeline:
```cs Program.cs
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
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Z-score scaling (putting numbers on a similar range)
**Where it is used:** the StandardScaler step for columns such as seats and tenure_days.

```formula Z-score
z = (x - mean) ÷ standard deviation
standard deviation = square root of ( sum of (x - mean)^2 ÷ n )
```
**In plain words:** a z-score says how many standard deviations a value is from the average. After scaling, every column has average 0 and similar spread.

**Example 1: seats.** Seats in four accounts: 2, 4, 6, 8. Mean = 20 ÷ 4 = 5. Distances: −3, −1, 1, 3; squares: 9, 1, 1, 9; average of squares = 20 ÷ 4 = 5; standard deviation = sqrt(5) = 2.236. The z-score of 8 = (8 − 5) ÷ 2.236 = 1.34, and of 2 = −1.34.

**Example 2: a new customer in production.** Use the mean and deviation learned from the training data (5 and 2.236), never ones recomputed on new data. A new account with 10 seats has z = (10 − 5) ÷ 2.236 = 2.24. Computing the mean on the test set would be data leakage.

### TF-IDF (giving rare words more weight)
**Where it is used:** turning messages into numbers for the spam model.

```formula TF-IDF (simple version)
tf  = times the word appears in the message ÷ words in the message
idf = ln( total messages ÷ messages that contain the word )
tf-idf = tf × idf
```
**In plain words:** a word is important if it is common in this message but rare across all messages. ln is the natural logarithm. scikit-learn adds smoothing and length scaling, so its numbers differ a little, but the idea is the same.

**Example 1: a rare word.** There are 100 messages and "free" appears in 10. A message has 10 words, and "free" appears 2 times. tf = 2 ÷ 10 = 0.2. idf = ln(100 ÷ 10) = ln(10) = 2.303. tf-idf = 0.2 × 2.303 = 0.46.

**Example 2: a word in every message.** "the" appears in all 100 messages and 3 times in a 10-word message. tf = 0.3. idf = ln(100 ÷ 100) = ln(1) = 0. tf-idf = 0.3 × 0 = 0. A word that is everywhere tells you nothing.

## Maths behind it
- Standardisation (z-scores) and normalisation (statistics)
- One-hot encoding as vectors (linear algebra)
- TF-IDF term weighting (information retrieval)

## Common mistakes
- Fitting the scaler or encoder on all data before splitting: data leakage.
- Creating a feature from information that arrives after the prediction is made (for example "refund issued" to predict complaints).
- Encoding categories as 1, 2, 3, which tells the model a false order.

```diagram compare Numbering or one-hot
## Numbering 1, 2, 3 | bad
- Result | Implies an order and distance, as if team were 3 times basic
## One-hot columns | output
- Result | Each category is treated as separate
```

## Quick check
Q: Why one-hot encode a category instead of numbering it?
A: Numbers imply an order and distance (team is "3 times" basic); one-hot columns treat each category as separate.

Q: How does a pipeline prevent data leakage?
A: Every step learns its settings from training data only and is then applied unchanged to other data.

Q: Give one useful feature you could derive from a sign-up date.
A: Days since sign-up (tenure), or the day of the week or month the customer joined.
