"""The calculation behind the "How text becomes tokens" simulation (byte-pair encoding), in plain Python.

It learns merges from the same small text as the page, with the same tie rule, and prints the same headline
numbers. scripts/check-sims.mjs checks that the page's JavaScript and this program agree.

Run:  python bpe_tokens.py
"""
CORPUS = ("the lower tower is lower than the lowest tower the newer house is newer than the newest house "
          "a wider road is wider than the widest road the cat is sitting on the mat the dog is sitting near the cat "
          "the cat is walking and the dog is walking the lower the newer the wider the lowest the newest the widest")
END = "_"


def word_counts(text):
    counts, order = {}, []
    for w in text.split():
        if w not in counts:
            counts[w] = 0
            order.append(w)
        counts[w] += 1
    return [(w, counts[w]) for w in order]


def join_pair(syms, a, b):
    out, i = [], 0
    while i < len(syms):
        if i + 1 < len(syms) and syms[i] == a and syms[i + 1] == b:
            out.append(a + b)
            i += 2
        else:
            out.append(syms[i])
            i += 1
    return out


def learn(text, max_merges):
    words = [[list(w) + [END], n] for w, n in word_counts(text)]
    base = sorted({s for syms, _ in words for s in syms})
    merges = []
    for _ in range(max_merges):
        counts = {}
        for syms, n in words:
            for i in range(len(syms) - 1):
                key = (syms[i], syms[i + 1])
                counts[key] = counts.get(key, 0) + n
        best, best_count = None, 0
        for key in sorted(counts):                      # sorted: ties go to the pair that sorts first
            if counts[key] > best_count:
                best, best_count = key, counts[key]
        if best is None or best_count < 2:
            break
        merges.append((best[0], best[1], best_count))
        for entry in words:
            entry[0] = join_pair(entry[0], best[0], best[1])
    return base, merges


def segment(word, merges, k):
    syms = list(word) + [END]
    for a, b, _ in merges[:k]:
        syms = join_pair(syms, a, b)
    return syms


if __name__ == "__main__":
    base, merges = learn(CORPUS, 60)
    print("merges learned:", len(merges), " base symbols:", len(base))
    print("first 12 merges:", ", ".join("%s+%s(%d)" % m for m in merges[:12]))
    text = "the lowest newer widest cat"
    for k in (0, 12, len(merges)):
        toks = [t for w in text.split() for t in segment(w, merges, k)]
        print("merges %2d: %2d tokens for %d characters: %s" % (k, len(toks), len(text.replace(" ", "")), " ".join(toks)))
