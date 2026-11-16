# From lesson 'llm-design' (llm). Code status: Python executed 2026-11-02 (quickpath.py llm_size)
def params(vocab, d, layers, ctx):
    return vocab * d + ctx * d + layers * 12 * d * d     # embeddings + positions + transformer blocks
