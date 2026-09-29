import { describe, it, expect } from "vitest";
import {
  calculateCayleysFormula,
  countSpanningTreesKirchhoff,
  computeMinimumSpanningTree,
  enumerateSpanningTrees,
  analyzeGraphSpanningTrees,
} from "./spanningTree";
import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE_TYPE } from "../../constants/graph";

const makeNode = (id: number, label: string, x = 0, y = 0): GraphNode => ({
  id,
  x,
  y,
  r: 20,
  label,
});

const makeEdge = (u: number, v: number, weight = 1): GraphEdge => ({
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 10,
  nodeX2: 10,
  nodeY2: 10,
  from: u,
  to: v,
  weight,
  type: EDGE_TYPE.UNDIRECTED,
});

describe("Spanning Tree Suite", () => {
  describe("Cayley's Formula", () => {
    it("computes Cayley formula for small n", () => {
      expect(calculateCayleysFormula(1).treesCount).toBe("1");
      expect(calculateCayleysFormula(2).treesCount).toBe("1");
      expect(calculateCayleysFormula(3).treesCount).toBe("3"); // 3^1
      expect(calculateCayleysFormula(4).treesCount).toBe("16"); // 4^2
      expect(calculateCayleysFormula(5).treesCount).toBe("125"); // 5^3
      expect(calculateCayleysFormula(6).treesCount).toBe("1296"); // 6^4
    });

    it("handles large n without floating point error using BigInt", () => {
      const res = calculateCayleysFormula(10);
      expect(res.treesCount).toBe("100000000"); // 10^8
    });
  });

  describe("Kirchhoff's Matrix Tree Theorem", () => {
    it("returns 3 spanning trees for triangle graph (K3)", () => {
      const nodes: GraphNode[] = [
        makeNode(1, "A", 0, 0),
        makeNode(2, "B", 100, 0),
        makeNode(3, "C", 50, 100),
      ];
      const edges = new Map<number, GraphEdge[]>([
        [1, [makeEdge(1, 2), makeEdge(1, 3)]],
        [2, [makeEdge(2, 1), makeEdge(2, 3)]],
        [3, [makeEdge(3, 1), makeEdge(3, 2)]],
      ]);

      const res = countSpanningTreesKirchhoff(nodes, edges);
      expect(res.count).toBe(3);
    });

    it("returns 16 spanning trees for complete graph K4", () => {
      const nodes: GraphNode[] = [
        makeNode(1, "A"),
        makeNode(2, "B"),
        makeNode(3, "C"),
        makeNode(4, "D"),
      ];
      const edges = new Map<number, GraphEdge[]>();
      nodes.forEach((u) => {
        edges.set(
          u.id,
          nodes.filter((v) => v.id !== u.id).map((v) => makeEdge(u.id, v.id))
        );
      });

      const res = countSpanningTreesKirchhoff(nodes, edges);
      expect(res.count).toBe(16);
    });

    it("returns 0 for disconnected graph", () => {
      const nodes: GraphNode[] = [
        makeNode(1, "A"),
        makeNode(2, "B"),
        makeNode(3, "C"),
      ];
      const edges = new Map<number, GraphEdge[]>([
        [1, [makeEdge(1, 2)]],
        [2, [makeEdge(2, 1)]],
        [3, []],
      ]);

      const res = countSpanningTreesKirchhoff(nodes, edges);
      expect(res.count).toBe(0);
    });
  });

  describe("Minimum Spanning Tree & Enumeration", () => {
    it("computes correct MST on weighted graph", () => {
      const nodes: GraphNode[] = [
        makeNode(1, "A"),
        makeNode(2, "B"),
        makeNode(3, "C"),
      ];
      // Weights: A-B: 5, B-C: 2, A-C: 3
      const edges = new Map<number, GraphEdge[]>([
        [1, [makeEdge(1, 2, 5), makeEdge(1, 3, 3)]],
        [2, [makeEdge(2, 1, 5), makeEdge(2, 3, 2)]],
        [3, [makeEdge(3, 1, 3), makeEdge(3, 2, 2)]],
      ]);

      const mst = computeMinimumSpanningTree(nodes, edges);
      expect(mst.isConnected).toBe(true);
      expect(mst.edges.length).toBe(2);
      expect(mst.totalWeight).toBe(5); // 2 + 3 = 5

      const trees = enumerateSpanningTrees(nodes, edges);
      expect(trees.length).toBe(3);
    });

    it("runs full graph spanning tree analysis", () => {
      const nodes: GraphNode[] = [
        makeNode(1, "A"),
        makeNode(2, "B"),
        makeNode(3, "C"),
      ];
      const edges = new Map<number, GraphEdge[]>([
        [1, [makeEdge(1, 2, 1), makeEdge(1, 3, 2)]],
        [2, [makeEdge(2, 1, 1)]],
        [3, [makeEdge(3, 1, 2)]],
      ]);

      const analysis = analyzeGraphSpanningTrees(nodes, edges);
      expect(analysis.isConnected).toBe(true);
      expect(analysis.spanningTreeCount).toBe(1);
      expect(analysis.mst?.totalWeight).toBe(3);
    });
  });
});
