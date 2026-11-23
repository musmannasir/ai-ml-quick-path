"""The calculation behind the "How a language model writes text" simulation, in plain Python.

The model is a table of word counts from a small text (NOT a neural network). The loop around it (probabilities,
temperature, top-k, top-p, pick one, append, repeat) is the loop a large language model runs. The page does the same
calculation in JavaScript; scripts/check-sims.mjs checks that the two agree.

Run:  python gen_tokens.py
"""
CORPUS = ("the cat sat on the mat . the cat saw a dog . the dog ran to the cat . the dog sat on the rug . "
          "a bird sat on the roof . the bird saw the cat . the cat ran to the bird . the bird flew over the roof . "
          "the dog saw the bird . the bird flew to the tree . the cat sat on the rug . the dog ran to the tree . "
          "the cat saw the mouse . the mouse ran to the hole . the cat ran to the hole . the dog sat by the tree . "
          "a cat and a dog sat on the mat . the bird and the cat sat on the roof ."
          " the cat slept on the mat . the dog slept by the door . the bird sat on the tree . the cat walked to the door . the dog walked to the tree . the cat sat under the tree . the dog saw a cat . a bird saw the mouse . the mouse sat on the mat . the dog ran to the door . the cat saw the dog . a dog ran to a cat .")


def lcg(seed):
    s = seed & 0xFFFFFFFF
    def nxt():
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
        return s / 4294967296
    return nxt


def split(text):
    return text.lower().replace(".", " . ").split()


def train(text):
    toks = split(text)
    uni, bi, tri = {}, {}, {}
    for i, w in enumerate(toks):
        uni[w] = uni.get(w, 0) + 1
        if i >= 1:
            bi.setdefault(toks[i - 1], {})
            bi[toks[i - 1]][w] = bi[toks[i - 1]].get(w, 0) + 1
        if i >= 2:
            key = toks[i - 2] + " " + toks[i - 1]
            tri.setdefault(key, {})
            tri[key][w] = tri[key].get(w, 0) + 1
    return uni, bi, tri


def counts(model, ctx):
    uni, bi, tri = model
    if len(ctx) >= 2 and (ctx[-2] + " " + ctx[-1]) in tri:
        return tri[ctx[-2] + " " + ctx[-1]]
    if len(ctx) >= 1 and ctx[-1] in bi:
        return bi[ctx[-1]]
    return uni


def distribution(model, ctx, temp, top_k, top_p):
    c = counts(model, ctx)
    items = sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))
    total = sum(n for _, n in items)
    cand = [{"t": t, "n": n, "raw": n / total} for t, n in items]
    weights = [e["n"] ** (1 / temp) for e in cand]
    z = sum(weights)
    for e, w in zip(cand, weights):
        e["p"] = w / z

    def norm(k):
        s = sum(e["p"] for e in cand[:k])
        for i, e in enumerate(cand):
            e["p"] = e["p"] / s if i < k else 0.0

    if 0 < top_k < len(cand):
        norm(top_k)
    if top_p < 1:
        cum, keep = 0.0, 0
        for i, e in enumerate(cand):
            cum += e["p"]
            keep = i + 1
            if cum >= top_p - 1e-12:
                break
        norm(keep)
    return cand


def pick(cand, mode, rnd):
    if mode == "greedy":
        b = 0
        for i, e in enumerate(cand):
            if e["p"] > cand[b]["p"]:
                b = i
        return b
    r, cum = rnd(), 0.0
    for i, e in enumerate(cand):
        cum += e["p"]
        if r < cum and e["p"] > 0:
            return i
    for j in range(len(cand) - 1, -1, -1):
        if cand[j]["p"] > 0:
            return j
    return 0


def generate(model, prompt, n, temp, top_k, top_p, mode, seed):
    ctx, rnd, out = split(prompt), lcg(seed), []
    for _ in range(n):
        cand = distribution(model, ctx, temp, top_k, top_p)
        i = pick(cand, mode, rnd)
        ctx.append(cand[i]["t"])
        out.append(cand[i]["t"])
    return out


if __name__ == "__main__":
    model = train(CORPUS)
    for temp in (1, 0.5, 0.2, 1.8):
        cand = distribution(model, ["the", "cat"], temp, 0, 1)
        print("temperature %.1f after 'the cat': %s" % (temp, " ".join("%s:%.3f" % (e["t"], e["p"]) for e in cand[:4])))
    print("greedy:", " ".join(generate(model, "the cat", 10, 1, 0, 1, "greedy", 7)))
    print("sample, seed 7:", " ".join(generate(model, "the cat", 10, 1, 0, 1, "sample", 7)))
    print("top-k 3, top-p 0.8, seed 7:", " ".join(generate(model, "the cat", 10, 1, 3, 0.8, "sample", 7)))
