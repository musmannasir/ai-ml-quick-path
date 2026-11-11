"""Train a tiny character-level language model with NumPy only.

Model: previous 3 characters -> embedding -> tanh hidden layer -> next-character
probabilities (a small multilayer perceptron, in the style of Bengio et al. 2003).
It demonstrates the MECHANICS of language-model training: tokenization,
next-token targets, cross-entropy loss, train/validation split, checkpoints and
sampling. It is not production LLM pretraining and it is not a transformer.

Runtime prerequisites: Python 3.10+, NumPy 1.24+. Runs on a CPU in seconds.
Run:  python tiny_char_lm_numpy.py
Corpus: corpus.txt, original text written for this academy (CC BY 4.0, same as
the site content), so there are no licensing questions.
"""
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
CONTEXT = 3        # characters of context
EMBED = 10         # embedding size per character
HIDDEN = 128       # hidden units
STEPS = 6000
BATCH = 64
SEED = 1337


def build_dataset(text: str, stoi: dict[str, int]) -> tuple[np.ndarray, np.ndarray]:
    """Turn text into (context, next_char) pairs. '.' pads the start."""
    xs, ys = [], []
    ids = [stoi[c] for c in text]
    pad = [stoi["."]] * CONTEXT
    window = pad + ids
    for i in range(len(ids)):
        xs.append(window[i : i + CONTEXT])
        ys.append(ids[i])
    return np.array(xs), np.array(ys)


def init_params(vocab: int, rng: np.random.Generator) -> dict[str, np.ndarray]:
    return {
        "C": rng.normal(0, 1, (vocab, EMBED)),
        "W1": rng.normal(0, 1, (CONTEXT * EMBED, HIDDEN)) * (5 / 3) / np.sqrt(CONTEXT * EMBED),
        "b1": np.zeros(HIDDEN),
        "W2": rng.normal(0, 1, (HIDDEN, vocab)) * 0.01,
        "b2": np.zeros(vocab),
    }


def forward(p, xb):
    emb = p["C"][xb].reshape(len(xb), -1)          # (B, CONTEXT*EMBED)
    h = np.tanh(emb @ p["W1"] + p["b1"])             # (B, HIDDEN)
    logits = h @ p["W2"] + p["b2"]                   # (B, vocab)
    return emb, h, logits


def loss_and_probs(logits, yb):
    z = logits - logits.max(axis=1, keepdims=True)   # numerical stability
    probs = np.exp(z)
    probs /= probs.sum(axis=1, keepdims=True)
    loss = -np.log(probs[np.arange(len(yb)), yb] + 1e-12).mean()   # cross-entropy
    return loss, probs


def evaluate(p, X, Y) -> float:
    _, _, logits = forward(p, X)
    return float(loss_and_probs(logits, Y)[0])


def train_step(p, xb, yb, lr):
    emb, h, logits = forward(p, xb)
    loss, probs = loss_and_probs(logits, yb)
    # Backpropagation by hand: gradient of mean cross-entropy w.r.t. logits.
    dlogits = probs
    dlogits[np.arange(len(yb)), yb] -= 1
    dlogits /= len(yb)
    g = {"W2": h.T @ dlogits, "b2": dlogits.sum(0)}
    dh = dlogits @ p["W2"].T * (1 - h ** 2)          # tanh derivative
    g["W1"] = emb.T @ dh
    g["b1"] = dh.sum(0)
    demb = (dh @ p["W1"].T).reshape(len(xb), CONTEXT, EMBED)
    g["C"] = np.zeros_like(p["C"])
    np.add.at(g["C"], xb, demb)                      # scatter-add into used rows
    for name in p:
        p[name] -= lr * g[name]
    return float(loss)


def sample(p, itos, stoi, rng, n=80, prompt="the") -> str:
    ctx = ([stoi["."]] * CONTEXT + [stoi[c] for c in prompt])[-CONTEXT:]
    out = list(prompt)
    for _ in range(n):
        _, _, logits = forward(p, np.array([ctx]))
        _, probs = loss_and_probs(logits, np.array([0]))
        nxt = int(rng.choice(len(probs[0]), p=probs[0]))
        out.append(itos[nxt])
        ctx = ctx[1:] + [nxt]
    return "".join(out)


def main() -> None:
    text = (HERE / "corpus.txt").read_text(encoding="utf-8").lower().replace("\n", " ")
    chars = sorted(set(text) | {"."})
    stoi = {c: i for i, c in enumerate(chars)}
    itos = {i: c for c, i in stoi.items()}
    split = int(0.9 * len(text))                     # first 90% train, last 10% validation
    Xtr, Ytr = build_dataset(text[:split], stoi)
    Xva, Yva = build_dataset(text[split:], stoi)
    print(f"Characters: {len(text)}, vocabulary: {len(chars)}, train pairs: {len(Xtr)}, val pairs: {len(Xva)}")

    rng = np.random.default_rng(SEED)
    p = init_params(len(chars), rng)
    print(f"Uniform-guess loss would be ln({len(chars)}) = {np.log(len(chars)):.3f}")
    print(f"Step    0  train {evaluate(p, Xtr, Ytr):.3f}  val {evaluate(p, Xva, Yva):.3f}")
    print("Sample before training:", repr(sample(p, itos, stoi, np.random.default_rng(0), n=60)))

    for step in range(1, STEPS + 1):
        idx = rng.integers(0, len(Xtr), BATCH)
        lr = 0.2 if step < STEPS * 0.75 else 0.02     # simple step decay schedule
        train_step(p, Xtr[idx], Ytr[idx], lr)
        if step % 1500 == 0:
            print(f"Step {step:4d}  train {evaluate(p, Xtr, Ytr):.3f}  val {evaluate(p, Xva, Yva):.3f}")

    ckpt = HERE / "tiny_lm_checkpoint.npz"
    np.savez(ckpt, **p)                              # checkpoint: save every parameter
    restored = dict(np.load(ckpt))
    print(f"Checkpoint reloaded, val loss {evaluate(restored, Xva, Yva):.3f}")
    print("Sample after training: ", repr(sample(restored, itos, stoi, np.random.default_rng(0), n=60)))


if __name__ == "__main__":
    main()
