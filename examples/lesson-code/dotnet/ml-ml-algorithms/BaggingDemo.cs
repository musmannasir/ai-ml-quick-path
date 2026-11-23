// From lesson 'ml-algorithms' (ml). Code status: Python executed 2026-11-02 (examples/ai-extras/ai_extras.py algos, gap_topics.py svm); added technique snippets (2026-11-05) not run
var data = new double[] { 10, 12, 11, 13, 9, 14, 8, 12, 11, 10 };  // ten made-up values
var rng = new Random(0);
var estimates = new List<double>();

for (int m = 0; m < 5; m++)                        // five "models"
{
    double sum = 0;
    for (int i = 0; i < data.Length; i++)
        sum += data[rng.Next(data.Length)];        // pick with replacement
    estimates.Add(sum / data.Length);              // each model learns from its own sample
}

Console.WriteLine("each model says: " + string.Join(", ", estimates));
Console.WriteLine("bagged answer (the average): " + estimates.Average());
// For classes, count the votes instead: votes.GroupBy(v => v).MaxBy(g => g.Count())!.Key
