---
id: app-genai-agentic
title: "Generative AI and Agentic AI: the whole picture"
module: apps
level: Advanced
minutes: 60
goal: Explain in simple words what generative AI and agentic AI are, how they differ and work together, and decide when a task needs one, the other, both, or neither.
prereqs: llm-how, app-llm-api, app-agents
reviewed: 2026-11-05
evidence: A one-page note for a real task of your choice that says whether it needs generative AI, an agent, both or neither, with the steps, the tools, the checks and where a person approves.
code: Python not run (the build environment has no Python); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
**Generative AI** is AI that makes something new: text, pictures, sound, video or code. You give it a request, called a **prompt**, and it writes an answer. It makes the answer one small piece at a time, by guessing what should come next. **Agentic AI** is AI that does things for you. An **agent** is a program that uses a generative model as its brain. It looks at a goal, picks a step, uses a **tool** (such as a search, a database or an email), looks at the result, and repeats until the job is done. A simple way to remember it: generative AI **writes**, agentic AI **acts**. Most agents need generative AI inside, but most generative AI does not need an agent. Many useful products use plain generative AI, and that is a good thing: it is simpler, cheaper and safer. Use an agent only when the task needs several steps and real actions.

```diagram compare Generative AI and agentic AI side by side
note: An agent usually contains a generative model. The reverse is not true.
## Generative AI | model
- Makes new text, images, sound or code
- One request in, one answer out
- You read the answer and decide what to do
## Agentic AI | process
- Works toward a goal in many steps
- Uses tools: search, files, databases, email
- Takes actions, so it needs limits and approval
```

```diagram nest Where each idea sits
note: Each layer is built from the layer inside it.
- Agentic AI | Plans, uses tools, repeats until done | process
- Generative AI | Writes the plan, the questions and the answers | model
- Machine learning | The model learned from many examples | input
```

```diagram layers Ladder from simple to powerful
note: Climb only as high as the task needs. Each step up adds cost and risk.
- Plain program | Fixed rules, no AI | input
- Generative AI answer | One prompt, one reply | model
- Generative AI with your documents | Answers from your own files (RAG) | store
- Workflow of fixed steps | Several model calls in a set order | process
- Agent | The model chooses the steps and the tools | warn
```

## Real-world example
A small online shop gets this email: "My order A-1001 has not arrived and I want my money back."

**With generative AI only.** The model reads the email and writes a polite reply draft: "Sorry about the delay. Please give us a few days." A person checks the draft and sends it. The model did not look up the order. It only wrote words.

**With an agent.** The agent reads the same email and has three tools: *find the order*, *check the delivery*, and *prepare a refund*. It finds order A-1001, sees it was lost in transit, prepares a refund, and then **stops and asks a person to approve** the refund because money is involved. After approval it writes the reply with the real facts. The agent took actions. The person kept control of the risky step.

```diagram lanes Same email, two ways
note: The agent does the lookups. A person still approves the refund.
## Generative AI only | model
- Reads the email | Customer asks for a refund | input
- Writes a draft reply | No order lookup | output
- Person checks and sends | All the work after the draft is manual | process
## Agent | process
- Reads the email | Customer asks for a refund | input
- Looks up the order | Tool: find the order | store
- Prepares the refund | Tool: refund (needs approval) | warn
- Person approves | The risky step stays human | output
```

## How it works
1. **Generative AI first.** A model, trained on a large amount of text, pictures or sound, learns patterns. When you send a prompt it builds the answer one small piece (a **token**) at a time, choosing a likely next piece each time. This is why the answer can sound confident and still be wrong.
2. **Give it knowledge when needed.** The model only knows what it learned in training. To answer from your own documents, you add them to the prompt. This is called RAG (see [RAG](lesson:app-rag)).
3. **Add tools to make an agent.** You describe each tool in words: its name, what it does and what it needs. The model answers with "use this tool with these inputs". Your program runs the tool and shows the result to the model. The model is never the one that presses the button.
4. **Run the loop.** The agent repeats: *think about the goal, choose a step, run a tool, read the result*. It stops when the goal is met, when it is stuck, or when a limit is reached (a maximum number of steps, a time limit or a money limit).
5. **Add safety.** Give each tool the smallest power it needs. Ask a person to approve anything that spends money, sends messages or deletes data. Treat every outside text as untrusted. Write down every step so you can check it later.
6. **Test it.** Run the same set of example tasks every time you change something, and count how many finish correctly (see [Evals](lesson:app-evals)).

```diagram flow How generative AI becomes an agent
note: The first two steps are generative AI. The rest is the agent loop.
- Goal or prompt | What you want done | input
- Model thinks | Writes the next step in words | model
- Tool runs | Your program does it, not the model | process
- Result comes back | The model reads what happened | store
- Done or repeat | Stop at the goal or at a limit | output
```

```diagram loop The agent loop
note: Always set a step limit so the loop cannot run for ever.
- Look at the goal and what is known | The model reads the situation | input
- Choose one step | Answer, or use a tool | model
- Run the tool | With limits and approval for risky ones | process
- Read the result | Add it to what is known | store
loop: Repeat until the goal is met or a limit is reached
```

```diagram matrix What does the task need?
note: Match the tool to the task. Start with the simplest.
x: Few steps | Many steps
y: No real actions | Real actions
- Generative AI alone | Write, summarise, translate, explain | model
- Fixed workflow | Many steps in a set order, no actions | process
- One tool call | A fixed step that uses one tool, with approval if risky | process
- Agent with human approval | Many steps and real actions: highest risk | warn
```

### Related concepts
- **Generative AI types.** Text models (chat, writing, code), image models, speech and music models, and video models. Many modern models handle several kinds at once (see [multimodal apps](lesson:app-multimodal)). Image models often use *diffusion*: they start from noise and clean it up step by step (see [generative models](lesson:dl-generative)).
- **Hallucination.** When a generative model states something false in a confident voice. It happens because the model picks likely words, not checked facts. Reduce it with your own documents, clear rules ("say you do not know") and checks.
- **Workflow versus agent.** In a workflow, *you* decide the steps and the order. In an agent, *the model* decides. Workflows are easier to test and cheaper. Choose a workflow whenever the steps are known in advance.
- **Multi-agent system.** Several agents, each with one job (for example, a researcher and a writer), passing work to each other. It adds cost and more ways to fail, so start with one agent.
- **Human in the loop.** A person approves the risky steps. This is the main safety tool for agents (see [agents with human approval](lesson:app-agents)).
- **Guardrails.** Rules and checks around the model: allowed tools, limits, input checks and output checks (see [security](lesson:app-security)).
- **Prompt injection.** Hidden instructions in a web page, email or file that try to take control of the agent. Treat all outside text as data, never as orders.
- **Cost and speed.** An agent makes many model calls for one task, so it costs more and takes longer than a single answer. Measure both.

```diagram compare Workflow or agent?
## Workflow | process
- You choose the steps
- Same path every time
- Easier to test and cheaper
## Agent | warn
- The model chooses the steps
- Path can change each time
- Harder to test; needs limits and approval
```

```diagram fan What can go wrong
note: Each risk has a simple defence.
- Agent task | A goal that needs several steps and tools | process
- Wrong facts | Check against your documents | warn
- Wrong tool or wrong input | Validate inputs; allow few tools | warn
- Endless loop | Step, time and money limits | warn
- Hidden instructions in text | Treat outside text as data | bad
- Risky action | A person approves | output
```

## Python example
This small program shows the agent loop with **no model and no internet**. A plain function stands in for the model, so you can read every step. In a real agent, the `decide` function would be a call to a language model (see [LLM API](lesson:app-llm-api)). It was not run in the build environment, so there is no output block here. Run it yourself to see each step.
```python agent_loop.py (not run here)
# A tiny agent loop with a fake "model". No packages needed.

ORDERS = {"A-1001": {"status": "lost", "total": 25.00}}

def find_order(order_id):
    return ORDERS.get(order_id, {"status": "not found"})

def prepare_refund(order_id):
    # Risky tool: it only PREPARES a refund. A person must approve it.
    return {"refund_prepared_for": order_id, "needs_approval": True}

TOOLS = {"find_order": find_order, "prepare_refund": prepare_refund}

def decide(goal, history):
    """Stand-in for the model. A real model reads the goal and history and picks the next step."""
    if not history:
        return {"tool": "find_order", "input": "A-1001"}
    last = history[-1]["result"]
    if last.get("status") == "lost" and len(history) == 1:
        return {"tool": "prepare_refund", "input": "A-1001"}
    return {"answer": "Order A-1001 was lost. A refund is ready for approval."}

def run_agent(goal, max_steps=5):            # a step limit stops endless loops
    history = []
    for step in range(1, max_steps + 1):
        action = decide(goal, history)
        if "answer" in action:
            return action["answer"], history
        result = TOOLS[action["tool"]](action["input"])
        history.append({"step": step, "tool": action["tool"], "result": result})
        print(f"step {step}: {action['tool']}({action['input']}) -> {result}")
        if result.get("needs_approval"):     # human in the loop
            ok = input("Approve this refund? (y/n) ").strip().lower() == "y"
            if not ok:
                return "Stopped: a person did not approve the refund.", history
    return "Stopped: step limit reached.", history

answer, steps = run_agent("Customer says order A-1001 never arrived and wants a refund")
print(answer)
```
Notice the three safety ideas: a **step limit**, tools that only **prepare** risky actions, and a **person who approves**.

## .NET (C#) example
The same loop in C#, with a plain method standing in for the model:
```cs AgentLoop.cs (not compiled here)
using System;
using System.Collections.Generic;

var orders = new Dictionary<string, string> { ["A-1001"] = "lost" };

string FindOrder(string id) => orders.TryGetValue(id, out var s) ? s : "not found";
string PrepareRefund(string id) => $"refund prepared for {id} (needs approval)";

// Stand-in for the model. A real agent would call a language model here.
(string? Tool, string? Input, string? Answer) Decide(int stepsDone, string lastResult) =>
    stepsDone == 0 ? ("find_order", "A-1001", null)
  : stepsDone == 1 && lastResult == "lost" ? ("prepare_refund", "A-1001", null)
  : (null, null, "Order A-1001 was lost. A refund is ready for approval.");

const int maxSteps = 5;                      // step limit
var last = "";
for (var step = 0; step < maxSteps; step++)
{
    var (tool, input, answer) = Decide(step, last);
    if (answer is not null) { Console.WriteLine(answer); return; }

    last = tool == "find_order" ? FindOrder(input!) : PrepareRefund(input!);
    Console.WriteLine($"step {step + 1}: {tool}({input}) -> {last}");

    if (tool == "prepare_refund")            // human in the loop
    {
        Console.Write("Approve this refund? (y/n) ");
        if (Console.ReadLine()?.Trim().ToLowerInvariant() != "y")
        { Console.WriteLine("Stopped: a person did not approve the refund."); return; }
    }
}
Console.WriteLine("Stopped: step limit reached.");
```
For a real model in .NET, use Microsoft.Extensions.AI and describe your methods as tools (see [Tools and agents](lesson:app-agents) and [Frameworks](lesson:app-frameworks)).

## Applied Maths - Statistics
Short, optional reading. The numbers are small, made-up values chosen so you can check them by hand.

### How much does an agent run cost? (tokens and steps)
**Where it is used:** estimating the money and time of an agent before you build it.

```formula Cost of one agent run
tokens per run = steps × tokens per step
cost per run   = tokens per run × price per token
```
**In plain words:** an agent calls the model once per step, and every call costs tokens. More steps means more cost. A **token** is a small piece of text (see [tokens](lesson:llm-tokens)).

**Example 1: a short run.** 4 steps, 1,500 tokens per step. Tokens = 4 × 1,500 = 6,000. With a made-up price of 0.000002 per token, cost = 6,000 × 0.000002 = 0.012 per run.

**Example 2: a long run.** 20 steps, 3,000 tokens per step (the history grows). Tokens = 20 × 3,000 = 60,000. Cost = 60,000 × 0.000002 = 0.12 per run. This is 10 times the cost of Example 1, so a step limit also protects your budget.

### Chance that every step works (why long agents fail more)
**Where it is used:** deciding how many steps an agent can safely take.

```formula Success across a chain of steps
chance all steps work = p × p × ... × p   (n times) = p^n
p = chance that one step works (0.90 means 90%), n = number of steps
```
**In plain words:** if each step can fail, many steps in a row make failure more likely.

**Example 1: 3 steps.** p = 0.90. Chance = 0.90 × 0.90 × 0.90 = 0.729, about 73%.

**Example 2: 10 steps.** p = 0.90. Chance = 0.90^10 ≈ 0.349, about 35%. The same careful steps, but far less reliable. This is why you keep agents short and check results along the way.

## Maths behind it
- Probability (next-word choice, chance of a chain of steps working)
- Basic arithmetic for token and cost estimates
- Statistics for testing: counting how many example tasks succeed

## Common mistakes
- Using an agent when one model answer, or a fixed workflow, would do. Agents cost more and are harder to test.
- Giving an agent powerful tools without limits, approval or a step limit.
- Trusting the answer because it sounds sure. Generative AI can be fluently wrong.
- Letting the agent read emails, web pages or files and obey them. Hidden instructions inside can take control.
- Not testing. Run the same examples after every change and count the successes.
- Starting with many agents. Start with one, then add more only if you must.

```diagram compare Good and weak habits
## Weak | bad
- An agent for every task
- Powerful tools, no approval
- No step or money limit
- Believe every confident answer
## Strong | output
- The simplest thing that works
- Small tools; a person approves risky steps
- Step, time and money limits
- Check answers and test on fixed examples
```

## Quick check
Q: In one sentence, what is the difference between generative AI and agentic AI?
A: Generative AI makes new content from a prompt; agentic AI uses a generative model plus tools, in a loop, to take actions toward a goal.

Q: A task needs the same four steps every time. Should you build an agent?
A: Usually no. Use a fixed workflow: it is easier to test, cheaper and more predictable. Use an agent only when the model must choose the steps.

Q: Name three safety ideas for an agent.
A: Any three of: a step, time and money limit; small tools; a person approves risky actions; treat outside text as data; log every step.

Q: An agent has 10 steps and each step works 90% of the time. About how often do all steps work?
A: About 35% (0.90 to the power of 10 is about 0.35). Long chains fail more often, so keep agents short and check results.
