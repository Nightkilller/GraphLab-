"""
Graph Isomorphism Algorithm in Python (Zero External Libraries)
Pure standard library implementation using Invariant Pruning & Backtracking Search.
"""

from collections import defaultdict


def check_graph_isomorphism(
    adj1: dict[str, list[str]], adj2: dict[str, list[str]]
) -> tuple[bool, dict[str, str] | None, str]:
    """
    Checks if Graph 1 (adj1) and Graph 2 (adj2) are isomorphic.
    
    Returns:
        (is_isomorphic, mapping_dict, explanation_reason)
    """
    nodes1 = list(adj1.keys())
    nodes2 = list(adj2.keys())
    n1, n2 = len(nodes1), len(nodes2)

    # 1. Invariant Check: Number of Vertices |V|
    if n1 != n2:
        return False, None, f"Vertex count mismatch: G1 has {n1} vs G2 has {n2}."

    # 2. Invariant Check: Degrees & Edge Count |E|
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
            # Candidate must not be used and must have the same degree
            if v in used_g2 or deg2[v] != u_deg:
                continue

            # Check edge consistency with already mapped neighbors
            consistent = True
            for prev_idx in range(idx):
                prev_u = nodes1[prev_idx]
                prev_v = mapping[prev_u]
                # Adjacency in G1 must match adjacency in G2
                if (prev_u in set1[u]) != (prev_v in set2[v]):
                    consistent = False
                    break

            if consistent:
                mapping[u] = v
                used_g2.add(v)

                if backtrack(idx + 1):
                    return True

                # Undo assignment
                del mapping[u]
                used_g2.remove(v)

        return False

    if backtrack(0):
        return True, mapping, "Valid bijective mapping f: V(G1) -> V(G2) found."
    else:
        return False, None, "No structure-preserving bijection exists (incompatible cycle structure)."


# =====================================================================
# Demonstration & Test Cases
# =====================================================================
if __name__ == "__main__":
    print("=" * 60)
    print(" GRAPH ISOMORPHISM ALGORITHM IN PYTHON")
    print("=" * 60)

    # Example 1: Two isomorphic 4-cycles (C4) with different node labels
    # G1: 0 - 1 - 2 - 3 - 0
    g1 = {
        "0": ["1", "3"],
        "1": ["0", "2"],
        "2": ["1", "3"],
        "3": ["2", "0"],
    }

    # G2: A - B - C - D - A (permuted)
    g2 = {
        "A": ["B", "D"],
        "B": ["A", "C"],
        "C": ["B", "D"],
        "D": ["C", "A"],
    }

    is_iso, map_res, reason = check_graph_isomorphism(g1, g2)
    print(f"\nTest 1 (Two 4-cycles C4):")
    print(f"Isomorphic? -> {is_iso}")
    print(f"Mapping: {map_res}")
    print(f"Reason: {reason}")

    # Example 2: Non-isomorphic graphs (Both have 4 vertices, 4 edges, degrees [2, 2, 2, 2] vs triangle + isolated edge)
    # G3: C4 cycle (2,2,2,2)
    # G4: Triangle (K3) with 1 tail node attached to one corner (degrees: 3, 2, 2, 1)
    g3 = g1
    g4 = {
        "X": ["Y", "Z", "W"],  # deg 3
        "Y": ["X", "Z"],       # deg 2
        "Z": ["X", "Y"],       # deg 2
        "W": ["X"],            # deg 1
    }

    is_iso2, map_res2, reason2 = check_graph_isomorphism(g3, g4)
    print(f"\nTest 2 (C4 vs Triangle with tail):")
    print(f"Isomorphic? -> {is_iso2}")
    print(f"Reason: {reason2}")
    print("=" * 60)
