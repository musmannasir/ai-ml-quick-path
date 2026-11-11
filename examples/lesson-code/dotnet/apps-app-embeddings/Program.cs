// From lesson 'app-embeddings' (apps). Code status: Python cosine demo executed 2026-11-02 (applied_basics.py cosine); embedding-model calls and C# not run (no model or .NET SDK in the build environment)
using System.Numerics.Tensors;
using Microsoft.Extensions.AI;
using OllamaSharp;

IEmbeddingGenerator<string, Embedding<float>> embedder = new OllamaApiClient(new Uri("http://localhost:11434"), "all-minilm");

string[] docs = { "Annual leave: 25 days per year", "Printer setup guide", "Wireless network troubleshooting" };
var docVectors = await embedder.GenerateAsync(docs);
var question = await embedder.GenerateVectorAsync("my laptop won't connect to wifi");

var best = docs.Zip(docVectors, (text, e) => (text, score: TensorPrimitives.CosineSimilarity(e.Vector.Span, question.Span)))
               .OrderByDescending(x => x.score).First();
Console.WriteLine($"{best.text} ({best.score:F3})");
