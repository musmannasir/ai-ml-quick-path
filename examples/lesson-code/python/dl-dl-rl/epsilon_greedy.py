# From lesson 'dl-rl' (dl). Code status: Python executed 2026-11-02 (ai_extras.py qlearn, gap_topics.py pg); added technique snippets (2026-11-05) not run
import random

def choose(avg_reward, epsilon=0.1):
    if random.random() < epsilon:                  # explore: any layout at random
        return random.randrange(len(avg_reward))
    return avg_reward.index(max(avg_reward))       # exploit: the best layout so far

avg_reward = [0.15, 0.18, 0.10]                    # average clicks per view for layouts A, B, C
print(choose(avg_reward))                          # usually 1 (layout B)
