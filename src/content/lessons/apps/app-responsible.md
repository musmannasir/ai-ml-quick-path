---
id: app-responsible
title: Responsible AI: fairness, privacy, transparency and oversight
module: apps
level: Intermediate
minutes: 60
goal: Measure fairness between groups, protect privacy, explain decisions, keep people in control, and document models with model cards and risk registers.
prereqs: ml-evaluation, app-security
reviewed: 2026-11-02
evidence: A risk register and a fairness check (approval rates and error rates by group) for one of your models, with an owner for each risk.
code: Python executed 2026-11-02 (quickpath.py fairness); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
Responsible AI means building systems that are fair, safe, private and accountable, and it is part of engineering, not an extra step. **Fairness**: errors and benefits should not fall unfairly on some groups. Two simple checks are **demographic parity** (do groups get approved at similar rates?) and **equal opportunity** (among people who truly qualify, are groups approved at similar rates?). **Privacy**: collect and send only the data you need, with a lawful basis and consent where required. **Transparency**: tell people when they deal with AI, and explain important decisions. **Human oversight**: people can review, override and appeal. **Accountability**: every system has an owner, monitoring and an incident plan. Document with a **model card** (intended use, data, results, limits) and a **risk register**. Laws are growing; examples include data-protection laws such as the GDPR in Europe and the EU AI Act, which sets rules by risk level, so involve legal and privacy colleagues for real deployments.

```diagram compare Five parts of responsible AI
## Fairness | process
- Errors and benefits not unfair to some groups
## Privacy | process
- Only the data you need
- Lawful basis and consent
## Transparency | process
- Tell people it is AI
- Explain important decisions
## Human oversight and accountability | process
- People can review, override, appeal
- Every system has an owner and a plan
```

```diagram compare Two simple fairness checks
note: Both compare groups. They ask about different people.
## Demographic parity | process
- Looks at everyone
- Do groups get approved at similar rates?
## Equal opportunity | process
- Looks only at people who truly qualify
- Are groups approved at similar rates?
```

```diagram layers Documents that keep a system accountable
- Model card | intended use, data, results, limits | output
- Risk register | each risk with an owner | output
- Regulation | GDPR data protection and the EU AI Act, which sets rules by risk level | warn
```

## Real-world example
A lender's credit model approved one group less often even among applicants who later repaid. The team found that a location feature acted as a proxy for a protected characteristic, removed it, measured the small accuracy cost, and documented the decision in the model card for the regulator.

```diagram flow The lender story
- Finding | one group approved less often, even among applicants who later repaid | warn
- Cause | a location feature acted as a proxy for a protected characteristic | warn
- Fix | removed the feature, measured the small accuracy cost | process
- Record | decision documented in the model card for the regulator | output
```

## How it works
1. Describe the use, the people affected and the decisions made.
2. List data sources, consent basis and personal data; minimise.
3. Measure performance and error rates by group; investigate gaps.
4. Explain decisions (reason codes, feature contributions).
5. Keep a person in the loop for consequential decisions; provide appeals.
6. Assign owners and monitoring; review when data or use changes.

```diagram loop Responsible AI cycle
- Describe use | people affected and decisions made | input
- Minimise data | sources, consent basis, personal data | store
- Measure by group | performance and error rates; investigate gaps | process
- Explain decisions | reason codes, feature contributions | process
- Person in the loop | for consequential decisions, with appeals | process
- Owners and monitoring | assigned for every risk | output
loop: Review when data or use changes
```

### Related concepts
- **Federated learning**: train a shared model across many devices or organisations without moving their raw data; only model updates are sent and combined. Used for phone keyboards and in healthcare.

```diagram merge Federated learning
note: Raw data stays where it is. Only model updates are sent and combined.
- Shared model | updates combined from all sources | model
- Device or organisation 1 | trains locally on its own raw data | store
- Device or organisation 2 | trains locally on its own raw data | store
- Device or organisation 3 | trains locally on its own raw data | store
```
- **Watermarking and content provenance**: marking AI-generated text, images or audio so they can be identified later, for example with signed metadata that records how media was created.
- **Model cards and datasheets**: short documents describing what a model or dataset is for, how it was built, how it performs on different groups and where it should not be used.

```diagram flow Watermarking and provenance
- AI-generated media | text, image or audio | model
- Mark it | watermark or signed metadata on how it was made | process
- Identify later | anyone can check where it came from | output
```

## Python example
A deliberately biased score on synthetic applicants, where both groups are equally qualified:
```text Output of quickpath.py fairness (executed)
approval rate A 0.506  B 0.405  -> demographic parity difference 0.101
approval rate among qualified A 0.932  B 0.765  -> equal opportunity difference 0.167
```
Among people who truly qualify, group B is approved 16.7 points less often. That is the kind of gap a fairness check exists to catch before launch.
```python fairness check (excerpt)
rates = df.groupby("group")["approved"].mean()
tpr = df[df.qualified].groupby("group")["approved"].mean()
```

## .NET (C#) example
The same checks with LINQ, so they can run in a .NET monitoring job:
```cs Fairness.cs
public record Decision(string Group, bool Qualified, bool Approved);

public static class Fairness
{
    public static void Report(IReadOnlyList<Decision> decisions)
    {
        var approval = decisions.GroupBy(d => d.Group).ToDictionary(g => g.Key, g => g.Average(d => d.Approved ? 1.0 : 0.0));
        var amongQualified = decisions.Where(d => d.Qualified).GroupBy(d => d.Group)
                                      .ToDictionary(g => g.Key, g => g.Average(d => d.Approved ? 1.0 : 0.0));
        foreach (var g in approval.Keys.Order())
            Console.WriteLine($"group {g}: approval {approval[g]:F3}, approval among qualified {(amongQualified.TryGetValue(g, out var q) ? q.ToString("F3") : "n/a")}");
        Console.WriteLine($"demographic parity difference {approval.Values.Max() - approval.Values.Min():F3}");
        Console.WriteLine($"equal opportunity difference {amongQualified.Values.Max() - amongQualified.Values.Min():F3}");
    }
}
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Group rates and the fairness gap (are groups treated alike?)
**Where it is used:** checking a model's decisions, such as approvals or false alarms, for each group of people.

```formula Rates by group
selection rate = people selected in the group ÷ people in the group
ratio = lower group rate ÷ higher group rate
false positive rate = wrongly flagged ÷ people who should not be flagged
```
These are checks to investigate, not proof of fairness or bias on their own.

**In plain words:** compute the same rate for each group and compare. A big gap needs a closer look.

**Example 1: selection rates.** Group A: 45 of 100 selected = 0.45. Group B: 27 of 90 selected = 0.30. Difference = 0.15. Ratio = 0.30 ÷ 0.45 = 0.67.

**Example 2: false positive rates.** Group A: 10 wrongly flagged out of 80 correct cases = 0.125. Group B: 12 out of 60 = 0.20. Gap = 0.075, so group B is flagged wrongly more often.

### Small groups and uncertainty (how much to trust a rate)
**Where it is used:** reading fairness numbers for groups with few people.

```formula Margin of error for a rate
margin ≈ 1.96 × sqrt( rate × (1 - rate) ÷ n )
```
n is the number of people in the group.

**In plain words:** a rate from 10 people can move a lot. Report the margin beside it.

**Example 1: 10 people.** 3 selected, rate = 0.30. Margin = 1.96 × sqrt(0.21 ÷ 10) = 1.96 × 0.145 = 0.28. Range about 0.02 to 0.58, too wide to conclude much.

**Example 2: 100 people.** 30 selected, rate = 0.30. Margin = 1.96 × sqrt(0.21 ÷ 100) = 1.96 × 0.0458 = 0.09. Range about 0.21 to 0.39.

## Maths behind it
- Group rates and differences (statistics)
- Fairness metrics: demographic parity, equal opportunity, equalised odds
- Differential privacy (privacy-preserving statistics)
- Shapley values (explanations)

## Common mistakes
- Removing a protected attribute and assuming the model is now fair; other features can act as proxies.
- Measuring only overall accuracy.
- No owner, so nobody notices when a risk becomes real.

```diagram compare Proxy features and fairness
## Remove the protected column only | bad
- Other features can act as proxies
- The gap can remain unseen
## Remove and measure by group | output
- Check outcomes for each group
- Not only overall accuracy
- An owner for each risk
```

## Quick check
Q: What does an equal opportunity difference of 0.167 mean?
A: Among people who truly qualify, one group is approved 16.7 percentage points less often than the other.

Q: Is deleting a protected column enough to make a model fair?
A: No. Other features can act as proxies; measure outcomes by group.

Q: What goes into a model card?
A: Intended use, training data summary, evaluation results (including by group), limitations and owner.
