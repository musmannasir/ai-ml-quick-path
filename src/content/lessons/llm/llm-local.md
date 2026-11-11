---
id: llm-local
title: Running language models on your own machine
module: llm
level: Intermediate
minutes: 75
goal: Run an open-weight model locally, understand quantization and memory needs, and call the local model from Python and .NET through the same interfaces used for hosted models.
prereqs: llm-how
reviewed: 2026-11-02
evidence: A local model answering through both a Python and a C# client, with memory use and tokens per second noted for two quantization levels.
code: Python memory arithmetic executed 2026-11-02 (memory_estimate.py); local model calls not run (no model runner in the build environment); C# not compiled (no .NET SDK)
---
## In plain words
You do not always need a cloud API. **Open-weight models** can run on your laptop, a workstation or your own servers, which keeps data in-house and can lower cost. Memory is the limit: model weights need parameters × bytes per weight. **Quantization** stores weights in fewer bits (8-bit, 4-bit) so a model fits in less memory, with a small loss in quality that you must measure. Popular tools: **Ollama** and **llama.cpp** run quantized models (GGUF files) on laptops and desktops, with or without a GPU; **ONNX Runtime GenAI** runs models in many languages; **vLLM** serves models to many users on GPUs. Many of these expose an **OpenAI-compatible API**, so the same code works for a local or hosted model by changing the address. A rough guide: a 7–8-billion-parameter model at 4 bits needs about 4–5 GB just for weights, plus memory for the conversation (the **KV cache**).

```diagram layers Local model stack
note: Your code talks to the runner, which loads the model file.
- Your Python or .NET client | Points at the local address | input
- OpenAI-compatible API | Same code for local or hosted; change the address | process
- Runner | Ollama, llama.cpp, ONNX Runtime GenAI or vLLM | process
- Quantized model file | For example GGUF; weights in 8-bit or 4-bit | model
- Hardware | Laptop, workstation or your own server | store
```

```diagram compare Hosted API versus local model
## Hosted API | process
- Data goes to the provider
- Used through the provider's API
## Local open-weight model | model
- Data stays in-house
- Can lower cost
- Memory is the limit
```

```diagram compare Which runner for which job
## Ollama and llama.cpp | process
- Run quantized models (GGUF files)
- Laptops and desktops, with or without a GPU
## ONNX Runtime GenAI | model
- Runs models in many languages
## vLLM | store
- Serves models to many users
- Runs on GPUs
```

```diagram compare Quantization trade-off
note: Weights for an 8-billion-parameter model, from the executed memory run.
## 16-bit weights | warn
- 16.0 GB
- No quantization
## 8-bit weights | process
- 8.0 GB
## 4-bit weights | model
- 4.0 GB
- Small quality loss to measure
```

```diagram merge Memory a local model needs
note: A 7-8 billion parameter model at 4 bits needs about 4-5 GB just for weights.
- Total memory needed | Must fit your machine | output
- Weights | Parameters times bytes per weight | model
- KV cache | Memory for the conversation; grows with its length | store
```

## Real-world example
A law firm cannot send client documents to an outside service. It runs an open model on its own GPU server with a document search system, so drafts and summaries never leave the building, and checks quality on its own test set before rollout.

```diagram flow Documents stay inside the building
- Client documents | Cannot go to an outside service | input
- Open model on own GPU server | With a document search system | model
- Drafts and summaries | Never leave the building | output
```

## How it works
1. Pick a model whose licence allows your use and whose size fits your memory.
2. Choose a quantization level (for example 4-bit) and download it through your runner.
3. Start the runner; it exposes a local API.
4. Point your Python or .NET client at the local address.
5. Measure speed (tokens per second), memory and quality on your own examples.

```diagram flow Setting up a local model
- Pick a model | Licence allows your use; size fits your memory | input
- Choose quantization | For example 4-bit; download through your runner | process
- Start the runner | It exposes a local API | process
- Point your client | Python or .NET, at the local address | process
- Measure | Tokens per second, memory and quality on your examples | output
```

### Related concepts
- **Greedy decoding**: always pick the most likely next token. Fast and repeatable, but can be dull or repetitive.
- **Beam search**: keep the few best partial answers at each step and pick the best complete one. Common in translation and speech recognition; rarely used for chat.
- **Speculative decoding**: a small, fast "draft" model guesses several tokens ahead and the large model checks them in one pass. The output is the same as the large model's, but generation is faster. Runtimes such as vLLM and llama.cpp support it.
- **Continuous batching**: a serving technique that adds new requests into a running batch as others finish, so the GPU stays busy. It is the main reason dedicated LLM servers handle many users efficiently.

```diagram compare Ways to choose the next token
## Greedy decoding | process
- Always the most likely token
- Fast and repeatable, can be dull
## Beam search | model
- Keeps the few best partial answers
- Common in translation and speech recognition
```

```diagram flow Speculative decoding
note: The output is the same as the large model's, but generation is faster.
- Draft model guesses | A small, fast model guesses several tokens ahead | process
- Large model checks | Checks the guesses in one pass | model
- Accepted tokens | Same output as the large model alone | output
```

```diagram compare Continuous batching
## Without it | warn
- Batch waits for all requests to finish
- GPU can sit idle
## With it | output
- New requests join the batch as others finish
- GPU stays busy
```

## Python example
Memory for an 8-billion-parameter model by precision:
```text Output of memory_estimate.py (executed)
Weights only, 8B parameters:
       fp32:  32.0 GB  ( 29.8 GiB)
  bf16/fp16:  16.0 GB  ( 14.9 GiB)
       int8:   8.0 GB  (  7.5 GiB)
      4-bit:   4.0 GB  (  3.7 GiB)
```
Calling a local Ollama model through the OpenAI-compatible endpoint (requires `pip install openai` and Ollama running with a pulled model):
```python local_chat.py
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="not-needed-locally")
reply = client.chat.completions.create(model="llama3.2",
        messages=[{"role": "user", "content": "Explain RAG in two sentences."}], temperature=0)
print(reply.choices[0].message.content)
```
```bash Terminal
ollama pull llama3.2          # downloads a quantized model
ollama run llama3.2 "hello"   # quick test
```

## .NET (C#) example
OllamaSharp implements the standard `IChatClient` interface from Microsoft.Extensions.AI, so business code does not change when you move between local and hosted models:
```cs Program.cs
using Microsoft.Extensions.AI;
using OllamaSharp;

IChatClient chat = new OllamaApiClient(new Uri("http://localhost:11434"), "llama3.2");

await foreach (var update in chat.GetStreamingResponseAsync("Explain RAG in two sentences."))
    Console.Write(update.Text);                      // tokens appear as they are generated
Console.WriteLine();
```
To switch to a hosted model, register a different `IChatClient` (for example the OpenAI or Azure OpenAI client); the rest of the code stays the same.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Memory for model weights (parameters × bytes)
**Where it is used:** deciding whether an open-weight model fits in your RAM or GPU memory, and why quantisation helps.

```formula Weights memory
memory in GB = parameters × bytes per parameter ÷ 1,000,000,000
bytes per parameter: 32-bit = 4, 16-bit = 2, 8-bit = 1, 4-bit = 0.5
```
This counts the weights only. Add room for the KV cache and the runtime.

**In plain words:** more parameters and more bytes per parameter mean more memory. Lower precision cuts memory in proportion.

**Example 1: 8 billion parameters at 4-bit.** 8,000,000,000 × 0.5 = 4,000,000,000 bytes = 4 GB. At 16-bit it is 8,000,000,000 × 2 = 16 GB, so 4-bit needs a quarter of the memory.

**Example 2: a 70 billion model (made-up case).** At 16-bit: 70 × 2 = 140 GB, far above a 24 GB GPU. At 4-bit: 70 × 0.5 = 35 GB, which still does not fit in 24 GB. Some size and precision combinations will never fit a given machine.

### KV cache size (memory that grows with the conversation)
**Where it is used:** the extra memory used while generating, which stores earlier attention keys and values so they are not recomputed.

```formula KV cache memory
bytes per token = 2 × layers × KV heads × head size × bytes per value
KV cache = bytes per token × tokens in context × batch size
```
The 2 is one set for keys and one for values. The model shape below (32 layers, 8 KV heads, head size 128, 16-bit values) is an assumed example.

**In plain words:** every token in the context keeps a small block of memory, so a longer context or more users at once means more memory.

**Example 1: one long chat.** Bytes per token = 2 × 32 × 8 × 128 × 2 = 131,072 (128 KiB). For 8,192 tokens: 8,192 × 131,072 = 1,073,741,824 bytes, about 1.07 GB.

**Example 2: eight chats at once.** The same context with batch size 8: 1.07 GB × 8 = about 8.59 GB. This is why a server that handles many users needs far more memory than the weights alone.

## Maths behind it
- Quantization (number formats and rounding)
- Memory arithmetic: parameters × bits ÷ 8
- KV cache size (grows with context length and number of users)

## Common mistakes
- Picking a model that just fits the weights, then running out of memory with long conversations.
- Assuming a quantized model is as good as the original without testing on your tasks.
- Ignoring the model's licence terms for commercial use.

```diagram compare Fitting a model in memory
## Weights only | bad
- Model just fits
- Long conversations run out of memory
## Weights plus KV cache | output
- Leave room for the conversation
- Test the quantized model on your tasks
```

## Quick check
Q: About how much memory do the weights of an 8B model need at 4 bits?
A: About 4 GB, before the KV cache and runtime overhead.

Q: Why is an OpenAI-compatible local API useful?
A: The same client code can call a local or a hosted model by changing only the address and model name.

Q: Name one reason a company runs models locally.
A: To keep sensitive data in-house (also: predictable cost, offline use, full control).
