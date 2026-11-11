// From lesson 'llm-finetune' (llm). Code status: Python LoRA arithmetic executed 2026-11-02 (quickpath.py lora); TRL training conceptual; C# is plain .NET (System.Text.Json) and was not compiled (no .NET SDK in the build environment)
using System.Text.Json;

var examples = LoadApprovedExamples();                     // (ticket text, ideal summary) written or approved by experts
var rng = new Random(0);
var shuffled = examples.OrderBy(_ => rng.Next()).ToList();
var test = shuffled.Take(shuffled.Count / 10).ToList();     // hold out 10% BEFORE any training
var train = shuffled.Skip(test.Count).ToList();

void Write(string path, IEnumerable<(string Input, string Output)> rows) =>
    File.WriteAllLines(path, rows.Select(r => JsonSerializer.Serialize(new
    {
        messages = new object[]
        {
            new { role = "system", content = "Summarise the support ticket in one sentence." },
            new { role = "user", content = r.Input },
            new { role = "assistant", content = r.Output },
        }
    })));
Write("train.jsonl", train);
Write("test.jsonl", test);
Console.WriteLine($"train {train.Count}, test {test.Count}");

static List<(string Input, string Output)> LoadApprovedExamples() => /* your data, personal data removed */ new();
