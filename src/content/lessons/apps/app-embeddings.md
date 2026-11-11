---
id: app-embeddings
title: Embeddings and vector search
module: apps
level: Intermediate
minutes: 75
goal: Explain embeddings, find similar text by cosine similarity, and store and search vectors in a vector database from Python and C#.
prereqs: app-llm-api, dl-sequences
reviewed: 2026-11-02
evidence: Twenty passages embedded with a real embedding model, five differently worded questions, and the rank of the correct passage for each.
code: Python cosine demo executed 2026-11-02 (applied_basics.py cosine); embedding-model calls and C# not run (no model or .NET SDK in the build environment)
---
## In plain words
An **embedding** is a list of numbers (a vector) that represents the **meaning** of a piece of text, an image or a product. An embedding model is trained so that similar meanings get similar vectors: "vacation days" and "annual leave" end up close even though they share no words. **Cosine similarity** measures how close two vectors point (1 means same direction, 0 unrelated). **Vector search** embeds all your passages once, stores them, embeds each question, and returns the passages with the highest similarity. A **vector database** (pgvector in PostgreSQL, Azure AI Search, Qdrant, Elasticsearch and others) stores vectors with their text and metadata, and uses **approximate nearest-neighbour (ANN)** indexes such as **HNSW** to search millions of vectors quickly. Always embed questions and documents with the **same model**.

```diagram flow Text becomes a vector
note: Real vectors have hundreds or thousands of numbers.
- Text | For example "vacation days" | input
- Embedding model | Trained so similar meanings get similar vectors | model
- Vector | A list of numbers that represents the meaning | output
```

```diagram compare Close and far in meaning
note: Toy 3-number vectors from the executed demo below. 1 means the same direction, 0 means unrelated.
## Close | output
- "vacation days" and "annual leave policy" | 0.984 although they share no words
- "vacation days" and "vacation days" | 1.000
## Far | bad
- "vacation days" and "printer is jammed" | 0.170
```

```diagram layers What a vector database holds
- Vector | The numbers for each passage | store
- Text | The passage itself | store
- Metadata | Source, permissions, date, used for filtering | store
- ANN index | Approximate nearest-neighbour index such as HNSW for fast search over millions of vectors | process
```

```diagram lanes Embed once, then search for every question
note: Both lanes must use the same embedding model.
## Prepare once
- Documents | Your passages | input
- Embed each passage | With the embedding model | model
- Store | Vector, text and metadata | store
## For each question
- Question | The user's words | input
- Embed the question | Same model | model
- Search | Highest similarity, filtered by metadata | process
- Top passages | Returned with their text | output
```

## Real-world example
An IT help desk wants "my laptop won't connect to wifi" to find the article "Troubleshooting wireless network access". Keyword search misses it; vector search finds it because the meanings are close.

## How it works
1. Choose an embedding model (hosted API or a local model).
2. Split documents into passages; embed each; store vector + text + metadata (source, permissions, date).
3. Embed the user's question with the same model.
4. Find the most similar passages (top k), filtered by metadata.
5. Measure: for real questions, is the right passage in the top 3?

```diagram compare Keyword search and vector search
note: For the help-desk example above.
## Keyword search | bad
- Looks for the same words
- Misses the wireless article | "my laptop won't connect to wifi" shares no words with it
## Vector search | output
- Compares meaning
- Finds the article because the meanings are close
```

```diagram flow Retrieval steps
- Choose a model | Hosted API or local model | model
- Embed passages | Split documents first | process
- Store | Vector, text and metadata | store
- Embed the question | Same model | model
- Top k, filtered | Most similar passages the user may see | process
- Measure | Is the right passage in the top 3? | output
```

### Related concepts

#### Embedding models
An **embedding model** is a trained model that turns text into a vector. Different models make different vectors, so vectors from two models cannot be compared. To choose one, consider which languages your documents use, the length of text it accepts, how many numbers each vector has (which affects storage), whether it is hosted or runs locally, and cost. Then test two or three candidates on your own questions. Whatever you choose, embed documents and questions with that same model. If you change it later, you must re-embed everything.

```diagram fan Choosing an embedding model
note: Test candidates on your own questions before deciding.
- Your embedding model | One model for documents and questions | model
- Languages | Does it handle the languages you have? | process
- Text length | How much text can it take at once? | process
- Hosted or local | Data rules, cost and speed | warn
- Your own test | Is the right passage found? | output
```

#### Vector databases
A **vector database** stores vectors together with their text and metadata, and is built to find the nearest vectors quickly. Instead of comparing the question with every vector, it uses an **approximate nearest-neighbour (ANN)** index, which gives very close answers much faster than checking everything. It also applies metadata filters and handles inserts, updates and deletes.

```diagram flow What a vector database does for a query
- Query vector | The embedded question | input
- Metadata filter | Keep only allowed rows | warn
- ANN index | Jump to likely neighbours instead of scanning all | process
- Top k rows | Vector, text and metadata | output
```

#### pgvector
**pgvector** is an extension for the PostgreSQL database. It adds a vector column type and similarity search. Teams that already run PostgreSQL can keep vectors beside their other data, in the same tables, with the same backups, access control and queries. A dedicated vector database may still be chosen when vector search is the main workload, or when you need features that a general database lacks. Compare both on your own data and your own questions.

```diagram nest Vectors inside PostgreSQL
note: One system holds both kinds of data.
- PostgreSQL | The database you already run | store
- Table of passages | Text, source, permissions, date | store
- Vector column | Added by pgvector, with a similarity index | model
```

#### Metadata filters
**Metadata** is information about a passage rather than its text: source, date, language, permissions or product. A **metadata filter** limits the search to passages that match, for example only the current product, in the user's language, that the user may read. Filtering can happen before the vector search or during it. Permission filters must never be left to the model, so apply them in the search itself.

```diagram compare Without and with metadata filters
## No filter | bad
- Old versions and other products compete
- Restricted passages can be returned
## With filter | output
- Only matching source, date, language and product
- Only passages this user may read
```

## Python example
Toy 3-number vectors (real ones have hundreds or thousands of numbers):
```text Output of applied_basics.py cosine (executed)
cos('vacation days', 'annual leave policy') = 0.984
cos('vacation days', 'vacation days') = 1.000
cos('vacation days', 'printer is jammed') = 0.170
```
With a real embedding model through an OpenAI-compatible API (local Ollama here):
```python embed_search.py (requires openai and a running embedding model)
import numpy as np
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="not-needed-locally")
def embed(texts): return np.array([d.embedding for d in client.embeddings.create(model="all-minilm", input=texts).data])
docs = ["Annual leave: 25 days per year", "Printer setup guide", "Wireless network troubleshooting"]
D = embed(docs); q = embed(["my laptop won't connect to wifi"])[0]
scores = D @ q / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))
print(docs[int(scores.argmax())])
```

## .NET (C#) example
`IEmbeddingGenerator` from Microsoft.Extensions.AI plus fast cosine similarity from `System.Numerics.Tensors`:
```cs Program.cs
using System.Numerics.Tensors;
using Microsoft.Extensions.AI;
using OllamaSharp;

IEmbeddingGenerator<string, Embedding<float>> embedder = new OllamaApiClient(new Uri("http://localhost:11434"), "all-minilm");

string[] docs = { "Annual leave: 25 days per year", "Printer setup guide", "Wireless network troubleshooting" };
var docVectors = await embedder.GenerateAsync(docs);
var question = await embedder.GenerateVectorAsync("my laptop won't connect to wifi");

var best = docs.Zip(docVectors, (text, e) => (text, score: TensorPrimitives.CosineSimilarity(e.Vector.Span, question.Span)))
               .OrderByDescending(x => x.score).First();
Console.WriteLine($"{best.text} ({best.score:F3})");
```
Method names have changed between package versions (older versions call it `GenerateEmbeddingVectorAsync`); check the version you install. For storage, use `Microsoft.Extensions.VectorData` connectors or PostgreSQL with pgvector through Npgsql.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Cosine similarity (how close two meanings are)
**Where it is used:** vector search, to score how close a question embedding is to each stored chunk embedding.

```formula Cosine similarity
cosine = (a1×b1 + a2×b2 + ... + an×bn) ÷ (length of a × length of b)
length of a = sqrt(a1^2 + a2^2 + ... + an^2)
```
a and b are two embeddings (lists of numbers). The top part is the dot product.

**In plain words:** it measures the angle between two vectors. 1 means the same direction (similar meaning), 0 means unrelated, -1 means opposite.

**Example 1: similar texts.** Tiny embeddings a = (3, 4) and b = (4, 3). Dot product = 3×4 + 4×3 = 24. Lengths: sqrt(9 + 16) = 5 and sqrt(16 + 9) = 5. Cosine = 24 ÷ (5 × 5) = 24 ÷ 25 = 0.96, so very close.

**Example 2: unrelated texts.** a = (1, 0) and b = (0, 2). Dot product = 1×0 + 0×2 = 0. Cosine = 0 ÷ (1 × 2) = 0, so no similarity.

### Index size (how much memory the vectors need)
**Where it is used:** planning how many chunks a vector store can hold before you need a bigger machine or an approximate index.

```formula Memory for stored vectors
bytes = number of chunks × dimensions × bytes per number
```
A 32-bit float uses 4 bytes. Dimensions is the length of each embedding.

**In plain words:** multiply how many vectors you have by how long each one is, then by the size of one number.

**Example 1: a small help centre.** 100,000 chunks × 384 dimensions × 4 bytes = 153,600,000 bytes, about 153.6 MB.

**Example 2: a large archive.** 1,000,000 chunks × 1,536 dimensions × 4 bytes = 6,144,000,000 bytes, about 6.1 GB. That is 40 times more memory, so size choices matter.

## Maths behind it
- Vectors and vector spaces (linear algebra)
- Dot product and cosine similarity
- Approximate nearest-neighbour search (HNSW graphs)
- Contrastive learning (how embedding models are trained)

## Common mistakes
- Embedding documents with one model and questions with another.
- Relying on vectors alone for exact codes and names (combine with keyword search; see [Advanced RAG](lesson:app-rag-advanced)).
- Storing vectors without permission metadata, so you cannot filter what each user may see.
- Changing the embedding model without re-embedding every stored passage.
- Choosing a model or a database by reputation instead of testing it on your own questions.

```diagram compare Mixing embedding models
## Different models | bad
- Documents embedded with model A
- Questions embedded with model B
- Vectors do not line up, so results are poor
## Same model | output
- Documents and questions both use model A
- Similar meanings get similar vectors
```

## Quick check
Q: Why can vector search find "annual leave" for a question about "vacation days"?
A: Embeddings represent meaning, so different words with similar meaning get close vectors.

Q: What does a vector database add over a simple list?
A: Fast approximate search over millions of vectors, plus storage of text and metadata for filtering.

Q: What must stay the same for documents and questions?
A: The embedding model.

Q: Why might a team choose pgvector?
A: It adds vector search to PostgreSQL, so vectors can live beside the team's other data without a new system to run.
