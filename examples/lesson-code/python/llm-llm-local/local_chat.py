# From lesson 'llm-local' (llm). Code status: Python memory arithmetic executed 2026-11-02 (memory_estimate.py); local model calls not run (no model runner in the build environment); C# not compiled (no .NET SDK)
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="not-needed-locally")
reply = client.chat.completions.create(model="llama3.2",
        messages=[{"role": "user", "content": "Explain RAG in two sentences."}], temperature=0)
print(reply.choices[0].message.content)
