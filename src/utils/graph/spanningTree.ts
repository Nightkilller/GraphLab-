/**
 * Spanning Tree Theory, Counting & Minimum Spanning Tree (MST) Engine
 *
 * Implements:
 * 1. Cayley's Formula for complete graphs: τ(Kn) = n^(n-2)
 * 2. Kirchhoff's Matrix Tree Theorem for arbitrary graphs: τ(G) = det(L*)
 * 3. Kruskal's Algorithm for Minimum Spanning Tree (MST)
 * 4. Exhaustive Spanning Tree Enumeration (with pruning & UI safe caps)
 */

import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE_TYPE } from "../../constants/graph";
import { calculateAccurateCoords } from "../geometry/calc";
import { type GeneratedGraph } from "./graphGenerator";

export interface SpanningTreeEdge {
  from: number;
  to: number;
  fromLabel: string;
  toLabel: string;
  weight: number;
  key: string; // "minId-maxId"
}

export interface SpanningTreeItem {
  id: number;
  edges: SpanningTreeEdge[];
  totalWeight: number;
}

export interface MSTResult {
  edges: SpanningTreeEdge[];
  totalWeight: number;
  isConnected: boolean;
  edgeCount: number;
  vertexCount: number;
}

export interface CayleyResult {
  n: number;
  treesCount: string; // BigInt as string for large n
  edgesPerTree: number;
  totalCompleteEdges: number;
  formulaDisplay: string;
}

export interface GraphSpanningTreeAnalysis {
  isConnected: boolean;
  vertexCount: number;
  edgeCount: number;
  spanningTreeCount: number; // From Kirchhoff's Matrix Tree Theorem
  isExactCount: boolean;
  spanningTrees: SpanningTreeItem[]; // Enumerated trees (up to limit)
  totalEnumerated: number;
  mst: MSTResult | null;
  laplacianMatrix: number[][];
  nodeLabels: string[];
}

/**
 * Union-Find (Disjoint Set) with path compression and rank
 */
export class DisjointSet {
  parent: Map<number, number>;
  rank: Map<number, number>;

  constructor(elements: number[]) {
    this.parent = new Map();
    this.rank = new Map();
    for (const el of elements) {
      this.parent.set(el, el);
      this.rank.set(el, 0);
    }
  }

  find(x: number): number {
    const p = this.parent.get(x);
    if (p === undefined) return x;
    if (p !== x) {
      const root = this.find(p);
      this.parent.set(x, root);
      return root;
    }
    return x;
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
    return true;
  }
}

/**
 * Calculate Cayley's Formula: τ(K_n) = n^(n-2)
 */
export function calculateCayleysFormula(n: number): CayleyResult {
  if (n <= 0) {
    return {
      n: 0,
      treesCount: "0",
      edgesPerTree: 0,
      totalCompleteEdges: 0,
      formulaDisplay: "n must be ≥ 1",
    };
  }

  if (n === 1) {
    return {
      n: 1,
      treesCount: "1",
      edgesPerTree: 0,
      totalCompleteEdges: 0,
      formulaDisplay: "1^(1-2) = 1 (Trivial single-vertex tree)",
    };
  }

  if (n === 2) {
    return {
      n: 2,
      treesCount: "1",
      edgesPerTree: 1,
      totalCompleteEdges: 1,
      formulaDisplay: "2^(2-2) = 2^0 = 1",
    };
  }

  const bigN = BigInt(n);
  const exponent = BigInt(n - 2);
  const count = bigN ** exponent;
  const totalCompleteEdges = (n * (n - 1)) / 2;

  return {
    n,
    treesCount: count.toString(),
    edgesPerTree: n - 1,
    totalCompleteEdges,
    formulaDisplay: `${n}^(${n} - 2) = ${n}^${n - 2} = ${count.toLocaleString()}`,
  };
}

/**
 * Collect all unique undirected edges from graph
 */
export function extractUniqueEdges(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): SpanningTreeEdge[] {
  const nodeMap = new Map<number, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const uniqueEdges: SpanningTreeEdge[] = [];
  const seenKeys = new Set<string>();

  edges.forEach((edgeList, u) => {
    for (const e of edgeList) {
      const v = e.to;
      const minId = Math.min(u, v);
      const maxId = Math.max(u, v);
      const key = `${minId}-${maxId}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const fromNode = nodeMap.get(u);
        const toNode = nodeMap.get(v);
        uniqueEdges.push({
          from: minId,
          to: maxId,
          fromLabel: fromNode?.label || `v${minId}`,
          toLabel: toNode?.label || `v${maxId}`,
          weight: e.weight ?? 1,
          key,
        });
      }
    }
  });

  return uniqueEdges;
}

/**
 * Calculate determinant of a square matrix using Gaussian Elimination
 */
export function calculateMatrixDeterminant(mat: number[][]): number {
  const n = mat.length;
  if (n === 0) return 1;
  if (n === 1) return mat[0][0];

  // Deep clone matrix
  const A = mat.map((row) => [...row]);
  let det = 1;

  for (let i = 0; i < n; i++) {
    // Find pivot
    let pivot = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(A[r][i]) > Math.abs(A[pivot][i])) {
        pivot = r;
      }
    }

    if (Math.abs(A[pivot][i]) < 1e-12) {
      return 0; // Singular matrix
    }

    // Swap rows if needed
    if (pivot !== i) {
      const temp = A[i];
      A[i] = A[pivot];
      A[pivot] = temp;
      det = -det;
    }

    det *= A[i][i];

    // Eliminate below
    for (let r = i + 1; r < n; r++) {
      const factor = A[r][i] / A[i][i];
      for (let c = i; c < n; c++) {
        A[r][c] -= factor * A[i][c];
      }
    }
  }

  return det;
}

/**
 * Calculate the number of spanning trees via Kirchhoff's Matrix Tree Theorem:
 * τ(G) = det(L*) where L = Degree Matrix (D) - Adjacency Matrix (A),
 * and L* is formed by deleting row 0 and column 0.
 */
export function countSpanningTreesKirchhoff(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): { count: number; laplacian: number[][]; nodeLabels: string[] } {
  const n = nodes.length;
  if (n <= 1) return { count: n === 1 ? 1 : 0, laplacian: [], nodeLabels: [] };

  const nodeIds = nodes.map((node) => node.id);
  const nodeLabels = nodes.map((node) => node.label || `v${node.id}`);
  const idToIndex = new Map<number, number>();
  nodeIds.forEach((id, idx) => idToIndex.set(id, idx));

  // Initialize n x n Laplacian matrix
  const L: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0)
  );

  const seenEdges = new Set<string>();

  edges.forEach((edgeList, u) => {
    const uIdx = idToIndex.get(u);
    if (uIdx === undefined) return;

    for (const e of edgeList) {
      const vIdx = idToIndex.get(e.to);
      if (vIdx === undefined || u === e.to) continue; // Skip self-loops

      const minId = Math.min(u, e.to);
      const maxId = Math.max(u, e.to);
      const key = `${minId}-${maxId}`;

      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        // Degrees
        L[uIdx][uIdx] += 1;
        L[vIdx][vIdx] += 1;
        // Off-diagonals (undirected connection)
        L[uIdx][vIdx] -= 1;
        L[vIdx][uIdx] -= 1;
      }
    }
  });

  // Reduced Laplacian L* (delete row 0 and column 0)
  const reducedL: number[][] = [];
  for (let i = 1; i < n; i++) {
    const row: number[] = [];
    for (let j = 1; j < n; j++) {
      row.push(L[i][j]);
    }
    reducedL.push(row);
  }

  const rawDet = calculateMatrixDeterminant(reducedL);
  const count = Math.max(0, Math.round(rawDet));

  return { count, laplacian: L, nodeLabels };
}

/**
 * Compute Minimum Spanning Tree (MST) using Kruskal's Algorithm
 */
export function computeMinimumSpanningTree(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): MSTResult {
  const n = nodes.length;
  if (n === 0) {
    return {
      edges: [],
      totalWeight: 0,
      isConnected: false,
      edgeCount: 0,
      vertexCount: 0,
    };
  }

  if (n === 1) {
    return {
      edges: [],
      totalWeight: 0,
      isConnected: true,
      edgeCount: 0,
      vertexCount: 1,
    };
  }

  const uniqueEdges = extractUniqueEdges(nodes, edges);
  // Sort edges ascending by weight
  uniqueEdges.sort((a, b) => a.weight - b.weight);

  const nodeIds = nodes.map((node) => node.id);
  const ds = new DisjointSet(nodeIds);

  const mstEdges: SpanningTreeEdge[] = [];
  let totalWeight = 0;

  for (const edge of uniqueEdges) {
    if (ds.union(edge.from, edge.to)) {
      mstEdges.push(edge);
      totalWeight += edge.weight;
      if (mstEdges.length === n - 1) {
        break;
      }
    }
  }

  const isConnected = mstEdges.length === n - 1;

  return {
    edges: mstEdges,
    totalWeight,
    isConnected,
    edgeCount: mstEdges.length,
    vertexCount: n,
  };
}

/**
 * Enumerate all distinct spanning trees of graph G (up to maxCount limit)
 */
export function enumerateSpanningTrees(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  maxCount: number = 50
): SpanningTreeItem[] {
  const n = nodes.length;
  if (n <= 1) return [];

  const allEdges = extractUniqueEdges(nodes, edges);
  const nodeIds = nodes.map((node) => node.id);
  const targetEdgeCount = n - 1;

  if (allEdges.length < targetEdgeCount) {
    return [];
  }

  const resultTrees: SpanningTreeItem[] = [];

  // Recursive backtracking combination search with cycle check
  function search(edgeIndex: number, currentEdges: SpanningTreeEdge[], ds: DisjointSet) {
    if (resultTrees.length >= maxCount) return;

    if (currentEdges.length === targetEdgeCount) {
      const totalWeight = currentEdges.reduce((sum, e) => sum + e.weight, 0);
      resultTrees.push({
        id: resultTrees.length + 1,
        edges: [...currentEdges],
        totalWeight,
      });
      return;
    }

    // Prune if remaining edges are insufficient to reach target
    const remainingEdges = allEdges.length - edgeIndex;
    if (currentEdges.length + remainingEdges < targetEdgeCount) {
      return;
    }

    for (let i = edgeIndex; i < allEdges.length; i++) {
      if (resultTrees.length >= maxCount) break;

      const edge = allEdges[i];
      // Clone disjoint set state
      const nextDs = new DisjointSet(nodeIds);
      nextDs.parent = new Map(ds.parent);
      nextDs.rank = new Map(ds.rank);

      // Check if adding this edge creates a cycle
      if (nextDs.union(edge.from, edge.to)) {
        currentEdges.push(edge);
        search(i + 1, currentEdges, nextDs);
        currentEdges.pop();
      }
    }
  }

  const initialDs = new DisjointSet(nodeIds);
  search(0, [], initialDs);

  return resultTrees;
}

/**
 * Full Graph Spanning Tree Analysis for Active Canvas Graph
 */
export function analyzeGraphSpanningTrees(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): GraphSpanningTreeAnalysis {
  const vertexCount = nodes.length;
  const uniqueEdges = extractUniqueEdges(nodes, edges);
  const edgeCount = uniqueEdges.length;

  if (vertexCount === 0) {
    return {
      isConnected: false,
      vertexCount: 0,
      edgeCount: 0,
      spanningTreeCount: 0,
      isExactCount: true,
      spanningTrees: [],
      totalEnumerated: 0,
      mst: null,
      laplacianMatrix: [],
      nodeLabels: [],
    };
  }

  const { count: spanningTreeCount, laplacian: laplacianMatrix, nodeLabels } = countSpanningTreesKirchhoff(
    nodes,
    edges
  );

  const isConnected = spanningTreeCount > 0;
  const mst = isConnected ? computeMinimumSpanningTree(nodes, edges) : null;

  // Enumerate trees if graph is reasonably sized
  const spanningTrees = isConnected ? enumerateSpanningTrees(nodes, edges, 50) : [];

  return {
    isConnected,
    vertexCount,
    edgeCount,
    spanningTreeCount,
    isExactCount: true,
    spanningTrees,
    totalEnumerated: spanningTrees.length,
    mst,
    laplacianMatrix,
    nodeLabels,
  };
}

/**
 * Constructs a new graph data structure containing the original nodes
 * but only with the edges belonging to a given spanning tree.
 */
export function applyTreeEdgesToGraph(
  nodes: GraphNode[],
  treeEdges: SpanningTreeEdge[],
  nodeCounter: number
): GeneratedGraph {
  const nodeMap = new Map<number, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const newEdges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => newEdges.set(n.id, []));

  for (const te of treeEdges) {
    const fromNode = nodeMap.get(te.from);
    const toNode = nodeMap.get(te.to);
    if (!fromNode || !toNode) continue;

    const { tempX: x2F, tempY: y2F } = calculateAccurateCoords(
      fromNode.x,
      fromNode.y,
      toNode.x,
      toNode.y
    );
    const { tempX: x2T, tempY: y2T } = calculateAccurateCoords(
      toNode.x,
      toNode.y,
      fromNode.x,
      fromNode.y
    );

    const edgeFwd: GraphEdge = {
      x1: fromNode.x,
      y1: fromNode.y,
      x2: x2F,
      y2: y2F,
      nodeX2: toNode.x,
      nodeY2: toNode.y,
      from: fromNode.id,
      to: toNode.id,
      weight: te.weight,
      type: EDGE_TYPE.UNDIRECTED,
    };

    const edgeRev: GraphEdge = {
      x1: toNode.x,
      y1: toNode.y,
      x2: x2T,
      y2: y2T,
      nodeX2: fromNode.x,
      nodeY2: fromNode.y,
      from: toNode.id,
      to: fromNode.id,
      weight: te.weight,
      type: EDGE_TYPE.UNDIRECTED,
    };

    newEdges.get(fromNode.id)?.push(edgeFwd);
    newEdges.get(toNode.id)?.push(edgeRev);
  }

  return {
    nodes: [...nodes],
    edges: newEdges,
    nodeCounter,
  };
}

/**
 * Format spanning tree analysis verdict as a canvas annotation text string.
 */
export function formatSpanningTreeAnnotation(
  analysis: GraphSpanningTreeAnalysis
): string {
  const lines: string[] = [];
  lines.push(`🌲 Spanning Tree Analysis`);
  lines.push(`• Vertices: ${analysis.vertexCount} | Edges: ${analysis.edgeCount}`);
  lines.push(`• Connected: ${analysis.isConnected ? "Yes" : "No"}`);
  lines.push(`• Total Spanning Trees: ${analysis.spanningTreeCount.toLocaleString()} (Kirchhoff's Matrix Tree)`);
  if (analysis.mst) {
    lines.push(`• MST Total Weight: ${analysis.mst.totalWeight}`);
    lines.push(`• MST Edges (${analysis.mst.edgeCount}): ${analysis.mst.edges.map(e => `${e.fromLabel}-${e.toLabel}(w=${e.weight})`).join(", ")}`);
  }
  return lines.join("\n");
}

