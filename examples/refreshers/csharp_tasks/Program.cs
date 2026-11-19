// C# in a nutshell for this guide: records, LINQ grouping, generics, async and Span.
var students = new List<Student> { new("Ana", "A", 70), new("Ben", "A", 85), new("Cy", "B", 90), new("Di", "B", 60), new("Eve", "B", 75) };
foreach (var g in students.GroupBy(s => s.Class).OrderBy(g => g.Key))                                                    // LINQ GroupBy
    Console.WriteLine($"class {g.Key}: {g.Count()} students, average {g.Average(s => s.Mark):F1}");

T Largest<T>(IEnumerable<T> items) where T : IComparable<T>                                                              // a generic method: works for anything comparable
{
    T best = items.First();
    foreach (var item in items.Skip(1)) if (item.CompareTo(best) > 0) best = item;
    return best;
}
Console.WriteLine($"largest number: {Largest(new[] { 4, 9, 2 })}, largest word: {Largest(new[] { "pear", "apple", "zebra" })}");

async Task<int> SlowDouble(int x) { await Task.Delay(10); return 2 * x; }                                                // an async method
var doubled = await Task.WhenAll(new[] { 1, 2, 3 }.Select(SlowDouble));
Console.WriteLine($"doubled in parallel: [{string.Join(", ", doubled)}] total {doubled.Sum()}");

Span<int> data = stackalloc int[] { 1, 2, 3, 4, 5 };                                                                     // a Span: a window onto memory with no copy
Span<int> middle = data[1..4];
int sum = 0; foreach (int v in middle) sum += v;
Console.WriteLine($"sum of the middle three: {sum}");

record Student(string Name, string Class, int Mark);                                                                    // a record: a small immutable data holder
