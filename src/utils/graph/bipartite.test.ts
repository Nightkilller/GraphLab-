import { describe, it, expect } from "vitest";
import {
  checkBipartite,
  checkBipartiteRealizabilityBySets,
  checkBipartiteRealizabilityByTotal,
  arrangeBipartiteLayout,
} from "./bipartite";
import {
  generateCycle,
  generateCompleteBipartiteK33,
} from "./graphGenerator";
import { countUniqueEdges } from "./complementGraph";

describe("Bipartite Graph Suite", () => {
  it("identifies C4 cycle as bipartite and partitions it into 2 equal sets", () => {
    const c4 = generateCycle(4);
    const result = checkBipartite(c4.nodes, c4.edges);

    expect(result.isBipartite).toBe(true);
    expect(result.partition1.length).toBe(2);
    expect(result.partition2.length).toBe(2);
    expect(result.crossEdgesCount).toBe(4);
  });

  it("identifies C3 and C5 as non-bipartite and finds the odd cycle", () => {
    const c3 = generateCycle(3);
    const resultC3 = checkBipartite(c3.nodes, c3.edges);
    expect(resultC3.isBipartite).toBe(false);
    expect(resultC3.oddCycleLength).toBe(3);

    const c5 = generateCycle(5);
    const resultC5 = checkBipartite(c5.nodes, c5.edges);
    expect(resultC5.isBipartite).toBe(false);
    expect(resultC5.oddCycleLength).toBe(5);
  });

  it("identifies K3,3 as a complete bipartite graph", () => {
    const k33 = generateCompleteBipartiteK33();
    const result = checkBipartite(k33.nodes, k33.edges);

    expect(result.isBipartite).toBe(true);
    expect(result.isCompleteBipartite).toBe(true);
    expect(result.partition1.length).toBe(3);
    expect(result.partition2.length).toBe(3);
    expect(result.crossEdgesCount).toBe(9);
  });

  it("evaluates bipartite realizability by partition sets (n1, n2, m)", () => {
    // 3 and 4 vertices can have at most 12 edges
    const invalid = checkBipartiteRealizabilityBySets(3, 4, 15);
    expect(invalid.isPossible).toBe(false);
    expect(invalid.reason).toContain("exceeds this upper bound");

    const valid = checkBipartiteRealizabilityBySets(3, 4, 8);
    expect(valid.isPossible).toBe(true);
    expect(valid.graph).toBeDefined();
    expect(valid.graph!.nodes.length).toBe(7);
    expect(countUniqueEdges(valid.graph!.edges)).toBe(8);
  });

  it("evaluates bipartite realizability by total (n, m) with Turan bound", () => {
    // n=6 vertices has max 3*3 = 9 bipartite edges
    const impossible = checkBipartiteRealizabilityByTotal(6, 11);
    expect(impossible.isPossible).toBe(false);
    expect(impossible.reason).toContain("Turán");

    const possible = checkBipartiteRealizabilityByTotal(6, 7);
    expect(possible.isPossible).toBe(true);
    expect(possible.graph!.nodes.length).toBe(6);
    expect(countUniqueEdges(possible.graph!.edges)).toBe(7);
  });

  it("rearranges graph nodes into 2 vertical columns via arrangeBipartiteLayout", () => {
    const c4 = generateCycle(4);
    const analysis = checkBipartite(c4.nodes, c4.edges);
    const layout = arrangeBipartiteLayout(
      c4.nodes,
      c4.edges,
      analysis.partition1,
      analysis.partition2,
      c4.nodeCounter
    );

    // Left column x = -180, right column x = 180
    const xs = layout.nodes.map((n) => n.x);
    expect(xs.filter((x) => x === -180).length).toBe(2);
    expect(xs.filter((x) => x === 180).length).toBe(2);
  });
});
