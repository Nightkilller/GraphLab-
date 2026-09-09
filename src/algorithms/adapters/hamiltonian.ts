/**
 * Hamiltonian Path & Circuit Algorithm Adapter
 *
 * A Hamiltonian Path is a path in an undirected or directed graph that visits
 * each vertex exactly once.
 * A Hamiltonian Circuit (or Hamiltonian Cycle) is a Hamiltonian Path that is a cycle
 * (returns to the starting vertex).
 *
 * Implemented using depth-first backtracking with visual candidate path inspection.
 */

import { HamiltonianIcon } from "../icons";
import { nid } from "../traceHelpers";
import {
  AlgorithmAdapter,
  AlgorithmInput,
  AlgorithmResult,
  AlgorithmType,
  AlgorithmGenerator,
  StepType,
  EdgeRef,
} from "../types";

/**
 * Generator function for step-through Hamiltonian Path & Circuit execution.
 */
function* hamiltonianGenerator(input: AlgorithmInput): AlgorithmGenerator {
  const { adjacencyList, nodes, startNodeId } = input;

  if (nodes.length === 0) return;

  const totalNodes = nodes.length;
  const visited = new Set<number>();
  const path: number[] = [];

  let solutionFound = false;
  let isCircuit = false;
  let finalPathEdges: EdgeRef[] = [];

  // Helper to check if edge exists between u and v
  const hasEdge = (u: number, v: number): boolean => {
    const neighbors = adjacencyList.get(u) || [];
    return neighbors.some((e) => e.to === v);
  };

  // Backtracking search generator
  function* backtrack(curr: number): AlgorithmGenerator {
    path.push(curr);
    visited.add(curr);

    // Yield step showing current candidate node added
    const prevNode = path.length > 1 ? path[path.length - 2] : -1;
    yield {
      type: StepType.VISIT,
      edge: { from: prevNode, to: curr },
      trace: {
        message: `Visiting **node ${nid(curr)}** (Progress: **${path.length}/${totalNodes}** vertices)`,
        dataStructure: {
          type: "stack",
          items: path.map((id) => ({ id })),
          processing: { id: curr },
          justAdded: [curr],
        },
      },
    };

    // If all vertices are visited, check if circuit or path
    if (path.length === totalNodes) {
      if (hasEdge(curr, startNodeId)) {
        isCircuit = true;
        solutionFound = true;
        // Build circuit edges
        finalPathEdges = [];
        for (let i = 0; i < path.length - 1; i++) {
          finalPathEdges.push({ from: path[i], to: path[i + 1] });
        }
        finalPathEdges.push({ from: curr, to: startNodeId });

        yield {
          type: StepType.VISIT,
          edge: { from: curr, to: startNodeId },
          trace: {
            message: `**Hamiltonian Circuit Found!** Returned to start node ${nid(startNodeId)}.`,
            dataStructure: {
              type: "stack",
              items: [...path, startNodeId].map((id) => ({ id })),
              processing: { id: startNodeId },
            },
          },
        };
        return;
      } else {
        // Hamiltonian path without closing cycle
        isCircuit = false;
        solutionFound = true;
        finalPathEdges = [];
        for (let i = 0; i < path.length - 1; i++) {
          finalPathEdges.push({ from: path[i], to: path[i + 1] });
        }
        yield {
          type: StepType.VISIT,
          edge: { from: prevNode, to: curr },
          trace: {
            message: `**Hamiltonian Path Found!** (All ${totalNodes} vertices visited; no closing edge to ${nid(startNodeId)}).`,
            dataStructure: {
              type: "stack",
              items: path.map((id) => ({ id })),
              processing: { id: curr },
            },
          },
        };
        return;
      }
    }

    // Try unvisited neighbors
    const neighbors = adjacencyList.get(curr) || [];
    for (const edge of neighbors) {
      const next = edge.to;
      if (!visited.has(next)) {
        yield* backtrack(next);
        if (solutionFound) return;
      }
    }

    // Dead end: Backtrack
    yield {
      type: StepType.VISIT,
      edge: { from: curr, to: prevNode },
      trace: {
        message: `Dead end at **node ${nid(curr)}**. Backtracking to **node ${nid(prevNode)}**...`,
        dataStructure: {
          type: "stack",
          items: path.map((id) => ({ id })),
          processing: { id: prevNode },
        },
      },
    };

    path.pop();
    visited.delete(curr);
  }

  yield* backtrack(startNodeId);

  if (solutionFound) {
    // Highlight final path / circuit in RESULT color
    for (let i = 0; i < finalPathEdges.length; i++) {
      const e = finalPathEdges[i];
      yield {
        type: StepType.RESULT,
        edge: e,
        trace: {
          message: `**Hamiltonian ${isCircuit ? "Circuit" : "Path"} edge ${i + 1}/${finalPathEdges.length}**: (${nid(
            e.from
          )} → ${nid(e.to)})`,
          dataStructure: {
            type: "stack",
            items: finalPathEdges.slice(0, i + 1).map((ed) => ({ id: ed.to })),
            processing: { id: e.to },
          },
        },
      };
    }
  } else {
    yield {
      type: StepType.VISIT,
      edge: { from: -1, to: startNodeId },
      trace: {
        message: `**No Hamiltonian Path found** from start node ${nid(startNodeId)}.`,
        dataStructure: {
          type: "stack",
          items: [],
          processing: { id: startNodeId },
        },
      },
    };
  }
}

/**
 * Validate and execute Hamiltonian algorithm.
 */
function executeHamiltonian(input: AlgorithmInput): AlgorithmResult {
  const steps = [...hamiltonianGenerator(input)];
  const hasResult = steps.some((s) => s.type === StepType.RESULT);

  if (!hasResult && input.nodes.length > 1) {
    return {
      steps,
      error: "No Hamiltonian path or circuit exists from the selected start vertex.",
    };
  }

  return { steps };
}

const hamiltonianAdapter: AlgorithmAdapter = {
  metadata: {
    id: "hamiltonian",
    name: "Hamiltonian Path & Circuit",
    type: AlgorithmType.TRAVERSAL,
    tagline: "Visit every vertex exactly once",
    icon: HamiltonianIcon,
    inputStepHints: ["Select a starting vertex to begin Hamiltonian search"],
  },
  generator: hamiltonianGenerator,
  execute: executeHamiltonian,
};

export default hamiltonianAdapter;
