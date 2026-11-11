---
id: llm-how
title: How large language models work
module: llm
level: Intermediate
minutes: 75
goal: Explain pretraining, next-token prediction, context windows, instruction tuning, open-weight versus hosted models, and why LLMs sometimes make things up.
prereqs: dl-transformers
reviewed: 2026-11-02
evidence: A one-page explanation, for a non-technical colleague, of how a chat assistant produces an answer and why it can be confidently wrong.
code: Python executed 2026-11-02 (quickpath.py bigram); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
---
## In plain words
A **large language model (LLM)** is a decoder-only transformer with billions of weights. It is built in stages. **Pretraining**: the model reads a huge amount of text and learns one skill, predicting the **next token** (word piece). To do that well it has to absorb grammar, facts, reasoning patterns and code. **Instruction tuning** (supervised fine-tuning) then trains it on examples of questions and good answers, and **preference tuning** (such as RLHF or DPO) makes it prefer helpful, safe answers. When you chat, the model repeatedly predicts the next token, adds it to the text, and predicts again. The **context window** is how much text (your prompt, documents, conversation and its answer) it can consider at once. **Hosted models** are used through a provider's API; **open-weight models** can be downloaded and run on your own hardware. Because the model generates likely text rather than looking facts up, it can **hallucinate**: produce fluent, confident statements that are wrong. Giving it real documents (RAG, Part 6) and checking outputs reduce this.

```diagram loop Chatting with a model: one token at a time
note: The answer is built token by token, each new token joins the text.
- Text so far | Your prompt, then the tokens already written | input
- Model predicts | A likelihood for every possible next token | model
- Pick one token | Choose the next token from those likelihoods | process
- Add to text | The new token joins the text so far | output
loop: Repeat until the model produces a stop token
```

```diagram bar What shares the context window
note: Illustrative proportions only. The real split changes with every request.
- Your prompt | 20 | input
- Documents | 40 | store
- Conversation | 25 | process
- Model's answer | 15 | output
```

```diagram compare Hosted model versus open-weight model
## Hosted model | process
- Used through a provider's API
- Runs on the provider's hardware
## Open-weight model | model
- Weights can be downloaded
- Runs on your own hardware
```

## Real-world example
The [Morgan Stanley case](case:morgan-stanley) describes an internal assistant that answers advisors' questions from the firm's own knowledge, rather than relying only on what the model learned during pretraining. That is the standard industry pattern: a general LLM plus company documents.

```diagram flow General model plus company documents
note: The pattern from the case: the model answers from the firm's own knowledge.
- Advisor's question | A question typed in plain language | input
- Find firm documents | Look up the relevant internal knowledge | process
- Model reads both | The question and the documents together | model
- Answer | Based on the firm's own knowledge | output
```

## How it works
1. **Pretrain:** predict the next token on trillions of tokens of text (very expensive; done by model builders).
2. **Instruction-tune:** learn to follow requests from example conversations.
3. **Preference-tune:** learn which answers people prefer.
4. **Use:** your prompt goes in; the model predicts one token at a time until it stops.
5. **Ground and check:** supply documents and tools, validate outputs, keep people in the loop for important decisions.

```diagram lanes Building the model versus using it
note: Model builders do the first lane. You mostly work in the second.
## Building (model builders)
- Pretrain | Predict the next token on huge text | process
- Instruction-tune | Learn from example questions and answers | process
- Preference-tune | Prefer helpful, safe answers | process
- Trained model | Ready to chat | model
## Using (your system)
- Your prompt | Plus documents and tools | input
- Model predicts tokens | One token at a time until it stops | model
- Check the output | Validate, keep people in the loop | process
- Answer | Used for the decision | output
```

```diagram layers Skills stacked on top of next-token prediction
note: Each stage adds behaviour on top of the one below.
- Preference tuning | Prefers helpful, safe answers | process
- Instruction tuning | Follows requests from example conversations | process
- Pretraining | Learns grammar, facts, reasoning patterns and code by predicting the next token | model
```

### Related concepts

#### Context window
The context window is the most text, counted in tokens, that the model can look at in one request. It holds your instructions, the documents you add, the conversation so far and the answer being written. When it is full, something has to go: the provider may refuse the request, or your code must cut the oldest or least useful text. Cut text is simply not seen by the model. Longer contexts also take more time and memory, because the model has to relate every token to the others. So send only what the task needs. Look up the limit for your model; do not assume one.

```diagram flow When the context window fills up
- Prompt, documents and chat | Everything counted in tokens | input
- Over the limit? | Compare the total with the model limit | process
- Cut or summarise | Drop old turns, keep what matters | warn
- Model sees what is left | Text that was cut is not seen | model
- Longer input costs more | More time and more memory | bad
```

#### Embeddings
An embedding is a list of numbers that stands for the meaning of a piece of text. Texts with similar meaning get similar lists, so a program can find related passages by comparing them. Search by meaning and RAG depend on this. See [Embeddings](lesson:app-embeddings).

```diagram fan Text turned into embeddings
- Embedding | A list of numbers for the meaning | model
- A sentence | Becomes one embedding | input
- A document chunk | Becomes one embedding | input
- A search query | Becomes one embedding | input
- Similar meaning | Embeddings end up close together | output
```

#### How transformers work
A transformer is the design of neural network inside modern LLMs. Its key idea is attention: for each token, the model weighs which other tokens in the context matter most for it. Many layers of this, stacked, let the model use the whole context when it predicts the next token. See [Transformers](lesson:dl-transformers).

```diagram layers Inside a transformer, simply
note: Read from the bottom up.
- Next-token scores | The output: a score for every possible token | output
- Many repeated blocks | Each block applies attention and then a small network | model
- Token embeddings | Each token becomes a list of numbers | process
- Input tokens | The text split into pieces | input
```

## Python example
The simplest possible "language model" counts which word follows which (a bigram model). Real LLMs learn far richer patterns, but the next-word idea is the same:
```text Output of quickpath.py bigram (executed)
P(next | 'the') = {'support': 0.14, 'ticket': 0.29, 'team': 0.29, 'customer': 0.29}
greedy generation: the ticket . the ticket . the
```
Always picking the single most likely word ("greedy" decoding) loops: "the ticket . the ticket". This is why real systems sample with settings such as temperature (next lesson).
```python count next words (excerpt)
for a, b in zip(text, text[1:]):
    counts[a][b] += 1
```

## .NET (C#) example
The same bigram model in plain C#:
```cs Program.cs
var text = "the support team answers the ticket . the team closes the ticket . the customer thanks the team . the customer opens a ticket ."
    .Split(' ');
var counts = new Dictionary<string, Dictionary<string, int>>();
for (int i = 0; i < text.Length - 1; i++)
{
    if (!counts.TryGetValue(text[i], out var next)) counts[text[i]] = next = new();
    next[text[i + 1]] = next.GetValueOrDefault(text[i + 1]) + 1;
}
var afterThe = counts["the"];
int total = afterThe.Values.Sum();
foreach (var (word, n) in afterThe) Console.WriteLine($"P({word} | the) = {(double)n / total:F2}");
```
To call a real LLM from .NET, see [Calling an LLM](lesson:app-llm-api) and [Running models locally](lesson:llm-local).

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Next-token probability from counts (what "predict the next token" means)
**Where it is used:** the bigram model in this lesson, which estimates the next word from how often each word followed the current one.

```formula Next-word probability from counts
P(next | current) = times "next" followed "current" ÷ times "current" was followed by anything
```
P(next | current) reads "the probability of next, given current".

**In plain words:** among all the times the model saw the current word, what share were followed by this next word?

**Example 1: after "the".** In the lesson's tiny text, "the" is followed 7 times: support 1, ticket 2, team 2, customer 2. P(ticket | the) = 2 ÷ 7 = 0.29. P(support | the) = 1 ÷ 7 = 0.14.

**Example 2: a sum check.** All the probabilities for one starting word must add up to 1: 1/7 + 2/7 + 2/7 + 2/7 = 7/7 = 1. If your counts do not add up like this, a count is missing or double-counted. A real LLM does the same with a softmax over its whole vocabulary.

### Context window budget (adding up tokens)
**Where it is used:** deciding what fits in one request, because the prompt, the documents, the history and the answer share the same window.

```formula Context budget
room for the answer = window size - (instructions + documents + conversation history)
```
All values are counted in tokens.

**In plain words:** everything you send, plus the answer, must fit inside the window.

**Example 1: it fits.** Window 8,000 tokens. Instructions 500, documents 5,000, history 1,500 add up to 7,000. Room for the answer = 8,000 - 7,000 = 1,000 tokens.

**Example 2: it overflows.** Same window, but documents are 7,000 tokens. Total input = 500 + 7,000 + 1,500 = 9,000, which is 1,000 over the window. Your code must cut at least 1,000 tokens, and more if you want room for an answer.

## Maths behind it
- Probability and conditional probability (next-token prediction)
- Cross-entropy loss (pretraining objective)
- Transformers and attention
- Scaling laws (how quality grows with data and model size)

## Common mistakes
- Treating the model as a database of facts; it generates likely text.
- Pasting more text than the context window holds; the start gets cut off or ignored.
- Assuming the context window is unlimited; long inputs cost more and may be cut.
- Confusing embeddings (meaning as numbers) with tokens (text pieces).
- Assuming a bigger model always wins; smaller models are often good enough, faster and cheaper.

```diagram compare Why models make things up, and what helps
## Model alone | bad
- Generates likely-sounding text
- Does not look facts up
- Can hallucinate with confidence
## Model with grounding | output
- Real documents supplied (RAG)
- Outputs are checked
- People review important decisions
```

## Quick check
Q: What single task does pretraining teach?
A: Predicting the next token in text.

Q: Why can an LLM state something false with confidence?
A: It produces likely-sounding text; it does not check facts unless your system gives it sources and verifies output.

Q: What is the context window?
A: The maximum amount of text (prompt, documents, conversation and answer) the model can consider at once.
