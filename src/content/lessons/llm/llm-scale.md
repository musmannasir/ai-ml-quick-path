---
id: llm-scale
title: From laptop to big hardware: scaling training
module: llm
level: Expert
minutes: 90
goal: Estimate memory for training and inference, and choose the right scaling tools (GPUs, mixed precision, gradient accumulation and checkpointing, data and model parallelism, FSDP) as models grow.
prereqs: llm-train-laptop
reviewed: 2026-11-02
evidence: A written plan to train or fine-tune a named model size on a named GPU setup, with memory arithmetic and the chosen techniques justified.
code: Python memory arithmetic executed 2026-11-02 (examples/memory-estimate/memory_estimate.py); multi-GPU code conceptual; C# is plain .NET and was not compiled (no .NET SDK in the build environment)
---
## In plain words
The same training loop scales from a laptop to thousands of GPUs, but memory and time become the limits. Memory has several parts: the **weights** (parameters × bytes each; 2 bytes in 16-bit formats), the **gradients**, the **optimiser state** (AdamW keeps extra numbers per weight) and the **activations** saved for the backward pass. A common rule of thumb for full training with AdamW is about **16 bytes per parameter** before activations. Tools to fit and speed up training, from easiest to hardest: use a **GPU**; use **mixed precision** (BF16); **gradient accumulation** (add up gradients from several small batches to act like one big batch); **gradient checkpointing** (recompute activations instead of storing them); **data parallelism** (copies of the model on several GPUs, each with different data); **sharded data parallelism** (FSDP or DeepSpeed ZeRO split weights, gradients and optimiser state across GPUs); and **tensor and pipeline parallelism** (split the model itself across GPUs). For fine-tuning, **LoRA** and **QLoRA** cut memory far more than any of these.

```diagram merge Where training memory goes
note: Full training with AdamW is about 16 bytes per parameter before activations.
- Training memory | Must fit on the GPU or be shared across GPUs | output
- Weights | Parameters times bytes each; 2 bytes in 16-bit formats | model
- Gradients | One per weight, from the backward pass | process
- Optimiser state | AdamW keeps extra numbers per weight | store
- Activations | Saved for the backward pass | store
```

```diagram layers Scaling tools, easiest at the top
note: Use the easy tools first; move down only when memory or time forces you.
- GPU | Use one first | process
- Mixed precision (BF16) | Smaller numbers, less memory | process
- Gradient accumulation | Add gradients from small batches to act like a big batch | process
- Gradient checkpointing | Recompute activations instead of storing them | process
- Data parallelism | Model copies on several GPUs, different data each | model
- Sharded data parallelism (FSDP, ZeRO) | Split weights, gradients and optimiser state | model
- Tensor and pipeline parallelism | Split the model itself across GPUs | model
```

```diagram compare Three ways to use several GPUs
## Data parallelism | process
- Full copy of the model on each GPU
- Each GPU gets different data
- Adds speed, not memory
## Sharded (FSDP, ZeRO) | model
- Weights, gradients and optimiser state split
- Each GPU holds a share
- Reduces memory per GPU
## Tensor and pipeline | store
- The model itself is split
- Different GPUs hold different parts
```

```diagram compare LoRA versus full training memory
## Full fine-tuning | warn
- All weights trained
- Gradients and optimiser state for everything
## LoRA and QLoRA | output
- Frozen model, small added parts trained
- Cuts memory far more than the other tools
```

## Real-world example
A team wants to fine-tune an 8-billion-parameter model. Full fine-tuning would need about 128 GB for training state alone, more than one 80 GB GPU. Options: shard across 8 GPUs with FSDP (about 16 GB each), or use LoRA on one GPU. They choose LoRA for the first version because it is cheaper and faster to iterate.

```diagram fan Options for an 8-billion-parameter fine-tune
note: Numbers are the ones in this lesson's text.
- About 128 GB of training state | More than one 80 GB GPU | bad
- FSDP on 8 GPUs | About 16 GB each | model
- LoRA on one GPU | Chosen for version one: cheaper, faster to iterate | output
```

## How it works
1. Estimate memory: weights, gradients, optimiser state, activations.
2. If it fits one GPU: use mixed precision; add gradient accumulation for larger effective batches.
3. If activations are the problem: gradient checkpointing.
4. If weights plus optimiser state are the problem: FSDP or ZeRO across GPUs, or switch to LoRA/QLoRA.
5. For speed: data parallelism across GPUs; measure tokens per second and cost.
6. Checkpoint often; long jobs on many GPUs fail more often.

```diagram flow Which scaling tool to reach for
- Estimate memory | Weights, gradients, optimiser state, activations | input
- Fits one GPU? | Use mixed precision; add gradient accumulation | process
- Activations too big? | Gradient checkpointing | process
- Weights plus optimiser too big? | FSDP or ZeRO, or LoRA and QLoRA | model
- Need speed? | Data parallelism; measure tokens per second and cost | output
```

```diagram compare Gradient accumulation
## Without it | process
- One update per batch
- A larger batch needs more memory
## With it | output
- Gradients from small batches are added up
- One update acts like a larger batch
```

## Python example
Memory arithmetic for an 8-billion-parameter model:
```text Output of memory_estimate.py (executed)
Weights only, 8B parameters:
       fp32:  32.0 GB  ( 29.8 GiB)
  bf16/fp16:  16.0 GB  ( 14.9 GiB)
       int8:   8.0 GB  (  7.5 GiB)
      4-bit:   4.0 GB  (  3.7 GiB)
Full fine-tuning state (AdamW, mixed precision, no activations): 128 GB
KV cache per token (bf16): 128 KiB
    8192 tokens x batch 1:  1.07 GB
   32768 tokens x batch 1:  4.29 GB
    8192 tokens x batch 8:  8.59 GB
```
Mixed precision, gradient accumulation and multi-GPU launch in PyTorch:
```python train_scaled.py (conceptual; requires torch and GPUs)
scaler_dtype = torch.bfloat16
for i, (xb, yb) in enumerate(loader):
    with torch.autocast("cuda", dtype=scaler_dtype):          # mixed precision
        loss = model(xb.cuda(), yb.cuda()) / accum_steps
    loss.backward()
    if (i + 1) % accum_steps == 0:                            # gradient accumulation
        optimizer.step(); optimizer.zero_grad()
# Multi-GPU: wrap the model with torch.distributed.fsdp.FullyShardedDataParallel and launch with
#   torchrun --nproc_per_node=8 train_scaled.py
```

## .NET (C#) example
Large-scale training is almost always done in Python. .NET teams typically plan jobs, launch them on cloud GPUs and use the trained model. A memory planner in plain C#:
```cs Program.cs
double parameters = 8e9;
int gpus = 8; double gpuMemoryGb = 80;

double weights16 = parameters * 2 / 1e9;
double fullTraining = parameters * 16 / 1e9;                 // AdamW, mixed precision, before activations
double perGpuDdp = fullTraining;                             // data parallel: every GPU holds everything
double perGpuFsdp = fullTraining / gpus;                     // sharded: state split across GPUs

Console.WriteLine($"weights (16-bit): {weights16:F0} GB, full training state: {fullTraining:F0} GB");
Console.WriteLine($"data parallel per GPU: {perGpuDdp:F0} GB -> {(perGpuDdp < gpuMemoryGb ? "fits" : "does not fit")}");
Console.WriteLine($"FSDP per GPU: {perGpuFsdp:F0} GB -> {(perGpuFsdp < gpuMemoryGb ? "fits (plus activations)" : "does not fit")}");
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Training memory per GPU (data parallel and sharded)
**Where it is used:** choosing between plain data parallelism and sharding (FSDP, ZeRO) when full fine-tuning does not fit on one GPU.

```formula Memory per GPU
full training state ≈ parameters × 16 bytes   (before activations)
data parallel, per GPU = full training state
sharded (FSDP), per GPU ≈ full training state ÷ number of GPUs
```
The 16 bytes per parameter is a rule of thumb for weights, gradients and AdamW optimiser state with mixed precision. Activations come on top.

**In plain words:** with data parallelism every GPU holds a full copy. With sharding the copy is split, so each GPU holds a share.

**Example 1: sharded across 8 GPUs.** An 8 billion parameter model: 8,000,000,000 × 16 = 128 GB. Split over 8 GPUs: 128 ÷ 8 = 16 GB each. This fits in an 80 GB GPU with room for activations.

**Example 2: plain data parallel.** Every GPU needs the whole 128 GB. 128 GB is more than 80 GB, so it does not fit, no matter how many GPUs you add.

### Effective batch size (gradient accumulation)
**Where it is used:** the accumulation loop in the PyTorch example, which gives a large batch without large memory.

```formula Effective batch size
effective batch = micro-batch size × accumulation steps × number of GPUs
```
The micro-batch is the number of examples one GPU processes in one forward and backward pass.

**In plain words:** the optimiser takes one step only after several small batches have added up their gradients, so it behaves like one big batch.

**Example 1: eight GPUs.** Micro-batch 4, accumulation 8, GPUs 8: 4 × 8 × 8 = 256 examples per optimiser step.

**Example 2: one GPU.** Micro-batch 4, accumulation 16, one GPU: 4 × 16 × 1 = 64 examples per step. Dividing the loss by the accumulation steps keeps the gradient the same size as it would be for one batch of 64.

## Maths behind it
- Memory arithmetic: parameters × bytes per value
- Floating-point formats: FP32, BF16, FP16, INT8, 4-bit
- Gradient accumulation (averaging gradients)
- Parallel computing: data, tensor and pipeline parallelism
- Communication cost (all-reduce)

## Common mistakes
- Expecting data parallelism to reduce memory per GPU; it only adds speed.
- Assuming 8 GPUs give 8 times the speed; communication overhead reduces it.
- Long runs without frequent checkpoints.

```diagram compare What more GPUs do and do not do
## Expected | warn
- Data parallelism lowers memory per GPU
- 8 GPUs give 8 times the speed
## Reality | output
- Data parallelism only adds speed (full copies)
- Communication overhead reduces the speed-up
```

## Quick check
Q: Does data parallelism reduce memory per GPU?
A: No. Each GPU holds a full copy; it increases speed. Sharding (FSDP, ZeRO) reduces memory per GPU.

Q: What does gradient accumulation do?
A: Adds up gradients from several small batches before one update, acting like a larger batch without more memory.

Q: About how much memory does full fine-tuning of an 8B model need for training state?
A: About 128 GB (16 bytes per parameter) before activations.
