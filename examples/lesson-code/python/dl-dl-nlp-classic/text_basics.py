# From lesson 'dl-nlp-classic' (dl). Code status: Python executed 2026-11-18 (examples/nlp-classic/text_basics.py, standard library only); the C# version prints the same output
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
