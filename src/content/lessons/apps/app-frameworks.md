---
id: app-frameworks
title: AI frameworks and MCP: what to use in Python and .NET
module: apps
level: Intermediate
minutes: 60
goal: Know what LangChain, LangGraph, Microsoft.Extensions.AI, Semantic Kernel, Microsoft Agent Framework and the Model Context Protocol do, and when plain code is better.
prereqs: app-agents
reviewed: 2026-11-02
evidence: A short decision note for one project choosing a framework (or none) in your main language, with three reasons.
code: Conceptual (framework packages not installed in the build environment); C# not compiled (no .NET SDK)
---
## In plain words
Frameworks save you writing the same plumbing again: connecting to models, tools, vector stores and workflow state. They do **not** train models; they **orchestrate** applications. In **Python**, **LangChain** connects models, prompts, tools and retrievers, and **LangGraph** builds stateful workflows as graphs with pause-and-resume (useful for approvals). LlamaIndex and Haystack focus on retrieval. In **.NET**, **Microsoft.Extensions.AI** gives standard interfaces (`IChatClient`, `IEmbeddingGenerator`) with middleware for logging, caching and telemetry; **Microsoft.Extensions.VectorData** standardises vector stores; **Microsoft Agent Framework** builds agents and multi-step workflows (it succeeds Semantic Kernel's agent features and AutoGen, and reached version 1.0 in April 2026). The **Model Context Protocol (MCP)** is an open standard: you write a tool server once and any MCP-aware AI app can use it. **Plain code** is often best for small, fixed workflows: fewer dependencies and easier debugging.

| Need | Python | .NET |
|---|---|---|
| Call any model through one interface | LangChain chat models | Microsoft.Extensions.AI `IChatClient` |
| Tools / function calling | LangChain `@tool` | `AIFunctionFactory.Create` + function invocation |
| Stateful workflow with approvals | LangGraph | Microsoft Agent Framework |
| Vector store abstraction | LangChain vector stores | Microsoft.Extensions.VectorData |
| Share tools across apps | MCP Python SDK | MCP C# SDK |

```diagram layers Where frameworks sit in an AI application
note: Frameworks orchestrate. They do not train models.
- Your application | the screens, API and business rules you write | input
- Orchestration framework | LangChain, LangGraph, Microsoft Agent Framework: tools, state, approvals | process
- Model and store interfaces | IChatClient, IEmbeddingGenerator, vector store abstractions | process
- Models and vector stores | the trained models and data stores they call | model
```

```diagram compare Python and .NET: same jobs, different names
note: The rows of the table above, grouped by language.
## Python | process
- LangChain: models, prompts, tools, retrievers
- LangGraph | stateful graph workflows, pause and resume
- LlamaIndex and Haystack: retrieval focus
- MCP Python SDK
## .NET | process
- Microsoft.Extensions.AI: IChatClient, middleware
- Microsoft.Extensions.VectorData: vector stores
- Microsoft Agent Framework: agents and workflows
- MCP C# SDK
```

```diagram fan One MCP tool server, many AI apps
note: Write the tool once. Any MCP-aware app can use it.
- MCP tool server | order lookup, policy search | store
- AI app in .NET | uses the tools through the protocol | process
- AI app in Python | uses the same tools | process
- Another MCP-aware app | no new tool code needed | process
```

```diagram flow How a framework runs a tool call
note: The framework handles the plumbing around the model.
- User question | for example: Where is order A-1001? | input
- Model | decides a tool is needed and names it | model
- Framework | runs the tool the model requested | process
- Tool or MCP server | checks permissions, returns data | store
- Model answer | written from the tool result | output
```

## Real-world example
A company with a .NET platform and a Python data-science team standardised on `IChatClient` in its ASP.NET Core services and LangGraph for research prototypes. Shared tools (order lookup, policy search) were exposed once as MCP servers, so both stacks used the same, permission-checked tools.

```diagram lanes One company, two stacks, shared tools
## .NET platform
- ASP.NET Core services | process
- IChatClient | process
## Python data science
- Research prototypes | process
- LangGraph | process
## Shared
- MCP servers: order lookup, policy search | store
- Permission-checked tools | output
```

## How it works
1. List what you need: providers, tools, retrieval, state, approvals, observability.
2. If the flow is short and fixed, start with plain code and a provider SDK.
3. Add a framework for a specific capability you would otherwise rebuild (durable approvals, many integrations).
4. Expose reusable tools through MCP with authentication and least privilege.
5. Pin versions; frameworks change quickly.

```diagram flow Choosing a framework, step by step
- List needs | providers, tools, retrieval, state, approvals, observability | input
- Short, fixed flow? | start with plain code and a provider SDK | process
- Add a framework | only for a capability you would otherwise rebuild | process
- Expose tools via MCP | with authentication and least privilege | process
- Pin versions | frameworks change quickly | output
```

## Python example
A LangChain tool-using agent (requires `langchain` and a provider package; names follow the documented API, which changes between versions):
```python agent.py (conceptual)
import os
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.tools import tool

@tool
def get_order_status(order_id: str) -> str:
    """Return the delivery status for one of the current customer's orders."""
    return ORDERS.status_for(CURRENT_CUSTOMER, order_id)

agent = create_agent(init_chat_model(os.environ["LC_MODEL"], temperature=0), tools=[get_order_status],
                     system_prompt="Answer order questions using tools. Never invent order data.")
print(agent.invoke({"messages": [{"role": "user", "content": "Where is order A-1001?"}]})["messages"][-1].content)
```

## .NET (C#) example
Tool calling with Microsoft.Extensions.AI, and the same tool exposed as an MCP server (package `ModelContextProtocol`):
```cs ToolCalling.cs
using System.ComponentModel;
using Microsoft.Extensions.AI;

IChatClient client = innerClient.AsBuilder().UseFunctionInvocation().Build();   // runs tools the model requests
var options = new ChatOptions { Tools = [AIFunctionFactory.Create(OrderTools.GetOrderStatus)] };
var answer = await client.GetResponseAsync("Where is order A-1001?", options);
Console.WriteLine(answer.Text);
```
```cs McpServer/Program.cs
using System.ComponentModel;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;

var builder = Host.CreateApplicationBuilder(args);
// stdout is reserved for MCP protocol messages, so send all logs to stderr.
builder.Logging.AddConsole(o => o.LogToStandardErrorThreshold = LogLevel.Trace);
builder.Services.AddMcpServer().WithStdioServerTransport().WithToolsFromAssembly();
await builder.Build().RunAsync();

[McpServerToolType]
public static class OrderTools
{
    [McpServerTool, Description("Return the delivery status for one of the current customer's orders.")]
    public static string GetOrderStatus(string orderId) => Orders.StatusFor(Session.CustomerId, orderId);
}
```

## Maths behind it
- None: frameworks are software architecture. The maths lives in the models they call.

## Common mistakes
- Adopting a framework for a two-step flow, then fighting its abstractions.
- Copying code from an outdated tutorial whose APIs no longer exist; pin versions and read the release notes.
- Exposing powerful tools over MCP without authentication or per-user permission checks.

```diagram compare Plain code or a framework
note: Both are valid. Match the choice to the size of the flow.
## Plain code | output
- Short, fixed workflow
- One provider, a few tools
- Fewer dependencies, easier debugging
## Framework | process
- Durable approvals and pause-and-resume
- Many integrations
- Risk | fighting its abstractions on a two-step flow
```

## Quick check
Q: Do LangChain or LangGraph train language models?
A: No. They orchestrate applications around existing models.

Q: What problem does MCP solve?
A: It standardises how tools and data are exposed to AI applications, so one tool server works with many apps.

Q: When is plain code better than a framework?
A: For short, fixed workflows with one provider and a few tools, where fewer dependencies make the system easier to debug and maintain.
