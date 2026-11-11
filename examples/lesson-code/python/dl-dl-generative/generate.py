# From lesson 'dl-generative' (dl). Code status: Python executed 2026-11-02 (ai_extras.py diffusion); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
from diffusers import DiffusionPipeline
pipe = DiffusionPipeline.from_pretrained("<an image model you are licensed to use>").to("cuda")
image = pipe("a ceramic mug on a wooden table, soft morning light").images[0]
image.save("mug.png")
