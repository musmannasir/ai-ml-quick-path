# From lesson 'app-embeddings' (apps). Code status: Python cosine demo executed 2026-11-02 (applied_basics.py cosine); embedding-model calls and C# not run (no model or .NET SDK in the build environment)
import numpy as np
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="not-needed-locally")
def embed(texts): return np.array([d.embedding for d in client.embeddings.create(model="all-minilm", input=texts).data])
docs = ["Annual leave: 25 days per year", "Printer setup guide", "Wireless network troubleshooting"]
D = embed(docs); q = embed(["my laptop won't connect to wifi"])[0]
scores = D @ q / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))
print(docs[int(scores.argmax())])
