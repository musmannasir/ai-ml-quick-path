"""A tiny decoder-only transformer (GPT-style) trained on corpus.txt.

Runtime prerequisites: Python 3.10+, PyTorch 2.1+. CPU works (a few minutes);
a GPU is faster. Run:  python tiny_gpt_pytorch.py
Status in this repository: syntax-checked (py_compile). It was NOT executed in the
academy build environment because PyTorch is not installed there, so no measured
output is claimed. Expected behaviour: validation loss falls from about ln(vocab)
(≈3.4 for this corpus) and samples become more word-like. Exact numbers vary by
hardware and PyTorch version even with a fixed seed.

Design follows the structure popularised by Andrej Karpathy's nanoGPT
(https://github.com/karpathy/nanoGPT), simplified for teaching.
"""
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(1337)
device = "cuda" if torch.cuda.is_available() else "cpu"

# ---- hyperparameters (the "architecture design" decisions) ----
block_size = 64      # context length in characters
n_embd = 64          # model width
n_head = 4           # attention heads (head size = 16)
n_layer = 2          # transformer blocks
dropout = 0.1
batch_size = 32
max_iters = 2000
eval_every = 250
lr = 3e-3

text = (Path(__file__).parent / "corpus.txt").read_text(encoding="utf-8").lower()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda ids: "".join(itos[i] for i in ids)

data = torch.tensor(encode(text), dtype=torch.long)
n = int(0.9 * len(data))
train_data, val_data = data[:n], data[n:]


def get_batch(split: str):
    src = train_data if split == "train" else val_data
    ix = torch.randint(len(src) - block_size - 1, (batch_size,))
    x = torch.stack([src[i : i + block_size] for i in ix])
    y = torch.stack([src[i + 1 : i + block_size + 1] for i in ix])   # targets = inputs shifted by one
    return x.to(device), y.to(device)


class CausalSelfAttention(nn.Module):
    def __init__(self):
        super().__init__()
        self.qkv = nn.Linear(n_embd, 3 * n_embd, bias=False)
        self.proj = nn.Linear(n_embd, n_embd)
        self.drop = nn.Dropout(dropout)

    def forward(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(x).split(C, dim=2)
        q, k, v = (t.view(B, T, n_head, C // n_head).transpose(1, 2) for t in (q, k, v))
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True,
                                           dropout_p=dropout if self.training else 0.0)
        y = y.transpose(1, 2).contiguous().view(B, T, C)
        return self.drop(self.proj(y))


class Block(nn.Module):
    """Pre-norm transformer block: x + attention(norm(x)), then x + MLP(norm(x))."""

    def __init__(self):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(n_embd), nn.LayerNorm(n_embd)
        self.attn = CausalSelfAttention()
        self.mlp = nn.Sequential(nn.Linear(n_embd, 4 * n_embd), nn.GELU(),
                                 nn.Linear(4 * n_embd, n_embd), nn.Dropout(dropout))

    def forward(self, x):
        x = x + self.attn(self.ln1(x))     # residual connection
        x = x + self.mlp(self.ln2(x))      # residual connection
        return x


class TinyGPT(nn.Module):
    def __init__(self, vocab_size: int):
        super().__init__()
        self.tok = nn.Embedding(vocab_size, n_embd)
        self.pos = nn.Embedding(block_size, n_embd)       # learned absolute positions
        self.blocks = nn.Sequential(*[Block() for _ in range(n_layer)])
        self.ln_f = nn.LayerNorm(n_embd)
        self.head = nn.Linear(n_embd, vocab_size, bias=False)
        self.head.weight = self.tok.weight                # weight tying

    def forward(self, idx, targets=None):
        B, T = idx.shape
        x = self.tok(idx) + self.pos(torch.arange(T, device=idx.device))
        logits = self.head(self.ln_f(self.blocks(x)))
        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens: int, temperature: float = 1.0):
        for _ in range(max_new_tokens):
            logits, _ = self(idx[:, -block_size:])
            probs = F.softmax(logits[:, -1, :] / temperature, dim=-1)
            idx = torch.cat([idx, torch.multinomial(probs, 1)], dim=1)
        return idx


@torch.no_grad()
def estimate_loss(model):
    model.eval()
    out = {}
    for split in ("train", "val"):
        losses = torch.stack([model(*get_batch(split))[1] for _ in range(20)])
        out[split] = losses.mean().item()
    model.train()
    return out


def main():
    model = TinyGPT(len(chars)).to(device)
    print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")
    start = torch.tensor([encode("the ")], device=device)
    print("Before:", repr(decode(model.generate(start, 60)[0].tolist())))
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=max_iters)
    best_val = float("inf")
    for it in range(max_iters + 1):
        if it % eval_every == 0:
            losses = estimate_loss(model)
            print(f"iter {it:4d}  train {losses['train']:.3f}  val {losses['val']:.3f}")
            if losses["val"] < best_val:                   # keep the best checkpoint
                best_val = losses["val"]
                torch.save({"model": model.state_dict(), "iter": it, "val": best_val}, "tiny_gpt.pt")
        xb, yb = get_batch("train")
        _, loss = model(xb, yb)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)   # gradient clipping
        opt.step()
        sched.step()
    ckpt = torch.load("tiny_gpt.pt", map_location=device)
    model.load_state_dict(ckpt["model"])
    print(f"Best checkpoint at iter {ckpt['iter']} with val {ckpt['val']:.3f}")
    print("After: ", repr(decode(model.generate(start, 60)[0].tolist())))


if __name__ == "__main__":
    main()
