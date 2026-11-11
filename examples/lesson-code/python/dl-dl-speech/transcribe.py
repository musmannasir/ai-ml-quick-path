# From lesson 'dl-speech' (dl). Code status: Python signal demo and WER executed 2026-11-02 (gap_topics.py speech); Whisper and C# (Whisper.net) not run (not installed in the build environment)
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="openai/whisper-small")
print(asr("call.wav")["text"])
