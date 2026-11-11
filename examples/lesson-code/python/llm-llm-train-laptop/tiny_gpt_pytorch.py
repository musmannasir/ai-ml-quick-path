# From lesson 'llm-train-laptop' (llm). Code status: Python NumPy model executed 2026-11-02 (examples/tiny-lm/tiny_char_lm_numpy.py, about 2 seconds on CPU); PyTorch transformer and C# (TorchSharp) not run (not installed in the build environment)
for it in range(max_iters + 1):
    xb, yb = get_batch("train")                  # targets are the inputs shifted by one character
    _, loss = model(xb, yb)
    opt.zero_grad(set_to_none=True)
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step(); sched.step()
