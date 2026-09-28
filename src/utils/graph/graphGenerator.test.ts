import { describe, it, expect } from "vitest";
import { generateRandomWeightedGraph } from "./graphGenerator";

describe("generateRandomWeightedGraph", () => {
  it("generates a graph with the specified number of nodes", () => {
    const graph = generateRandomWeightedGraph(6, 1, 15);
    expect(graph.nodes.length).toBe(6);
    expect(graph.nodeCounter).toBe(6);
  });

  it("assigns positive weights within the specified range", () => {
    const minW = 2;
    const maxW = 12;
    const graph = generateRandomWeightedGraph(5, minW, maxW);
    let edgeCount = 0;

    for (const [, edgeList] of graph.edges) {
      for (const edge of edgeList) {
        edgeCount++;
        expect(edge.weight).toBeGreaterThanOrEqual(minW);
        expect(edge.weight).toBeLessThanOrEqual(maxW);
      }
    }

    expect(edgeCount).toBeGreaterThan(0);
  });

  it("ensures connectivity across all nodes", () => {
    const n = 7;
    const graph = generateRandomWeightedGraph(n, 1, 10);

    // BFS to verify all nodes are reachable from node 1
    const visited = new Set<number>();
    const queue = [1];
    visited.add(1);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = graph.edges.get(curr) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push(edge.to);
        }
      }
    }

    expect(visited.size).toBe(n);
  });
});
