// From lesson 'dl-vision' (dl). Code status: Python NumPy demos executed 2026-11-02 (ai_extras.py conv, gap_topics.py vision); PyTorch not run (not installed in the build environment); added technique snippets (2026-11-05) not run
using System;

int backbone = 1_000_000;                    // pretrained weights (made-up size)
int newLayer = 512 * 3 + 3;                  // new final layer: 512 inputs x 3 classes + 3 biases
Console.WriteLine($"trainable before freezing: {backbone + newLayer}");
Console.WriteLine($"trainable after freezing:  {newLayer}");   // the backbone is frozen

var image = new int[4, 4];                   // a tiny 4x4 "photo"
for (int i = 0; i < 16; i++) image[i / 4, i % 4] = i;

var flipped = new int[4, 4];                 // mirror left to right (label stays the same)
for (int r = 0; r < 4; r++)
    for (int c = 0; c < 4; c++) flipped[r, c] = image[r, 3 - c];

var cropped = new int[2, 2];                 // keep the middle 2x2 part
for (int r = 0; r < 2; r++)
    for (int c = 0; c < 2; c++) cropped[r, c] = image[r + 1, c + 1];

Console.WriteLine("images from one original: 3 (original, flipped, cropped)");
