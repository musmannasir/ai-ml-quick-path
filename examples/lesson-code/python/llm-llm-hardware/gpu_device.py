# From lesson 'llm-hardware' (llm). Code status: Python fit-check arithmetic executed 2026-11-24 (fit_check.py); PyTorch, Hugging Face and runner commands not run (no GPU in the build environment); C# fit check ran, GPU device code compiled only
import torch

# Pick the best device the framework can see. On AMD builds of PyTorch the GPU is still called "cuda".
if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():          # Apple computers
    device = torch.device("mps")
else:
    device = torch.device("cpu")
print("Using:", device)

model = torch.nn.Linear(1024, 1024).to(device)    # copy the weights to the device
x = torch.randn(8, 1024).to(device)               # the inputs must be on the same device
y = model(x)
print("Output is on:", y.device)

if device.type == "cuda":
    print(f"Memory held by tensors: {torch.cuda.memory_allocated() / 1e9:.3f} GB")
    print(f"Total memory of the GPU: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
