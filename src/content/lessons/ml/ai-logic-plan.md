---
id: ai-logic-plan
title: Logic, constraints and planning
module: ml
level: Intermediate
minutes: 75
maths: basic arithmetic
goal: Solve a constraint problem by backtracking, check a logical rule with a truth table, describe how a planner turns a goal into steps, and see how a genetic algorithm searches by mutation and selection.
prereqs: ai-search
reviewed: 2026-11-19
evidence: A map coloured by backtracking with the count of choices tried, a truth table that proves or refutes one rule, and the best and average fitness over generations of a small genetic algorithm.
code: Python executed 2026-11-19 (examples/logic-planning/logic.py, standard library only); the C# version prints the same output
---
## In plain words
Not every AI problem is learned from data. Some are puzzles with rules: schedule these exams so no student has two at once, colour this map so neighbours differ, prove that a conclusion follows from some facts. This lesson covers four classic tools. A **constraint satisfaction problem** lists variables (regions), the values each may take (colours) and constraints between them (neighbours must differ). **Backtracking** fills them in one at a time and undoes a choice as soon as it breaks a rule. **Logic** writes facts and rules as statements that are true or false, and checks what follows; a **truth table** tries every combination. **Planning** takes a starting situation, a goal and a set of actions, each with conditions and effects, and searches for a sequence of actions that reaches the goal. When a problem has no clear rules but a way to score an answer, a **genetic algorithm** evolves a population of candidates by selection, crossover and mutation.

```diagram flow Backtracking for constraints
note: The key saving is undoing a choice as soon as it breaks a rule, instead of finishing a bad assignment.
- Pick the next variable | For example the next region to colour | input
- Try each value in turn | Red, then green, then blue | process
- On a broken rule, undo and try the next value | Dead ends are dropped early | warn
- If every variable has a value, stop | A solution has been found | output
```

```diagram compare Propositional and first-order logic
note: First-order logic can say more, and is harder to reason with.
## Propositional logic | process
- Statements that are true or false
- Combined with and, or, not, if-then
- A truth table can check everything
## First-order logic | model
- Adds objects, properties, "for all", "exists"
- Can say "every bird can fly except penguins"
```

```diagram flow How a genetic algorithm evolves
note: Nobody tells it the answer. It only scores candidates and keeps the better ones.
- Start with a random population | Each candidate is a string of bits | input
- Score each candidate | The fitness | process
- Pick good parents and mix them | Crossover, then rare mutations | model
- Replace the population and repeat | Average fitness tends to rise | output
```

```diagram compare Planning as search
note: A plan is a path through the space of possible situations.
## State | process
- A description of the world right now
## Action | model
- Has conditions that must hold first
- Has effects that change the state
## Plan | output
- A sequence of actions from the start to the goal
```

## Real-world example
A hospital must roster nurses. Every shift needs enough staff, nobody may work more than five days in a row, certain pairs must not be on together, and everybody has days off requested. This is a constraint problem, and a solver fills in the roster with backtracking and prunes any partial roster that already breaks a rule. A warehouse robot, in contrast, needs a plan: pick up the box, carry it to the shelf, put it down. Each action has conditions (the hands must be empty) and effects (the box is now on the shelf), and a planner searches for a sequence. A company designing a delivery network might use a genetic algorithm when each design can be scored by simulation but cannot be written as a formula.

## How it works
1. **Constraints.** List the variables, the allowed values and the constraints. Backtracking picks a variable, tries a value, checks every constraint among the variables already set, and goes back one step on a failure.
2. **Logic.** Write each fact and rule as a statement. To check whether a conclusion follows, list every row of the truth table and see whether the conclusion holds in all rows where all the premises hold.
3. **Planning.** Describe each action by its conditions and effects. Search the states reachable from the start, using the same search methods as before (breadth-first or A* with a guess of the steps to the goal) until a state satisfies the goal.
4. **Genetic algorithm.** Keep a population. Pick parents by a small tournament, join the front of one with the back of the other (crossover), flip a bit rarely (mutation), keep the best one unchanged, and repeat.
5. **Other classic ideas.** **Expert systems** store an expert's rules as if-then statements and chain them together. **Fuzzy logic** lets a statement be partly true, for example "warm" to degree 0.7. **Swarm methods** are search methods in the same spirit as genetic algorithms.

```maths How much work constraints save
situation: Colouring five regions with three colours. Brute force tries every full assignment. Backtracking undoes a choice as soon as it breaks a rule.
find: How many full assignments exist, and how many of them are valid?
step: All complete assignments | 3^5 = 243
step: Valid ones, from the run below (12 of them) | 12 ÷ 243 ≈ 0.049
result: There are 243 complete assignments but only 12 are valid, about 5%. Backtracking found one after just 9 colour choices.
why: Most of the search space is wasted if you finish a bad assignment before checking it. Checking each choice immediately means whole families of bad assignments are never visited.
try: With 4 colours and 5 regions, how many complete assignments are there?
answer: 4^5 = 1024. One extra colour multiplies the space by more than four, which is why smarter search matters.
```

```maths The size of a truth table
situation: A truth table has one row for every combination of true and false for the statements involved.
find: How many rows does it have for 2, 3 and 20 statements?
step: Two statements | 2^2 = 4
step: Three statements | 2^3 = 8
step: Twenty statements | 2^20 = 1048576
result: The rows double with every added statement: 4, 8, and over a million for twenty.
why: Checking every row works for a few statements and becomes slow quickly. Real logic programs use smarter methods, such as SAT solvers, that avoid listing every row.
```

```maths One generation of a genetic algorithm
situation: Each candidate is 10 bits, and its fitness is the number of 1 bits, so the best possible is 10. One candidate is 1101001110.
find: What is its fitness, and how many bits does mutation flip per child on average if each bit flips with chance 0.05?
step: Fitness, counting the ones | 1 + 1 + 0 + 1 + 0 + 0 + 1 + 1 + 1 + 0 = 6
step: Expected flips per child | 10 × 0.05 = 0.5
result: Fitness is 6 out of a best of 10. About one child in two has a mutation.
why: Selection pushes fitness up and mutation keeps fresh variety in the population, so the search does not get stuck.
try: What is the fitness of 1111011111?
answer: Nine ones, so the fitness is 9, one short of the best.
```

## Python example
Three small demonstrations: map colouring with backtracking, a truth-table check that "if P then Q, and P" guarantees Q, and a genetic algorithm that evolves a 10-bit string towards all ones, with a small repeatable random generator so that the numbers repeat.

```python logic.py
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
```
```text Output of logic.py (executed)
brute force would check 243 assignments and finds 12 that work
backtracking found a solution after 9 colour choices: A=red B=green C=blue D=red E=green
rows where both statements are true: [(True, True)] -> Q is always true there: True
generation  best fitness  average fitness
         0             6             4.50
         1             6             4.17
         2             7             6.00
         3             7             6.00
         4             7             6.33
         5             7             6.17
         6             7             6.50
         7             8             6.00
         8             8             6.33
```
Brute force would check 243 assignments and finds 12 that work. Backtracking reaches a valid colouring after 9 colour choices. In the truth table the only row where both statements are true is P true and Q true, so Q follows. The genetic algorithm starts with a best fitness of 6 and an average of 4.50, and after eight generations the best is 8 and the average 6.33. It did not reach 10 in this short run.

## .NET (C#) example
The same three demonstrations written from scratch in C# with no packages, printing the same output. For large constraint problems in .NET, a dedicated solver library is the usual choice; for logic and planning there is no standard .NET library, and the small algorithms here are easy to write directly.

```cs Program.cs
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
```

## Maths behind it
- Powers: how a search space grows (arithmetic)
- Truth tables and Boolean logic (logic)
- Counting and averaging fitness (arithmetic)
- Probability of a mutation (probability)

## Common mistakes
- Checking constraints only after the whole assignment is complete, which wastes most of the work.
- Treating a truth table as practical for dozens of statements.
- Writing a plan's actions without clear conditions, so impossible steps are allowed.
- Using a genetic algorithm when a direct method exists. It is a general tool and often slower.
- Reading a short genetic-algorithm run as proof that it works. Repeat with different random seeds.

## Quick check
Q: Why is backtracking much faster than trying all complete assignments?
A: It undoes a choice as soon as it breaks a rule, so every assignment that contains that mistake is never examined.

Q: How many rows does a truth table for 4 statements have?
A: 2^4 = 16.

Q: What are the two parts of an action in a planner?
A: Conditions that must be true before it can be done, and effects that change the situation afterwards.

Q: What do crossover and mutation do in a genetic algorithm?
A: Crossover builds a child from parts of two parents. Mutation flips a bit now and then, which keeps variety in the population.
