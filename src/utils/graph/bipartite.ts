import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { NODE, EDGE_TYPE } from "../../constants/graph";
import { calculateAccurateCoords } from "../geometry/calc";
import { type GeneratedGraph } from "./graphGenerator";
import { countUniqueEdges } from "./complementGraph";

export interface BipartiteAnalysisResult {
  isBipartite: boolean;
  reason: string;
  partition1: GraphNode[];
  partition2: GraphNode[];
  crossEdgesCount: number;
  isCompleteBipartite: boolean;
  oddCycleNodes?: number[];
  oddCycleLabels?: string[];
  oddCycleEdges?: string[];
  oddCycleLength?: number;
}

export interface BipartiteRealizabilityResult {
  isPossible: boolean;
  reason: string;
  maxPossibleEdges: number;
  n1: number;
  n2: number;
  requestedEdges: number;
  graph?: GeneratedGraph;
}

/**
 * Checks if graph G is bipartite via BFS 2-coloring.
 * If bipartite, partitions nodes into two independent sets.
 * If not, extracts the exact odd-length cycle that causes the contradiction.
 */
export function checkBipartite(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>
): BipartiteAnalysisResult {
  if (nodes.length === 0) {
    return {
      isBipartite: true,
      reason: "Empty graph is vacuously bipartite.",
      partition1: [],
      partition2: [],
      crossEdgesCount: 0,
      isCompleteBipartite: true,
    };
  }

  const colors = new Map<number, number>(); // 0 or 1
  const parentMap = new Map<number, number>();
  const depthMap = new Map<number, number>();

  const part1: GraphNode[] = [];
  const part2: GraphNode[] = [];

  for (const startNode of nodes) {
    if (!colors.has(startNode.id)) {
      colors.set(startNode.id, 0);
      depthMap.set(startNode.id, 0);
      const queue: number[] = [startNode.id];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currColor = colors.get(curr)!;
        const nextColor = 1 - currColor;

        for (const edge of edges.get(curr) || []) {
          const neighbor = edge.to;

          if (!colors.has(neighbor)) {
            colors.set(neighbor, nextColor);
            parentMap.set(neighbor, curr);
            depthMap.set(neighbor, depthMap.get(curr)! + 1);
            queue.push(neighbor);
          } else if (colors.get(neighbor) === currColor) {
            // Found odd cycle between curr and neighbor!
            // Trace back to LCA to find the cycle
            const path1: number[] = [curr];
            let p1: number | undefined = curr;
            while (p1 !== undefined && parentMap.has(p1)) {
              p1 = parentMap.get(p1);
              if (p1 !== undefined) path1.push(p1);
            }

            const path2: number[] = [neighbor];
            let p2: number | undefined = neighbor;
            while (p2 !== undefined && parentMap.has(p2)) {
              p2 = parentMap.get(p2);
              if (p2 !== undefined) path2.push(p2);
            }

            // Find lowest common ancestor
            const set1 = new Set(path1);
            let lca = startNode.id;
            for (const nodeIn2 of path2) {
              if (set1.has(nodeIn2)) {
                lca = nodeIn2;
                break;
              }
            }

            // Build cycle: curr -> ... -> lca -> ... -> neighbor -> curr
            const cycleFromCurrToLca: number[] = [];
            for (const n of path1) {
              cycleFromCurrToLca.push(n);
              if (n === lca) break;
            }

            const cycleFromNeighborToLca: number[] = [];
            for (const n of path2) {
              if (n === lca) break;
              cycleFromNeighborToLca.push(n);
            }

            const oddCycle = [...cycleFromCurrToLca, ...cycleFromNeighborToLca.reverse()];
            const oddCycleLength = oddCycle.length;

            const oddCycleLabels = oddCycle.map((id) => {
              const node = nodes.find((n) => n.id === id);
              return node?.label || `v${id}`;
            });

            const oddCycleEdges: string[] = [];
            for (let i = 0; i < oddCycle.length; i++) {
              const u = oddCycle[i];
              const v = oddCycle[(i + 1) % oddCycle.length];
              const min = Math.min(u, v);
              const max = Math.max(u, v);
              oddCycleEdges.push(`${min}-${max}`);
            }

            const cycleStr = [...oddCycleLabels, oddCycleLabels[0]].join(" → ");

            return {
              isBipartite: false,
              reason: `Not Bipartite: Found an odd-length cycle of length ${oddCycleLength} (${cycleStr}). In graph theory (Kőnig's Theorem), a graph is bipartite if and only if it contains no odd cycles. Because 2-coloring an odd cycle forces two adjacent vertices to share the same color, no bipartition is possible.`,
              partition1: [],
              partition2: [],
              crossEdgesCount: 0,
              isCompleteBipartite: false,
              oddCycleNodes: oddCycle,
              oddCycleLabels,
              oddCycleEdges,
              oddCycleLength,
            };
          }
        }
      }
    }
  }

  // Graph is bipartite
  for (const node of nodes) {
    if (colors.get(node.id) === 0) {
      part1.push(node);
    } else {
      part2.push(node);
    }
  }

  const crossEdgesCount = countUniqueEdges(edges);
  const maxPossibleEdges = part1.length * part2.length;
  const isCompleteBipartite = crossEdgesCount === maxPossibleEdges && maxPossibleEdges > 0;

  return {
    isBipartite: true,
    reason: `Graph is Bipartite! The vertices can be partitioned into two independent sets V₁ (${part1.length} vertices) and V₂ (${part2.length} vertices) such that all ${crossEdgesCount} edges connect a vertex in V₁ to a vertex in V₂ with zero internal edges.${isCompleteBipartite ? ` This is a Complete Bipartite graph K_{${part1.length},${part2.length}}.` : ""}`,
    partition1: part1,
    partition2: part2,
    crossEdgesCount,
    isCompleteBipartite,
  };
}

/**
 * Arranges nodes into two clean vertical columns (Bipartite Layout)
 */
export function arrangeBipartiteLayout(
  _nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  partition1: GraphNode[],
  partition2: GraphNode[],
  nodeCounter: number
): GeneratedGraph {
  const leftX = -180;
  const rightX = 180;

  const n1 = partition1.length;
  const n2 = partition2.length;

  const spacingY = 75;
  const startY1 = -((n1 - 1) * spacingY) / 2;
  const startY2 = -((n2 - 1) * spacingY) / 2;

  const newNodes: GraphNode[] = [];
  const nodePositionMap = new Map<number, { x: number; y: number }>();

  partition1.forEach((n, idx) => {
    const y = startY1 + idx * spacingY;
    newNodes.push({ ...n, x: leftX, y });
    nodePositionMap.set(n.id, { x: leftX, y });
  });

  partition2.forEach((n, idx) => {
    const y = startY2 + idx * spacingY;
    newNodes.push({ ...n, x: rightX, y });
    nodePositionMap.set(n.id, { x: rightX, y });
  });

  // Recompute edge coordinates
  const newEdges = new Map<number, GraphEdge[]>();
  newNodes.forEach((n) => newEdges.set(n.id, []));

  edges.forEach((list, u) => {
    const fromNode = newNodes.find((n) => n.id === u);
    if (!fromNode) return;

    for (const e of list) {
      const toNode = newNodes.find((n) => n.id === e.to);
      if (!toNode) return;

      const { tempX: tX, tempY: tY } = calculateAccurateCoords(fromNode.x, fromNode.y, toNode.x, toNode.y);
      newEdges.get(u)!.push({
        x1: fromNode.x,
        y1: fromNode.y,
        x2: tX,
        y2: tY,
        nodeX2: toNode.x,
        nodeY2: toNode.y,
        from: u,
        to: e.to,
        type: EDGE_TYPE.UNDIRECTED,
        weight: e.weight || 1,
      });
    }
  });

  return {
    nodes: newNodes,
    edges: newEdges,
    nodeCounter,
  };
}

/**
 * Validates and constructs a bipartite graph given partition sizes n1, n2 and edge count m.
 */
export function checkBipartiteRealizabilityBySets(
  n1: number,
  n2: number,
  m: number,
  nodeCounter = 0
): BipartiteRealizabilityResult {
  const maxEdges = n1 * n2;

  if (n1 <= 0 || n2 <= 0) {
    return {
      isPossible: false,
      reason: "Partition sizes |V₁| and |V₂| must both be at least 1.",
      maxPossibleEdges: 0,
      n1,
      n2,
      requestedEdges: m,
    };
  }

  if (m < 0) {
    return {
      isPossible: false,
      reason: "Edge count cannot be negative.",
      maxPossibleEdges: maxEdges,
      n1,
      n2,
      requestedEdges: m,
    };
  }

  if (m > maxEdges) {
    return {
      isPossible: false,
      reason: `Impossible as a simple bipartite graph. Partitions of size |V₁| = ${n1} and |V₂| = ${n2} can have at most ${n1} × ${n2} = ${maxEdges} edges (which forms the complete bipartite graph K_{${n1},${n2}}). The requested ${m} edges exceeds this upper bound.`,
      maxPossibleEdges: maxEdges,
      n1,
      n2,
      requestedEdges: m,
    };
  }

  // POSSIBLE! Construct bipartite graph
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const leftX = -180;
  const rightX = 180;
  const spacingY = 70;
  const startY1 = -((n1 - 1) * spacingY) / 2;
  const startY2 = -((n2 - 1) * spacingY) / 2;

  let currentId = nodeCounter > 0 ? nodeCounter + 1 : 1;
  const v1Ids: number[] = [];
  const v2Ids: number[] = [];

  for (let i = 0; i < n1; i++) {
    const id = currentId++;
    v1Ids.push(id);
    nodes.push({
      id,
      x: leftX,
      y: startY1 + i * spacingY,
      r: NODE.RADIUS,
      label: `A${i + 1}`,
    });
    edges.set(id, []);
  }

  for (let j = 0; j < n2; j++) {
    const id = currentId++;
    v2Ids.push(id);
    nodes.push({
      id,
      x: rightX,
      y: startY2 + j * spacingY,
      r: NODE.RADIUS,
      label: `B${j + 1}`,
    });
    edges.set(id, []);
  }

  // Generate all possible cross edges and pick m of them evenly
  const allCrossEdges: [number, number][] = [];
  for (const u of v1Ids) {
    for (const v of v2Ids) {
      allCrossEdges.push([u, v]);
    }
  }

  // Pick m edges deterministically or evenly
  const selectedEdges = allCrossEdges.slice(0, m);

  for (const [u, v] of selectedEdges) {
    const fromNode = nodes.find((n) => n.id === u)!;
    const toNode = nodes.find((n) => n.id === v)!;
    const { tempX: t1X, tempY: t1Y } = calculateAccurateCoords(fromNode.x, fromNode.y, toNode.x, toNode.y);
    const { tempX: t2X, tempY: t2Y } = calculateAccurateCoords(toNode.x, toNode.y, fromNode.x, fromNode.y);

    edges.get(u)!.push({
      x1: fromNode.x,
      y1: fromNode.y,
      x2: t1X,
      y2: t1Y,
      nodeX2: toNode.x,
      nodeY2: toNode.y,
      from: u,
      to: v,
      type: EDGE_TYPE.UNDIRECTED,
      weight: 1,
    });
    edges.get(v)!.push({
      x1: toNode.x,
      y1: toNode.y,
      x2: t2X,
      y2: t2Y,
      nodeX2: fromNode.x,
      nodeY2: fromNode.y,
      from: v,
      to: u,
      type: EDGE_TYPE.UNDIRECTED,
      weight: 1,
    });
  }

  const isComplete = m === maxEdges;
  const reason = isComplete
    ? `Possible! Constructed Complete Bipartite Graph K_{${n1},${n2}} with all ${m} possible edges.`
    : `Possible! A bipartite graph with partitions |V₁| = ${n1} and |V₂| = ${n2} supports up to ${maxEdges} edges. Successfully constructed realization with ${m} edges.`;

  return {
    isPossible: true,
    reason,
    maxPossibleEdges: maxEdges,
    n1,
    n2,
    requestedEdges: m,
    graph: {
      nodes,
      edges,
      nodeCounter: currentId,
    },
  };
}

/**
 * Validates and constructs a bipartite graph given total vertex count n and edge count m.
 * Uses Turán's Theorem: max edges in bipartite graph on n vertices is ⌊n²/4⌋.
 */
export function checkBipartiteRealizabilityByTotal(
  n: number,
  m: number,
  nodeCounter = 0
): BipartiteRealizabilityResult {
  if (n < 2) {
    return {
      isPossible: false,
      reason: "A bipartite graph requires at least 2 vertices.",
      maxPossibleEdges: 0,
      n1: n,
      n2: 0,
      requestedEdges: m,
    };
  }

  const n1 = Math.floor(n / 2);
  const n2 = Math.ceil(n / 2);
  const maxEdges = n1 * n2; // ⌊n²/4⌋

  if (m < 0) {
    return {
      isPossible: false,
      reason: "Edge count cannot be negative.",
      maxPossibleEdges: maxEdges,
      n1,
      n2,
      requestedEdges: m,
    };
  }

  if (m > maxEdges) {
    return {
      isPossible: false,
      reason: `Impossible as a bipartite graph. By Turán's / Mantel's Theorem, the maximum number of edges in ANY bipartite graph on ${n} vertices is ⌊${n}²/4⌋ = ${maxEdges} (achieved by balanced partition ${n1} + ${n2}). With ${m} edges, any simple graph on ${n} vertices must contain at least one odd cycle (such as a triangle K₃), making a bipartite graph mathematically impossible.`,
      maxPossibleEdges: maxEdges,
      n1,
      n2,
      requestedEdges: m,
    };
  }

  const result = checkBipartiteRealizabilityBySets(n1, n2, m, nodeCounter);
  return {
    ...result,
    reason: `Possible! By Turán's Theorem, the maximum edges for a bipartite graph on ${n} vertices is ⌊${n}²/4⌋ = ${maxEdges} (partitioned into ${n1} and ${n2} vertices). Your requested ${m} edges is valid!`,
  };
}
