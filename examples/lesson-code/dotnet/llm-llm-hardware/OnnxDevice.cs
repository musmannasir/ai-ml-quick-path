// From lesson 'llm-hardware' (llm). Code status: Python fit-check arithmetic executed 2026-11-24 (fit_check.py); PyTorch, Hugging Face and runner commands not run (no GPU in the build environment); C# fit check ran, GPU device code compiled only
using Microsoft.ML.OnnxRuntime;

var options = new SessionOptions();
try
{
    options.AppendExecutionProvider_CUDA(0);            // use GPU number 0 if this build supports it
    Console.WriteLine("Using the CUDA provider");
}
catch (Exception e)
{
    Console.WriteLine($"No CUDA provider ({e.GetType().Name}); using the CPU");
}
// using var session = new InferenceSession("model.onnx", options);
