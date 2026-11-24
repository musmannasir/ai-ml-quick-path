# From lesson 'llm-hardware' (llm). Code status: Python fit-check arithmetic executed 2026-11-24 (fit_check.py); PyTorch, Hugging Face and runner commands not run (no GPU in the build environment); C# fit check ran, GPU device code compiled only
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
