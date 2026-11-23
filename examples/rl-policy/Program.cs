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
