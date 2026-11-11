# From lesson 'ops-scale' (ops). Code status: Python executed 2026-11-02 (quickpath.py batching, cache); ONNX export and C# not run (skl2onnx not installed and no .NET SDK in the build environment)
from skl2onnx import to_onnx
import numpy as np, joblib

model = joblib.load("model.joblib")
onx = to_onnx(model, np.zeros((1, 3), dtype=np.float32), target_opset=17)
open("churn.onnx", "wb").write(onx.SerializeToString())
