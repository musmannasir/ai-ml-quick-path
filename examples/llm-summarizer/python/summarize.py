"""Support-email summarizer using any OpenAI-compatible Chat Completions endpoint.

Runtime prerequisites: Python 3.10+, `pip install openai>=1.40`.
Configuration (environment variables, never source code):
  LLM_API_KEY   API key for your provider
  LLM_MODEL     model name offered by your provider
  LLM_BASE_URL  optional, for OpenAI-compatible servers (for example a local Ollama:
                http://localhost:11434/v1)
Run:  python summarize.py           (calls the model)
      python summarize.py --offline (validates the sample output only; no network)
Only send emails you have permission to process. Remove personal data you do not need.
"""
import os
import sys

from summary_schema import SummaryValidationError, parse_summary

EMAIL = """Subject: Order 55812 arrived damaged
Hi, my order arrived yesterday and the glass panel of the cabinet is cracked.
I need it for a client visit next Tuesday. Can you send a replacement quickly?
Thanks, Dana"""

SYSTEM = (
    "You summarize customer support emails. Reply with JSON only, using exactly these keys: "
    '"summary" (one sentence), "priority" (one of "low", "medium", "high"), '
    '"next_action" (one sentence for the support agent). Do not invent order details.'
)

SAMPLE_OUTPUT = ('{"summary": "Customer received order 55812 with a cracked glass panel and needs a '
                 'replacement before a client visit next Tuesday.", "priority": "high", '
                 '"next_action": "Confirm the damage with a photo and arrange express replacement shipping."}')


def call_model(email: str) -> str:
    from openai import OpenAI  # imported here so --offline works without the package

    client = OpenAI(api_key=os.environ["LLM_API_KEY"], base_url=os.environ.get("LLM_BASE_URL"))
    response = client.chat.completions.create(
        model=os.environ["LLM_MODEL"],
        messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": email}],
        response_format={"type": "json_object"},   # supported by many, not all, providers
        temperature=0,
        timeout=30,
    )
    return response.choices[0].message.content or ""


def main() -> None:
    raw = SAMPLE_OUTPUT if "--offline" in sys.argv else call_model(EMAIL)
    try:
        result = parse_summary(raw)
    except SummaryValidationError as err:
        print(f"Rejected model output: {err}")   # retry once, then route to a person
        sys.exit(1)
    print(f"summary:     {result.summary}")
    print(f"priority:    {result.priority}")
    print(f"next_action: {result.next_action}")


if __name__ == "__main__":
    main()
