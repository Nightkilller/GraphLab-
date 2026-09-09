/**
 * Eulerian Path & Circuit Algorithm Adapter
 *
 * An Eulerian trail traverses every edge in the graph exactly once.
 * An Eulerian circuit is a closed Eulerian trail (starts and ends at the same vertex).
 *
 * Conditions (Euler's Theorem for Undirected Graphs):
 * - Euler Circuit: Graph is connected and every vertex has an EVEN degree.
 * - Euler Path: Graph is connected and exactly TWO vertices have ODD degrees.
 * - Neither: If more than two vertices have odd degrees.
 */

import { EulerianIcon } from "../icons";
import { nid } from "../traceHelpers";
import {
  AlgorithmAdapter,
  AlgorithmInput,
  AlgorithmResult,
  AlgorithmType,
  AlgorithmGenerator,
  AlgorithmStep,
  StepType,
  EdgeRef,
} from "../types";
import { EDGE_TYPE } from "../../constants/graph";

interface EdgeRecord {
  from: number;
  to: number;
  id: string; // unique edge identifier
  type: string;
}

/**
 * Generator function for step-through Eulerian Path / Circuit execution.
 */
function* eulerianGenerator(input: AlgorithmInput): AlgorithmGenerator {
  const { adjacencyList, nodes, startNodeId } = input;

  if (nodes.length === 0) return;

  // Build degree table and undirected edge multiset
  const degreeMap = new Map<number, number>();
  const remainingEdges = new Map<number, EdgeRecord[]>();
  let totalEdgesCount = 0;

  nodes.forEach((n) => {
    degreeMap.set(n.id, 0);
    remainingEdges.set(n.id, []);
  });

  const processedUndirectedEdges = new Set<string>();

  adjacencyList.forEach((edges, u) => {
    for (const e of edges) {
      const v = e.to;
      const isUndirected = e.type === EDGE_TYPE.UNDIRECTED;
      const edgeKey = isUndirected
        ? [Math.min(u, v), Math.max(u, v)].join("-")
        : `${u}->${v}`;

      // In undirected graphs, only count each edge once for degree & total count
      if (!isUndirected || !processedUndirectedEdges.has(edgeKey)) {
        if (isUndirected) processedUndirectedEdges.add(edgeKey);
        totalEdgesCount++;
        degreeMap.set(u, (degreeMap.get(u) || 0) + 1);
        degreeMap.set(v, (degreeMap.get(v) || 0) + 1);
      }

      const edgeRecord: EdgeRecord = {
        from: u,
        to: v,
        id: `${u}-${v}-${Math.random()}`,
        type: e.type,
      };
      remainingEdges.get(u)?.push(edgeRecord);
    }
  });

  // Identify vertices with odd degrees
  const oddDegreeNodes: number[] = [];
  degreeMap.forEach((deg, id) => {
    if (deg % 2 !== 0) {
      oddDegreeNodes.push(id);
    }
  });

  // Step 1: Initial Analysis
  const isCircuit = oddDegreeNodes.length === 0;
  const isPath = oddDegreeNodes.length === 2;
  const hasEulerian = isCircuit || isPath;

  let chosenStart = startNodeId;
  if (isPath && !oddDegreeNodes.includes(startNodeId)) {
    // If user selected an even degree node for an Euler Path, start from an odd degree vertex
    chosenStart = oddDegreeNodes[0];
  }

  const statusMsg = isCircuit
    ? `**Eulerian Circuit exists!** All vertices have even degrees.`
    : isPath
    ? `**Eulerian Path exists!** Exactly 2 vertices have odd degrees: **${oddDegreeNodes.map(nid).join(", ")}**.`
    : `**Not Eulerian**: Found **${oddDegreeNodes.length} vertices with odd degrees** (${oddDegreeNodes.map(nid).join(", ")}).`;

  yield {
    type: StepType.VISIT,
    edge: { from: -1, to: chosenStart },
    trace: {
      message: statusMsg,
      dataStructure: {
        type: "stack",
        items: oddDegreeNodes.map((id) => ({ id, value: degreeMap.get(id) })),
        processing: { id: chosenStart },
      },
    },
  };

  if (!hasEulerian || totalEdgesCount === 0) {
    return;
  }

  // Hierholzer's Algorithm implementation
  // We maintain a current path stack and backtrack to splice circuits
  const currentStack: number[] = [chosenStart];
  const finalCircuit: EdgeRef[] = [];
  const edgeHistory: AlgorithmStep[] = [];

  // Clone remaining edges so we can remove traversed edges
  const adj = new Map<number, EdgeRecord[]>();
  remainingEdges.forEach((list, k) => adj.set(k, [...list]));

  while (currentStack.length > 0) {
    const u = currentStack[currentStack.length - 1];
    const uEdges = adj.get(u) || [];

    if (uEdges.length > 0) {
      // Pick next available edge
      const edge = uEdges.pop()!;
      const v = edge.to;

      // If undirected, remove the reverse edge as well
      if (edge.type === EDGE_TYPE.UNDIRECTED) {
        const vEdges = adj.get(v) || [];
        const revIdx = vEdges.findIndex((e) => e.to === u);
        if (revIdx !== -1) {
          vEdges.splice(revIdx, 1);
        }
      }

      currentStack.push(v);

      const step: AlgorithmStep = {
        type: StepType.VISIT,
        edge: { from: u, to: v },
        trace: {
          message: `Traversing edge **(${nid(u)}, ${nid(v)})**. Edges remaining: **${
            totalEdgesCount - finalCircuit.length - currentStack.length + 1
          }**`,
          dataStructure: {
            type: "stack",
            items: currentStack.map((id) => ({ id })),
            processing: { id: v },
          },
        },
      };
      edgeHistory.push(step);
      yield step;
    } else {
      // Backtrack: vertex has no remaining unused edges
      const popped = currentStack.pop()!;
      if (currentStack.length > 0) {
        const prev = currentStack[currentStack.length - 1];
        finalCircuit.push({ from: prev, to: popped });
      }
    }
  }

  // Reverse finalCircuit because Hierholzer's adds edges in reverse order
  finalCircuit.reverse();

  // Yield RESULT steps for the complete Eulerian Path / Circuit
  for (let i = 0; i < finalCircuit.length; i++) {
    const e = finalCircuit[i];
    yield {
      type: StepType.RESULT,
      edge: e,
      trace: {
        message: `**Euler ${isCircuit ? "Circuit" : "Path"} step ${i + 1}/${finalCircuit.length}**: (${nid(
          e.from
        )} → ${nid(e.to)})`,
        dataStructure: {
          type: "stack",
          items: finalCircuit.slice(0, i + 1).map((edge) => ({ id: edge.to })),
          processing: { id: e.to },
        },
      },
    };
  }
}

/**
 * Validate and execute Eulerian algorithm.
 */
function executeEulerian(input: AlgorithmInput): AlgorithmResult {
  const { adjacencyList, nodes } = input;

  if (nodes.length === 0) {
    return { steps: [] };
  }

  // Count degrees
  const degreeMap = new Map<number, number>();
  nodes.forEach((n) => degreeMap.set(n.id, 0));

  const processedUndirectedEdges = new Set<string>();

  adjacencyList.forEach((edges, u) => {
    for (const e of edges) {
      const v = e.to;
      const isUndirected = e.type === EDGE_TYPE.UNDIRECTED;
      const key = isUndirected ? [Math.min(u, v), Math.max(u, v)].join("-") : `${u}->${v}`;
      if (!isUndirected || !processedUndirectedEdges.has(key)) {
        if (isUndirected) processedUndirectedEdges.add(key);
        degreeMap.set(u, (degreeMap.get(u) || 0) + 1);
        degreeMap.set(v, (degreeMap.get(v) || 0) + 1);
      }
    }
  });

  const oddDegreeNodes: number[] = [];
  degreeMap.forEach((deg, id) => {
    if (deg % 2 !== 0) oddDegreeNodes.push(id);
  });

  if (oddDegreeNodes.length !== 0 && oddDegreeNodes.length !== 2) {
    return {
      steps: [...eulerianGenerator(input)],
      error: `Graph has ${oddDegreeNodes.length} vertices with odd degree. An Euler path requires 0 or 2 odd-degree vertices.`,
    };
  }

  return {
    steps: [...eulerianGenerator(input)],
  };
}

const eulerianAdapter: AlgorithmAdapter = {
  metadata: {
    id: "eulerian",
    name: "Eulerian Path & Circuit",
    type: AlgorithmType.TRAVERSAL,
    tagline: "Traverse every edge exactly once",
    icon: EulerianIcon,
    inputStepHints: ["Select a starting vertex (odd-degree vertex preferred for paths)"],
  },
  generator: eulerianGenerator,
  execute: executeEulerian,
};

export default eulerianAdapter;
