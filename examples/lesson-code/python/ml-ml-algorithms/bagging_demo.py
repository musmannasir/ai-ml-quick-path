# From lesson 'ml-algorithms' (ml). Code status: Python executed 2026-11-02 (examples/ai-extras/ai_extras.py algos, gap_topics.py svm); added technique snippets (2026-11-05) not run
import numpy as np

rng = np.random.default_rng(0)
data = np.array([10, 12, 11, 13, 9, 14, 8, 12, 11, 10])   # ten made-up values

estimates = []
for _ in range(5):                                         # five "models"
    sample = rng.choice(data, size=len(data), replace=True)  # bootstrap: pick with replacement
    estimates.append(sample.mean())                        # each model learns from its own sample

print("each model says:", estimates)
print("bagged answer (the average):", np.mean(estimates))  # combine by averaging
# For classes, count the votes instead: np.bincount(votes).argmax()
