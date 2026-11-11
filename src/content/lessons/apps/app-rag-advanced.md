---
id: app-rag-advanced
title: Advanced RAG: chunking, hybrid search, re-ranking and evaluation
module: apps
level: Advanced
minutes: 90
goal: Improve RAG quality with better chunking, hybrid keyword-plus-vector search, reciprocal rank fusion, re-ranking, query rewriting and metadata filters, and measure each change.
prereqs: app-rag
reviewed: 2026-11-02
evidence: A before-and-after table of retrieval hit rate (correct passage in top 5) on at least 30 questions for vector-only versus hybrid retrieval with re-ranking.
code: Python executed 2026-11-02 (quickpath.py chunking and hybrid); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
The model cannot cite a passage it never receives, so **retrieval quality decides RAG quality**. Five techniques fix most problems. **Chunking**: split by meaning (paragraphs or headings) rather than blindly every N words, add a little **overlap**, and put the document title in each chunk. **Hybrid search**: run **keyword search** (BM25 finds exact codes, names and rare words) and **vector search** (finds meaning) together and merge the lists, commonly with **reciprocal rank fusion (RRF)**, which rewards items ranked high in either list. **Re-ranking**: a slower, more accurate model re-scores the top 20–50 candidates. **Query rewriting**: an LLM turns a vague or conversational question into a clear search query, or into several sub-questions. **Metadata filters**: restrict by permission, product, region or date before ranking. Some teams also use knowledge graphs (**GraphRAG**) for questions about relationships. Measure every change with **retrieval** metrics (is the right passage in the top k?) and **answer** metrics (is the answer faithful to the sources?).

```diagram fan Five techniques that improve retrieval
note: The model cannot cite a passage it never receives.
- Retrieval quality | Decides RAG quality | input
- Chunking | Split by meaning, small overlap, title in each chunk | process
- Hybrid search | Keyword plus vector, merged | process
- Re-ranking | A slower, more accurate model re-scores candidates | model
- Query rewriting | An LLM makes the question a clear search query | model
- Metadata filters | Permission, product, region or date before ranking | warn
```

```diagram compare Fixed-size and meaning-based chunks
note: Output from the executed chunking demo on an 80-word policy.
## Fixed 25-word chunks | bad
- 4 chunks
- A cut can fall mid-rule, as in "Carry over. Up"
## Paragraph chunks | output
- 4 chunks, each starting with its heading
- Each rule stays whole
## Overlap | process
- 6 chunks | 25-word chunks with 10-word overlap
```

```diagram merge Hybrid search
note: Keyword search finds exact codes, names and rare words. Vector search finds meaning.
- Fused ranking | One merged list | output
- Keyword search | BM25 ranking | process
- Vector search | Ranking by meaning | model
```

```diagram flow Reciprocal rank fusion in words
note: Merge by rank, not by raw score, because the two scores are on different scales.
- Two ranked lists | One from keyword search, one from vector search | input
- Give each position a score | Higher rank gives a bigger score | process
- Add the scores per document | A document high in either list rises | process
- Sort | Highest total first | output
```

## Real-world example
A manufacturer's maintenance assistant must answer "error E-4021 on pump PX-7". Vector search returned general pump articles; keyword search found the exact error code. Hybrid search plus a re-ranker put the right procedure first, and the team proved it with a 60-question retrieval test.

## How it works
1. Chunk by structure; add titles; test chunk size on your evaluation set.
2. Store text, vectors, keyword index and metadata.
3. At query time: optionally rewrite the question; apply metadata filters.
4. Run keyword and vector search (top 20 each); merge with RRF.
5. Re-rank to the top 5; send those to the model.
6. Track retrieval hit rate and answer faithfulness for every change.

```diagram lanes Query time pipeline
note: Metadata filters apply before ranking. Retrieval metrics and answer metrics are measured separately.
## Retrieve
- Question | May be rewritten first | input
- Metadata filters | Permission, product, region, date | warn
- Keyword and vector search | Top 20 each | process
- Merge with RRF | By rank | process
## Answer and measure
- Re-rank | Down to the top 5 | model
- LLM answer | Uses only those 5 | model
- Retrieval hit rate | Is the right passage in the top k? | output
- Answer faithfulness | Does the answer match the sources? | output
```

```diagram flow Candidates shrink at each step
note: Counts are the example values from the steps above.
- Keyword search | Top 20 | process
- Vector search | Top 20 | process
- Merge with RRF | One list | process
- Re-ranker | Top 5 | model
- LLM | Answers from 5 passages | output
```

### Related concepts
- **Semantic search**: search by meaning using embeddings rather than exact words; the retrieval step of RAG.
- **HyDE** (hypothetical document embeddings): ask the model to write a fake answer first, then search with the embedding of that answer. It can help when questions are short and documents are long.

```diagram flow HyDE
- Short question | Hard to match to long documents | input
- Model writes a fake answer | A hypothetical document | model
- Embed the fake answer | Use that vector to search | process
- Real passages | Found by similarity | output
```

- **Agentic RAG**: an agent decides when to search, what to search for, and whether to search again after reading results. More flexible for complex questions, slower and harder to test than a fixed pipeline.

```diagram loop Agentic RAG
note: More flexible than a fixed pipeline, but slower and harder to test.
- Decide what to search for | The agent chooses | model
- Search | Retrieve passages | process
- Read the results | Are they enough? | model
loop: Search again until the evidence is enough
```

#### Chunking in more detail
A **chunk** is one passage that is embedded and retrieved as a unit. Too small and it loses the context that makes it meaningful. Too large and it mixes several topics, so its vector becomes vague and it fills the context window. Split along the document's own structure where you can, and test sizes on your evaluation set. Store the document title, section heading and page number with each chunk, so an answer can cite where it came from.

```diagram nest What one chunk carries
note: The same pieces are stored with every chunk.
- Document | Title, version, source | store
- Section | Heading, page number | process
- Chunk text | One passage, with a little overlap | output
```

#### Re-ranking
Search over the whole collection must be fast, so it compares the question and each passage separately. A **re-ranker** is a model that reads the question and one candidate passage together. It is slower but usually more accurate at judging relevance. So you run it only on the short list from search, then keep the best few.

```diagram compare First search and re-ranker
## First search | process
- Looks at the whole collection
- Fast, so it can be a little rough
## Re-ranker | model
- Looks only at the short list
- Reads the question and passage together
```

#### Query rewriting
Users type follow-ups such as "and for contractors?", which mean nothing on their own. **Query rewriting** asks a model to turn the question, with the conversation so far, into a stand-alone search query. You can also **expand** the query with alternative wordings, or **split** a compound question into sub-questions and search for each. HyDE, described above, is another rewriting trick. Rewrites can drift, so keep codes and names exactly and measure the effect.

```diagram fan One question becomes several searches
note: Results from all searches are merged, for example with RRF.
- Follow-up question | "And for contractors?" | input
- Stand-alone query | Adds the missing topic from the conversation | model
- Alternative wording | Another way to say the same thing | model
- Sub-question | One part of a compound question | model
```

#### Context packing
**Context packing** is choosing and arranging the retrieved chunks that go into the prompt. Remove duplicates and near-copies. Keep only chunks that fit the **context window** (the amount of text the model can read at once), and leave room for the answer. Models can pay less attention to the middle of a long prompt, so put the strongest evidence at the start and the end. Label each chunk with its source id so the answer can cite it.

```diagram layers Packing the prompt
note: Total size must fit the context window.
- Instructions | Answer only from the sources; cite ids | process
- Best evidence | Strongest chunks first, each with a source id | output
- Weaker evidence | Fewer, shorter chunks in the middle | store
- Next-best evidence | Another strong chunk near the end | output
- Question and room for the answer | Leave space for the reply | input
```

#### Parsing PDFs
Ingestion starts with getting text out of files, and bad parsing silently ruins retrieval. A **text PDF** contains real text that a parser can read. A **scanned PDF** is only pictures of pages, so it needs **OCR** (optical character recognition, software that reads text from images), which can make mistakes. Tables, headers, footers and multi-column layouts can scramble the reading order or repeat page furniture in every chunk. Keep page numbers and headings as metadata, and read a sample of parsed output by eye before indexing.

```diagram matrix Which PDFs need more care
x: Text PDF | Scanned PDF
y: Simple layout | Complex layout
- Usually fine | Read a sample to check
- Needs OCR | Check OCR errors on a sample
- Check table and column order | Tables and columns can scramble the text
- Hardest case | OCR plus layout problems; inspect closely
```

#### Re-indexing
The index goes stale. Documents change, you may choose a new embedding model, or you may change the chunking rules. **Re-indexing** means refreshing or rebuilding the index. For changed documents, update only those (an **incremental update**) and delete the chunks of documents that were removed, or they will still be retrieved. A new embedding model or new chunking rules need a full rebuild, because old and new vectors cannot be mixed. Keep versions of the index, and compare old and new on the evaluation set before switching.

```diagram loop Re-indexing cycle
note: Keep the old index until the new one has passed.
- Detect a change | Edited or removed documents, new model, new chunking rules | input
- Rebuild or update | Incremental for documents; full for a new model | process
- Evaluate old and new | Same evaluation set for both | model
- Switch | Only if the new index is no worse | output
loop: Repeat whenever something changes
```

#### Retrieval evals
A **retrieval eval** measures only whether the right chunk was found, not whether the final answer reads well. For each question in your evaluation set, record which chunk or document should be retrieved. Then check whether it appears in the top k results. If retrieval fails, no prompt can fix the answer. If retrieval succeeds but the answer is wrong, look at packing or the prompt.

```diagram lanes Two separate measurements
## Retrieval
- Evaluation question | With the known right chunk | input
- Search results | Top k chunks | process
- Hit or miss | Was the right chunk in the top k? | output
## Answer
- Retrieved chunks | Sent to the model | process
- Generated answer | Written from those chunks | model
- Answer check | Faithful and correct? | output
```

#### GraphRAG
**GraphRAG** builds a **graph** from your documents: the things they mention (entities such as people, products or places) as nodes, and the relationships between them as links. Retrieval can then follow connections, or use summaries of groups of related items, to answer questions about how things connect or what the whole collection is about. Building the graph takes extra effort and processing. It is only worth it when relationships matter. For plain look-up questions, ordinary RAG is simpler.

```diagram flow GraphRAG
note: More effort to build than ordinary RAG.
- Documents | The source text | input
- Extract entities and relationships | A model reads the text and lists them | model
- Build a graph | Entities as nodes, relationships as links | store
- Follow connections | Gather related facts for the question | process
- Answer | Written from the connected evidence | output
```

## Python example
Three ways to chunk the same 80-word policy:
```text Output of quickpath.py chunking (executed)
80 words | fixed 25-word chunks: 4 | example cut: ...'roportion to their hours. Carry over. Up'
paragraph chunks: 4 | each starts with a heading: ['Annual leave', 'Carry over', 'Requesting leave', 'Sick leave']
25-word chunks with 10-word overlap: 6
```
Fixed-size chunks cut a section in half ("Carry over. Up" ends one chunk). Paragraph chunks keep each rule whole with its heading.

Merging keyword and vector rankings with RRF (score = sum of 1 ÷ (60 + rank) over both lists):
```text Output of quickpath.py hybrid (executed)
query 'E-4021': keyword ['kb1', 'kb2', 'kb3', 'kb4'] | vector ['kb1', 'kb3', 'kb2', 'kb4'] | fused (RRF) ['kb1', 'kb2', 'kb3', 'kb4']
query "pump won't power up": keyword ['kb4', 'kb2', 'kb1', 'kb3'] | vector ['kb4', 'kb2', 'kb1', 'kb3'] | fused (RRF) ['kb4', 'kb2', 'kb1', 'kb3']
```
To run offline, this demo uses character patterns as a stand-in for an embedding model, so the two lists are similar; with a real embedding model, paraphrased questions ("machine running too hot") produce clearly different vector results, which is where hybrid search earns its place. The merge code is the same either way:
```python reciprocal rank fusion
rrf = collections.Counter()
for ranking in (keyword_ranking, vector_ranking):
    for position, doc_id in enumerate(ranking, 1):
        rrf[doc_id] += 1 / (60 + position)
fused = [d for d, _ in rrf.most_common()]
```

## .NET (C#) example
RRF and an LLM query rewriter in C#:
```cs HybridSearch.cs
using Microsoft.Extensions.AI;

public static class HybridSearch
{
    public static List<string> ReciprocalRankFusion(params IReadOnlyList<string>[] rankings)
    {
        var scores = new Dictionary<string, double>();
        foreach (var ranking in rankings)
            for (int i = 0; i < ranking.Count; i++)
                scores[ranking[i]] = scores.GetValueOrDefault(ranking[i]) + 1.0 / (60 + i + 1);
        return scores.OrderByDescending(kv => kv.Value).Select(kv => kv.Key).ToList();
    }

    public static async Task<string> RewriteQueryAsync(IChatClient chat, string conversation, string question)
    {
        var response = await chat.GetResponseAsync(
        [
            new(ChatRole.System, "Rewrite the user's last question as one short, self-contained search query. Keep codes and names exactly. Reply with the query only."),
            new(ChatRole.User, $"Conversation:\n{conversation}\n\nLast question: {question}"),
        ], new ChatOptions { Temperature = 0 });
        return response.Text.Trim();
    }
}
// var fused = HybridSearch.ReciprocalRankFusion(keywordIds, vectorIds).Take(20).ToList();  then re-rank the top 20.
```
For keyword search in .NET use your database's full-text search (PostgreSQL, SQL Server, Azure AI Search or Elasticsearch).

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Recall@k and MRR (did the right chunk come back, and how high)
**Where it is used:** evaluating a retriever or re-ranker on questions whose correct chunk is known.

```formula Recall@k and MRR
recall@k = questions with the right chunk in the top k ÷ total questions
MRR = average of (1 ÷ rank of the first right chunk)
```
Rank 1 is the top result. MRR means mean reciprocal rank. If the right chunk is missing, its score is 0.

**In plain words:** recall@k asks "was it in the top k?". MRR rewards putting it nearer the top.

**Example 1: recall@3.** Three questions. The right chunk is at rank 1, rank 3 and rank 8. Top 3 holds two of three, so recall@3 = 2 ÷ 3 = 0.67. Recall@10 = 3 ÷ 3 = 1.00.

**Example 2: MRR.** Same ranks: 1 ÷ 1 = 1, 1 ÷ 3 = 0.333, 1 ÷ 8 = 0.125. MRR = (1 + 0.333 + 0.125) ÷ 3 = 1.458 ÷ 3 = 0.486.

### Reciprocal rank fusion (mixing keyword and vector results)
**Where it is used:** hybrid search, to merge two ranked lists into one.

```formula Reciprocal rank fusion
score of a chunk = sum over lists of 1 ÷ (60 + rank in that list)
```
60 is a common smoothing constant. A chunk missing from a list adds nothing for it.

**In plain words:** chunks that rank well in both lists get the highest combined score.

**Example 1: in both lists.** Chunk A is rank 1 in keyword and rank 3 in vector: 1 ÷ 61 + 1 ÷ 63 = 0.01639 + 0.01587 = 0.03227. Chunk B is rank 2 in keyword and rank 1 in vector: 1 ÷ 62 + 1 ÷ 61 = 0.01613 + 0.01639 = 0.03252. B wins.

**Example 2: in one list only.** Chunk C is rank 2 in vector only: 1 ÷ 62 = 0.01613. That is below both A and B.

### Chunk overlap (how many chunks you get)
**Where it is used:** the chunking step, where neighbouring chunks share some tokens so ideas are not cut in half.

```formula Number of chunks
step = chunk size - overlap
chunks = round up of (document tokens - overlap) ÷ step
```
Sizes are in tokens. This holds when the document is at least one chunk long.

**In plain words:** more overlap means more chunks and more stored text.

**Example 1: with overlap.** 1,000 tokens, chunk size 200, overlap 50. Step = 150. Chunks = round up of 950 ÷ 150 = 6.33, so 7 chunks. Stored tokens up to 7 × 200 = 1,400.

**Example 2: no overlap.** Same document, overlap 0. Step = 200. Chunks = 1,000 ÷ 200 = 5 exactly. Overlap cost 2 more chunks here.

## Maths behind it
- BM25 (probabilistic information retrieval)
- Cosine similarity of embeddings
- Reciprocal rank fusion
- Cross-encoder re-ranking
- Retrieval metrics: recall@k, mean reciprocal rank

## Common mistakes
- Merging raw keyword and vector scores, which are on different scales; merge by rank instead.
- Changing chunk size, embedding model and prompt at once, so you cannot tell what helped.
- Only measuring final answers; measure retrieval separately to find where failures start.
- Trusting PDF parsing without looking: scrambled columns, repeated footers or bad OCR silently ruin retrieval.
- Never re-indexing, so changed or deleted documents are still retrieved, or mixing old and new embedding vectors.
- Stuffing in too many chunks: duplicates and weak evidence crowd out the best chunks and the room for the answer.

```diagram compare Changing and measuring
## Risky | bad
- Chunks, model and prompt changed together
- Only the final answer is measured
- Raw keyword and vector scores merged
## Better | output
- One change at a time
- Retrieval and answers measured separately
- Lists merged by rank
```

## Quick check
Q: Why combine keyword and vector search?
A: Keyword search finds exact codes and rare terms; vector search finds meaning. Together they miss less.

Q: How does reciprocal rank fusion score a document?
A: It adds 1 ÷ (60 + rank) from each list, so documents ranked high in any list rise to the top.

Q: What does a re-ranker do?
A: It re-scores a short list of candidates with a slower, more accurate model before they go to the LLM.

Q: Why compare an old and a new index on the evaluation set before switching?
A: A rebuild with a new model or new chunking rules can make some questions worse; the evaluation set shows this before users see it.

Q: Why measure retrieval separately from the final answer?
A: If the right chunk is never found, no prompt can fix the answer, so you need to know which stage failed.
