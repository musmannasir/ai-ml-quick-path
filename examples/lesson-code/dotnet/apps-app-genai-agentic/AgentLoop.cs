// From lesson 'app-genai-agentic' (apps). Code status: Python agent loop is a teaching sketch (see the status above for what was checked)
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
