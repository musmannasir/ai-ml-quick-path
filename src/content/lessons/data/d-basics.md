---
id: d-basics
title: Data basics: types, features, labels and splits
module: data
level: Beginner
minutes: 60
maths: basic arithmetic
goal: Recognise the main kinds of data, tell features from labels, and split data into training, validation and test sets.
prereqs: s-lifecycle
reviewed: 2026-11-02
updated: 2026-11-19
evidence: A table of three datasets from your own work or life, with their data type, features, label and how you would split them.
code: Python executed 2026-11-02 (quickpath.py data)
---
## In plain words
Data comes in a few shapes. **Tabular data** is rows and columns, like a spreadsheet of customers. **Text** is emails, tickets, documents. **Images** and **video** are grids of pixels. **Audio** is sound waves. **Time series** are measurements over time, like daily sales. Tabular data is **structured**; text, images and audio are **unstructured**. In a table, each **row** is one example (one house) and each **column** is one fact about it. The columns the model uses as input are **features** (size, rooms, city). The column you want to predict is the **label** or **target** (price). You never test a model on the data it learned from, so you **split** the data: a **training set** to learn from, a **validation set** to compare ideas, and a **test set** you open only once at the end, like a final exam.

```diagram compare Structured and unstructured data
## Structured | store
- Tabular data | Rows and columns, like a spreadsheet of customers
## Unstructured | input
- Text | Emails, tickets, documents
- Images and video | Grids of pixels
- Audio | Sound waves
## Over time | process
- Time series | Measurements over time, like daily sales
```

```diagram compare Features and label in a table
note: Each row is one example, such as one house.
## Features | input
- size, rooms, city | Columns the model uses as input
## Label (target) | output
- price | The column you want to predict
```

```diagram flow The three sets
- Training set | Learn from it | model
- Validation set | Compare ideas | process
- Test set | Open only once at the end, like a final exam | output
```

## Real-world example
An estate agency wants to suggest listing prices. Each past sale is one row; size, rooms, city and listing date are features; the final sale price is the label. They train on older sales and test on the most recent months, because that is how the model will be used: predicting the future from the past.

```diagram flow Splitting by time
note: Older sales to learn from, the most recent months to test on.
- Older sales | Train on these | model
- Cut-off date | Nothing after it is used for learning | warn
- Most recent months | Test on these | output
```

## How it works
1. Look at the data: what does one row (or one file) represent?
2. Pick the label: the thing you want to predict.
3. Pick features: information available **at prediction time**.
4. Check types: numbers, categories, dates, free text.
5. Split: common sizes are 70% train, 15% validation, 15% test; split by time when the future is what you predict.

```diagram bar A common split of the data
note: Illustrative proportions only: the common sizes named above.
- Train | 70 | model
- Validation | 15 | process
- Test | 15 | output
```

```maths Splitting data into training, validation and test sets
situation: You have 1,000 rows of data. You decide to use 70% for training, 15% for validation and 15% for the final test.
find: How many rows go into each set?
step: Training rows | 1,000 × 0.7 = 700
step: Validation rows | 1,000 × 0.15 = 150
step: Test rows (the same share) | 1,000 × 0.15 = 150
step: Check that nothing was lost | 700 + 150 + 150 = 1,000
result: **700** rows to learn from, **150** to choose settings with, **150** kept hidden for the final score.
why: A model must be judged on rows it has never seen. If a row is in both the training set and the test set, the score looks better than it really is. That mistake is called leakage.
try: You have only 500 rows and choose an 80 / 10 / 10 split. How many rows are in each set?
answer: 500 × 0.8 = 400 for training, 500 × 0.1 = 50 for validation and 50 for test. Check: 400 + 50 + 50 = 500. A test set of 50 rows is small, so its score will be jumpy.
```

## Live simulation
How you split data decides whether your test score means anything.

```sim spl Random split, time split and a leaked column
question: Why can a model score well on a test and still fail in real use?
watch: Choose how to hold back test days. A random split scatters them; a time split holds back the latest days.
watch: Choose what the model may look at. The extra column was worked out from the answer.
watch: Compare the error for each setting.
try: leak | Use the random split with the leaked column and get an error below 1.
try: time | Use the time split with the day number and see the error rise above the random split's.
predict: Which split gives a more honest idea of how the model will do on tomorrow's data? | A random split | A split by time | Both are the same
answer: 2 | In real use the model predicts days that have not happened. Holding back the latest days copies that. A random split lets each test day sit between training days, which is easier than the real task.
leaves-out: A made-up sales series with a trend and a weekly pattern, and a one-nearest-neighbour model that copies the closest training day. Real models are more flexible, but the lesson holds: split the way the model will be used, and never give it columns that come from the answer.
reference: examples/sim-apps/apps.py
```

## Python example
```python quickpath.py data (excerpt)
df = pd.DataFrame({
    "size_m2": [52, 75, 110, 64, None, 95], "rooms": [2, 3, 4, 2, 3, 4],
    "city": ["Lisbon", "Porto", "Lisbon", "Braga", "Porto", "Lisbon"],
    "listed_on": pd.to_datetime(["2026-01-10", "2026-02-03", "2026-02-20", "2026-03-01", "2026-03-15", "2026-04-02"]),
    "price_k": [210, 245, 430, 150, 260, 390]})          # the label
print(df.dtypes); print(df.shape, df.isna().sum().to_dict())
```
```text Output (executed)
size_m2             float64
rooms                 int64
city                    str
listed_on    datetime64[us]
price_k               int64
shape (6, 5) | missing values per column: {'size_m2': 1, 'rooms': 0, 'city': 0, 'listed_on': 0, 'price_k': 0}
features: ['size_m2', 'rooms', 'city', 'listed_on'] | label: price_k
```
Already you can see a numeric column, a category, a date and one missing value to deal with later.

## .NET (C#) example
In .NET a row is a class, and ML.NET loads a file into an `IDataView`:
```cs Program.cs
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
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Split sizes (training, validation and test sets)
**Where it is used:** dividing a table of examples so the test set stays unseen until the end.

```formula Split sizes
rows in a set = all rows × that set's share
(the shares add up to 1, for example 0.6 + 0.2 + 0.2)
```
**In plain words:** multiply the total by each share. A test set that is too small gives a shaky score.

**Example 1: a normal split.** 1,000 house listings split 60% / 20% / 20%: training = 1,000 × 0.6 = 600, validation = 1,000 × 0.2 = 200, test = 1,000 × 0.2 = 200. Total = 600 + 200 + 200 = 1,000.

**Example 2: a tiny table.** The 6-row example table can only give 1 row to a test set (1 ÷ 6 = 0.167, about 17%). With one test house, the model is either 100% right or 100% wrong, so the score tells you almost nothing. Small data needs more care, such as cross-validation (see [Measuring models](lesson:ml-evaluation)).

### Stratified sampling (keeping class shares equal)
**Where it is used:** splitting data whose label is rare, such as customers who leave.

```formula Stratified share
rows of a class in a part = part size × class share in the whole data
```
**In plain words:** a stratified split gives every part the same mix of classes as the whole data. A plain random split can be unlucky.

**Example 1: stratified.** 1,000 customers, 10% leave (100 leavers). An 80/20 split has a test part of 200. Leavers in test = 200 × 0.10 = 20, and in training = 800 × 0.10 = 80. Check: 20 + 80 = 100.

**Example 2: an unlucky random split.** A random split puts only 12 leavers in the test part. Their share = 12 ÷ 200 = 0.06, or 6%, instead of 10%. The test set now under-represents leavers, so the recall score is based on too few cases.

## Maths behind it
- Sampling and stratified sampling (statistics)
- Data types: continuous, discrete and categorical variables (statistics)

## Common mistakes
- Using a feature you would not have at prediction time (for example "final sale date" to predict the price at listing).
- Testing on the training data, which hides overfitting.
- Splitting randomly when you will predict the future; split by time instead.

```diagram compare Features you can and cannot use
note: Example from the first mistake above.
## Available at prediction time | output
- Size, rooms, city, listing date | Known when the price is suggested
## Not available yet | bad
- Final sale date | Leaks the future into the model
```

## Quick check
Q: In a churn table, what is the label?
A: Whether the customer left (churned); the other columns describing the customer are features.

Q: Why keep a test set you only use once?
A: If you look at it repeatedly while making choices, you tune to it and its score stops being an honest estimate.

Q: Name two kinds of unstructured data.
A: Any two of text, images, audio or video.
