// From lesson 'app-agents' (apps). Code status: Python framework-free workflow executed 2026-11-02 (examples/agent-returns/returns_workflow.py); LangGraph and C# (Microsoft Agent Framework) not run (not installed in the build environment)
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
