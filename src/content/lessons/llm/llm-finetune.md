---
id: llm-finetune
title: Fine-tuning: SFT, LoRA, QLoRA and preference tuning
module: llm
level: Advanced
minutes: 90
maths: advanced optional
goal: Decide between prompting, RAG and fine-tuning, prepare instruction data, and fine-tune an open model with LoRA or QLoRA, then compare it fairly with the base model.
prereqs: llm-scale, llm-how
reviewed: 2026-11-02
updated: 2026-11-24
evidence: A decision note (prompt, RAG or fine-tune), a JSONL training set of at least 200 examples with a separate test set, and a base-versus-adapter comparison.
code: Python LoRA arithmetic executed 2026-11-02 (quickpath.py lora); TRL training conceptual; added technique snippets (2026-11-05) not run
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

```visual LoRA: a frozen grid and two thin pieces
file: lora-thin-pieces
alt: A large square labelled frozen, 10,000 numbers, 100 by 100. Beside it, plus a tall thin rectangle of 100 by 2 times a wide thin rectangle of 2 by 100, which are the only parts trained. A box says LoRA trains 100 times 2 plus 2 times 100, which is 400 numbers, or 4 percent of 10,000.
caption: LoRA leaves the big layer frozen and trains two thin pieces next to it: 400 numbers instead of 10,000 in the lesson's example. QLoRA also stores the frozen layer in 4-bit.
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

```maths Why LoRA trains so few numbers
situation: One layer of a model is a grid of 100 by 100 weights. Full fine-tuning would change all of them. LoRA freezes them and adds two thin grids instead: one of 100 by 2 and one of 2 by 100. The 2 is called the rank.
find: How many numbers does LoRA train, compared with full fine-tuning?
step: Weights in the full layer | 100 × 100 = 10,000
step: Weights in the two thin LoRA grids | 100 × 2 + 2 × 100 = 400
step: LoRA's share of the full layer | 400 ÷ 10,000 = 0.04 = 4%
result: LoRA trains **400** numbers instead of 10,000, which is **4%**.
formula: LoRA parameters = rows × rank + rank × columns
why: Fewer trained numbers means less memory, faster training and a small file to store per task. This is why LoRA makes fine-tuning possible on one ordinary GPU.
caution: In a real model the layers are thousands wide, so the share is much smaller than 4%, often below 1%. Fewer numbers also means less capacity: LoRA suits adapting style or format better than teaching large amounts of new knowledge.
try: You raise the rank from 2 to 8. How many numbers are trained now?
answer: 100 × 8 + 8 × 100 = 1,600, which is 1,600 ÷ 10,000 = 16% of the layer. A higher rank can learn more but costs proportionally more memory and time.
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

#### Other LoRA variants (LoRA-FA, VeRA, Delta-LoRA, LoRA+)
Plain LoRA trains two thin matrices, **A** and **B**, whose product is the change to a big weight matrix **W**. Several later methods keep that idea and change what is trained, what is frozen or how fast each part learns. Each has an original paper (linked in the sources list of this lesson); the descriptions below are simplified.

- **LoRA-FA** ([paper](source:lorafa-paper)) freezes **A** as well and trains only **B**. That halves the trained numbers and, because the layer input no longer has to be kept for training A, it can use less memory during training. The risk is less freedom to adapt.
- **VeRA** ([paper](source:vera-paper)) uses one pair of random, frozen thin matrices shared by every layer, and trains only two small **scaling vectors** per layer. It trains far fewer numbers than LoRA, which keeps the stored file tiny when you keep many adapters.
- **Delta-LoRA** ([paper](source:deltalora-paper)) also moves the big matrix **W** itself. It adds the change in the product of A and B between two training steps to W, so W is updated without storing a full gradient for it.
- **LoRA+** ([paper](source:loraplus-paper)) keeps the same matrices as LoRA but gives **B** a higher learning rate than **A**. The authors argue one shared rate is not ideal for wide models. The trained numbers stay the same.

```diagram compare LoRA and its variants: what is trained
note: Per layer. Frozen means not changed during training.
## LoRA | process
- Trains A and B
- W frozen
## LoRA-FA | process
- Trains B only
- A and W frozen
## VeRA | model
- Trains two small scaling vectors
- Shared random A and B frozen
## LoRA+ and Delta-LoRA | warn
- Both train A and B
- LoRA+: B learns faster. Delta-LoRA: W also moves
```

```maths Trained numbers for one layer, five methods
situation: One layer of a model is a grid of 4096 by 4096 weights, which is 16,777,216 numbers. Every method below uses rank 8. These are counts for one layer, worked from the descriptions above, not measured speeds.
find: How many numbers does each method train in this layer?
step: LoRA trains A (4096 by 8) and B (8 by 4096) | 4096 × 8 + 8 × 4096 = 65,536
step: LoRA-FA trains B only | 8 × 4096 = 32,768
step: VeRA trains a scaling vector of length 8 and one of length 4096 | 8 + 4096 = 4,104
step: How many times fewer is VeRA than LoRA | 65,536 ÷ 4,104 ≈ 16
result: LoRA and LoRA+ train **65,536** numbers, LoRA-FA **32,768**, VeRA **4,104**. Delta-LoRA trains **65,536** and also updates W.
formula: LoRA = d × r + r × d; LoRA-FA = r × d; VeRA = r + d
why: Fewer trained numbers means a smaller file for each task. The counts do not say which method gives the best answers: that depends on the task and has to be tested on your own test set.
caution: Counts are not quality. A method that trains fewer numbers can fit your data less well.
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

## Live simulation
Two ideas make large models cheap to adapt and to run: training small add-on matrices, and storing weights in fewer bits.

```sim lora LoRA: a big change from two thin matrices
preset: lora
question: Why can a huge model be adapted by training only a tiny number of new numbers?
watch: The left grid is the change the model needs (64 numbers). The right grid is what two thin matrices of the chosen rank can make.
watch: The error left is how much of the change the thin version misses. This change was built from two simple patterns plus a little noise.
watch: The last readout scales the idea to a 4096 by 4096 layer, where the saving is large.
try: rank | Find the smallest rank that leaves 15% or less of the change unexplained.
predict: A layer has 4096 × 4096 weights. LoRA with rank 8 trains two thin matrices instead. About what share of the original weights is that? | About 40% | About 4% | Under 1%
answer: 3 | Two matrices of 4096 × 8 hold 65,536 numbers, against 16,777,216 in the layer: about 0.39%.
leaves-out: One small made-up matrix. In a real fine-tune the thin matrices are trained by gradient descent on your data rather than computed from a known change, and the right rank depends on the task. The base model's own weights are not touched.
reference: examples/sim-llm/llm.py
```

```sim lora Quantisation: fewer bits per weight
preset: quant
question: How much accuracy do we lose when each weight is stored in fewer bits, and how much space do we save?
watch: Each weight is rounded to the nearest of a few evenly spaced values. Fewer bits mean fewer values.
watch: The error (RMSE) is the typical size of the rounding mistake, in the same units as the weights.
watch: The size is shown against a 16-bit copy of the same weights.
try: bits | Find the fewest bits that keep the rounding error at or below 0.002.
predict: You go from 8 bits to 4 bits per weight. What happens to the rounding error? | It stays about the same | It grows many times over | It halves
answer: 2 | Four bits leave only 15 distinct values instead of 255, so each weight is rounded much more coarsely. Here the error grows from about 0.0003 to about 0.0054, roughly 19 times.
leaves-out: 400 made-up weights that follow a bell-shaped spread. Real quantisation schemes group weights, treat outliers separately and are tested on the model's answers, not only on rounding error. Blending two models is not shown.
reference: examples/sim-llm/llm.py
```

```sim lora LoRA variants: what each one trains
preset: variants
question: How many numbers does each LoRA variant train for one layer, and how does that change with the layer width and the rank?
watch: The bars show each method's trained numbers as a share of plain LoRA's.
watch: LoRA-FA is always half of LoRA. VeRA depends on the width plus the rank, not on their product.
watch: LoRA+ and Delta-LoRA train the same count as LoRA; they differ in how the training runs.
try: share | At width 4096, find the smallest rank at which LoRA trains more than 1% of the layer.
predict: At width 4096 and rank 8, VeRA trains about how many times fewer numbers than LoRA? | About 2 times | About 16 times | About 160 times
answer: 2 | LoRA trains 65,536 and VeRA 4,104, so about 16 times fewer.
leaves-out: Only the counts of trained numbers for one square layer, worked from the formulas. It does not train anything, so it says nothing about accuracy, speed or memory use, and it ignores the shared matrices of VeRA, which are stored once.
reference: examples/sim-llm/llm.py
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
