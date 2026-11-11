---
id: app-llm-api
title: Calling an LLM from your application
module: apps
level: Beginner
minutes: 75
goal: Call a language model from Python and C#, request structured JSON, validate it, handle failures, stream answers and control cost.
prereqs: llm-how
reviewed: 2026-11-02
evidence: The same support-email summarizer working in Python and C#, rejecting invalid output, with token use and latency logged for 20 test emails.
code: Python validator executed 2026-11-02 (examples/llm-summarizer/python, offline mode and 4 unit tests); live model calls and C# not run (no API key, no .NET SDK in the build environment)
---
## In plain words
Your application talks to an LLM through an **API**: you send **messages** and get text back. A **system message** sets the rules ("You summarise support emails. Reply with JSON only."); **user messages** carry the content. You pay per **token** in and out, so long prompts and long answers cost more. For anything a program will use, ask for **structured output** (JSON with named fields) and **validate** it like any untrusted input: the model can still return broken JSON or values you did not allow. Plan for failure: timeouts, rate limits, invalid output. **Streaming** shows the answer word by word so users are not left waiting. Keep API keys in configuration, never in code, and only send data you are allowed to share with the provider.

```diagram flow One request to an LLM API
note: Your application sends messages and gets text back. You pay for the tokens in both directions.
- Your application | Builds the messages and keeps the API key in configuration | input
- Messages | A system message with the rules plus user messages with the content | input
- LLM API | Receives the request and counts tokens in | process
- Model | Writes the reply one token at a time | model
- Reply text | Ideally JSON with named fields; tokens out are counted | output
```

```diagram layers What goes into the messages
note: The system message sets the rules. User messages carry the content to work on.
- System message | Rules, for example "Reply with JSON only" | input
- User message | The content, for example the support email | input
- Reply | Text that your code must treat as untrusted | output
```

```diagram compare Waiting versus streaming
## Without streaming | bad
- User waits with nothing on screen
- Whole answer appears at the end
## With streaming | output
- Answer appears word by word
- User can start reading at once
```

## Real-world example
A support team receives hundreds of emails a day. Each one is summarised with a priority and a suggested next action, so agents sort their queue faster. A person still reads the email before replying; the model saves triage time, it does not make the decision.

## How it works
1. Define the output contract: `summary`, `priority` (low, medium or high) and `next_action`.
2. Write a system message with the fields, allowed values and "do not invent details".
3. Call the model with a timeout and low temperature.
4. Parse and validate; reject unknown priorities, missing fields and prose around the JSON.
5. On failure retry once, then send the email to a person.
6. Log tokens, latency and validation failures (not full email text).

```diagram flow The summarizer step by step
note: A person is the fallback when validation fails twice.
- Output contract | summary, priority, next_action | input
- System message | Fields, allowed values, "do not invent details" | input
- Call the model | With a timeout and low temperature | model
- Parse and validate | Reject unknown values, missing fields and prose | process
- Retry once, then a person | Never loop forever | warn
- Log | Tokens, latency and failures, not full email text | store
```

```diagram fan Validating the model reply
note: Treat the reply like any untrusted input.
- Model reply | JSON text from the model | model
- Valid | All fields present and priority is low, medium or high | output
- Broken JSON | Cannot be parsed | bad
- Unknown priority | A value you did not allow | bad
- Prose around the JSON | Extra text before or after | bad
```

### Related concepts

#### System prompts
A system prompt is the standing instruction text that comes before the user's message. It sets the role, the rules and the output format for every turn. The user message is the changing request that the rules apply to. Models usually give the system prompt more weight, but it is not a security boundary: a determined user can sometimes talk the model around it. Never put secrets in it, and enforce real limits in your own code.

```diagram compare System prompt versus user message
note: Both are part of the same input. Neither one is a lock.
## System prompt | input
- Standing rules, role and format
- Written by you, the developer
- Same on every request
## User message | process
- The changing request or content
- Comes from the person or the data
- Different on every request
```

#### Structured outputs
Structured output means asking the model for JSON that matches a schema you define: named fields, allowed values and types. Some providers can enforce a schema while the model writes, and others only follow it as an instruction. Either way, validate the reply in your own code. If it is invalid, retry once with the error message, then hand the item to a person.

```diagram loop Structured output with a retry
note: Validation always runs in your code, never inside the model.
- Ask for JSON | Describe the schema and allowed values | input
- Model replies | Text that should be JSON | model
- Validate | Check fields, types and allowed values | process
- Retry with the error | Say what was wrong, once | warn
loop: If still invalid, send to a person
```

#### Tool calling
Tool calling lets the model ask your code to do something it cannot do alone, such as look up an order. You describe each function (name, purpose, inputs). The model replies with a request to call one with specific inputs. Your code runs the function, checks that the request is allowed, and sends the result back. The model then uses that result to write its answer. The model never runs code itself. See [Agents](lesson:app-agents) for loops of many tool calls.

```diagram lanes Who does what in a tool call
## The model
- Reads the question and the tool list | Decides a tool is needed | model
- Writes a tool request | Function name and inputs | model
- Writes the final answer | Uses the tool result | output
## Your code
- Checks the request is allowed | Validate the inputs | process
- Runs the function | For example an order lookup | process
- Returns the result to the model | As a new message | store
```

#### Streaming
Streaming sends the reply to your application in small pieces as the model writes it. The user can start reading at once. The key measure is time to first token: how long before the first piece arrives. A stream can fail half way, so keep what has arrived, show that the answer is incomplete, and offer a retry. Do not act on half-finished JSON: parse only after the stream ends.

```diagram flow Streaming and a failure mid-stream
- Request sent | Same messages as a normal call | input
- First token arrives | Time to first token is the wait so far | model
- Pieces keep arriving | Show them as they come | output
- Stream breaks | Keep the partial text and mark it incomplete | warn
- Retry or fall back | Try again or show a clear message | process
```

#### Picking a model
There is no single best model, only the best fit for your task. Compare candidates on these points.
- Task difficulty: easy tasks rarely need the largest model.
- Quality on your own evaluation set, not on general claims.
- Latency and cost for your real traffic.
- Context length: can it hold your documents?
- Privacy and where it can run: hosted, private cloud or your own hardware.
- Licence, for open-weight models.
- Ability to follow a structure and to call tools.

Start with a strong model to find the best quality you can get, then try cheaper and smaller ones against the same test set. Re-test when a provider changes or retires a model.

```diagram flow Choosing a model step by step
- Build an evaluation set | Real inputs with the answers you expect | input
- Try a strong model first | This shows the quality ceiling | model
- Try cheaper models | Same test set, same prompt | process
- Check cost, speed and privacy | Does it fit your limits? | process
- Pick the smallest that passes | Write down why | output
- Re-test on model changes | Providers update models | warn
```

#### Cost and latency
Cost grows with the tokens you send and receive. Latency is the time the user waits. Both depend on input tokens, output tokens, model size, the number of calls per task and retries. Levers: shorter prompts, prompt caching (see [Prompt engineering](lesson:app-prompting)), smaller models for easy steps, streaming (does not shorten the work, but feels faster), and batching of work that is not urgent. Measure first: log tokens and time per call. See [Scaling and cost](lesson:ops-scale).

```diagram fan What drives cost and latency
note: Change the biggest driver first. Measure before guessing.
- Cost and latency | What your user and your bill feel | output
- Input tokens | Long prompts and documents | input
- Output tokens | Long answers | input
- Model size | Larger models are slower and cost more | model
- Number of calls | Chains and agents multiply calls | process
- Retries | Each retry pays again | bad
```

## Python example
```python summarize.py (excerpt; any OpenAI-compatible endpoint, configured by environment variables)
response = client.chat.completions.create(
    model=os.environ["LLM_MODEL"],
    messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": email}],
    response_format={"type": "json_object"}, temperature=0, timeout=30)
result = parse_summary(response.choices[0].message.content or "")   # raises on invalid output
```
```text Output of summarize.py --offline (executed: validates a sample model reply without calling a model)
summary:     Customer received order 55812 with a cracked glass panel and needs a replacement before a client visit next Tuesday.
priority:    high
next_action: Confirm the damage with a photo and arrange express replacement shipping.
```
The validator has 4 unit tests (valid reply, unknown priority, missing field, prose instead of JSON), all passing.

## .NET (C#) example
`Microsoft.Extensions.AI` gives one interface, `IChatClient`, for any provider. `GetResponseAsync<T>` asks for JSON matching a C# type and turns it into an object (packages `Microsoft.Extensions.AI` and `Microsoft.Extensions.AI.OpenAI`, or `OllamaSharp` for a local model):
```cs Program.cs (ASP.NET Core minimal API)
using Microsoft.Extensions.AI;
using OpenAI;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddChatClient(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new OpenAIClient(config["Llm:ApiKey"]).GetChatClient(config["Llm:Model"]).AsIChatClient();
});
var app = builder.Build();

app.MapPost("/summaries", async (SummaryRequest request, IChatClient chat, CancellationToken ct) =>
{
    var messages = new List<ChatMessage>
    {
        new(ChatRole.System, "Summarise the support email. priority must be low, medium or high. Do not invent details."),
        new(ChatRole.User, request.EmailText),
    };
    ChatResponse<EmailSummary> response = await chat.GetResponseAsync<EmailSummary>(messages, cancellationToken: ct);
    if (!response.TryGetResult(out var s) || s is null || s.Priority is not ("low" or "medium" or "high"))
        return Results.Problem("Invalid model output; route this email to a person.", statusCode: 502);
    Console.WriteLine($"tokens in {response.Usage?.InputTokenCount}, out {response.Usage?.OutputTokenCount}");
    return Results.Ok(s);
});
app.Run();

public record SummaryRequest(string EmailText);
public record EmailSummary(string Summary, string Priority, string NextAction);
```
Store the key with `dotnet user-secrets set "Llm:ApiKey" "<key>"` locally and a secret store in production.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Token cost (what a call costs)
**Where it is used:** budgeting calls to an LLM API, which bills input and output tokens separately.

```formula Cost of one call
cost = input tokens × input price + output tokens × output price
```
Prices are per token. Below, the made-up prices are 2 units per million input tokens and 8 units per million output tokens. They are not real prices.

**In plain words:** count the tokens in and out, and multiply each by its price. Output tokens usually cost more.

**Example 1: one call.** 1,500 input tokens and 300 output tokens. Input = 1,500 × 2 ÷ 1,000,000 = 0.0030. Output = 300 × 8 ÷ 1,000,000 = 0.0024. Total = 0.0054 units.

**Example 2: one day of traffic.** 10,000 such calls: 10,000 × 0.0054 = 54 units per day. Halving the input tokens saves 10,000 × 0.0015 = 15 units per day.

### Expected attempts with retries (when calls sometimes fail)
**Where it is used:** planning retries for rate-limit or timeout errors.

```formula Expected attempts
expected attempts = 1 ÷ (1 - p)
```
p is the chance that one attempt fails (between 0 and 1), assuming retries continue until one works.

**In plain words:** the more often a call fails, the more tries you need on average, and the more you pay in time.

**Example 1: occasional failures.** p = 0.2. Expected attempts = 1 ÷ 0.8 = 1.25. If one attempt takes 2 seconds, the average is 2 × 1.25 = 2.5 seconds.

**Example 2: a bad hour.** p = 0.5. Expected attempts = 1 ÷ 0.5 = 2, so the average is 2 × 2 = 4 seconds. That is why you cap retries and back off.

## Maths behind it
- Probability and sampling (temperature)
- Tokenisation (byte-pair encoding)
- None needed for validation: it is ordinary software engineering

## Common mistakes
- Trusting model output without validation.
- Hard-coding API keys or logging full customer emails.
- No timeout, so one slow call blocks the whole request pipeline.
- Ignoring cost: long prompts sent thousands of times a day add up.
- Treating the system prompt as a security boundary or putting secrets in it.
- Choosing a model by reputation instead of testing it on your own evaluation set.
- Acting on half-finished streamed JSON instead of waiting for the end of the stream.

```diagram compare Risky and safe habits
## Risky | bad
- Output used without validation
- API key written in code
- Full customer emails in logs
- No timeout on the call
## Safe | output
- Output validated first
- Key kept in configuration
- Log tokens and latency only
- Timeout set on every call
```

## Quick check
Q: Why validate JSON you asked the model to produce?
A: The model can still return broken JSON, missing fields or values outside the allowed set; treat output as untrusted input.

Q: What should happen when validation fails twice?
A: Stop retrying, route the item to a person and log the reason.

Q: What is the benefit of `IChatClient` in .NET?
A: Business code does not depend on one provider; you can switch providers or use a local model by configuration.

Q: How should you choose between a strong model and a cheaper one?
A: Test a strong model first to find the best quality, then try cheaper models on the same evaluation set and keep the smallest one that passes.
