# From lesson 'llm-design' (llm). Code status: Python executed 2026-11-02 (quickpath.py llm_size); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
def params(vocab, d, layers, ctx):
    return vocab * d + ctx * d + layers * 12 * d * d     # embeddings + positions + transformer blocks
