import { describe, it, expect } from "vitest";
import {
  computeComplementGraph,
  computeSideBySideComplement,
  analyzeComplementGraph,
} from "./complementGraph";
import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE_TYPE } from "../../constants/graph";

describe("computeComplementGraph", () => {
  it("computes complement of a triangle graph (K3 -> empty)", () => {
    const nodes: GraphNode[] = [
      { id: 0, x: 0, y: 0, r: 20 },
      { id: 1, x: 100, y: 0, r: 20 },
      { id: 2, x: 50, y: 100, r: 20 },
    ];
    const edges = new Map<number, GraphEdge[]>();
    nodes.forEach((n) => edges.set(n.id, []));

    // Connect 0-1, 1-2, 2-0 (all pairs)
    const addUndirected = (from: number, to: number) => {
      edges.get(from)?.push({
        x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0,
        from, to, weight: 1, type: EDGE_TYPE.UNDIRECTED,
      });
      edges.get(to)?.push({
        x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0,
        from: to, to: from, weight: 1, type: EDGE_TYPE.UNDIRECTED,
      });
    };

    addUndirected(0, 1);
    addUndirected(1, 2);
    addUndirected(2, 0);

    const complement = computeComplementGraph(nodes, edges, 3);
    // Complement of K3 should have 0 edges
    let totalComplementEdges = 0;
    complement.edges.forEach((list) => {
      totalComplementEdges += list.length;
    });
    expect(totalComplementEdges).toBe(0);
  });

  it("computes complement of an empty graph with 4 nodes (Empty -> K4)", () => {
    const nodes: GraphNode[] = [
      { id: 0, x: 0, y: 0, r: 20 },
      { id: 1, x: 100, y: 0, r: 20 },
      { id: 2, x: 100, y: 100, r: 20 },
      { id: 3, x: 0, y: 100, r: 20 },
    ];
    const edges = new Map<number, GraphEdge[]>();
    nodes.forEach((n) => edges.set(n.id, []));

    const complement = computeComplementGraph(nodes, edges, 4);
    // K4 undirected graph has 4*3/2 = 6 undirected edges => 12 directed entries in map
    let totalEdges = 0;
    complement.edges.forEach((list) => {
      totalEdges += list.length;
    });
    expect(totalEdges).toBe(12);
  });

  it("computes side-by-side adjacent complement graph with duplicated nodes and separated coordinates", () => {
    const nodes: GraphNode[] = [
      { id: 0, x: 0, y: 0, r: 20, label: "A" },
      { id: 1, x: 100, y: 0, r: 20, label: "B" },
      { id: 2, x: 50, y: 100, r: 20, label: "C" },
    ];
    const edges = new Map<number, GraphEdge[]>();
    nodes.forEach((n) => edges.set(n.id, []));

    // Connect 0-1 only (1 original edge in triangle => 2 complement edges 1-2, 2-0)
    edges.get(0)?.push({
      x1: 0, y1: 0, x2: 100, y2: 0, nodeX2: 100, nodeY2: 0,
      from: 0, to: 1, weight: 1, type: EDGE_TYPE.UNDIRECTED,
    });
    edges.get(1)?.push({
      x1: 100, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0,
      from: 1, to: 0, weight: 1, type: EDGE_TYPE.UNDIRECTED,
    });

    const sbs = computeSideBySideComplement(nodes, edges, 3);

    // Should contain 3 original + 3 complement nodes = 6 nodes
    expect(sbs.nodes.length).toBe(6);

    // Complement nodes have prime label A', B', C'
    expect(sbs.nodes.find((n) => n.label === "A'")).toBeDefined();
    expect(sbs.nodes.find((n) => n.label === "B'")).toBeDefined();
    expect(sbs.nodes.find((n) => n.label === "C'")).toBeDefined();

    // Analysis verifies |E| = 1, |E'| = 2, max = 3
    expect(sbs.analysis.origEdgeCount).toBe(1);
    expect(sbs.analysis.compEdgeCount).toBe(2);
    expect(sbs.analysis.maxEdges).toBe(3);
  });

  it("analyzes vertex degree inversion correctly in analyzeComplementGraph", () => {
    const nodes: GraphNode[] = [
      { id: 0, x: 0, y: 0, r: 20, label: "A" },
      { id: 1, x: 100, y: 0, r: 20, label: "B" },
      { id: 2, x: 50, y: 100, r: 20, label: "C" },
      { id: 3, x: 50, y: -50, r: 20, label: "D" },
    ];
    const edges = new Map<number, GraphEdge[]>();
    nodes.forEach((n) => edges.set(n.id, []));

    // A connected to B, C, D (deg 3 in K4) => in complement, deg(A) = (4-1) - 3 = 0
    const addUndirected = (u: number, v: number) => {
      edges.get(u)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: u, to: v, weight: 1, type: EDGE_TYPE.UNDIRECTED });
      edges.get(v)?.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: v, to: u, weight: 1, type: EDGE_TYPE.UNDIRECTED });
    };
    addUndirected(0, 1);
    addUndirected(0, 2);
    addUndirected(0, 3);

    const analysis = analyzeComplementGraph(nodes, edges);
    const nodeA = analysis.degrees.find((d) => d.id === 0);
    expect(nodeA?.origDegree).toBe(3);
    expect(nodeA?.compDegree).toBe(0);
  });
});
