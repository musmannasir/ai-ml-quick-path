// From lesson 'app-agents' (apps). Code status: Python framework-free workflow executed 2026-11-02 (examples/agent-returns/returns_workflow.py); LangGraph not run (not installed in the build environment)
// Compiled on 2026-11-13 with Microsoft.Extensions.AI 11.0.0 and Microsoft.Agents.AI 1.28.0.
// Earlier versions called the request type FunctionApprovalRequestContent; it is now ToolApprovalRequestContent.
// These types have been renamed before, so check the names for the package version you install.
#pragma warning disable MEAI001
using System.ComponentModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI;

// The model behind the agent. The key comes from an environment variable, never from the code.
IChatClient chatClient = new OpenAIClient(Environment.GetEnvironmentVariable("LLM_API_KEY")!)
    .GetChatClient("your-model").AsIChatClient();

[Description("Get status of one of the current customer's orders.")]
static string GetOrderStatus(string orderId) => Orders.StatusFor(Session.CustomerId, orderId);   // identity from the session

[Description("Refund an order. Requires human approval.")]
static string RefundOrder(string orderId) => Payments.Refund(orderId, idempotencyKey: $"refund:{orderId}");

AIAgent agent = chatClient.AsAIAgent(
    instructions: "You help customers with returns. Use tools for facts. Never promise a refund before it is approved.",
    tools: [AIFunctionFactory.Create(GetOrderStatus), new ApprovalRequiredAIFunction(AIFunctionFactory.Create(RefundOrder))]);

AgentSession session = await agent.CreateSessionAsync();
AgentResponse response = await agent.RunAsync("Please refund order A-1001", session);

foreach (var request in response.Messages.SelectMany(m => m.Contents).OfType<ToolApprovalRequestContent>())
{
    if (request.ToolCall is not FunctionCallContent call) continue;                          // only function tools here
    bool approved = await ReviewQueue.AskAsync(call.Name, call.Arguments);                   // your approval UI
    var decision = request.CreateResponse(approved, approved ? "Approved by a reviewer" : "Rejected by a reviewer");
    Console.WriteLine(await agent.RunAsync(new ChatMessage(ChatRole.User, [decision]), session));
}

// Stand-ins so the sample compiles. In a real application these call your order system and read the signed-in user.
static class Session { public static string CustomerId => "C-42"; }
static class Orders { public static string StatusFor(string customerId, string orderId) => "delivered"; }
static class Payments { public static string Refund(string orderId, string idempotencyKey) => $"refund queued for {orderId}"; }
// Your approval screen. This stand-in always answers "not approved", so nothing is refunded by accident.
static class ReviewQueue { public static Task<bool> AskAsync(string tool, object? arguments) => Task.FromResult(false); }
