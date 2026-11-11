# From lesson 'llm-how' (llm). Code status: Python executed 2026-11-02 (quickpath.py bigram); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
for a, b in zip(text, text[1:]):
    counts[a][b] += 1
