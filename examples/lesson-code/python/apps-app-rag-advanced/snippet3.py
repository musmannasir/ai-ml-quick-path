# From lesson 'app-rag-advanced' (apps). Code status: Python executed 2026-11-02 (quickpath.py chunking and hybrid); C# not compiled (no .NET SDK in the build environment)
rrf = collections.Counter()
for ranking in (keyword_ranking, vector_ranking):
    for position, doc_id in enumerate(ranking, 1):
        rrf[doc_id] += 1 / (60 + position)
fused = [d for d, _ in rrf.most_common()]
