# From lesson 'llm-how' (llm). Code status: Python executed 2026-11-02 (quickpath.py bigram)
for a, b in zip(text, text[1:]):
    counts[a][b] += 1
