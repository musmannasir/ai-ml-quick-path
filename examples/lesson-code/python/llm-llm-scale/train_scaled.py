# From lesson 'llm-scale' (llm). Code status: Python memory arithmetic executed 2026-11-02 (examples/memory-estimate/memory_estimate.py); multi-GPU code conceptual; C# is plain .NET and was not compiled (no .NET SDK in the build environment)
scaler_dtype = torch.bfloat16
for i, (xb, yb) in enumerate(loader):
    with torch.autocast("cuda", dtype=scaler_dtype):          # mixed precision
        loss = model(xb.cuda(), yb.cuda()) / accum_steps
    loss.backward()
    if (i + 1) % accum_steps == 0:                            # gradient accumulation
        optimizer.step(); optimizer.zero_grad()
# Multi-GPU: wrap the model with torch.distributed.fsdp.FullyShardedDataParallel and launch with
#   torchrun --nproc_per_node=8 train_scaled.py
