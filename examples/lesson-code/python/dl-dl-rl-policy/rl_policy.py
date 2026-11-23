# From lesson 'dl-rl-policy' (dl). Code status: Python executed 2026-11-18 (examples/rl-policy/rl_policy.py, standard library only); no neural policy was trained and Stable-Baselines3 was not run; the C# version prints the same output
"""Policy methods in three small calculations: the policy gradient on a two-action choice, advantages with a baseline,
and the PPO clipped objective.

Run:  python rl_policy.py
"""
import math

# 1. Policy gradient (REINFORCE) on a two-action choice with exact expected gradients
#    Action 1 pays 1, action 0 pays 0. The policy is a softmax over two preferences.
theta = [0.0, 0.0]
def probs(th):
    e = [math.exp(v) for v in th]; s = sum(e)
    return [v / s for v in e]
print("step  probability of the better action")
for step in range(0, 31):
    p = probs(theta)
    if step in (0, 5, 10, 20, 30):
        print("%4d  %.3f" % (step, p[1]))
    # expected gradient of E[reward] with respect to preference i: p_i * (reward_i - expected reward)
    expected = p[1] * 1.0
    for i, rew in ((0, 0.0), (1, 1.0)):
        theta[i] += 0.5 * p[i] * (rew - expected)

# 2. Advantage: how much better than usual was this step? Discounted returns minus a baseline.
rewards = [0.0, 0.0, 1.0, 0.0, 2.0]
gamma = 0.9
returns, g = [], 0.0
for r in reversed(rewards):
    g = r + gamma * g
    returns.append(g)
returns.reverse()
baseline = sum(returns) / len(returns)
print("returns:   ", " ".join("%.3f" % v for v in returns))
print("advantages:", " ".join("%.3f" % (v - baseline) for v in returns), "  (baseline %.3f)" % baseline)

# 3. PPO clipped objective for one step: ratio = new probability / old probability
def ppo(ratio, advantage, eps=0.2):
    return min(ratio * advantage, max(min(ratio, 1 + eps), 1 - eps) * advantage)
for ratio, adv in ((1.1, 2.0), (1.5, 2.0), (0.7, -2.0), (1.1, -2.0)):
    print("ratio %.1f  advantage %+.1f  objective %+.2f" % (ratio, adv, ppo(ratio, adv)))
