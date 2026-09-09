import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { NODE, EDGE, EDGE_TYPE, type EdgeType } from "../../constants/graph";
import { calculateAccurateCoords } from "../geometry/calc";

export interface GeneratedGraph {
  nodes: GraphNode[];
  edges: Map<number, GraphEdge[]>;
  nodeCounter: number;
}

export type LayoutType = "circular" | "random" | "grid";

interface RandomGeneratorOptions {
  nodeCount: number;
  edgeDensity: number; // 0-1
  directed: boolean;
  weighted: boolean;
  minWeight?: number;
  maxWeight?: number;
  layout?: LayoutType;
}

// Layout dimensions (graphs are centered at origin)
const LAYOUT_WIDTH = 600;
const LAYOUT_HEIGHT = 400;
const HALF_WIDTH = LAYOUT_WIDTH / 2;
const HALF_HEIGHT = LAYOUT_HEIGHT / 2;

/**
 * Create an edge between two nodes
 */
function createEdge(
  fromNode: GraphNode,
  toNode: GraphNode,
  type: EdgeType,
  weight: number = EDGE.DEFAULT_WEIGHT
): GraphEdge {
  const { tempX, tempY } = calculateAccurateCoords(
    fromNode.x,
    fromNode.y,
    toNode.x,
    toNode.y
  );

  return {
    x1: fromNode.x,
    y1: fromNode.y,
    x2: tempX,
    y2: tempY,
    nodeX2: toNode.x,
    nodeY2: toNode.y,
    from: fromNode.id,
    to: toNode.id,
    weight,
    type,
  };
}

/**
 * Add edge to edges map (handles both directions for undirected)
 */
function addEdgeToMap(
  edges: Map<number, GraphEdge[]>,
  fromNode: GraphNode,
  toNode: GraphNode,
  type: EdgeType,
  weight: number = EDGE.DEFAULT_WEIGHT
): void {
  const edge = createEdge(fromNode, toNode, type, weight);
  const fromEdges = edges.get(fromNode.id) || [];
  fromEdges.push(edge);
  edges.set(fromNode.id, fromEdges);

  // For undirected edges, add reverse edge
  if (type === EDGE_TYPE.UNDIRECTED) {
    const reverseEdge = createEdge(toNode, fromNode, type, weight);
    const toEdges = edges.get(toNode.id) || [];
    toEdges.push(reverseEdge);
    edges.set(toNode.id, toEdges);
  }
}

/**
 * Generate random weight within range
 */
function randomWeight(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Layout nodes in a circle
 */
function circularLayout(count: number, centerX: number, centerY: number, radius: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return positions;
}

/**
 * Layout nodes randomly scattered (centered at origin)
 */
function randomLayout(count: number, halfWidth: number, halfHeight: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const minDistance = 60; // Minimum distance between nodes to avoid overlap

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let x: number, y: number;

    do {
      x = -halfWidth + Math.random() * (2 * halfWidth);
      y = -halfHeight + Math.random() * (2 * halfHeight);
      attempts++;
    } while (
      attempts < 100 &&
      positions.some(pos => Math.hypot(pos.x - x, pos.y - y) < minDistance)
    );

    positions.push({ x, y });
  }
  return positions;
}

/**
 * Layout nodes in a grid pattern (centered at origin)
 */
function gridLayout(count: number, halfWidth: number, halfHeight: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];

  // Calculate optimal grid dimensions
  const aspectRatio = halfWidth / halfHeight;
  let cols = Math.ceil(Math.sqrt(count * aspectRatio));
  const rows = Math.ceil(count / cols);

  // Adjust if we have too many cells
  while (cols * rows < count) {
    cols++;
  }

  const totalWidth = 2 * halfWidth;
  const totalHeight = 2 * halfHeight;
  const cellWidth = totalWidth / (cols - 1 || 1);
  const cellHeight = totalHeight / (rows - 1 || 1);

  let nodeIdx = 0;
  for (let row = 0; row < rows && nodeIdx < count; row++) {
    for (let col = 0; col < cols && nodeIdx < count; col++) {
      positions.push({
        x: -halfWidth + col * cellWidth,
        y: -halfHeight + row * cellHeight,
      });
      nodeIdx++;
    }
  }

  return positions;
}

/**
 * Generate a random graph (centered at origin)
 */
export function generateRandomGraph(options: RandomGeneratorOptions): GeneratedGraph {
  const { nodeCount, edgeDensity, directed, weighted, minWeight = 1, maxWeight = 10, layout = "circular" } = options;

  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  // Get positions based on layout type (all centered at origin)
  const radius = Math.min(HALF_WIDTH, HALF_HEIGHT);

  let positions: { x: number; y: number }[];
  switch (layout) {
    case "random":
      positions = randomLayout(nodeCount, HALF_WIDTH, HALF_HEIGHT);
      break;
    case "grid":
      positions = gridLayout(nodeCount, HALF_WIDTH, HALF_HEIGHT);
      break;
    case "circular":
    default:
      positions = circularLayout(nodeCount, 0, 0, radius);
      break;
  }

  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i + 1,
      x: positions[i].x,
      y: positions[i].y,
      r: NODE.RADIUS,
    });
    edges.set(i + 1, []);
  }

  // Calculate max possible edges
  const maxEdges = directed
    ? nodeCount * (nodeCount - 1)
    : (nodeCount * (nodeCount - 1)) / 2;
  const targetEdges = Math.floor(maxEdges * edgeDensity);

  // Generate random edges
  const edgeType = directed ? EDGE_TYPE.DIRECTED : EDGE_TYPE.UNDIRECTED;
  const addedEdges = new Set<string>();
  let edgeCount = 0;

  while (edgeCount < targetEdges) {
    const fromIdx = Math.floor(Math.random() * nodeCount);
    const toIdx = Math.floor(Math.random() * nodeCount);

    if (fromIdx === toIdx) continue;

    const edgeKey = directed
      ? `${fromIdx}-${toIdx}`
      : `${Math.min(fromIdx, toIdx)}-${Math.max(fromIdx, toIdx)}`;

    if (addedEdges.has(edgeKey)) continue;

    addedEdges.add(edgeKey);
    const weight = weighted ? randomWeight(minWeight, maxWeight) : EDGE.DEFAULT_WEIGHT;
    addEdgeToMap(edges, nodes[fromIdx], nodes[toIdx], edgeType, weight);
    edgeCount++;
  }

  return { nodes, edges, nodeCounter: nodeCount };
}

/**
 * Generate a path graph (linear chain, centered at origin)
 */
export function generatePath(nodeCount: number): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const totalWidth = LAYOUT_WIDTH;
  const spacing = totalWidth / (nodeCount - 1 || 1);

  // Create nodes (centered at origin)
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i + 1,
      x: -HALF_WIDTH + i * spacing,
      y: 0,
      r: NODE.RADIUS,
    });
    edges.set(i + 1, []);
  }

  // Create edges
  for (let i = 0; i < nodeCount - 1; i++) {
    addEdgeToMap(edges, nodes[i], nodes[i + 1], EDGE_TYPE.UNDIRECTED);
  }

  return { nodes, edges, nodeCounter: nodeCount };
}

/**
 * Generate a cycle graph (centered at origin)
 */
export function generateCycle(nodeCount: number): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const radius = Math.min(HALF_WIDTH, HALF_HEIGHT);
  const positions = circularLayout(nodeCount, 0, 0, radius);

  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i + 1,
      x: positions[i].x,
      y: positions[i].y,
      r: NODE.RADIUS,
    });
    edges.set(i + 1, []);
  }

  // Create edges (including closing edge)
  for (let i = 0; i < nodeCount; i++) {
    const nextIdx = (i + 1) % nodeCount;
    addEdgeToMap(edges, nodes[i], nodes[nextIdx], EDGE_TYPE.UNDIRECTED);
  }

  return { nodes, edges, nodeCounter: nodeCount };
}

/**
 * Generate a complete graph (K_n, centered at origin)
 */
export function generateComplete(nodeCount: number): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const radius = Math.min(HALF_WIDTH, HALF_HEIGHT);
  const positions = circularLayout(nodeCount, 0, 0, radius);

  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i + 1,
      x: positions[i].x,
      y: positions[i].y,
      r: NODE.RADIUS,
    });
    edges.set(i + 1, []);
  }

  // Create all possible edges
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      addEdgeToMap(edges, nodes[i], nodes[j], EDGE_TYPE.UNDIRECTED);
    }
  }

  return { nodes, edges, nodeCounter: nodeCount };
}

/**
 * Generate a star graph (centered at origin)
 */
export function generateStar(nodeCount: number): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  // Center node at origin
  nodes.push({
    id: 1,
    x: 0,
    y: 0,
    r: NODE.RADIUS,
  });
  edges.set(1, []);

  // Outer nodes
  const radius = Math.min(HALF_WIDTH, HALF_HEIGHT);
  const outerCount = nodeCount - 1;
  const positions = circularLayout(outerCount, 0, 0, radius);

  for (let i = 0; i < outerCount; i++) {
    nodes.push({
      id: i + 2,
      x: positions[i].x,
      y: positions[i].y,
      r: NODE.RADIUS,
    });
    edges.set(i + 2, []);

    // Connect to center
    addEdgeToMap(edges, nodes[0], nodes[i + 1], EDGE_TYPE.UNDIRECTED);
  }

  return { nodes, edges, nodeCounter: nodeCount };
}

/**
 * Generate a binary tree (centered at origin)
 */
export function generateBinaryTree(depth: number): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const nodeCount = Math.pow(2, depth) - 1;
  const levelHeight = LAYOUT_HEIGHT / (depth - 1 || 1);

  let nodeId = 1;

  // Create nodes level by level (centered at origin)
  for (let level = 0; level < depth; level++) {
    const nodesInLevel = Math.pow(2, level);
    const spacing = LAYOUT_WIDTH / (nodesInLevel + 1);

    for (let i = 0; i < nodesInLevel; i++) {
      if (nodeId > nodeCount) break;

      nodes.push({
        id: nodeId,
        x: -HALF_WIDTH + spacing * (i + 1),
        y: -HALF_HEIGHT + level * levelHeight,
        r: NODE.RADIUS,
      });
      edges.set(nodeId, []);
      nodeId++;
    }
  }

  // Create edges (parent to children)
  for (let i = 0; i < nodes.length; i++) {
    const leftChildIdx = 2 * i + 1;
    const rightChildIdx = 2 * i + 2;

    if (leftChildIdx < nodes.length) {
      addEdgeToMap(edges, nodes[i], nodes[leftChildIdx], EDGE_TYPE.UNDIRECTED);
    }
    if (rightChildIdx < nodes.length) {
      addEdgeToMap(edges, nodes[i], nodes[rightChildIdx], EDGE_TYPE.UNDIRECTED);
    }
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

/**
 * Generate a DAG (Directed Acyclic Graph, centered at origin)
 * Creates a layered structure where edges only go from earlier to later layers
 */
export function generateDAG(layers: number, nodesPerLayer: number): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const layerHeight = LAYOUT_HEIGHT / (layers - 1 || 1);

  // Create nodes layer by layer (centered at origin)
  let nodeId = 1;
  const layerNodes: GraphNode[][] = [];

  for (let layer = 0; layer < layers; layer++) {
    const spacing = LAYOUT_WIDTH / (nodesPerLayer + 1);
    const currentLayerNodes: GraphNode[] = [];

    for (let i = 0; i < nodesPerLayer; i++) {
      const node: GraphNode = {
        id: nodeId,
        x: -HALF_WIDTH + spacing * (i + 1),
        y: -HALF_HEIGHT + layer * layerHeight,
        r: NODE.RADIUS,
      };
      nodes.push(node);
      currentLayerNodes.push(node);
      edges.set(nodeId, []);
      nodeId++;
    }

    layerNodes.push(currentLayerNodes);
  }

  // Create edges between consecutive layers
  // Each node connects to 1-2 random nodes in the next layer
  for (let layer = 0; layer < layers - 1; layer++) {
    const currentLayer = layerNodes[layer];
    const nextLayer = layerNodes[layer + 1];

    for (const node of currentLayer) {
      // Connect to 1-2 nodes in the next layer
      const connectionCount = Math.min(1 + Math.floor(Math.random() * 2), nextLayer.length);
      const shuffled = [...nextLayer].sort(() => Math.random() - 0.5);

      for (let i = 0; i < connectionCount; i++) {
        addEdgeToMap(edges, node, shuffled[i], EDGE_TYPE.DIRECTED);
      }
    }

    // Ensure every node in the next layer has at least one incoming edge
    for (const nextNode of nextLayer) {
      const hasIncoming = currentLayer.some((fromNode) => {
        const fromEdges = edges.get(fromNode.id) || [];
        return fromEdges.some((e) => e.to === nextNode.id);
      });

      if (!hasIncoming) {
        // Connect from a random node in the current layer
        const randomFrom = currentLayer[Math.floor(Math.random() * currentLayer.length)];
        addEdgeToMap(edges, randomFrom, nextNode, EDGE_TYPE.DIRECTED);
      }
    }
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

/**
 * Generate a grid graph (centered at origin)
 */
export function generateGrid(rows: number, cols: number): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const cellWidth = LAYOUT_WIDTH / (cols - 1 || 1);
  const cellHeight = LAYOUT_HEIGHT / (rows - 1 || 1);

  // Create nodes (centered at origin)
  let nodeId = 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      nodes.push({
        id: nodeId,
        x: -HALF_WIDTH + col * cellWidth,
        y: -HALF_HEIGHT + row * cellHeight,
        r: NODE.RADIUS,
      });
      edges.set(nodeId, []);
      nodeId++;
    }
  }

  // Create edges (horizontal and vertical)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;

      // Right neighbor
      if (col < cols - 1) {
        addEdgeToMap(edges, nodes[idx], nodes[idx + 1], EDGE_TYPE.UNDIRECTED);
      }

      // Bottom neighbor
      if (row < rows - 1) {
        addEdgeToMap(edges, nodes[idx], nodes[idx + cols], EDGE_TYPE.UNDIRECTED);
      }
    }
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

/**
 * Generate a weighted graph for pathfinding demonstrations (e.g., Dijkstra's algorithm)
 * Creates a network-style layout with varied edge weights (centered at origin)
 */
export function generateWeighted(): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  // Hand-crafted network-style positions (scattered, not geometric)
  // Centered at origin - positions range from roughly -300 to 300
  const positions: { x: number; y: number }[] = [
    { x: -280, y: -190 },   // 1: top-left start area
    { x: -120, y: -210 },   // 2: top-center
    { x: 50, y: -170 },     // 3: top-right
    { x: 250, y: -200 },    // 4: far top-right
    { x: -300, y: -10 },    // 5: left side
    { x: -100, y: -40 },    // 6: center
    { x: 80, y: 10 },       // 7: center-right
    { x: 280, y: -30 },     // 8: right side
    { x: -250, y: 160 },    // 9: bottom-left
    { x: -50, y: 130 },     // 10: bottom-center
    { x: 120, y: 190 },     // 11: bottom-right
    { x: 300, y: 150 },     // 12: far bottom-right (destination)
  ];

  // Create nodes
  for (let i = 0; i < positions.length; i++) {
    const id = i + 1;
    nodes.push({
      id,
      x: positions[i].x,
      y: positions[i].y,
      r: NODE.RADIUS,
    });
    edges.set(id, []);
  }

  // Define edges with carefully chosen weights
  // Structure: [fromIdx, toIdx, weight]
  // Designed so greedy path (low local weights) != shortest path (low total weight)
  const edgeDefinitions: [number, number, number][] = [
    // From node 1 (start area)
    [0, 1, 4],    // 1->2: short direct
    [0, 4, 2],    // 1->5: low weight (tempting greedy choice)

    // From node 2
    [1, 2, 3],    // 2->3: continue right
    [1, 5, 5],    // 2->6: down to center

    // From node 3
    [2, 3, 8],    // 3->4: expensive rightward
    [2, 6, 4],    // 3->7: down

    // From node 4
    [3, 7, 3],    // 4->8: down-right

    // From node 5 (left path - appears cheap but costly overall)
    [4, 5, 7],    // 5->6: expensive connection
    [4, 8, 15],   // 5->9: very expensive (trap path)

    // From node 6 (center hub)
    [5, 6, 2],    // 6->7: cheap center route
    [5, 9, 6],    // 6->10: down

    // From node 7
    [6, 7, 3],    // 7->8: right
    [6, 10, 4],   // 7->11: down-right

    // From node 8 (right side)
    [7, 11, 5],   // 8->12: to destination

    // From node 9 (bottom left - dead end-ish)
    [8, 9, 12],   // 9->10: expensive

    // From node 10
    [9, 10, 3],   // 10->11: right

    // From node 11
    [10, 11, 2],  // 11->12: final stretch

    // Additional edges for more paths and connectivity
    [0, 5, 6],    // 1->6: diagonal shortcut
    [1, 6, 9],    // 2->7: expensive diagonal
    [2, 5, 3],    // 3->6: back connection
    [4, 9, 8],    // 5->10: down
    [6, 9, 5],    // 7->10: down
    [7, 10, 6],   // 8->11: diagonal
    [3, 11, 12],  // 4->12: long expensive skip
  ];

  // Create edges
  for (const [fromIdx, toIdx, weight] of edgeDefinitions) {
    addEdgeToMap(edges, nodes[fromIdx], nodes[toIdx], EDGE_TYPE.DIRECTED, weight);
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

/**
 * Graph 1: Seven Bridges of Königsberg (Historical Euler Graph Problem)
 * 4 vertices with all odd degrees (5, 3, 3, 3) - Proves impossibility of Euler walk/circuit.
 */
export function generateKonigsberg(): GeneratedGraph {
  const nodes: GraphNode[] = [
    { id: 0, x: -160, y: -90, r: NODE.RADIUS, label: "North" },
    { id: 1, x: 0, y: 0, r: NODE.RADIUS, label: "Island" },
    { id: 2, x: -160, y: 90, r: NODE.RADIUS, label: "South" },
    { id: 3, x: 160, y: 0, r: NODE.RADIUS, label: "East" },
  ];

  const edges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => edges.set(n.id, []));

  // Connections (represented with offset/intermediate layout or direct edges)
  const edgeDefs: [number, number][] = [
    [0, 1], // Bridge 1 North-Island
    [0, 3], // Bridge 3 North-East
    [1, 2], // Bridge 4 Island-South
    [2, 3], // Bridge 6 South-East
    [1, 3], // Bridge 7 Island-East
    [0, 2], // Direct cross-bank
  ];

  for (const [u, v] of edgeDefs) {
    addEdgeToMap(edges, nodes[u], nodes[v], EDGE_TYPE.UNDIRECTED, 1);
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

/**
 * Graph 2: Euler Envelope / House Graph (Semi-Eulerian)
 * Exactly 2 odd-degree vertices: has an Eulerian Path (can draw in one stroke), but no Eulerian Circuit.
 */
export function generateEulerHouse(): GeneratedGraph {
  const nodes: GraphNode[] = [
    { id: 0, x: -100, y: 80, r: NODE.RADIUS, label: "A" },  // bottom-left
    { id: 1, x: 100, y: 80, r: NODE.RADIUS, label: "B" },   // bottom-right
    { id: 2, x: 100, y: -40, r: NODE.RADIUS, label: "C" },  // top-right
    { id: 3, x: -100, y: -40, r: NODE.RADIUS, label: "D" }, // top-left
    { id: 4, x: 0, y: -130, r: NODE.RADIUS, label: "Peak" }, // roof peak
  ];

  const edges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => edges.set(n.id, []));

  // Envelope edges
  const edgeDefs: [number, number][] = [
    [0, 1], // Base
    [1, 2], // Right wall
    [2, 3], // Ceiling
    [3, 0], // Left wall
    [0, 2], // Diagonal 1
    [1, 3], // Diagonal 2
    [3, 4], // Roof left
    [2, 4], // Roof right
  ];

  for (const [u, v] of edgeDefs) {
    addEdgeToMap(edges, nodes[u], nodes[v], EDGE_TYPE.UNDIRECTED, 1);
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

/**
 * Graph 3: Petersen Graph
 * 10 vertices, 15 edges, cubic (3-regular).
 * Famous for having NO Hamiltonian circuit (Hypohamiltonian).
 */
export function generatePetersen(): GeneratedGraph {
  const nodes: GraphNode[] = [];
  const edges = new Map<number, GraphEdge[]>();

  const outerR = 170;
  const innerR = 85;

  // Outer 5 vertices (0 to 4)
  for (let i = 0; i < 5; i++) {
    const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
    nodes.push({
      id: i,
      x: Math.round(outerR * Math.cos(angle)),
      y: Math.round(outerR * Math.sin(angle)),
      r: NODE.RADIUS,
      label: `O${i + 1}`,
    });
    edges.set(i, []);
  }

  // Inner 5 vertices (5 to 9)
  for (let i = 0; i < 5; i++) {
    const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
    nodes.push({
      id: i + 5,
      x: Math.round(innerR * Math.cos(angle)),
      y: Math.round(innerR * Math.sin(angle)),
      r: NODE.RADIUS,
      label: `I${i + 1}`,
    });
    edges.set(i + 5, []);
  }

  // Outer cycle: 0-1-2-3-4-0
  for (let i = 0; i < 5; i++) {
    addEdgeToMap(edges, nodes[i], nodes[(i + 1) % 5], EDGE_TYPE.UNDIRECTED, 1);
  }

  // Spokes: 0-5, 1-6, 2-7, 3-8, 4-9
  for (let i = 0; i < 5; i++) {
    addEdgeToMap(edges, nodes[i], nodes[i + 5], EDGE_TYPE.UNDIRECTED, 1);
  }

  // Inner star: 5-7, 7-9, 9-6, 6-8, 8-5
  const innerEdges: [number, number][] = [
    [5, 7], [7, 9], [9, 6], [6, 8], [8, 5],
  ];
  for (const [u, v] of innerEdges) {
    addEdgeToMap(edges, nodes[u], nodes[v], EDGE_TYPE.UNDIRECTED, 1);
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

/**
 * Graph 4: Self-Complementary Cycle C5
 * 5 vertices cycle whose complement is isomorphic to itself!
 */
export function generateSelfComplementaryC5(): GeneratedGraph {
  return generateCycle(5);
}

/**
 * Graph 5: Complete Bipartite Graph K3,3 (Utility Graph)
 * Kuratowski's non-planar graph with only even-length circuits.
 */
export function generateCompleteBipartiteK33(): GeneratedGraph {
  const nodes: GraphNode[] = [
    // Partition A (Top)
    { id: 0, x: -140, y: -80, r: NODE.RADIUS, label: "A1" },
    { id: 1, x: 0, y: -80, r: NODE.RADIUS, label: "A2" },
    { id: 2, x: 140, y: -80, r: NODE.RADIUS, label: "A3" },
    // Partition B (Bottom)
    { id: 3, x: -140, y: 80, r: NODE.RADIUS, label: "B1" },
    { id: 4, x: 0, y: 80, r: NODE.RADIUS, label: "B2" },
    { id: 5, x: 140, y: 80, r: NODE.RADIUS, label: "B3" },
  ];

  const edges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => edges.set(n.id, []));

  for (let a = 0; a < 3; a++) {
    for (let b = 3; b < 6; b++) {
      addEdgeToMap(edges, nodes[a], nodes[b], EDGE_TYPE.UNDIRECTED, 1);
    }
  }

  return { nodes, edges, nodeCounter: nodes.length };
}

