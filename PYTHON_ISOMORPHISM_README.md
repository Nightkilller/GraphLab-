# 🐍 Graph Isomorphism Algorithm in Python

This document demonstrates how the **Graph Isomorphism ($G_1 \cong G_2$)** algorithm is implemented in Python, comparing its length, structure, and complexity with the TypeScript implementation in GraphLab.

---

## 📊 How Long is the Algorithm in Python?

| Implementation | Lines of Code | Dependencies | Notes |
| :--- | :---: | :---: | :--- |
| **Pure Python from Scratch** | **~55 lines** | None (Built-in standard library) | Fast invariant filtering + recursive backtracking bijection search |
| **Python using `networkx`** | **~3 lines** | `pip install networkx` | Uses the industrial VF2 algorithm |
| **GraphLab TypeScript** | **~470 lines** | React + Canvas | Includes UI state, SVG coordinate rendering, canvas annotations, and twin generation |

As you can see, the **pure mathematical algorithm in Python is only about 55 lines long**.

---

## 1. Pure Python Implementation (~55 lines, 0 Dependencies)

You can run this directly using standard Python 3. It checks invariants (order $|V|$, degree sequence) and searches for a structure-preserving bijective mapping $f: V(G_1) \to V(G_2)$:

```python
def check_graph_isomorphism(
    adj1: dict[str, list[str]], 
    adj2: dict[str, list[str]]
) -> tuple[bool, dict[str, str] | None, str]:
    """
    Checks if Graph 1 and Graph 2 are isomorphic.
    Returns: (is_isomorphic, mapping_dict, explanation_reason)
    """
    nodes1 = list(adj1.keys())
    nodes2 = list(adj2.keys())
    n1, n2 = len(nodes1), len(nodes2)

    # 1. Invariant Filter: Vertex count |V|
    if n1 != n2:
        return False, None, f"Vertex count mismatch: G1 has {n1} vs G2 has {n2}."

    # 2. Invariant Filter: Degree Sequences
    deg1 = {u: len(set(adj1[u])) for u in nodes1}
    deg2 = {v: len(set(adj2[v])) for v in nodes2}

    if sorted(deg1.values()) != sorted(deg2.values()):
        return (
            False,
            None,
            f"Degree sequence mismatch: G1={sorted(deg1.values(), reverse=True)} vs G2={sorted(deg2.values(), reverse=True)}.",
        )

    # 3. Fast Adjacency Set Lookup
    set1 = {u: set(adj1[u]) for u in nodes1}
    set2 = {v: set(adj2[v]) for v in nodes2}

    mapping: dict[str, str] = {}
    used_g2: set[str] = set()

    # 4. Recursive Backtracking Bijection Search with Degree Pruning
    def backtrack(idx: int) -> bool:
        if idx == n1:
            return True

        u = nodes1[idx]
        u_deg = deg1[u]

        for v in nodes2:
            # Candidate must not be used and must share the exact degree
            if v in used_g2 or deg2[v] != u_deg:
                continue

            # Consistency check: adjacency in G1 must match mapped adjacency in G2
            consistent = True
            for prev_idx in range(idx):
                prev_u = nodes1[prev_idx]
                prev_v = mapping[prev_u]
                if (prev_u in set1[u]) != (prev_v in set2[v]):
                    consistent = False
                    break

            if consistent:
                mapping[u] = v
                used_g2.add(v)

                if backtrack(idx + 1):
                    return True

                del mapping[u]
                used_g2.remove(v)

        return False

    if backtrack(0):
        return True, mapping, "Valid bijective mapping f: V(G1) -> V(G2) found."
    else:
        return False, None, "No structure-preserving bijection exists."
```

---

## 2. Python with `networkx` (~3 lines)

If you use Python's popular graph library `networkx`:

```python
import networkx as nx
from networkx.algorithms.isomorphism import GraphMatcher

G1 = nx.cycle_graph(4)
G2 = nx.cycle_graph(4)

matcher = GraphMatcher(G1, G2)
print("Isomorphic:", matcher.is_isomorphic())
print("Mapping:", matcher.mapping)
```

---

## 3. How to Run the Script

A runnable demo has been created at `python_isomorphism_demo.py`. Run it in your terminal:

```bash
python3 python_isomorphism_demo.py
```

### Output:
```text
============================================================
 GRAPH ISOMORPHISM ALGORITHM IN PYTHON
============================================================

Test 1 (Two 4-cycles C4):
Isomorphic? -> True
Mapping: {'0': 'A', '1': 'B', '2': 'C', '3': 'D'}
Reason: Valid bijective mapping f: V(G1) -> V(G2) found.

Test 2 (C4 vs Triangle with tail):
Isomorphic? -> False
Reason: Degree sequence mismatch: G1=[2, 2, 2, 2] vs G2=[3, 2, 2, 1].
============================================================
```

---

## 4. Key Takeaways
1. **Algorithm Length**: The pure isomorphism solver in Python is very concise (**~55 lines**).
2. **Why GraphLab's TypeScript file is longer**: The TypeScript version in GraphLab is ~470 lines not because the algorithm is complicated, but because it also handles **UI coordinates, interactive node selection, SVG arrow curves, and visual twin generation on the canvas**.
