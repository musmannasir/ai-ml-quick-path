---
id: llm-how
title: How large language models work
module: llm
level: Intermediate
minutes: 75
maths: basic arithmetic
goal: Explain pretraining, next-token prediction, context windows, instruction tuning, open-weight versus hosted models, and why LLMs sometimes make things up.
prereqs: dl-transformers
reviewed: 2026-11-02
updated: 2026-11-24
evidence: A one-page explanation, for a non-technical colleague, of how a chat assistant produces an answer and why it can be confidently wrong.
code: Python executed 2026-11-02 (quickpath.py bigram)
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

```visual Pick the next token, add it, repeat
file: next-token-loop
alt: The text The capital of France is with an empty slot at the end. A model box reads the text and produces a list of made-up chances for the next token: Paris 0.90, the 0.04, a 0.03, known 0.02. One is picked and placed in the slot, then the loop repeats.
caption: The model scores every possible next token, one is chosen and added to the text, and the loop repeats. The chances shown are made up.
```

```diagram bar What shares the context window
note: Illustrative proportions only. The real split changes with every request.
- Your prompt | 20 | input
- Documents | 40 | store
- Conversation | 25 | process
- Model's answer | 15 | output
```

```visual The context window shared by four things
file: context-desk
alt: Two horizontal bars. The first shows one request that fits within a limit line: your prompt 20 percent, documents 40, conversation 25 and the model's answer 15, all illustrative. The second shows a request that is too long: the end is cut off beyond the limit and labelled cut text, meaning the oldest or least useful text is removed and the model never sees it.
caption: Everything the model reads and writes in one request must fit in the context window. When it is too long, some text is cut and never seen. The percentages are illustrative.
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

```visual Three stages of building a model
file: three-stages
alt: Three rising steps joined by arrows. Step 1, pretraining: reads huge amounts of text and predicts the next token, learning grammar, facts and patterns of reasoning and code. Step 2, instruction tuning: learns from example questions and good answers, so it follows requests. Step 3, preference tuning: learns which answers people prefer, so it is helpful and safe.
caption: Each stage adds behaviour on top of the one before. Model builders do these stages; you mostly use the result.
```

```maths Next-token probability from counting
situation: In a tiny collection of text, the word "thank" appears 10 times. It is followed by "you" 8 times and by "goodness" 2 times.
find: After "thank", how likely is each next word?
step: Count how often "thank" was followed by anything | 8 + 2 = 10
step: Share of "you" | 8 ÷ 10 = 0.8 = 80%
step: Share of "goodness" | 2 ÷ 10 = 0.2 = 20%
result: After "thank": **"you" 80%**, "goodness" 20%.
why: A language model does one job: for the text so far, give a probability to every possible next token. This box does it by counting. A large language model does it with a neural network, so it can also handle text it has never seen, but the output has the same form: a list of probabilities that add up to 100%.
caution: This is a counting toy, not how a transformer computes. It also knows nothing about meaning: it would give the same answer after "No thank" and "Please thank".
try: You add more text in which "thank" is followed by "them" 10 times. What is the probability of "you" now?
answer: "thank" now appears 8 + 2 + 10 = 20 times, so "you" is 8 ÷ 20 = 0.4 = 40%. The data changed, so the probabilities changed. A model reflects the text it was trained on.
```

```maths A sentence as a chain of next-word chances
situation: A model has read "the cat" and has made-up chances for what comes next. The chance that the first word is "the" is 0.1. After "the", the chance of "cat" is 0.05. After "the cat", the chance of "sat" is 0.2.
find: How likely is the whole text "the cat sat"?
step: Chance of "the" then "cat" | 0.1 × 0.05 = 0.005
step: Multiply by the chance of "sat" after "the cat" | 0.005 × 0.2 = 0.001
result: The chance of the whole text is **0.001**, which is 1 in 1,000.
formula: P(w1 w2 w3) = P(w1) × P(w2 given w1) × P(w3 given w1 w2)
why: A language model never scores a whole sentence in one go. It gives one chance per next token, and the chance of a whole text is those chances multiplied. This is also why a long text has a tiny chance, and why programs add the logarithms of the chances instead of multiplying them: adding avoids numbers too small for a computer to store.
caution: These chances are made up for the example. Real models give a chance to every token in the vocabulary at every step.
try: Each of 3 words had chance 0.1 instead. What is the chance of the text?
answer: 0.1 × 0.1 × 0.1 = 0.001. The same total can come from different chances per word.
```

### Related concepts

#### Two phases: prefill and decode
When you send a prompt, the model works in two phases. **Prefill** reads the whole prompt at once and builds the stored keys and values (the KV cache). All prompt tokens can be processed side by side, so the computer is kept busy doing arithmetic: this phase is **compute-bound**, which means the arithmetic speed is the limit. **Decode** then writes the answer one token at a time. Each new token needs the model's weights and the cache to be read from memory again for very little arithmetic, so this phase is usually **memory-bound**, which means memory speed is the limit. Prefill decides how long you wait for the first token; decode decides how fast the rest of the answer streams.

```diagram flow Two phases of answering one request
note: Prefill runs once per request. Decode repeats once per new token.
- Prompt arrives | System message, history, documents and question | input
- Prefill | Reads all prompt tokens at once; builds the cache; limited by arithmetic speed | process
- First token | Time to first token ends here | output
- Decode | Writes one token per pass, reusing the cache; limited by memory speed | model
- Reply complete | Stops at an end-of-text token or the length limit | output
```

```visual Prefill, decode, TTFT and ITL on a timeline
file: prefill-decode
alt: A timeline. A wide box for prefill reads the whole prompt at once, then eight small boxes for decode, one token at a time. A bracket under prefill is time to first token, and a bracket between two decode boxes is inter-token latency.
caption: Prefill reads the prompt at once and sets the wait for the first token; decode writes one token at a time and sets the pace. The example times are made up.
```

#### The chat template
The model only reads one long list of tokens. A **chat template** is the fixed recipe that turns your separate messages (system, user, assistant) into that one list, using special marker tokens to show where each message starts and ends. Every model family has its own template, so use the one that comes with the model: a wrong template makes a good model answer badly. The markers below are made up to show the idea.

```text A made-up chat template
<|system|>  You summarise support emails.  <|end|>
<|user|>    My order has not arrived.       <|end|>
<|assistant|>
```

```diagram layers From messages to one token list
note: The markers are made up for illustration; real models use their own.
- Model continues from here | After the assistant marker, it writes the reply token by token | model
- Assistant marker | Tells the model it is now its turn | process
- User message | Wrapped in its own start and end markers | input
- System message | Rules, wrapped in its own start and end markers | input
```

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

## Live simulation
The model below is the same tiny Transformer used in the Transformers lesson (21 words, 8 numbers per word, one block). It is a toy, but the loop around it is the loop a large model runs.

```sim tf5 How a Transformer writes one word at a time
question: How does a Transformer write text one word at a time, and what does the cache save?
watch: Each step runs the text so far through the model. Only the scores for the last word are used, and they become chances for the next word.
watch: Temperature and top-k reshape the chances, exactly as in the token-generation simulation. Greedy picks the highest, sampling draws at random.
watch: The table counts "word passes". Without the cache every step runs all the earlier words again. With the cache, earlier words are kept, so each later step runs only the new word.
watch: The first step is the prefill: the whole starting text goes through at once. Every later step is a decode step: one new word, using the cache.
try: cache | Write a text to the end and read the two totals: the cache should save at least 5 word passes.
predict: A text has 6 words when the model chooses word 7. With no cache, how many words does it run through the model for that step? | Only the new word | All 6 words again | None
answer: 2 | The model has no memory between steps. Without a cache it processes the whole text again; with a cache it reuses the stored keys and values of the first 6 words and does the work only for the new one.
leaves-out: This toy model knows 21 words and a text of at most 8 words, so the cache saving is small. For a long text the saving is large, and the cache itself takes memory. The page counts word passes; it does not time anything.
reference: examples/sim-attention/attention_forward.py
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

```visual A model guessing and a model grounded in documents
file: grounding
alt: Two panels. On the left, the model alone answers a question about a refund policy with a confident date and no source, and may be wrong. On the right, the model is given a document, answers from it and cites it, and says it does not know when evidence is missing.
caption: A model alone writes likely-sounding text. Supplied documents, citations and checks make an answer something you can verify. The question and dates are made up.
```

## Quick check
Q: What single task does pretraining teach?
A: Predicting the next token in text.

Q: Why can an LLM state something false with confidence?
A: It produces likely-sounding text; it does not check facts unless your system gives it sources and verifies output.

Q: What is the context window?
A: The maximum amount of text (prompt, documents, conversation and answer) the model can consider at once.
