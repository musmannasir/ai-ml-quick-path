// From lesson 'dl-speech' (dl). Code status: Python signal demo and WER executed 2026-11-02 (gap_topics.py speech); Whisper and C# (Whisper.net) not run (not installed in the build environment)
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
