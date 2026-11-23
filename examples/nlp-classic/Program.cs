// Classic text processing from scratch. Same output as text_basics.py. No packages.
string text = "The cats were running quickly, and the dogs ran home.";
var tokens = text.Split(' ').Select(t => t.Trim(',', '.').ToLowerInvariant()).ToList();
var stop = new HashSet<string> { "the", "and", "were", "a", "of" };
var kept = tokens.Where(t => !stop.Contains(t)).ToList();
string Stem(string w)                                           // a very rough stemmer: cut common endings
{
    foreach (var suffix in new[] { "ing", "ly", "s" })
        if (w.EndsWith(suffix) && w.Length - suffix.Length >= 3) return w[..^suffix.Length];
    return w;
}
string Show(IEnumerable<string> items) => "[" + string.Join(", ", items.Select(t => $"'{t}'")) + "]";
Console.WriteLine("tokens: " + Show(tokens));
Console.WriteLine("without stop words: " + Show(kept));
Console.WriteLine("stems: " + Show(kept.Select(Stem)));

double Bleu2(string candidate, string reference)                // unigram and bigram precision, with a brevity penalty
{
    var c = candidate.Split(' '); var r = reference.Split(' ');
    double score = 1.0;
    foreach (int n in new[] { 1, 2 })
    {
        var cn = Grams(c, n); var rn = Grams(r, n);
        double clipped = cn.Sum(kv => Math.Min(kv.Value, rn.GetValueOrDefault(kv.Key)));
        score *= clipped / cn.Values.Sum();
    }
    score = Math.Sqrt(score);                                    // geometric mean of the two precisions
    double bp = c.Length >= r.Length ? 1.0 : Math.Exp(1 - (double)r.Length / c.Length);
    return bp * score;
}
Dictionary<string, int> Grams(string[] w, int n)
{
    var d = new Dictionary<string, int>();
    for (int i = 0; i + n <= w.Length; i++) { var k = string.Join(" ", w[i..(i + n)]); d[k] = d.GetValueOrDefault(k) + 1; }
    return d;
}
string reference = "the cat sat on the mat";
Console.WriteLine($"BLEU-2 for 'the cat sat on the mat': {Bleu2("the cat sat on the mat", reference):F3}");
Console.WriteLine($"BLEU-2 for 'the cat is on the mat':  {Bleu2("the cat is on the mat", reference):F3}");
Console.WriteLine($"BLEU-2 for 'the cat sat':            {Bleu2("the cat sat", reference):F3}");

// Viterbi: the best chain of hidden tags for three words, with two tags (N = noun, V = verb)
string[] tags = { "N", "V" };
var start = new Dictionary<string, double> { ["N"] = 0.6, ["V"] = 0.4 };
var trans = new Dictionary<string, Dictionary<string, double>> { ["N"] = new() { ["N"] = 0.3, ["V"] = 0.7 }, ["V"] = new() { ["N"] = 0.8, ["V"] = 0.2 } };
var emit = new Dictionary<string, Dictionary<string, double>> {
    ["N"] = new() { ["dogs"] = 0.5, ["bark"] = 0.1, ["loudly"] = 0.05 }, ["V"] = new() { ["dogs"] = 0.1, ["bark"] = 0.6, ["loudly"] = 0.05 } };
string[] words = { "dogs", "bark", "loudly" };
var best = new List<Dictionary<string, double>> { tags.ToDictionary(t => t, t => start[t] * emit[t][words[0]]) };
var back = new List<Dictionary<string, string>>();
foreach (var w in words.Skip(1))
{
    var row = new Dictionary<string, double>(); var ptr = new Dictionary<string, string>();
    foreach (var t in tags)
    {
        string p = tags.OrderByDescending(q => best[^1][q] * trans[q][t]).First();
        row[t] = best[^1][p] * trans[p][t] * emit[t][w]; ptr[t] = p;
    }
    best.Add(row); back.Add(ptr);
}
string last = tags.OrderByDescending(t => best[^1][t]).First();
var path = new List<string> { last };
for (int i = back.Count - 1; i >= 0; i--) path.Add(back[i][path[^1]]);
path.Reverse();
Console.WriteLine($"Viterbi tags for {Show(words)} -> {Show(path)}  probability {best[^1][last]:F5}");
