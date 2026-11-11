// From lesson 'dl-rl' (dl). Code status: Python executed 2026-11-02 (ai_extras.py qlearn, gap_topics.py pg); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
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
