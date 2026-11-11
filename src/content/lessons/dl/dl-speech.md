---
id: dl-speech
title: Speech and audio: recognition and text-to-speech
module: dl
level: Advanced
minutes: 60
goal: Explain how audio becomes features, how speech recognition and text-to-speech work, and measure transcription quality with word error rate.
prereqs: dl-transformers
reviewed: 2026-11-02
evidence: Transcripts of five of your own short recordings with word error rate against your reference text, and a note on which errors matter for the task.
code: Python signal demo and WER executed 2026-11-02 (gap_topics.py speech); Whisper and C# (Whisper.net) not run (not installed in the build environment)
---
## In plain words
Sound is a wave, recorded as thousands of numbers per second (16,000 per second is common for speech). Models usually do not read raw samples. The audio is cut into short overlapping **frames** (for example 25 milliseconds every 10 milliseconds), and each frame is turned into "how strong is each pitch" with a **Fourier transform**. Stacking frames gives a **spectrogram**, a picture of sound over time. **Speech recognition (ASR)** turns that picture into text; modern systems such as Whisper use a transformer that reads the audio features and writes text tokens. **Text-to-speech (TTS)** goes the other way. Quality is measured with **word error rate (WER)**: substituted, inserted and deleted words divided by the number of words that were really said.

```diagram flow From sound to a spectrogram
- Sound wave | Thousands of numbers per second; 16,000 is common for speech | input
- Frames | Short overlapping pieces, for example 25 ms every 10 ms | process
- Fourier transform | How strong is each pitch in each frame | process
- Spectrogram | Stacked frames: a picture of sound over time | output
```

```diagram compare Speech recognition and text-to-speech
## Speech recognition (ASR) | model
- Audio in, text out | A transformer reads audio features and writes text tokens
## Text-to-speech (TTS) | output
- Text in, audio out | Goes the other way
```

```diagram merge Word error rate
note: Divide the three kinds of error by the number of words really said.
- Word error rate | Errors as a share of the words really said | output
- Substituted words | A wrong word in place of the right one | bad
- Inserted words | An extra word | bad
- Deleted words | A missing word | bad
```

## Real-world example
A contact centre transcribes calls to search them and summarise them for agents. Before launch the team measured WER separately for each language and accent it serves, because a single average hid much worse results for some callers.

## How it works
1. Load audio; convert to mono and the model's sample rate (often 16 kHz).
2. Split into frames; compute a (log-mel) spectrogram.
3. The model's encoder reads the spectrogram; the decoder writes text.
4. Clean up: punctuation, numbers, speaker labels.
5. Measure WER on realistic recordings; check task-critical words such as order numbers.

```diagram flow Speech recognition pipeline
- Load audio | Mono, the model's sample rate (often 16 kHz) | input
- Frames and log-mel spectrogram | Split, then compute | process
- Encoder reads, decoder writes | Spectrogram in, text out | model
- Clean up | Punctuation, numbers, speaker labels | process
- Measure WER | On realistic recordings; check key words | output
```

```diagram compare Extra word against missing digit
note: From the executed example in this lesson.
## Extra word "the" | warn
- Insertion | Little harm on a refund line
## Missing digit "two" | bad
- Deletion | Changes the order number, which matters far more
```

## Python example
A one-second tone mixing 440 Hz and 880 Hz, and a transcript comparison:
```text Output of gap_topics.py speech (executed)
strongest frequencies: [440, 880] Hz
25 ms windows every 10 ms: 98 frames of 400 samples for 1 s of audio
word error rate = 0.250 (1 insertion + 1 deletion over 8 reference words)
```
The reference "please refund order five five eight one two" was heard as "please refund the order five five eight one": an extra "the" and a missing "two". The missing digit matters far more for a refund line than the extra word.
```python transcribe.py (requires transformers and a downloaded model)
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="openai/whisper-small")
print(asr("call.wav")["text"])
```

## .NET (C#) example
Local speech recognition with Whisper.net (package `Whisper.net` plus a runtime package, and a downloaded Whisper model file), and word error rate in plain C#:
```cs Program.cs
using Whisper.net;

using var factory = WhisperFactory.FromPath("ggml-base.bin");
using var processor = factory.CreateBuilder().WithLanguage("auto").Build();
using var audio = File.OpenRead("call.wav");                  // 16 kHz mono WAV
var words = new List<string>();
await foreach (var segment in processor.ProcessAsync(audio))
{
    Console.WriteLine($"{segment.Start:mm\\:ss} {segment.Text}");
    words.AddRange(segment.Text.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
}
Console.WriteLine($"WER {WordErrorRate("please refund order five five eight one two", string.Join(' ', words)):F3}");

static double WordErrorRate(string reference, string hypothesis)
{
    var r = reference.Split(' '); var h = hypothesis.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    var d = new int[r.Length + 1, h.Length + 1];
    for (int i = 0; i <= r.Length; i++) d[i, 0] = i;
    for (int j = 0; j <= h.Length; j++) d[0, j] = j;
    for (int i = 1; i <= r.Length; i++)
        for (int j = 1; j <= h.Length; j++)
            d[i, j] = Math.Min(Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1), d[i - 1, j - 1] + (r[i - 1] == h[j - 1] ? 0 : 1));
    return (double)d[r.Length, h.Length] / r.Length;
}
```

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Word error rate (how wrong is the transcript?)
**Where it is used:** the contact centre measures WER for each language and accent before launch.

```formula Word error rate
WER = (S + D + I) ÷ N
S = substituted words, D = deleted words, I = inserted words
N = number of words in the correct reference text
```
**In plain words:** count the word-level mistakes and divide by the length of the correct text. Lower is better.

**Example 1: one deletion.** Reference "turn on the light" has N = 4 words. The system wrote "turn on light". D = 1, so WER = 1 ÷ 4 = 0.25 (25%).

**Example 2: substitution plus insertion.** Reference "call two five" has N = 3. The system wrote "call too five the". S = 1 (two became too) and I = 1 (extra "the"). WER = (1 + 0 + 1) ÷ 3 ≈ 0.67. WER can even go above 1 if there are many insertions.

### Sampling rate (how much audio data is there?)
**Where it is used:** audio is turned into numbers before a speech model reads it.

```formula Samples and highest frequency
number of samples = sampling rate × seconds
highest frequency captured = sampling rate ÷ 2
```
The sampling rate is the number of measurements per second, in Hz.

**In plain words:** more samples per second keep more detail, and cost more data.

**Example 1: 16 kHz speech.** 3 seconds at 16,000 Hz = 16,000 × 3 = 48,000 samples. Highest frequency = 16,000 ÷ 2 = 8,000 Hz.

**Example 2: telephone audio.** 10 seconds at 8,000 Hz = 80,000 samples. Highest frequency = 4,000 Hz, so high sounds are lost and WER can be worse.

## Maths behind it
- Sampling rate and the Fourier transform (signal processing)
- Spectrograms and mel scale
- Edit distance (dynamic programming) for word error rate
- Attention-based encoder-decoder models

## Common mistakes
- Comparing transcripts without first normalising case and punctuation.
- Reporting one average WER and hiding groups for whom it works badly.
- Recording or storing voices without consent; voice is personal data in many places.

```diagram compare One average against groups
## One average WER | bad
- Hides groups | Results for some callers can be much worse
## WER per language and accent | output
- Shows who is served badly | Measured before launch
```

## Quick check
Q: What is a spectrogram?
A: A picture of how strong each sound frequency is over time; the usual input for speech models.

Q: How is word error rate calculated?
A: (substitutions + insertions + deletions) divided by the number of words in the reference.

Q: Why check order numbers separately from WER?
A: One wrong digit can make the whole request fail even when the overall WER looks low.
