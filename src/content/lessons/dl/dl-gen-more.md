---
id: dl-gen-more
title: More generative models, VAEs, flows and diffusion in detail
module: dl
level: Advanced
minutes: 75
maths: algebra
goal: Explain the reparameterisation trick and the KL term in a VAE, the change-of-variables idea behind normalising flows and the forward noising step in a diffusion model, and place GAN training problems and modern image tools next to them.
prereqs: dl-generative
reviewed: 2026-11-18
evidence: A worked reparameterised sample, one KL value, a flow density after a stretch, and a diffusion noising step at one time step, each matching a program's output.
code: Python executed 2026-11-18 (examples/gen-more/gen_more.py, NumPy only); no generative model was trained and PyTorch was not run; the C# version prints the same output
---
## In plain words
The first generative lesson gave the broad picture. This one opens up four of its parts. A **VAE** (variational autoencoder) turns each input into a bell-shaped cloud of codes, not one code, and draws a sample from it. To train with that random draw, it uses the **reparameterisation trick**: write the sample as the cloud's centre plus its width times a fixed random number, so the gradient can flow through the centre and the width. A second term, the **KL divergence**, keeps every cloud near a standard bell curve so that new samples drawn later make sense. A **normalising flow** transforms a simple distribution through steps that can be undone, and because each step stretches space by a known amount, the exact probability of any data point can be computed. A **diffusion model** gradually adds noise to training images and learns to remove it step by step, which lets it generate new images starting from pure noise.

```diagram compare The reparameterisation trick
note: The random part is moved outside, so the gradient can reach the centre and the width.
## Without the trick | bad
- Sample directly from the cloud
- No gradient flows through a random draw
## With the trick | output
- Sample is centre plus width times fixed noise
- Gradient reaches the centre and the width
```

```diagram flow Diffusion, forward noising
note: A schedule decides how much noise is added at each step. At the end only noise is left.
- Start with a real image | Clean data | input
- Mix in a little noise at each step | Signal shrinks, noise grows | process
- After many steps only noise is left | Almost no trace of the image | output
```

```diagram compare Four families of generative model
note: They differ in how they turn training data into a way to create new data.
## VAE | process
- Encodes to clouds, decodes samples
- Smooth, but images can look blurry
## GAN | warn
- Generator against discriminator
- Sharp, but training can be unstable
## Flow | model
- Reversible steps with exact probabilities
- Needs special reversible layers
## Diffusion | output
- Learns to remove noise step by step
- Very good images, slower to generate
```

```diagram flow Why GANs can fail
note: Three common problems, and the usual remedies.
- Mode collapse | The generator makes only a few kinds of output | bad
- Unstable training | The two networks fail to balance | warn
- Fixes | Wasserstein loss, gradient penalty, careful learning rates | output
```

## Real-world example
A design studio wants new product images. A GAN gave sharp pictures, but the team found it produced a narrow range of shapes (mode collapse) and was hard to train reliably. A diffusion model, trained on the studio's own licensed images, takes longer per picture but gives varied results reliably. For quality checks, they sample a thousand images and compare their statistics with real ones, since no single picture shows whether the model is good. They also add a visible watermark and record how each image was made.

## How it works
1. **VAE.** The encoder gives a centre and a width for each input. Draw one fixed random number, form the sample as centre plus width times that number, and decode it. The loss is the reconstruction error plus the KL term that pulls each cloud towards a standard bell curve.
2. **Flow.** Apply a reversible function to the data. Because the function stretches space by a known factor, the density after the function equals the old density divided by the stretch.
3. **Diffusion.** Choose a schedule of small noise amounts. A noisy version of an image at any step is a mix: the image shrunk by a signal weight plus fixed random noise scaled by a noise weight. A network learns to predict the noise, and generation runs the process backwards.
4. **Other pieces.** **VQ-VAE** uses a finite list of codes instead of clouds. **DCGAN** is the standard convolutional GAN. **StyleGAN** controls style at each layer, **CycleGAN** translates images between two sets without paired examples, and **pix2pix** needs pairs. **ControlNet** and **inpainting** let diffusion models follow an outline or fill a hole. Audio, music and video models use the same ideas with sequences of audio or frame codes.

```maths A reparameterised sample
situation: A VAE encoder gives a cloud with centre 1.0 and width 0.5 for one input. The fixed random draw is 0.8.
find: What is the sample?
step: Centre plus width times the draw | 1.0 + 0.5 × 0.8 = 1.4
result: The sample is 1.4. Changing the centre or the width changes it smoothly, so training can adjust them.
why: This one line is the reason VAEs can be trained with ordinary gradient descent even though they sample.
try: With the same draw, what is the sample if the width shrinks to 0.1?
answer: 1.0 + 0.1 × 0.8 = 1.08. A narrow cloud gives samples close to the centre.
```

```maths The KL term for one cloud
situation: The target is a standard bell curve with centre 0 and width 1. One encoded cloud has centre 1 and width 0.5.
find: What is the KL divergence that the loss adds for this cloud?
step: Centre squared plus width squared minus 1 | 1^2 + 0.5^2 - 1 = 0.25
step: Minus the natural logarithm of the width squared | -ln(0.25) ≈ 1.386
step: Half the sum | 0.5 × (0.25 + 1.386) ≈ 0.818
result: The KL term is 0.818. A cloud with centre 0 and width 1 would give exactly 0.
formula: KL = 0.5 × (centre^2 + width^2 - 1 - ln(width^2))
why: The further a cloud strays from the standard bell curve, the bigger the penalty. For a cloud with centre 3 and width 0.2 the penalty is 5.629, which pushes it back.
try: What is the KL for centre 0 and width 1?
answer: 0^2 + 1^2 - 1 = 0 and ln(1) = 0, so KL = 0.5 × (0 - 0) = 0. That cloud is already the target.
```

```maths A flow stretches space, so the density shrinks
situation: The data is x with a standard bell-curve density. A flow step maps x to y = 2x + 1, which stretches space by a factor of 2. Take x = 0.5, so y = 2.
find: What is the density of y at 2.0?
step: Density of x at 0.5 (the bell curve) | exp(-0.125) ÷ 2.5066 ≈ 0.352
step: Divide by the stretch factor | 0.352 ÷ 2 = 0.176
result: The density of y at 2.0 is 0.176. Stretching spreads the same probability over twice the length, so the height halves.
why: This exact accounting is what lets flows give true probabilities, which GANs and VAEs cannot. The price is that every layer must be reversible and have an easy stretch factor.
```

```maths One diffusion noising step
situation: A single pixel value is x0 = 2.0. The noise draw is -0.5. At time step 500 of 1000, the schedule gives a remaining signal fraction of 0.0786.
find: What is the noisy value at step 500?
step: Signal weight, the square root of 0.0786 | sqrt(0.0786) ≈ 0.280
step: Noise weight, the square root of one minus 0.0786 | sqrt(1 - 0.0786) ≈ 0.960
step: Noisy value | 0.280 × 2 + 0.960 × (-0.5) = 0.08
result: At step 500 the value is 0.08. About a quarter of the signal weight remains and the noise weight is 0.960.
formula: noisy value = sqrt(abar) × x0 + sqrt(1 - abar) × noise
means: abar (the remaining signal fraction) starts near 1 and falls towards 0 as steps pass.
why: The formula jumps straight to any step without running the earlier ones, which makes training fast. The network is asked to guess the noise from the noisy value and the step number.
try: At step 1 the signal weight is 1.000 and the noise weight is 0.010. What is the noisy value?
answer: 1.000 × 2 + 0.010 × (-0.5) = 1.995. Almost no change, as expected at the start.
```

## Python example
Four short calculations with NumPy: the reparameterised sample, the KL term, a flow's density after a stretch, and the signal and noise weights across a 1000-step schedule. No generative model is trained here, and PyTorch was not installed.

```python gen_more.py
"""Four generative-model calculations from scratch: the reparameterisation trick, the VAE's KL term, a normalising
flow's change of variables, and the forward noising of a diffusion model.

Run:  python gen_more.py   (needs numpy)
"""
import math
import numpy as np

# 1. Reparameterisation: sample z = mu + sigma * eps, so the sample depends smoothly on mu and sigma
mu, sigma, eps = 1.0, 0.5, 0.8                             # eps is the fixed random draw
print("reparameterised sample z = %.2f" % (mu + sigma * eps))

# 2. VAE regulariser: KL divergence of N(mu, sigma^2) from N(0, 1) in closed form
def kl(mu, sigma):
    return 0.5 * (mu ** 2 + sigma ** 2 - 1 - math.log(sigma ** 2))
print("KL for (mu 0, sigma 1): %.3f   for (mu 1, sigma 0.5): %.3f   for (mu 3, sigma 0.2): %.3f" % (kl(0, 1), kl(1, 0.5), kl(3, 0.2)))

# 3. Normalising flow, one step: y = 2x + 1 stretches the line, so the density must shrink by the same factor
def normal(x):
    return math.exp(-0.5 * x * x) / math.sqrt(2 * math.pi)
x = 0.5
y = 2 * x + 1
print("density of x at %.1f: %.4f;  density of y at %.1f: %.4f  (divided by the stretch 2)" % (x, normal(x), y, normal(x) / 2))

# 4. Diffusion forward process: x_t = sqrt(abar_t) * x0 + sqrt(1 - abar_t) * eps
betas = np.linspace(0.0001, 0.02, 1000)
abar = np.cumprod(1 - betas)
x0, eps = 2.0, -0.5
print(" step  abar    signal weight  noise weight  noisy value")
for t in (1, 100, 500, 1000):
    a = abar[t - 1]
    print("%5d  %.4f  %13.3f  %12.3f  %11.3f" % (t, a, math.sqrt(a), math.sqrt(1 - a), math.sqrt(a) * x0 + math.sqrt(1 - a) * eps))
```
```text Output of gen_more.py (executed)
reparameterised sample z = 1.40
KL for (mu 0, sigma 1): 0.000   for (mu 1, sigma 0.5): 0.818   for (mu 3, sigma 0.2): 5.629
density of x at 0.5: 0.3521;  density of y at 2.0: 0.1760  (divided by the stretch 2)
 step  abar    signal weight  noise weight  noisy value
    1  0.9999          1.000         0.010        1.995
  100  0.8970          0.947         0.321        1.734
  500  0.0786          0.280         0.960        0.081
 1000  0.0000          0.006         1.000       -0.487
```
The sample is 1.40, and the KL is 0.000 for a standard cloud, 0.818 for centre 1 and width 0.5, and 5.629 for centre 3 and width 0.2. The density of y at 2.0 is half that of x at 0.5. In the schedule, step 1 is almost all signal, step 500 is about a quarter signal weight, and step 1000 has a signal weight of 0.006, so the value at step 1000 is almost pure noise.

## .NET (C#) example
The same four calculations from scratch in C#, with no packages, printing the same output. Training generative models is done in Python. In C#, you load a trained model and run it through ONNX Runtime.

```cs Program.cs
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
```

## Maths behind it
- Mean, standard deviation and the bell curve (probability)
- KL divergence between two bell curves (information theory)
- Change of variables: density divided by the stretch (calculus)
- Square roots and products across a noise schedule (arithmetic)

## Common mistakes
- Sampling without the reparameterisation trick and getting no gradient.
- Setting the KL weight so high that every cloud collapses to the standard curve and the output is blurry.
- Judging a generator by a few pretty samples. Use many samples and statistics.
- Using a diffusion model on data you have no right to use.
- Releasing generated images without a way to tell they are generated.

## Quick check
Q: What does the reparameterisation trick change?
A: It writes the random sample as the cloud's centre plus its width times a fixed random draw, so the gradient can pass through the centre and the width.

Q: What does the KL term in a VAE do?
A: It penalises each cloud for straying from a standard bell curve, which keeps the code space tidy so that new samples decode into sensible outputs.

Q: A flow step stretches space by a factor of 4. What happens to the density?
A: It is divided by 4, because the same probability is spread over a length four times as long.

Q: At the last step of a diffusion schedule the signal weight is almost zero. What is left?
A: Almost pure noise. Generation runs the process backwards from pure noise to an image.
