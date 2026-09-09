import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { calculateAccurateCoords } from "../geometry/calc";
import { type GeneratedGraph } from "./graphGenerator";
import { countUniqueEdges } from "./complementGraph";

export interface IsomorphismMapping {
  fromId: number;
  fromLabel: string;
  toId: number;
  toLabel: string;
}

export interface IsomorphismCheckResult {
  isIsomorphic: boolean;
  reason: string;
  mapping?: Map<number, number>;
  mappingDisplay?: IsomorphismMapping[];
  invariants: {
    v1: number;
    v2: number;
    e1: number;
    e2: number;
    degreeSeq1: number[];
    degreeSeq2: number[];
  };
}

export interface GeneratedIsomorphicResult {
  graph: GeneratedGraph;
  mapping: Map<number, number>;
  mappingDisplay: IsomorphismMapping[];
}

/**
 * Generate a randomized permutation of an array
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate an isomorphic twin of graph G with permuted labels and alternative layout.
 */
export function generateIsomorphicGraph(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  nodeCounter: number
): GeneratedIsomorphicResult {
  const n = nodes.length;
  if (n === 0) {
    return {
      graph: { nodes: [], edges: new Map(), nodeCounter },
      mapping: new Map(),
      mappingDisplay: [],
    };
  }

  // Permute vertex order
  const shuffledOriginal = shuffleArray(nodes);

  const mapping = new Map<number, number>();
  const mappingDisplay: IsomorphismMapping[] = [];

  // Create new nodes with new IDs, permuted positions, and new labels (e.g. v1, v2...)
  const angleOffset = Math.random() * Math.PI * 2;
  const radius = Math.min(220, Math.max(120, n * 24));

  const newNodes: GraphNode[] = shuffledOriginal.map((origNode, idx) => {
    const newId = nodeCounter + idx;
    const newLabel = `V${idx + 1}`;
    mapping.set(origNode.id, newId);
    mappingDisplay.push({
      fromId: origNode.id,
      fromLabel: origNode.label || String(origNode.id),
      toId: newId,
      toLabel: newLabel,
    });

    const angle = (2 * Math.PI * idx) / n + angleOffset;
    return {
      id: newId,
      x: Math.round(radius * Math.cos(angle)),
      y: Math.round(radius * Math.sin(angle)),
      r: origNode.r,
      label: newLabel,
    };
  });

  const newNodeMap = new Map<number, GraphNode>();
  newNodes.forEach((n) => newNodeMap.set(n.id, n));

  const newEdges = new Map<number, GraphEdge[]>();
  newNodes.forEach((n) => newEdges.set(n.id, []));

  // Remap edges: (u, v) in E -> (mapping(u), mapping(v)) in E'
  edges.forEach((edgeList, u) => {
    const uPrimeId = mapping.get(u);
    if (uPrimeId === undefined) return;
    const uPrimeNode = newNodeMap.get(uPrimeId);
    if (!uPrimeNode) return;

    for (const e of edgeList) {
      const vPrimeId = mapping.get(e.to);
      if (vPrimeId === undefined) continue;
      const vPrimeNode = newNodeMap.get(vPrimeId);
      if (!vPrimeNode) continue;

      const { tempX, tempY } = calculateAccurateCoords(
        uPrimeNode.x,
        uPrimeNode.y,
        vPrimeNode.x,
        vPrimeNode.y
      );

      newEdges.get(uPrimeId)?.push({
        x1: uPrimeNode.x,
        y1: uPrimeNode.y,
        x2: tempX,
        y2: tempY,
        nodeX2: vPrimeNode.x,
        nodeY2: vPrimeNode.y,
        from: uPrimeId,
        to: vPrimeId,
        weight: e.weight,
        type: e.type,
      });
    }
  });

  return {
    graph: {
      nodes: newNodes,
      edges: newEdges,
      nodeCounter: nodeCounter + newNodes.length,
    },
    mapping,
    mappingDisplay,
  };
}

/**
 * Check if two graphs G1 and G2 are isomorphic.
 */
export function checkIsomorphism(
  g1: { nodes: GraphNode[]; edges: Map<number, GraphEdge[]> },
  g2: { nodes: GraphNode[]; edges: Map<number, GraphEdge[]> }
): IsomorphismCheckResult {
  const v1 = g1.nodes.length;
  const v2 = g2.nodes.length;

  const e1 = countUniqueEdges(g1.edges);
  const e2 = countUniqueEdges(g2.edges);

  // Compute degrees for G1
  const degMap1 = new Map<number, number>();
  g1.nodes.forEach((n) => degMap1.set(n.id, 0));
  g1.edges.forEach((list, u) => {
    degMap1.set(u, list.length);
  });

  // Compute degrees for G2
  const degMap2 = new Map<number, number>();
  g2.nodes.forEach((n) => degMap2.set(n.id, 0));
  g2.edges.forEach((list, u) => {
    degMap2.set(u, list.length);
  });

  const degreeSeq1 = g1.nodes.map((n) => degMap1.get(n.id) || 0).sort((a, b) => b - a);
  const degreeSeq2 = g2.nodes.map((n) => degMap2.get(n.id) || 0).sort((a, b) => b - a);

  const invariants = { v1, v2, e1, e2, degreeSeq1, degreeSeq2 };

  // Invariant 1: Vertex counts
  if (v1 !== v2) {
    return {
      isIsomorphic: false,
      reason: `Vertex counts differ: Graph 1 has ${v1} vertices, while Graph 2 has ${v2} vertices.`,
      invariants,
    };
  }

  // Invariant 2: Edge counts
  if (e1 !== e2) {
    return {
      isIsomorphic: false,
      reason: `Edge counts differ: Graph 1 has ${e1} edges, while Graph 2 has ${e2} edges.`,
      invariants,
    };
  }

  // Invariant 3: Degree sequences
  for (let i = 0; i < degreeSeq1.length; i++) {
    if (degreeSeq1[i] !== degreeSeq2[i]) {
      return {
        isIsomorphic: false,
        reason: `Degree sequences do not match: Graph 1 has [${degreeSeq1.join(
          ", "
        )}], while Graph 2 has [${degreeSeq2.join(", ")}].`,
        invariants,
      };
    }
  }

  // Fast path for empty or single node graphs
  if (v1 <= 1) {
    const mapping = new Map<number, number>();
    const mappingDisplay: IsomorphismMapping[] = [];
    if (v1 === 1) {
      const n1 = g1.nodes[0];
      const n2 = g2.nodes[0];
      mapping.set(n1.id, n2.id);
      mappingDisplay.push({
        fromId: n1.id,
        fromLabel: n1.label || String(n1.id),
        toId: n2.id,
        toLabel: n2.label || String(n2.id),
      });
    }
    return {
      isIsomorphic: true,
      reason: "Isomorphic! Trivial bijection on graphs of size ≤ 1.",
      mapping,
      mappingDisplay,
      invariants,
    };
  }

  // Adjacency Matrix Lookup
  const adj1 = new Set<string>();
  g1.edges.forEach((list, u) => {
    for (const e of list) {
      adj1.add(`${u}-${e.to}`);
    }
  });

  const adj2 = new Set<string>();
  g2.edges.forEach((list, u) => {
    for (const e of list) {
      adj2.add(`${u}-${e.to}`);
    }
  });

  const nodes1 = g1.nodes;
  const nodes2 = g2.nodes;

  // Backtracking bijection search with degree compatibility pruning
  const currentMapping = new Map<number, number>();
  const usedIn2 = new Set<number>();

  function search(idx: number): boolean {
    if (idx === nodes1.length) return true;

    const u1 = nodes1[idx];
    const degU1 = degMap1.get(u1.id) || 0;

    for (const u2 of nodes2) {
      if (usedIn2.has(u2.id)) continue;
      // Degree must match
      if ((degMap2.get(u2.id) || 0) !== degU1) continue;

      // Check adjacency consistency with previously mapped vertices
      let valid = true;
      for (let prevIdx = 0; prevIdx < idx; prevIdx++) {
        const p1 = nodes1[prevIdx];
        const p2Id = currentMapping.get(p1.id)!;

        const edgeInG1 = adj1.has(`${u1.id}-${p1.id}`) || adj1.has(`${p1.id}-${u1.id}`);
        const edgeInG2 = adj2.has(`${u2.id}-${p2Id}`) || adj2.has(`${p2Id}-${u2.id}`);

        if (edgeInG1 !== edgeInG2) {
          valid = false;
          break;
        }
      }

      if (valid) {
        currentMapping.set(u1.id, u2.id);
        usedIn2.add(u2.id);

        if (search(idx + 1)) return true;

        currentMapping.delete(u1.id);
        usedIn2.delete(u2.id);
      }
    }

    return false;
  }

  const found = search(0);

  if (!found) {
    return {
      isIsomorphic: false,
      reason:
        "Not isomorphic: Vertex count, edge count, and degree sequences matched, but no structure-preserving bijection exists between the adjacency matrices.",
      invariants,
    };
  }

  const node2Map = new Map<number, GraphNode>();
  nodes2.forEach((n) => node2Map.set(n.id, n));

  const mappingDisplay: IsomorphismMapping[] = nodes1.map((n1) => {
    const targetId = currentMapping.get(n1.id)!;
    const targetNode = node2Map.get(targetId);
    return {
      fromId: n1.id,
      fromLabel: n1.label || String(n1.id),
      toId: targetId,
      toLabel: targetNode?.label || String(targetId),
    };
  });

  return {
    isIsomorphic: true,
    reason: "Isomorphic! Found exact edge-preserving bijection mapping between vertex sets.",
    mapping: currentMapping,
    mappingDisplay,
    invariants,
  };
}
