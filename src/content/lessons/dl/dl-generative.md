---
id: dl-generative
title: Generative models: autoencoders, GANs and diffusion
module: dl
level: Advanced
minutes: 75
goal: Explain how autoencoders, variational autoencoders, GANs and diffusion models create new data, and when industry uses each.
prereqs: dl-vision
reviewed: 2026-11-02
evidence: A one-page comparison of four generative model families with one business use for each, plus the noise-schedule demo run and explained.
code: Python executed 2026-11-02 (ai_extras.py diffusion); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
---
## In plain words
**Generative models** learn what real data looks like so they can make new examples. An **autoencoder** squeezes data into a small code and rebuilds it; it is useful for compression and for **anomaly detection** (things it rebuilds badly are unusual). A **variational autoencoder (VAE)** makes that code smooth, so you can sample new codes and create new data. A **GAN** (generative adversarial network) trains two networks against each other: a **generator** makes fakes and a **discriminator** tries to spot them, until the fakes look real. **Diffusion models**, behind most modern image generators, learn to remove noise: during training they gradually add noise to images, and the model learns to undo each small step; to generate, they start from pure noise and clean it up step by step, often guided by a text prompt. **LLMs** are generative models for text that produce one token at a time.

```diagram flow Autoencoder
note: Things it rebuilds badly are unusual, which is how it detects anomalies.
- Data | The original example | input
- Encoder | Squeezes the data | process
- Small code | A compact summary | store
- Decoder | Rebuilds the data | process
- Rebuilt data | Compared with the original | output
```

```diagram compare Autoencoder and variational autoencoder
## Autoencoder | process
- Compress and rebuild | Useful for compression and anomaly detection
## Variational autoencoder | model
- Smooth code | You can sample new codes
- Creates new data
```

```diagram loop GAN: generator against discriminator
- Generator makes fakes | Tries to look real | model
- Discriminator tries to spot them | Compares fakes with real data | process
- Both networks improve | Each one pushes the other | output
loop: Repeat until the fakes look real
```

```diagram lanes Diffusion: training and generating
## Training
- Add noise to images step by step | input
- Learn to undo each small step | model
## Generating
- Start from pure noise | input
- Clean it up step by step | process
- Often guided by a text prompt | output
```

## Real-world example
A retailer creates lifestyle backgrounds for product photos with a diffusion model, saving photo shoots. A person reviews every image, the team checks the model's licence and the training-data rights, and generated images are labelled according to company policy.

## How it works
1. Choose the family: autoencoder (compress, detect anomalies), VAE (smooth generation), GAN (fast, sharp, harder to train), diffusion (high quality, slower), autoregressive (text, code, audio).
2. Train on data you have rights to use.
3. Generate: decode from a code, run the generator, or denoise from noise.
4. Evaluate quality, variety and safety; keep a human in the loop for public content.

```diagram compare Which family to choose
## Autoencoder | process
- Compress, detect anomalies
## VAE | model
- Smooth generation
## GAN | warn
- Fast and sharp, harder to train
## Diffusion | output
- High quality, slower
```

```diagram bar Signal and noise as diffusion noise grows
note: Illustrative proportions only; the real values are in the executed output below.
- Signal | 50 | input
- Noise | 50 | bad
```

## Python example
How a diffusion model's training noise grows over 1,000 steps (a linear schedule):
```text Output of ai_extras.py diffusion (executed)
step    1: signal weight sqrt(ab)=1.000, noise weight sqrt(1-ab)=0.010
step  100: signal weight sqrt(ab)=0.947, noise weight sqrt(1-ab)=0.321
step  500: signal weight sqrt(ab)=0.280, noise weight sqrt(1-ab)=0.960
step 1000: signal weight sqrt(ab)=0.006, noise weight sqrt(1-ab)=1.000
```
By step 1,000 almost nothing of the image remains; the model learns to reverse each step. Using a pretrained image generator (requires `diffusers` and a GPU in practice):
```python generate.py
from diffusers import DiffusionPipeline
pipe = DiffusionPipeline.from_pretrained("<an image model you are licensed to use>").to("cuda")
image = pipe("a ceramic mug on a wooden table, soft morning light").images[0]
image.save("mug.png")
```

## .NET (C#) example
The same noise schedule in plain C#, so you can see the idea without any library:
```cs Program.cs
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
```
In .NET applications, image generation is usually called through a hosted service API or an exported model run with ONNX Runtime.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Reconstruction error (how well did the autoencoder copy its input?)
**Where it is used:** an autoencoder is trained to rebuild its input, and the error also flags unusual items.

```formula Mean squared error
error = ((x1 - r1)^2 + (x2 - r2)^2 + ... + (xn - rn)^2) ÷ n
```
x is the original, r is the rebuilt version, n is the number of values.

**In plain words:** square each difference so it is positive, then take the average. Zero means a perfect copy.

**Example 1: close copy.** Original (1, 2, 3), rebuilt (1.5, 2, 2.5). Differences: -0.5, 0, 0.5. Squares: 0.25, 0, 0.25. Sum = 0.5, error = 0.5 ÷ 3 ≈ 0.17.

**Example 2: perfect copy.** Rebuilt (1, 2, 3) gives all differences 0, so error = 0.

### Adding noise in diffusion (the forward step)
**Where it is used:** a diffusion model is trained by adding noise to images and learning to remove it.

```formula Noisy value
noisy x = sqrt(a) × x0 + sqrt(1 - a) × noise
```
x0 is the clean value, noise is a random value, and a is between 0 and 1: near 1 means little noise, near 0 means mostly noise.

**In plain words:** blend the clean value with random noise. The smaller a is, the more the noise wins.

**Example 1: light noise.** a = 0.81, x0 = 2, noise = 1. sqrt(0.81) = 0.9 and sqrt(0.19) ≈ 0.436. Noisy x = 0.9 × 2 + 0.436 × 1 ≈ 2.24.

**Example 2: heavy noise.** a = 0.25, same x0 and noise. sqrt(0.25) = 0.5 and sqrt(0.75) ≈ 0.866. Noisy x = 0.5 × 2 + 0.866 × 1 ≈ 1.87. The clean part is halved.

## Maths behind it
- Probability distributions and sampling
- KL divergence (variational autoencoders)
- Minimax games (GANs)
- Gaussian noise and Markov chains (diffusion)
- Score matching

## Common mistakes
- Training or generating with images you do not have rights to use.
- Using a generator for tasks that need exact facts (product dimensions, labels).
- Publishing generated content without human review or disclosure where policy requires it.

```diagram flow Safe use of a generator
- Rights to the data | Train and generate only with images you may use | store
- Generate | Not for exact facts such as dimensions or labels | process
- Human review | A person checks every public image | warn
- Disclose | Label generated content where policy requires | output
```

## Quick check
Q: How does a GAN learn?
A: A generator makes fakes and a discriminator tries to spot them; each improves by competing with the other.

Q: What does a diffusion model learn during training?
A: To predict and remove the noise added at each step, so it can turn noise back into an image.

Q: How can an autoencoder detect anomalies?
A: It rebuilds normal data well; inputs it rebuilds badly are unusual.
