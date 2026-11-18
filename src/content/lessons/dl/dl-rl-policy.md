---
id: dl-rl-policy
title: Reinforcement learning: policy methods
module: dl
level: Advanced
minutes: 75
maths: algebra
goal: Explain how a policy gradient nudges action probabilities towards rewarding actions, why subtracting a baseline gives a clearer signal, and how PPO's clipping keeps each update small.
prereqs: dl-rl-value
reviewed: 2026-11-18
evidence: One policy-gradient step worked by hand with the new probability, a table of advantages for a short trajectory, and a PPO objective for one ratio with and without clipping.
code: Python executed 2026-11-18 (examples/rl-policy/rl_policy.py, standard library only); no neural policy was trained and Stable-Baselines3 was not run; the C# version prints the same output
---
## In plain words
Value methods learn how good things are and then pick the best action. **Policy methods** skip that step: they learn the **policy** itself, the rule that gives the probability of each action in each state, and improve it directly. The basic method is the **policy gradient** (REINFORCE): after trying actions, make the actions that led to high rewards more probable, and the others less probable. The raw reward signal is noisy, so we subtract a **baseline**, usually the average reward. What remains is the **advantage**: how much better than usual this action turned out. **Actor-critic** methods learn two things at once: the policy (the actor) and a value estimate (the critic) that supplies the baseline. **PPO** (proximal policy optimisation) keeps training stable by limiting how far the policy may change in one update. Policy methods suit continuous actions, such as how hard to push a pedal.

```diagram compare Value methods and policy methods
note: Many modern systems use both together in an actor-critic design.
## Value-based | process
- Learn how good each action is
- Pick the best, so actions are discrete
## Policy-based | model
- Learn the action probabilities directly
- Works for continuous actions too
```

```diagram loop The policy-gradient loop
note: Actions that did better than usual become more likely.
- Run the policy and collect an episode | Actions taken and rewards received | input
- Compute each step's advantage | Return minus a baseline | process
- Raise the probability of high-advantage actions | A small step along the gradient | model
loop: Repeat with the improved policy
```

```diagram flow Why a baseline helps
note: A baseline does not change the direction of learning, only how noisy it is.
- Raw returns are all positive | Every action looks good | warn
- Subtract the average return | Now good actions are positive and poor ones negative | process
- The signal is clearer | Less noise, faster learning | output
```

```diagram compare What the PPO clip does
note: The clip stops one lucky batch from pushing the policy far in a single step.
## Inside the allowed range | output
- Ratio near one, normal update
## Outside the allowed range | warn
- The gain from moving further is cut off
- The policy stays close to the old one
```

## Real-world example
A team trains a simulated robot arm to reach a target. The arm's actions are continuous torques, so a table of action values is impossible. They use an actor-critic method with PPO. The actor outputs the average torque and its spread. The critic predicts the expected reward, which gives the baseline. In early runs the arm sometimes collapsed because one update changed the policy too much. Switching on PPO's clipping fixed it. A designer also checked the reward by watching videos of the arm, because the agent had found a way to score by touching the target with a flailing motion.

## How it works
1. **Policy.** A function from a state to action probabilities. For two actions, a softmax over two preference numbers.
2. **Gradient.** Raise the preference of an action in proportion to its probability times how much better its reward was than average.
3. **Baseline and advantage.** Replace the raw return by return minus a baseline. The value estimate from a critic is the usual baseline. Generalised advantage estimation blends several steps for a good trade between noise and bias.
4. **Trust.** PPO multiplies the advantage by the ratio of the new to the old probability of the action, and clips that ratio to a narrow band, such as 0.8 to 1.2.
5. **Other families.** **TRPO** limits the change by a distance constraint. **DDPG, TD3 and SAC** learn continuous control with an off-policy critic. **AlphaZero** combines a policy, a value and tree search. **Offline RL** learns from a fixed log without trying anything new, which is safer but harder. **Reward shaping** adds hints to the reward to speed up learning, and must be designed carefully so that it does not change what the best behaviour is.

```maths One policy-gradient step
situation: A choice between two actions. Action 1 pays a reward of 1 and action 0 pays 0. The policy starts with equal preferences, so each action has probability 0.5. The learning rate is 0.5.
find: After one step, how likely is the better action?
step: The expected reward under the policy | 0.5 × 1 = 0.5
step: Gradient for action 1 (its probability times its reward minus the expected reward) | 0.5 × (1 - 0.5) = 0.25
step: Change in action 1's preference (rate times gradient) | 0.5 × 0.25 = 0.125
step: Action 0's preference falls by the same amount, so the gap is 0.25 and the new probability of action 1 is | 1 ÷ (1 + exp(-0.25)) ≈ 0.562
result: The better action goes from 0.5 to 0.562 after one step.
why: Each step makes the rewarding action a little more likely. The run below repeats this and reaches 0.961 after 30 steps.
caution: This uses the exact expected gradient. A real agent estimates it from sampled episodes, so each step is noisier.
try: After the update, what is the probability of the worse action?
answer: 1 - 0.562 = 0.438.
```

```maths Advantages from a baseline
situation: A short episode gives rewards 0, 0, 1, 0, 2 at steps 1 to 5. The discount is 0.9.
find: What is the advantage of each step, using the average return as the baseline?
step: Return at step 5 | 2 = 2
step: Return at step 4 | 0 + 0.9 × 2 = 1.8
step: Return at step 3 | 1 + 0.9 × 1.8 = 2.62
step: Return at step 2 | 0 + 0.9 × 2.62 = 2.358
step: Baseline, the average of the five returns (2.122, 2.358, 2.62, 1.8, 2) | (2.122 + 2.358 + 2.62 + 1.8 + 2) ÷ 5 = 2.18
step: Advantage of step 3 | 2.62 - 2.18 = 0.44
result: Step 3 has an advantage of 0.44, the best of the five, and step 4 has -0.38. Steps with a positive advantage have their actions made more likely.
why: Every return here is positive, so without a baseline every action would be pushed up. With the baseline only the above-average ones are, and the learning signal is clear.
```

```maths The PPO clipped objective
situation: The ratio of the new probability to the old one for an action is 1.5. The advantage is 2.0. The allowed band is 0.8 to 1.2 (the clip is 0.2).
find: What does PPO use as the objective?
step: Unclipped objective | 1.5 × 2 = 3
step: Clipped objective, with the ratio cut to 1.2 | 1.2 × 2 = 2.4
result: PPO takes the smaller of the two: 2.4. The extra gain from moving the ratio from 1.2 to 1.5 is not rewarded, so there is no pressure to move further.
why: With a negative advantage the rule is the same, taking the smaller value. For ratio 0.7 and advantage -2.0 the choices are 0.7 × (-2) = -1.4 and 0.8 × (-2) = -1.6, and the smaller, -1.6, is used. The clip makes the objective pessimistic where it matters.
try: What are the two choices for ratio 1.1 and advantage 2.0?
answer: 1.1 × 2 = 2.2 for the unclipped, and the ratio 1.1 is inside the band so the clipped version is also 2.2. Nothing is cut inside the band.
```

## Python example
Three small calculations with the standard library: exact policy-gradient steps on a two-action choice, the returns and advantages of a five-step episode, and the PPO objective for four ratios.

```python rl_policy.py
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
```
```text Output of rl_policy.py (executed)
step  probability of the better action
   0  0.500
   5  0.760
  10  0.871
  20  0.939
  30  0.961
returns:    2.122 2.358 2.620 1.800 2.000
advantages: -0.058 0.178 0.440 -0.380 -0.180   (baseline 2.180)
ratio 1.1  advantage +2.0  objective +2.20
ratio 1.5  advantage +2.0  objective +2.40
ratio 0.7  advantage -2.0  objective -1.60
ratio 1.1  advantage -2.0  objective -2.20
```
The probability of the better action climbs from 0.500 to 0.961 in 30 steps, quickly at first and then more slowly as the policy becomes confident. The returns are 2.122, 2.358, 2.620, 1.800 and 2.000, with a baseline of 2.180, giving advantages from -0.380 to +0.440. The PPO objective equals the plain product when the ratio is inside the band (2.20 and -2.20) and is cut when it is outside (2.40 instead of 3, and -1.60 instead of -1.40).

## .NET (C#) example
The same three calculations from scratch in C#, with no packages, printing the same output. Training a neural policy is done in Python; a trained policy is run from .NET through ONNX Runtime. The Unity ML-Agents toolkit also lets a C# game environment train with Python algorithms.

```cs Program.cs
// Policy gradient, advantages and the PPO clipped objective, from scratch. Same output as rl_policy.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// 1. Policy gradient (REINFORCE) on a two-action choice with exact expected gradients
double[] theta = { 0.0, 0.0 };
double[] Probs(double[] th) { var e = th.Select(Math.Exp).ToArray(); double s = e.Sum(); return e.Select(v => v / s).ToArray(); }
Console.WriteLine("step  probability of the better action");
for (int step = 0; step <= 30; step++)
{
    var p = Probs(theta);
    if (step is 0 or 5 or 10 or 20 or 30) Console.WriteLine($"{step,4}  {p[1]:F3}");
    double expected = p[1] * 1.0;
    // expected gradient of E[reward] with respect to preference i: p_i * (reward_i - expected reward)
    theta[0] += 0.5 * p[0] * (0.0 - expected);
    theta[1] += 0.5 * p[1] * (1.0 - expected);
}

// 2. Advantage: how much better than usual was this step? Discounted returns minus a baseline.
double[] rewards = { 0.0, 0.0, 1.0, 0.0, 2.0 };
double gamma = 0.9, g = 0.0;
var rets = new double[rewards.Length];
for (int i = rewards.Length - 1; i >= 0; i--) { g = rewards[i] + gamma * g; rets[i] = g; }
double baseline = rets.Average();
Console.WriteLine("returns:    " + string.Join(" ", rets.Select(v => v.ToString("F3"))));
Console.WriteLine("advantages: " + string.Join(" ", rets.Select(v => (v - baseline).ToString("F3"))) + $"   (baseline {baseline:F3})");

// 3. PPO clipped objective for one step: ratio = new probability / old probability
double Ppo(double ratio, double adv, double eps = 0.2) => Math.Min(ratio * adv, Math.Max(Math.Min(ratio, 1 + eps), 1 - eps) * adv);
foreach (var (ratio, adv) in new[] { (1.1, 2.0), (1.5, 2.0), (0.7, -2.0), (1.1, -2.0) })
    Console.WriteLine($"ratio {ratio:F1}  advantage {adv:+0.0;-0.0}  objective {Ppo(ratio, adv):+0.00;-0.00}");
```

## Maths behind it
- Probabilities from a softmax over preferences (probability)
- Discounted returns and averages (arithmetic)
- Ratio of new to old probability (algebra)
- Taking the smaller of two values to limit a change (arithmetic)

## Common mistakes
- Using raw returns without a baseline and getting very noisy learning.
- A learning rate or a PPO band so wide that the policy collapses after one lucky batch.
- Judging an agent from one episode. Average over many.
- A reward that can be gamed, so the agent scores without doing the task.
- Training only in simulation and trusting the result on a real machine without tests.

## Quick check
Q: What does a policy-gradient method learn directly?
A: The policy: the probability of each action in each state, improved by making rewarding actions more likely.

Q: Why subtract a baseline?
A: Raw returns can all be positive, so every action would be pushed up. The baseline leaves only the above-average actions pushed up and the others pushed down, which gives a cleaner, less noisy signal.

Q: What is an advantage?
A: How much better an action turned out than was usual from that state, often the return minus a value estimate.

Q: What does PPO's clip prevent?
A: A single update pushing the new policy far from the old one. It cuts off the extra reward for moving the probability ratio outside a narrow band.
