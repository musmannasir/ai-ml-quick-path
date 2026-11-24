---
id: dl-rl-value
title: Reinforcement learning: value methods
module: dl
level: Advanced
minutes: 75
maths: algebra
goal: Estimate how good each state is from experience with Monte Carlo and temporal-difference learning, learn the value of each action with Q-learning and SARSA, and explain how a deep Q-network replaces the table with a neural network.
prereqs: dl-rl
reviewed: 2026-11-18
updated: 2026-11-24
evidence: A table of state values on a small corridor from two methods that agree, and a comparison of the Q-learning and SARSA values after the same number of episodes, with a sentence saying why they differ.
code: Python executed 2026-11-18 (examples/rl-value/rl_value.py, standard library only); PyTorch was not installed, so no deep Q-network was run; the C# version prints the same output
---
## In plain words
A reinforcement-learning agent acts, gets rewards and wants the largest total over time. A **value** says how much total reward to expect from here on. If the agent knows the value of every state, or of every action in every state, it can simply choose well. **Monte Carlo** learning plays a whole episode, then looks back and averages the rewards that followed each state. **Temporal-difference (TD) learning** updates after every step: it nudges its estimate towards the reward just received plus its current estimate of the next state. That lets it learn before an episode ends. **Q-learning** and **SARSA** apply the same idea to the value of each action, called Q. They differ in one thing: Q-learning looks at the best action in the next state, SARSA looks at the action the agent actually takes. When the problem has too many states for a table, a **deep Q-network (DQN)** uses a neural network to estimate Q.

```diagram compare Monte Carlo and temporal-difference learning
note: Both estimate value from experience. They differ in when they learn.
## Monte Carlo | process
- Waits until the episode ends
- Uses the real total reward that followed
## Temporal difference | model
- Updates after every step
- Uses reward plus its estimate of the next state
```

```diagram loop One Q-learning step
note: The table of action values slowly fills in with what the agent learns.
- Look at the state and pick an action | Mostly the best, sometimes a random one | input
- Act and see the reward and the next state | What the world does | process
- Compare what happened with what was expected | The TD error | model
- Nudge the action value towards the estimate | Small step, set by a learning rate | output
loop: Repeat for every step of every episode
```

```visual A Q-table and one learning step
file: q-table
alt: A table of three states by four actions, with made-up values. One cell is highlighted. A box shows one learning step: old value 0.40, estimate 0.80, learning rate 0.1, so the new value is 0.40 plus 0.1 times 0.40, which is 0.44.
caption: The agent nudges one table entry a small step towards what it just saw, so the table slowly fills in. The values are made up.
```

```diagram compare Q-learning and SARSA
note: Same update rule. A different choice of what comes next.
## Q-learning | output
- Looks at the best action in the next state
- Learns the value of playing well
## SARSA | warn
- Looks at the action it really takes next
- Learns the value of its own exploring
```

```diagram flow From a table to a network
note: A network can estimate Q for states it has never visited, but training can become unstable.
- Too many states to store in a table | Images, positions, sensor readings | warn
- Use a network that maps a state to action values | The deep Q-network | model
- Train with replayed steps and a slow copy | Replay buffer and target network | process
```

## Real-world example
A warehouse robot has to learn the quickest way along a corridor to a charging dock. Its state is its position and its actions are left and right. It gets no reward until it reaches the dock. At first it wanders, but after enough trips the values of the states near the dock rise, then the values further away, as the reward passes back one step at a time. The engineers run Q-learning in a simulator first, because a wrong move costs time and the robot needs thousands of trips. They watch for the case where the learned route differs from the safe route they wanted.

## How it works
1. **Discounting.** A reward later is worth a little less than a reward now. Multiply by a discount, such as 0.9, for each step of delay.
2. **Monte Carlo.** After an episode, the value of a state is the discounted rewards that followed it. Average over many episodes.
3. **TD.** After each step, the new estimate of a state's value is the old estimate plus a small step towards (reward + discount × next state's value). The gap is the **TD error**.
4. **Q-learning and SARSA.** The same update, applied to action values. Q-learning uses the best next action, SARSA uses the next action taken.
5. **Exploration.** With a small chance the agent tries a random action, so it can find better routes.

```maths Discounted values on a corridor
situation: A corridor of five states, 0 to 4. The agent always moves right. The reward of 1 arrives on the step from state 3 into state 4. The discount is 0.9. Made-up numbers.
find: What is the value of states 3, 2, 1 and 0?
step: State 3, the reward comes on its very next step | 1 × 1 = 1
step: State 2, one more step of delay | 0.9 × 1 = 0.9
step: State 1 | 0.9 × 0.9 = 0.81
step: State 0 | 0.9 × 0.81 = 0.729
result: The values grow towards the goal: 0.729, 0.81, 0.9 and 1. These are the values a Monte Carlo average converges to, and the program below prints the same numbers.
why: Discounting makes nearer rewards count more, so the agent prefers shorter routes and the sums stay finite.
try: If the corridor had one more state at the start, what would that new first state be worth?
answer: 0.9 × 0.729 = 0.6561. Each extra step of distance multiplies the value by 0.9.
```

```maths A temporal-difference update
situation: State 3 is next to the goal. Its value starts at 0. The reward on the next step is 1, the value of the goal state is 0, the discount is 0.9 and the learning rate is 0.5.
find: What is the value of state 3 after one update, and after a second?
step: First update (old plus rate times the TD error) | 0 + 0.5 × (1 + 0.9 × 0 - 0) = 0.5
step: The TD error the second time | 1 + 0.9 × 0 - 0.5 = 0.5
step: Second update | 0.5 + 0.5 × (1 + 0.9 × 0 - 0.5) = 0.75
result: The value moves from 0 to 0.5 to 0.75, closing half of the remaining gap each time, and heads towards 1.
formula: V(state) becomes V(state) + rate × (reward + discount × V(next state) - V(state))
means: The part in brackets is the TD error: what happened minus what was expected.
why: This is the engine of most value-based learning. Learning can start before an episode ends.
try: With a rate of 1, how many updates does it take to reach the target value of 1?
answer: One. 0 + 1 × (1 + 0 - 0) = 1. A rate of 1 jumps all the way, but it also trusts every noisy sample completely.
```

```maths Why Q-learning and SARSA differ
situation: The agent moves to a state where it has estimated the value of left as 0.3 and of right as 0.8. This time its exploring choice happens to be left. The reward just received is 0 and the discount is 0.9.
find: What target does each method update towards?
step: Q-learning target, using the best next action (right) | 0 + 0.9 × 0.8 = 0.72
step: SARSA target, using the action actually taken (left) | 0 + 0.9 × 0.3 = 0.27
result: Q-learning updates towards 0.72 and SARSA towards 0.27.
why: Because SARSA counts the agent's own exploration, its values are lower where exploring is costly. Q-learning learns the value of the best policy even while it explores, which is why it is called off-policy.
```

## Python example
A five-state corridor with the reward on reaching the last state. First the policy "always right" is evaluated two ways, with exact returns and with TD updates. Then Q-learning and SARSA each learn for 200 episodes, with a small random generator so the numbers repeat.

```python rl_value.py
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
```
```text Output of rl_value.py (executed)
Monte Carlo return from states 0, 1, 2, 3: 0.729 0.810 0.900 1.000
TD(0) estimates after 30 episodes:        0.729 0.810 0.900 1.000
Q-learning value of 'right' in states 0 to 3: 0.729 0.810 0.900 1.000   best action in each: RRRR
SARSA      value of 'right' in states 0 to 3: 0.639 0.782 0.889 1.000   best action in each: RRRR
```
Monte Carlo and TD agree: 0.729, 0.810, 0.900 and 1.000 for states 0 to 3. Q-learning finds the same values for the action "right", and the best action everywhere is right. SARSA finds lower values (0.639 for state 0 against 0.729) because it includes its own random moves, though it also learns to go right everywhere.

More ideas, named. The **deadly triad** is the combination of function approximation (a network), bootstrapping (TD) and off-policy learning, which can make training diverge. **Double DQN** fixes the habit of Q-learning to over-estimate values. **Prioritised replay** replays the surprising steps more often. **Rainbow** combines several of these upgrades. **Eligibility traces**, or TD(lambda), spread each TD error back over recent states so the reward travels faster. A deep Q-network was not run here because PyTorch was not installed.

## .NET (C#) example
The same corridor in C#, from scratch, with no packages, printing the same output. For deep reinforcement learning you would train in Python (for example with Stable-Baselines3) and run the trained network from .NET through ONNX Runtime.

```cs Program.cs
// Value methods on a five-state corridor, from scratch. Same output as rl_value.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
double gamma = 0.9;

// 1. Evaluate the policy "always move right": exact returns, then TD(0) from the same walk
var returns = Enumerable.Range(0, 4).Select(s => Math.Pow(gamma, 3 - s)).ToArray();
Console.WriteLine("Monte Carlo return from states 0, 1, 2, 3: " + string.Join(" ", returns.Select(g => g.ToString("F3"))));
var V = new double[5];
for (int episode = 0; episode < 30; episode++)
    for (int s = 0; s < 4; s++)
    {
        double r = s == 3 ? 1.0 : 0.0;
        V[s] += 0.5 * (r + gamma * V[s + 1] - V[s]);              // TD(0): V(s) += alpha * (r + gamma V(s') - V(s))
    }
Console.WriteLine("TD(0) estimates after 30 episodes:        " + string.Join(" ", V.Take(4).Select(v => v.ToString("F3"))));

// 2. Q-learning and SARSA with epsilon-greedy exploration (actions: 0 = left, 1 = right)
double[][] Run(bool onPolicy)
{
    long state = 7;
    double Next() { state = (1103515245L * state + 12345) % (1L << 31); return state / (double)(1L << 31); }
    var Q = Enumerable.Range(0, 5).Select(_ => new double[2]).ToArray();
    int Act(int s)
    {
        if (Next() < 0.3) return Next() < 0.5 ? 0 : 1;
        return Q[s][1] >= Q[s][0] ? 1 : 0;
    }
    for (int episode = 0; episode < 200; episode++)
    {
        int s = 0, a = Act(0);
        for (int step = 0; step < 30; step++)
        {
            int s2 = a == 0 ? Math.Max(0, s - 1) : Math.Min(4, s + 1);
            double r = s2 == 4 ? 1.0 : 0.0;
            int a2 = Act(s2);
            double nxt = s2 == 4 ? 0.0 : (onPolicy ? Q[s2][a2] : Math.Max(Q[s2][0], Q[s2][1]));
            Q[s][a] += 0.2 * (r + gamma * nxt - Q[s][a]);
            if (s2 == 4) break;
            s = s2; a = a2;
        }
    }
    return Q;
}
foreach (var (name, flag) in new[] { ("Q-learning", false), ("SARSA", true) })
{
    var Q = Run(flag);
    string values = string.Join(" ", Enumerable.Range(0, 4).Select(s => Q[s][1].ToString("F3")));
    string best = string.Concat(Enumerable.Range(0, 4).Select(s => Q[s][1] >= Q[s][0] ? "R" : "L"));
    Console.WriteLine($"{name,-10} value of 'right' in states 0 to 3: {values}   best action in each: {best}");
}
```

## Maths behind it
- Discounted sums: geometric series (algebra)
- Moving an estimate towards a target by a small step (arithmetic)
- Averages of sampled returns (statistics)
- Maximum over actions (arithmetic)

## Common mistakes
- A learning rate too high, so the estimates jump on noise, or too low, so learning is slow.
- Never exploring, so the agent never finds a better route.
- Comparing Q-learning and SARSA values as if they measured the same thing.
- Training a network on consecutive steps without a replay buffer, which makes the data too similar.
- Designing a reward that the agent can satisfy without doing what you meant.

## Quick check
Q: What is the main difference between Monte Carlo and TD learning?
A: Monte Carlo waits for the end of the episode and uses the real total reward. TD updates after each step, using the reward plus its own estimate of the next state.

Q: What is a TD error?
A: The gap between what happened (reward plus the discounted value of the next state) and what was expected (the current value).

Q: Why are SARSA's values lower than Q-learning's in the example?
A: SARSA's update includes the agent's own random exploratory moves, which are sometimes poor. Q-learning always assumes the best next action.

Q: What problem does a replay buffer solve in a DQN?
A: Consecutive steps are very similar, which destabilises training. Sampling past steps at random breaks that similarity.
