---
id: ai-search
title: Search and games, the classic AI way
module: ml
level: Intermediate
minutes: 60
maths: basic arithmetic
goal: Explain how breadth-first search and A* find a route through a maze, why a good guess about the remaining distance saves work, and how minimax with alpha-beta pruning chooses a move in a two-player game.
prereqs: s-what-is-ai
reviewed: 2026-11-19
evidence: A maze solved by breadth-first search and by A* with the number of cells each looked at, and a small game tree solved by minimax with the number of leaves alpha-beta skipped.
code: Python executed 2026-11-19 (examples/search-games/search.py, standard library only); the C# version prints the same output
---
## In plain words
Before machine learning, much of AI was **search**: write down every situation the program can be in, every move it can make, and look for a sequence of moves that reaches a goal. A satnav looking for a route, a puzzle solver and a robot planning a path all work this way. **Breadth-first search** explores outwards one step at a time, so it always finds the route with the fewest steps, but it may look at a lot of places. **A\*** (say "A star") is smarter: for each place it adds the steps taken so far to a guess of the steps still needed, and explores the most promising place first. When the guess never over-estimates, A* still finds the shortest route. For games with two players, **minimax** assumes your opponent always makes the move that is worst for you, and picks the move whose worst case is best. **Alpha-beta pruning** skips branches that cannot change the answer.

```diagram flow Breadth-first search
note: Every place at distance one is explored before any at distance two, and so on.
- Start with the starting place in a queue | The queue holds places to explore | input
- Take the oldest place from the queue | Check if it is the goal | process
- Add its unvisited neighbours to the back | They are one step further out | model
- Stop when the goal comes out of the queue | The route found is the shortest | output
```

```diagram compare Uninformed and informed search
note: The only difference is whether the program has a guess about how far the goal is.
## Uninformed (breadth-first) | process
- No idea where the goal is
- Explores in all directions
## Informed (A*) | output
- Uses a guess of the distance still to go
- Explores the promising places first
```

```diagram compare Minimax and alpha-beta pruning
note: Pruning never changes the answer. It only avoids work that cannot matter.
## Minimax | process
- Looks at every possible move and reply
- Assumes the opponent plays their best
## Alpha-beta | output
- Same answer as minimax
- Skips branches that cannot beat the best so far
```

## Real-world example
A delivery app needs the quickest way across a city of a million junctions. Breadth-first search would look at junctions in every direction, including those far away from the destination. The app uses A* with the straight-line distance to the destination as its guess. Straight-line distance never over-estimates the road distance, so A* is guaranteed to find the best route, and it explores far fewer junctions. The same family of ideas lies behind game-playing programs, which look ahead several moves with minimax and prune the branches that cannot matter.

## How it works
1. **Describe the problem.** A set of states (cells in the maze), the moves from each state, the starting state and the goal.
2. **Breadth-first search.** Keep a queue of places to visit. Take the oldest, add its unvisited neighbours at the back, repeat until the goal is taken.
3. **A\*.** Give each place a score f = g + h, where g is the steps taken to reach it and h is a guess of the steps still to go. Always explore the place with the smallest f. If h never over-estimates, the first time the goal is taken, the route is the shortest.
4. **Minimax.** In a game tree, the player to move picks the move with the best value. At the opponent's turn, the value is the lowest value for you among their replies.
5. **Alpha-beta.** While checking replies to one move, stop as soon as one reply is already worse for you than a move you have already found. The remaining replies cannot make this move the best.

```maths A* chooses by steps taken plus steps guessed
situation: A maze with the goal at row 4, column 4. A cell at row 2, column 2 was reached after 3 steps. The guess h is the Manhattan distance: the rows still to go plus the columns still to go.
find: What is this cell's score f?
step: The guess of the steps still to go | abs(2 - 4) + abs(2 - 4) = 4
step: Steps taken plus the guess | 3 + 4 = 7
result: The cell's f is 7. A* always explores the cell with the smallest f first.
formula: f = g + h
means: g is the real cost so far, h is the guess of the cost still to come.
why: Cells that are close to the goal get a small h, so A* does not waste time on cells that lead away. Breadth-first search has no h, so it looks everywhere.
caution: The guess must never be larger than the true remaining distance, or A* may miss the shortest route.
try: Another cell was reached after 5 steps and is at row 3, column 1. What is its f?
answer: h = abs(3 - 4) + abs(1 - 4) = 1 + 3 = 4, so f = 5 + 4 = 9. It scores worse than the first cell (7), so A* tries the first one first.
```

```maths How fast game trees grow
situation: A game where each player has 3 possible moves each turn. We count the positions at the end of a number of moves.
find: How many end positions are there after 2 moves, and after 10?
step: After 2 moves | 3^2 = 9
step: After 10 moves | 3^10 = 59049
step: With 30 moves available each turn, after only 4 moves | 30^4 = 810000
result: The tree grows by multiplying at every move. Three choices become 59049 positions after ten moves.
why: This explosive growth is why programs cannot look at everything, and why pruning and good guesses matter. Chess has far more than 3 moves per turn, so a program uses pruning and a scoring guess to stop early.
```

## Live simulation
Search is a way to find a path or a move. Two pictures show the main ideas.

```sim srch Searching a maze
preset: maze
question: How do different search methods find a way through a maze, and what does each one cost?
watch: Slide the number of cells examined, or run to the end. The numbers show the order in which cells were examined.
watch: Breadth-first spreads out evenly. Depth-first dives as far as it can. A* leans toward the goal.
watch: Compare the path length and the number of cells examined for the three methods.
try: guided | Run A* to the end and see it examine fewer cells than breadth-first while still finding the shortest path (13 steps).
predict: Which methods are guaranteed to find the shortest path here? | Depth-first | Breadth-first, and A* with a distance guide | All three
answer: 2 | Breadth-first looks at every cell one step away, then two steps, and so on, so the first path it finds is the shortest. A* with a distance that never overestimates also finds the shortest. Depth-first found a 21-step path in this maze.
leaves-out: One fixed 8 by 8 maze where every step costs the same. Real search problems have steps with different costs and far larger spaces, and the choice of guide for A* matters.
reference: examples/sim-ai/ai.py
```

```sim srch Choosing a move in a two-player game
preset: tree
question: How does a program choose a move when an opponent will answer it, and how can it skip moves that cannot matter?
watch: You pick one of three moves, then the opponent picks a reply. The numbers at the bottom say how good each result is for you.
watch: The opponent is assumed to pick the reply that is worst for you. You pick the move whose worst case is best (minimax).
watch: Switch on pruning and see how many positions can be skipped without changing the answer.
try: prune | Switch on pruning and see the program look at fewer than 9 positions.
predict: In the second branch the opponent can already hold you to 2, and the first branch is worth 3 to you. Do you need to look at the other replies in the second branch? | Yes, always | No, they cannot change your choice | Only if they are larger
answer: 2 | The second branch is already worth at most 2 to you, which is worse than the 3 you have. More replies can only make it worse for you, so they cannot change your choice.
leaves-out: A tiny tree with nine made-up values. Real game programs search millions of positions, use a scoring function for positions they cannot finish, and order the moves so that pruning works best.
reference: examples/sim-ai/ai.py
```

## Python example
A 5 by 5 maze with walls, solved by breadth-first search and by A*, followed by a small game tree solved by minimax and by alpha-beta. The standard library is enough.

```python search.py
"""Search in a grid maze (breadth-first and A*) and a two-player game tree (minimax with alpha-beta pruning).

Run:  python search.py
"""
from collections import deque

maze = ["S..#.",
        ".#.#.",
        ".#...",
        ".###.",
        "....G"]
H, W = len(maze), len(maze[0])
start, goal = (0, 0), (4, 4)
moves = [(-1, 0), (0, 1), (1, 0), (0, -1)]                 # up, right, down, left

def neighbours(p):
    for dr, dc in moves:
        r, c = p[0] + dr, p[1] + dc
        if 0 <= r < H and 0 <= c < W and maze[r][c] != "#":
            yield (r, c)

def bfs():
    queue, seen, expanded = deque([(start, 0)]), {start}, 0
    while queue:
        p, d = queue.popleft(); expanded += 1
        if p == goal:
            return d, expanded
        for q in neighbours(p):
            if q not in seen:
                seen.add(q); queue.append((q, d + 1))

def astar():
    h = lambda p: abs(p[0] - goal[0]) + abs(p[1] - goal[1])    # Manhattan distance: never over-estimates
    frontier, best, expanded, counter = [(h(start), 0, 0, start)], {start: 0}, 0, 1   # (f, order, g, cell)
    while frontier:
        frontier.sort(key=lambda t: (t[0], t[1]))
        f, _, g, p = frontier.pop(0); expanded += 1
        if p == goal:
            return g, expanded
        for q in neighbours(p):
            if q not in best or g + 1 < best[q]:
                best[q] = g + 1
                frontier.append((g + 1 + h(q), counter, g + 1, q)); counter += 1

d1, e1 = bfs(); d2, e2 = astar()
print("maze: shortest path has %d steps" % d1)
print("breadth-first search looked at %d cells; A* looked at %d cells (path %d steps)" % (e1, e2, d2))

# Minimax on a game tree: the first player picks a branch, then the second player picks the worst leaf for the first.
tree = [[3, 5, 2], [2, 9, 1], [4, 6, 8]]
print("minimax value of the game: %d" % max(min(b) for b in tree))
def alphabeta():
    alpha, looked = -99, 0
    for branch in tree:
        beta = 99
        for leaf in branch:
            looked += 1
            beta = min(beta, leaf)
            if beta <= alpha:                                  # the first player already has something better elsewhere
                break
        alpha = max(alpha, beta)
    return alpha, looked
value, looked = alphabeta()
print("alpha-beta gives the same value %d after looking at %d of 9 leaves" % (value, looked))
```
```text Output of search.py (executed)
maze: shortest path has 8 steps
breadth-first search looked at 18 cells; A* looked at 16 cells (path 8 steps)
minimax value of the game: 4
alpha-beta gives the same value 4 after looking at 7 of 9 leaves
```
Both searches find a path of 8 steps. The maze has 25 cells and 7 walls, so 18 open cells, and breadth-first search looked at all 18 of them. A* looked at 16, so it saved 2 cells on this small maze. The saving grows with the size of the maze. In the game tree, the best the first player can do is 4. Alpha-beta found it after looking at 7 of the 9 leaves.

```maths What the pruning saved
situation: In the game tree, the first branch has the leaves 3, 5 and 2, the second 2, 9 and 1, and the third 4, 6 and 8. After the first branch, the first player already has a guaranteed 2. In the second branch the first reply is 2, which is no better, so the rest of that branch (9 and 1) is not checked.
find: How many leaves did alpha-beta look at, and how many did it skip?
step: Leaves looked at (3 in the first branch, 1 in the second, 3 in the third) | 3 + 1 + 3 = 7
step: Leaves skipped | 9 - 7 = 2
step: Share skipped | 2 ÷ 9 ≈ 0.222
result: 7 leaves looked at, 2 skipped, which is about 22% of the work saved, with exactly the same answer.
why: On larger trees the share skipped is much bigger, especially if the best moves are tried first.
```

## .NET (C#) example
Breadth-first search, A* and alpha-beta pruning written from scratch in C#, with no packages. It prints the same output as the Python run. .NET has no search library that this guide could verify, and these algorithms are short enough to write directly.

```cs Program.cs
// Breadth-first search, A* and alpha-beta pruning from scratch. Same output as search.py. No packages.
string[] maze = { "S..#.", ".#.#.", ".#...", ".###.", "....G" };
int H = maze.Length, W = maze[0].Length;
(int r, int c) start = (0, 0), goal = (4, 4);
(int dr, int dc)[] moves = { (-1, 0), (0, 1), (1, 0), (0, -1) };    // up, right, down, left

IEnumerable<(int r, int c)> Neighbours((int r, int c) p)
{
    foreach (var (dr, dc) in moves)
    {
        int r = p.r + dr, c = p.c + dc;
        if (r >= 0 && r < H && c >= 0 && c < W && maze[r][c] != '#') yield return (r, c);
    }
}

(int dist, int expanded) Bfs()
{
    var queue = new Queue<((int r, int c) p, int d)>(); queue.Enqueue((start, 0));
    var seen = new HashSet<(int, int)> { start }; int expanded = 0;
    while (queue.Count > 0)
    {
        var (p, d) = queue.Dequeue(); expanded++;
        if (p == goal) return (d, expanded);
        foreach (var q in Neighbours(p)) if (seen.Add(q)) queue.Enqueue((q, d + 1));
    }
    return (-1, expanded);
}

(int dist, int expanded) AStar()
{
    int Heur((int r, int c) p) => Math.Abs(p.r - goal.r) + Math.Abs(p.c - goal.c);     // Manhattan distance: never over-estimates
    var frontier = new List<(int f, int order, int g, (int r, int c) p)> { (Heur(start), 0, 0, start) };
    var best = new Dictionary<(int, int), int> { [start] = 0 };
    int expanded = 0, counter = 1;
    while (frontier.Count > 0)
    {
        var top = frontier.OrderBy(t => t.f).ThenBy(t => t.order).First();
        frontier.Remove(top); expanded++;
        if (top.p == goal) return (top.g, expanded);
        foreach (var q in Neighbours(top.p))
            if (!best.TryGetValue(q, out int old) || top.g + 1 < old)
            {
                best[q] = top.g + 1;
                frontier.Add((top.g + 1 + Heur(q), counter++, top.g + 1, q));
            }
    }
    return (-1, expanded);
}

var (d1, e1) = Bfs(); var (d2, e2) = AStar();
Console.WriteLine($"maze: shortest path has {d1} steps");
Console.WriteLine($"breadth-first search looked at {e1} cells; A* looked at {e2} cells (path {d2} steps)");

// Minimax on a game tree: the first player picks a branch, then the second player picks the worst leaf for the first.
int[][] tree = { new[] { 3, 5, 2 }, new[] { 2, 9, 1 }, new[] { 4, 6, 8 } };
Console.WriteLine($"minimax value of the game: {tree.Max(b => b.Min())}");
int alpha = -99, looked = 0;
foreach (var branch in tree)
{
    int beta = 99;
    foreach (int leaf in branch)
    {
        looked++;
        beta = Math.Min(beta, leaf);
        if (beta <= alpha) break;                                   // the first player already has something better elsewhere
    }
    alpha = Math.Max(alpha, beta);
}
Console.WriteLine($"alpha-beta gives the same value {alpha} after looking at {looked} of 9 leaves");
```

## Maths behind it
- Counting steps and adding costs (arithmetic)
- Manhattan distance on a grid (geometry)
- Exponential growth of choices (powers)
- Maximum and minimum along a tree (comparison)

## Common mistakes
- Using a guess in A* that sometimes over-estimates the true distance, which can return a route that is not the shortest.
- Forgetting to remember visited places, so the search loops forever.
- Assuming minimax is enough for a large game without pruning or a good scoring guess.
- Searching a state space that is far too big for the time available, without a plan for cutting it down.

## Quick check
Q: Why does breadth-first search always find the shortest route in a maze?
A: It explores all places at distance one before any at distance two, and so on, so the first time it reaches the goal it has used the fewest steps.

Q: What is the guess in A* for, and what must be true of it?
A: It estimates the steps still to go so that promising places are explored first. It must never over-estimate, or A* may miss the shortest route.

Q: What does alpha-beta pruning change about the minimax answer?
A: Nothing. It gives exactly the same value but skips branches that cannot matter.

Q: A game has 3 moves per turn. How many end positions are there after 4 moves?
A: 3^4 = 81.
