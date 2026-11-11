# From lesson 'dl-vision' (dl). Code status: Python NumPy demos executed 2026-11-02 (ai_extras.py conv, gap_topics.py vision); PyTorch and C# (ONNX Runtime) not run (not installed in the build environment)
from torchvision import models
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)      # pretrained on millions of photos
model.fc = torch.nn.Linear(model.fc.in_features, 3)                    # new last layer: good / scratched / dented
# ... train with your images, then export for any language:
torch.onnx.export(model.eval(), torch.randn(1, 3, 224, 224), "inspector.onnx", input_names=["input"], output_names=["scores"])
