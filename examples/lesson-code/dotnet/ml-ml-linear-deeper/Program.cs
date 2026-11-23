// From lesson 'ml-linear-deeper' (ml). Code status: Python executed 2026-11-18 (examples/linear-deeper/linear_deeper.py); the C# version prints the same numbers
// Same numbers as linear_deeper.py. The normal equation is solved by hand for two unknowns, so no packages are needed.
double[] size = { 50, 60, 70, 80, 90, 100 };
double[] price = { 150, 172, 205, 226, 255, 270 };
int n = size.Length;

// X has a column of ones and a column of sizes. XtX is a 2x2 table and Xty is a list of 2 numbers.
double a = n, b = size.Sum(), d = size.Sum(s => s * s);          // XtX = [[a, b], [b, d]]
double e = price.Sum(), f = size.Zip(price, (s, p) => s * p).Sum();   // Xty = [e, f]
double det = a * d - b * b;                                       // determinant of XtX
double intercept = (d * e - b * f) / det;                         // solve the 2x2 system
double slope = (a * f - b * e) / det;
Console.WriteLine($"normal equation: intercept {intercept:F3}  slope {slope:F3}");
Console.WriteLine($"prediction for 75 square metres: {intercept + slope * 75:F1}");

double[] score = { 0.05, 0.10, 0.20, 0.30, 0.35, 0.45, 0.55, 0.60, 0.70, 0.80, 0.90, 0.95 };
int[] label = { 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1 };             // 1 means a real case
Console.WriteLine("threshold  missed  false alarms  total cost (miss = 10, false alarm = 1)");
foreach (double t in new[] { 0.1, 0.3, 0.5, 0.7 })
{
    int missed = 0, falseAlarms = 0;
    for (int i = 0; i < score.Length; i++)
    {
        bool flagged = score[i] >= t;
        if (label[i] == 1 && !flagged) missed++;
        if (label[i] == 0 && flagged) falseAlarms++;
    }
    Console.WriteLine($"{t,9:F1}  {missed,6}  {falseAlarms,12}  {10 * missed + falseAlarms,10}");
}
