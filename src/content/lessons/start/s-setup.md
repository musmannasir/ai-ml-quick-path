---
id: s-setup
title: Set up your laptop for AI and ML in Python and .NET
module: start
level: Beginner
minutes: 90
goal: Install and check a Python and a .NET environment for AI work, run notebooks, use Git, and understand when you need a GPU.
prereqs:
reviewed: 2026-11-02
evidence: Both environment checks run on your machine, a Git repository with your first notebook, and a note of whether your laptop has a usable GPU.
code: Python executed 2026-11-02 (quickpath.py env); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
You can learn almost all of AI and ML on an ordinary laptop. You need a programming environment, a few libraries and a place to save your work. **Python** has the largest set of AI libraries: NumPy and pandas (data), scikit-learn (classic ML), PyTorch (deep learning), and libraries for language models. **.NET** is strong for building business applications: ML.NET (classic ML), TorchSharp (deep learning), ONNX Runtime (run trained models fast), and Microsoft.Extensions.AI (call language models). A **virtual environment** keeps each Python project's libraries separate. **Notebooks** (Jupyter, or Polyglot Notebooks in VS Code for C#) let you run code step by step and see results. **Git** saves every version of your code. A **GPU** (graphics card) makes deep learning much faster, but it is only needed for bigger neural networks; small models train fine on a CPU, and you can rent GPUs in the cloud when you need them.

```diagram compare Python and .NET tools for the same jobs
note: Both are covered in every lesson of this guide.
## Python | input
- Data | NumPy and pandas
- Classic ML | scikit-learn
- Deep learning | PyTorch
- Language models | Libraries for language models
## .NET | model
- Classic ML | ML.NET
- Deep learning | TorchSharp
- Run trained models fast | ONNX Runtime
- Language models | Microsoft.Extensions.AI
```

```diagram layers Your working setup
note: Each layer sits on the one below it.
- Git | Saves every version of your code | store
- Notebooks | Run code step by step and see results | process
- Libraries in a virtual environment | Kept separate for each Python project | model
- Python and .NET | Installed on an ordinary laptop | input
```

```diagram compare CPU or GPU
## CPU | process
- Enough for | Classic ML and small neural networks
## GPU | model
- Helps with | Much faster deep learning on bigger neural networks
- How to get one | Rent in the cloud when you need it
```

## Real-world example
A data team gives every new engineer a one-page setup script: create a virtual environment, install pinned library versions from `requirements.txt`, run a check script, open the starter notebook. Everyone gets identical results, and "it works on my machine" problems disappear.

```diagram flow The team setup script
- Create a virtual environment | One per project | process
- Install pinned libraries | From `requirements.txt` | store
- Run a check script | Confirms the setup works | process
- Open the starter notebook | Same results for everyone | output
```

## How it works
1. Install Python 3.10 or newer and the .NET SDK (version 8 or newer) and VS Code.
2. Python: create a virtual environment and install libraries; record them in `requirements.txt`.
3. .NET: create a project with `dotnet new console` and add NuGet packages.
4. Run a check script in each language.
5. Put the project in Git; never commit passwords or API keys.
6. Optional: install a local model runner (such as Ollama) to run language models on your own machine.

```diagram lanes Setup steps for each language
## Python
- Install Python 3.10 or newer | And VS Code | input
- Create a virtual environment | Install libraries | process
- Record `requirements.txt` | Pinned library versions | store
- Run the check script | Python environment check | output
## .NET
- Install the .NET SDK | Version 8 or newer | input
- `dotnet new console` | Create the project | process
- Add NuGet packages | Libraries for the project | store
- Run the check script | .NET environment check | output
```

## Python example
```bash Terminal (macOS/Linux; on Windows use .venv\Scripts\activate)
python -m venv .venv
source .venv/bin/activate
pip install numpy pandas scikit-learn jupyter
pip freeze > requirements.txt
jupyter notebook
```
```python check environment (quickpath.py env)
import platform, os, numpy as np, pandas as pd, sklearn
print(f"Python {platform.python_version()} | CPU cores: {os.cpu_count()}")
print(f"numpy {np.__version__} | pandas {pd.__version__} | scikit-learn {sklearn.__version__}")
try:
    import torch
    print(f"PyTorch {torch.__version__} | GPU available: {torch.cuda.is_available()}")
except ImportError:
    print("PyTorch not installed (needed only for deep-learning lessons)")
```
```text Output on the machine that built this guide (executed)
Python 3.13.18 on Linux | CPU cores: 2
numpy 2.5.3 | pandas 3.0.5 | scikit-learn 1.9.1
PyTorch not installed (needed only for deep-learning lessons)
```
Your versions will differ; that is fine. When you reach the deep-learning lessons, install PyTorch using the command generator on its official site, choosing your operating system and whether you have an NVIDIA GPU.

## .NET (C#) example
```bash Terminal
dotnet new console -n AiStarter
cd AiStarter
dotnet add package Microsoft.ML
dotnet add package Microsoft.Extensions.AI
dotnet run
```
```cs Program.cs (environment check)
using System.Runtime.InteropServices;
Console.WriteLine($".NET {Environment.Version} on {RuntimeInformation.OSDescription}");
Console.WriteLine($"CPU cores: {Environment.ProcessorCount}");
Console.WriteLine($"ML.NET loaded: {typeof(Microsoft.ML.MLContext).Assembly.GetName().Version}");
```
For C# notebooks, install the Polyglot Notebooks extension in VS Code. For deep learning in .NET, add `TorchSharp-cpu` (or the CUDA build if you have an NVIDIA GPU).

## Maths behind it
- None for setup. GPUs speed up linear algebra (matrix multiplication), which is the core operation of neural networks.

## Common mistakes
- Installing libraries globally, then breaking one project while fixing another.
- Committing API keys to Git. Use environment variables or .NET user secrets.
- Buying an expensive GPU before you need one. Learn first; rent GPU time for big jobs.

```diagram compare Global install or virtual environment
note: Why each project gets its own environment.
## Libraries installed globally | bad
- Result | Fixing one project can break another
## One virtual environment per project | output
- Result | Each project keeps its own library versions
- Bonus | Setup can be recreated from `requirements.txt`
```

```diagram flow Keeping API keys out of Git
- API key | Never put it in code | warn
- Environment variable or .NET user secret | Kept outside the repository | store
- Git repository | Contains no passwords or keys | output
```

## Quick check
Q: Why use a virtual environment in Python?
A: Each project gets its own library versions, so projects do not break each other and the setup can be recreated from `requirements.txt`.

Q: Name one .NET library for classic ML and one for running trained models fast.
A: ML.NET for classic ML; ONNX Runtime for fast inference of trained models.

Q: Do you need a GPU to start learning?
A: No. Classic ML and small neural networks run on a CPU; rent a GPU later for larger deep-learning work.
