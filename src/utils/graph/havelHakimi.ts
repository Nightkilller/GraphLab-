import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { NODE, EDGE_TYPE } from "../../constants/graph";
import { calculateAccurateCoords } from "../geometry/calc";
import { type GeneratedGraph } from "./graphGenerator";
import { computeComplementGraph } from "./complementGraph";

export interface HavelHakimiStep {
  sequence: number[];
  removedDegree?: number;
  subtractedCount?: number;
  resultSequence?: number[];
  note?: string;
}

export interface CheckGraphicalResult {
  isGraphical: boolean;
  steps: HavelHakimiStep[];
  reason: string;
  sumOfDegrees: number;
  edgeCount: number;
  cleanedSequence: number[];
}

export interface RealizationVariant {
  id: number;
  name: string;
  description: string;
  graph: GeneratedGraph;
  complement: GeneratedGraph;
}

/**
 * Check if a degree sequence is graphical using Handshaking Lemma and Havel-Hakimi Theorem.
 */
export function checkHavelHakimi(rawDegrees: number[]): CheckGraphicalResult {
  const cleaned = rawDegrees.filter((d) => !isNaN(d)).map((d) => Math.floor(d));
  const sumOfDegrees = cleaned.reduce((acc, val) => acc + val, 0);
  const n = cleaned.length;

  // Initial step record
  const steps: HavelHakimiStep[] = [{ sequence: [...cleaned] }];

  if (n === 0) {
    return {
      isGraphical: false,
      steps,
      reason: "Degree sequence is empty.",
      sumOfDegrees: 0,
      edgeCount: 0,
      cleanedSequence: cleaned,
    };
  }

  // Check 1: Non-negative integers
  if (cleaned.some((d) => d < 0)) {
    return {
      isGraphical: false,
      steps,
      reason: "Degree sequence cannot contain negative numbers.",
      sumOfDegrees,
      edgeCount: Math.floor(sumOfDegrees / 2),
      cleanedSequence: cleaned,
    };
  }

  // Check 2: Maximum degree cannot exceed n - 1
  if (cleaned.some((d) => d >= n)) {
    const invalid = cleaned.find((d) => d >= n);
    return {
      isGraphical: false,
      steps,
      reason: `Maximum degree (${invalid}) exceeds maximum possible degree in a simple graph of ${n} vertices (${
        n - 1
      }).`,
      sumOfDegrees,
      edgeCount: Math.floor(sumOfDegrees / 2),
      cleanedSequence: cleaned,
    };
  }

  // Check 3: Handshaking Lemma (Sum of degrees must be even)
  if (sumOfDegrees % 2 !== 0) {
    return {
      isGraphical: false,
      steps,
      reason: `Handshaking Lemma violated: The sum of degrees (${sumOfDegrees}) is odd. In any graph, the sum of all degrees must be even (2 * |E|).`,
      sumOfDegrees,
      edgeCount: Math.floor(sumOfDegrees / 2),
      cleanedSequence: cleaned,
    };
  }

  // Havel-Hakimi Reduction Process
  let current = [...cleaned].sort((a, b) => b - a);

  while (current.length > 0 && current[0] > 0) {
    const d = current.shift()!; // Remove first (largest) element

    if (d > current.length) {
      steps.push({
        sequence: [d, ...current],
        removedDegree: d,
        note: `Cannot subtract: required ${d} remaining elements, but only ${current.length} exist.`,
      });
      return {
        isGraphical: false,
        steps,
        reason: `Havel-Hakimi test failed: Vertex with degree ${d} cannot connect to ${d} distinct remaining vertices.`,
        sumOfDegrees,
        edgeCount: Math.floor(sumOfDegrees / 2),
        cleanedSequence: cleaned,
      };
    }

    // Subtract 1 from the next d elements
    for (let i = 0; i < d; i++) {
      current[i] -= 1;
      if (current[i] < 0) {
        steps.push({
          sequence: current,
          note: "Negative degree encountered after subtraction.",
        });
        return {
          isGraphical: false,
          steps,
          reason: "Havel-Hakimi test failed: Encountered a negative degree during reduction.",
          sumOfDegrees,
          edgeCount: Math.floor(sumOfDegrees / 2),
          cleanedSequence: cleaned,
        };
      }
    }

    // Re-sort descending
    current.sort((a, b) => b - a);
    steps.push({
      sequence: [...current],
      removedDegree: d,
      subtractedCount: d,
      resultSequence: [...current],
    });
  }

  return {
    isGraphical: true,
    steps,
    reason: "Valid graphical sequence! Reduced to all zeros via Havel-Hakimi theorem.",
    sumOfDegrees,
    edgeCount: Math.floor(sumOfDegrees / 2),
    cleanedSequence: cleaned,
  };
}

/**
 * Layout nodes in a circle
 */
function circularLayout(
  count: number,
  radius: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: Math.round(radius * Math.cos(angle)),
      y: Math.round(radius * Math.sin(angle)),
    });
  }
  return positions;
}

/**
 * Helper to build an edge map
 */
function buildEdgeMap(
  nodes: GraphNode[],
  pairList: Array<[number, number]>
): Map<number, GraphEdge[]> {
  const edges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => edges.set(n.id, []));

  const nodeMap = new Map<number, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  for (const [uId, vId] of pairList) {
    const u = nodeMap.get(uId);
    const v = nodeMap.get(vId);
    if (!u || !v || u.id === v.id) continue;

    const { tempX: t1X, tempY: t1Y } = calculateAccurateCoords(u.x, u.y, v.x, v.y);
    edges.get(u.id)?.push({
      x1: u.x,
      y1: u.y,
      x2: t1X,
      y2: t1Y,
      nodeX2: v.x,
      nodeY2: v.y,
      from: u.id,
      to: v.id,
      weight: 1,
      type: EDGE_TYPE.UNDIRECTED,
    });

    const { tempX: t2X, tempY: t2Y } = calculateAccurateCoords(v.x, v.y, u.x, u.y);
    edges.get(v.id)?.push({
      x1: v.x,
      y1: v.y,
      x2: t2X,
      y2: t2Y,
      nodeX2: u.x,
      nodeY2: u.y,
      from: v.id,
      to: u.id,
      weight: 1,
      type: EDGE_TYPE.UNDIRECTED,
    });
  }

  return edges;
}

/**
 * Construct the canonical realization of a graphical degree sequence using Havel-Hakimi algorithm.
 */
export function constructCanonicalRealization(degrees: number[]): GeneratedGraph | null {
  const n = degrees.length;
  if (n === 0) return null;

  // Track vertices and residual degrees
  const vertices = degrees.map((deg, idx) => ({
    id: idx,
    deg,
    label: String.fromCharCode(65 + (idx % 26)) + (idx >= 26 ? Math.floor(idx / 26) : ""),
  }));

  const radius = Math.min(220, Math.max(120, n * 24));
  const positions = circularLayout(n, radius);

  const nodes: GraphNode[] = vertices.map((v, i) => ({
    id: v.id,
    x: positions[i].x,
    y: positions[i].y,
    r: NODE.RADIUS,
    label: v.label,
  }));

  const pairs: Array<[number, number]> = [];
  const residual = [...vertices].sort((a, b) => b.deg - a.deg);

  while (residual.length > 0 && residual[0].deg > 0) {
    const u = residual.shift()!;
    const d = u.deg;
    if (d > residual.length) return null;

    for (let i = 0; i < d; i++) {
      residual[i].deg -= 1;
      pairs.push([u.id, residual[i].id]);
    }
    residual.sort((a, b) => b.deg - a.deg);
  }

  const edges = buildEdgeMap(nodes, pairs);
  return { nodes, edges, nodeCounter: n };
}

/**
 * Perform degree-preserving 2-switch edge swap to generate multiple structural variants.
 */
export function generateDegreeSequenceVariants(
  degrees: number[],
  maxVariants = 4
): RealizationVariant[] {
  const canonical = constructCanonicalRealization(degrees);
  if (!canonical) return [];

  const variants: RealizationVariant[] = [];

  // Variant 1: Canonical realization
  const v1Complement = computeComplementGraph(canonical.nodes, canonical.edges, canonical.nodeCounter);
  variants.push({
    id: 1,
    name: "Variant 1 (Greedy / Canonical)",
    description: "Standard Havel-Hakimi greedy priority realization",
    graph: canonical,
    complement: v1Complement,
  });

  // Extract initial unordered edge list
  const edgeSet = new Set<string>();
  const edgeList: Array<[number, number]> = [];

  canonical.edges.forEach((list, u) => {
    for (const e of list) {
      const min = Math.min(u, e.to);
      const max = Math.max(u, e.to);
      const key = `${min}-${max}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edgeList.push([min, max]);
      }
    }
  });

  // Attempt 2-switches to create distinct variants
  let currentEdges = [...edgeList];

  for (let variantIdx = 2; variantIdx <= maxVariants; variantIdx++) {
    let swapped = false;
    // Try multiple random 2-switch attempts
    for (let attempts = 0; attempts < 60; attempts++) {
      if (currentEdges.length < 2) break;

      const i = Math.floor(Math.random() * currentEdges.length);
      const j = Math.floor(Math.random() * currentEdges.length);
      if (i === j) continue;

      const [u, v] = currentEdges[i];
      const [x, y] = currentEdges[j];

      // Must be 4 distinct vertices
      if (u === x || u === y || v === x || v === y) continue;

      const hasUX =
        currentEdges.some(([a, b]) => (a === u && b === x) || (a === x && b === u));
      const hasVY =
        currentEdges.some(([a, b]) => (a === v && b === y) || (a === y && b === v));

      if (!hasUX && !hasVY) {
        // Perform 2-switch: replace (u,v) & (x,y) with (u,x) & (v,y)
        const nextEdges = currentEdges.filter((_, idx) => idx !== i && idx !== j);
        nextEdges.push([Math.min(u, x), Math.max(u, x)]);
        nextEdges.push([Math.min(v, y), Math.max(v, y)]);

        currentEdges = nextEdges;
        swapped = true;
        break;
      }
    }

    if (swapped) {
      const variantEdgeMap = buildEdgeMap(canonical.nodes, currentEdges);
      const variantGraph: GeneratedGraph = {
        nodes: [...canonical.nodes],
        edges: variantEdgeMap,
        nodeCounter: canonical.nodeCounter,
      };
      const variantComp = computeComplementGraph(
        variantGraph.nodes,
        variantGraph.edges,
        variantGraph.nodeCounter
      );

      variants.push({
        id: variantIdx,
        name: `Variant ${variantIdx} (2-Switch Structural Shift)`,
        description: "Degree-preserving edge-swap configuration",
        graph: variantGraph,
        complement: variantComp,
      });
    }
  }

  return variants;
}

/**
 * Synthesize a candidate degree sequence given vertex count n and edge count m.
 */
export function generateSequenceFromVertexEdgeCount(
  n: number,
  m: number
): { success: boolean; sequence?: number[]; error?: string } {
  if (n <= 0) return { success: false, error: "Number of vertices must be at least 1." };
  const maxEdges = (n * (n - 1)) / 2;
  if (m < 0) return { success: false, error: "Number of edges cannot be negative." };
  if (m > maxEdges) {
    return {
      success: false,
      error: `A simple graph of ${n} vertices can have at most ${maxEdges} edges (Complete graph K_${n}).`,
    };
  }

  // Construct balanced degree sequence with sum = 2 * m
  const totalSum = 2 * m;
  const baseDegree = Math.floor(totalSum / n);
  const remainder = totalSum % n;

  const sequence: number[] = [];
  for (let i = 0; i < n; i++) {
    sequence.push(baseDegree + (i < remainder ? 1 : 0));
  }

  // Verify that maximum degree does not exceed n - 1
  if (sequence.some((d) => d > n - 1)) {
    return {
      success: false,
      error: `Cannot construct simple graph: required degrees exceed ${n - 1}.`,
    };
  }

  const check = checkHavelHakimi(sequence);
  if (check.isGraphical) {
    return { success: true, sequence };
  }

  return {
    success: false,
    error: "Could not find a simple degree sequence for this vertex and edge combination.",
  };
}
