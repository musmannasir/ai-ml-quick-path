---
id: llm-finetune
title: Fine-tuning: SFT, LoRA, QLoRA and preference tuning
module: llm
level: Advanced
minutes: 90
goal: Decide between prompting, RAG and fine-tuning, prepare instruction data, and fine-tune an open model with LoRA or QLoRA, then compare it fairly with the base model.
prereqs: llm-scale, llm-how
reviewed: 2026-11-02
evidence: A decision note (prompt, RAG or fine-tune), a JSONL training set of at least 200 examples with a separate test set, and a base-versus-adapter comparison.
code: Python LoRA arithmetic executed 2026-11-02 (quickpath.py lora); TRL training conceptual; C# is plain .NET (System.Text.Json) and was not compiled (no .NET SDK in the build environment); added technique snippets (2026-11-05) not run
---
## In plain words
There are three ways to make a model do what you need. **Prompting**: change the instructions and examples (fast, no training). **RAG**: give it your documents at question time (best for facts that change, need sources or need permissions). **Fine-tuning**: train it further on examples so the behaviour is built in (best for a consistent format, style or narrow task, or making a smaller, cheaper model do a specific job). **Supervised fine-tuning (SFT)** uses example prompts and ideal answers. Training all weights is expensive, so **LoRA** freezes the model and trains small extra matrices added to some layers, producing a small **adapter** file. **QLoRA** also stores the frozen model in 4-bit form to save memory. **Preference tuning** (such as DPO) trains on pairs of a better and a worse answer. Fine-tuning is poor at teaching facts that change; use RAG for those.

```diagram compare Prompting, RAG or fine-tuning
## Prompting | process
- Change instructions and examples
- Fast, no training
## RAG | store
- Give it your documents at question time
- Best for changing facts, sources and permissions
## Fine-tuning | model
- Train further on examples
- Best for set format, style or a narrow task
```

```diagram nest LoRA inside the frozen model
note: Only the small adapter is trained.
- Frozen base model | Original weights are not changed | model
- Small added matrices | Added to some layers and trained | process
- Adapter file | Small file holding what was trained | output
```

```diagram layers Ways to train a model further
- Preference tuning (such as DPO) | Pairs of a better and a worse answer | process
- LoRA and QLoRA | Small adapter; QLoRA also stores the frozen model in 4-bit | model
- Supervised fine-tuning (SFT) | Example prompts and ideal answers | input
```

```diagram compare Full fine-tuning versus LoRA versus QLoRA
## Full fine-tuning | warn
- Trains all weights
- Expensive
## LoRA | process
- Freezes the model
- Trains small added matrices
## QLoRA | model
- LoRA plus the frozen model stored in 4-bit
- Saves more memory
```

## Real-world example
The [Indeed case](case:indeed) describes adding explanations to job recommendations with a large model, then fine-tuning a smaller model to produce similar explanations with fewer tokens so it could run at scale. Fine-tuning paid off because the task was narrow and very high-volume.

```diagram flow Large model to small fine-tuned model
note: The pattern the case describes.
- Large model | Adds explanations to job recommendations | model
- Fine-tune a smaller model | To produce similar explanations with fewer tokens | process
- Runs at scale | Narrow task, very high volume | output
```

## How it works
1. Write the requirement and a test set first; try a strong prompt; add RAG if facts are missing.
2. Fine-tune only if a gap remains that examples can fix.
3. Prepare instruction data (hundreds to thousands of good examples); remove personal data; keep the test set separate before training.
4. Choose an open model whose licence allows your use; configure LoRA (rank, target layers) or QLoRA.
5. Train; watch validation loss; keep the best checkpoint.
6. Compare base and fine-tuned models on the same test set, blind; check that general skills did not get worse.

```diagram flow Fine-tuning workflow
- Requirement and test set | Write them first; try a strong prompt; add RAG if facts are missing | input
- Prepare data | Hundreds to thousands of good examples; remove personal data | process
- Split off the test set | Before any training | warn
- Configure LoRA or QLoRA | Pick an open model with a suitable licence | process
- Train | Watch validation loss; keep the best checkpoint | model
- Compare blind | Base against fine-tuned on the same test set | output
```

```diagram fan One example set, kept apart
note: The test set is separated before training and never trained on.
- Approved examples | Personal data removed | input
- Training set | Used to train | process
- Test set | Held out before any training | output
```

### Related concepts

#### Fine-tune versus prompt
Try the cheapest fix first. Prompting changes the instructions and costs almost nothing. If the model lacks facts, add retrieval (RAG), which supplies documents at request time and can be updated at once. Fine-tune only when a gap remains that examples can fix, such as a fixed style, a strict format or a narrow task at high volume. Fine-tuning changes behaviour, not facts that change often.

```diagram flow Which fix to try first
note: Move to the next step only when the test set shows a gap.
- Write the test set | Real inputs and expected answers | input
- Improve the prompt | Clear rules, examples, format | process
- Add retrieval (RAG) | When facts are missing or change often | store
- Fine-tune | When a style or format gap remains | model
- Compare on the same test set | Keep the simplest option that passes | output
```

#### QLoRA (LoRA on a compressed base model)
**QLoRA** is LoRA with one extra trick: the frozen base model is stored in **4-bit** numbers instead of 16-bit. **Quantising** means rounding numbers to fewer bits, like writing prices to the nearest dollar instead of the nearest cent. The file gets about four times smaller and still works well enough. The small LoRA matrices stay in higher precision and are the only part that is trained. Everyday example: you keep a big reference book on a small e-reader in compressed form, and you write your own notes on a separate page. The book is not changed; only your notes are. This lets a big model be fine-tuned on one modest graphics card.

```diagram layers QLoRA: a small adapter on a compressed model
- Trained adapter (LoRA) | Small matrices kept in higher precision; the only part that learns | process
- Frozen base model in 4-bit | Same knowledge, stored in about a quarter of the memory | model
- Full-precision original | Compressed once at load time, then not changed | input
```

#### DPO (learning from better-versus-worse answers)
**DPO** (direct preference optimisation) tunes a model with pairs of answers to the same prompt: one that people **chose** and one they **rejected**. It nudges the model to make the chosen answer more likely and the rejected one less likely, compared with a frozen copy of the starting model (the **reference model**). It needs no separate reward model. Everyday example: a coach shows a player two ways to play the same move and says "this one, not that one". After many pairs the player prefers the good way, but the coach also stops the player from changing style too much.

```diagram flow DPO: learn from chosen and rejected answers
note: No separate reward model is needed.
- Prompt with two answers | One chosen by people, one rejected | input
- Compare with the reference model | The frozen starting copy is the anchor | store
- Raise chosen, lower rejected | Loss is small when the margin is large | process
- Tuned model | Prefers the answers people choose | output
```

#### RLHF (reward model, then tuning)
**RLHF** (reinforcement learning from human feedback) is the older, longer route to the same goal. Step 1: people rank answers, and a **reward model** learns to score answers like they do. Step 2: the language model is tuned to earn higher scores, with a penalty if it drifts too far from the original model. Everyday example: a cooking student is scored by a judge. The student improves, but a rule says "do not change your style so much that it no longer looks like cooking". This is a simplified view; real systems have more parts.

```diagram loop RLHF: score, tune, repeat
note: Simplified view.
loop: Repeat until scores stop improving
- Model writes answers | Several answers per prompt | model
- Reward model scores them | Learned from human rankings | store
- Tune toward higher scores | With a penalty for drifting too far | process
```

## Python example
How small LoRA is compared with one full weight matrix:
```text Output of quickpath.py lora (executed)
rank  8: one 4096x4096 matrix trains 65,536 numbers instead of 16,777,216 (0.39%)
rank 16: one 4096x4096 matrix trains 131,072 numbers instead of 16,777,216 (0.78%)
rank 64: one 4096x4096 matrix trains 524,288 numbers instead of 16,777,216 (3.12%)
rank 16 on 2 matrices x 32 layers: 8.4 M trainable parameters
```
A LoRA fine-tune with Hugging Face TRL and PEFT (conceptual; argument names change between versions):
```python finetune.py (requires transformers, peft, trl, datasets and a GPU)
from datasets import load_dataset
from peft import LoraConfig
from trl import SFTConfig, SFTTrainer
train = load_dataset("json", data_files="train.jsonl")["train"]
trainer = SFTTrainer(model="<open model you are licensed to use>", train_dataset=train,
                     peft_config=LoraConfig(r=16, lora_alpha=32, target_modules="all-linear", task_type="CAUSAL_LM"),
                     args=SFTConfig(output_dir="adapter", num_train_epochs=2, learning_rate=2e-4, bf16=True))
trainer.train(); trainer.save_model("adapter")
```

### More techniques in Python: QLoRA memory, the DPO loss and a reward with a drift penalty
Small arithmetic sketches in plain Python. Real fine-tuning uses libraries such as transformers, peft and trl, which are not used here. All numbers are made up.
```python qlora_dpo_rlhf.py (not run here)
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
```

## .NET (C#) example
Preparing a clean chat-format training file in .NET (the same JSONL format most fine-tuning tools and providers accept), with the test set split off first:
```cs Program.cs
using System.Text.Json;

var examples = LoadApprovedExamples();                     // (ticket text, ideal summary) written or approved by experts
var rng = new Random(0);
var shuffled = examples.OrderBy(_ => rng.Next()).ToList();
var test = shuffled.Take(shuffled.Count / 10).ToList();     // hold out 10% BEFORE any training
var train = shuffled.Skip(test.Count).ToList();

void Write(string path, IEnumerable<(string Input, string Output)> rows) =>
    File.WriteAllLines(path, rows.Select(r => JsonSerializer.Serialize(new
    {
        messages = new object[]
        {
            new { role = "system", content = "Summarise the support ticket in one sentence." },
            new { role = "user", content = r.Input },
            new { role = "assistant", content = r.Output },
        }
    })));
Write("train.jsonl", train);
Write("test.jsonl", test);
Console.WriteLine($"train {train.Count}, test {test.Count}");

static List<(string Input, string Output)> LoadApprovedExamples() => /* your data, personal data removed */ new();
```

### More techniques in C#: QLoRA memory, the DPO loss and a reward with a drift penalty
The same arithmetic in plain C#. Real fine-tuning is usually done in Python; this only shows the idea with small numbers.
```cs TuningIdeas.cs (not compiled here)
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
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### LoRA parameter count (how few numbers are trained)
**Where it is used:** LoRA and QLoRA, which train two small matrices next to a frozen weight matrix instead of changing the big one.

```formula LoRA trainable parameters per matrix
LoRA parameters = rank × (inputs + outputs)
full matrix parameters = inputs × outputs
share trained = LoRA parameters ÷ full matrix parameters
```
rank (r) is the small inner size you choose, for example 8 or 16. inputs and outputs are the two sizes of the weight matrix.

**In plain words:** instead of a big grid of numbers, you train two thin grids whose sizes add up, which is much smaller.

**Example 1: a square matrix.** A 4,096 × 4,096 matrix has 4,096 × 4,096 = 16,777,216 numbers. With rank 8: 8 × (4,096 + 4,096) = 65,536. Share = 65,536 ÷ 16,777,216 = 0.0039, about 0.39%. With 2 such matrices in each of 32 layers at rank 16: 16 × 8,192 = 131,072 per matrix, and 131,072 × 2 × 32 = 8,388,608, about 8.4 million.

**Example 2: a non-square matrix.** A 4,096 × 1,024 matrix has 4,194,304 numbers. With rank 16: 16 × (4,096 + 1,024) = 81,920. Share = 81,920 ÷ 4,194,304 = 0.0195, about 1.95%. Thinner matrices give a larger share.

### Train and test split (percentages of examples)
**Where it is used:** holding out test examples before any fine-tuning, so the test is honest.

```formula Hold-out split
test examples = floor(n × test share)
train examples = n - test examples
```
floor means round down to a whole number. The C# code in this lesson does the same with integer division.

**In plain words:** set aside a fixed share of the examples before training and never train on them.

**Example 1: 1,000 examples, 10% held out.** Test = floor(1,000 × 0.10) = 100. Train = 1,000 - 100 = 900.

**Example 2: a small set.** With 45 examples, 45 × 0.10 = 4.5, which rounds down to 4 test examples, so train = 41. Four test cases is too few to trust: one wrong answer moves the score by 25 points, so collect more examples.

### QLoRA (memory of the frozen weights, plus the LoRA extras)
**Where it is used:** QLoRA fine-tuning of a model on a single modest graphics card.

```formula Memory of weights
bytes = number of weights × bits per weight ÷ 8
16-bit = 2 bytes per weight; 4-bit = 0.5 byte per weight
```
**In plain words:** memory is the count of numbers times the size of each number. 4-bit numbers are one quarter the size of 16-bit numbers. This counts the weights only; training also needs memory for activations and small extras, so real use is higher.

**Example 1: a 1-billion-weight model.** 16-bit: 1,000,000,000 × 2 = 2,000,000,000 bytes = 2 GB. 4-bit: 1,000,000,000 × 0.5 = 500,000,000 bytes = 0.5 GB. That is 4 times smaller.

**Example 2: a 7-billion-weight model plus the LoRA extras.** 16-bit: 7,000,000,000 × 2 = 14 GB. 4-bit: 7,000,000,000 × 0.5 = 3.5 GB. The LoRA parameters from the topic above, 8,388,608 (rank 16, 2 matrices in each of 32 layers), kept at 16-bit take 8,388,608 × 2 = 16,777,216 bytes, about 16.8 MB. The adapter is tiny next to the 3.5 GB base.

### DPO loss (preferring the chosen answer)
**Where it is used:** preference tuning with pairs of a chosen and a rejected answer.

```formula DPO loss for one pair
loss = -log( sigmoid( β × margin ) )
margin = (log π(chosen) - log π_ref(chosen)) - (log π(rejected) - log π_ref(rejected))
sigmoid(x) = 1 ÷ (1 + e^(-x))
(π = tuned model; π_ref = frozen reference model; log π = log-probability of the answer; β = strength setting)
```
**In plain words:** for each answer, see how much more likely the tuned model finds it than the reference does. The margin is the gain on the chosen answer minus the gain on the rejected one. A big positive margin gives a small loss. log is the natural logarithm.

**Example 1: the model learns the preference.** β = 0.1. Chosen: log π = −12.0, log π_ref = −12.5, gain = −12.0 − (−12.5) = 0.5. Rejected: log π = −15.0, log π_ref = −14.0, gain = −15.0 − (−14.0) = −1.0. Margin = 0.5 − (−1.0) = 1.5. β × margin = 0.15. sigmoid(0.15) = 0.5374. Loss = −log(0.5374) = 0.621.

**Example 2: the model moves the wrong way.** β = 0.1. Chosen: −13.0 − (−12.5) = −0.5. Rejected: −14.0 − (−14.0) = 0. Margin = −0.5 − 0 = −0.5. β × margin = −0.05. sigmoid(−0.05) = 0.4875. Loss = −log(0.4875) = 0.718. The loss is higher than in Example 1, so training pushes the model back toward the chosen answer.

### RLHF reward with a drift penalty (simplified view)
**Where it is used:** the tuning step of RLHF, which rewards good answers but discourages large changes.

```formula Reward with a penalty
score = reward - β × drift
(reward = the reward model's score; drift = how far the tuned model moved from the original; β = penalty strength)
```
**In plain words:** a high reward helps, but moving far from the original model costs points. This is a simplified view; real systems measure drift in a precise way and have more parts.

**Example 1: a modest change.** reward = 8, drift = 4, β = 0.5. Penalty = 0.5 × 4 = 2. Score = 8 − 2 = 6.

**Example 2: too much drift.** reward = 9, drift = 20, β = 0.5. Penalty = 0.5 × 20 = 10. Score = 9 − 10 = −1. The answer with the higher reward (9) loses, because it drifted far from the original.

## Maths behind it
- Low-rank matrix factorisation (LoRA)
- Quantisation to 4-bit (QLoRA)
- Supervised learning with cross-entropy
- Preference optimisation (DPO) and reinforcement learning from human feedback (RLHF)

## Common mistakes
- Fine-tuning to "teach facts" that change; use RAG.
- Letting test examples leak into training data.
- Comparing a fine-tuned model with a weak prompt for the base model; give the base model a fair, good prompt.
- Ignoring the model licence.
- Jumping to fine-tuning before testing a strong prompt and retrieval.
- Expecting LoRA to be free of cost: it needs less memory than full training, but you still need good data and a test set.

```diagram compare Fair versus unfair comparison
## Unfair | bad
- Test examples leaked into training data
- Base model given a weak prompt
## Fair | output
- Test set split off first
- Base model gets a good prompt too
- Same test set, judged blind
```

## Quick check
Q: Prompting, RAG or fine-tuning for this year's HR policy with citations?
A: RAG: the facts change, need citations and need permission checks.

Q: Why does LoRA need much less memory than full fine-tuning?
A: The original weights are frozen; only small added matrices are trained, so gradients and optimiser state are tiny.

Q: What must you do before training to keep the comparison fair?
A: Split off the test set first and never train on it.
