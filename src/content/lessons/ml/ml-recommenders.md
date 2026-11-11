---
id: ml-recommenders
title: Recommender systems
module: ml
level: Intermediate
minutes: 75
goal: Build a collaborative-filtering recommender with matrix factorisation, compare it with simple baselines, and list the real-world issues (cold start, ranking, diversity).
prereqs: ml-evaluation
reviewed: 2026-11-02
evidence: A recommender on rating or click data with held-out error against two baselines and top-5 recommendations for three users.
code: Python executed 2026-11-02 (gap_topics.py recsys); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
A **recommender system** suggests items a person is likely to want: products, films, songs, articles, jobs. **Content-based** recommenders use item descriptions ("you liked thrillers, here is another thriller"). **Collaborative filtering** uses behaviour: people who liked the same things before will probably agree again. **Matrix factorisation** is the classic collaborative method. Picture a huge table of users and items, mostly empty. The model learns a short list of hidden "taste" numbers for every user and every item, so that combining them predicts the missing cells. Modern systems mix both approaches, use **implicit feedback** (clicks, watch time) more than star ratings, and handle **cold start**: new users and new items with no history yet. Embedding-based retrieval (Part 6) is also used for recommendations.

```diagram compare Content-based and collaborative filtering
## Content-based | process
- Uses item descriptions
- You liked thrillers, so here is another thriller
## Collaborative filtering | model
- Uses behaviour
- Similar people will probably agree again | They liked the same things before
```

```diagram matrix Matrix factorisation: the user and item table
note: The table is mostly empty. The model fills the empty cells.
x: Item A | Item B
y: User 1 | User 2
- Known rating | A cell we can see | store
- Empty cell | Predicted from hidden taste numbers | warn
- Empty cell | Predicted from hidden taste numbers | warn
- Known rating | A cell we can see | store
```

```diagram merge Hidden taste numbers predict a missing cell
- Predicted rating | The missing cell | output
- User taste numbers | A short hidden list for the user | model
- Item taste numbers | A short hidden list for the item | model
```

```diagram compare Explicit and implicit feedback
## Star ratings | process
- Explicit: the person says how much they liked it
## Clicks and watch time | model
- Implicit feedback
- Used more than star ratings in modern systems
```

```diagram compare Cold start
## New users | warn
- No history yet
## New items | warn
- No history yet
## What helps | output
- Content features and popularity | Used until people start interacting
```

## Real-world example
A streaming service shows each person a short row of titles. Collaborative filtering finds patterns no editor could write by hand; new releases are placed with content features and popularity until people start watching them.

## How it works
1. Collect interactions: user, item, rating or click, time.
2. Hold out recent interactions per user for testing.
3. Baselines: overall average rating and each item's average.
4. Train matrix factorisation on known interactions.
5. Measure error on held-out ratings, then rank unseen items for each user.
6. Check ranking quality (precision@k), diversity and fairness to new items.

```diagram flow Building a recommender
- Collect interactions | User, item, rating or click, time | input
- Hold out recent ones | Per user, for testing | store
- Baselines | Overall average and each item's average | process
- Train matrix factorisation | On the known interactions | model
- Measure and rank | Error on held-out ratings, then rank unseen items | output
- Check quality | Precision at k, diversity, fairness to new items | warn
```

```diagram layers From data to a user's list
- Known interactions | Mostly empty user and item table | store
- Learned taste numbers | For every user and item | model
- Predicted scores for unseen items | Fill the empty cells | process
- Ranked top items | What the person sees | output
```

## Python example
60 users, 40 items, about 30% of ratings known (synthetic):
```text Output of gap_topics.py recsys (executed)
held-out RMSE: global mean 1.306 | item mean 1.362 | matrix factorisation 1.030
top-3 unseen items for user 0: [29, 23, 15] predicted [4.98, 4.62, 4.61] true [5.0, 5.0, 4.7]
```
Matrix factorisation clearly beats both baselines, and user 0 really liked the three recommended items. The item-average baseline is a little worse than the global average because many items have only a few ratings, so their averages are noisy.
```python core update (excerpt)
err = full[u, i] - (mu + bu[u] + bi[i] + U[u] @ V[i])
U[u], V[i] = U[u] + 0.02 * (err * V[i] - 0.05 * U[u]), V[i] + 0.02 * (err * U[u] - 0.05 * V[i])
```

## .NET (C#) example
Matrix factorisation in ML.NET (package `Microsoft.ML.Recommender`):
```cs Program.cs
using Microsoft.ML;
using Microsoft.ML.Trainers;

var ml = new MLContext(seed: 0);
IDataView ratings = ml.Data.LoadFromEnumerable(LoadRatings());
var split = ml.Data.TrainTestSplit(ratings, testFraction: 0.2);

var options = new MatrixFactorizationTrainer.Options
{
    MatrixColumnIndexColumnName = "UserKey", MatrixRowIndexColumnName = "ItemKey",
    LabelColumnName = nameof(Rating.Label), NumberOfIterations = 30, ApproximationRank = 8,
};
var pipeline = ml.Transforms.Conversion.MapValueToKey("UserKey", nameof(Rating.UserId))
    .Append(ml.Transforms.Conversion.MapValueToKey("ItemKey", nameof(Rating.ItemId)))
    .Append(ml.Recommendation().Trainers.MatrixFactorization(options));
var model = pipeline.Fit(split.TrainSet);

var m = ml.Regression.Evaluate(model.Transform(split.TestSet), labelColumnName: nameof(Rating.Label));
Console.WriteLine($"held-out RMSE {m.RootMeanSquaredError:F3}");

var engine = ml.Model.CreatePredictionEngine<Rating, RatingPrediction>(model);
var top = Enumerable.Range(1, 40).Select(item => (item, engine.Predict(new Rating { UserId = 1, ItemId = item }).Score))
    .OrderByDescending(x => x.Score).Take(3);
Console.WriteLine(string.Join(", ", top.Select(t => $"item {t.item}: {t.Score:F2}")));

static IEnumerable<Rating> LoadRatings() => /* your data */ Array.Empty<Rating>();
// The rating column is called Label because the trainer writes its prediction to a column called Score.
public class Rating { public float UserId { get; set; } public float ItemId { get; set; } public float Label { get; set; } }
public class RatingPrediction { public float Score { get; set; } }
```
In production, filter out items the user has already seen before ranking.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### RMSE (how far predicted ratings are from real ones)
**Where it is used:** comparing matrix factorisation with the global-mean and item-mean baselines on held-out ratings.

```formula Root mean squared error (RMSE)
RMSE = square root of ( sum of (predicted - actual)^2 ÷ n )
```
**In plain words:** square each rating mistake, average, then take the square root. The result is in rating stars. Lower is better.

**Example 1: a baseline.** Three held-out ratings are 5, 3, 4. The global-mean baseline predicts 3.5 for all. Mistakes: −1.5, 0.5, −0.5. Squares: 2.25, 0.25, 0.25. Sum = 2.75; ÷ 3 = 0.917; square root = 0.957.

**Example 2: a better model.** Predictions 4.8, 3.2, 3.9. Mistakes: −0.2, 0.2, −0.1. Squares: 0.04, 0.04, 0.01. Sum = 0.09; ÷ 3 = 0.03; square root = 0.173. Much lower, so much closer to the real ratings.

### The dot product of "taste" lists (predicting one rating)
**Where it is used:** the line err = full[u, i] − (mu + bu[u] + bi[i] + U[u] @ V[i]).

```formula Predicted rating
prediction = mean + user bias + item bias + (user taste · item taste)
user taste · item taste = u1 × v1 + u2 × v2 + ...
```
**In plain words:** multiply matching taste numbers and add them up. Matching tastes give a high result and opposite tastes give a low one. The biases handle users who rate high and items that are popular.

**Example 1: matching tastes.** Mean 3.5, user bias +0.3, item bias −0.2, user taste (1.0, 0.5), item taste (0.8, −0.4). Dot product = 1.0 × 0.8 + 0.5 × (−0.4) = 0.8 − 0.2 = 0.6. Prediction = 3.5 + 0.3 − 0.2 + 0.6 = 4.2.

**Example 2: opposite tastes.** Same user, item taste (−0.8, 0.4). Dot product = −0.8 + 0.2 = −0.6. Prediction = 3.5 + 0.3 − 0.2 − 0.6 = 3.0.

### Precision@k and recall@k (judging a top list)
**Where it is used:** checking the top-3 or top-5 items shown to a user.

```formula Precision@k and recall@k
precision@k = relevant items in the top k ÷ k
recall@k    = relevant items in the top k ÷ all relevant items
```
**In plain words:** precision@k asks how much of the list is useful. Recall@k asks how much of what the user would like you found.

**Example 1: top 3.** All 3 recommended items were liked: precision@3 = 3 ÷ 3 = 1.0.

**Example 2: top 5.** 2 of 5 shown items are liked, and the user likes 4 items in total. Precision@5 = 2 ÷ 5 = 0.4. Recall@5 = 2 ÷ 4 = 0.5.

## Maths behind it
- Matrix factorisation and low-rank approximation (linear algebra)
- Dot products and embeddings
- Stochastic gradient descent with regularisation (optimisation)
- Ranking metrics: precision@k, recall@k, NDCG

## Common mistakes
- Testing on interactions older than the training data.
- Recommending only popular items, so niche items never get a chance.
- Ignoring cold start for new users and items.

## Quick check
Q: Content-based versus collaborative filtering?
A: Content-based uses item features; collaborative filtering uses patterns in many users' behaviour.

Q: What is the cold-start problem?
A: New users or items have no history, so collaborative filtering cannot place them; use content features or popularity first.

Q: What do the hidden numbers learned by matrix factorisation represent?
A: Taste dimensions for users and matching characteristics for items; combining them predicts preference.
