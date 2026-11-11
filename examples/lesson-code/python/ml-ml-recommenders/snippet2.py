# From lesson 'ml-recommenders' (ml). Code status: Python executed 2026-11-02 (gap_topics.py recsys); C# not compiled (no .NET SDK in the build environment)
err = full[u, i] - (mu + bu[u] + bi[i] + U[u] @ V[i])
U[u], V[i] = U[u] + 0.02 * (err * V[i] - 0.05 * U[u]), V[i] + 0.02 * (err * U[u] - 0.05 * V[i])
