# GraphLab — Algorithms & Features Explanation Guide

> **Project**: GraphLab — Interactive Graph Theory Laboratory  
> **Purpose**: This document explains all the algorithms and features used in GraphLab in simple terms, suitable for presenting to a teacher.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Graph Traversal Algorithms](#2-graph-traversal-algorithms)
   - BFS (Breadth-First Search)
   - DFS (Depth-First Search)
3. [Shortest Path Algorithms](#3-shortest-path-algorithms)
   - Dijkstra's Algorithm
   - Bellman-Ford Algorithm
   - BFS Pathfinding
   - DFS Pathfinding
4. [Minimum Spanning Tree](#4-minimum-spanning-tree)
   - Prim's Algorithm
5. [Eulerian & Hamiltonian Paths](#5-eulerian--hamiltonian-paths)
6. [Complement Graph](#6-complement-graph)
7. [Bipartite Graph Verification](#7-bipartite-graph-verification)
8. [Havel-Hakimi Theorem (Degree Sequences)](#8-havel-hakimi-theorem)
9. [Graph Isomorphism](#9-graph-isomorphism)
10. [Adjacency Matrix & Incidence Matrix](#10-adjacency-matrix--incidence-matrix)
11. [AI Tutor & Image-to-Graph](#11-ai-tutor--image-to-graph)

---

## 1. Project Overview

GraphLab is a **web-based interactive graph theory tool** built with **React**, **TypeScript**, and **Vite**. It allows users to:

- **Draw graphs** on a canvas (add nodes, connect edges)
- **Run algorithms** step-by-step with visual animation
- **Analyze graph properties** (complement, bipartite check, degree sequences, isomorphism)
- **Generate matrices** (adjacency matrix, incidence matrix)
- **Use AI** to explain graph theory concepts

The project uses an **adjacency list** data structure to store graphs internally:
```
Map<nodeId, GraphEdge[]>
```
Each node has an ID, coordinates (x, y), and radius. Each edge stores source, destination, weight, and type (directed/undirected).

---

## 2. Graph Traversal Algorithms

### 2.1 BFS (Breadth-First Search)

**What it does**: Explores a graph level by level, visiting all neighbors of a node before moving deeper.

**How it works**:
1. Start from a source node, add it to a **Queue**
2. While the queue is not empty:
   - Remove the front node from the queue
   - Mark it as **visited**
   - Add all its **unvisited neighbors** to the back of the queue
3. This ensures nodes are visited in order of their distance from the source

**Data Structure Used**: Queue (FIFO — First In, First Out)

**Time Complexity**: O(V + E), where V = vertices, E = edges

**Example**: Starting from node A in graph A—B—C—D:
```
Step 1: Visit A, Queue = [B]
Step 2: Visit B, Queue = [C]
Step 3: Visit C, Queue = [D]
Step 4: Visit D, Queue = []
```

---

### 2.2 DFS (Depth-First Search)

**What it does**: Explores a graph by going as deep as possible along each branch before backtracking.

**How it works**:
1. Start from a source node, push it onto a **Stack**
2. While the stack is not empty:
   - Pop the top node from the stack
   - If not visited, mark it as **visited**
   - Push all its **unvisited neighbors** onto the stack
3. This creates a deep exploration path

**Data Structure Used**: Stack (LIFO — Last In, First Out)

**Time Complexity**: O(V + E)

**Example**: Starting from node A in a graph A—B—C, A—D:
```
Step 1: Visit A, Stack = [D, B]
Step 2: Visit B, Stack = [D, C]
Step 3: Visit C, Stack = [D]
Step 4: Visit D, Stack = []
```

---

## 3. Shortest Path Algorithms

### 3.1 Dijkstra's Algorithm

**What it does**: Finds the shortest path from a source node to all other nodes in a **weighted graph** (with non-negative weights).

**How it works**:
1. Set distance of source node = 0, all others = ∞ (infinity)
2. Use a **Priority Queue** (min-heap) to always pick the node with the smallest known distance
3. For the picked node, check all its neighbors:
   - If `distance[current] + edge_weight < distance[neighbor]`:
     - Update `distance[neighbor]` = `distance[current] + edge_weight`
     - Record the path (parent pointer)
4. Repeat until all nodes are processed

**Key Formula**: `d(v) = min(d(v), d(u) + w(u,v))`  
This is called the **relaxation step**.

**Data Structure Used**: Priority Queue / Min-Heap

**Time Complexity**: O((V + E) × log V) with a binary heap

**Example**:
```
Graph: A —3→ B —2→ C, A —7→ C

Start at A:
  d(A) = 0
  d(B) = 3 (via A→B)
  d(C) = min(7, 3+2) = 5 (via A→B→C, not direct A→C)

Shortest path A to C = A → B → C, distance = 5
```

> [!IMPORTANT]
> Dijkstra's algorithm does NOT work with negative edge weights. For that, use Bellman-Ford.

---


### 3.1.1 Random Weighted Graph Generation for Dijkstra

GraphLab includes an automatic **Random Weighted Graph Generator** specifically calibrated for Dijkstra's algorithm:
- **Guaranteed Connectivity**: First generates a random spanning tree so all vertices are reachable.
- **Positive Edge Weights**: Generates weights randomly distributed between 1 and 15 (strictly non-negative, fulfilling Dijkstra's prerequisites).
- **Alternative Pathways**: Adds random cross-edges (density ~60%) so the visualizer demonstrates priority-queue path relaxation and optimal route discovery.
- **Instant 1-Click Access**: Available directly via the Dijkstra instruction banner and the Template Library.

### 3.2 Bellman-Ford Algorithm

**What it does**: Finds shortest paths from a source node, and **can handle negative edge weights**. Also detects **negative weight cycles**.

**How it works**:
1. Set distance of source = 0, all others = ∞
2. Repeat (V - 1) times:
   - For every edge (u, v) with weight w:
     - If `distance[u] + w < distance[v]`, update `distance[v]`
3. Do one more pass: if any distance can still be reduced, then a **negative cycle** exists

**Why V-1 iterations?** The shortest path in a graph with V vertices can have at most V-1 edges.

**Time Complexity**: O(V × E)

**Negative Cycle Detection**: If after V-1 iterations, we can still relax an edge, it means there's a cycle with negative total weight, making shortest paths undefined.

---

### 3.3 BFS Pathfinding

**What it does**: Finds the shortest path between two nodes in an **unweighted graph**.

**How it works**: Same as BFS traversal, but:
- Stops when the **target node** is reached
- Backtracks using parent pointers to reconstruct the path

**Why it works for shortest paths**: In an unweighted graph, BFS explores nodes in order of distance (1 hop, 2 hops, etc.), so the first time it reaches the target is guaranteed to be the shortest path.

---

### 3.4 DFS Pathfinding

**What it does**: Finds **a path** (not necessarily the shortest) between two nodes.

**How it works**: Same as DFS traversal, but stops when the target is found and reconstructs the path.

> [!NOTE]
> DFS pathfinding does NOT guarantee the shortest path. Use BFS or Dijkstra for shortest paths.

---

## 4. Minimum Spanning Tree

### 4.1 Prim's Algorithm

**What it does**: Finds the **Minimum Spanning Tree (MST)** — a subset of edges that connects all vertices with the minimum total weight, without forming any cycle.

**How it works**:
1. Start with any node as the "tree"
2. Use a **Priority Queue** to find the minimum weight edge connecting the tree to a non-tree vertex
3. Add that edge and vertex to the tree
4. Repeat until all vertices are in the tree

**Key Property**: MST has exactly **V - 1** edges for V vertices.

**Time Complexity**: O((V + E) × log V)

**Example**:
```
Graph: A—1—B, B—3—C, A—2—C

MST picks edges: A—1—B, A—2—C (total weight = 3)
NOT: A—1—B, B—3—C (total weight = 4)
```

---

## 5. Eulerian & Hamiltonian Paths

### 5.1 Eulerian Path/Circuit

**What it does**: Determines if a graph has an **Eulerian path** (visits every EDGE exactly once) or an **Eulerian circuit** (starts and ends at the same vertex).

**Conditions**:
- **Eulerian Circuit**: Every vertex must have an **even degree**
- **Eulerian Path**: Exactly **two vertices** must have an **odd degree** (these are the start and end vertices)
- The graph must be **connected**

**Algorithm used**: Hierholzer's algorithm — builds the path by following edges and merging sub-tours.

**Famous Example**: The **Königsberg Bridge Problem** (1736) — Euler proved it was impossible because all 4 vertices had odd degree.

---

### 5.2 Hamiltonian Path/Circuit

**What it does**: Determines if a graph has a path that visits every VERTEX exactly once.

**Key Difference from Eulerian**:
- Eulerian = visit every **edge** once
- Hamiltonian = visit every **vertex** once

**Algorithm used**: Backtracking — tries all possible vertex orderings. This problem is **NP-complete** (no known fast algorithm).

---

## 6. Complement Graph

### What is a Complement Graph?

Given a graph G = (V, E), its complement Ḡ = (V, Ē) is a graph that:
- Has the **same vertices** as G
- Has an edge between two vertices **if and only if** that edge does NOT exist in G

### The Fundamental Invariant

```
|E(G)| + |E(Ḡ)| = n(n-1)/2
```

The total edges in G plus edges in Ḡ always equals the number of edges in the complete graph Kₙ.

### How GraphLab Computes It

**Algorithm** (Edge Inversion — from [`complementGraph.ts`](file:///Users/adityagupta/Desktop/testing/src/utils/graph/complementGraph.ts)):

1. **Index all existing edges** into a hash set for O(1) lookup
2. **Enumerate all possible pairs** of vertices:
   - For undirected: check all pairs (i, j) where i < j
   - For directed: check all ordered pairs (i, j) where i ≠ j
3. **If a pair has NO edge in G**, add it as an edge in Ḡ
4. Compute the **degree inversion**: deg_Ḡ(v) = (n - 1) - deg_G(v)

**Self-Complementary Check**: A graph G ≅ Ḡ is only possible when:
- n mod 4 = 0 OR n mod 4 = 1
- |E(G)| = |E(Ḡ)| = n(n-1)/4

**Side-by-Side Visualization**: GraphLab places the original graph G on the left and the complement Ḡ on the right, with the complement nodes labeled with primes (A → A').

**Time Complexity**: O(V²)

### Example

```
Original Graph G (Triangle K₃):
  A — B
  |   |
  C ---

Complement Ḡ:
  A   B   C   (no edges — K₃'s complement is the empty graph)

Verification: |E(G)| + |E(Ḡ)| = 3 + 0 = 3 = C(3,2) ✓
```

---

## 7. Bipartite Graph Verification

### What is a Bipartite Graph?

A graph is **bipartite** if its vertices can be divided into two disjoint sets X and Y such that every edge connects a vertex in X to a vertex in Y. Equivalently, a graph is bipartite if and only if it contains **no odd-length cycles**.

### How GraphLab Checks It

**Algorithm** (BFS 2-Coloring — from [`bipartite.ts`](file:///Users/adityagupta/Desktop/testing/src/utils/graph/bipartite.ts)):

1. Pick any unvisited vertex, assign it **Color 0** (Set X)
2. Use **BFS** to explore neighbors:
   - For each neighbor: assign the **opposite color** (if current is 0, neighbor gets 1)
   - If a neighbor is **already colored** and has the **same color** as the current vertex → **NOT bipartite** (odd cycle found!)
3. If all vertices are colored without conflict → **bipartite**
4. If bipartite, GraphLab can **rearrange the layout** into a 2-column view (Set X on left, Set Y on right)

**Time Complexity**: O(V + E)

### Example

```
Bipartite Graph:        Non-Bipartite Graph:
  A — B                   A — B
  |   |                   |   |
  C — D                   C — D
                           \ /
                            E
  (4-cycle, even)         (has triangle = odd cycle)
  ✓ Bipartite             ✗ NOT Bipartite
```

---

## 8. Havel-Hakimi Theorem

### What it does

Determines whether a given sequence of integers can be the degree sequence of a simple graph (a "graphical sequence"). If yes, it constructs a realization.

### The Algorithm

**Havel-Hakimi Reduction** (from [`havelHakimi.ts`](file:///Users/adityagupta/Desktop/testing/src/utils/graph/havelHakimi.ts)):

1. Given a sequence like [3, 3, 2, 2, 2]:
2. **Sort** the sequence in non-increasing order
3. Remove the **first element** d₁
4. **Subtract 1** from the next d₁ elements
5. **Repeat** until:
   - All elements are 0 → **graphical** ✓
   - A negative number appears → **not graphical** ✗

### Step-by-Step Example

```
Input: [3, 3, 2, 2, 2]

Step 1: Sort → [3, 3, 2, 2, 2]
        Remove 3, subtract 1 from next 3 elements
        → [2, 1, 1, 2]

Step 2: Sort → [2, 2, 1, 1]
        Remove 2, subtract 1 from next 2 elements
        → [1, 0, 1]

Step 3: Sort → [1, 1, 0]
        Remove 1, subtract 1 from next 1 element
        → [0, 0]

All zeros → ✓ This is a valid degree sequence!
```

GraphLab can then **generate a graph realization** from this sequence and render it on the canvas.

---

## 9. Graph Isomorphism

### What it does

Checks whether two graphs drawn on the canvas are **isomorphic** — structurally identical, meaning there exists a one-to-one vertex mapping that preserves all edges.

### How GraphLab Checks It

**Algorithm** (from [`isomorphism.ts`](file:///Users/adityagupta/Desktop/testing/src/utils/graph/isomorphism.ts)):

1. **Quick invariant checks** (if any fail → NOT isomorphic):
   - Same number of vertices?
   - Same number of edges?
   - Same degree sequence (sorted)?
2. **Vertex bijection search** using backtracking:
   - Try to map vertices of G₁ to G₂
   - At each step, check if the mapping preserves edges
   - If a complete valid mapping is found → **isomorphic** ✓
   - If no mapping works → **NOT isomorphic** ✗

3. **Connected component segmentation**: GraphLab automatically detects separate components on the canvas and treats the two largest as G₁ and G₂.

**Time Complexity**: Worst case O(V!) for the backtracking, but invariant checks prune most cases quickly.

---

## 10. Adjacency Matrix & Incidence Matrix

### 10.1 Adjacency Matrix

The **Adjacency Matrix** A is an n × n matrix where:
- A[i][j] = weight of edge from vertex i to vertex j
- A[i][j] = 0 if no edge exists

**For undirected graphs**: The matrix is **symmetric** (A[i][j] = A[j][i])

**How GraphLab generates it** (from [`matrixGenerator.ts`](file:///Users/adityagupta/Desktop/testing/src/utils/graph/matrixGenerator.ts)):
1. Create an n × n matrix filled with zeros
2. For each edge (u, v) with weight w:
   - Set A[u][v] = w
   - If undirected, also set A[v][u] = w

**Example** (undirected, unweighted):
```
Graph: A—B, B—C, A—C

Adjacency Matrix:
    A  B  C
A [ 0  1  1 ]
B [ 1  0  1 ]
C [ 1  1  0 ]
```

### 10.2 Incidence Matrix

The **Incidence Matrix** B is an n × m matrix (n = vertices, m = edges) where:
- **Undirected graph**: B[i][k] = 1 if vertex i is an endpoint of edge k, 0 otherwise
- **Directed graph**: B[i][k] = −1 if edge k **leaves** vertex i, +1 if edge k **enters** vertex i

**How GraphLab generates it**:
1. Collect all unique edges and label them e₁, e₂, e₃, ...
2. Create an n × m matrix filled with zeros
3. For each edge eₖ connecting vertices u and v:
   - If undirected: set B[u][k] = 1 and B[v][k] = 1
   - If directed: set B[u][k] = −1 and B[v][k] = +1

**Example** (undirected):
```
Graph: A—B (e₁), B—C (e₂), A—C (e₃)

Incidence Matrix:
    e₁  e₂  e₃
A [  1   0   1 ]
B [  1   1   0 ]
C [  0   1   1 ]
```

---

## 11. AI Tutor & Image-to-Graph

### AI Tutor

GraphLab includes an **AI Tutor** that can analyze the current graph and explain its properties. It uses:
- **Offline heuristics engine**: Computes properties locally (Handshaking Lemma, degree analysis, connectivity, Euler conditions) without needing any API key
- **Online LLM models** (optional): Connects to AI models (via OpenRouter, Groq, or Gemini) for deeper explanations

### Image-to-Graph

Users can **upload a photo** of a hand-drawn or textbook graph, and AI will:
1. Parse the image to detect nodes and edges
2. Reconstruct the graph digitally on the canvas
3. Uses the Groq Vision API for image understanding

---

## Summary of All Algorithms & Complexity

| Feature | Algorithm | Time Complexity | Data Structure |
|---|---|---|---|
| **BFS Traversal** | Breadth-First Search | O(V + E) | Queue |
| **DFS Traversal** | Depth-First Search | O(V + E) | Stack |
| **Dijkstra** | Greedy + Relaxation | O((V+E) log V) | Priority Queue |
| **Bellman-Ford** | Dynamic Programming | O(V × E) | Distance Array |
| **BFS Pathfinding** | BFS + Path Reconstruction | O(V + E) | Queue |
| **DFS Pathfinding** | DFS + Path Reconstruction | O(V + E) | Stack |
| **Prim's MST** | Greedy + Min Edge | O((V+E) log V) | Priority Queue |
| **Eulerian Path** | Hierholzer's Algorithm | O(V + E) | Stack |
| **Hamiltonian Path** | Backtracking | O(V!) | Recursion |
| **Complement Graph** | Edge Inversion | O(V²) | Hash Set |
| **Bipartite Check** | BFS 2-Coloring | O(V + E) | Queue + Color Array |
| **Havel-Hakimi** | Greedy Reduction | O(n² log n) | Sorted Array |
| **Isomorphism** | Invariant Check + Backtracking | O(V!) worst | Hash Maps |
| **Adjacency Matrix** | Edge Enumeration | O(V² + E) | 2D Array |
| **Incidence Matrix** | Edge Collection | O(V × E) | 2D Array |

---

> **Note**: This project is deployed live at [https://graph-lab-one.vercel.app/](https://graph-lab-one.vercel.app/)
