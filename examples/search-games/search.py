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
