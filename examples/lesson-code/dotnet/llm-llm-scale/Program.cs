// From lesson 'llm-scale' (llm). Code status: Python memory arithmetic executed 2026-11-02 (examples/memory-estimate/memory_estimate.py); multi-GPU code conceptual; C# is plain .NET and was not compiled (no .NET SDK in the build environment)
double parameters = 8e9;
int gpus = 8; double gpuMemoryGb = 80;

double weights16 = parameters * 2 / 1e9;
double fullTraining = parameters * 16 / 1e9;                 // AdamW, mixed precision, before activations
double perGpuDdp = fullTraining;                             // data parallel: every GPU holds everything
double perGpuFsdp = fullTraining / gpus;                     // sharded: state split across GPUs

Console.WriteLine($"weights (16-bit): {weights16:F0} GB, full training state: {fullTraining:F0} GB");
Console.WriteLine($"data parallel per GPU: {perGpuDdp:F0} GB -> {(perGpuDdp < gpuMemoryGb ? "fits" : "does not fit")}");
Console.WriteLine($"FSDP per GPU: {perGpuFsdp:F0} GB -> {(perGpuFsdp < gpuMemoryGb ? "fits (plus activations)" : "does not fit")}");
