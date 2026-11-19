// From lesson 'ml-bayes' (ml). Code status: Python executed 2026-11-19 (examples/bayes/bayes.py, standard library only); the C# version prints the same output
// A tiny Bayesian network by enumeration, a Metropolis sampler and a Kalman filter, from scratch.
// Same output as bayes.py. No packages.
double pRain = 0.2;
var pSpr = new Dictionary<bool, double> { [true] = 0.01, [false] = 0.4 };                       // sprinkler on, given rain / no rain
var pWet = new Dictionary<(bool, bool), double> { [(true, true)] = 0.99, [(true, false)] = 0.8, [(false, true)] = 0.9, [(false, false)] = 0.0 };
double pW = 0, pRainAndWet = 0;
foreach (bool rain in new[] { true, false })
    foreach (bool spr in new[] { true, false })
    {
        double pr = (rain ? pRain : 1 - pRain) * (spr ? pSpr[rain] : 1 - pSpr[rain]) * pWet[(rain, spr)];
        pW += pr; if (rain) pRainAndWet += pr;
    }
Console.WriteLine($"chance the grass is wet: {pW:F4}   chance of rain given wet grass: {pRainAndWet / pW:F4}");

// Metropolis sampler for a coin's chance of heads after 7 heads in 10 flips, starting from a flat prior
long state = 2024;
double Rnd() { state = (1103515245L * state + 12345) % (1L << 31); return state / (double)(1L << 31); }
double Like(double p) => Math.Pow(p, 7) * Math.Pow(1 - p, 3);
double pc = 0.5; var samples = new List<double>();
for (int step = 0; step < 20000; step++)
{
    double q = pc + (Rnd() - 0.5) * 0.3;                                                       // propose a nearby value
    if (q > 0 && q < 1 && Rnd() < Like(q) / Like(pc)) pc = q;                                   // accept if likelier, or sometimes if less likely
    if (step >= 2000) samples.Add(pc);
}
double mean = samples.Average();
double sd = Math.Sqrt(samples.Sum(s => (s - mean) * (s - mean)) / samples.Count);
Console.WriteLine($"MCMC posterior mean {mean:F3}, spread {sd:F3}   (exact answer: mean 0.667, spread 0.131)");

// Kalman filter for one unknown number, measured five times with noise of variance 1
double est = 0.0, variance = 100.0;                                                             // a vague starting guess
Console.WriteLine("measurement  estimate  uncertainty (variance)");
foreach (double m in new[] { 5.1, 4.8, 5.3, 4.9, 5.0 })
{
    double gain = variance / (variance + 1.0);                                                  // how much to trust the new measurement
    est += gain * (m - est); variance = (1 - gain) * variance;
    Console.WriteLine($"{m,11:F1}  {est,8:F3}  {variance,12:F3}");
}
