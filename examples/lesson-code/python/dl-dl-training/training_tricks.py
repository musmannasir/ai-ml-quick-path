# From lesson 'dl-training' (dl). Code status: Python dropout demo executed 2026-11-02 (ai_extras.py dropout); PyTorch not run (not installed in the build environment); added technique snippets (2026-11-05) not run
import numpy as np

def batch_norm(x, tiny=1e-5):
    # shift to average 0 and shrink to spread 1; "tiny" avoids dividing by zero
    return (x - x.mean()) / np.sqrt(x.var() + tiny)

def clip(grad, limit):
    length = np.sqrt((grad ** 2).sum())        # length of the gradient
    if length > limit:
        grad = grad * limit / length           # shrink to the limit, same direction
    return grad

def learning_rate(epoch, peak=0.001, warm=4):
    if epoch < warm:
        return peak * epoch / warm             # warm-up: start small
    return peak * 0.1 ** ((epoch - warm) // 10)  # step decay: divide by 10 every 10 epochs

print(batch_norm(np.array([2.0, 4.0, 6.0, 8.0])))
print(clip(np.array([3.0, 4.0]), 1.0))
print(learning_rate(3))
