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
