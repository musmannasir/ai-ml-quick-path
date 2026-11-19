# From lesson 'llm-embed-train' (llm). Code status: Python executed 2026-11-19 (examples/embed-train/embed_train.py, NumPy only); no embedding model was trained and no neural framework was run; the C# version prints the same output
"""How an embedding model is trained: mean pooling, cosine similarity and the contrastive (InfoNCE) loss.

Three question and answer pairs are turned into short vectors. The loss is low when each question is closest to its own
answer and far from the other answers in the batch. The vectors are fixed by hand so the numbers repeat.
Run:  python embed_train.py   (needs numpy)
"""
import numpy as np

print("mean pooling of three token vectors:", np.mean([[1, 2], [3, 4], [5, 0]], axis=0).tolist())

Q = np.array([[1.0, 0.2, 0.0], [0.1, 1.0, 0.3], [0.0, 0.3, 1.0]])             # question vectors
A_before = np.array([[0.4, 0.9, 0.1], [0.9, 0.3, 0.2], [0.2, 0.5, 0.8]])      # answer vectors from an untrained model
A_after = np.array([[1.0, 0.3, 0.1], [0.2, 1.0, 0.2], [0.1, 0.2, 1.0]])       # the same answers after training

def unit(M):
    return M / np.linalg.norm(M, axis=1, keepdims=True)

def report(name, A, tau=0.1):
    sim = unit(Q) @ unit(A).T                                  # cosine similarity of every question with every answer
    logits = sim / tau
    probs = np.exp(logits) / np.exp(logits).sum(axis=1, keepdims=True)
    loss = float(-np.log(np.diag(probs)).mean())               # InfoNCE: each question should pick its own answer
    hits = float(np.mean(sim.argmax(axis=1) == np.arange(3)))
    print(name + ": similarity of question i with answer j")
    for row in sim:
        print("   " + "  ".join("%.2f" % v for v in row))
    print("   loss %.3f, top-1 accuracy %.2f" % (loss, hits))

report("before training", A_before)
report("after training ", A_after)
