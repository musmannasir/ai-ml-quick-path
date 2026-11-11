// From lesson 'dl-neural-nets' (dl). Code status: Python NumPy executed 2026-11-02 (examples/ai-extras/ai_extras.py nn); PyTorch and C# (TorchSharp) not run (not installed in the build environment)
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

torch.random.manual_seed(1);
var x = tensor(new float[] { 0, 0, 0, 1, 1, 0, 1, 1 }).reshape(4, 2);
var y = tensor(new float[] { 0, 1, 1, 0 }).reshape(4, 1);

var model = Sequential(("hidden", Linear(2, 8)), ("tanh", Tanh()), ("out", Linear(8, 1)));
var optimizer = optim.Adam(model.parameters(), lr: 0.05);
var lossFn = BCEWithLogitsLoss();

for (int step = 1; step <= 2000; step++)
{
    optimizer.zero_grad();
    var loss = lossFn.forward(model.forward(x), y);
    loss.backward();                       // backpropagation
    optimizer.step();
    if (step % 500 == 0) Console.WriteLine($"step {step} loss {loss.item<float>():F4}");
}
var probs = sigmoid(model.forward(x)).data<float>().ToArray();
Console.WriteLine(string.Join(", ", probs.Select(p => p.ToString("F3"))));
