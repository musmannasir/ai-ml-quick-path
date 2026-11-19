"""The calculation behind the Phase 5 simulations (recommender, time series, probability of a test result, a
treatment paradox, search and games, backtracking puzzle), in plain Python (no packages). The page does the same
calculation in JavaScript (public/assets/sims/ai.js); scripts/check-sims.mjs checks that the two agree.

Run:  python ai.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim-supervised"))
from algorithms import lcg  # noqa: E402


def gauss(r):
    return (r() + r() + r() - 1.5) * 2


# ---- recommender: made-up ratings, 0 = not rated ----
ITEMS = ["Film A", "Film B", "Film C", "Film D", "Film E", "Film F"]
RATINGS = [[5, 4, 0, 1, 0, 2], [5, 5, 4, 1, 0, 1], [4, 0, 5, 2, 1, 0], [1, 2, 1, 5, 4, 0], [0, 1, 2, 5, 5, 4], [2, 1, 0, 4, 0, 5]]


def user_similarity(a, b):
    both = [i for i in range(6) if RATINGS[a][i] and RATINGS[b][i]]
    if not both:
        return 0.0
    num = sum(RATINGS[a][i] * RATINGS[b][i] for i in both)
    return num / (math.sqrt(sum(RATINGS[a][i] ** 2 for i in both)) * math.sqrt(sum(RATINGS[b][i] ** 2 for i in both)))


def predict(user, item, k):
    cand = [(user_similarity(user, u), u) for u in range(6) if u != user and RATINGS[u][item]]
    cand.sort(key=lambda t: (-t[0], t[1]))
    use = cand[:k]
    den = sum(s for s, _ in use)
    return sum(s * RATINGS[u][item] for s, u in use) / den if den else None


def item_average(item):
    r = [row[item] for row in RATINGS if row[item]]
    return sum(r) / len(r)


# ---- time series ----
def series():
    r = lcg(31)
    return [50 + 0.8 * t + 8 * math.sin(2 * math.pi * t / 12) + 3 * gauss(r) for t in range(48)]


def fit_trend_season(y, n_train):
    ts = list(range(n_train))
    mt, my = sum(ts) / n_train, sum(y[:n_train]) / n_train
    b = sum((t - mt) * (y[t] - my) for t in ts) / sum((t - mt) ** 2 for t in ts)
    a = my - b * mt
    season = []
    for m in range(12):
        res = [y[t] - (a + b * t) for t in ts if t % 12 == m]
        season.append(sum(res) / len(res))
    return a, b, season


def forecast(model, y, h):
    """Forecast months 36 .. 36+h-1 (the held-out year, from the first 36 months)."""
    if model == "naive":
        return [y[35]] * h
    if model == "seasonal":
        return [y[36 + i - 12] for i in range(h)]
    a, b, season = fit_trend_season(y, 36)
    return [a + b * (36 + i) + season[(36 + i) % 12] for i in range(h)]


def mae(model, y, h):
    f = forecast(model, y, h)
    return sum(abs(f[i] - y[36 + i]) for i in range(h)) / h


# ---- probability of a test result ----
def posterior(prior, sens, spec, positives):
    p = prior
    for _ in range(positives):
        p = p * sens / (p * sens + (1 - p) * (1 - spec))
    return p


def counts(prior, sens, spec, n=10000):
    ill = math.floor(n * prior + 0.5)
    well = n - ill
    tp = math.floor(ill * sens + 0.5)
    fp = math.floor(well * (1 - spec) + 0.5)
    return tp, ill - tp, fp, well - fp


# ---- treatment paradox: made-up recovery rates ----
RATES = {"A": (0.9, 0.7), "B": (76 / 90, 0.5)}     # (easy cases, hard cases)


def overall(t, hard_share):
    easy, hard = RATES[t]
    return (1 - hard_share) * easy + hard_share * hard


# ---- search ----
MAZE = ["S.......", ".####.#.", "...#..#.", ".#.#.##.", ".#...#..", ".####.#.", "......#G", ".######."]
START, GOAL = (0, 0), (7, 6)
DIRS = [(0, -1), (1, 0), (0, 1), (-1, 0)]


def open_cell(p):
    return 0 <= p[0] < 8 and 0 <= p[1] < 8 and MAZE[p[1]][p[0]] != "#"


def solve(algo):
    frontier = [(START, 0)]
    came = {START: None}
    gcost = {START: 0}
    order = []
    counter = 0
    while frontier:
        if algo == "bfs":
            cur, _ = frontier.pop(0)
        elif algo == "dfs":
            cur, _ = frontier.pop()
        else:
            best = min(range(len(frontier)), key=lambda i: (gcost[frontier[i][0]] + abs(frontier[i][0][0] - GOAL[0]) + abs(frontier[i][0][1] - GOAL[1]), abs(frontier[i][0][0] - GOAL[0]) + abs(frontier[i][0][1] - GOAL[1]), frontier[i][1]))
            cur, _ = frontier.pop(best)
        if cur in order:
            continue
        order.append(cur)
        if cur == GOAL:
            break
        for d in DIRS:
            nx = (cur[0] + d[0], cur[1] + d[1])
            if open_cell(nx) and nx not in came:
                came[nx] = cur
                gcost[nx] = gcost[cur] + 1
                counter += 1
                frontier.append((nx, counter))
    path, p = [], GOAL
    while p is not None:
        path.append(p)
        p = came[p]
    return order, len(path) - 1


LEAVES = [3, 12, 8, 2, 4, 6, 14, 5, 2]


def minimax(prune):
    seen = 0
    alpha, best = -math.inf, -math.inf
    for m in range(3):
        beta, val = math.inf, math.inf
        for k in range(3):
            seen += 1
            val = min(val, LEAVES[m * 3 + k])
            if prune:
                beta = min(beta, val)
                if beta <= alpha:
                    break
        best = max(best, val)
        alpha = max(alpha, val)
    return best, seen


# ---- backtracking puzzle: colour a map with 3 colours ----
REGIONS = 7
BORDERS = [(0, 4), (1, 3), (1, 5), (1, 6), (3, 4), (3, 5), (4, 5), (4, 6), (5, 6)]
NEIGH = [[b if a == r else a for a, b in BORDERS if r in (a, b)] for r in range(REGIONS)]


def colour_map(smart):
    col = [None] * REGIONS
    stats = {"tries": 0, "back": 0}

    def legal(r):
        return [c for c in range(3) if all(col[n] != c for n in NEIGH[r])]

    def go():
        free = [r for r in range(REGIONS) if col[r] is None]
        if not free:
            return True
        r = min(free, key=lambda x: (len(legal(x)), x)) if smart else free[0]
        for c in range(3):
            stats["tries"] += 1
            if all(col[n] != c for n in NEIGH[r]):
                col[r] = c
                if go():
                    return True
                col[r] = None
                stats["back"] += 1
        return False
    ok = go()
    return ok, stats["tries"], stats["back"], list(col)


if __name__ == "__main__":
    print("similarity of user 1 to the others: " + " ".join("%.3f" % user_similarity(0, u) for u in range(1, 6)))
    for item in (2, 4):
        print("predicted rating for user 1, %s: k=2 %.2f, k=3 %.2f, everyone's average %.2f" % (ITEMS[item], predict(0, item, 2), predict(0, item, 3), item_average(item)))
    y = series()
    a, b, season = fit_trend_season(y, 36)
    print("trend per month %.3f, strongest season effect %.2f" % (b, max(season, key=abs)))
    for h in (1, 3, 12):
        print("forecast error (MAE) over the next %d month(s): repeat last %.2f, repeat last year %.2f, trend and season %.2f" % (h, mae("naive", y, h), mae("seasonal", y, h), mae("trend", y, h)))
    for prior, sens, spec in ((0.10, 0.95, 0.90), (0.01, 0.95, 0.90), (0.5, 0.95, 0.90)):
        print("prior %.2f, sensitivity %.2f, specificity %.2f: chance of illness after 1 positive %.3f, after 2 %.3f" % (prior, sens, spec, posterior(prior, sens, spec, 1), posterior(prior, sens, spec, 2)))
    print("10000 people at prior 0.01: true positives %d, missed %d, false alarms %d, true negatives %d" % counts(0.01, 0.95, 0.90))
    for hs in ((0.8, 0.1), (0.5, 0.5)):
        print("treatment A with %.0f%% hard cases %.3f; treatment B with %.0f%% hard cases %.3f" % (hs[0] * 100, overall("A", hs[0]), hs[1] * 100, overall("B", hs[1])))
    for algo in ("bfs", "dfs", "astar"):
        order, length = solve(algo)
        print("maze, %s: %d cells examined, path of %d steps" % (algo, len(order), length))
    for prune in (False, True):
        best, seen = minimax(prune)
        print("game tree, %s: best value %d, leaves looked at %d of 9" % ("with pruning" if prune else "without pruning", best, seen))
    for smart in (False, True):
        ok, tries, back, col = colour_map(smart)
        print("map colouring, %s: solved %s, colours tried %d, backtracks %d, result %s" % ("most constrained first" if smart else "fixed order", ok, tries, back, "".join("RGB"[c] for c in col)))
