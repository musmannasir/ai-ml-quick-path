---
id: dl-graphs
title: Graph neural networks: learning from connections
module: dl
level: Advanced
minutes: 60
goal: Represent data as nodes and edges, explain message passing, and classify nodes from very few labels using their neighbours.
prereqs: dl-neural-nets
reviewed: 2026-11-02
evidence: A small graph you build with node predictions explained by each node's neighbours.
code: Python executed 2026-11-02 (gap_topics.py gnn); C# is plain .NET with no packages and was not compiled (no .NET SDK in the build environment)
---
## In plain words
Some data is about **connections**: people and friendships, bank accounts and transfers, atoms and bonds, roads and junctions. This is a **graph**: **nodes** (the things) joined by **edges** (the links). A **graph neural network (GNN)** learns from a node's own information and from its neighbours. The key idea is **message passing**: in each layer, every node collects information from its neighbours and updates itself. After two layers, a node knows about nodes two steps away. GNNs answer three kinds of questions: about a **node** (is this account fraud?), about a **link** (will these two people connect? will this customer buy this product?) and about a **whole graph** (is this molecule toxic?). Knowledge graphs, which store facts as connected entities, are also used with LLMs ("GraphRAG").

```diagram nest A graph in words
- Graph | Data about connections | store
- Nodes | The things: people, accounts, atoms, junctions | input
- Edges | The links: friendships, transfers, bonds, roads | process
```

```diagram merge Message passing for one node
- Node's updated information | Its own details plus what its neighbours know | output
- Node's own information | Where it starts | input
- Neighbour A | Sends information | process
- Neighbour B | Sends information | process
```

```diagram compare Three kinds of GNN question
## Node | model
- Is this account fraud?
## Link | process
- Will these two people connect?
- Will this customer buy this product?
## Whole graph | output
- Is this molecule toxic?
```

## Real-world example
A payments company knows fraud rings share devices and pass money between their accounts. A GNN that looks at each account's connections flags new accounts linked to known fraud, even when the new account's own details look normal.

## How it works
1. Build the graph: nodes, edges and any node features.
2. Add each node's link to itself and normalise, so busy nodes do not dominate.
3. Pass messages: each node combines its neighbours' information; repeat once per layer.
4. Train a classifier on the few nodes that have labels.
5. Predict for the rest; check results on held-out nodes.

```diagram flow Building a graph classifier
- Build the graph | Nodes, edges, node features | input
- Self-link and normalise | So busy nodes do not dominate | process
- Pass messages | Once per layer | model
- Train on labelled nodes | Only a few have labels | process
- Predict and check | Held-out nodes | output
```

```diagram flow Reach grows with each layer
- Layer 1 | A node knows its direct neighbours | process
- Layer 2 | It knows nodes two steps away | model
```

## Python example
Eight nodes in two loose groups (0–3 and 4–7) joined by one edge (3–4). Only node 0 and node 7 have labels:
```text Output of gap_topics.py gnn (executed)
predicted community per node: [0, 0, 0, 0, 1, 1, 1, 1]
node 3 neighbours: [1, 2, 4] | node 4 neighbours: [3, 5, 6]
```
From two labels, every node is placed correctly. Nodes 3 and 4 each have one neighbour on the other side, but most of their neighbours are in their own group.
```python message passing (excerpt)
d = A.sum(1); A_hat = A / np.sqrt(np.outer(d, d))     # normalised connections (with self-links)
H = A_hat @ A_hat @ X                                  # two rounds of message passing
clf = LogisticRegression(C=10).fit(H[list(labelled)], list(labelled.values()))
```

## .NET (C#) example
Label propagation, the simplest form of message passing, in plain C#: each round, every node averages its neighbours' label scores.
```cs Program.cs
int n = 8;
var edges = new (int, int)[] { (0,1),(0,2),(1,2),(1,3),(2,3),(3,4),(4,5),(5,6),(5,7),(6,7),(4,6) };
var neighbours = Enumerable.Range(0, n).Select(i => new List<int> { i }).ToArray();   // include itself
foreach (var (a, b) in edges) { neighbours[a].Add(b); neighbours[b].Add(a); }

var score = new double[n, 2];
score[0, 0] = 1; score[7, 1] = 1;                     // only two labelled nodes
for (int round = 0; round < 3; round++)
{
    var next = new double[n, 2];
    for (int i = 0; i < n; i++)
        foreach (int j in neighbours[i])
            for (int c = 0; c < 2; c++) next[i, c] += score[j, c] / neighbours[i].Count;
    next[0, 0] = 1; next[0, 1] = 0; next[7, 0] = 0; next[7, 1] = 1;   // keep known labels fixed
    score = next;
}
for (int i = 0; i < n; i++) Console.Write($"{(score[i, 1] > score[i, 0] ? 1 : 0)} ");
```
For real GNNs use PyTorch Geometric or DGL in Python; in .NET, TorchSharp can implement the same layers.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Averaging neighbours (message passing)
**Where it is used:** a GNN updates each account by averaging the features of the accounts connected to it.

```formula Neighbour average
new feature = (sum of neighbour features) ÷ (number of neighbours)
```
**In plain words:** each node learns about itself from the company it keeps. Features are numbers such as "money sent" and "account age".

**Example 1: three neighbours.** An account has neighbours with features (2, 0), (4, 2) and (0, 4). Sum = (6, 6). Divide by 3: (2, 2).

**Example 2: one neighbour and none.** With a single neighbour (5, 1), the average is just (5, 1). With no neighbours there is nothing to average (division by 0), so real systems add the node's own features or a fixed default.

### Counting possible links (why graphs get big)
**Where it is used:** link prediction guesses which pairs of accounts are connected, and the number of pairs grows fast.

```formula Possible links and density
possible links = n × (n - 1) ÷ 2
density = actual links ÷ possible links
```
n is the number of nodes. Each link is counted once.

**In plain words:** most pairs are not linked, so real graphs are sparse.

**Example 1: 10 accounts.** 10 × 9 ÷ 2 = 45 possible links. If 9 exist, density = 9 ÷ 45 = 0.2.

**Example 2: 1,000 accounts.** 1,000 × 999 ÷ 2 = 499,500 possible links. If 2,000 exist, density = 2,000 ÷ 499,500 ≈ 0.004, so checking every pair is wasteful.

## Maths behind it
- Graph theory: adjacency matrix, degree
- Normalised adjacency and spectral graph theory
- Message passing and aggregation
- Semi-supervised learning

## Common mistakes
- Random train/test splits across a graph where neighbours share information, which leaks answers.
- Forgetting that graphs change over time (new accounts, new links).
- Using a GNN when simple counts of connections (degree, shared devices) already solve the problem.

```diagram compare Splitting a graph
## Random split | bad
- Neighbours share information, so answers leak
## Split with neighbours in mind | output
- Check results on held-out nodes | Do not let connected nodes share answers
```

## Quick check
Q: What is message passing?
A: Each node updates itself using information gathered from its neighbours, round by round.

Q: Name one node-level and one graph-level task.
A: Node: is this account fraudulent? Graph: is this molecule toxic?

Q: Why normalise connections?
A: So nodes with many neighbours do not receive much larger totals and dominate.
