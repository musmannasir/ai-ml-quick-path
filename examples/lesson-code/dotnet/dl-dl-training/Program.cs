// From lesson 'dl-training' (dl). Code status: Python dropout demo executed 2026-11-02 (ai_extras.py dropout); PyTorch not run (not installed in the build environment); added technique snippets (2026-11-05) not run
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

var device = cuda.is_available() ? CUDA : CPU;
// Made-up data so the sample is complete: 256 training rows and 64 validation rows, 20 features, 2 classes.
Tensor trainX = randn(256, 20), trainY = randint(0, 2, new long[] { 256 });
Tensor valX = randn(64, 20), valY = randint(0, 2, new long[] { 64 });
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
// Splits the rows into shuffled mini-batches.
static IEnumerable<(Tensor x, Tensor y)> Batches(Tensor x, Tensor y, int batchSize)
{
    long rows = x.shape[0];
    var order = randperm(rows);
    for (long start = 0; start < rows; start += batchSize)
    {
        var pick = order.narrow(0, start, Math.Min(batchSize, rows - start));
        yield return (x.index_select(0, pick), y.index_select(0, pick));
    }
}
