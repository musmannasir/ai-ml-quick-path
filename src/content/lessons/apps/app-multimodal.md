---
id: app-multimodal
title: Multimodal AI apps: images, documents and voice
module: apps
level: Intermediate
minutes: 60
goal: Send images and documents to vision-capable models, build image-and-text search, and add speech input and output to an application.
prereqs: app-llm-api, dl-vision, dl-speech
reviewed: 2026-11-02
evidence: An app that accepts a photo or scanned document and returns validated structured fields, tested on 20 examples with field accuracy reported.
code: Conceptual (no model access in the build environment); C# not compiled (no .NET SDK)
---
## In plain words
**Multimodal** models handle more than one kind of input or output: text with images, documents, audio or video. A **vision-language model** reads a photo or scanned page together with your instructions and answers in text, for example "extract the invoice number, date and total as JSON". **Document AI** combines text recognition (OCR) with layout understanding to read forms, invoices and receipts. **Image-and-text search** uses a shared embedding space (models trained like CLIP) so a text query can find matching photos. **Voice apps** chain speech-to-text, an LLM and text-to-speech, or use models that handle audio directly. The same rules apply as for text: validate structured output, keep a person in the loop for important decisions, and treat images and audio as personal data when they show or record people.

```diagram merge Many kinds of input, one application
note: Multimodal models take more than one kind of input or output.
- Multimodal app | one model, one set of instructions | model
- Text | your instructions and questions | input
- Images and photos | read together with the text | input
- Documents | scanned pages, forms, invoices | input
- Audio and video | speech or recordings | input
```

```diagram flow Document AI
note: OCR means optical character recognition: reading text from an image.
- Scanned page | invoice, form or receipt | input
- OCR | reads the text on the page | process
- Layout understanding | finds which text is a field, a table or a total | process
- Structured fields | invoice number, date, total | output
```

```diagram flow Image-and-text search
note: Models trained like CLIP place matching images and text close together.
- Text query | for example: damaged front bumper | input
- Shared embedding space | images and text turned into comparable numbers | model
- Closest matches | photos that sit near the query | output
```

```diagram lanes Two ways to build a voice app
## Chained pipeline
- Speech-to-text | input
- LLM | model
- Text-to-speech | output
## Audio-capable model
- Audio goes into the model | input
- Model answers in audio | model
```

## Real-world example
An insurer lets customers upload photos of car damage. A vision model drafts a description of visible damage and a claim category for an assessor, who confirms or corrects it. Image search finds similar past claims to keep decisions consistent.

```diagram flow Car damage claim with a person in the loop
- Customer photos | uploaded with consent | input
- Vision model | drafts damage description and claim category | model
- Assessor | confirms or corrects the draft | process
- Decision | consistent, with similar past claims found by image search | output
```

## How it works
1. Collect inputs (photos, PDFs, audio) with consent; remove what you do not need.
2. Send the file with clear instructions and a JSON output format.
3. Validate fields (dates parse, totals are numbers, categories are allowed).
4. Route low-confidence or high-value cases to a person.
5. Evaluate per field on a labelled test set.

```diagram loop Reading a document safely
note: Low-confidence or high-value cases go to a person.
- Collect with consent | remove what you do not need | input
- Send with instructions | ask for a JSON output format | process
- Validate fields | dates parse, totals are numbers, categories allowed | process
- Route or accept | low-confidence or high-value goes to a person | output
- Evaluate per field | on a labelled test set | output
loop: Repeat for every new upload
```

## Python example
Sending an image to a vision-capable model through an OpenAI-compatible API (requires `openai` and a model that accepts images):
```python read_invoice.py (conceptual)
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
```

## .NET (C#) example
Microsoft.Extensions.AI sends images as `DataContent` inside a normal chat message, with typed output:
```cs Program.cs
using Microsoft.Extensions.AI;

byte[] image = await File.ReadAllBytesAsync("invoice.png");
var message = new ChatMessage(ChatRole.User,
[
    new TextContent("Extract the invoice number, date (YYYY-MM-DD) and total. Use null if missing."),
    new DataContent(image, "image/png"),
]);
ChatResponse<Invoice> response = await chat.GetResponseAsync<Invoice>([message], new ChatOptions { Temperature = 0 });

if (response.TryGetResult(out var invoice) && invoice is not null && DateOnly.TryParse(invoice.Date, out _) && invoice.Total >= 0)
    Console.WriteLine($"{invoice.InvoiceNumber}: {invoice.Total} on {invoice.Date}");
else
    Console.WriteLine("Could not read the invoice reliably; send to a person.");

public record Invoice(string? InvoiceNumber, string? Date, decimal Total);
```
For voice, combine speech-to-text (for example Whisper.net, see [Speech](lesson:dl-speech)) with the chat client and a text-to-speech service.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Word error rate (how good is speech-to-text)
**Where it is used:** scoring a transcript from a voice or document-reading model against the correct text.

```formula Word error rate
WER = (substitutions + deletions + insertions) ÷ words in the correct text
```
Substitution = wrong word. Deletion = missed word. Insertion = extra word.

**In plain words:** count every word the model got wrong, then divide by the length of the correct text. Lower is better.

**Example 1: a short sentence.** The correct text has 10 words. The model gets 1 wrong word and misses 1 word, with no extra words. WER = (1 + 1 + 0) ÷ 10 = 0.20, or 20%.

**Example 2: noisy audio.** The correct text has 8 words. The model misses 1 and adds 2. WER = (0 + 1 + 2) ÷ 8 = 0.375, or 37.5%.

### Audio and image size (what you send to the model)
**Where it is used:** estimating upload size and why large inputs are shrunk or compressed first.

```formula Raw size
audio bytes = samples per second × seconds × bytes per sample
image pixels = width × height
```
Raw means before compression.

**In plain words:** size grows with time for audio and with width times height for images.

**Example 1: one minute of speech.** 16,000 samples per second × 60 seconds × 2 bytes = 1,920,000 bytes, about 1.9 MB.

**Example 2: shrinking a photo.** A 4000 × 3000 photo has 12,000,000 pixels. Resized to 1000 × 750 it has 750,000 pixels. 12,000,000 ÷ 750,000 = 16, so 16 times fewer pixels to process.

## Maths behind it
- Shared embedding spaces and contrastive learning
- Convolutional and transformer image encoders
- Optical character recognition
- Spectrograms (for audio)

## Common mistakes
- Trusting extracted numbers without validation (totals, dates, account numbers).
- Sending photos that show people or documents with personal data without a reason and consent.
- Testing on clean scans only; real uploads are blurry, rotated and partial.

```diagram compare Test set: clean versus real uploads
## Clean scans only | bad
- Looks accurate in testing
- Misses blur, rotation, partial pages
## Realistic uploads | output
- Blurry, rotated and partial images included
- Field accuracy reflects real use
```

## Quick check
Q: What does a vision-language model do?
A: It reads images together with text instructions and answers in text, such as extracting fields from a document.

Q: Why validate fields extracted from an invoice image?
A: The model can misread or invent values; validation catches impossible dates, totals and formats before they enter your systems.

Q: How can a text query find matching photos?
A: By embedding both into a shared space where matching images and descriptions are close together.
