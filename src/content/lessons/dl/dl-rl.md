---
id: dl-rl
title: Reinforcement learning
module: dl
level: Advanced
minutes: 75
goal: Explain agents, actions, rewards and policies, implement Q-learning and a policy-gradient agent, and connect reinforcement learning to how chat models are tuned.
prereqs: ml-learning
reviewed: 2026-11-02
evidence: A Q-learning or policy-gradient agent for a small problem you design, with its learned policy explained and averaged over several seeds.
code: Python executed 2026-11-02 (ai_extras.py qlearn, gap_topics.py pg); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment); added technique snippets (2026-11-05) not run
---
## In plain words
In **reinforcement learning (RL)** an **agent** learns by trial and error. It sees a **state**, takes an **action**, gets a **reward** (good or bad), and lands in a new state. Its goal is the most total reward over time, where sooner rewards usually count more (a **discount**). **Q-learning** keeps a score for every action in every state and updates it after each try. **Policy-gradient** methods learn the probabilities of actions directly and make rewarded actions more likely; **PPO** is a stable, widely used version. The agent must balance **exploration** (trying new things) and **exploitation** (using what works). RL powers game-playing systems and robotics, and **RLHF** (reinforcement learning from human feedback) and related methods tune chat models towards answers people prefer.

```diagram loop The agent and environment loop
- Agent sees a state | Where things stand now | input
- Agent takes an action | Chosen from what it has learned, or at random | process
- Environment gives a reward | Good or bad | output
- New state | The agent updates what it knows | model
loop: Repeat to get the most total reward over time
```

```diagram compare Q-learning and policy gradient
## Q-learning | model
- Keeps a score for every action in every state
- Updates the score after each try
## Policy gradient | process
- Learns the probabilities of actions directly
- Makes rewarded actions more likely | PPO is a stable, widely used version
```

```diagram compare Exploration and exploitation
## Exploration | process
- Trying new things | May find something better
## Exploitation | model
- Using what works | Takes the best known action
```

## Real-world example
A news site must choose which of three page layouts to show. A simple RL agent (a "bandit") shows layouts, learns from clicks which works best, keeps trying alternatives occasionally, and adapts if readers' tastes change. The [Google DeepMind case](case:deepmind-cooling) shows a related use of learned models to recommend cooling settings under safety limits.

## How it works
1. Define states, actions, rewards and when an episode ends.
2. Start with no knowledge (all scores zero or equal probabilities).
3. Repeat: choose an action (sometimes at random), observe the reward and new state, update.
4. Reduce random exploration over time.
5. In the real world, add hard safety limits and human oversight.

```diagram flow Building a reinforcement learning agent
- Define the problem | States, actions, rewards, end of an episode | input
- Start with no knowledge | Scores zero or equal probabilities | process
- Act, observe, update | Sometimes choose at random | model
- Reduce exploration | Less random as it learns | process
- Add safety | Hard limits and human oversight | warn
```

### Related concepts
- **Epsilon-greedy choice**: a simple rule for balancing exploring and using what works. Everyday example: you usually go to your favourite lunch place, but one day in ten you try a new one, in case it is better. Here epsilon (the share of random tries) is 0.1: with chance 0.9 pick the best-known action, with chance 0.1 pick any action at random. The maths panel below shows the chances. The **Q-table** is the table of scores that Q-learning updates, one row per state and one column per action; the full corridor code in both languages is in the examples below.

```diagram flow Epsilon-greedy choice
- Draw a random number between 0 and 1 | Like rolling a fair ten-sided die | input
- Is it below epsilon? | Epsilon is the share of random tries, for example 0.1 | process
- If yes, explore | Pick any action at random | model
- If no, exploit | Pick the action with the highest score | output
```

```diagram layers Where RL is used
- Bandit | Choose among page layouts and learn from clicks | process
- Games and robotics | Learn by trial and error | model
- RLHF | Tunes chat models towards answers people prefer | output
```

## Python example
Q-learning in a corridor of five cells (reward +1 at the end):
```text Output of ai_extras.py qlearn (executed)
Q-values (left, right) per cell: [[0.656, 0.729], [0.656, 0.81], [0.729, 0.9], [0.81, 1.0]]
learned policy: ['right', 'right', 'right', 'right']
```
A policy-gradient agent choosing between three layouts with real click rates 0.2, 0.5 and 0.8:
```text Output of gap_topics.py pg (executed)
step    1: policy [0.333, 0.333, 0.333]  average reward 0.010
step  500: policy [0.021, 0.039, 0.94]  average reward 0.780
step 3000: policy [0.002, 0.005, 0.993]  average reward 0.865
```
It starts with no preference and learns to choose the best layout 99.3% of the time.
```python Q-learning update (excerpt)
Q[s, a] += alpha * (r + gamma * Q[s2].max() * (s2 != 4) - Q[s, a])
```

### More techniques in Python: epsilon-greedy choice
Q-learning already has code in both languages above; this adds the choice rule on its own for the three-layout news site (not run):
```python epsilon_greedy.py (not run here)
import random

def choose(avg_reward, epsilon=0.1):
    if random.random() < epsilon:                  # explore: any layout at random
        return random.randrange(len(avg_reward))
    return avg_reward.index(max(avg_reward))       # exploit: the best layout so far

avg_reward = [0.15, 0.18, 0.10]                    # average clicks per view for layouts A, B, C
print(choose(avg_reward))                          # usually 1 (layout B)
```

## .NET (C#) example
The same Q-learning corridor in plain C#:
```cs Program.cs
var rng = new Random(3);
var Q = new double[5, 2];                   // 5 cells x (left, right)
double alpha = 0.5, gamma = 0.9, epsilon = 0.2;
for (int episode = 0; episode < 200; episode++)
{
    int s = 0;
    while (s != 4)
    {
        int a = rng.NextDouble() < epsilon ? rng.Next(2) : (Q[s, 1] >= Q[s, 0] ? 1 : 0);   // explore or exploit
        int next = a == 0 ? Math.Max(0, s - 1) : s + 1;
        double reward = next == 4 ? 1.0 : 0.0;
        double future = next == 4 ? 0 : Math.Max(Q[next, 0], Q[next, 1]);
        Q[s, a] += alpha * (reward + gamma * future - Q[s, a]);
        s = next;
    }
}
for (int s = 0; s < 4; s++) Console.WriteLine($"cell {s}: left {Q[s, 0]:F3} right {Q[s, 1]:F3}");
```

### More techniques in C#: epsilon-greedy choice
The same choice rule on its own for the three-layout news site (not compiled here):
```cs EpsilonGreedy.cs (not compiled here)
using System;
using System.Linq;

var rng = new Random();
double[] avgReward = { 0.15, 0.18, 0.10 };         // average clicks per view for layouts A, B, C
double epsilon = 0.1;

int Choose() =>
    rng.NextDouble() < epsilon
        ? rng.Next(avgReward.Length)                // explore: any layout at random
        : Array.IndexOf(avgReward, avgReward.Max()); // exploit: the best layout so far

Console.WriteLine(Choose());                        // usually 1 (layout B)
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Q-learning update (learning the value of an action)
**Where it is used:** Q-learning updates its estimate of how good an action is after each reward.

```formula Q-value update
new Q = old Q + α × (r + γ × best next Q - old Q)
```
α (alpha) is the learning rate, r is the reward, γ (gamma) is the discount for future rewards (0 to 1), and best next Q is the highest value available from the next state.

**In plain words:** nudge the old estimate toward what you just saw: the reward plus the discounted best future value.

**Example 1: normal step.** Old Q = 0.5, α = 0.1, r = 1, γ = 0.9, best next Q = 0.8. Target = 1 + 0.9 × 0.8 = 1.72. Difference = 1.72 - 0.5 = 1.22. New Q = 0.5 + 0.1 × 1.22 = 0.622.

**Example 2: final step with no reward.** Old Q = 0.5, r = 0 and the episode ends (no next value). Target = 0. Difference = -0.5. New Q = 0.5 + 0.1 × (-0.5) = 0.45. The estimate goes down.

### Average reward and epsilon-greedy (the news-site bandit)
**Where it is used:** the page-layout agent estimates each layout's click rate and sometimes tries another layout.

```formula Average reward and epsilon-greedy
average reward = clicks ÷ times shown
chance of the best layout = (1 - ε) + ε ÷ K
chance of each other layout = ε ÷ K
```
ε (epsilon) is the share of time spent exploring at random, and K is the number of layouts.

**In plain words:** pick the best-looking layout most of the time, and explore the rest of the time.

**Example 1: estimating.** Layout A got 30 clicks in 200 views: 30 ÷ 200 = 0.15. Layout B got 18 clicks in 100 views: 18 ÷ 100 = 0.18. B looks better so far.

**Example 2: exploring.** With ε = 0.1 and K = 3, B is chosen with chance 0.9 + 0.1 ÷ 3 ≈ 0.933. Each other layout gets 0.1 ÷ 3 ≈ 0.033. The three chances add up to 0.933 + 0.033 + 0.033 = 1.

## Maths behind it
- Markov decision processes
- Bellman equation and value functions
- Discount factor
- Policy gradients and the REINFORCE estimator
- Proximal policy optimisation (PPO)

## Common mistakes
- Reward functions that can be "gamed": the agent finds a shortcut you did not intend.
- Letting an agent explore freely on real equipment or real customers without safety limits.
- Using RL when a simple supervised model would solve the problem.

```diagram compare Reward and risk
## Gameable reward | bad
- Agent finds an unintended shortcut
## Free exploration on real systems | warn
- Needs safety limits on equipment and customers
```

## Quick check
Q: What does an RL agent try to maximise?
A: Total (usually discounted) reward over time.

Q: Why does the agent sometimes act randomly?
A: To explore: without trying new actions it may never find better ones.

Q: How is RL used with chat models?
A: To tune models towards responses that people (or checks) prefer, after supervised fine-tuning.
