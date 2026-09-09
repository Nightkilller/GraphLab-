import { describe, it, expect } from "vitest";
import eulerianAdapter from "./eulerian";
import { AlgorithmInput } from "../types";
import { createAdjacencyList, resultEdges } from "./__tests__/testUtils";

describe("Eulerian Algorithm", () => {
  it("has correct metadata", () => {
    expect(eulerianAdapter.metadata.id).toBe("eulerian");
    expect(eulerianAdapter.metadata.name).toContain("Eulerian");
    expect(eulerianAdapter.metadata.type).toBe("traversal");
  });

  it("detects an Eulerian Circuit on an undirected cycle (K3)", () => {
    // Triangle cycle: 1-2, 2-3, 3-1 (all degrees = 2)
    const input: AlgorithmInput = {
      adjacencyList: createAdjacencyList(
        [1, 2, 3],
        [
          { from: 1, to: 2, type: "undirected" },
          { from: 2, to: 3, type: "undirected" },
          { from: 3, to: 1, type: "undirected" },
        ]
      ),
      nodes: [{ id: 1 }, { id: 2 }, { id: 3 }],
      startNodeId: 1,
    };

    const result = eulerianAdapter.execute(input);
    expect(result.error).toBeUndefined();
    const finalCircuit = resultEdges(result);
    expect(finalCircuit.length).toBe(3);
  });

  it("detects an Eulerian Path on a graph with exactly 2 odd-degree vertices", () => {
    // Path graph 1 - 2 - 3 (nodes 1 and 3 have degree 1, node 2 has degree 2)
    const input: AlgorithmInput = {
      adjacencyList: createAdjacencyList(
        [1, 2, 3],
        [
          { from: 1, to: 2, type: "undirected" },
          { from: 2, to: 3, type: "undirected" },
        ]
      ),
      nodes: [{ id: 1 }, { id: 2 }, { id: 3 }],
      startNodeId: 1,
    };

    const result = eulerianAdapter.execute(input);
    expect(result.error).toBeUndefined();
    const finalPath = resultEdges(result);
    expect(finalPath.length).toBe(2);
  });

  it("returns an error for non-Eulerian graphs (e.g. Star graph K1,3 with 3 odd vertices)", () => {
    // Star: center 0, leaves 1, 2, 3
    const input: AlgorithmInput = {
      adjacencyList: createAdjacencyList(
        [0, 1, 2, 3],
        [
          { from: 0, to: 1, type: "undirected" },
          { from: 0, to: 2, type: "undirected" },
          { from: 0, to: 3, type: "undirected" },
        ]
      ),
      nodes: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
      startNodeId: 0,
    };

    const result = eulerianAdapter.execute(input);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("odd degree");
  });
});
