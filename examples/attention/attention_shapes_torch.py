"""Q/K/V shapes in causal multi-head self-attention (PyTorch).

Runtime prerequisites: Python 3.10+, PyTorch 2.1+ (CPU is fine).
Run:  python attention_shapes_torch.py
Status in this repository: syntax-checked with py_compile; executed by the author
only where PyTorch is installed. Expected output is derived from the tensor
shapes, which do not depend on random values.
"""
import torch
import torch.nn.functional as F

torch.manual_seed(0)

B, T, C = 1, 7, 16        # batch, tokens ("The cat sat because it was tired"), model width
H = 4                     # attention heads
D = C // H                # width per head = 4

x = torch.randn(B, T, C)  # token embeddings + position information, shape (B, T, C)

# One linear layer produces Q, K and V together, then we split them.
qkv = torch.nn.Linear(C, 3 * C, bias=False)
q, k, v = qkv(x).split(C, dim=-1)                 # each (B, T, C)

# Reshape into heads: (B, T, C) -> (B, H, T, D)
def heads(t: torch.Tensor) -> torch.Tensor:
    return t.view(B, T, H, D).transpose(1, 2)

q, k, v = heads(q), heads(k), heads(v)
print("q, k, v:", tuple(q.shape))                 # (1, 4, 7, 4)

scores = q @ k.transpose(-2, -1) / D ** 0.5        # (B, H, T, T): every token vs every token
mask = torch.tril(torch.ones(T, T, dtype=torch.bool))
scores = scores.masked_fill(~mask, float("-inf"))  # causal: no looking at future tokens
weights = scores.softmax(dim=-1)                   # each row sums to 1
print("attention weights:", tuple(weights.shape))  # (1, 4, 7, 7)

out = weights @ v                                  # (B, H, T, D)
out = out.transpose(1, 2).reshape(B, T, C)         # merge heads back: (B, T, C)
print("output:", tuple(out.shape))                 # (1, 7, 16)

# PyTorch's fused implementation gives the same result (up to float tolerance).
fused = F.scaled_dot_product_attention(q, k, v, is_causal=True)
print("matches fused SDPA:", torch.allclose(fused.transpose(1, 2).reshape(B, T, C), out, atol=1e-5))
