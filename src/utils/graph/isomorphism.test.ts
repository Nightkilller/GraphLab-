import { describe, it, expect } from "vitest";
import {
  generateIsomorphicGraph,
  checkIsomorphism,
} from "./isomorphism";
import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE_TYPE } from "../../constants/graph";

describe("Graph Isomorphism Suite", () => {
  it("generates an isomorphic graph and validates it with checkIsomorphism", () => {
    // 4-cycle C4: 0-1, 1-2, 2-3, 3-0
    const nodes: GraphNode[] = [
      { id: 0, x: 0, y: 0, r: 20, label: "A" },
      { id: 1, x: 100, y: 0, r: 20, label: "B" },
      { id: 2, x: 100, y: 100, r: 20, label: "C" },
      { id: 3, x: 0, y: 100, r: 20, label: "D" },
    ];
    const edges = new Map<number, GraphEdge[]>();
    nodes.forEach((n) => edges.set(n.id, []));

    const addUndirected = (u: number, v: number) => {
      edges.get(u)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: u, to: v, weight: 1, type: EDGE_TYPE.UNDIRECTED });
      edges.get(v)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: v, to: u, weight: 1, type: EDGE_TYPE.UNDIRECTED });
    };

    addUndirected(0, 1);
    addUndirected(1, 2);
    addUndirected(2, 3);
    addUndirected(3, 0);

    const isoResult = generateIsomorphicGraph(nodes, edges, 10);
    expect(isoResult.graph.nodes.length).toBe(4);

    const check = checkIsomorphism({ nodes, edges }, isoResult.graph);
    expect(check.isIsomorphic).toBe(true);
    expect(check.mappingDisplay?.length).toBe(4);
  });

  it("detects non-isomorphic graphs with different edge counts", () => {
    const g1Nodes: GraphNode[] = [
      { id: 0, x: 0, y: 0, r: 20 },
      { id: 1, x: 100, y: 0, r: 20 },
    ];
    const g1Edges = new Map<number, GraphEdge[]>([[0, []], [1, []]]);

    const g2Nodes: GraphNode[] = [
      { id: 0, x: 0, y: 0, r: 20 },
      { id: 1, x: 100, y: 0, r: 20 },
    ];
    const g2Edges = new Map<number, GraphEdge[]>([
      [0, [{ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: 0, to: 1, weight: 1, type: EDGE_TYPE.UNDIRECTED }]],
      [1, [{ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: 1, to: 0, weight: 1, type: EDGE_TYPE.UNDIRECTED }]],
    ]);

    const check = checkIsomorphism(
      { nodes: g1Nodes, edges: g1Edges },
      { nodes: g2Nodes, edges: g2Edges }
    );
    expect(check.isIsomorphic).toBe(false);
    expect(check.reason).toContain("Edge counts differ");
  });

  it("detects non-isomorphic graphs with identical degree sequences but different structure", () => {
    // Both have 6 vertices and degree sequence [2, 2, 2, 2, 2, 2]:
    // Graph A: 6-cycle (C6)
    // Graph B: Disjoint union of two 3-cycles (2 * C3)
    const g1Nodes: GraphNode[] = Array.from({ length: 6 }, (_, i) => ({ id: i, x: 0, y: 0, r: 20 }));
    const g1Edges = new Map<number, GraphEdge[]>();
    g1Nodes.forEach((n) => g1Edges.set(n.id, []));
    const add1 = (u: number, v: number) => {
      g1Edges.get(u)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: u, to: v, weight: 1, type: EDGE_TYPE.UNDIRECTED });
      g1Edges.get(v)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: v, to: u, weight: 1, type: EDGE_TYPE.UNDIRECTED });
    };
    // Cycle 0-1-2-3-4-5-0
    for (let i = 0; i < 6; i++) add1(i, (i + 1) % 6);

    const g2Nodes: GraphNode[] = Array.from({ length: 6 }, (_, i) => ({ id: i, x: 0, y: 0, r: 20 }));
    const g2Edges = new Map<number, GraphEdge[]>();
    g2Nodes.forEach((n) => g2Edges.set(n.id, []));
    const add2 = (u: number, v: number) => {
      g2Edges.get(u)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: u, to: v, weight: 1, type: EDGE_TYPE.UNDIRECTED });
      g2Edges.get(v)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: v, to: u, weight: 1, type: EDGE_TYPE.UNDIRECTED });
    };
    // Triangle 1: 0-1-2-0
    add2(0, 1); add2(1, 2); add2(2, 0);
    // Triangle 2: 3-4-5-3
    add2(3, 4); add2(4, 5); add2(5, 3);

    const check = checkIsomorphism(
      { nodes: g1Nodes, edges: g1Edges },
      { nodes: g2Nodes, edges: g2Edges }
    );
    expect(check.isIsomorphic).toBe(false);
    expect(check.reason).toContain("no structure-preserving bijection exists");
  });
});
