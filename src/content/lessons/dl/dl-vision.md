---
id: dl-vision
title: Computer vision: classification, detection and segmentation
module: dl
level: Intermediate
minutes: 90
goal: Explain convolutional networks, transfer learning, object detection, segmentation and vision transformers, and run a trained vision model from Python and C#.
prereqs: dl-training
reviewed: 2026-11-02
evidence: A fine-tuned image classifier (or detector) evaluated on images from a different session than training, exported to ONNX and called from C# or Python.
code: Python NumPy demos executed 2026-11-02 (ai_extras.py conv, gap_topics.py vision); PyTorch and C# (ONNX Runtime) not run (not installed in the build environment); added technique snippets (2026-11-05) not run
---
## In plain words
Images are grids of numbers (pixel brightness per colour). A **convolutional neural network (CNN)** slides small **filters** across the image; early filters detect edges, later ones detect shapes and whole objects. Computer vision has several tasks. **Classification** says what is in the picture ("scratched part"). **Object detection** says what and where, with boxes around each object. **Segmentation** labels every pixel (road, car, person). **Vision transformers (ViT)** cut an image into small patches and treat them like words. In industry you rarely train from zero: **transfer learning** starts from a model already trained on millions of photos and fine-tunes it on your few thousand. Detection quality is measured with **IoU** (how much the predicted box overlaps the true box), and duplicate boxes are removed with **non-maximum suppression (NMS)**.

```diagram flow How a convolutional network sees an image
- Pixels | A grid of numbers, brightness per colour | input
- Early filters | Slide across the image and detect edges | process
- Later filters | Combine edges into shapes and whole objects | model
- Answer | Label, boxes or a mask | output
```

```diagram compare Three vision tasks
## Classification | model
- What is in the picture? | One label, such as scratched part
## Object detection | process
- What and where? | Boxes around each object
## Segmentation | output
- Which pixel is what? | Every pixel labelled: road, car, person
```

```diagram flow Transfer learning
- Model trained on millions of photos | Already knows general visual features | store
- Replace the last layer | Use your own classes | process
- Fine-tune on your photos | A few thousand are enough | model
```

```diagram flow Cleaning up detection results
- Predicted boxes | Several may cover the same object | input
- Non-maximum suppression | Removes duplicate boxes | process
- IoU check | How much the predicted box overlaps the true box | model
```

## Real-world example
The [John Deere case](case:john-deere) describes cameras and machine learning on farm sprayers that spot weeds so individual nozzles spray only where weeds are, rather than the whole field. That is real-time detection running on equipment in the field.

## How it works
1. Collect and label images (classes, boxes or masks) with a clear guide.
2. Split by session, location or date so near-identical photos do not appear in both train and test.
3. Start from a pretrained model; replace its last layer with your classes.
4. Fine-tune with augmentation; evaluate per class.
5. Export to **ONNX** (a portable model format) and run it with ONNX Runtime in Python, C#, on a server or on a device.

### Related concepts
- **Image classification** answers "what is in this image?" (one label). **Object detection** answers "what and where?" with boxes; well-known model families include YOLO and DETR. **Segmentation** labels every pixel (for example "road", "car", "person"); U-Net is a classic design, widely used in medical imaging.
- **OCR** (optical character recognition) reads text from images such as invoices and receipts.
- **Vision transformers (ViT)** cut an image into small patches and treat them like tokens; they are now as common as CNNs for large-scale vision.
- **Transfer learning**: reuse a model that has already learned from millions of photos. Everyday example: a chef who already cooks well learns a new dish in a day, because the knife skills and timing are already there. Here you **freeze** the early layers (you keep their weights fixed and do not train them) and train only a new final layer that picks your own classes, such as "good", "scratched" and "dented". Fewer weights to train means less data and less time.

```diagram flow Transfer learning: freeze and train
- Pretrained layers | Learned edges, shapes and textures from millions of photos | store
- Freeze them | Their weights are kept fixed, so they are not trained | warn
- New final layer | Gives scores for your own classes | process
- Train only the new layer | Few examples and little time are needed | model
```

- **Data augmentation**: making extra training images by changing the ones you have a little. Everyday example: you take one photo of a mug, then also a mirrored copy, a slightly turned copy and a closer crop. It is still the same mug, so the label stays "mug", and the network sees more variety. Only change images in ways that do not change the right answer. Augment training images only, never validation or test images.

```diagram fan Data augmentation
- One original photo | The image you collected, with its label | input
- Flipped copy | Mirrored left to right, same label | process
- Rotated copy | Turned a few degrees, same label | process
- Cropped copy | A zoomed-in part, same label | process
- Larger training set | More variety without new photos | output
```

## Python example
A vertical-edge filter on a dark-to-bright image, and detection geometry:
```text Output of ai_extras.py conv (executed)
image rows: [0.0, 0.0, 9.0, 9.0, 9.0] (all 5 rows identical)
convolution output (3x3): [[27.0, 27.0, 0.0], [27.0, 27.0, 0.0], [27.0, 27.0, 0.0]]
```
```text Output of gap_topics.py vision (executed)
IoU of predicted vs true box = 0.562 (counts as a hit at IoU >= 0.5)
non-maximum suppression keeps 2 of 4 boxes: [0.92, 0.8]
segmentation: mask IoU 0.610, Dice 0.758
vision transformer: a 224×224 image in 16×16 patches = 196 tokens
```
Transfer learning in PyTorch (requires `torch` and `torchvision`):
```python fine_tune.py
from torchvision import models
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)      # pretrained on millions of photos
model.fc = torch.nn.Linear(model.fc.in_features, 3)                    # new last layer: good / scratched / dented
# ... train with your images, then export for any language:
torch.onnx.export(model.eval(), torch.randn(1, 3, 224, 224), "inspector.onnx", input_names=["input"], output_names=["scores"])
```

### More techniques in Python: transfer learning and data augmentation
Plain Python (not run). Counting trainable weights after freezing, and flipping and cropping an image stored as a numpy grid:
```python transfer_augment.py (not run here)
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
```

## .NET (C#) example
Run the exported model in C# with ONNX Runtime (package `Microsoft.ML.OnnxRuntime`):
```cs Program.cs
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

string[] labels = { "good", "scratched", "dented" };
using var session = new InferenceSession("inspector.onnx");

float[] pixels = LoadAndNormalise("part-0042.jpg");          // 3 x 224 x 224 values, same preprocessing as training
var input = new DenseTensor<float>(pixels, new[] { 1, 3, 224, 224 });
using var results = session.Run(new[] { NamedOnnxValue.CreateFromTensor("input", input) });

float[] scores = results.First().AsEnumerable<float>().ToArray();
var exp = scores.Select(s => Math.Exp(s)).ToArray();
int best = Array.IndexOf(scores, scores.Max());
Console.WriteLine($"{labels[best]} ({exp[best] / exp.Sum():P0})");
// LoadAndNormalise: resize to 224x224 and normalise exactly as during training (for example with ImageSharp).
```

### More techniques in C#: transfer learning and data augmentation
The same two ideas in plain C# (not compiled here):
```cs TransferAugment.cs (not compiled here)
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
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Convolution output size (how big is the feature map?)
**Where it is used:** a convolution layer slides a small filter over an image, and the output size decides what the next layer sees.

```formula Convolution output size
output size = floor((n - k + 2 × p) ÷ s) + 1
```
n is the image width, k is the filter width, p is padding (zeros added at each edge), s is the stride (step size). floor means round down.

**In plain words:** the filter can only sit in so many places. Padding adds places; a bigger stride skips places.

**Example 1: no padding.** n = 28, k = 3, p = 0, s = 1. (28 - 3 + 0) ÷ 1 = 25, plus 1 = 26. The output is 26 wide.

**Example 2: stride 2.** n = 28, k = 3, p = 0, s = 2. (28 - 3) ÷ 2 = 12.5, floor = 12, plus 1 = 13. The map is about half as wide. With n = 32, k = 5, p = 2, s = 1 the size stays 32: (32 - 5 + 4) ÷ 1 + 1 = 32.

### Intersection over union (is the detected box right?)
**Where it is used:** object detection, such as finding weeds, compares a predicted box with the true box.

```formula IoU
IoU = area of overlap ÷ area of union
area of union = area A + area B - area of overlap
```
IoU is between 0 (no overlap) and 1 (identical boxes).

**In plain words:** how much of the two boxes is shared, out of everything they cover together.

**Example 1: partial overlap.** Box A is 4 × 4 = 16. Box B is 4 × 4 = 16 and overlaps A in a 2 × 2 square = 4. Union = 16 + 16 - 4 = 28. IoU = 4 ÷ 28 ≈ 0.14, a poor match.

**Example 2: box inside box.** The true box is 4 × 4 = 16 and the predicted box is 2 × 2 = 4, fully inside it. Overlap = 4, union = 16 + 4 - 4 = 16. IoU = 4 ÷ 16 = 0.25.

### Transfer learning (counting what you train)
**Where it is used:** the part-inspection classifier starts from a pretrained model and trains only a new final layer.

```formula Trainable weights after freezing
trainable after = weights in the new layer
new layer weights = inputs × classes + classes (the biases)
share trained = trainable after ÷ all weights × 100
```
A bias is one extra adjustable number per class.

**In plain words:** frozen weights are not changed, so only the small new layer is trained.

**Example 1: counting.** The pretrained part has 1,000,000 weights (made-up). The new layer has 512 inputs and 3 classes: 512 × 3 + 3 = 1,536 + 3 = 1,539. Before freezing, training changes 1,000,000 + 1,539 = 1,001,539 weights. After freezing, only 1,539. Share trained = 1,539 ÷ 1,001,539 × 100 ≈ 0.15%.

**Example 2: time.** Made-up timings: one epoch over 3,000 images takes 60 seconds with all layers trained and 20 seconds with the backbone frozen (no updates are needed there). For 10 epochs: 10 × 60 = 600 seconds against 10 × 20 = 200 seconds. Frozen training is 600 ÷ 200 = 3 times faster, and a few thousand images are enough because most of the knowledge is reused.

### Data augmentation (more images from the ones you have)
**Where it is used:** scans or part photos are few, so each image is flipped, turned or cropped to make new training examples.

```formula Training images after augmentation
training images = original images × versions per image
versions per image = 1 (the original) + number of changed copies
label rule: keep the label only if the change does not change the right answer
```
**In plain words:** every changed copy counts as one more example, as long as the label is still true.

**Example 1: counting.** 500 photos. Each gets 3 changed copies (flip, rotate, crop). Versions per image = 1 + 3 = 4. Training images = 500 × 4 = 2,000.

**Example 2: the label rule.** A flipped photo of a scratched part is still "scratched", so the flip is allowed. A handwritten digit 6 turned upside down looks like a 9, so turning would give a wrong label and must not be used for digits. With 1,200 digit images and only the allowed change (a small shift, 1 copy): versions = 1 + 1 = 2, so 1,200 × 2 = 2,400 images.

## Maths behind it
- Convolution and pooling (signal processing)
- Feature maps and receptive fields
- Intersection over union, Dice score
- Attention over image patches (vision transformers)
- Softmax and cross-entropy

## Common mistakes
- Testing on frames from the same video or session as training, which inflates accuracy.
- Different image preprocessing in production than in training.
- Training from zero when a pretrained model would need far less data.

## Quick check
Q: Classification, detection or segmentation: which tells you where each object is with a box?
A: Object detection.

Q: Why use transfer learning?
A: A pretrained model already knows general visual features, so you need far fewer labelled images and less compute.

Q: Why export a model to ONNX?
A: To run it with a fast, portable runtime from many languages (Python, C#, Java) and devices.
