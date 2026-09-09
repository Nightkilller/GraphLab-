import { describe, it, expect } from "vitest";
import {
  analyzeSubgraph,
  extractInducedSubgraph,
  extractSpanningTree,
} from "./subgraph";
import { generateComplete, generateCycle } from "./graphGenerator";

describe("Subgraph Analysis and Classification", () => {
  it("classifies an induced subgraph G[S] on K4 correctly", () => {
    // Generate K4 on nodes 1, 2, 3, 4
    const k4 = generateComplete(4);
    // Extract induced subgraph on nodes 1, 2, 3 (which should be K3 clique)
    const sub = extractInducedSubgraph(k4.nodes, k4.edges, k4.nodeCounter, [1, 2, 3]);

    const result = analyzeSubgraph(k4, sub);
    expect(result.isSubgraph).toBe(true);
    expect(result.isProper).toBe(true);
    expect(result.isSpanning).toBe(false);
    expect(result.isInduced).toBe(true);
    expect(result.isClique).toBe(true);
    expect(result.omittedInducedEdgesCount).toBe(0);
  });

  it("classifies a spanning tree subgraph correctly", () => {
    const c5 = generateCycle(5);
    const st = extractSpanningTree(c5.nodes, c5.edges, c5.nodeCounter);

    const result = analyzeSubgraph(c5, st);
    expect(result.isSubgraph).toBe(true);
    expect(result.isSpanning).toBe(true);
    expect(result.isSpanningTree).toBe(true);
    expect(result.isAcyclic).toBe(true);
    expect(result.isInduced).toBe(false); // Omits the closing cycle edge
  });

  it("detects when candidate is not a subgraph due to extra vertex or edge", () => {
    const c4 = generateCycle(4);
    // Create candidate with an extra vertex ID 99
    const invalidCandidate = {
      nodes: [...c4.nodes, { id: 99, x: 0, y: 0, r: 16, label: "Z" }],
      edges: c4.edges,
    };

    const result = analyzeSubgraph(c4, invalidCandidate);
    expect(result.isSubgraph).toBe(false);
    expect(result.missingVertices).toContain("Z");
  });
});
