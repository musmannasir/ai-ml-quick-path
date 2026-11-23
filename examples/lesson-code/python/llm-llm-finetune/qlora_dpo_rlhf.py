# From lesson 'llm-finetune' (llm). Code status: Python LoRA arithmetic executed 2026-11-02 (quickpath.py lora); TRL training conceptual; added technique snippets (2026-11-05) not run
import math

# QLoRA: memory of the frozen base weights (1 billion weights, made-up size)
weights = 1_000_000_000
print("16-bit GB:", weights * 2 / 1e9)        # 2 bytes per weight
print("4-bit GB:", weights * 0.5 / 1e9)       # half a byte per weight

# DPO loss for one pair (log-probabilities are made-up numbers)
beta = 0.1
chosen_gain = (-12.0) - (-12.5)               # tuned model minus reference, chosen answer
rejected_gain = (-15.0) - (-14.0)             # tuned model minus reference, rejected answer
margin = chosen_gain - rejected_gain
loss = -math.log(1 / (1 + math.exp(-beta * margin)))   # -log sigmoid(beta * margin)
print("DPO loss:", loss)

# RLHF (simplified): reward minus a penalty for drifting from the original model
reward, drift, beta_kl = 8.0, 4.0, 0.5
print("score:", reward - beta_kl * drift)
