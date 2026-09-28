/**
 * Graph Matrix Generation Utilities
 *
 * Generates Adjacency Matrix and Incidence Matrix representations
 * from the graph's node and edge data structures.
 */

import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE_TYPE } from "../../constants/graph";

export interface AdjacencyMatrixResult {
  matrix: number[][];
  nodeIds: number[];
  nodeLabels: string[];
}

export interface IncidenceMatrixResult {
  matrix: number[][];
  nodeIds: number[];
  nodeLabels: string[];
  edgeLabels: string[];
}

/**
 * Generate the Adjacency Matrix for a graph.
 *
 * For an undirected graph: A[i][j] = weight if edge exists, 0 otherwise.
 * For a directed graph: A[i][j] = weight if edge i→j exists, 0 otherwise.
 *
 * @param nodes Array of graph nodes
 * @param edges Adjacency list of graph edges
 * @returns AdjacencyMatrixResult with matrix, nodeIds, and nodeLabels
 */
export function generateAdjacencyMatrix(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): AdjacencyMatrixResult {
  const n = nodes.length;
  const nodeIds = nodes.map((node) => node.id);
  const nodeLabels = nodes.map((node) => node.label || String(node.id));
  const idToIndex = new Map<number, number>();
  nodeIds.forEach((id, idx) => idToIndex.set(id, idx));

  // Initialize n×n matrix with zeros
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0)
  );

  // Fill the matrix from edges
  const seen = new Set<string>();
  edges.forEach((edgeList, u) => {
    for (const e of edgeList) {
      const i = idToIndex.get(u);
      const j = idToIndex.get(e.to);
      if (i === undefined || j === undefined) continue;

      if (e.type === EDGE_TYPE.DIRECTED) {
        matrix[i][j] = e.weight;
      } else {
        // Undirected: avoid double-counting from both adjacency list entries
        const key = `${Math.min(u, e.to)}-${Math.max(u, e.to)}`;
        if (!seen.has(key)) {
          seen.add(key);
          matrix[i][j] = e.weight;
          matrix[j][i] = e.weight;
        }
      }
    }
  });

  return { matrix, nodeIds, nodeLabels };
}

/**
 * Generate the Incidence Matrix for a graph.
 *
 * For an undirected graph: B[i][k] = 1 if node i is incident to edge k, 0 otherwise.
 * For a directed graph: B[i][k] = -1 if edge k leaves node i, +1 if edge k enters node i.
 *
 * @param nodes Array of graph nodes
 * @param edges Adjacency list of graph edges
 * @returns IncidenceMatrixResult with matrix, nodeIds, nodeLabels, and edgeLabels
 */
export function generateIncidenceMatrix(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): IncidenceMatrixResult {
  const nodeIds = nodes.map((node) => node.id);
  const nodeLabels = nodes.map((node) => node.label || String(node.id));
  const idToIndex = new Map<number, number>();
  nodeIds.forEach((id, idx) => idToIndex.set(id, idx));

  // Collect unique edges
  interface UniqueEdge {
    from: number;
    to: number;
    weight: number;
    isDirected: boolean;
  }

  const uniqueEdges: UniqueEdge[] = [];
  const seenEdges = new Set<string>();

  edges.forEach((edgeList, u) => {
    for (const e of edgeList) {
      const isDirected = e.type === EDGE_TYPE.DIRECTED;
      const key = isDirected
        ? `${u}->${e.to}`
        : `${Math.min(u, e.to)}-${Math.max(u, e.to)}`;

      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        uniqueEdges.push({
          from: u,
          to: e.to,
          weight: e.weight,
          isDirected,
        });
      }
    }
  });

  const n = nodes.length;
  const m = uniqueEdges.length;

  // Create edge labels like "e1(A-B)" or "e1(A→B)"
  const edgeLabels = uniqueEdges.map((edge, idx) => {
    const fromLabel = nodeLabels[idToIndex.get(edge.from) ?? 0] ?? String(edge.from);
    const toLabel = nodeLabels[idToIndex.get(edge.to) ?? 0] ?? String(edge.to);
    const connector = edge.isDirected ? "→" : "-";
    return `e${idx + 1}(${fromLabel}${connector}${toLabel})`;
  });

  // Initialize n×m matrix with zeros
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: m }, () => 0)
  );

  // Fill incidence matrix
  uniqueEdges.forEach((edge, edgeIdx) => {
    const fromIdx = idToIndex.get(edge.from);
    const toIdx = idToIndex.get(edge.to);
    if (fromIdx === undefined || toIdx === undefined) return;

    if (edge.isDirected) {
      // Directed: -1 for tail (from), +1 for head (to)
      matrix[fromIdx][edgeIdx] = -1;
      matrix[toIdx][edgeIdx] = 1;
    } else {
      // Undirected: 1 for both endpoints
      matrix[fromIdx][edgeIdx] = 1;
      matrix[toIdx][edgeIdx] = 1;
    }
  });

  return { matrix, nodeIds, nodeLabels, edgeLabels };
}
