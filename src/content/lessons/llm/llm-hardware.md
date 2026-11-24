---
id: llm-hardware
title: "Hardware for AI: CPU, GPU, CUDA and putting a model to work"
module: llm
level: Intermediate
minutes: 90
maths: basic arithmetic
goal: Explain what a GPU and CUDA are, check which device your code uses, load a model onto a GPU, estimate whether it fits and how fast it can write, and fix the usual out-of-memory problems.
prereqs: s-setup, llm-how
reviewed: 2026-11-24
updated: 2026-11-24
evidence: A one-page hardware note for your own machine: its processor, GPU and memory, which model sizes and precisions fit, and a measured tokens-per-second figure for one model.
code: Python fit-check arithmetic executed 2026-11-24 (fit_check.py); PyTorch, Hugging Face and runner commands not run (no GPU in the build environment); C# fit check ran; the two GPU device samples compiled and ran on their CPU path only (no GPU in the build environment)
---
## In plain words
Training and running AI is mostly one job: multiplying very large grids of numbers. A **CPU** has a few strong cores that do one thing after another. A **GPU** (graphics processing unit) has thousands of small cores that do the same simple sum on many numbers at the same time, so it is far faster at this job. **CUDA** is NVIDIA's platform for programming its GPUs: you rarely write CUDA yourself, because libraries such as PyTorch call it for you when you ask for the device `"cuda"`. A GPU has its own fast memory, called **VRAM**. A model must fit in VRAM (its weights, its conversation cache and some working space), or part of it has to run from slower system memory. This lesson shows what the hardware does, what CUDA is, how to check which device your code really uses, how to load a model onto a GPU, how to estimate memory and speed with small sums, and what to do when something does not fit. AMD, Apple, Intel and other chips have their own equivalents; they are covered briefly.

```diagram compare CPU and GPU: a few strong workers or many small ones
note: Neural networks are mostly the same sum repeated millions of times, which suits a GPU.
## CPU | process
- A few strong cores
- Each core does one thing after another, fast
- Good for general work, files, the network
## GPU | model
- Thousands of small cores
- All do the same sum on different numbers
- Good for matrix multiplication (deep learning)
```

```visual A few strong cores and thousands of small ones
file: cpu-vs-gpu
alt: Two panels. On the left, a CPU drawn as a few large cores that each do one task after another, good for general work. On the right, a GPU drawn as a grid of many small cores that all do the same simple sum on different numbers at once, good for the matrix multiplication at the heart of deep learning.
caption: A CPU has a few strong cores; a GPU has thousands of small ones doing the same sum at once, which suits neural networks.
```

```diagram layers The software between your code and the GPU
note: You normally work at the top. The lower layers must match the GPU and each other.
- Your code | Python or C# asking for a device | input
- Framework | PyTorch, TorchSharp or ONNX Runtime | process
- CUDA libraries and runtime | NVIDIA's code that runs the sums on the GPU | model
- GPU driver | Lets the operating system talk to the GPU | store
- The GPU | Cores and its own memory (VRAM) | output
```

```visual From your code down to the GPU
file: gpu-stack
alt: A vertical stack of five layers with arrows between them: your code in Python or C#, a framework such as PyTorch, TorchSharp or ONNX Runtime, CUDA libraries and runtime, the GPU driver, and the GPU itself. Notes say the lower layers must match the GPU and each other, and that a full CUDA Toolkit is only needed to compile CUDA code.
caption: You work at the top. The driver and the CUDA build under the framework must match the GPU and each other.
```

```diagram compare Two memories and the road between them
note: Moving numbers between the two costs time, so a model should stay in VRAM.
## System memory (RAM) | process
- Large: often 16 to 128 GB
- Slower to read for a GPU
- Holds your program and data
## GPU memory (VRAM) | model
- Smaller: often 8 to 80 GB
- Very fast for the GPU's own cores
- Must hold the model while it runs
```

## Real-world example
A support team wants to run an open 8-billion-parameter model for internal questions, on one workstation whose GPU has 16 GB of VRAM. This is a made-up scenario with round numbers. At 16 bits per weight the weights alone take 8 × 2 = 16 GB, so the model does not fit once the conversation cache and working space are added. Stored at 4 bits, the weights take 4 GB, so the whole job needs about 6 GB and there is room for long conversations. The team then checks that the program is really using the GPU and not quietly falling back to the CPU, and measures how many tokens per second it writes.

```diagram flow From a model that does not fit to one that does
note: The numbers are the made-up example above.
- Model at 16 bits | 8 billion weights x 2 bytes = 16 GB | warn
- Add cache and working space | About 2 GB more | process
- Compare with VRAM | 18 GB needed, 16 GB available | bad
- Store the weights at 4 bits | 8 billion x 0.5 byte = 4 GB | model
- Fits | About 6 GB needed, room to spare | output
```

## How it works
1. **Find out what you have.** Which GPU, how much VRAM, which driver. On NVIDIA, the command `nvidia-smi` shows them.
2. **Install the right software.** A current GPU driver, then a framework build for your GPU (for PyTorch, the CUDA build).
3. **Choose the device in code.** Ask the framework whether a GPU is available and use it if so, otherwise the CPU.
4. **Load the model and move it to the device.** Weights are read from disk into system memory and then copied into VRAM. Your inputs must go to the same device.
5. **Run it and measure.** Check memory use, check that the GPU is busy, and measure tokens per second.
6. **If it does not fit,** shrink it (fewer bits), shorten the context, move some layers to the CPU, or use a bigger GPU.

```diagram flow Putting a model on a GPU
note: Every step is a place where "it ran on the CPU by accident" can happen. Check the device at the end.
- Check the device | Is a GPU available to the framework? | input
- Load the weights | From disk into system memory | process
- Copy them to VRAM | Model and inputs on the same device | model
- Run | The GPU does the sums | process
- Watch memory and speed | Memory used, GPU busy, tokens per second | output
```

```maths Does the model fit in GPU memory?
situation: You want to run an 8-billion-parameter model on a GPU with 16 GB of memory. The weights are stored at 4 bits, which is half a byte each. The conversation will be at most 8,192 tokens long. The model has 32 layers, 8 key-value heads of size 128, and the cache uses 2 bytes per value (the same assumed shape as in the lesson on running models locally). Working space is assumed to be 1 GB. All numbers are made up for the example.
find: How much GPU memory is needed, and does it fit in 16 GB?
step: Weights: 8 billion parameters times half a byte, in GB | 8 × 0.5 = 4
step: Cache bytes for one token (keys and values, 32 layers, 8 heads, size 128, 2 bytes) | 2 × 32 × 8 × 128 × 2 = 131,072
step: Cache bytes for 8,192 tokens | 131,072 × 8,192 = 1,073,741,824
step: That in GB | 1,073,741,824 ÷ 1,000,000,000 ≈ 1.07
step: Add weights, cache and working space | 4 + 1.07 + 1 = 6.07
step: Memory left on the 16 GB GPU | 16 − 6.07 = 9.93
result: About **6.1 GB** is needed, so it fits with **9.9 GB** to spare.
formula: needed = weights + cache + working space; weights = parameters x bytes per weight
why: "Does it fit?" is a sum you can do before downloading anything. If the total is bigger than the VRAM, the program fails with an out-of-memory error or runs very slowly because part of the model sits in slower memory.
caution: Real programs also need memory for temporary results, and different models have different shapes. Leave a safety margin of a few GB.
try: The same model stored at 16 bits (2 bytes per weight). Does it fit in 16 GB?
answer: Weights 8 × 2 = 16, so the total is 16 + 1.07 + 1 = 18.07 GB. That is more than 16 GB, so it does not fit: it is 2.07 GB short.
```

```maths How fast can it write? A speed limit from memory
situation: Each time the model writes one token, the GPU must read every weight from its memory once. How fast it can read is called memory bandwidth. In this made-up example the bandwidth is 400 GB per second and the 4-bit weights take 4 GB.
find: What is the most tokens per second the GPU could write?
step: How many times per second 4 GB can be read at 400 GB per second | 400 ÷ 4 = 100
result: At most about **100 tokens per second**, one stream, at 4 bits.
formula: speed limit (tokens per second) = memory bandwidth ÷ size of the weights
why: Writing is limited by how fast memory can deliver the weights, not by how fast the cores can add. That is why a smaller (quantised) model is also a faster one.
caution: This is an upper limit for one conversation. Real speeds are lower. Reading a long prompt (prefill) is limited by arithmetic instead, and serving many users at once changes the picture.
try: The same GPU with the 16-bit weights, which take 16 GB. What is the limit now?
answer: 400 ÷ 16 = 25 tokens per second. Four times the weights means a quarter of the speed limit.
```

```diagram merge Why writing speed is limited by memory
note: Each new token needs the weights, so memory speed sets the pace.
- Tokens per second (upper limit) | Bandwidth divided by weight size | output
- Memory bandwidth | How fast the GPU can read its own memory | input
- Size of the weights | Parameters times bytes per weight | input
```

### Related concepts

#### What a GPU is and why it helps
A **GPU** was first built to draw pictures, which means doing the same small calculation for millions of pixels at once. Deep learning needs the same shape of work: multiplying large grids of numbers, where every output number is its own small sum. A GPU runs thousands of those sums in parallel, so a job that takes minutes on a CPU can take seconds. Some GPUs also have special units for fast low-precision matrix multiplication; frameworks use them for you when you choose a suitable number format. A GPU is not better at everything: it is poor at tasks that must run one step after another, and it needs a CPU to run the rest of your program.

#### What CUDA is, and the software stack
**CUDA** is NVIDIA's platform and programming model for running general calculations on its GPUs. It is the layer between a framework such as PyTorch and the GPU. You normally do not write CUDA: you write `model.to("cuda")` and the framework calls NVIDIA's libraries. Three things must fit together: the **GPU driver** (installed in the operating system, it lets programs talk to the GPU), the **CUDA libraries** that your framework uses (a PyTorch install for CUDA brings its own copies, so you usually do not install the CUDA Toolkit yourself), and the framework build itself. The driver has to be new enough for the CUDA version the framework was built with. A common mix-up: the CUDA version printed by `nvidia-smi` is the newest version the driver supports, not a toolkit you installed. A full CUDA Toolkit is needed only when you compile CUDA code yourself. See the official [CUDA programming guide](source:cuda-guide) and the [PyTorch notes on CUDA](source:pytorch-cuda).

#### Memory: VRAM, system memory and the road between
A model runs fastest when everything it needs sits in VRAM. VRAM is smaller than system memory and fast for the GPU's own cores. Copying data from system memory to VRAM goes over a slower link, so you copy the weights once, at load time, and keep them there. Two things use VRAM besides the weights: the **cache** that stores earlier keys and values for the conversation (it grows with the length of the context and with the number of users at once, see the lesson on running models locally) and **working space** for temporary results. On a PC with a separate GPU, VRAM is a separate pool. On some machines, such as recent Apple computers, the CPU and GPU share one pool of memory, which changes how much a model can use.

```diagram flow Memory a GPU job uses
note: Weights are fixed; the cache and working space grow with your use.
- Weights | Fixed by model size and bits per weight | model
- Cache | Grows with context length and number of users | store
- Working space | Temporary results while computing | process
- Total must fit in VRAM | Or part of the model runs from slower memory | output
```

```visual Weights, cache and working space against the VRAM
file: vram-budget
alt: A horizontal bar for an 8-billion-parameter model at 4 bits split into weights 4 GB, cache 1.07 GB and working space 1 GB, about 6.1 GB in all, against a line at 16 GB of GPU memory with spare room. Below it, the same model at 16 bits needs 18.07 GB and runs past the 16 GB line, so it does not fit.
caption: Weights, cache and working space must fit in VRAM. The same 8-billion model fits at 4 bits and does not fit at 16 bits on a 16 GB GPU.
```

#### Number formats: how many bits per number
The same weights can be stored in several formats. Fewer bits means less memory and more speed, but less precision. **FP32** (32 bits) is the classic. **FP16** and **BF16** use 16 bits. BF16 keeps FP32's wide range of sizes with fewer digits of precision, which makes it steadier for training; FP16 has more digits but a narrower range, so training with it usually needs extra care. **INT8** and 4-bit formats store each weight as a small whole number plus a scale; they are mostly used to run models (see the quantisation simulation in the fine-tuning lesson). **Mixed precision** does the heavy sums in 16 bits and keeps a few sensitive numbers in higher precision, which saves memory and time in training.

| Format | Bits | Bytes per number | Typical use |
|---|---|---|---|
| FP32 | 32 | 4 | Classic training, sensitive calculations |
| FP16 | 16 | 2 | Inference and mixed-precision training (needs care) |
| BF16 | 16 | 2 | Training and inference on recent GPUs |
| INT8 | 8 | 1 | Running models, smaller and faster |
| 4-bit | 4 | 0.5 | Running large models on small GPUs |

```diagram bar Weights of an 8-billion-parameter model by format
note: Illustrative bars, drawn as a percentage of the 32-bit size. The weights only; cache and working space come on top.
- 32-bit | 100 | warn
- 16-bit | 50 | process
- 8-bit | 25 | model
- 4-bit | 12 | output
```

#### When the model does not fit
Work through these in order. First, **store the weights in fewer bits** (a quantised file). Second, **shorten the context** or serve fewer users at once, because the cache shrinks. Third, **offload some layers to the CPU**: the layers that do not fit stay in system memory and run on the CPU. This works but is much slower, because those layers are computed more slowly and data must cross the link. Libraries do this for you: Hugging Face Accelerate can place layers on GPU, then CPU, then disk with `device_map="auto"` (disk is the slowest of all, see its [guide](source:hf-accelerate-big)); llama.cpp has a setting for how many layers go to the GPU, and runners such as Ollama choose a split automatically. Fourth, **use a bigger GPU or several**, or rent one by the hour (see the lesson on scaling to big hardware). Fifth, **choose a smaller model**.

```diagram flow The model does not fit: what to try, in order
note: Each step costs something. Stop at the first one that works.
- Fewer bits per weight | A 4-bit file: much smaller, a small quality loss to test | model
- Shorter context | Smaller cache; fewer users at once | process
- Offload layers to the CPU | Works, but slower | warn
- Bigger or more GPUs, or rent | More VRAM, more cost | process
- A smaller model | Often enough for a narrow task | output
```

```visual Five things to try when a model does not fit
file: fit-options
alt: Five steps from top to bottom, each costing a little more than the last: store the weights in fewer bits, shorten the context, offload some layers to the CPU which is slower, use a bigger GPU or rent one, or choose a smaller model. A note says to stop at the first one that works.
caption: Try the cheapest fix first: fewer bits, then a shorter context, then offloading, then more hardware, then a smaller model.
```

#### Other hardware, and the same idea under different names
NVIDIA and CUDA are the most common, but the idea is the same elsewhere. **AMD** GPUs use ROCm; PyTorch's AMD builds deliberately reuse the same `torch.cuda` functions and the device name `"cuda"`, so much code runs unchanged (see the [PyTorch notes for AMD](source:pytorch-hip)). **Apple** computers use the GPU through Metal; in PyTorch the device is called `"mps"` (see the [MPS notes](source:pytorch-mps)). **Intel** and other chips are reached through their own libraries, often via ONNX Runtime, which picks an **execution provider** for the hardware it finds (CUDA, DirectML, OpenVINO and others, see the [list](source:onnxrt-eps)). A **TPU** is Google's chip made for matrix maths, mostly used in Google's cloud. An **NPU** is a small low-power AI unit in many laptops and phones, good for small models running all day. Check the support list of the runner or framework for your exact hardware before you buy.

```diagram compare The same idea on different hardware
note: Names differ; the steps are the same: check the device, load the model onto it, measure.
## NVIDIA | model
- Software: CUDA
- PyTorch device: "cuda"
## AMD and Apple | process
- AMD: ROCm, PyTorch still says "cuda"
- Apple: Metal, PyTorch device "mps"
## Others | store
- ONNX Runtime providers, e.g. DirectML, OpenVINO
- TPUs in Google's cloud; NPUs in some laptops
```

#### Watching the GPU and fixing common problems
`nvidia-smi` shows the GPU, its driver, how much memory is used and how busy it is. In PyTorch, `torch.cuda.memory_allocated()` reports the memory held by tensors; a caching allocator keeps freed memory reserved, so `nvidia-smi` can show more as used than your tensors need. Runners show where a model landed: for example the `ollama ps` command shows how much of a loaded model is on the GPU. Common problems:
- **Out of memory (OOM).** Use the list above: fewer bits, shorter context, smaller batch, offload.
- **It runs, but slowly.** Check that the GPU is really used: the code may have fallen back to the CPU because the driver is too old, the framework build has no GPU support, or a tensor was left on the CPU.
- **"Expected all tensors on the same device".** The model and its inputs must be on the same device. Move both.
- **GPU found by the system but not by the program.** The driver and the framework's CUDA build are not compatible; update the driver or install a matching framework build.
- **Containers.** A container must be given access to the GPU (for NVIDIA, the container toolkit and a GPU option when you start it).

```diagram flow Slow or failing on the GPU: check in this order
note: Most problems are one of these.
- Does the system see the GPU? | nvidia-smi or the system's device list | input
- Does the framework see it? | The device check in code returns true | process
- Are model and inputs on it? | Print the device of both | process
- Does memory fit? | Compare weights, cache and working space with VRAM | warn
- Is the GPU busy? | Watch use while it runs; fix the data or batch size | output
```

## Live simulation
Try the two sums above on your own numbers: pick a model size, the bits per weight, the length of the conversation and the GPU, and see whether it fits and how fast it could write.

```sim hw Does the model fit, and how fast could it write?
question: For a given model, number format, conversation length and GPU, how much memory is needed, and what is the most tokens per second memory allows?
watch: The bar splits the memory needed into weights, cache and working space. The marker shows how much VRAM you have.
watch: Fewer bits per weight shrink the weights, which also raises the speed limit, because fewer bytes must be read for each token.
watch: The cache grows with the length of the conversation. A very long context can fill a GPU even when the weights fit.
try: fit70 | Make a 70-billion-parameter model fit on a 48 GB GPU.
try: fast | With the 8-billion model, reach a speed limit of at least 100 tokens per second.
predict: An 8-billion-parameter model is stored at 16 bits. About how much memory do the weights alone need? | About 2 GB | About 16 GB | About 160 GB
answer: 2 | 8 billion weights x 2 bytes each = 16 GB. Four bits would make it 4 GB.
leaves-out: The model shapes are assumed (8 key-value heads of size 128; layer counts differ by size), working space is a fixed 1 GB, and the bandwidth numbers are illustrative levels, not the specification of a real card. It ignores temporary results, several GPUs, batching, and the arithmetic limit that applies while a long prompt is read, so real speeds are lower than the limit shown.
reference: examples/sim-llm/llm.py
```

## Python example
A fit check with no packages, using the sums from this lesson. This part really ran:
```python fit_check.py
"""Does a model fit in GPU memory, and how fast can it write? A rough estimate with no packages.
Assumptions (all rounded): 8 KV heads of size 128, 16-bit cache values, 1 GB of working space."""

def fit_check(params_billion, bits, layers, ctx_tokens, vram_gb, kv_heads=8, head_size=128, working_gb=1.0):
    weights_gb = params_billion * bits / 8                       # billions of parameters x bytes each = GB
    cache_bytes_per_token = 2 * layers * kv_heads * head_size * 2  # keys and values, 2 bytes per value
    cache_gb = cache_bytes_per_token * ctx_tokens / 1e9
    total_gb = weights_gb + cache_gb + working_gb
    return weights_gb, cache_gb, total_gb, total_gb <= vram_gb

def speed_limit(weights_gb, bandwidth_gb_per_s):
    return bandwidth_gb_per_s / weights_gb                       # every token reads all weights once

cases = [("8B at 16-bit, 24 GB GPU", 8, 16, 32, 8192, 24),
         ("8B at 4-bit, 16 GB GPU", 8, 4, 32, 8192, 16),
         ("8B at 16-bit, 16 GB GPU", 8, 16, 32, 8192, 16),
         ("70B at 4-bit, 48 GB GPU", 70, 4, 80, 8192, 48),
         ("70B at 16-bit, 48 GB GPU", 70, 16, 80, 8192, 48)]
for name, p, b, layers, ctx, vram in cases:
    w, c, t, ok = fit_check(p, b, layers, ctx, vram)
    print(f"{name}: weights {w:.2f} GB + cache {c:.2f} GB + working 1.00 GB = {t:.2f} GB -> {'fits' if ok else 'does NOT fit'} ({vram - t:+.2f} GB)")
print("speed limit at 400 GB/s:", " ".join(f"{b}-bit {speed_limit(8 * b / 8, 400):.0f} tokens/s" for b in (16, 8, 4)))
```
```text Output of fit_check.py (executed 2026-11-24)
8B at 16-bit, 24 GB GPU: weights 16.00 GB + cache 1.07 GB + working 1.00 GB = 18.07 GB -> fits (+5.93 GB)
8B at 4-bit, 16 GB GPU: weights 4.00 GB + cache 1.07 GB + working 1.00 GB = 6.07 GB -> fits (+9.93 GB)
8B at 16-bit, 16 GB GPU: weights 16.00 GB + cache 1.07 GB + working 1.00 GB = 18.07 GB -> does NOT fit (-2.07 GB)
70B at 4-bit, 48 GB GPU: weights 35.00 GB + cache 2.68 GB + working 1.00 GB = 38.68 GB -> fits (+9.32 GB)
70B at 16-bit, 48 GB GPU: weights 140.00 GB + cache 2.68 GB + working 1.00 GB = 143.68 GB -> does NOT fit (-95.68 GB)
speed limit at 400 GB/s: 16-bit 25 tokens/s 8-bit 50 tokens/s 4-bit 100 tokens/s
```
Choose the device and move a model and its data to it. This needs PyTorch and was not run here (no GPU in the build environment):
```python gpu_device.py
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
```
Load a language model so that it uses the GPU, and measure the speed. This needs the `transformers` and `accelerate` packages and was not run here:
```python load_and_time.py
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

name = "<an open model you are licensed to use>"
tokenizer = AutoTokenizer.from_pretrained(name)
# device_map="auto" fills the GPU first, then the CPU if the model does not fit. Newer versions call
# the dtype argument "dtype"; older ones call it "torch_dtype".
model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.bfloat16, device_map="auto")
print("First layer is on:", next(model.parameters()).device)

inputs = tokenizer("Explain what a GPU does, in one sentence.", return_tensors="pt").to(model.device)
start = time.time()
out = model.generate(**inputs, max_new_tokens=64)
seconds = time.time() - start
new_tokens = out.shape[1] - inputs["input_ids"].shape[1]
print(tokenizer.decode(out[0], skip_special_tokens=True))
print(f"{new_tokens / seconds:.1f} tokens per second")
```
Commands for watching the GPU (they are shell commands, not Python, and were not run here):
```text Shell commands, not run here
nvidia-smi                      # GPU, driver, memory used, how busy it is
nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv
ollama ps                       # for a model loaded by Ollama: how much of it is on the GPU
```

## .NET (C#) example
The same fit check in C#. It prints the same numbers as the Python version, and it ran:
```cs Program.cs
static (double Weights, double Cache, double Total, bool Fits) FitCheck(double paramsBillion, int bits, int layers, int ctxTokens, double vramGb,
    int kvHeads = 8, int headSize = 128, double workingGb = 1.0)
{
    double weightsGb = paramsBillion * bits / 8;                         // billions of parameters x bytes each = GB
    double cacheBytesPerToken = 2.0 * layers * kvHeads * headSize * 2;    // keys and values, 2 bytes per value
    double cacheGb = cacheBytesPerToken * ctxTokens / 1e9;
    double totalGb = weightsGb + cacheGb + workingGb;
    return (weightsGb, cacheGb, totalGb, totalGb <= vramGb);
}

static double SpeedLimit(double weightsGb, double bandwidthGbPerS) => bandwidthGbPerS / weightsGb;   // every token reads all weights once

var cases = new (string Name, double P, int Bits, int Layers, int Ctx, double Vram)[]
{
    ("8B at 16-bit, 24 GB GPU", 8, 16, 32, 8192, 24),
    ("8B at 4-bit, 16 GB GPU", 8, 4, 32, 8192, 16),
    ("8B at 16-bit, 16 GB GPU", 8, 16, 32, 8192, 16),
    ("70B at 4-bit, 48 GB GPU", 70, 4, 80, 8192, 48),
    ("70B at 16-bit, 48 GB GPU", 70, 16, 80, 8192, 48),
};
foreach (var c in cases)
{
    var r = FitCheck(c.P, c.Bits, c.Layers, c.Ctx, c.Vram);
    Console.WriteLine($"{c.Name}: weights {r.Weights:F2} GB + cache {r.Cache:F2} GB + working 1.00 GB = {r.Total:F2} GB -> {(r.Fits ? "fits" : "does NOT fit")} ({c.Vram - r.Total:+0.00;-0.00} GB)");
}
Console.WriteLine("speed limit at 400 GB/s: " + string.Join(" ", new[] { 16, 8, 4 }.Select(b => $"{b}-bit {SpeedLimit(8.0 * b / 8, 400):F0} tokens/s")));
```
Choose a device with TorchSharp. The package `TorchSharp-cpu` is CPU-only; for an NVIDIA GPU use the CUDA build of TorchSharp for your operating system. This sample compiled and ran on its CPU path here; it was not run on a GPU:
```cs GpuDevice.cs
using TorchSharp;
using static TorchSharp.torch;

var device = cuda.is_available() ? CUDA : CPU;
Console.WriteLine($"Using: {device}");

var model = nn.Linear(1024, 1024).to(device);          // copy the weights to the device
var x = randn(8, 1024).to(device);                      // the inputs must be on the same device
var y = model.forward(x);
Console.WriteLine($"Output is on: {y.device}");
```
Run an exported ONNX model on the GPU when there is one, and on the CPU when there is not. ONNX Runtime needs the GPU package (`Microsoft.ML.OnnxRuntime.Gpu`) for the CUDA provider. This sample compiled and ran here without a GPU, so it printed the CPU fallback message:
```cs OnnxDevice.cs
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
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Memory to hold a model (weights, cache and working space)
**Where it is used:** deciding before you download whether a model will fit in the memory of your GPU.

```formula Memory needed
weights = parameters x bytes per weight
cache per token = 2 x layers x KV heads x head size x bytes per value
needed = weights + cache per token x tokens + working space
```
**In plain words:** the weights depend only on the model and its number format. The cache grows with the length of the conversation. Add a little working space and compare the total with the VRAM.

**Example 1: 4-bit 8-billion model.** Weights: 8 × 0.5 = 4 GB. Cache for 8,192 tokens with 32 layers, 8 KV heads, size 128 and 2-byte values: 2 × 32 × 8 × 128 × 2 = 131,072 bytes per token, and 131,072 × 8,192 = 1,073,741,824 bytes, about 1.07 GB. With 1 GB of working space the total is 4 + 1.07 + 1 = 6.07 GB.

**Example 2: 16-bit 70-billion model.** Weights: 70 × 2 = 140 GB. Even before the cache this is far more than a 48 GB GPU, so it does not fit. At 4 bits the weights are 70 × 0.5 = 35 GB, and with about 2.68 GB of cache and 1 GB of working space the total is about 38.7 GB, which fits in 48 GB.

### Speed limit from memory bandwidth (tokens per second)
**Where it is used:** a quick estimate of how fast a model can write on a given GPU, and why a smaller number format is also faster.

```formula Memory-bound speed limit
tokens per second (at most) = memory bandwidth in GB per second ÷ size of the weights in GB
```
**In plain words:** every new token needs every weight to be read once. The GPU can read only so many gigabytes per second, so that sets the pace for a single conversation.

**Example 1: one GPU, three formats.** With a made-up 400 GB per second and an 8-billion model: 16-bit weights are 16 GB, so 400 ÷ 16 = 25 tokens per second. At 8 bits, 400 ÷ 8 = 50. At 4 bits, 400 ÷ 4 = 100.

**Example 2: a slower memory.** The same 4-bit model, 4 GB, on memory that delivers 100 GB per second: 100 ÷ 4 = 25 tokens per second. A fast arithmetic unit would not help, because the limit is the memory.

## Maths behind it
- Parameters times bytes per number (memory for weights)
- Cache size from layers, heads and context length
- Memory bandwidth and the speed limit it sets
- Number formats and bits (FP32, FP16, BF16, INT8, 4-bit)

## Common mistakes
- Assuming the code uses the GPU. A missing driver, a CPU-only framework build or a tensor left on the CPU makes it run on the CPU with no error. Print the device.
- Checking that the weights fit and forgetting the cache and working space.
- Moving the model to the GPU but not the inputs ("expected all tensors on the same device").
- Installing a full CUDA Toolkit, a new driver and a framework by hand without checking that they match. Use the framework's own install command for your GPU.
- Reading the CUDA version in `nvidia-smi` as the installed toolkit. It is the newest version the driver supports.
- Buying a GPU for the number of cores when the limit is memory: for running models, VRAM size and memory speed matter most.
- Expecting offloaded layers to run at GPU speed.

## Quick check
Q: What is CUDA, and do you have to write it?
A: CUDA is NVIDIA's platform for running calculations on its GPUs. You usually do not write it: frameworks such as PyTorch call it when you ask for the device "cuda".

Q: A model's weights are 14 GB and your GPU has 12 GB of VRAM. Name two ways to make it run.
A: Store the weights in fewer bits (a 4-bit file would be about 3.5 GB), or move some layers to the CPU (slower). A smaller model or a bigger GPU also work.

Q: Why is a 4-bit model usually faster at writing text than the same model at 16 bits?
A: Each new token needs every weight to be read from memory once. Four bits means a quarter of the bytes to read, so the memory-bound speed limit is about four times higher.

Q: Your program runs but is slow, and `nvidia-smi` shows the GPU idle. What do you check first?
A: Whether the code really uses the GPU: print the device of the model and its inputs, and check that the framework build and the driver support the GPU.

Q: Besides the weights, what else takes GPU memory while a model writes?
A: The cache of earlier keys and values, which grows with the conversation, and working space for temporary results.
