// From lesson 'app-frameworks' (apps). Code status: Conceptual (framework packages not installed in the build environment)
using System.ComponentModel;
using Microsoft.Extensions.AI;
using OpenAI;

// The underlying model client. The key comes from an environment variable, never from the code.
IChatClient innerClient = new OpenAIClient(Environment.GetEnvironmentVariable("LLM_API_KEY")!)
    .GetChatClient("your-model").AsIChatClient();
IChatClient client = innerClient.AsBuilder().UseFunctionInvocation().Build();   // runs tools the model requests
var options = new ChatOptions { Tools = [AIFunctionFactory.Create(OrderTools.GetOrderStatus)] };
var answer = await client.GetResponseAsync("Where is order A-1001?", options);
Console.WriteLine(answer.Text);

// Stand-in tool so the sample compiles. A real tool looks the order up for the signed-in customer.
static class OrderTools
{
    [Description("Return the delivery status for one of the current customer's orders.")]
    public static string GetOrderStatus(string orderId) => "delivered";
}
