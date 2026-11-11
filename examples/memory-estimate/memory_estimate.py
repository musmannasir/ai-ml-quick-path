"""Back-of-the-envelope GPU memory arithmetic for language models.

These are LOWER-BOUND estimates for planning. Real usage is higher because of
framework overhead, CUDA context, activation memory, fragmentation, batching and
runtime-specific buffers. Always measure on your own hardware.

Runtime prerequisites: Python 3.10+ (standard library only).
Run:  python memory_estimate.py
"""

GB = 1e9      # decimal gigabyte, as used on most spec sheets
GIB = 2**30   # binary gibibyte, as reported by many tools (nvidia-smi shows MiB)

BYTES_PER_PARAM = {"fp32": 4, "bf16/fp16": 2, "int8": 1, "4-bit": 0.5}


def weights_bytes(params: float, bytes_per_param: float) -> float:
    """Inference weights only: parameters x bytes per weight."""
    return params * bytes_per_param


def full_finetune_state_bytes(params: float) -> float:
    """Common mixed-precision AdamW rule of thumb, before activations:
    bf16 weights (2) + bf16 gradients (2) + fp32 master weights (4)
    + Adam first and second moments in fp32 (4 + 4) = 16 bytes per parameter.
    Exact numbers depend on the framework and optimizer settings."""
    return params * 16


def kv_cache_bytes(layers: int, kv_heads: int, head_dim: int, tokens: int,
                   batch: int = 1, bytes_per_value: float = 2) -> float:
    """Keys and values are stored for every layer, KV head and token:
    2 (K and V) x layers x kv_heads x head_dim x tokens x batch x bytes."""
    return 2 * layers * kv_heads * head_dim * tokens * batch * bytes_per_value


def main() -> None:
    params = 8e9
    print("Weights only, 8B parameters:")
    for name, b in BYTES_PER_PARAM.items():
        w = weights_bytes(params, b)
        print(f"  {name:>9}: {w / GB:5.1f} GB  ({w / GIB:5.1f} GiB)")

    print(f"Full fine-tuning state (AdamW, mixed precision, no activations): "
          f"{full_finetune_state_bytes(params) / GB:.0f} GB")

    # Assumed architecture similar to published 8B decoder models that use
    # grouped-query attention: 32 layers, 8 KV heads, head dimension 128.
    # Check the real values in the model's config.json before relying on this.
    per_token = kv_cache_bytes(layers=32, kv_heads=8, head_dim=128, tokens=1)
    print(f"KV cache per token (bf16): {per_token / 1024:.0f} KiB")
    for tokens, batch in [(8_192, 1), (32_768, 1), (8_192, 8)]:
        kv = kv_cache_bytes(32, 8, 128, tokens, batch)
        print(f"  {tokens:>6} tokens x batch {batch}: {kv / GB:5.2f} GB")


if __name__ == "__main__":
    main()
