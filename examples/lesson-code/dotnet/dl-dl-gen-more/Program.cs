// From lesson 'dl-gen-more' (dl). Code status: Python executed 2026-11-18 (examples/gen-more/gen_more.py, NumPy only); no generative model was trained and PyTorch was not run; the C# version prints the same output
// Reparameterisation, the VAE's KL term, a flow's change of variables and diffusion noising, from scratch.
// Same output as gen_more.py. No packages.
using System.Globalization;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// 1. Reparameterisation: sample z = mu + sigma * eps, so the sample depends smoothly on mu and sigma
double mu = 1.0, sigma = 0.5, eps = 0.8;                          // eps is the fixed random draw
Console.WriteLine($"reparameterised sample z = {mu + sigma * eps:F2}");

// 2. VAE regulariser: KL divergence of N(mu, sigma^2) from N(0, 1) in closed form
double Kl(double m, double s) => 0.5 * (m * m + s * s - 1 - Math.Log(s * s));
Console.WriteLine($"KL for (mu 0, sigma 1): {Kl(0, 1):F3}   for (mu 1, sigma 0.5): {Kl(1, 0.5):F3}   for (mu 3, sigma 0.2): {Kl(3, 0.2):F3}");

// 3. Normalising flow, one step: y = 2x + 1 stretches the line, so the density must shrink by the same factor
double Normal(double v) => Math.Exp(-0.5 * v * v) / Math.Sqrt(2 * Math.PI);
double x = 0.5, y = 2 * x + 1;
Console.WriteLine($"density of x at {x:F1}: {Normal(x):F4};  density of y at {y:F1}: {Normal(x) / 2:F4}  (divided by the stretch 2)");

// 4. Diffusion forward process: x_t = sqrt(abar_t) * x0 + sqrt(1 - abar_t) * eps
var abar = new double[1000]; double running = 1.0;
for (int i = 0; i < 1000; i++) { double beta = 0.0001 + i * (0.02 - 0.0001) / 999; running *= 1 - beta; abar[i] = running; }
double x0 = 2.0, e = -0.5;
Console.WriteLine(" step  abar    signal weight  noise weight  noisy value");
foreach (int t in new[] { 1, 100, 500, 1000 })
{
    double a = abar[t - 1];
    Console.WriteLine($"{t,5}  {a:F4}  {Math.Sqrt(a),13:F3}  {Math.Sqrt(1 - a),12:F3}  {Math.Sqrt(a) * x0 + Math.Sqrt(1 - a) * e,11:F3}");
}
