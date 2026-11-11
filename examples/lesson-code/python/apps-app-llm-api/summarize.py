# From lesson 'app-llm-api' (apps). Code status: Python validator executed 2026-11-02 (examples/llm-summarizer/python, offline mode and 4 unit tests); live model calls and C# not run (no API key, no .NET SDK in the build environment)
response = client.chat.completions.create(
    model=os.environ["LLM_MODEL"],
    messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": email}],
    response_format={"type": "json_object"}, temperature=0, timeout=30)
result = parse_summary(response.choices[0].message.content or "")   # raises on invalid output
