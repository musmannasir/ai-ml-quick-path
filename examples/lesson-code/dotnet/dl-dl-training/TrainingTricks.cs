// From lesson 'dl-training' (dl). Code status: Python dropout demo executed 2026-11-02 (ai_extras.py dropout); PyTorch not run (not installed in the build environment); added technique snippets (2026-11-05) not run
using System;
using System.Linq;

static class TrainingTricks
{
    // Shift to average 0 and shrink to spread 1; "tiny" avoids dividing by zero.
    public static double[] BatchNorm(double[] x, double tiny = 1e-5)
    {
        double mean = x.Average();
        double variance = x.Select(v => (v - mean) * (v - mean)).Average();
        return x.Select(v => (v - mean) / Math.Sqrt(variance + tiny)).ToArray();
    }

    // If the gradient is longer than the limit, shrink it to the limit (same direction).
    public static double[] Clip(double[] grad, double limit)
    {
        double length = Math.Sqrt(grad.Sum(g => g * g));
        return length > limit ? grad.Select(g => g * limit / length).ToArray() : grad;
    }

    // Warm-up for the first epochs, then step decay: divide by 10 every 10 epochs.
    public static double LearningRate(int epoch, double peak = 0.001, int warm = 4) =>
        epoch < warm ? peak * epoch / warm : peak * Math.Pow(0.1, (epoch - warm) / 10);
}
