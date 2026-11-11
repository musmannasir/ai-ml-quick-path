# From lesson 'app-multimodal' (apps). Code status: Conceptual (no model access in the build environment); C# not compiled (no .NET SDK)
import base64, os
from openai import OpenAI
client = OpenAI()   # or base_url=... for a local vision model
image_b64 = base64.b64encode(open("invoice.png", "rb").read()).decode()
reply = client.chat.completions.create(
    model=os.environ["VISION_MODEL"], temperature=0, response_format={"type": "json_object"},
    messages=[{"role": "user", "content": [
        {"type": "text", "text": 'Extract JSON with "invoice_number", "date" (YYYY-MM-DD) and "total". Use null if missing.'},
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}]}])
print(reply.choices[0].message.content)     # validate before use, as in the LLM API lesson
