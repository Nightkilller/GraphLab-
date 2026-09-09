import { describe, it, expect } from "vitest";
import hamiltonianAdapter from "./hamiltonian";
import { AlgorithmInput } from "../types";
import { createAdjacencyList, resultEdges } from "./__tests__/testUtils";

describe("Hamiltonian Algorithm", () => {
  it("has correct metadata", () => {
    expect(hamiltonianAdapter.metadata.id).toBe("hamiltonian");
    expect(hamiltonianAdapter.metadata.name).toContain("Hamiltonian");
    expect(hamiltonianAdapter.metadata.type).toBe("traversal");
  });

  it("finds a Hamiltonian Circuit in a cycle graph (C4)", () => {
    // 0-1-2-3-0
    const input: AlgorithmInput = {
      adjacencyList: createAdjacencyList(
        [0, 1, 2, 3],
        [
          { from: 0, to: 1, type: "undirected" },
          { from: 1, to: 2, type: "undirected" },
          { from: 2, to: 3, type: "undirected" },
          { from: 3, to: 0, type: "undirected" },
        ]
      ),
      nodes: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
      startNodeId: 0,
    };

    const result = hamiltonianAdapter.execute(input);
    expect(result.error).toBeUndefined();
    const finalCircuit = resultEdges(result);
    // For 4 nodes, circuit has 4 edges
    expect(finalCircuit.length).toBe(4);
  });

  it("finds a Hamiltonian Path when no closing cycle exists", () => {
    // 0-1-2-3 (linear path)
    const input: AlgorithmInput = {
      adjacencyList: createAdjacencyList(
        [0, 1, 2, 3],
        [
          { from: 0, to: 1, type: "undirected" },
          { from: 1, to: 2, type: "undirected" },
          { from: 2, to: 3, type: "undirected" },
        ]
      ),
      nodes: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
      startNodeId: 0,
    };

    const result = hamiltonianAdapter.execute(input);
    expect(result.error).toBeUndefined();
    const finalPath = resultEdges(result);
    // For 4 nodes, path has 3 edges
    expect(finalPath.length).toBe(3);
  });

  it("fails gracefully with error when no Hamiltonian path exists (e.g., Star K1,3 starting at leaf)", () => {
    // Star: center 0, leaves 1, 2, 3. Starting at leaf 1 can only go 1->0, then must choose 2 or 3, leaving the other unreached.
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
      startNodeId: 1,
    };

    const result = hamiltonianAdapter.execute(input);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("No Hamiltonian path");
  });
});
