// From lesson 'ml-generalisation' (ml). Code status: Python executed 2026-11-18 (examples/generalisation/generalisation.py); the C# version prints the same numbers
// k-nearest-neighbours regression written from scratch, so it needs no packages.
// Same data and same numbers as generalisation.py.
const int n = 60;
double[] x = new double[n], y = new double[n];
for (int i = 0; i < n; i++)
{
    x[i] = 6.0 / 59 * i + (i % 2 == 1 ? 0.013 : 0.0);          // the small offset avoids equal distances
    y[i] = Math.Sin(x[i]) + 0.35 * Math.Sin(17.0 * i + 1.0);    // curve plus wobble
}
int[] train = Enumerable.Range(0, n).Where(i => i % 2 == 0).ToArray();   // even points train the model
int[] test = Enumerable.Range(0, n).Where(i => i % 2 == 1).ToArray();    // odd points test it

// Predict one point: the average of the y values of the k closest training points.
double Predict(double at, int k) =>
    train.OrderBy(j => Math.Abs(x[j] - at)).Take(k).Average(j => y[j]);

double Rmse(int[] rows, int k) =>
    Math.Sqrt(rows.Average(i => Math.Pow(y[i] - Predict(x[i], k), 2)));

double wobble = Math.Sqrt(Enumerable.Range(0, n).Average(i => Math.Pow(0.35 * Math.Sin(17.0 * i + 1.0), 2)));
double mean = train.Average(j => y[j]);
double baseline = Math.Sqrt(test.Average(i => Math.Pow(y[i] - mean, 2)));
Console.WriteLine($"wobble alone (the error no model can remove): {wobble:F3}");
Console.WriteLine($"always predict the training average: test RMSE {baseline:F3}");
Console.WriteLine(" k  train RMSE  test RMSE");
foreach (int k in new[] { 1, 3, 5, 9, 15, 29 })
    Console.WriteLine($"{k,2}  {Rmse(train, k),10:F3}  {Rmse(test, k),9:F3}");
