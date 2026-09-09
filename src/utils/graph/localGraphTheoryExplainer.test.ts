import { describe, it, expect } from "vitest";
import { generateLocalGraphTheoryExplanation } from "./localGraphTheoryExplainer";
import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE_TYPE } from "../../constants/graph";

describe("localGraphTheoryExplainer", () => {
  it("returns empty message for 0 nodes", () => {
    const res = generateLocalGraphTheoryExplanation([], new Map());
    expect(res).toContain("canvas is currently empty");
  });

  it("correctly analyzes a Triangle (K3)", () => {
    const nodes: GraphNode[] = [
      { id: 1, label: "A", x: 0, y: 0, r: 20 },
      { id: 2, label: "B", x: 100, y: 0, r: 20 },
      { id: 3, label: "C", x: 50, y: 100, r: 20 },
    ];

    const edges = new Map<number, GraphEdge[]>();
    nodes.forEach((n) => edges.set(n.id, []));

    const addEdge = (u: number, v: number) => {
      edges.get(u)!.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: u, to: v, type: EDGE_TYPE.UNDIRECTED, weight: 1 });
      edges.get(v)!.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: v, to: u, type: EDGE_TYPE.UNDIRECTED, weight: 1 });
    };

    addEdge(1, 2);
    addEdge(2, 3);
    addEdge(3, 1);

    const explanation = generateLocalGraphTheoryExplanation(nodes, edges);

    // Check invariants
    expect(explanation).toContain("3 vertices");
    expect(explanation).toContain("3 edges");
    expect(explanation).toContain("Handshaking Lemma");
    expect(explanation).toContain("Eulerian Graph (Contains an Euler Circuit)");
    expect(explanation).toContain("Complement Graph");
    expect(explanation).toContain("Not Bipartite (Contains Odd Cycle");
  });

  it("correctly analyzes an Euler Path graph (Semi-Eulerian with 2 odd vertices)", () => {
    // Path A - B - C
    const nodes: GraphNode[] = [
      { id: 1, label: "A", x: 0, y: 0, r: 20 },
      { id: 2, label: "B", x: 100, y: 0, r: 20 },
      { id: 3, label: "C", x: 200, y: 0, r: 20 },
    ];

    const edges = new Map<number, GraphEdge[]>();
    nodes.forEach((n) => edges.set(n.id, []));

    const addEdge = (u: number, v: number) => {
      edges.get(u)!.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: u, to: v, type: EDGE_TYPE.UNDIRECTED, weight: 1 });
      edges.get(v)!.push({ x1: 0, y1: 0, x2: 0, y2: 0, nodeX2: 0, nodeY2: 0, from: v, to: u, type: EDGE_TYPE.UNDIRECTED, weight: 1 });
    };

    addEdge(1, 2);
    addEdge(2, 3);

    const explanation = generateLocalGraphTheoryExplanation(nodes, edges);

    expect(explanation).toContain("Semi-Eulerian Graph (Contains an Euler Path)");
    expect(explanation).toContain("Bipartite Graph (2-Colorable ✓)");
  });
});
