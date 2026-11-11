// From lesson 'app-frameworks' (apps). Code status: Conceptual (framework packages not installed in the build environment); C# not compiled (no .NET SDK)
using System.ComponentModel;
using Microsoft.Extensions.AI;

IChatClient client = innerClient.AsBuilder().UseFunctionInvocation().Build();   // runs tools the model requests
var options = new ChatOptions { Tools = [AIFunctionFactory.Create(OrderTools.GetOrderStatus)] };
var answer = await client.GetResponseAsync("Where is order A-1001?", options);
Console.WriteLine(answer.Text);
