# From lesson 'dl-gen-more' (dl). Code status: Python executed 2026-11-18 (examples/gen-more/gen_more.py, NumPy only); no generative model was trained and PyTorch was not run; the C# version prints the same output
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
