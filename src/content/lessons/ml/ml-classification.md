---
id: ml-classification
title: Classification: picking a category
module: ml
level: Beginner
minutes: 75
goal: Train a classifier, read its probabilities and confusion matrix, and choose a decision threshold that fits the business.
prereqs: ml-learning, d-features
reviewed: 2026-11-02
evidence: A text or tabular classifier with a confusion matrix, precision and recall, and a chosen threshold explained by the cost of each mistake.
code: Python executed 2026-11-02 (examples/spam-classifier/spam_classifier.py); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
**Classification** picks a category: spam or not, fraud or not, which product type, which language. With two categories it is **binary**; with more it is **multi-class**; when several labels can be true at once (a photo with a dog and a cat) it is **multi-label**. Most classifiers output a **probability** for each category, and a **threshold** turns it into a decision (spam if probability ≥ 0.5). The **confusion matrix** counts four outcomes: true positives (caught), false positives (false alarms), false negatives (missed) and true negatives. **Precision** asks "of what we flagged, how much was right?"; **recall** asks "of everything real, how much did we catch?". Moving the threshold trades one for the other, so you choose it from the cost of each mistake, not by habit.

```diagram compare Binary, multi-class and multi-label
## Binary | process
- Two categories
- Example: spam or not spam
## Multi-class | model
- More than two categories, one is true
- Example: which language
## Multi-label | output
- Several labels can be true at once
- Example: a photo with a dog and a cat
```

```diagram flow From probability to decision
note: The threshold is a choice you make from the cost of each mistake.
- Classifier | Outputs a probability for each category | model
- Probability | Example: how likely is spam | process
- Threshold | Spam if the probability reaches the threshold | warn
- Decision | Spam or not spam | output
```

```diagram matrix Confusion matrix: four possible outcomes
note: Precision asks: of what we flagged, how much was right? Recall asks: of everything real, how much did we catch?
x: Flagged as positive | Not flagged
y: Really positive | Really negative
- True positive | Caught | output
- False negative | Missed | bad
- False positive | False alarm | warn
- True negative | Correctly left alone | output
```

```diagram compare Precision and recall
## Precision | process
- Of what we flagged, how much was right?
- Falls when there are many false alarms
## Recall | model
- Of everything real, how much did we catch?
- Falls when real cases are missed
```

## Real-world example
A hospital triage tool flags patients at risk. Missing a sick patient is far worse than an extra check, so the team lowers the threshold to catch more real cases (higher recall), accepting more false alarms that a nurse reviews.

```diagram compare Moving the threshold in triage
note: Lowering the threshold gives higher recall and more false alarms. Raising it does the opposite.
## Lower threshold | output
- Catches more real cases (higher recall)
- More false alarms for a nurse to review
## Higher threshold | warn
- Fewer false alarms
- More sick patients missed
```

## How it works
1. Collect labelled examples; split train/test (keep class proportions with stratification).
2. Turn inputs into features (for text, TF-IDF or embeddings).
3. Train a classifier (logistic regression is a strong first choice).
4. Get probabilities on the test set; build the confusion matrix.
5. Pick a threshold from business costs; re-check precision and recall.

### Related concepts
Common text tasks that are classification or close to it:
- **Sentiment analysis**: is this review positive, negative or neutral?
- **Intent detection**: what does this customer message want (refund, delivery status, cancel)?
- **Named entity recognition (NER)**: label words that are names of people, companies, places, dates or amounts.
- **Bag of words** and **TF-IDF**: turn text into numbers by counting words (TF-IDF gives rare, informative words more weight). They are fast, strong baselines; embeddings and fine-tuned transformers usually do better on meaning.

```diagram fan Text tasks that are classification or close to it
- Text | A review, a message, a sentence | input
- Sentiment analysis | Positive, negative or neutral | output
- Intent detection | Refund, delivery status, cancel | output
- Named entity recognition | Label names of people, companies, places, dates, amounts | output
```

```diagram compare Turning text into numbers
## Bag of words | process
- Counts the words
- Fast, strong baseline
## TF-IDF | model
- Counts words, rare words weigh more
- Fast, strong baseline
## Embeddings and transformers | output
- Usually do better on meaning
```

## Python example
24 synthetic messages, 8 held out for testing:
```python spam_classifier.py (excerpt)
model = make_pipeline(TfidfVectorizer(lowercase=True), LogisticRegression(max_iter=1000))
model.fit(x_train, y_train)
proba = model.predict_proba(["Click now to claim your free prize"])[0][1]
```
```text Output (executed)
Training examples: 16, test examples: 8
Baseline  precision=0.00 recall=0.00
Model     precision=1.00 recall=1.00
Confusion matrix: TP=3 FP=0 FN=0 TN=5
New message: 'Click now to claim your free prize' -> spam (spam probability 0.59)
```
A perfect score on 8 test messages proves little: use hundreds of realistic examples. The probability 0.59 shows the model is unsure about a new message; borderline cases can go to a review queue.

## .NET (C#) example
```cs Program.cs
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
IDataView data = ml.Data.LoadFromTextFile<Message>("messages.tsv", hasHeader: true, separatorChar: '\t');
var split = ml.Data.TrainTestSplit(data, testFraction: 0.3);

var pipeline = ml.Transforms.Text.FeaturizeText("Features", nameof(Message.Text))
    .Append(ml.BinaryClassification.Trainers.SdcaLogisticRegression(labelColumnName: nameof(Message.IsSpam)));
var model = pipeline.Fit(split.TrainSet);

var m = ml.BinaryClassification.Evaluate(model.Transform(split.TestSet), labelColumnName: nameof(Message.IsSpam));
Console.WriteLine($"Precision {m.PositivePrecision:F2}  Recall {m.PositiveRecall:F2}  F1 {m.F1Score:F2}");
Console.WriteLine(m.ConfusionMatrix.GetFormattedConfusionTable());

var engine = ml.Model.CreatePredictionEngine<Message, SpamPrediction>(model);
var p = engine.Predict(new Message { Text = "Click now to claim your free prize" });
const float threshold = 0.3f;                 // chosen from business costs, not left at 0.5 by habit
Console.WriteLine($"probability {p.Probability:F2} -> {(p.Probability >= threshold ? "spam" : "not spam")}");

public class Message
{
    [LoadColumn(0)] public string Text { get; set; } = "";
    [LoadColumn(1)] public bool IsSpam { get; set; }
}
public class SpamPrediction { [ColumnName("PredictedLabel")] public bool IsSpam { get; set; } public float Probability { get; set; } }
```
For more than two categories use `ml.MulticlassClassification.Trainers` with a `MapValueToKey` step on the label.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Precision, recall and F1 (the confusion matrix in numbers)
**Where it is used:** judging the spam classifier from its counts of caught, false-alarm and missed messages.

```formula Precision, recall, F1
precision = TP ÷ (TP + FP)      (of what we flagged, how much was right)
recall    = TP ÷ (TP + FN)      (of the real ones, how many we caught)
F1 = 2 × precision × recall ÷ (precision + recall)
```
**In plain words:** TP = true positives (caught), FP = false positives (false alarms), FN = false negatives (missed). F1 is a single score that is high only when both precision and recall are high.

**Example 1: a normal model.** Out of 1,000 messages: TP = 30, FP = 10, FN = 20, TN = 940. Precision = 30 ÷ (30 + 10) = 0.75. Recall = 30 ÷ (30 + 20) = 0.60. F1 = 2 × 0.75 × 0.60 ÷ (0.75 + 0.60) = 0.90 ÷ 1.35 = 0.667.

**Example 2: a baseline that flags nothing.** TP = 0 and FP = 0, so precision = 0 ÷ 0 is undefined (tools report 0, as in the lesson's baseline). Recall = 0 ÷ (0 + FN) = 0. F1 = 0.

### The sigmoid function (score to probability, and the threshold)
**Where it is used:** logistic regression turns its score into the spam probability, and the threshold turns that into a decision.

```formula Sigmoid
probability = 1 ÷ (1 + e^(-score))
(e ≈ 2.718; a higher score gives a probability closer to 1)
```
**In plain words:** the sigmoid squeezes any score into a number between 0 and 1. A score of 0 means "50/50".

**Example 1: an undecided score.** Score = 0, so e^0 = 1 and probability = 1 ÷ (1 + 1) = 0.50.

**Example 2: a borderline message.** A score of 0.364 gives e^(−0.364) = 0.695, so probability = 1 ÷ (1 + 0.695) = 0.59, like the lesson's new message. At threshold 0.5 it is called spam (0.59 ≥ 0.5). At threshold 0.7 it is not (0.59 < 0.7), so the threshold choice changes the decision.

### Softmax (probabilities for more than two classes)
**Where it is used:** multi-class models, for example choosing between "billing", "technical" and "other".

```formula Softmax
probability of class i = e^(score i) ÷ (sum of e^(score) over all classes)
```
**In plain words:** softmax makes every score positive and rescales them so they add up to 1.

**Example 1: clear winner.** Scores 2, 1, 0 give e^2 = 7.389, e^1 = 2.718, e^0 = 1. Sum = 11.107. Probabilities: 7.389 ÷ 11.107 = 0.665, 2.718 ÷ 11.107 = 0.245, 1 ÷ 11.107 = 0.090. Check: 0.665 + 0.245 + 0.090 = 1.000.

**Example 2: a tie.** Scores 1, 1, 1 give three equal values of e^1, so each probability = 1 ÷ 3 = 0.333.

## Maths behind it
- Logistic regression and the sigmoid function
- Softmax (multi-class probabilities)
- Cross-entropy loss
- Confusion matrix, precision, recall, F1 (statistics)

## Common mistakes
- Using accuracy when one class is rare (see [Measuring models](lesson:ml-evaluation)).
- Leaving the threshold at 0.5 without asking what each mistake costs.
- Splitting without stratification, so the test set has almost no positives.

## Quick check
Q: Precision or recall: which matters more for a fraud screen followed by human review?
A: Usually recall: catching more fraud matters, and humans can clear the extra false alarms.

Q: What does a false negative mean for a spam filter?
A: A spam message that got through to the inbox.

Q: What changes when you lower the threshold from 0.5 to 0.3?
A: More items are flagged: recall usually rises and precision usually falls.
