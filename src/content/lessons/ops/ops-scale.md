---
id: ops-scale
title: Speed, cost and scaling
module: ops
level: Advanced
minutes: 75
goal: Make models and LLM apps faster and cheaper with batching, caching, smaller models, quantisation and ONNX export, and know when to add more machines or GPUs.
prereqs: ops-serving, llm-local
reviewed: 2026-11-02
evidence: A before-and-after table for one service showing latency, throughput and cost per 1,000 requests after at least two optimisations.
code: Python executed 2026-11-02 (quickpath.py batching, cache); ONNX export and C# not run (skl2onnx not installed and no .NET SDK in the build environment)
---
## In plain words
Once a model works, the next questions are "can it handle more users?" and "can it cost less?". The main levers, roughly in the order to try them: **Cache**: if the same question comes again, return the saved answer instead of calling the model. **Batch**: process many inputs in one call; models and GPUs are far more efficient on a batch than on single items. **Use a smaller model**: a small model that is good enough beats a large one that is slow and expensive; **distillation** trains a small model to copy a big one. **Quantise**: store weights in fewer bits (8-bit or 4-bit instead of 16-bit) so the model uses less memory and often runs faster, with a small quality loss you must measure. **Export to ONNX**: a standard model format with a fast runtime that works from Python, C#, Java and more. Only then **scale out**: run more copies of the service behind a load balancer (horizontal scaling) or use bigger machines and GPUs (vertical scaling). For LLMs, also cut **tokens**: shorter prompts, fewer retrieved chunks, capped answer length. Cost for hosted LLMs is usually billed per token.

```diagram flow Speed and cost levers, in the order to try them
note: Cheap levers first; scaling out comes last.
- Cache | return the saved answer for a repeated question | process
- Batch | many inputs in one call | process
- Smaller model | good enough beats big and slow | model
- Quantise | fewer bits per weight | model
- Export to ONNX | standard format, fast runtime | model
- Scale out | more copies or bigger machines | output
```

```diagram compare Cache hit versus cache miss
## Cache hit | output
- Same question seen before
- Saved answer returned
- No model call, no cost
## Cache miss | process
- New question
- The model is called
- The answer is saved for next time
```

```diagram compare One call per row versus one batch
note: From the batching run in this lesson; the ratio depends on your machine.
## One at a time | bad
- 2000 predictions, 2000 calls
- Fixed overhead paid every time
- 193 ms in the demo
## As one batch | output
- 2000 predictions, 1 call
- Overhead spread across all rows
- 0.1 ms in the demo
```

```diagram compare Quantisation: fewer bits per weight
## 16-bit weights | model
- Most memory
- Full quality
## 8-bit or 4-bit weights | model
- Less memory
- Often faster
- Small quality loss you must measure
```

```diagram compare Two ways to scale out
## Horizontal scaling | process
- More copies of the service
- A load balancer shares the requests
## Vertical scaling | store
- A bigger machine
- Or GPUs, only when the model needs them
```

## Real-world example
An online shop's product Q&A bot answers 5,000 questions a day. Most are the same few ("Is delivery free?", "What is the return period?"). Adding a cache for exact repeated questions removes almost all model calls for those. Routing simple questions to a small model and only hard ones to a large model cuts cost further, and the team checks quality on its evaluation set after each change.

```diagram flow The shop bot after two optimisations
- Customer question | one of 5,000 a day | input
- Cache | exact repeated questions answered here | store
- Router | simple or hard? | process
- Small or large model | hard ones only to the large one | model
- Check quality | on the evaluation set after each change | output
```

## How it works
1. Measure first: latency p50 and p95, requests per second, cost per 1,000 requests.
2. Add caching for repeated inputs (exact match first; similarity-based "semantic" caching only with care, because similar questions can need different answers).
3. Batch requests that can wait a few milliseconds; batch offline jobs completely.
4. Try a smaller or quantised model; re-run your evaluation to check quality.
5. Export to ONNX if you need a faster or cross-language runtime.
6. Scale out with more instances and autoscaling; add GPUs only when the model needs them (see [the hardware guide](page:hardware.html)).
7. Re-measure and keep the numbers in a before-and-after table.

```diagram loop Measure, change, measure again
loop: Repeat until latency and cost are good enough
- Measure | p50, p95, requests per second, cost per 1,000 requests | input
- Change one thing | cache, batch, smaller or quantised model, ONNX | process
- Check quality | re-run your evaluation | warn
- Record | before-and-after table | output
```

### Related concepts
- **Pruning**: removing weights or whole parts of a network that contribute little, then fine-tuning briefly. It makes models smaller and sometimes faster.

```diagram flow Pruning
- Trained network | all weights | model
- Remove weights | those that contribute little | process
- Fine-tune briefly | recover quality | process
- Smaller model | sometimes faster | output
```

- **Model routing**: send each request to the cheapest model that can handle it (a small model for easy questions, a large one for hard ones).

```diagram fan Model routing
- Router | picks the cheapest model that can handle it | process
- Small model | easy questions | model
- Large model | hard questions | model
```

- **Autoscaling**: adding or removing service instances automatically as traffic rises and falls.

```diagram compare Autoscaling
## Traffic rises | warn
- More instances are added
## Traffic falls | output
- Extra instances are removed
```

#### Response caching
**Response caching** stores an answer so it can be reused. An **exact-match cache** returns the saved answer only when the question is identical. A **semantic cache** also reuses it for a very similar question, found by comparing meaning. It saves more calls but can return a wrong answer for a question that looks similar and differs in a key detail. Never cache personal or permission-dependent answers under a shared key. Give every entry an expiry, and remove entries when the documents they came from change.

```diagram compare Exact-match and semantic cache
## Exact-match cache | output
- Reused only for an identical question
- Simple and safe
- Fewer hits
## Semantic cache | warn
- Reused for a similar question
- More hits, saves more calls
- May give a wrong answer to a look-alike question
```

#### Model routing: checking that quality holds
Routing only helps if quality stays good. Run your eval set separately on the easy requests sent to the small model and on the hard ones sent to the large model. If the small model's score on its share drops below the agreed bar, change the rule that decides what counts as easy. Keep checking after every change to the router or either model.

```diagram loop Tuning a model router
loop: Repeat after any change to the router or a model
- Route requests | easy to small, hard to large | process
- Score each route | run the eval set on both shares | model
- Quality below the bar? | for example the small model on its share | warn
- Adjust the routing rule | send more requests to the large model | output
```

#### Rate limits as a scaling and cost topic
Two kinds of limit apply. The **provider** limits how many requests or tokens you may send in a period. You also set limits for your **own users**, so one user cannot use up your share. When a provider answers "too many requests", do not retry at once. Wait, then try again with longer waits (see [Production architecture](lesson:ops-architecture)). Limits protect both cost and availability. The security view is in [Security for AI applications](lesson:app-security).

```diagram layers Two layers of rate limits
note: Your own limits keep you under the provider's limit.
- Provider limit | the most requests or tokens you may send | warn
- Your limit per user | stops one user using up the share | process
- Wait and retry | on "too many requests", wait longer each time | output
```

#### Latency budgets
Each step in a request needs a time allowance. Together they must fit the target response time. Measure percentiles, not averages, and stream the answer so the user sees words early. See [Monitoring models and AI apps](lesson:ops-monitoring) for how to set and measure a budget.

## Python example
Batching: the same 2,000 predictions, one call per row versus one call for all rows:
```text Output of quickpath.py batching (executed)
2000 predictions one at a time: 193 ms | as one batch: 0.1 ms | about 1510x faster
```
The exact ratio depends on your machine and model, but the pattern is always the same: each call has fixed overhead, and batches spread it out.

Caching repeated questions (a few questions are very common, as in real support traffic):
```text Output of quickpath.py cache (executed)
5000 requests, 40 distinct | cache hits 4960 (99.2%) | model calls 40 | cost 10.00 -> 0.08 (illustrative price)
```
Real traffic has more unique questions than this simulation, so expect a lower hit rate; measure yours.

Exporting a scikit-learn model to ONNX so .NET (or any language) can run it:
```python export_onnx.py (skl2onnx; not run here)
from skl2onnx import to_onnx
import numpy as np, joblib

model = joblib.load("model.joblib")
onx = to_onnx(model, np.zeros((1, 3), dtype=np.float32), target_opset=17)
open("churn.onnx", "wb").write(onx.SerializeToString())
```

## .NET (C#) example
Running the ONNX model with ONNX Runtime (package Microsoft.ML.OnnxRuntime), scoring a batch in one call, with an in-memory cache in front of an LLM call:
```cs FastScoring.cs
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

public sealed class FastScoring(IMemoryCache cache, IChatClient chat)
{
    private static readonly InferenceSession Session = new("churn.onnx");   // load once

    public float[] ScoreBatch(float[][] rows)
    {
        var input = new DenseTensor<float>(rows.SelectMany(r => r).ToArray(), [rows.Length, 3]);
        string inputName = Session.InputMetadata.Keys.First();
        using var results = Session.Run([NamedOnnxValue.CreateFromTensor(inputName, input)]);
        return results.First().AsEnumerable<long>().Select(x => (float)x).ToArray(); // predicted labels
    }

    public async Task<string> AnswerAsync(string question, CancellationToken ct)
    {
        string key = "faq:" + question.Trim().ToLowerInvariant();
        if (cache.TryGetValue(key, out string? cached)) return cached!;
        var response = await chat.GetResponseAsync(question, new ChatOptions { MaxOutputTokens = 300 }, cancellationToken: ct);
        cache.Set(key, response.Text, TimeSpan.FromHours(6));                 // expire so answers stay fresh
        return response.Text;
    }
}
```
The first output of a converted scikit-learn classifier is usually the predicted label; inspect `Session.OutputMetadata` to find the probability output for your model.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Cache hit rate and cost (how much a cache saves)
**Where it is used:** the shop bot's cache for repeated questions, and how many model calls remain.

```formula Cost with a cache
model calls = questions × (1 - hit rate)
cost = model calls × cost per call
hit rate = questions answered from the cache ÷ all questions
```
**In plain words:** only cache misses reach the model, so cost falls in step with the hit rate. Costs here are in made-up "units", not real prices.

**Example 1: 60% hit rate.** 5,000 questions a day, 1 unit per call. Calls = 5,000 × (1 - 0.6) = 2,000. Cost = 2,000 units, instead of 5,000.

**Example 2: 90% hit rate.** Calls = 5,000 × 0.1 = 500. Cost = 500 units, a 90% saving. A semantic cache may reach this, but check answer quality.

### Little's law (how many requests are in the system at once)
**Where it is used:** deciding how many parallel workers or replicas a service needs.

```formula Little's law
requests in progress = arrival rate × time each request spends in the system
arrival rate = requests per second; time in seconds
```
**In plain words:** if requests arrive faster or stay longer, more of them are in progress at once, so you need more capacity.

**Example 1: normal load.** 10 requests per second, 0.8 s each. In progress = 10 × 0.8 = 8 requests.

**Example 2: slower model.** Same 10 requests per second but 2 s each. In progress = 10 × 2 = 20 requests. Latency rose 2.5 times, so the system needs 2.5 times the workers.

### Memory for model weights (why quantisation helps)
**Where it is used:** estimating whether a model fits on a GPU, and what 8-bit or 4-bit weights save.

```formula Weight memory
memory in bytes = number of parameters × bytes per parameter
16-bit = 2 bytes, 8-bit = 1 byte, 4-bit = 0.5 byte
1 GB = 1,000,000,000 bytes (rounded)
```
**In plain words:** fewer bits per weight means less memory. This counts only the weights, not the working memory used while answering.

**Example 1: a 7-billion-parameter model.** At 16-bit: 7,000,000,000 × 2 = 14,000,000,000 bytes = 14 GB. At 4-bit: 7,000,000,000 × 0.5 = 3.5 GB.

**Example 2: a 1-billion-parameter model at 8-bit.** 1,000,000,000 × 1 = 1 GB, half of its 16-bit size of 2 GB.

## Maths behind it
- Quantisation (number representation, rounding error)
- Knowledge distillation
- Amdahl's law and queueing theory (limits of scaling)

## Common mistakes
- Buying GPUs before trying caching, batching and a smaller model.
- Quantising or switching models without re-running the evaluation set.
- Caching answers that depend on the user (account balance, order status) under a shared key.
- Caches with no expiry, so outdated answers live forever.
- Using a semantic cache for questions where a small difference changes the right answer.
- Retrying at once after a "too many requests" reply, which makes the problem worse.
- Routing to a small model without checking its quality on the requests it receives.

```diagram compare Safe and unsafe caching
## Shared key for user data | bad
- Account balance cached for everyone
- One person may see another's answer
- No expiry, so old answers live forever
## Shared answers with expiry | output
- Only answers that are the same for everyone
- The cache entry expires so answers stay fresh
```

## Quick check
Q: Why is batching faster?
A: Each call has a fixed overhead (and GPUs work best on many items at once), so one call for many rows spreads that cost.

Q: What does quantisation trade?
A: Less memory and often more speed for a small loss of quality, which you must measure.

Q: Name one answer you must never cache under a shared key.
A: Anything user-specific, such as an account balance or order status.

Q: What is the risk of a semantic cache compared with an exact-match cache?
A: A similar-looking question may need a different answer, so the cache can return a wrong one.
