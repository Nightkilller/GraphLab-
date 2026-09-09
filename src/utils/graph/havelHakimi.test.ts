import { describe, it, expect } from "vitest";
import {
  checkHavelHakimi,
  generateDegreeSequenceVariants,
  generateSequenceFromVertexEdgeCount,
} from "./havelHakimi";

describe("Havel-Hakimi Degree Sequence Solver", () => {
  it("identifies valid graphical sequences", () => {
    // Triangle + edges: [2, 2, 2] -> K3
    const res1 = checkHavelHakimi([2, 2, 2]);
    expect(res1.isGraphical).toBe(true);
    expect(res1.edgeCount).toBe(3);

    // [3, 3, 2, 2, 2] -> 5 vertices, sum=12 (even)
    const res2 = checkHavelHakimi([3, 3, 2, 2, 2]);
    expect(res2.isGraphical).toBe(true);
    expect(res2.edgeCount).toBe(6);

    // Complete graph K4: [3, 3, 3, 3]
    const res3 = checkHavelHakimi([3, 3, 3, 3]);
    expect(res3.isGraphical).toBe(true);
    expect(res3.edgeCount).toBe(6);
  });

  it("identifies non-graphical sequences with informative reasons", () => {
    // Odd sum: [1, 1, 1] (sum = 3, max degree 1 <= 2) -> Handshaking lemma failure
    const res1 = checkHavelHakimi([1, 1, 1]);
    expect(res1.isGraphical).toBe(false);
    expect(res1.reason).toContain("Handshaking Lemma");

    // Max degree exceeds n - 1: [4, 1, 1, 1] for 4 vertices
    const res2 = checkHavelHakimi([4, 1, 1, 1]);
    expect(res2.isGraphical).toBe(false);
    expect(res2.reason).toContain("exceeds maximum possible degree");

    // Even sum but non-graphic: [3, 3, 3, 1] (sum = 10, max = 3 <= 3)
    // 3 leaves next 3: [2, 2, 0]. Next 2 leaves [1, -1] -> fails!
    const res3 = checkHavelHakimi([3, 3, 3, 1]);
    expect(res3.isGraphical).toBe(false);
    expect(res3.reason).toContain("Havel-Hakimi test failed");
  });

  it("constructs canonical graph and produces realization variants", () => {
    const seq = [3, 3, 2, 2, 2];
    const variants = generateDegreeSequenceVariants(seq, 3);
    expect(variants.length).toBeGreaterThanOrEqual(1);

    const v1 = variants[0];
    expect(v1.graph.nodes.length).toBe(5);
    // Complement of v1 should also be populated
    expect(v1.complement.nodes.length).toBe(5);
  });

  it("synthesizes valid degree sequences from vertex and edge counts", () => {
    // 5 vertices, 4 edges (tree-like)
    const syn1 = generateSequenceFromVertexEdgeCount(5, 4);
    expect(syn1.success).toBe(true);
    expect(syn1.sequence?.length).toBe(5);

    // Exceeding complete graph K4 (max 6 edges) with 8 edges -> fails
    const syn2 = generateSequenceFromVertexEdgeCount(4, 8);
    expect(syn2.success).toBe(false);
  });
});
