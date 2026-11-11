// From lesson 'dl-generative' (dl). Code status: Python executed 2026-11-02 (ai_extras.py diffusion); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
const int T = 1000;
var alphaBar = new double[T];
double running = 1.0;
for (int t = 0; t < T; t++)
{
    double beta = 1e-4 + (0.02 - 1e-4) * t / (T - 1);     // noise added at step t
    running *= 1 - beta;
    alphaBar[t] = running;                                 // share of the original signal left
}
foreach (int step in new[] { 1, 100, 500, 1000 })
    Console.WriteLine($"step {step,4}: signal {Math.Sqrt(alphaBar[step - 1]):F3}, noise {Math.Sqrt(1 - alphaBar[step - 1]):F3}");
