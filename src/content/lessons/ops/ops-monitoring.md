---
id: ops-monitoring
title: Monitoring models and AI apps in production
module: ops
level: Advanced
minutes: 75
goal: Watch a live model or LLM app for data drift, falling quality, latency and cost, and decide when to alert, retrain or roll back.
prereqs: ops-mlops, app-evals
reviewed: 2026-11-02
evidence: A monitoring sheet for one model listing each signal, its threshold, the action it triggers, and a drift check run on your own data.
code: Python executed 2026-11-02 (ml_basics.py drift; applied_basics.py latency); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
A model starts going stale the day it is deployed, because the world changes and the model does not. **Monitoring** is watching it so you notice before customers do. Watch four kinds of signals. **System health**: errors, latency and throughput, like any web service. **Data drift**: the inputs no longer look like the training data (new customer types, a new product, a changed form). **Concept drift**: the inputs look the same but the right answer has changed (fraudsters change tactics). **Quality and business results**: accuracy once true labels arrive, plus the business number the model exists to move. For LLM apps add **token cost**, **time to first token** (TTFT, how long until the first word appears), refusal rate, user feedback (thumbs up or down) and regular evaluation runs on a sample of real conversations. Every signal needs a **threshold** and an **action**: alert a person, retrain, or roll back.

```diagram compare Four kinds of signal to watch
## System health | process
- Errors
- Latency
- Throughput
## Data drift | warn
- Inputs no longer look like training data
- New customer types, products or forms
## Concept drift | bad
- Inputs look the same
- The right answer has changed
## Quality and business | output
- Accuracy once true labels arrive
- The business number the model should move
```

```diagram matrix Data drift versus concept drift
x: Inputs look the same | Inputs have changed
y: Right answer is the same | Right answer has changed
- Healthy | the model is still on solid ground | output
- Data drift | new kinds of input the model never saw | warn
- Concept drift | for example fraudsters change tactics | bad
- Both changed | the inputs and the right answer have both moved | warn
```

```diagram fan Extra signals for LLM apps
note: Each one still needs a threshold and an action.
- LLM app monitoring | on top of system health | process
- Token cost | usually billed per token | output
- Time to first token | how long until the first word appears | output
- Refusal rate | how often it declines | output
- User feedback | thumbs up or down | output
- Regular evaluation runs | on a sample of real conversations | output
```

```diagram flow Every signal needs a threshold and an action
- Signal | for example PSI, latency or cost | input
- Threshold | the line that matters | process
- Action | alert a person, retrain or roll back | output
```

## Real-world example
A delivery company's arrival-time model was trained before a new suburb opened. Drivers there take longer routes, so the input "distance" shifts and errors rise. The drift check raises an alert within a week; the team adds recent trips and retrains. Separately, its support chatbot's cost doubles after a prompt change makes answers longer; the cost alert catches it the same day.

```diagram flow The arrival-time model drifts
- New suburb opens | after the model was trained | input
- Distance shifts | drivers take longer routes | warn
- Errors rise | predictions get worse | bad
- Drift alert | raised within a week | process
- Retrain | recent trips added | model
```

## How it works
1. Log every request: inputs (or a summary of them), output, model version, latency, and for LLMs the token counts. Redact personal data first.
2. Compare recent input distributions with the training data using a drift score such as **PSI** (population stability index). A common rule of thumb: below 0.1 little change, 0.1 to 0.25 moderate, above 0.25 investigate.
3. When true outcomes arrive (did the customer actually leave?), compute accuracy, recall and so on per week and per customer segment.
4. Track latency percentiles and the share of requests that miss your time budget.
5. Put each signal on a dashboard with an owner, a threshold and an action.
6. Feed confirmed failures back into your evaluation set so they become tests.

```diagram loop The monitoring cycle
loop: Confirmed failures become new tests, then the cycle continues
- Log every request | redact personal data first | store
- Check drift | compare with training data using PSI | process
- Check quality | when true outcomes arrive | process
- Track latency | percentiles and share over budget | process
- Dashboard | owner, threshold and action per signal | output
```

```diagram compare Reading the PSI drift score
note: A common rule of thumb, not a law.
## Below 0.1 | output
- Little change
## 0.1 to 0.25 | warn
- Moderate change
## Above 0.25 | bad
- Investigate
```

### Related concepts

#### Tracing
A **trace** records each step of one request: the prompt, the retrieved chunks, the tool calls, the model reply and the time each step took. When a user reports a bad answer, you open its trace and see where it went wrong, for example a wrong chunk or a slow tool. Traces often hold personal data, so redact it before storing them.

```diagram flow One request, recorded as a trace
note: Each step is stored with its time, with personal data redacted.
- User request | the question as received | input
- Prompt built | system text, question, history | process
- Chunks retrieved | the documents found | store
- Tool calls | which tool, with what input | process
- Model reply | the answer and its timing | model
```

#### Observability
**Observability** means having enough data from a running system to ask new questions you did not plan for. It comes from three kinds of data used together: **traces** (one request step by step), **metrics** (numbers over time, such as latency or error rate) and **logs** (events written as text). A metric tells you something is wrong, a trace shows where, and a log gives the detail.

```diagram layers Observability: three kinds of data together
- Metrics | numbers over time: latency, errors, cost | output
- Traces | one request, step by step | process
- Logs | events written as text, with detail | store
```

#### Latency budgets
A **latency budget** gives each step a time allowance, and the allowances add up to the target response time. For example, retrieval, the model call and checks each get a share of the total. Measure percentiles such as p95, which show what slow requests feel like. Stream the answer so the first words appear early. Set a timeout on every step so one slow step cannot use the whole budget.

```diagram layers A latency budget shared between steps
note: The allowances add up to the target response time. Set yours from your own measurements.
- Retrieval | its own time allowance and timeout | process
- Model call | usually the largest allowance, with streaming | model
- Checks and formatting | its own small allowance | process
```

#### Token cost tracking
For each request, record the **input tokens** and **output tokens**. Add the feature name and customer, so you can see cost per request, per feature and per customer. Set a budget with an alert when spending nears it. The main levers to cut cost are a cheaper model for easy requests and caching repeated answers (see [Speed, cost and scaling](lesson:ops-scale)). Take prices from your provider's current price list; never guess them.

```diagram merge Token usage rolled up for cost tracking
note: Prices come from your provider, not from this guide.
- Cost report and budget alert | per request, feature and customer | output
- Input tokens | recorded for every request | input
- Output tokens | recorded for every request | input
- Feature and customer labels | who and what used them | store
```

## Python example
A drift check: PSI between the training distribution and two batches of live data:
```text Output of ml_basics.py drift (executed)
PSI same distribution: 0.005
PSI shifted distribution: 0.496
```
0.005 means the live data still looks like training data. 0.496 is far above 0.25, so the inputs have changed and the model's predictions should not be trusted until investigated. The PSI function in the example is about ten lines: split values into bins, compare the share of data in each bin, and add up the differences.

Latency for a simulated LLM chat endpoint, measured as users experience it:
```text Output of applied_basics.py latency (executed)
TTFT p50=0.28s p95=0.59s
total p50=4.46s p95=7.37s
share of requests over a 5 s budget: 41.4%
```
The first words appear quickly, but 41.4% of full answers take longer than a 5-second budget. That tells you to stream responses, shorten answers or use a faster model. Averages would have hidden this.

## .NET (C#) example
PSI in C#, plus custom metrics with `System.Diagnostics.Metrics`, which OpenTelemetry can export to most monitoring tools:
```cs Monitoring.cs
using System.Diagnostics.Metrics;

public static class Drift
{
    // Population stability index between training values and live values.
    public static double Psi(double[] expected, double[] actual, int bins = 10)
    {
        double min = expected.Min(), max = expected.Max(), width = (max - min) / bins;
        double Share(double[] v, int b) => Math.Max(1e-4, v.Count(x =>
            Math.Clamp((int)((x - min) / width), 0, bins - 1) == b) / (double)v.Length);
        double psi = 0;
        for (int b = 0; b < bins; b++)
        {
            double e = Share(expected, b), a = Share(actual, b);
            psi += (a - e) * Math.Log(a / e);
        }
        return psi;
    }
}

public sealed class ModelMetrics
{
    private static readonly Meter Meter = new("Churn.Model");
    private readonly Histogram<double> _latency = Meter.CreateHistogram<double>("prediction.latency", "ms");
    private readonly Counter<long> _tokens = Meter.CreateCounter<long>("llm.tokens");

    public void RecordPrediction(double ms, string modelVersion) =>
        _latency.Record(ms, new KeyValuePair<string, object?>("model_version", modelVersion));
    public void RecordTokens(long count, string kind) =>
        _tokens.Add(count, new KeyValuePair<string, object?>("kind", kind));   // kind: input or output
}
// A scheduled job computes Drift.Psi(trainingTenure, lastWeekTenure) and raises an alert above 0.25.
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Population stability index (PSI, a drift score)
**Where it is used:** the drift check that compares live inputs, such as trip distance, with the training data.

```formula Population stability index
PSI = sum over bins of (live share - training share) × ln(live share ÷ training share)
share = the fraction of rows that fall in a bin; ln = natural logarithm
```
**In plain words:** split a value into bins and compare how much data is in each bin now and at training time. A bigger score means a bigger shift. A common rule of thumb: below 0.1 little change, above 0.25 investigate.

**Example 1: small shift.** Three distance bins. Training shares 0.5, 0.3, 0.2; live shares 0.4, 0.3, 0.3. Bin 1: (0.4 - 0.5) × ln(0.8) = -0.1 × -0.2231 = 0.0223. Bin 2: 0. Bin 3: (0.3 - 0.2) × ln(1.5) = 0.1 × 0.4055 = 0.0405. PSI = 0.0223 + 0 + 0.0405 = 0.063. Little change.

**Example 2: large shift.** Live shares 0.2, 0.3, 0.5. Bin 1: -0.3 × ln(0.4) = -0.3 × -0.9163 = 0.2749. Bin 3: 0.3 × ln(2.5) = 0.3 × 0.9163 = 0.2749. PSI = 0.2749 + 0 + 0.2749 = 0.55. Above 0.25: investigate.

### Mean shift in standard deviations (a simple drift measure)
**Where it is used:** a quick check that one input, such as trip distance, has moved away from its training average.

```formula Mean shift
shift = (live mean - training mean) ÷ training standard deviation
```
**In plain words:** it measures how far the average has moved, in units of normal spread.

**Example 1: modest move.** Training distance: mean 5 km, standard deviation 2 km. Live mean 6.5 km. Shift = (6.5 - 5) ÷ 2 = 0.75 standard deviations. Watch it.

**Example 2: big move.** Live mean 9 km. Shift = (9 - 5) ÷ 2 = 2 standard deviations. Raise an alert.

### Percentiles and share over budget (latency)
**Where it is used:** tracking the chatbot's response time as users experience it, instead of the average.

```formula Percentile (nearest rank)
sort the values from smallest to largest
p95 = the value at rank ceil(0.95 × n)   (ceil = round up to a whole number)
share over budget = requests slower than the budget ÷ all requests
```
**In plain words:** p95 is the time that 95% of requests beat. It shows slow cases that an average hides.

**Example 1: p95.** 20 response times in seconds, sorted: 1.0, 1.1, 1.2, 1.2, 1.3, 1.4, 1.5, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.4, 2.6, 3.0, 4.8, 9.5. Rank = ceil(0.95 × 20) = 19, so p95 = 4.8 s. The mean is 45.8 ÷ 20 = 2.29 s, which hides the slow tail.

**Example 2: share over a 3 s budget.** Two of the 20 values (4.8 and 9.5) are above 3 s. Share = 2 ÷ 20 = 0.10 = 10%.

## Maths behind it
- Population stability index and Kullback-Leibler divergence (drift)
- Kolmogorov-Smirnov test (comparing distributions)
- Percentiles (latency)

## Common mistakes
- Monitoring only server uptime and not model quality.
- Never collecting true outcomes, so accuracy can never be measured after launch.
- Alerts with no owner or action, which everyone learns to ignore.
- Logging raw personal data in prompts and inputs.
- Keeping metrics but no traces, so a bad answer cannot be explained.
- Recording total cost only, with no tokens per feature or customer.

```diagram compare Server health alone is not enough
## Only uptime | bad
- The server is up
- The model may still be wrong
## Uptime plus quality | output
- True outcomes are collected
- Accuracy is measured after launch
- Alerts have an owner and an action
```

## Quick check
Q: What is the difference between data drift and concept drift?
A: Data drift: the inputs change. Concept drift: the inputs look the same but the correct answer for them changes.

Q: The PSI for a key feature is 0.496. What do you do?
A: Investigate: it is well above 0.25, so live data differs from training data; check the cause, then retrain or adjust.

Q: Why track the share of requests over a time budget instead of average latency?
A: Averages hide slow requests; the share over budget shows how many users actually had a bad experience.

Q: What does a trace let you do that a metric does not?
A: Follow one request step by step (prompt, chunks, tool calls, reply, timings) to explain why one answer was bad.
