// From lesson 's-python-refresher' (start). Code status: Python executed 2026-11-19 (examples/refreshers/refresher_python.py); the C# version prints the same output
// The same tasks as refresher_python.py, written in C#: filtering, counting, recursion, safe parsing and a small CSV.
int[] numbers = { 3, 8, 1, 9, 4, 6 };
Console.WriteLine("squares of the even numbers: [" + string.Join(", ", numbers.Where(n => n % 2 == 0).Select(n => n * n)) + "]");      // LINQ: filter then map

string text = "the cat and the hat and the bat";
var counts = new SortedDictionary<string, int>(StringComparer.Ordinal);                                                               // a dictionary used as a counter
foreach (var word in text.Split(' ')) counts[word] = counts.GetValueOrDefault(word) + 1;
Console.WriteLine("word counts: {" + string.Join(", ", counts.Select(kv => $"'{kv.Key}': {kv.Value}")) + "}");

int Fib(int n) => n < 2 ? n : Fib(n - 1) + Fib(n - 2);                                                                                // recursion: a method that calls itself
Console.WriteLine("first ten Fibonacci numbers: [" + string.Join(", ", Enumerable.Range(0, 10).Select(Fib)) + "]");

int? ToInt(string s) => int.TryParse(s, out int v) ? v : null;                                                                        // no exception needed: TryParse reports failure
Console.WriteLine("parsing 42, x7 and -3: [" + string.Join(", ", new[] { "42", "x7", "-3" }.Select(s => ToInt(s)?.ToString() ?? "None")) + "]");

string csv = "name,mark\nAna,70\nBen,85\nCy,90";                                                                                       // a small CSV held in a string
var rows = csv.Split('\n').Skip(1).Select(line => line.Split(',')).ToList();
var marks = rows.Select(r => int.Parse(r[1])).ToList();
Console.WriteLine($"average mark: {marks.Average():F1}");
Console.WriteLine("best student: " + rows.OrderByDescending(r => int.Parse(r[1])).First()[0]);
