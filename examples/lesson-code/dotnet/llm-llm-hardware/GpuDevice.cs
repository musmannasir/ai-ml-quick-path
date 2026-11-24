// From lesson 'llm-hardware' (llm). Code status: Python fit-check arithmetic executed 2026-11-24 (fit_check.py); PyTorch, Hugging Face and runner commands not run (no GPU in the build environment); C# fit check ran, GPU device code compiled only
using TorchSharp;
using static TorchSharp.torch;

var device = cuda.is_available() ? CUDA : CPU;
Console.WriteLine($"Using: {device}");

var model = nn.Linear(1024, 1024).to(device);          // copy the weights to the device
var x = randn(8, 1024).to(device);                      // the inputs must be on the same device
var y = model.forward(x);
Console.WriteLine($"Output is on: {y.device}");
