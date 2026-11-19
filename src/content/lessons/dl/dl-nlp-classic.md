---
id: dl-nlp-classic
title: Classic text processing and sequence tagging
module: dl
level: Intermediate
minutes: 60
maths: basic arithmetic
goal: Clean and normalise text with tokens, stop words and stemming, score generated text with BLEU, and explain how a hidden Markov model with the Viterbi algorithm finds the best tags for a sentence.
prereqs: dl-sequences
reviewed: 2026-11-18
evidence: A short pipeline that tokenises, removes stop words and stems a sentence, a BLEU-2 score worked out by hand for one candidate sentence, and a Viterbi table for three words.
code: Python executed 2026-11-18 (examples/nlp-classic/text_basics.py, standard library only); the C# version prints the same output
---
## In plain words
Before neural networks read text, people prepared it by hand, and those steps are still useful. **Tokenising** splits text into words. **Stop words** are very common words such as "the" that carry little meaning for some tasks, so they are sometimes removed. **Stemming** and **lemmatisation** reduce words to a base form so that "dogs" and "dog" count as one. A stemmer chops endings by rule and can be rough. A lemmatiser uses a dictionary and gives real words. For comparing a machine's sentence with a human's, **BLEU** counts how many of the machine's words and word pairs also appear in the human sentence. For tagging each word with its part of speech, a **hidden Markov model** treats the tags as hidden states and uses the **Viterbi algorithm** to find the most probable chain of tags for the whole sentence.

```diagram flow A classic text pipeline
note: Each step makes the text simpler for the next one. Skip steps your model does not need.
- Split the text into tokens | Words and punctuation | input
- Lower-case and strip punctuation | One form for each word | process
- Remove stop words | Drop very common words | process
- Stem or lemmatise | Reduce words to a base form | output
```

```diagram compare Stemming and lemmatisation
note: Stemming is fast and rough. Lemmatisation is slower and more careful.
## Stemming | warn
- Cuts endings by rule
- May give non-words, such as runn
## Lemmatisation | output
- Uses a dictionary and the word's role
- Gives real words, such as run
```

```diagram flow Viterbi in plain steps
note: Keep only the best way to reach each tag, then trace back from the best ending.
- Score each tag for the first word | Start chance times emission chance | input
- For each next word, extend the best earlier tag | Multiply in the move and the emission | process
- Remember which earlier tag was best | A back-pointer for each tag | store
- Trace back from the best final tag | That is the best tag chain | output
```

## Real-world example
A news site wants to find which articles mention the same events. It lower-cases the text, removes stop words and stems the rest, so that "protests", "protesting" and "protest" all become one term before it builds its word counts. It also trains a part-of-speech tagger to pick out the nouns, because nouns carry the topic. When it later generates short summaries, it scores them against editors' summaries with BLEU and ROUGE, knowing both are rough and that a human must read a sample.

## How it works
1. **Tokenise and normalise.** Split, lower-case, strip punctuation.
2. **Filter and reduce.** Drop stop words if the task allows, then stem or lemmatise.
3. **Score generated text.** BLEU takes the share of the candidate's single words that appear in the reference, the same for word pairs, multiplies the shares, takes a square root for two kinds of share, and applies a penalty when the candidate is shorter than the reference.
4. **Tag sequences.** A hidden Markov model needs three tables: how likely each tag is to start a sentence, how likely one tag is to follow another, and how likely each tag is to produce each word. Viterbi uses them to pick the best chain of tags.

```maths BLEU-2 for one sentence
situation: The reference is "the cat sat on the mat". The candidate is "the cat is on the mat". BLEU-2 uses single words and word pairs.
find: What is the BLEU-2 score?
step: Single words in the candidate that are in the reference (the twice, cat, on, mat) | 5 ÷ 6 ≈ 0.833
step: Word pairs in the candidate that are in the reference (the cat, on the, the mat) | 3 ÷ 5 = 0.6
step: Multiply the two shares | (5 ÷ 6) × (3 ÷ 5) = 0.5
step: Square root, because two shares were multiplied | sqrt(0.5) ≈ 0.707
result: The BLEU-2 score is 0.707. The candidate has the same length as the reference, so there is no length penalty.
formula: BLEU-2 = brevity penalty × the square root of (single-word share × word-pair share)
why: BLEU is cheap and repeatable, which is why it is used to compare translation and summary systems. It only sees overlap with the reference, so two good sentences with different words can score badly.
caution: BLEU does not understand meaning. Use it to compare versions of one system, and read samples.
try: The candidate is "the cat sat" and the reference is still six words. The shares are both 1 (all three words and both pairs appear in the reference). What does the length penalty do?
answer: exp(1 - 6 ÷ 3) ≈ 0.368. Even though every word is right, the candidate is half as long as the reference, so the score falls from 1 to 0.368.
```

```maths Viterbi by hand: dogs bark loudly
situation: Two tags, N for a noun and V for a verb. At the start, N has chance 0.6 and V has 0.4. N follows N with 0.3 and V with 0.7. V is followed by N with 0.8 and by V with 0.2. N produces "dogs" with 0.5 and "bark" with 0.1. V produces "dogs" with 0.1 and "bark" with 0.6. Both produce "loudly" with 0.05. Made-up numbers.
find: What is the best tag chain for "dogs bark loudly"?
step: Word 1, tag N (start chance times emission) | 0.6 × 0.5 = 0.3
step: Word 2, tag V, best way is from N (earlier score, move, emission) | 0.3 × 0.7 × 0.6 = 0.126
step: Word 2, tag N, best way is from N | 0.3 × 0.3 × 0.1 = 0.009
step: Word 3, tag N, best way is from V | 0.126 × 0.8 × 0.05 = 0.00504
result: The best chain is noun, verb, noun with probability 0.00504. Tracing the back-pointers from the best final score gives N, V, N.
why: Checking every possible chain would take 2 to the power of the number of words. Viterbi keeps only the best score per tag at each word, so the work grows in step with the length of the sentence.
caution: This is a toy: two tags, three words, invented tables. Real taggers are trained on labelled text.
try: Is it likelier that the third word is a verb? Use the best way to reach V at word 3 (from V, with chance 0.2): 0.126 × 0.2 × 0.05.
answer: 0.126 × 0.2 × 0.05 = 0.00126, which is lower than 0.00504, so noun is likelier.
```

## Live simulation
Before neural networks, text was compared with word counts. Weighting by rarity was the key improvement.

```sim txt Counting words and weighting them by rarity
question: How can a program compare texts with nothing but word counts, and why do rare words matter more?
watch: A bag of words counts each word and forgets the order. The bars show the weight of each word in the chosen review.
watch: Switch on rarity weighting (TF-IDF). A word found in only one review now counts for more than a word found in most of them.
watch: The second list shows how similar each review is to this one. 1 means the same mix of words, 0 means no words in common.
try: rare | Choose review 4, switch rarity weighting on, and see "ending" become its top word.
predict: Review 4 uses the word "ending", which no other review uses. When words are weighted by rarity, what happens to its weight? | It goes down | It goes up | It stays the same
answer: 2 | TF-IDF multiplies a word's count by a number that is larger for rarer words. "ending" appears in one review out of four, so its weight rises compared with common words like "film".
leaves-out: Four tiny made-up reviews and a stop list of two words. Real text work uses thousands of documents, and also handles word endings, pairs of words and spelling. The rarity formula here is one common version; others differ in detail.
reference: examples/sim-dl/dl.py
```

## Python example
Each step is written from scratch with the standard library. The stemmer is deliberately rough so you can see what it does wrong.

```python text_basics.py
"""Classic text processing from scratch: tokens, stop words, a rough stemmer, BLEU, and the Viterbi algorithm.

Run:  python text_basics.py
"""
import math
from collections import Counter

text = "The cats were running quickly, and the dogs ran home."
tokens = [t.strip(",.").lower() for t in text.split()]
stop = {"the", "and", "were", "a", "of"}
kept = [t for t in tokens if t not in stop]
def stem(w):                                              # a very rough stemmer: cut common endings
    for suffix in ("ing", "ly", "s"):
        if w.endswith(suffix) and len(w) - len(suffix) >= 3:
            return w[: -len(suffix)]
    return w
print("tokens:", tokens)
print("without stop words:", kept)
print("stems:", [stem(t) for t in kept])

def bleu2(candidate, reference):                         # unigram and bigram precision, with a brevity penalty
    c, r = candidate.split(), reference.split()
    score = 1.0
    for n in (1, 2):
        cn = Counter(tuple(c[i:i + n]) for i in range(len(c) - n + 1))
        rn = Counter(tuple(r[i:i + n]) for i in range(len(r) - n + 1))
        clipped = sum(min(v, rn[k]) for k, v in cn.items())
        score *= clipped / sum(cn.values())
    score = math.sqrt(score)                             # geometric mean of the two precisions
    bp = 1.0 if len(c) >= len(r) else math.exp(1 - len(r) / len(c))
    return bp * score
ref = "the cat sat on the mat"
print("BLEU-2 for 'the cat sat on the mat': %.3f" % bleu2("the cat sat on the mat", ref))
print("BLEU-2 for 'the cat is on the mat':  %.3f" % bleu2("the cat is on the mat", ref))
print("BLEU-2 for 'the cat sat':            %.3f" % bleu2("the cat sat", ref))

# Viterbi: the best chain of hidden tags for three words, with two tags (N = noun, V = verb)
tags = ["N", "V"]
start = {"N": 0.6, "V": 0.4}
trans = {"N": {"N": 0.3, "V": 0.7}, "V": {"N": 0.8, "V": 0.2}}
emit = {"N": {"dogs": 0.5, "bark": 0.1, "loudly": 0.0}, "V": {"dogs": 0.1, "bark": 0.6, "loudly": 0.0}}
emit["N"]["loudly"], emit["V"]["loudly"] = 0.05, 0.05
words = ["dogs", "bark", "loudly"]
best = [{t: start[t] * emit[t][words[0]] for t in tags}]
back = []
for w in words[1:]:
    row, ptr = {}, {}
    for t in tags:
        cand = {p: best[-1][p] * trans[p][t] for p in tags}
        p = max(cand, key=cand.get)
        row[t], ptr[t] = cand[p] * emit[t][w], p
    best.append(row); back.append(ptr)
last = max(best[-1], key=best[-1].get)
path = [last]
for ptr in reversed(back):
    path.append(ptr[path[-1]])
path.reverse()
print("Viterbi tags for", words, "->", path, " probability %.5f" % best[-1][last])
```
```text Output of text_basics.py (executed)
tokens: ['the', 'cats', 'were', 'running', 'quickly', 'and', 'the', 'dogs', 'ran', 'home']
without stop words: ['cats', 'running', 'quickly', 'dogs', 'ran', 'home']
stems: ['cat', 'runn', 'quick', 'dog', 'ran', 'home']
BLEU-2 for 'the cat sat on the mat': 1.000
BLEU-2 for 'the cat is on the mat':  0.707
BLEU-2 for 'the cat sat':            0.368
Viterbi tags for ['dogs', 'bark', 'loudly'] -> ['N', 'V', 'N']  probability 0.00504
```
Stop-word removal leaves six words. The rough stemmer turns "cats" into "cat", but "running" into "runn", which is not a word. That is why lemmatisation is preferred when real words matter. The BLEU-2 scores are 1.000 for an identical sentence, 0.707 for one changed word and 0.368 for a sentence that is too short. Viterbi gives N, V, N with probability 0.00504, as in the hand calculation.

Two more classic ideas deserve a mention. A **conditional random field (CRF)** is a tagger like the hidden Markov model but it can use any features of the sentence, such as capital letters, so it is the usual choice for **named-entity recognition**, which finds names of people, places and organisations. **Bidirectional RNNs** read a sentence both ways, so a word's tag can depend on words after it as well as before it.

## .NET (C#) example
The same pipeline written from scratch in C#, with no packages, printing the same output. ML.NET has text transforms for tokenising, stop-word removal and word-embedding features, and Microsoft.ML.Tokenizers provides modern tokenisers.

```cs Program.cs
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
```

## Maths behind it
- Counting words and word pairs (n-grams)
- Precision as a share, and the geometric mean (statistics)
- Probabilities of chains: multiplying chances (probability)
- Dynamic programming: keeping only the best score per state (algorithms)

## Common mistakes
- Stemming when the model needs real words, and then being surprised by "runn".
- Removing stop words for a task where they matter, such as "not" in sentiment.
- Trusting BLEU on one sentence. It is meant for averages over many.
- Forgetting the length penalty and wondering why short outputs score oddly.
- Treating an invented probability table as if it came from data.

## Quick check
Q: What is the difference between stemming and lemmatisation?
A: Stemming cuts word endings by rule and can give non-words. Lemmatisation uses a dictionary and the word's role to give a real base word.

Q: Why might removing stop words hurt sentiment analysis?
A: Words such as "not" change the meaning completely. Removing them can turn "not good" into "good".

Q: What does Viterbi avoid doing?
A: Checking every possible chain of tags. It keeps the best score for each tag at each word and traces back, so the work grows with the sentence length, not exponentially.

Q: A candidate sentence has every word right but is half as long as the reference. What does BLEU do?
A: It multiplies the score by a brevity penalty below 1, so a very short candidate cannot score high just because all its words match.
