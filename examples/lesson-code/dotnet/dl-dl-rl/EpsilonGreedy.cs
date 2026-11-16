// From lesson 'dl-rl' (dl). Code status: Python executed 2026-11-02 (ai_extras.py qlearn, gap_topics.py pg); added technique snippets (2026-11-05) not run
using System;
using System.Linq;

var rng = new Random();
double[] avgReward = { 0.15, 0.18, 0.10 };         // average clicks per view for layouts A, B, C
double epsilon = 0.1;

int Choose() =>
    rng.NextDouble() < epsilon
        ? rng.Next(avgReward.Length)                // explore: any layout at random
        : Array.IndexOf(avgReward, avgReward.Max()); // exploit: the best layout so far

Console.WriteLine(Choose());                        // usually 1 (layout B)
