---
id: d-clean-eda
title: Cleaning and exploring data
module: data
level: Beginner
minutes: 90
maths: basic arithmetic
goal: Find and fix duplicates, missing values, impossible values and messy categories, and explore data with summaries and charts before modelling.
prereqs: d-basics
reviewed: 2026-11-02
updated: 2026-11-24
evidence: A cleaning report for a dataset you choose, listing each problem, how many rows it affected and what you decided, plus two charts with one finding each.
code: Python executed 2026-11-02 (examples/ml-basics/ml_basics.py quality, gap_topics.py viz)
---
## In plain words
Real data is messy. The same customer appears twice (**duplicates**). Some values are empty (**missing values**). Some are impossible, like a reply time of minus three minutes (**invalid values**) or a 2,000-minute wait (**outliers** that may be errors or real but rare). Categories are spelled differently ("Email", "email ", "e-mail"). **Cleaning** fixes these, and every fix is a decision you write down, because deleting rows can bias the data. **Exploratory data analysis (EDA)** means looking at the data before modelling: counts, averages, medians, and charts. A **histogram** shows how values are spread, a **bar chart** compares groups, a **scatter plot** shows how two numbers move together, and a **line chart** shows change over time. A good chart often reveals a problem that numbers hide, such as a sensor that stopped sending data in March.

```diagram compare Four kinds of messy data
## Repeated or empty | warn
- Duplicates | The same customer appears twice
- Missing values | Some values are empty
## Wrong or inconsistent | bad
- Invalid values and outliers | Like minus three minutes, or a 2,000-minute wait: may be errors or real but rare
- Messy categories | Email, email and e-mail
```

```visual A small table with four kinds of mess
file: messy-table
alt: A small made-up table of customers with highlighted problems: an empty city cell, a duplicated row for Ana, the city London written as london, and waiting times of minus 3 and 2000 minutes. Labels on the right name them: missing value, duplicate row, messy category, invalid value or outlier.
caption: Missing values, duplicates, inconsistent categories and invalid values are the four kinds of mess to find and fix before training.
```

```diagram compare Which chart to use
## Spread and groups | output
- Histogram | How values are spread
- Bar chart | Compares groups
## Relationships and time | model
- Scatter plot | How two numbers move together
- Line chart | Change over time
```

## Real-world example
A customer-service manager wants average reply times per channel. The raw export double-counts tickets that were reopened and contains negative times caused by a timezone bug. Cleaning changes the answer from "chat is slowest" to "email is slowest", which changes where the company hires new staff.

```diagram compare The reply-time answer before and after cleaning
## Raw export | bad
- Problems | Reopened tickets double-counted; negative times from a timezone bug
- Answer | Chat is slowest
## Cleaned data | output
- Fixes | Duplicates removed; impossible times handled
- Answer | Email is slowest
```

## How it works
1. Check size, column types and missing values.
2. Remove exact duplicates (after confirming they are duplicates).
3. Normalise text categories (trim spaces, lower case, map synonyms).
4. Check ranges against business rules; investigate, fix or flag impossible values.
5. Decide how to handle missing values: fill with a typical value, add an "unknown" category, or drop with a reason.
6. Explore: summaries (mean and median), group comparisons and charts.

```diagram flow The cleaning and exploring routine
- Check the basics | Size, types, missing values | input
- Remove duplicates | After confirming they are duplicates | process
- Normalise categories | Trim spaces, lower case, map synonyms | process
- Check ranges | Investigate, fix or flag impossible values | warn
- Handle missing values | Fill, add unknown, or drop with a reason | process
- Explore | Summaries, group comparisons, charts | output
```

```diagram compare Three ways to handle a missing value
note: Whichever you choose, write the decision down.
## Fill | process
- Fill with a typical value | Keeps the row
## Mark | model
- Add an unknown category | Keeps the row and shows it was empty
## Drop | warn
- Drop the row with a reason | Can bias the data if you drop too many
```

```maths The average (mean) of a few numbers
situation: An online store sells 2, 4 and 6 items on three days.
find: How many items does it sell on a typical day?
table: Day | Items sold
row: Monday | 2
row: Tuesday | 4
row: Wednesday | 6
step: Add the three days | 2 + 4 + 6 = 12
step: Divide by the number of days | 12 ÷ 3 = 4
result: The average is **4 items per day**.
formula: average = sum of the values ÷ number of values
why: Exploring data starts with numbers like this. "Average daily sales" is also a typical model input. Libraries call it the mean.
caution: An average hides the day-to-day differences. Sales of 4, 4 and 4 also average 4, but that is a very different shop from one that sells 0, 0 and 12.
widget: mean 2,4,6
try: Wednesday was a sale day and the store sold 30 items instead of 6. What is the new average, and is it still "typical"?
answer: 2 + 4 + 30 = 36, then 36 ÷ 3 = 12. No normal day sold anything close to 12 items. One unusual value pulled the average up. The middle value (the median) is still 4, which is why the median is often safer for messy data.
```

```maths Missing rate: how much of a column is empty
situation: A customer table has 20 rows. In 3 of them the "age" field is empty.
find: What share of the ages is missing?
step: Divide the empty rows by all rows | 3 ÷ 20 = 0.15 = 15%
result: **15%** of the ages are missing.
why: Before training, you check every column like this. A column that is 2% empty can usually be filled in. A column that is 60% empty may be better left out, or the reason it is empty may itself be useful information.
try: After you fix a broken import, only 1 age is still missing. What is the missing rate now?
answer: 1 ÷ 20 = 0.05 = 5%. The data did not change in the real world; the pipeline was losing values. Always ask why data is missing before deciding how to fill it.
```

## Live simulation
Cleaning choices change the numbers you report. Compare them on one small set.

```sim cln Missing values and an extreme value
question: What do the ways of handling missing values and extreme values do to a summary?
watch: Choose how to treat the two missing values. Hollow dots are the ones that were filled in.
watch: The solid line is the mean and the dashed line is the median.
watch: Remove the extreme value and see which summary moves.
try: outlier | Drop the missing values, remove the extreme value, and bring the mean below 36.
try: zero | Fill the missing values with zero and see what it does to the mean.
predict: One value in twenty is 120 while the rest are about 35. Which summary is least affected by it? | The mean | The median | Both the same
answer: 2 | The median is the middle value, so one extreme value barely moves it. The mean adds every value, so it is pulled toward the extreme one.
leaves-out: Twenty made-up monthly incomes with two missing and one extreme value. Real cleaning also asks why a value is missing and whether the extreme value is an error or a real case, which no formula can decide.
reference: examples/sim-apps/apps.py
```

## Python example
```python ml_basics.py quality (excerpt)
df = df.drop_duplicates("ticket_id")
df["channel"] = df["channel"].str.strip().str.lower().fillna("unknown")
bad = df[(df["minutes_to_reply"] < 0) | (df["minutes_to_reply"] > 24 * 60)]
```
```text Output (executed)
rows: 6 | duplicate ids: 1 | missing channel: 1
out-of-range reply times: [3, 5]
channels after cleaning: ['chat', 'email', 'phone', 'unknown']
```
Summaries and a histogram for 500 tickets (gap_topics.py viz):
```text Output (executed)
         count  mean   50%    max
channel                          
chat     264.0  32.7  27.4  132.2
email    236.0  29.5  23.2  105.4
chart saved: reply_times.png
```
The mean (32.7) is well above the median (50% = 27.4) because a few long waits pull it up. Report the median for "typical" waits.
```python histogram (matplotlib)
for ch, grp in df.groupby("channel"):
    ax.hist(grp["minutes"], bins=30, alpha=0.6, label=ch)
ax.set_xlabel("Minutes to first reply"); ax.set_ylabel("Tickets"); ax.legend()
```

## .NET (C#) example
Clean with LINQ before handing data to ML.NET:
```cs Program.cs
// Five made-up tickets so the sample runs as it is. In a real project this list comes from your database.
List<Ticket> tickets =
[
    new(1, "Email", 30), new(1, "Email", 30),      // the same ticket twice
    new(2, " chat ", 12), new(3, null, 45),        // untidy and missing channel names
    new(4, "chat", -5),                            // an impossible reply time
];

var cleaned = tickets
    .GroupBy(t => t.TicketId).Select(g => g.First())                       // remove duplicates
    .Select(t => t with { Channel = string.IsNullOrWhiteSpace(t.Channel)
                                    ? "unknown" : t.Channel.Trim().ToLowerInvariant() })
    .ToList();
var invalid = cleaned.Where(t => t.MinutesToReply is < 0 or > 24 * 60).Select(t => t.TicketId).ToList();
Console.WriteLine($"rows {cleaned.Count}, out-of-range ids: {string.Join(", ", invalid)}");

foreach (var g in cleaned.Where(t => !invalid.Contains(t.TicketId)).GroupBy(t => t.Channel))
{
    var sorted = g.Select(t => t.MinutesToReply).Order().ToList();
    Console.WriteLine($"{g.Key}: count {sorted.Count}, mean {sorted.Average():F1}, median {sorted[sorted.Count / 2]:F1}");
}

public record Ticket(int TicketId, string? Channel, double MinutesToReply);
```
For charts in .NET, use a charting library such as ScottPlot, or export the cleaned data and chart it in a notebook.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Mean and median (the "typical" value)
**Where it is used:** the first look at any column of data, and for filling missing values.

```formula Mean and median
mean   = (x1 + x2 + ... + xn) / n
median = the middle value after sorting (if n is even, the average of the two middle values)
```
**In plain words:** the mean adds everything up and shares it equally. The median is the middle of the sorted list. One extreme value pulls the mean but barely moves the median.

**Example 1: reply times.** Five tickets were answered in 4, 6, 7, 9 and 9 minutes. Mean = (4 + 6 + 7 + 9 + 9) / 5 = 35 / 5 = 7 minutes. Median = 7 (the middle of the sorted list).

**Example 2: one extreme value.** A sixth ticket took 120 minutes. Mean = (35 + 120) / 6 = 25.8 minutes, but the median is (7 + 9) / 2 = 8 minutes. The mean jumped by 18.8 minutes; the median moved by 1. This is why a median is safer when data has outliers.

### Standard deviation and the IQR rule (how spread out, and what is an outlier)
**Where it is used:** checking whether a value is unusual before deciding to remove or cap it.

```formula Spread and the outlier fence
standard deviation = square root of ( sum of (x - mean)^2 / n )
IQR = Q3 - Q1          (Q1 = 25th percentile, Q3 = 75th percentile)
upper fence = Q3 + 1.5 x IQR
lower fence = Q1 - 1.5 x IQR
```
**In plain words:** standard deviation is the typical distance from the mean. The IQR is the width of the middle half of the data; anything beyond 1.5 IQRs outside it is flagged for a look.

**Example 1: standard deviation.** Values 4, 6, 8 have mean 6. Distances from the mean are -2, 0 and +2; squares are 4, 0, 4; their average is 8 / 3 = 2.67; the square root is 1.63 minutes.

**Example 2: IQR fence.** Sorted reply times 2, 3, 4, 5, 6, 7, 8, 9: Q1 = 3.5, Q3 = 7.5, so IQR = 4. Upper fence = 7.5 + 6 = 13.5. A ticket that took 40 minutes is above the fence and is flagged; a ticket that took 12 is not.

## Maths behind it
- Descriptive statistics: mean, median, standard deviation, quantiles
- Distributions and skewness (statistics)
- Outlier detection rules such as the interquartile range (statistics)

## Common mistakes
- Deleting every row with a missing value and losing most of the data.
- Reporting the mean of skewed data (waiting times, prices) instead of the median.

```diagram compare Mean and median of the chat reply times
note: Numbers from the executed output in the Python example, in minutes.
## Mean | warn
- Chat mean | 32.7, pulled up by a few long waits
## Median | output
- Chat median | 27.4, the typical wait
```
- Cleaning by hand in a spreadsheet, so the steps cannot be repeated next month.

```diagram compare Hand cleaning or a script
## By hand in a spreadsheet | bad
- Result | The steps cannot be repeated next month
## In a script | output
- Result | Every step is written down and can be run again
```

## Quick check
Q: Why can the mean mislead for reply times?
A: A few very long waits pull it up; the median shows the typical wait.

Q: A reply time is −3 minutes. Should you just delete it?
A: Investigate first: it may come from a bug (such as time zones) that affects other rows too. Record the decision.

Q: Which chart shows how values of one number are spread?
A: A histogram.
