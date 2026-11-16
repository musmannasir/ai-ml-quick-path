# From lesson 'dl-vision' (dl). Code status: Python NumPy demos executed 2026-11-02 (ai_extras.py conv, gap_topics.py vision); PyTorch not run (not installed in the build environment); added technique snippets (2026-11-05) not run
import numpy as np

backbone = 1_000_000                       # pretrained weights (made-up size)
new_layer = 512 * 3 + 3                    # new final layer: 512 inputs x 3 classes + 3 biases
print("trainable before freezing:", backbone + new_layer)
print("trainable after freezing: ", new_layer)   # the backbone is frozen

image = np.arange(16).reshape(4, 4)        # a tiny 4x4 "photo"
flipped = image[:, ::-1]                   # mirror left to right (label stays the same)
cropped = image[1:3, 1:3]                  # keep the middle 2x2 part
versions = [image, flipped, cropped]       # original + 2 changed copies
print("images from one original:", len(versions))
