// From lesson 'llm-train-laptop' (llm). Code status: Python NumPy model executed 2026-11-02 (examples/tiny-lm/tiny_char_lm_numpy.py, about 2 seconds on CPU); PyTorch transformer and C# (TorchSharp) not run (not installed in the build environment)
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

string text = File.ReadAllText("corpus.txt").ToLowerInvariant();
var chars = text.Distinct().OrderBy(c => c).ToArray();
var index = chars.Select((c, i) => (c, i)).ToDictionary(p => p.c, p => (long)p.i);
var ids = tensor(text.Select(c => index[c]).ToArray());
long n = ids.shape[0];
var inputs = ids.slice(0, 0, n - 1, 1);                     // every character except the last
var targets = ids.slice(0, 1, n, 1);                         // the character that follows each one

var model = Sequential(("embed", Embedding(chars.Length, 32)), ("out", Linear(32, chars.Length)));
var optimizer = optim.AdamW(model.parameters(), lr: 0.01);
for (int step = 0; step <= 2000; step++)
{
    optimizer.zero_grad();
    var loss = functional.cross_entropy(model.forward(inputs), targets);
    loss.backward();
    optimizer.step();
    if (step % 500 == 0) Console.WriteLine($"step {step} loss {loss.item<float>():F3}");
}
model.save("tiny-lm.bin");                                    // checkpoint
