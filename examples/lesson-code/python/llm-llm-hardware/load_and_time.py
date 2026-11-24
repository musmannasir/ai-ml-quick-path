# From lesson 'llm-hardware' (llm). Code status: Python fit-check arithmetic executed 2026-11-24 (fit_check.py); PyTorch, Hugging Face and runner commands not run (no GPU in the build environment); C# fit check ran, GPU device code compiled only
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

name = "<an open model you are licensed to use>"
tokenizer = AutoTokenizer.from_pretrained(name)
# device_map="auto" fills the GPU first, then the CPU if the model does not fit. Newer versions call
# the dtype argument "dtype"; older ones call it "torch_dtype".
model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.bfloat16, device_map="auto")
print("First layer is on:", next(model.parameters()).device)

inputs = tokenizer("Explain what a GPU does, in one sentence.", return_tensors="pt").to(model.device)
start = time.time()
out = model.generate(**inputs, max_new_tokens=64)
seconds = time.time() - start
new_tokens = out.shape[1] - inputs["input_ids"].shape[1]
print(tokenizer.decode(out[0], skip_special_tokens=True))
print(f"{new_tokens / seconds:.1f} tokens per second")
