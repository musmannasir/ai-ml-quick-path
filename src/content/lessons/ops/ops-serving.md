---
id: ops-serving
title: Serving a model as an API
module: ops
level: Intermediate
minutes: 90
goal: Turn a saved model into a web API that loads the model once, validates input, returns a versioned answer and reports its health, in Python and in ASP.NET Core.
prereqs: s-lifecycle, ml-classification
reviewed: 2026-11-02
evidence: A running prediction API with /health and /predict, input validation that returns 400 for bad input, and a latency measurement (p50 and p95) from your machine.
code: Python executed 2026-11-02 (quickpath.py serving, standard-library HTTP server); FastAPI and C# not run (FastAPI not installed and no .NET SDK in the build environment)
---
## In plain words
A trained model sitting in a file helps nobody. **Serving** means putting it behind an **API** (a web address other programs can call) so a website, a mobile app or another service can send it data and get a prediction back. A good prediction API does five things: it **loads the model once** when the service starts (loading it on every request is slow), it **checks the input** and rejects bad requests with a clear error, it returns the **model version** with every answer so you can trace which model made which decision, it offers a **health check** so the hosting platform knows the service is alive, and it is **measured** for speed. There are two serving styles. **Online (real-time)** serving answers one request in milliseconds, for example a fraud check during payment. **Batch** serving scores millions of rows on a schedule, for example a nightly churn score for every customer. Pick batch whenever the answer is not needed immediately, because it is simpler and cheaper.

```diagram flow The path of one prediction request
note: The model is already in memory when the request arrives.
- Client app | a website, mobile app or other service | input
- API service | checks the input and rejects bad requests | process
- Model in memory | loaded once at start-up | model
- Answer | prediction plus the model version | output
```

```diagram fan What a good prediction API does
note: Five jobs, one service.
- Prediction API | the web address other programs call | process
- Loads the model once | at start-up, not on every request | process
- Checks the input | clear error for bad requests | warn
- Returns the model version | so every decision can be traced | output
- Offers a health check | so the platform knows it is alive | output
- Is measured | median (p50) and slow tail (p95) | output
```

```diagram compare Online serving versus batch serving
## Online (real-time) | process
- Answers one request at a time
- Needs an answer in milliseconds
- Example: fraud check during payment
## Batch | store
- Scores millions of rows on a schedule
- Nobody waits for the answer
- Example: nightly churn score for every customer
- Simpler and cheaper, so pick it when you can
```

## Real-world example
A telecom company trains a churn model. The customer-care screen calls `POST /predict` when an agent opens a customer record and shows "High churn risk (0.93), model churn-logreg-v3". Every night a batch job also scores all customers so the retention team gets a ranked call list each morning. Both use the same saved model file.

```diagram fan One saved model, two ways to use it
note: Same model file, different timing.
- Saved model file | churn-logreg-v3 | model
- Online: POST /predict | agent opens a customer record | output
- Nightly batch job | scores all customers | process
- Ranked call list | ready for the retention team each morning | output
```

## How it works
1. Train and save the model (for example `model.joblib` in Python or `model.zip` in ML.NET), together with its version name.
2. Write a small web service. At start-up, load the model into memory once.
3. Define the input contract: field names, types and allowed ranges. Reject anything else with HTTP 400.
4. In the `/predict` handler, turn the input into the same feature layout used in training, call the model and return the result plus `model_version`.
5. Add `/health` that returns `{"status": "ok"}` so the platform can restart a broken instance.
6. Measure latency: send many requests and record the median (**p50**) and the slow tail (**p95**). Users feel the tail.
7. Put it in a container and deploy it (see [Production architecture](lesson:ops-architecture)).

```diagram lanes Start-up work versus per-request work
note: Do the slow work once, the quick work every time.
## Once, at start-up
- Load the saved model | into memory | model
- Read the version name | for example churn-logreg-v3 | process
- Open /health | status ok | output
## For every request
- Validate the input | wrong type gives HTTP 400 | warn
- Build the features | same layout as training | process
- Call the model | already in memory | model
- Return result and version | the answer | output
```

## Python example
This demo starts a real HTTP server with Python's standard library, loads a churn model once, and calls it:
```text Output of quickpath.py serving (executed)
GET  /health  -> 200 {'status': 'ok', 'model_version': 'churn-logreg-v3'}
POST /predict -> 200 {'churn_probability': 0.928, 'model_version': 'churn-logreg-v3'}
POST /predict -> 400 {'error': 'need tenure_months, monthly_charge, support_calls as numbers'}
200 requests on this machine: p50 0.9 ms  p95 1.1 ms
```
The second call is a new customer with 3 months of tenure, a high bill and 6 support calls, so the risk is high. The third call sends `"three"` instead of a number, and the service refuses it instead of crashing. The latency is tiny because this is a small model on the same machine; over a network add the network time.

In real projects you write the same thing with **FastAPI**, which validates input for you:
```python serve.py (FastAPI; not run here)
import joblib
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()
model = joblib.load("model.joblib")          # once, at start-up
MODEL_VERSION = "churn-logreg-v3"

class Customer(BaseModel):
    tenure_months: float = Field(ge=0, le=600)
    monthly_charge: float = Field(ge=0)
    support_calls: int = Field(ge=0, le=100)

@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}

@app.post("/predict")
def predict(c: Customer):                    # invalid input -> automatic 422 error
    p = model.predict_proba([[c.tenure_months, c.monthly_charge, c.support_calls]])[0, 1]
    return {"churn_probability": round(float(p), 3), "model_version": MODEL_VERSION}

# run: uvicorn serve:app --port 8000
```

## .NET (C#) example
In ASP.NET Core, `PredictionEnginePool` (package Microsoft.Extensions.ML) loads an ML.NET model once and is safe to use from many requests at the same time. A single `PredictionEngine` is not thread-safe, so never share one across requests.
```cs Program.cs
using Microsoft.Extensions.ML;
using Microsoft.ML.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddPredictionEnginePool<Customer, ChurnPrediction>()
    .FromFile(modelName: "churn", filePath: "model.zip", watchForChanges: true);
builder.Services.AddHealthChecks();
var app = builder.Build();

const string ModelVersion = "churn-fasttree-v3";
app.MapHealthChecks("/health");

app.MapPost("/predict", (Customer c, PredictionEnginePool<Customer, ChurnPrediction> pool) =>
{
    if (c.TenureMonths is < 0 or > 600 || c.MonthlyCharge < 0 || c.SupportCalls < 0)
        return Results.BadRequest(new { error = "values out of range" });
    var p = pool.Predict(modelName: "churn", example: c);
    return Results.Ok(new { churnProbability = Math.Round(p.Probability, 3), modelVersion = ModelVersion });
});
app.Run();

public sealed class Customer
{
    public float TenureMonths { get; set; }
    public float MonthlyCharge { get; set; }
    public float SupportCalls { get; set; }
}
public sealed class ChurnPrediction
{
    [ColumnName("PredictedLabel")] public bool Churn { get; set; }
    public float Probability { get; set; }
}
```
`watchForChanges: true` reloads the model when the file is replaced, so you can ship a new model without restarting. The model must have been trained with the same column names as `Customer`.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Percentiles (p50 and p95 latency)
**Where it is used:** reporting how fast the `POST /predict` endpoint answers, instead of one average.

```formula Percentile (nearest rank)
sort the response times from smallest to largest
pK = the value at rank ceil(K ÷ 100 × n)   (n = number of requests, ceil = round up)
```
**In plain words:** p50 is the typical request. p95 is the time that 95% of requests beat, so it shows the slow ones.

**Example 1: p50 and p95.** Ten response times in ms, sorted: 12, 13, 13, 14, 15, 15, 16, 18, 25, 240. p50 rank = ceil(0.5 × 10) = 5, so p50 = 15 ms. p95 rank = ceil(0.95 × 10) = 10, so p95 = 240 ms. The mean is 381 ÷ 10 = 38.1 ms, which describes neither.

**Example 2: p90 can miss the tail.** On the same list, p90 rank = ceil(0.9 × 10) = 9, so p90 = 25 ms. One slow request in ten is invisible at p90 but visible at p95. Choose the percentile that matches your promise to users.

### Utilisation and waiting (why a busy server slows sharply)
**Where it is used:** deciding how much load one copy of the API can take before latency becomes a problem.

```formula Utilisation and time in system (simple one-server queue)
utilisation = arrival rate ÷ service rate
average time in system = 1 ÷ (service rate - arrival rate)
service rate = requests the server can finish per second; arrival rate must be lower
```
**In plain words:** as arrivals get close to what the server can finish, the wait grows very quickly. This is a simplified model that assumes random arrivals.

**Example 1: half busy.** The server finishes 50 requests per second; 25 arrive per second. Utilisation = 25 ÷ 50 = 50%. Time = 1 ÷ (50 - 25) = 0.04 s = 40 ms.

**Example 2: nearly full.** 49 arrive per second. Utilisation = 49 ÷ 50 = 98%. Time = 1 ÷ (50 - 49) = 1 s, which is 25 times slower. Add capacity well before this point.

## Maths behind it
- Percentiles (p50, p95) for latency
- Queueing theory (why latency rises sharply as a server gets busy)

## Common mistakes
- Loading the model inside the request handler, so every request pays the loading cost.
- Training with one feature order and serving with another; the model silently gives nonsense.
- Reporting only average latency; one slow request in twenty is what users remember.
- Choosing real-time serving when a nightly batch would do.

```diagram compare Where to load the model
## Inside the request handler | bad
- Every request pays the loading cost
- Slow for every user
## Once at start-up | model
- Loaded a single time
- Each request only runs the prediction
```

## Quick check
Q: Why must the API return the model version with each prediction?
A: So every decision can be traced to the exact model that made it, which you need for debugging, audits and rollbacks.

Q: When is batch serving better than online serving?
A: When the answer is not needed immediately (for example a nightly score for every customer); it is simpler, cheaper and easier to monitor.

Q: Why use PredictionEnginePool instead of one PredictionEngine in ASP.NET Core?
A: A PredictionEngine is not thread-safe; the pool gives each concurrent request a safe engine and loads the model once.
