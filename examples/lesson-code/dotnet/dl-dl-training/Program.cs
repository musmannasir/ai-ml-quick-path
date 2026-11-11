// From lesson 'dl-training' (dl). Code status: Python dropout demo executed 2026-11-02 (ai_extras.py dropout); PyTorch and C# (TorchSharp) not run (not installed in the build environment)
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

var device = cuda.is_available() ? CUDA : CPU;
var model = Sequential(("in", Linear(20, 64)), ("relu", ReLU()), ("drop", Dropout(0.3)), ("out", Linear(64, 2)));
model.to(device);
var optimizer = optim.AdamW(model.parameters(), lr: 1e-3, weight_decay: 0.01);
var lossFn = CrossEntropyLoss();
double best = double.MaxValue; int badEpochs = 0;

for (int epoch = 0; epoch < 100 && badEpochs < 5; epoch++)
{
    model.train();
    foreach (var (xb, yb) in Batches(trainX, trainY, batchSize: 32))
    {
        optimizer.zero_grad();
        var loss = lossFn.forward(model.forward(xb.to(device)), yb.to(device));
        loss.backward();
        optimizer.step();
    }
    model.eval();
    using (no_grad())
    {
        double val = lossFn.forward(model.forward(valX.to(device)), valY.to(device)).item<float>();
        if (val < best) { best = val; badEpochs = 0; model.save("best.model.bin"); }   // checkpoint
        else badEpochs++;                                                               // early stopping counter
    }
}
// Batches(...) splits tensors into shuffled mini-batches; trainX/trainY/valX/valY are your tensors.
