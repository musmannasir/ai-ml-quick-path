// From lesson 'ai-logic-plan' (ml). Code status: Python executed 2026-11-19 (examples/logic-planning/logic.py, standard library only); the C# version prints the same output
// Map colouring by backtracking, a truth-table check, and a small genetic algorithm. Same output as logic.py. No packages.
string[] regions = { "A", "B", "C", "D", "E" };
(string, string)[] edges = { ("A", "B"), ("A", "C"), ("B", "C"), ("B", "D"), ("C", "D"), ("D", "E") };
string[] colours = { "red", "green", "blue" };
bool Ok(Dictionary<string, string> a) => edges.All(e => !(a.ContainsKey(e.Item1) && a.ContainsKey(e.Item2)) || a[e.Item1] != a[e.Item2]);

int brute = 0;
for (int code = 0; code < 243; code++)                              // every one of the 3^5 complete assignments
{
    var a = new Dictionary<string, string>(); int x = code;
    foreach (var r in regions) { a[r] = colours[x % 3]; x /= 3; }
    if (Ok(a)) brute++;
}
int tried = 0;
Dictionary<string, string>? Backtrack(Dictionary<string, string> a)
{
    if (a.Count == regions.Length) return a;
    string r = regions[a.Count];
    foreach (var c in colours)
    {
        tried++; a[r] = c;
        if (Ok(a)) { var found = Backtrack(a); if (found != null) return found; }
        a.Remove(r);
    }
    return null;
}
var solution = Backtrack(new Dictionary<string, string>())!;
Console.WriteLine($"brute force would check 243 assignments and finds {brute} that work");
Console.WriteLine($"backtracking found a solution after {tried} colour choices: " + string.Join(" ", regions.Select(r => $"{r}={solution[r]}")));

// Does "if P then Q, and P" guarantee Q? Check every row of the truth table
var rows = new List<(bool p, bool q, bool premise)>();
foreach (bool p in new[] { true, false }) foreach (bool q in new[] { true, false }) rows.Add((p, q, (!p || q) && p));
string B(bool v) => v ? "True" : "False";
bool holds = rows.Where(t => t.premise).All(t => t.q);
Console.WriteLine("rows where both statements are true: [" + string.Join(", ", rows.Where(t => t.premise).Select(t => $"({B(t.p)}, {B(t.q)})")) + $"] -> Q is always true there: {B(holds)}");

// Genetic algorithm: evolve a 10-bit string towards all ones
long state = 12345;
double Rnd() { state = (1103515245L * state + 12345) % (1L << 31); return state / (double)(1L << 31); }
var pop = Enumerable.Range(0, 6).Select(_ => Enumerable.Range(0, 10).Select(__ => Rnd() < 0.5 ? 1 : 0).ToArray()).ToList();
int Fit(int[] g) => g.Sum();
Console.WriteLine("generation  best fitness  average fitness");
for (int gen = 0; gen <= 8; gen++)
{
    Console.WriteLine($"{gen,10}  {pop.Max(Fit),12}  {pop.Average(g => (double)Fit(g)),15:F2}");
    int[] Pick() { var a = pop[(int)(Rnd() * 6)]; var b = pop[(int)(Rnd() * 6)]; return Fit(a) >= Fit(b) ? a : b; }   // tournament of two
    int[] bestOne = pop[0]; foreach (var g in pop) if (Fit(g) > Fit(bestOne)) bestOne = g;                              // keep the best one
    var next = new List<int[]> { (int[])bestOne.Clone() };
    while (next.Count < 6)
    {
        var p1 = Pick(); var p2 = Pick(); int cut = 1 + (int)(Rnd() * 9);
        var child = p1.Take(cut).Concat(p2.Skip(cut)).ToArray();
        for (int k = 0; k < 10; k++) if (Rnd() < 0.05) child[k] = 1 - child[k];                                         // a rare mutation flips a bit
        next.Add(child);
    }
    pop = next;
}
