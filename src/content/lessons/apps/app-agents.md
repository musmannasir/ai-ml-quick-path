---
id: app-agents
title: Tools and agents with human approval
module: apps
level: Advanced
minutes: 120
goal: Let a model call tools safely, design an agent workflow with explicit state, permission checks, human approval, retries, idempotency and an audit trail, in Python and C#.
prereqs: app-llm-api, app-prompting
reviewed: 2026-11-02
evidence: A refund workflow (in either language) passing scripted tests for success, decline, wrong owner, outside policy, service failure and duplicate requests.
code: Python framework-free workflow executed 2026-11-02 (examples/agent-returns/returns_workflow.py); LangGraph and C# (Microsoft Agent Framework) not run (not installed in the build environment)
---
## In plain words
**Tool calling** lets a model ask your application to run a function: you describe each tool (name, purpose, inputs), and instead of text the model returns "call `get_order_status` with order A-1001". **Your code** checks the request, checks the user is allowed, runs it and returns the result; the model never executes anything itself. An **agent** is a system where the model chooses steps and tools within limits that your code sets, keeping **state** between steps. For business processes, the safest design is a mostly fixed **workflow** with model-powered steps (understand the request, draft a message), not an open-ended loop. Actions that change the world, especially money, need **permission checks**, **human approval**, **idempotency** (repeating a request does not repeat the refund), **retries** for temporary failures, and an **audit log**. The **Model Context Protocol (MCP)** is an open standard for exposing tools and data to AI applications (see [Frameworks](lesson:app-frameworks)).

```diagram loop Tool calling
note: The model only asks. Your code checks, runs the tool and returns the result.
- Model asks for a tool | For example call get_order_status with order A-1001 | model
- Your code checks the request | Valid inputs? Is the user allowed? | warn
- Your code runs the tool | The model never executes anything itself | process
- Result goes back to the model | It writes the reply | output
loop: Repeat while the model asks for more tools
```

```diagram nest Agent inside limits set by your code
- Your application | Sets the limits and keeps the state | process
- Agent | The model chooses steps and tools within those limits | model
- Tools | Functions your code describes and runs | input
```

```diagram compare Workflow and open-ended loop
## Mostly fixed workflow | output
- Safest for business processes
- Model steps: understand, draft a message
## Open-ended loop | warn
- The model chooses every step
- Harder to control and test
```

```diagram fan Safeguards for actions that change the world
- Action that changes the world | Especially money | input
- Permission check | Is this user allowed? | warn
- Human approval | A person approves or declines | warn
- Idempotency | Repeating a request does not repeat the refund | process
- Retries | For temporary failures | process
- Audit log | Every step and decision recorded | store
```

## Real-world example
The [Klarna case](case:klarna) describes an assistant handling customer-service chats including refunds and returns. A typical safe design for such a system: the assistant checks the order and the policy, drafts the refund, and money moves only after rules or a person approve it, with every step logged.

## How it works
1. **Understand:** the model extracts intent and order id (structured output).
2. **Verify:** load the order with the user's identity from the session; reject if not theirs.
3. **Policy:** reject if outside the 30-day window.
4. **Draft:** create the proposed action, such as refund 59.90.
5. **Approve:** pause until a person approves or declines; the pause must survive restarts.
6. **Execute:** call the payment service with an idempotency key; retry temporary failures.
7. **Audit:** record every step and decision.

```diagram flow The refund workflow with human approval
note: Steps 1 to 4 can stop the request. Step 5 waits for a person and must survive restarts.
- Understand | Model extracts intent and order id | model
- Verify | Load the order with the session identity; reject if not theirs | warn
- Policy | Reject outside the 30-day window | warn
- Draft | Propose the action, such as refund 59.90 | process
- Approve | Pause until a person approves or declines | warn
- Execute | Payment call with an idempotency key; retry temporary failures | process
- Audit | Record every step and decision | store
```

```diagram fan Possible results of the refund workflow
note: Results from the executed run of the Python workflow.
- Refund request | One order | input
- Refunded | Happy path, or a flaky service that recovers | output
- Declined by reviewer | Pending; customer will be contacted | warn
- Rejected | Not the owner, or outside the window | bad
- Failed | Payment service down; queued for manual follow-up | bad
```

### Related concepts
- **Multi-agent systems**: several agents with different roles (for example a planner, a researcher and a reviewer) passing work between them. They can help with large tasks but add cost, latency and new failure modes. Start with one agent and a clear workflow; split only when one agent clearly struggles.

```diagram fan Multi-agent system
note: Helpful for large tasks, but adds cost, latency and new failure modes.
- Planner | Splits the task and passes work on | model
- Researcher | Finds the facts | model
- Reviewer | Checks the result | model
```

- **Planning**: the agent writes a list of steps before acting, then follows and updates it.

```diagram loop Planning
- Write a list of steps | Before acting | model
- Do the next step | Use tools if needed | process
- Update the list | Based on what happened | model
loop: Repeat until the plan is done
```

- **Memory**: short-term memory is the conversation so far; long-term memory is facts saved to a store and retrieved later (often with RAG).

```diagram compare Two kinds of memory
## Short-term | process
- The conversation so far
## Long-term | store
- Facts saved to a store
- Retrieved later, often with RAG
```
- **AI coding assistants** (code completion and coding agents in the editor) are agents specialised for software: their tools read files, run tests and propose changes for a developer to review.

The sections below go deeper into each idea, in the order you will meet them when you build an agent.

#### The agent loop
An agent runs in a loop. It **observes** what it knows so far (the goal, the history, the latest result). It **decides** what to do next. It **calls a tool** through your code, then **reads the result**, and goes round again. The loop ends when the model says the goal is done, or when your code hits a limit such as a maximum number of steps. The limit is not optional: without it, a confused agent can loop for ever and spend money.

```diagram loop The agent loop
note: Your code owns the loop and the stop conditions.
- Observe | Read the goal, the history and the last result | input
- Decide | The model picks the next step or says it is done | model
- Call a tool | Your code checks the request and runs it | process
- Read the result | The result is added to the history | store
loop: Repeat until done or a limit is hit
```

```diagram flow How the loop stops
- Model says it is done | A final answer, no more tool requests | output
- Step limit reached | Your code stops the run after a set number of steps | warn
- Budget or time limit reached | Stop when the allowed cost or time is used | warn
- Report to the user | Give the answer, or say clearly why it stopped | output
```

#### Designing tools
The model only sees your tool descriptions, so they are part of your design. Give each tool a clear **name** and a short **description** that says when to use it. Keep the purpose **narrow**: one tool, one job. Use **typed inputs** (for example an order id as text, an amount as a number) and validate them in code. Return **helpful errors** that tell the model what to fix, such as "order not found; check the id". Apply **least privilege**: a tool gets only the access its job needs. Make tools **idempotent** where possible, so a repeat does not repeat the effect. Return **only what the model needs**, because every extra field uses context and may leak data.

```diagram layers A well designed tool
note: Each layer is a design decision you make.
- Name and description | Clear, says when to use it | input
- Typed and validated inputs | Wrong types are rejected before anything runs | warn
- Least privilege | Only the access this one job needs | warn
- Idempotent action | A repeat does not repeat the effect | process
- Small, helpful result | Only what the model needs, with clear errors | output
```

```diagram compare Broad tool and narrow tool
## Too broad | bad
- run_anything(command)
- Can read or change any data
- Errors are vague
## Narrow | output
- get_order_status(order_id)
- Reads one customer's own orders
- Errors say what to fix
```

#### MCP, the Model Context Protocol
MCP is one standard way to plug tools and data into many AI applications. A tool is written once as an MCP server, and any AI app that speaks MCP can use it, instead of each app needing its own custom connector. The detail, with examples, is in [Frameworks](lesson:app-frameworks). The design rules above still apply to every MCP tool.

```diagram fan One standard, many apps
- MCP server | Exposes tools and data in the standard way | store
- AI app A | Uses the tools through MCP | model
- AI app B | Uses the same tools through MCP | model
```

#### Planning
Planning means breaking a goal into steps. There are two styles. In **plan then act**, the agent writes the whole plan first and then follows it. This is easy to review, but the plan can go out of date. In **act step by step**, the agent decides each step after seeing the last result. This adapts well but can drift. In both styles, when a step fails the agent should **re-plan**: change the remaining steps instead of repeating the failed one blindly.

```diagram compare Two planning styles
## Plan then act | process
- Write all steps first
- Easy for a person to review
- Can go stale as facts change
## Act step by step | model
- Decide after each result
- Adapts to new facts
- Can drift from the goal
```

```diagram flow Re-planning after a failed step
- Run a step | Call the tool | process
- Step fails | For example an order is not found | bad
- Read the error | Work out what changed | model
- Change the remaining plan | Try another route, or ask a person | model
```

#### Memory
**Short-term memory** is what sits inside the context window (the text the model can see in one call): the conversation and a scratchpad of notes the agent writes for itself. It disappears when the run ends and is limited by the window size. **Long-term memory** is facts saved outside the model, for example in a database, and retrieved later when relevant. There are risks. A memory can be **stale** (no longer true) or simply **wrong**, and the agent will trust it. Memories can also hold **private** data, so decide what may be stored, who can read it, and how a user can delete it.

```diagram layers Where memory lives
note: Short-term memory is in the context window. Long-term memory is outside it.
- Context window | Conversation and scratchpad for this run | process
- Retrieval step | Finds saved facts that match the task | process
- Memory store | Long-term facts saved outside the model | store
```

```diagram matrix Memory risks
x: Fact is correct | Fact is wrong or stale
y: Not private | Private data
- Safe to reuse | Correct and not private | output
- Wrong memory | Not private, but the agent trusts a bad fact | warn
- Needs care | Correct but private; limit who can read it | warn
- Worst case | Wrong and private; may be acted on or leaked | bad
```

#### Multi-agent systems
In a multi-agent system, several agents with different roles work on one task and pass work between them. The roles can be fixed, for example a planner, a researcher and a reviewer. Each agent has its own instructions and often its own tools. This can help on large tasks, but every extra agent adds cost, delay and a new place for errors to hide. Start with one agent, and split only when one agent clearly struggles.

```diagram lanes Agents with different roles
## Planner | process
- Split the goal into tasks
- Hand each task to a worker
## Researcher | process
- Find the facts for each task
- Report what was found
## Reviewer | warn
- Check the result before it goes out
- Send it back if it is wrong
```

#### Subagents
A **subagent** is a helper that a main agent starts for one focused sub-task. The subagent has its own fresh context and its own tools. When it finishes, it returns only a short result, not its whole working. This keeps the main agent's context small and clean. It differs from plain multi-agent: here there is a clear parent that delegates and receives the result, while in a general multi-agent system the agents may be peers that pass work around.

```diagram nest A subagent has its own context
- Main agent | Holds the goal and the short results | model
- Subagent | Own context and tools for one sub-task | process
- Many steps inside | Searching, reading and trying, hidden from the main agent | store
```

```diagram merge Short results return to the main agent
- Subagent 1 result | A short summary | output
- Subagent 2 result | A short summary | output
- Main agent | Combines the results and continues | model
```

#### Handoffs
A **handoff** is when one agent passes the task to a more suitable agent, or to a person. The sender must pass the **context** the next one needs: the goal, what was done, what is still open, and why it is being handed over. Without this, the receiver starts blind and the user has to repeat everything. A handoff to a person is the same idea as human approval, which is covered next.

```diagram flow A handoff with context
- Agent cannot finish the task | Out of scope, unsure, or too risky | warn
- Package the context | Goal, steps done, open questions, reason | process
- Pass to a better agent or a person | The receiver can carry on without asking again | output
```

#### Human in the loop
Human in the loop means a person approves risky actions before they happen, such as paying money or deleting data, as in the refund workflow above. Your code decides which actions need approval, never the model. The person should see what will happen and why. The waiting state must be saved, so that the approval can come hours later. A request for approval is one kind of handoff, and the person's answer goes back into the run.

```diagram lanes Who does what in an approval
## Agent | model
- Prepare the action and explain why
- Pause and wait
## Your code | warn
- Mark the action as needing approval
- Run it only after a yes
## Person | output
- Read the request
- Approve or decline
```

#### Sandboxing
A **sandbox** is an isolated environment where agent-generated code or tool actions run with limited files, network access, time and permissions. If the agent makes a mistake, or is tricked, the damage stays inside the sandbox and cannot reach real systems. Give the sandbox only the files it needs, block or restrict the network, set a time limit, and throw it away afterwards.

```diagram nest Sandbox around agent actions
- Real systems | Production data, accounts and networks | store
- Sandbox | Limited files, network, time and permissions | warn
- Agent code or tool action | Runs inside, so mistakes stay inside | process
```

#### Computer use
**Computer use** means a model looks at screenshots and controls the mouse and keyboard to operate ordinary software, the way a person would. It is useful when a program has no API. It is slower and less reliable than an API, because it has to read the screen and click the right place. So use an API when one exists. Because the agent can click anything it can see, run it in a sandbox and ask for approval before risky actions.

```diagram loop Computer use
- Take a screenshot | See what is on the screen | input
- Model decides | Choose a click, a key press or scrolling | model
- Click or type | Mouse and keyboard actions | process
loop: Repeat until the task is done
```

```diagram compare API or computer use
## API, when one exists | output
- Faster
- More reliable
- Clear inputs and outputs
## Computer use | warn
- Slower
- Can misread the screen
- Needs a sandbox and approval
```

#### Skills
A **skill** is a reusable package of instructions, and optionally scripts or reference files, that an agent loads only when the task needs it. The agent sees just a short name and description of each skill at first. It opens the full skill when a task matches. This keeps the context small, even when the agent has many skills.

```diagram layers Skills are loaded on demand
note: Only the short description is always in context.
- Short name and description | Always visible to the agent | input
- Full instructions | Loaded only when the task matches | process
- Scripts and reference files | Used only if the instructions call for them | store
```

#### Durable workflows
A **durable workflow** is a long-running agent or workflow run that saves its state at each step. If the program crashes, restarts, or waits days for a human approval, it can resume from the last saved step instead of starting over. Steps may run more than once after a crash, so use **retries** for temporary failures and make every step **idempotent**, so a repeat does no harm.

```diagram flow Save state at each step
- Run a step | Do the work | process
- Save the state | Write progress to storage | store
- Crash, restart or long wait | The process may stop at any time | warn
- Resume from the last saved step | Do not start over | output
```

#### Guardrails for agents
Guardrails are limits that your code enforces, not requests in a prompt. Examples: only the tools the task needs, a budget for cost, a maximum number of steps, and checks on the output before it is used. Details are in [Security](lesson:app-security).

```diagram fan Guardrails around an agent
- Agent | Works only inside the limits | model
- Tool limits | Only the tools this task needs | warn
- Budget | A cap on cost and time | warn
- Step limit | A maximum number of loop rounds | warn
- Output checks | Check the result before it is used | warn
```

#### Prompt injection and agents
Prompt injection means text that tries to give the model new orders, for example hidden in a web page or an email. It is covered in [Security](lesson:app-security). It is riskier for agents, because an agent reads untrusted content and also has tools that can act. A hidden instruction in a document could make the agent send data or change something. Treat all fetched content as data, and limit what the tools can do.

```diagram flow Why tools make injection riskier
- Agent reads untrusted content | A web page, email or file | input
- Hidden instruction inside it | Text that looks like an order | bad
- Agent has a powerful tool | It can send, change or delete | warn
- Limits stop the harm | Least privilege, approval and a sandbox | output
```

## Python example
The whole workflow in plain Python, run against every path:
```text Output of returns_workflow.py (executed)
happy path               -> refunded 59.90 as R-0001
reviewer declines        -> pending: refund declined by reviewer; customer will be contacted
not the owner            -> rejected: you can only return your own orders
outside window           -> rejected: delivered 90 days ago (limit 30)
flaky service recovers   -> refunded 59.90 as R-0001
service down             -> failed: payment service unavailable; queued for manual follow-up
duplicate request        -> refunded 59.90 as R-0001 / refunded 59.90 as R-0001; refunds issued: 1
```
```python the approval gate and safe execution (excerpt)
decision = approver(order_id, draft)                     # human in the loop
if not decision:
    return "pending: refund declined by reviewer; customer will be contacted"
refund_id = with_retries(lambda: payments.refund(order_id, draft["amount"], f"refund:{order_id}"))  # idempotency key
```
In **LangGraph** (`examples/agent-returns/langgraph_returns.py`) the approval step calls `interrupt(...)`; a checkpointer saves the state, and `Command(resume=True)` continues it later, even after a restart.

## .NET (C#) example
Microsoft Agent Framework: read-only tools run automatically, the refund tool requires approval (packages for Agent Framework and Microsoft.Extensions.AI; API names as documented by Microsoft):
```cs Program.cs
// The approval types are marked experimental in some Microsoft.Extensions.AI versions (diagnostic MEAI001),
// and newer versions may rename them; check the names for the package version you install.
#pragma warning disable MEAI001
using System.ComponentModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

[Description("Get status of one of the current customer's orders.")]
static string GetOrderStatus(string orderId) => Orders.StatusFor(Session.CustomerId, orderId);   // identity from the session

[Description("Refund an order. Requires human approval.")]
static string RefundOrder(string orderId) => Payments.Refund(orderId, idempotencyKey: $"refund:{orderId}");

AIAgent agent = chatClient.AsAIAgent(
    instructions: "You help customers with returns. Use tools for facts. Never promise a refund before it is approved.",
    tools: [AIFunctionFactory.Create(GetOrderStatus), new ApprovalRequiredAIFunction(AIFunctionFactory.Create(RefundOrder))]);

AgentSession session = await agent.CreateSessionAsync();
AgentResponse response = await agent.RunAsync("Please refund order A-1001", session);

foreach (var request in response.Messages.SelectMany(m => m.Contents).OfType<FunctionApprovalRequestContent>())
{
    bool approved = await ReviewQueue.AskAsync(request.FunctionCall.Name, request.FunctionCall.Arguments);   // your approval UI
    Console.WriteLine(await agent.RunAsync(new ChatMessage(ChatRole.User, [request.CreateResponse(approved)]), session));
}
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Success across a chain of steps (why long agents fail more)
**Where it is used:** estimating how often an agent finishes a multi-step task when each tool call can go wrong.

```formula Chain success
chance all steps work = p × p × ... × p = p^n
```
p is the chance that one step works. n is the number of steps. This assumes steps fail independently.

**In plain words:** small error rates add up over many steps.

**Example 1: 5 steps.** p = 0.95. 0.95^5 = 0.95 × 0.95 × 0.95 × 0.95 × 0.95 = 0.774, so about 77%.

**Example 2: 10 steps.** p = 0.90. 0.9^10 = 0.349, so only about 35%. This is why agents need checks and human approval.

### Retries (at least one success)
**Where it is used:** deciding how many times an agent may retry a failing tool call.

```formula Chance of success within n tries
chance = 1 - (1 - p)^n
expected cost = cost per try × expected number of tries
```
p is the chance a single try works. The tries are assumed independent.

**In plain words:** retries help a lot when failures are random, but each try costs time and money.

**Example 1: reliable tool.** p = 0.7, n = 3. All three fail with chance 0.3^3 = 0.027. Chance of success = 1 - 0.027 = 0.973.

**Example 2: weak tool.** p = 0.3, n = 3. All fail with chance 0.7^3 = 0.343. Chance of success = 1 - 0.343 = 0.657. Retrying does not fix a tool that is mostly broken.

## Maths behind it
- State machines and workflow graphs (computer science)
- Exponential backoff for retries
- Idempotency (distributed systems)
- No special maths: agents are mostly careful software engineering

## Common mistakes
- Letting the model decide whether approval is needed; enforce it in code.
- Taking the customer id from the model's tool arguments instead of the logged-in session.
- Retrying permission or policy rejections as if they were temporary errors.
- Keeping pending approvals only in memory, so a restart loses them.
- Giving an agent a tool with too much power (for example "run any command") instead of narrow tools with least privilege.
- Having no step, time or cost limit, so a confused agent loops for ever.
- Running agent-generated code, or computer use, outside a sandbox.

```diagram compare Who decides what
## Wrong | bad
- The model decides whether approval is needed
- Customer id taken from model arguments
- Policy rejections are retried
- Pending approvals kept in memory only
## Right | output
- Code enforces approval
- Customer id comes from the logged-in session
- Only temporary errors are retried
- Pending approvals survive a restart
```

## Quick check
Q: Who actually runs a tool the model asks for?
A: Your application, after validating the request and checking permissions.

Q: Why does the refund call need an idempotency key?
A: Retries and duplicate requests could otherwise issue more than one refund.

Q: Which failures should be retried automatically?
A: Temporary ones such as timeouts or "service unavailable", a limited number of times with increasing waits.

Q: Why run agent-generated code in a sandbox?
A: So that a mistake, or a trick by hidden instructions, cannot damage real files, accounts or networks.

Q: How is a subagent different from plain multi-agent work?
A: A subagent is started by a main agent for one sub-task, uses its own context and returns only a short result.
