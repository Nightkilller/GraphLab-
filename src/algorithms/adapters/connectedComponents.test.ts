import { describe, it, expect } from "vitest";
import connectedComponentsAdapter from "./connectedComponents";
import { AlgorithmInput, StepType } from "../types";
import { createAdjacencyList } from "./__tests__/testUtils";

describe("Connected Components Algorithm", () => {
  it("has correct metadata", () => {
    expect(connectedComponentsAdapter.metadata.id).toBe("connected-components");
    expect(connectedComponentsAdapter.metadata.name).toContain("Connected Components");
  });

  it("identifies components in a disconnected graph with 2 components", () => {
    // Component 1: 0-1
    // Component 2: 2-3
    const input: AlgorithmInput = {
      adjacencyList: createAdjacencyList(
        [0, 1, 2, 3],
        [
          { from: 0, to: 1, type: "undirected" },
          { from: 2, to: 3, type: "undirected" },
        ]
      ),
      nodes: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
      startNodeId: 0,
    };

    const result = connectedComponentsAdapter.execute(input);
    expect(result.error).toBeUndefined();
    const resultStep = result.steps.find((s) => s.type === StepType.RESULT);
    expect(resultStep?.trace?.message).toContain("2 connected components");
  });
});
