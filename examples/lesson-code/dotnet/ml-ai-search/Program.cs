// From lesson 'ai-search' (ml). Code status: Python executed 2026-11-19 (examples/search-games/search.py, standard library only); the C# version prints the same output
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
