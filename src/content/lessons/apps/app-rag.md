---
id: app-rag
title: RAG: answering from your own documents
module: apps
level: Intermediate
minutes: 120
goal: Build a retrieval-augmented generation (RAG) system that checks permissions, retrieves evidence, answers with citations, says "I don't know" when evidence is missing, and is measured with an evaluation set.
prereqs: app-embeddings, app-prompting
reviewed: 2026-11-02
evidence: A working RAG assistant in Python or C# that passes an evaluation set of answerable, unanswerable and forbidden questions, with failures explained.
code: Python executed 2026-11-02 (examples/rag-leave-policy/rag_leave_policy.py, offline with TF-IDF standing in for embeddings); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
**Retrieval-augmented generation (RAG)** answers a question by first **finding** relevant passages in your own documents and then asking the model to answer **using only those passages**, with **citations**. The model's weights do not change; the knowledge lives in documents you can update, delete and protect. That makes RAG the standard choice for company policies, manuals, contracts and knowledge bases. RAG has two halves. **Ingestion**: split documents into **chunks**, embed them, and store them with metadata (source, version, who may read it). **Answering**: check who is asking, retrieve only chunks that person may read, put them into the prompt, generate an answer that cites chunk ids, and refuse politely when the best evidence is weak. You then **evaluate** with three kinds of questions: answerable, unanswerable, and forbidden for this user.

```diagram lanes The two halves of RAG
note: The model's weights never change. The knowledge lives in documents you can update, delete and protect.
## Ingestion
- Documents | Policies, manuals, contracts | input
- Chunks | Passages with ids | process
- Embed | One vector per chunk | model
- Index | Vectors with text and metadata: source, version, who may read | store
## Answering
- Question and user | Who is asking | input
- Allowed chunks only | Filter by the user's roles | warn
- Retrieve | Top few by similarity | process
- Prompt | Chunks plus the question | process
- Answer with citations | Chunk ids, or "I don't know" | output
```

```diagram fan Three kinds of evaluation question
- Evaluation set | Run on every release | input
- Answerable | Known source; the answer should cite it | output
- Unanswerable | The documents are silent; the answer should be "I don't know" | warn
- Forbidden | This user may not read the source; nothing should leak | bad
```

## Real-world example
Employees ask "How many leave days do I get?". HR policies are long, change yearly and include confidential sections (salary bands). A RAG assistant answers from the current policy with a link to the paragraph, never shows HR-only documents to other staff, and sends people to HR when the policy is silent. The [Morgan Stanley case](case:morgan-stanley) describes the same pattern for financial advisors.

## How it works
1. **Chunk:** split policies into passages with ids such as `leave-policy#1`.
2. **Index:** embed chunks; store vectors with `allowed_roles`.
3. **Check access first:** filter chunks by the user's roles before ranking.
4. **Retrieve:** rank allowed chunks by similarity; keep the top few.
5. **Decide:** below a similarity threshold, answer "I can't find this; please contact HR".
6. **Generate:** prompt the model to answer only from the chunks and cite their ids.
7. **Evaluate:** answerable, unanswerable and forbidden questions, every release.

```diagram flow The answering path in order
note: Access is checked before ranking, so restricted text never reaches the model.
- Check access first | Keep only chunks the user's roles allow | warn
- Retrieve | Rank allowed chunks; keep the top few | process
- Decide | Below the similarity threshold: "I can't find this; please contact HR" | warn
- Generate | Answer only from the chunks and cite their ids | model
- Evaluate | Answerable, unanswerable and forbidden questions | output
```

### Related concepts

#### Citations
A **citation** points from a claim in the answer to the passage that supports it. Each chunk goes into the prompt with its id, and the model is told to cite those ids. The page can then show the source title, section or page, so the reader can check the claim. Citations make answers checkable, but a model can cite the wrong id, so verify that each cited chunk was really retrieved and supports the claim.

```diagram flow From chunk id to citation
- Chunk with an id | For example leave-policy#2 | store
- Prompt lists the chunk | Id shown before the text | process
- Answer cites the id | In square brackets | model
- Show the source | Title and page from the metadata | output
```

#### Hallucination checks
A **hallucination** is a statement the model makes that the sources do not support. A **hallucination check** compares each claim in the answer with the retrieved text. If a claim has no support, remove it or refuse to answer. This is best done with the evaluation set; see [Evaluating AI systems](lesson:app-evals).

```diagram fan Checking an answer against its sources
- Draft answer | Split into separate claims | input
- Supported | The retrieved text backs the claim: keep it | output
- Not supported | No evidence: remove it | warn
- No support at all | Refuse: "I don't know" | bad
```

```diagram compare Where to enforce permissions
## Ask the model not to reveal | bad
- Restricted text is already in the prompt
- It can leak through answer or injection
## Filter before ranking | output
- Restricted chunks are never retrieved
- The model never sees them
```

## Python example
This runs offline: TF-IDF vectors stand in for embeddings and the "answer" is the best passage, so you can see retrieval behaviour without an API key.
```python access check before ranking (excerpt)
allowed = [(c, float(s)) for c, s in zip(self.chunks, scores) if role in c.allowed_roles]
allowed.sort(key=lambda pair: pair[1], reverse=True)
```
```text Evaluation output (executed)
[FAIL] (employee) How many leave days do I get? -> leave-policy#2 (score 0.34)
[PASS] (employee) Can I carry over unused holiday days? -> leave-policy#2 (score 0.43)
[FAIL] (employee) How far in advance must I request leave? -> None (score 0.20)
[PASS] (employee) How long is paid parental leave? -> parental-leave#1 (score 0.67)
[PASS] (employee) What is the salary band for level 5 engineers? -> None (score 0.00)
[PASS] (hr) What is the salary band for level 5 engineers? -> hr-salary-bands#1 (score 0.52)
[PASS] (employee) What is the office wifi password? -> None (score 0.00)
Passed 5/7
```
The two failures are real and useful: keyword matching preferred the carry-over chunk (it says "leave days" twice) over the chunk that answers the question, and one question fell just under the threshold. The permission and "don't know" cases pass: an employee never sees the salary chunk. A real embedding model, hybrid search and a re-ranker (next lesson) are the fixes, and the evaluation set is how you prove they worked. The prompt the script builds for the model:
```text Prompt
Answer using ONLY the sources below. Cite source ids in square brackets.
If the sources do not contain the answer, say you don't know.
Sources:
[leave-policy#2] Carry over: up to 5 unused annual leave days can be carried ...
[leave-policy#3] Requesting leave: submit requests in the HR portal ...
Question: How many leave days do I get?
```

## .NET (C#) example
A compact end-to-end RAG service with Microsoft.Extensions.AI (any `IChatClient` and `IEmbeddingGenerator`, hosted or local):
```cs RagService.cs
using System.Numerics.Tensors;
using Microsoft.Extensions.AI;

public record Chunk(string Id, string Text, string[] AllowedRoles, ReadOnlyMemory<float> Vector);

public class RagService(IChatClient chat, IEmbeddingGenerator<string, Embedding<float>> embedder, List<Chunk> index)
{
    private const float MinScore = 0.35f;     // tune on your evaluation set

    public static async Task<List<Chunk>> IngestAsync(IEmbeddingGenerator<string, Embedding<float>> embedder,
        IEnumerable<(string Id, string Text, string[] Roles)> passages)
    {
        var list = passages.ToList();
        var vectors = await embedder.GenerateAsync(list.Select(p => p.Text));
        return list.Zip(vectors, (p, v) => new Chunk(p.Id, p.Text, p.Roles, v.Vector)).ToList();
    }

    public async Task<string> AskAsync(string question, string userRole)
    {
        var q = await embedder.GenerateVectorAsync(question);
        var hits = index.Where(c => c.AllowedRoles.Contains(userRole))                 // permissions BEFORE ranking
                        .Select(c => (c, score: TensorPrimitives.CosineSimilarity(c.Vector.Span, q.Span)))
                        .OrderByDescending(h => h.score).Take(3).ToList();
        if (hits.Count == 0 || hits[0].score < MinScore)
            return "I can't find this in the documents you can access. Please contact HR.";

        string sources = string.Join("\n", hits.Select(h => $"[{h.c.Id}] {h.c.Text}"));
        var response = await chat.GetResponseAsync(
        [
            new(ChatRole.System, "Answer using ONLY the sources. Cite source ids in square brackets. If the sources do not contain the answer, say you don't know."),
            new(ChatRole.User, $"Sources:\n{sources}\n\nQuestion: {question}"),
        ], new ChatOptions { Temperature = 0 });
        return response.Text;
    }
}
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Context budget (how many chunks fit in the prompt)
**Where it is used:** choosing k, the number of retrieved chunks passed to the model with the question.

```formula Prompt size
prompt tokens = k × tokens per chunk + question tokens + instruction tokens
prompt tokens must be at most the context window
```
The 4,000-token window below is a made-up size.

**In plain words:** each extra chunk adds context but uses up room.

**Example 1: it fits.** k = 4, 300 tokens per chunk, question 50, instructions 150. Total = 1,200 + 50 + 150 = 1,400. Room left = 4,000 - 1,400 = 2,600.

**Example 2: too many chunks.** k = 10, 500 tokens per chunk: 5,000 + 200 = 5,200, which is 1,200 over. Try k = 7: 3,500 + 200 = 3,700, which fits.

### Hit rate with a margin of error (does retrieval find the answer?)
**Where it is used:** testing whether the right chunk appears in the top k for a set of known questions.

```formula Hit rate and interval
hit rate = questions with the right chunk in top k ÷ total questions
margin ≈ 1.96 × sqrt( hit rate × (1 - hit rate) ÷ n )
```
n is the number of test questions. Keep the interval between 0 and 1.

**In plain words:** with few test questions the score is uncertain, so show the margin.

**Example 1: 20 questions.** 18 hits, so hit rate = 0.90. Margin = 1.96 × sqrt(0.09 ÷ 20) = 1.96 × 0.0671 = 0.13. Range 0.77 to 1.00 (the top is capped at 1).

**Example 2: 50 questions.** 45 hits, hit rate = 0.90 again. Margin = 1.96 × sqrt(0.09 ÷ 50) = 1.96 × 0.0424 = 0.083. Range 0.82 to 0.98, tighter.

## Maths behind it
- Embeddings and cosine similarity (linear algebra)
- Nearest-neighbour search
- Information retrieval metrics: recall@k, precision@k
- Thresholds and calibration (statistics)

## Common mistakes
- Telling the model "don't reveal restricted text" instead of never retrieving it.
- Answering even when the best match is weak, which produces confident wrong answers.
- Fine-tuning to "teach" policies that change every year.
- No evaluation set, so nobody knows whether a change helped.
- Showing citations without checking that the cited chunk supports the claim.
- Skipping a hallucination check, so unsupported claims reach the user.

```diagram matrix What the system should do with weak or restricted evidence
x: Evidence is strong | Evidence is weak
y: User may read it | User may not read it
- Answer with citations | Strong evidence the user may read
- Say "I don't know" | Weak evidence: route the user to a person
- Never retrieved | Restricted chunks are filtered out before ranking
- Still never retrieved | The permission filter runs before any score is used
```

## Quick check
Q: Why filter by permissions before ranking instead of instructing the model?
A: Anything in the prompt can leak through the answer or prompt injection; restricted text must never reach the model.

Q: What should happen when the best similarity is below the threshold?
A: Return a clear "I don't know" with a route to a person, instead of generating an unsupported answer.

Q: Which three kinds of questions belong in a RAG evaluation set?
A: Answerable questions with known sources, unanswerable questions, and questions the user is not allowed to have answered.

Q: What should you do with an answer claim that the retrieved text does not support?
A: Remove it, or refuse to answer if nothing is supported.
