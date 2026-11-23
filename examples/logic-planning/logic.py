"""Constraint satisfaction (map colouring), a truth-table check of a logical rule, and a small genetic algorithm.

The genetic algorithm uses a small repeatable random generator, so the numbers repeat and match the C# version.
Run:  python logic.py
"""
import itertools

# 1. Colour five regions with three colours so that neighbours differ
regions = ["A", "B", "C", "D", "E"]
edges = [("A", "B"), ("A", "C"), ("B", "C"), ("B", "D"), ("C", "D"), ("D", "E")]
colours = ["red", "green", "blue"]
def ok(assign):
    return all(assign[a] != assign[b] for a, b in edges if a in assign and b in assign)
brute = sum(1 for combo in itertools.product(colours, repeat=5) if ok(dict(zip(regions, combo))))
tried = 0
def backtrack(assign):
    global tried
    if len(assign) == len(regions):
        return assign
    r = regions[len(assign)]
    for c in colours:
        tried += 1
        assign[r] = c
        if ok(assign):
            found = backtrack(assign)
            if found: return found
        del assign[r]
    return None
solution = backtrack({})
print("brute force would check %d assignments and finds %d that work" % (3 ** 5, brute))
print("backtracking found a solution after %d colour choices: %s" % (tried, " ".join("%s=%s" % (r, solution[r]) for r in regions)))

# 2. Does "if P then Q, and P" guarantee Q? Check every row of the truth table
rows = [(p, q, ((not p) or q) and p) for p in (True, False) for q in (True, False)]
holds = all(q for p, q, premise in rows if premise)
print("rows where both statements are true:", [(p, q) for p, q, premise in rows if premise], "-> Q is always true there:", holds)

# 3. Genetic algorithm: evolve a 10-bit string towards all ones
state = 12345
def rnd():
    global state
    state = (1103515245 * state + 12345) % (2 ** 31)
    return state / 2 ** 31
pop = [[1 if rnd() < 0.5 else 0 for _ in range(10)] for _ in range(6)]
fit = lambda g: sum(g)
print("generation  best fitness  average fitness")
for gen in range(0, 9):
    print("%10d  %12d  %15.2f" % (gen, max(fit(g) for g in pop), sum(fit(g) for g in pop) / len(pop)))
    def pick():                                                # tournament of two
        a, b = pop[int(rnd() * 6)], pop[int(rnd() * 6)]
        return a if fit(a) >= fit(b) else b
    nxt = [max(pop, key=fit)[:]]                               # keep the best one
    while len(nxt) < 6:
        p1, p2, cut = pick(), pick(), 1 + int(rnd() * 9)
        child = p1[:cut] + p2[cut:]
        child = [1 - b if rnd() < 0.05 else b for b in child]  # a rare mutation flips a bit
        nxt.append(child)
    pop = nxt
