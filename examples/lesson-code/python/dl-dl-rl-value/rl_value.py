# From lesson 'dl-rl-value' (dl). Code status: Python executed 2026-11-18 (examples/rl-value/rl_value.py, standard library only); PyTorch was not installed, so no deep Q-network was run; the C# version prints the same output
"""Value methods on a five-state corridor: Monte Carlo and temporal-difference estimates, then Q-learning and SARSA.

States 0 to 4, the agent starts at 0 and the only reward (+1) comes on reaching state 4. Discount 0.9.
Exploration uses a small repeatable random generator, so the numbers repeat and match the C# version.
Run:  python rl_value.py
"""
gamma = 0.9

# 1. Evaluate the policy "always move right" from the same five episodes by two methods
#    Every episode is the same walk, 0 -> 1 -> 2 -> 3 -> 4, so returns are exact.
G = [gamma ** (3 - s) for s in range(4)]                     # return from state s: reward 1 after (4 - s) steps
print("Monte Carlo return from states 0, 1, 2, 3:", " ".join("%.3f" % g for g in G))
V = [0.0] * 5
for episode in range(30):                                    # TD(0): V(s) += alpha * (r + gamma V(s') - V(s))
    for s in range(4):
        r = 1.0 if s == 3 else 0.0
        V[s] += 0.5 * (r + gamma * V[s + 1] - V[s])
print("TD(0) estimates after 30 episodes:       ", " ".join("%.3f" % v for v in V[:4]))

# 2. Q-learning and SARSA with epsilon-greedy exploration (actions: 0 = left, 1 = right)
class Lcg:
    def __init__(self, seed): self.x = seed
    def next(self):
        self.x = (1103515245 * self.x + 12345) % (2 ** 31)
        return self.x / 2 ** 31

def run(on_policy):
    rng, Q = Lcg(7), [[0.0, 0.0] for _ in range(5)]
    def act(s):
        if rng.next() < 0.3:
            return 0 if rng.next() < 0.5 else 1
        return 1 if Q[s][1] >= Q[s][0] else 0
    for episode in range(200):
        s, a = 0, act(0)
        for step in range(30):
            s2 = max(0, s - 1) if a == 0 else min(4, s + 1)
            r = 1.0 if s2 == 4 else 0.0
            a2 = act(s2)
            nxt = 0.0 if s2 == 4 else (Q[s2][a2] if on_policy else max(Q[s2]))
            Q[s][a] += 0.2 * (r + gamma * nxt - Q[s][a])
            if s2 == 4: break
            s, a = s2, a2
    return Q
for name, flag in (("Q-learning", False), ("SARSA", True)):
    Q = run(flag)
    print("%-10s value of 'right' in states 0 to 3: %s   best action in each: %s" % (name, " ".join("%.3f" % Q[s][1] for s in range(4)), "".join("R" if Q[s][1] >= Q[s][0] else "L" for s in range(4))))
