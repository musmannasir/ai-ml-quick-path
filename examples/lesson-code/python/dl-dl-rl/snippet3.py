# From lesson 'dl-rl' (dl). Code status: Python executed 2026-11-02 (ai_extras.py qlearn, gap_topics.py pg); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
Q[s, a] += alpha * (r + gamma * Q[s2].max() * (s2 != 4) - Q[s, a])
