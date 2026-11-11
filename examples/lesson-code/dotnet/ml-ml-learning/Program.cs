// From lesson 'ml-learning' (ml). Code status: Python executed 2026-11-02 (examples/ml-basics/ml_basics.py gd and cv); C# not compiled (no .NET SDK in the build environment)
double[] x = { 1, 2, 3, 4, 5 };
double[] y = { 3.1, 4.9, 7.2, 8.8, 11.1 };
double w = 0, b = 0, lr = 0.02;

for (int step = 1; step <= 2000; step++)
{
    double dw = 0, db = 0, loss = 0;
    for (int i = 0; i < x.Length; i++)
    {
        double err = (w * x[i] + b) - y[i];
        loss += err * err / x.Length;
        dw += 2 * err * x[i] / x.Length;
        db += 2 * err / x.Length;
    }
    w -= lr * dw;
    b -= lr * db;
    if (step is 1 or 10 or 100 or 2000) Console.WriteLine($"step {step,4}: loss={loss:F4} w={w:F3} b={b:F3}");
}
