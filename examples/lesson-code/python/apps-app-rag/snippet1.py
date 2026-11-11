# From lesson 'app-rag' (apps). Code status: Python executed 2026-11-02 (examples/rag-leave-policy/rag_leave_policy.py, offline with TF-IDF standing in for embeddings); C# not compiled (no .NET SDK in the build environment)
allowed = [(c, float(s)) for c, s in zip(self.chunks, scores) if role in c.allowed_roles]
allowed.sort(key=lambda pair: pair[1], reverse=True)
