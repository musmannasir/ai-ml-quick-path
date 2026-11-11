---
id: s-what-is-ai
title: What AI, machine learning, deep learning and generative AI are
module: start
level: Beginner
minutes: 60
goal: Explain the difference between AI, machine learning, deep learning, generative AI and large language models, and name the four ways machines learn.
prereqs:
reviewed: 2026-11-02
evidence: A one-page note that sorts five products you use (for example a spam filter, a map app, a chat assistant) into the right AI family, with one sentence each.
code: Python executed 2026-11-02 (examples/quickpath/quickpath.py rules_vs_ml); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
**Artificial intelligence (AI)** is the big idea: computers doing tasks that normally need human judgement, such as reading, seeing, deciding or talking. Old AI used **rules written by people**: "if the email contains 'free prize', mark it as spam". **Machine learning (ML)** is a part of AI where the computer **learns the rules from examples** instead. You show it thousands of emails already marked spam or not spam, and it works out the pattern. **Deep learning** is a part of ML that uses large **neural networks**, which are very good with messy data such as photos, sound and text. **Generative AI** creates new content (text, images, code, audio). **Large language models (LLMs)** such as the ones behind chat assistants are generative deep-learning models trained on huge amounts of text. Think of nested boxes: AI ⊃ ML ⊃ deep learning ⊃ generative models ⊃ LLMs.

```diagram nest How the AI families fit inside each other
note: Each family is a smaller part of the one around it. A large language model is one kind of generative AI.
- Artificial intelligence | Any computer system doing a task that needs human judgement | input
- Machine learning | Systems that learn their rules from examples instead of being given them | process
- Deep learning | Machine learning with many-layered neural networks | model
- Generative AI | Deep learning that creates new text, images, audio or code | output
```

Machines learn in four main ways:
| Way of learning | What it gets | Everyday example |
|---|---|---|
| Supervised | Examples with the right answer (labels) | Emails marked spam / not spam |
| Unsupervised | Examples without answers; finds groups or oddities | Grouping customers by buying habits |
| Self-supervised | Hides part of the data and learns to fill it in | LLMs learning by predicting the next word |
| Reinforcement | Tries actions and gets rewards | A game agent, or tuning a chatbot from feedback |

```diagram compare The four ways machines learn
note: Same idea in each column: what the computer is given, and what it learns from.
## Supervised | input
- Gets | Examples with the right answer (labels)
- Example | Emails marked spam or not spam
## Unsupervised | process
- Gets | Examples without answers
- Example | Grouping customers by buying habits
## Self-supervised | model
- Gets | Data with part of it hidden
- Example | An LLM predicting the next word
## Reinforcement | output
- Gets | Rewards for the actions it tries
- Example | A game agent
```

```diagram compare Rules written by people or rules learned from examples
note: The spam example from the paragraph above.
## Old AI: hand-written rules | warn
- Who makes the rules | People
- Example | If the email contains free prize, mark it as spam
## Machine learning | model
- Who makes the rules | The computer, from examples
- Example | Thousands of emails already marked spam or not spam
```

## Real-world example
An email service started with hand-written spam rules. Spammers changed words, so the rules kept breaking and needed constant updates. Moving to machine learning meant the filter learned from millions of labelled emails and could be retrained every day as spam changed. Today the same company uses an LLM to summarise long emails: a generative model on top of the classic ML filter.

```diagram flow How the email service changed over time
note: Follows the story in the paragraph above.
- Hand-written spam rules | Spammers changed words, so the rules kept breaking | bad
- Machine-learning filter | Learned from millions of labelled emails, retrained every day | model
- LLM summaries on top | A generative model summarises long emails | output
```

## How it works
1. Decide the task: predict a number, pick a category, find patterns, generate content or choose actions.
2. Rules or learning? If the rules are simple and stable, write them. If they are fuzzy or change often, learn them from data.
3. For learning, collect examples (with answers for supervised learning).
4. Train a model: the computer adjusts itself until its answers match the examples.
5. Test on examples it has never seen, then use it, and keep checking it.

```diagram flow From a task to a working model
- Pick the task | Number, category, groups, new content or actions | input
- Rules or learning? | Stable simple rules: write them. Fuzzy or changing: learn them | process
- Collect examples | With answers for supervised learning | store
- Train | The computer adjusts itself until answers match the examples | model
- Test | Use examples the model has never seen | process
- Use and watch | Keep checking it after release | output
```

## Python example
A hand-written rule against a learned model on 240 synthetic messages (half spam). The model learns from 120 messages and is tested on the other 120:
```python quickpath.py rules_vs_ml (excerpt)
rule = np.array([1 if "free" in t else 0 for t in x_te])                       # hand-written rule
model = make_pipeline(TfidfVectorizer(), LogisticRegression()).fit(x_tr, y_tr)   # learned from examples
learned = model.predict(x_te)
```
```text Output (executed)
rule: contains 'free'  accuracy 0.42  spam caught 17/60  false alarms 26
learned model          accuracy 1.00  spam caught 60/60  false alarms 0
example message: 'final notice cash reward click the link' -> spam
```
The rule fails because normal messages also say "free" ("is the room free?") and most spam does not. The model learned many word patterns at once. Its perfect score is because template-made data is easy; real email is much harder, and you will see honest, imperfect scores in later lessons.

## .NET (C#) example
The same idea with **ML.NET**, Microsoft's machine-learning library for .NET (NuGet package `Microsoft.ML`):
```cs Program.cs
using Microsoft.ML;
using Microsoft.ML.Data;

var ml = new MLContext(seed: 0);
var messages = new[]
{
    new Message { Text = "claim your prize now click the link", IsSpam = true },
    new Message { Text = "please review the sprint notes on Monday", IsSpam = false },
    // ... add a few hundred labelled messages
};
IDataView data = ml.Data.LoadFromEnumerable(messages);

// Learn the rule instead of writing it: text -> numbers -> logistic regression.
var pipeline = ml.Transforms.Text.FeaturizeText("Features", nameof(Message.Text))
    .Append(ml.BinaryClassification.Trainers.SdcaLogisticRegression(labelColumnName: nameof(Message.IsSpam)));
var model = pipeline.Fit(data);

var engine = ml.Model.CreatePredictionEngine<Message, SpamPrediction>(model);
var result = engine.Predict(new Message { Text = "final notice cash reward click the link" });
Console.WriteLine($"Spam: {result.IsSpam} (probability {result.Probability:P0})");

public class Message { public string Text { get; set; } = ""; public bool IsSpam { get; set; } }
public class SpamPrediction
{
    [ColumnName("PredictedLabel")] public bool IsSpam { get; set; }
    public float Probability { get; set; }
}
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Accuracy (the share of answers that are right)
**Where it is used:** comparing a hand-written rule with a learned model on the same messages.

```formula Accuracy
accuracy = correct answers ÷ all answers
```
**In plain words:** count the answers that were right and divide by the number of answers. 1.00 means every answer was right.

**Example 1: the "free" rule.** In 120 test messages, 60 are spam. The rule catches 17 spam messages and wrongly flags 26 normal ones. Correct answers = 17 + (60 − 26) = 17 + 34 = 51. Accuracy = 51 ÷ 120 = 0.425, about 0.42.

**Example 2: a lazy rule.** A rule that always says "not spam" is right for the 60 normal messages and wrong for the 60 spam ones. Accuracy = 60 ÷ 120 = 0.50. Even this useless rule scores half, so always compare a model with a simple baseline.

### Probability (how likely something is)
**Where it is used:** a model's output, such as "spam probability 0.80", and the share of spam in the data.

```formula Probability
probability = number of cases where it happens ÷ number of possible cases
(always between 0 and 1; 0 = never, 1 = always)
```
**In plain words:** probability is a share written as a number between 0 and 1. A model that outputs 0.80 is saying "I think about 8 in 10 messages like this are spam".

**Example 1: spam in the data.** 60 of the 120 messages are spam, so the probability that a random message is spam = 60 ÷ 120 = 0.5.

**Example 2: flagged by the rule.** The "free" rule flags 17 + 26 = 43 messages, and only 17 of them are spam. The probability that a flagged message is really spam = 17 ÷ 43 = 0.395, about 0.40. So most flags are false alarms.

## Maths behind it
- Statistics and probability (models output probabilities)
- Optimisation (how a model adjusts itself during training)
- Linear algebra (how data and model weights are stored)

## Common mistakes
- Using machine learning when a simple rule would do. Rules are cheaper, clearer and easier to test.
- Thinking an LLM is the answer to every problem. Predicting a number from a table of data is usually done better and cheaper by classic ML.
- Trusting a model because it scored perfectly on easy or tiny test data.

```diagram compare Pick the simplest tool that fits
note: Based on the first two mistakes above.
## Simple stable rule | process
- Use it when | The rules are simple and stable
- Why | Cheaper, clearer and easier to test
## Classic machine learning | model
- Use it when | Predicting a number or category from a table of data
- Why | Usually better and cheaper than an LLM here
## LLM | output
- Use it when | You need to generate or understand language
- Why | Not the answer to every problem
```

## Quick check
Q: What is the difference between AI and machine learning?
A: AI is the overall goal of smart behaviour; machine learning is one way to get it, by learning patterns from examples instead of writing rules.

Q: How does an LLM learn during pretraining?
A: Self-supervised: it reads huge amounts of text and learns to predict the next word, so the text itself provides the answers.

Q: A shop wants to group customers by buying habits but has no labels. Which way of learning fits?
A: Unsupervised learning, such as clustering.
