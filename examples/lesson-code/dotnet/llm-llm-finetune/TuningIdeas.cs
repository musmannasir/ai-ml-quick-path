// From lesson 'llm-finetune' (llm). Code status: Python LoRA arithmetic executed 2026-11-02 (quickpath.py lora); TRL training conceptual; added technique snippets (2026-11-05) not run
// QLoRA: memory of the frozen base weights (1 billion weights, made-up size)
double weights = 1_000_000_000;
Console.WriteLine($"16-bit GB: {weights * 2 / 1e9}");     // 2 bytes per weight
Console.WriteLine($"4-bit GB: {weights * 0.5 / 1e9}");    // half a byte per weight

// DPO loss for one pair (log-probabilities are made-up numbers)
double beta = 0.1;
double chosenGain = -12.0 - (-12.5);           // tuned model minus reference, chosen answer
double rejectedGain = -15.0 - (-14.0);         // tuned model minus reference, rejected answer
double margin = chosenGain - rejectedGain;
double loss = -Math.Log(1 / (1 + Math.Exp(-beta * margin)));   // -log sigmoid(beta * margin)
Console.WriteLine($"DPO loss: {loss}");

// RLHF (simplified): reward minus a penalty for drifting from the original model
double reward = 8.0, drift = 4.0, betaKl = 0.5;
Console.WriteLine($"score: {reward - betaKl * drift}");
