import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE, EDGE_TYPE, type EdgeType } from "../../constants/graph";
import { calculateAccurateCoords } from "../geometry/calc";
import { type GeneratedGraph } from "./graphGenerator";

export interface ComplementAnalysis {
  nodeCount: number;
  origEdgeCount: number;
  compEdgeCount: number;
  maxEdges: number;
  isSelfComplementaryCandidate: boolean;
  degrees: Array<{
    id: number;
    label: string;
    origDegree: number;
    compDegree: number;
  }>;
}

export interface SideBySideGraphResult extends GeneratedGraph {
  leftHeaderPos: { x: number; y: number };
  rightHeaderPos: { x: number; y: number };
  analysis: ComplementAnalysis;
}

/**
 * Helper to count unique edges (undirected edges counted once)
 */
export function countUniqueEdges(edges: Map<number, GraphEdge[]>): number {
  let count = 0;
  const seen = new Set<string>();
  edges.forEach((list, u) => {
    for (const e of list) {
      const key =
        e.type === EDGE_TYPE.UNDIRECTED
          ? [Math.min(u, e.to), Math.max(u, e.to)].join("-")
          : `${u}->${e.to}`;
      if (e.type !== EDGE_TYPE.UNDIRECTED || !seen.has(key)) {
        if (e.type === EDGE_TYPE.UNDIRECTED) seen.add(key);
        count++;
      }
    }
  });
  return count;
}

/**
 * Automatically analyze complement properties of a graph.
 */
export function analyzeComplementGraph(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): ComplementAnalysis {
  const n = nodes.length;
  const maxEdges = (n * (n - 1)) / 2;
  const origEdgeCount = countUniqueEdges(edges);
  const compEdgeCount = Math.max(0, maxEdges - origEdgeCount);

  const origDegreeMap = new Map<number, number>();
  nodes.forEach((node) => origDegreeMap.set(node.id, 0));

  const seenEdges = new Set<string>();
  edges.forEach((list, u) => {
    for (const e of list) {
      const key =
        e.type === EDGE_TYPE.UNDIRECTED
          ? [Math.min(u, e.to), Math.max(u, e.to)].join("-")
          : `${u}->${e.to}`;
      if (e.type !== EDGE_TYPE.UNDIRECTED || !seenEdges.has(key)) {
        if (e.type === EDGE_TYPE.UNDIRECTED) seenEdges.add(key);
        origDegreeMap.set(u, (origDegreeMap.get(u) || 0) + 1);
        origDegreeMap.set(e.to, (origDegreeMap.get(e.to) || 0) + 1);
      }
    }
  });

  const degrees = nodes.map((node) => {
    const origDeg = origDegreeMap.get(node.id) || 0;
    const compDeg = Math.max(0, n - 1 - origDeg);
    return {
      id: node.id,
      label: node.label || String(node.id),
      origDegree: origDeg,
      compDegree: compDeg,
    };
  });

  const isSelfComplementaryCandidate =
    n % 4 === 0 || (n - 1) % 4 === 0 ? origEdgeCount === compEdgeCount : false;

  return {
    nodeCount: n,
    origEdgeCount,
    compEdgeCount,
    maxEdges,
    isSelfComplementaryCandidate,
    degrees,
  };
}

/**
 * Compute the complement graph G' of graph G in place (same vertex coordinates).
 */
export function computeComplementGraph(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  nodeCounter: number
): GeneratedGraph {
  const complementEdges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => complementEdges.set(n.id, []));

  let isDirected = false;
  for (const edgeList of edges.values()) {
    for (const e of edgeList) {
      if (e.type === EDGE_TYPE.DIRECTED) {
        isDirected = true;
        break;
      }
    }
    if (isDirected) break;
  }

  const existingEdgeSet = new Set<string>();
  for (const edgeList of edges.values()) {
    for (const e of edgeList) {
      existingEdgeSet.add(`${e.from}-${e.to}`);
    }
  }

  const edgeType: EdgeType = isDirected ? EDGE_TYPE.DIRECTED : EDGE_TYPE.UNDIRECTED;

  if (isDirected) {
    for (const u of nodes) {
      for (const v of nodes) {
        if (u.id === v.id) continue;
        if (!existingEdgeSet.has(`${u.id}-${v.id}`)) {
          const { tempX, tempY } = calculateAccurateCoords(u.x, u.y, v.x, v.y);
          const newEdge: GraphEdge = {
            x1: u.x,
            y1: u.y,
            x2: tempX,
            y2: tempY,
            nodeX2: v.x,
            nodeY2: v.y,
            from: u.id,
            to: v.id,
            weight: EDGE.DEFAULT_WEIGHT,
            type: edgeType,
            category: "complement",
          };
          complementEdges.get(u.id)?.push(newEdge);
        }
      }
    }
  } else {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const u = nodes[i];
        const v = nodes[j];

        const hasEdge =
          existingEdgeSet.has(`${u.id}-${v.id}`) || existingEdgeSet.has(`${v.id}-${u.id}`);
        if (!hasEdge) {
          const { tempX: tempX1, tempY: tempY1 } = calculateAccurateCoords(u.x, u.y, v.x, v.y);
          const edgeUV: GraphEdge = {
            x1: u.x,
            y1: u.y,
            x2: tempX1,
            y2: tempY1,
            nodeX2: v.x,
            nodeY2: v.y,
            from: u.id,
            to: v.id,
            weight: EDGE.DEFAULT_WEIGHT,
            type: edgeType,
            category: "complement",
          };
          complementEdges.get(u.id)?.push(edgeUV);

          const { tempX: tempX2, tempY: tempY2 } = calculateAccurateCoords(v.x, v.y, u.x, u.y);
          const edgeVU: GraphEdge = {
            x1: v.x,
            y1: v.y,
            x2: tempX2,
            y2: tempY2,
            nodeX2: u.x,
            nodeY2: u.y,
            from: v.id,
            to: u.id,
            weight: EDGE.DEFAULT_WEIGHT,
            type: edgeType,
            category: "complement",
          };
          complementEdges.get(v.id)?.push(edgeVU);
        }
      }
    }
  }

  return {
    nodes: [...nodes],
    edges: complementEdges,
    nodeCounter,
  };
}

/**
 * Generate Side-by-Side (Adjacent) Complement Graph:
 * Places the Original Graph G on the left and the Complement Graph G' on the adjacent right side.
 * Nodes in G' are labeled with a prime (e.g. A -> A').
 */
export function computeSideBySideComplement(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  nodeCounter: number
): SideBySideGraphResult {
  const analysis = analyzeComplementGraph(nodes, edges);

  if (nodes.length === 0) {
    return {
      nodes: [],
      edges: new Map(),
      nodeCounter,
      leftHeaderPos: { x: 0, y: 0 },
      rightHeaderPos: { x: 0, y: 0 },
      analysis,
    };
  }

  // Calculate bounding box of original graph
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const width = Math.max(maxX - minX, 180);
  const separation = Math.max(width + 140, 320);

  // Offset: Left graph shifted by -separation/2, Right graph by +separation/2
  const leftShift = -separation / 2;
  const rightShift = separation / 2;

  // 1. Create Left (Original) Nodes
  const leftNodes: GraphNode[] = nodes.map((n) => ({
    ...n,
    x: Math.round(n.x + leftShift),
    y: Math.round(n.y),
    label: n.label || String(n.id),
  }));

  // 2. Create Right (Complement) Nodes
  // Map original node id -> new complement node id
  const origToCompId = new Map<number, number>();
  const rightNodes: GraphNode[] = nodes.map((n, idx) => {
    const compId = nodeCounter + idx;
    origToCompId.set(n.id, compId);
    const origLabel = n.label || String(n.id);
    return {
      id: compId,
      x: Math.round(n.x + rightShift),
      y: Math.round(n.y),
      r: n.r,
      label: `${origLabel}'`,
    };
  });

  const allNodes: GraphNode[] = [...leftNodes, ...rightNodes];
  const allEdges = new Map<number, GraphEdge[]>();
  allNodes.forEach((n) => allEdges.set(n.id, []));

  // 3. Rebuild Left (Original) Edges with new coordinates
  const leftNodeMap = new Map<number, GraphNode>();
  leftNodes.forEach((n) => leftNodeMap.set(n.id, n));

  edges.forEach((edgeList, uId) => {
    const uNode = leftNodeMap.get(uId);
    if (!uNode) return;

    for (const e of edgeList) {
      const vNode = leftNodeMap.get(e.to);
      if (!vNode) continue;

      const { tempX, tempY } = calculateAccurateCoords(uNode.x, uNode.y, vNode.x, vNode.y);
      const newEdge: GraphEdge = {
        x1: uNode.x,
        y1: uNode.y,
        x2: tempX,
        y2: tempY,
        nodeX2: vNode.x,
        nodeY2: vNode.y,
        from: uNode.id,
        to: vNode.id,
        weight: e.weight,
        type: e.type,
        category: "original",
      };
      allEdges.get(uNode.id)?.push(newEdge);
    }
  });

  // 4. Build Right (Complement) Edges between right nodes
  let isDirected = false;
  for (const edgeList of edges.values()) {
    for (const e of edgeList) {
      if (e.type === EDGE_TYPE.DIRECTED) {
        isDirected = true;
        break;
      }
    }
    if (isDirected) break;
  }

  const existingOriginalPairs = new Set<string>();
  edges.forEach((edgeList, u) => {
    for (const e of edgeList) {
      existingOriginalPairs.add(`${u}-${e.to}`);
    }
  });

  const edgeType: EdgeType = isDirected ? EDGE_TYPE.DIRECTED : EDGE_TYPE.UNDIRECTED;
  const rightNodeMap = new Map<number, GraphNode>();
  rightNodes.forEach((n) => rightNodeMap.set(n.id, n));

  if (isDirected) {
    for (const u of nodes) {
      const uRight = rightNodeMap.get(origToCompId.get(u.id)!);
      if (!uRight) continue;

      for (const v of nodes) {
        if (u.id === v.id) continue;
        const vRight = rightNodeMap.get(origToCompId.get(v.id)!);
        if (!vRight) continue;

        if (!existingOriginalPairs.has(`${u.id}-${v.id}`)) {
          const { tempX, tempY } = calculateAccurateCoords(uRight.x, uRight.y, vRight.x, vRight.y);
          allEdges.get(uRight.id)?.push({
            x1: uRight.x,
            y1: uRight.y,
            x2: tempX,
            y2: tempY,
            nodeX2: vRight.x,
            nodeY2: vRight.y,
            from: uRight.id,
            to: vRight.id,
            weight: EDGE.DEFAULT_WEIGHT,
            type: edgeType,
            category: "complement",
          });
        }
      }
    }
  } else {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const u = nodes[i];
        const v = nodes[j];

        const hasEdge =
          existingOriginalPairs.has(`${u.id}-${v.id}`) ||
          existingOriginalPairs.has(`${v.id}-${u.id}`);

        if (!hasEdge) {
          const uRight = rightNodeMap.get(origToCompId.get(u.id)!);
          const vRight = rightNodeMap.get(origToCompId.get(v.id)!);
          if (!uRight || !vRight) continue;

          // Edge u' -> v'
          const { tempX: t1X, tempY: t1Y } = calculateAccurateCoords(
            uRight.x,
            uRight.y,
            vRight.x,
            vRight.y
          );
          allEdges.get(uRight.id)?.push({
            x1: uRight.x,
            y1: uRight.y,
            x2: t1X,
            y2: t1Y,
            nodeX2: vRight.x,
            nodeY2: vRight.y,
            from: uRight.id,
            to: vRight.id,
            weight: EDGE.DEFAULT_WEIGHT,
            type: edgeType,
            category: "complement",
          });

          // Edge v' -> u'
          const { tempX: t2X, tempY: t2Y } = calculateAccurateCoords(
            vRight.x,
            vRight.y,
            uRight.x,
            uRight.y
          );
          allEdges.get(vRight.id)?.push({
            x1: vRight.x,
            y1: vRight.y,
            x2: t2X,
            y2: t2Y,
            nodeX2: uRight.x,
            nodeY2: uRight.y,
            from: vRight.id,
            to: uRight.id,
            weight: EDGE.DEFAULT_WEIGHT,
            type: edgeType,
            category: "complement",
          });
        }
      }
    }
  }

  const leftCenterX = (minX + maxX) / 2 + leftShift;
  const rightCenterX = (minX + maxX) / 2 + rightShift;
  const headerY = minY - 50;

  return {
    nodes: allNodes,
    edges: allEdges,
    nodeCounter: nodeCounter + rightNodes.length,
    leftHeaderPos: { x: Math.round(leftCenterX), y: Math.round(headerY) },
    rightHeaderPos: { x: Math.round(rightCenterX), y: Math.round(headerY) },
    analysis,
  };
}
