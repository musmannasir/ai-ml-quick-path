# From lesson 's-setup' (start). Code status: Python executed 2026-11-02 (quickpath.py env); C# not compiled (no .NET SDK in the build environment)
import platform, os, numpy as np, pandas as pd, sklearn
print(f"Python {platform.python_version()} | CPU cores: {os.cpu_count()}")
print(f"numpy {np.__version__} | pandas {pd.__version__} | scikit-learn {sklearn.__version__}")
try:
    import torch
    print(f"PyTorch {torch.__version__} | GPU available: {torch.cuda.is_available()}")
except ImportError:
    print("PyTorch not installed (needed only for deep-learning lessons)")
