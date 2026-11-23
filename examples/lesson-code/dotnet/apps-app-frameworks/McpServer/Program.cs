// From lesson 'app-frameworks' (apps). Code status: Conceptual (framework packages not installed in the build environment)
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

// Stand-ins so the sample compiles. In a real application these call your order system and read the signed-in user.
static class Session { public static string CustomerId => "C-42"; }
static class Orders { public static string StatusFor(string customerId, string orderId) => "delivered"; }
