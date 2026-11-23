# From lesson 'dl-rl' (dl). Code status: Python executed 2026-11-02 (ai_extras.py qlearn, gap_topics.py pg); added technique snippets (2026-11-05) not run
Q[s, a] += alpha * (r + gamma * Q[s2].max() * (s2 != 4) - Q[s, a])
