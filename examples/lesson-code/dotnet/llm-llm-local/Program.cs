// From lesson 'llm-local' (llm). Code status: Python memory arithmetic executed 2026-11-02 (memory_estimate.py); local model calls not run (no model runner in the build environment); C# not compiled (no .NET SDK)
using Microsoft.Extensions.AI;
using OllamaSharp;

IChatClient chat = new OllamaApiClient(new Uri("http://localhost:11434"), "llama3.2");

await foreach (var update in chat.GetStreamingResponseAsync("Explain RAG in two sentences."))
    Console.Write(update.Text);                      // tokens appear as they are generated
Console.WriteLine();
