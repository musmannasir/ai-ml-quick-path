---
id: ops-architecture
title: Production architecture for AI systems
module: ops
level: Expert
minutes: 120
goal: Design a complete AI system (a .NET application calling a Python model service and an LLM), with containers, secrets, fallbacks, security and a clear checklist, so you can plan any industry case.
prereqs: ops-serving, ops-monitoring, app-rag, app-security
reviewed: 2026-11-02
evidence: An architecture diagram and one-page design note for a capstone, covering components, contract, failure modes, security, monitoring and cost.
code: C# and FastAPI service not compiled or run (no .NET SDK or FastAPI in the build environment); Dockerfile not built (no Docker in the build environment)
---
## In plain words
In industry an AI feature is rarely one program. It is a small system: a **front end**, an **application back end** (often ASP.NET Core in .NET companies), one or more **model services** (often Python, because most ML libraries are Python-first), an **LLM provider** (hosted API or a local model), a **vector database** for RAG, a **data store**, and **monitoring**. The parts talk through clear **contracts** (agreed request and response formats, with a version number such as `/v1/`). Each part is packaged in a **container** (a portable box holding the app and everything it needs) so it runs the same on a laptop and in the cloud. Good design plans for failure: every call to a model has a **timeout**, a **retry** for temporary errors, and a **fallback** (a simpler rule, a cached answer or a human) so the business keeps running when the model is down. Secrets such as API keys live in a **secret store** or environment variables, never in code. This lesson pulls everything in the guide together into one design you can reuse.

```diagram layers The parts of an AI system
note: Each part talks to the next through a versioned contract.
- Front end | what the user sees | input
- Application back end | often ASP.NET Core in .NET companies | process
- Model services | often Python, where most ML libraries live | model
- LLM provider | hosted API or a local model | model
- Vector database and data store | documents for RAG, tickets and decisions | store
- Monitoring | logs, metrics, dashboards and alerts | output
```

```diagram nest A container packages everything the app needs
note: The same box runs on a laptop and in the cloud.
- Cloud or laptop | where the container runs | store
- Container | a portable box | process
- App and its dependencies | everything it needs to run | model
```

```diagram flow Planning for failure on every model call
note: The business keeps running when the model is down.
- Call the model | with a timeout | process
- Temporary error | the call fails or is too slow | warn
- Retry | for temporary errors | process
- Fallback | a simpler rule, a cached answer or a human | output
```

```diagram compare Where secrets live
## In code or the front end | bad
- API keys visible to anyone with the source
- Hard to rotate
## Secret store or environment variables | output
- Keys kept outside the code
- .NET user secrets for development
```

## Real-world example
A support desk built on .NET wants tickets classified and draft replies written. The ASP.NET Core app stays the system of record. It calls a Python classifier service for the ticket category and an LLM with RAG over the help-centre articles for the draft. If the classifier times out, the ticket goes to a general queue for manual triage. Drafts are never sent automatically; an agent approves each one. Public examples of companies running AI assistants over their own knowledge include [Morgan Stanley](case:morgan-stanley) and [Klarna](case:klarna); their internal designs are not public, so treat this one as a teaching design.

```diagram flow The support desk design
note: A teaching design, not a description of any real company.
- Ticket arrives | into the ASP.NET Core app | input
- Python classifier | gives the ticket category | model
- If it times out | ticket goes to a general queue for manual triage | warn
- LLM with RAG | drafts a reply from help-centre articles | model
- Agent approves | drafts are never sent automatically | output
```

## How it works
1. **Start from the decision**: what does the system decide or produce, for whom, and what does a mistake cost?
2. **Pick the simplest approach** that can work: rules, classic ML, an LLM, RAG, or an agent ([Solve any case](page:solve.html) walks through this choice).
3. **Draw the components** and the data flow; mark where personal data goes.
4. **Define contracts**: versioned JSON request and response with types and limits.
5. **Plan failure**: timeouts, retries with backoff, circuit breakers, and a fallback for every AI call.
6. **Secure it**: authentication between services, least-privilege tools, secrets in a vault, input and output checks.
7. **Package and deploy**: containers, health checks, autoscaling, staged rollout.
8. **Monitor and improve**: the signals from [Monitoring](lesson:ops-monitoring), evaluation runs, and a feedback loop.

The design in this lesson, as a text diagram:
```text Architecture
[Web UI] -> [ASP.NET Core API] --(HTTP /v1/classify, 5 s timeout, retry)--> [Python model service (FastAPI + model file)]
                 |                                                        \-- fallback: manual triage queue
                 |--(IChatClient)--> [LLM: hosted API or local Ollama]
                 |--(embeddings + search)--> [Vector store: help-centre chunks]
                 |--> [SQL database: tickets, decisions, model_version]
                 \--> [Logs + metrics (OpenTelemetry) -> dashboards and alerts]
Secrets: environment variables or a secret store. Every AI output is reviewed by an agent before sending.
```

```diagram fan The ASP.NET Core API at the centre
note: The same design as the text diagram above.
- ASP.NET Core API | the system of record | process
- Python model service | HTTP /v1/classify, 5 s timeout, retry | model
- LLM | hosted API or local Ollama | model
- Vector store | help-centre chunks | store
- SQL database | tickets, decisions, model_version | store
- Logs and metrics | dashboards and alerts | output
```

```diagram lanes Eight design steps in three groups
## Decide
- Start from the decision | who, what, cost of a mistake | input
- Pick the simplest approach | rules, ML, LLM, RAG or agent | process
## Build
- Draw components and data flow | mark personal data | process
- Define contracts | versioned JSON | process
- Plan failure | timeouts, retries, fallback | warn
- Secure it | authentication, vault, checks | warn
## Run
- Package and deploy | containers, health checks, rollout | output
- Monitor and improve | signals, evaluation, feedback | output
```

### Related concepts

#### Retries and fallbacks
A **transient error** is a short-lived failure, such as a timeout or a "try again later" reply. Retry it, but wait longer each time (**backoff**) and stop after a set number of tries. Never retry forever. Set a **timeout** on each call so a slow service cannot block the user. If the retries fail, use a **fallback**: another model, a simpler rule or a safe message. Be careful with **idempotency**: an operation is idempotent if doing it twice has the same effect as doing it once. Give each request an id, so a retry cannot, for example, create the same order twice.

```diagram loop Retry with growing waits, then fall back
loop: Stop after the agreed limit of tries
- Call with a timeout | a slow call counts as a failure | process
- Transient error | timeout or try-again-later reply | warn
- Wait, then retry | longer wait each time, same request id | process
- Limit reached | give up retrying | bad
- Fallback | another model, a simple rule or a safe message | output
```

#### Secrets management
A **secret** is a value that grants access, such as an API key or a password. Keep secrets in environment variables, .NET user secrets (development) or a secret store, never in code or in Git. **Rotate** them, meaning replace them on a schedule and at once if one leaks. Use separate secrets for each environment (development, test, production), so a leak in one does not open the others.

```diagram nest Where a secret is kept
note: Code and Git never hold the secret itself.
- Secret store | the production home, with access control | store
- Environment variables or user secrets | read by the app at start-up | process
- Application code | refers to a setting name, not the value | model
```

#### Deploying to the cloud
Moving an AI app from a laptop to the cloud means packaging it in a **container** and running it somewhere managed. Common options are a managed app service, a virtual machine (a rented computer you manage yourself) or a serverless function (code that runs only when called). Keep configuration and secrets outside the image. Add a **health check** so the platform can restart a broken copy, plus scaling rules, logs and a spending limit with alerts. Choose the option from your needs; check each provider's own documents for details and prices.

```diagram lanes From laptop to cloud
## Package
- Build a container image | app and dependencies, no secrets inside | process
- Store the image | in a registry the platform can reach | store
## Run
- Managed service, virtual machine or serverless | pick by need | model
- Configuration and secrets injected at start | from outside the image | store
## Operate
- Health checks and scaling | restart broken copies, add copies under load | output
- Logs and a cost limit with alerts | see problems and spending early | output
```

## Python example
The Python side: a versioned model service with service-to-service authentication and a health check:
```python classifier_service.py (FastAPI; not run here)
import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="ticket-classifier", version="1.0.0")
MODEL_VERSION = "ticket-tfidf-logreg-2026-10"

class ClassifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    request_id: str = Field(min_length=1, max_length=64)

class ClassifyResponse(BaseModel):
    label: str
    score: float = Field(ge=0, le=1)
    model_version: str
    request_id: str

@app.post("/v1/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest, x_api_key: str = Header(...)):
    if x_api_key != os.environ.get("SERVICE_API_KEY"):
        raise HTTPException(status_code=401, detail="invalid service credentials")
    label, score = predict(req.text)          # model loaded once at start-up
    return ClassifyResponse(label=label, score=score, model_version=MODEL_VERSION, request_id=req.request_id)

@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}
```
A container file for it:
```text Dockerfile (not built here)
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY classifier_service.py model.joblib ./
USER 1000
EXPOSE 8001
CMD ["uvicorn", "classifier_service:app", "--host", "0.0.0.0", "--port", "8001"]
```
The `/health` and `/predict` pattern was shown running in [Serving a model](lesson:ops-serving).

## .NET (C#) example
The .NET side: a typed HTTP client with a timeout, standard resilience (retries, circuit breaker) and a fallback. Note the explicit JSON names, because Python uses `snake_case` and C# uses `PascalCase`.
```cs ClassifierClient.cs
using System.Net.Http.Json;
using System.Text.Json.Serialization;

// Program.cs:
// builder.Services.AddHttpClient<ClassifierClient>(c =>
// {
//     c.BaseAddress = new Uri(builder.Configuration["Classifier:BaseUrl"]!);
//     c.Timeout = TimeSpan.FromSeconds(5);
// }).AddStandardResilienceHandler();          // package Microsoft.Extensions.Http.Resilience

public sealed record ClassifyResponse(
    [property: JsonPropertyName("label")] string Label,
    [property: JsonPropertyName("score")] double Score,
    [property: JsonPropertyName("model_version")] string ModelVersion,
    [property: JsonPropertyName("request_id")] string RequestId);

public sealed class ClassifierClient(HttpClient http, IConfiguration config, ILogger<ClassifierClient> log)
{
    public async Task<ClassifyResponse?> ClassifyAsync(string text, CancellationToken ct)
    {
        try
        {
            using var msg = new HttpRequestMessage(HttpMethod.Post, "/v1/classify")
            {
                Content = JsonContent.Create(new { text, request_id = Guid.NewGuid().ToString("N") })
            };
            msg.Headers.Add("X-Api-Key", config["Classifier:ApiKey"]);   // from user secrets or a vault
            using var res = await http.SendAsync(msg, ct);
            if (!res.IsSuccessStatusCode) return null;
            var result = await res.Content.ReadFromJsonAsync<ClassifyResponse>(cancellationToken: ct);
            return result is { Score: >= 0 and <= 1 } ? result : null;     // validate before use
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            log.LogWarning(ex, "Classifier unavailable; falling back to manual triage");
            return null;                                                  // caller routes to the manual queue
        }
    }
}
```
The full pair of files is in the guide's `examples/hybrid-service` folder.

**Design checklist for any case** (use it for capstones and real projects):
- Decision, users and cost of a wrong answer are written down.
- Simplest workable approach chosen and the reason recorded.
- Baseline measured; evaluation set exists before building.
- Contracts versioned; every AI call has timeout, retry and fallback.
- Personal data mapped and minimised; secrets outside code; least-privilege tools; human approval for consequential actions.
- Monitoring: health, drift, quality, latency, cost, each with threshold and owner.
- Rollout plan (shadow or canary) and rollback plan.
- Cost estimate per 1,000 requests and a monthly budget alert.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Availability of chained services (how reliable the whole system is)
**Where it is used:** estimating how often the support desk can produce a draft when the app, the classifier and the LLM must all work.

```formula Availability
chain of services (all must work):  availability = a1 × a2 × ... × an
two copies of one service (one is enough):  availability = 1 - (1 - a) × (1 - a)
a = the share of time a service works, written as a decimal (99.9% = 0.999)
```
**In plain words:** when every part is needed, the system is less reliable than its weakest part. A spare copy makes the failure chance much smaller.

**Example 1: three services in a chain.** App 0.9995, classifier 0.999, LLM 0.995. Availability = 0.9995 × 0.999 × 0.995 = 0.9935 (about 99.35%). That is roughly 0.65% of the time, or about 57 hours a year (0.0065 × 8,760 hours), without a draft.

**Example 2: a spare copy.** One classifier copy works 99% of the time (a = 0.99). Two copies: 1 - (0.01 × 0.01) = 1 - 0.0001 = 0.9999, or 99.99%.

### Exponential backoff (waiting longer after each failed call)
**Where it is used:** retrying the classifier or LLM call after a timeout without flooding a service that is struggling.

```formula Exponential backoff
wait before retry k = base × 2^(k - 1), but never more than the cap
total waiting = the sum of the waits
```
**In plain words:** each retry waits twice as long as the one before, up to a limit.

**Example 1: four retries.** Base 0.5 seconds, no cap. Waits are 0.5, 1, 2 and 4 seconds. Total = 0.5 + 1 + 2 + 4 = 7.5 seconds.

**Example 2: with a cap.** Base 0.5 seconds, cap 5 seconds, five retries. Waits are 0.5, 1, 2, 4 and then 8 is cut to 5. Total = 0.5 + 1 + 2 + 4 + 5 = 12.5 seconds. After that, send the ticket to the general queue.

## Maths behind it
- Queueing theory and capacity planning
- Probability of failure (availability of chained services)
- Exponential backoff

## Common mistakes
- One giant service that mixes web app, model training and serving.
- No fallback, so a model outage stops the business process.
- Mismatched JSON naming between Python and .NET, giving silent nulls.
- API keys in source code or in the front end.
- Letting an LLM take actions with no human approval.
- Retrying without a limit or a growing wait, or retrying an action that is not idempotent.
- Using the same secrets in development and production, and never rotating them.

```diagram compare One giant service versus separate parts
## One giant service | bad
- Web app, training and serving mixed together
- A model outage stops everything
## Separate services | output
- Each part has its own versioned contract
- Each side changes independently
- A fallback keeps the process running
```

## Quick check
Q: Why do many .NET companies call a separate Python service for ML?
A: Most ML libraries are Python-first; a separate service with a versioned contract lets each side use its best tools and change independently.

Q: What should happen when the model service times out?
A: A fallback: a simpler rule, a cached answer or a human queue, so the business process continues; log the event.

Q: Where should API keys live?
A: In environment variables, .NET user secrets for development, or a secret store in production; never in code or the browser.

Q: Why does idempotency matter when you retry?
A: A retry may repeat an action that already worked; if the action is idempotent, the repeat has no extra effect.
