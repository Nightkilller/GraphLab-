import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { EDGE_TYPE } from "../../constants/graph";
import { calculateAccurateCoords } from "../geometry/calc";
import { type GeneratedGraph } from "./graphGenerator";
import { countUniqueEdges } from "./complementGraph";

export interface SubgraphClassification {
  isSubgraph: boolean;
  primaryType: string;
  reason: string;
  details: string[];
  isProper: boolean;
  isSpanning: boolean;
  isInduced: boolean;
  isEdgeInduced: boolean;
  isClique: boolean;
  isIndependent: boolean;
  isAcyclic: boolean;
  isSpanningTree: boolean;
  matchingNodeMap: { subNodeId: number; subLabel: string; parentNodeId: number; parentLabel: string }[];
  missingVertices: string[];
  missingEdges: string[];
  omittedInducedEdgesCount: number;
}

/**
 * Normalizes adjacency map into an undirected edge set of pairs "minId-maxId"
 */
function getEdgeSet(edges: Map<number, GraphEdge[]>): Set<string> {
  const edgeSet = new Set<string>();
  edges.forEach((list, u) => {
    for (const e of list) {
      const min = Math.min(u, e.to);
      const max = Math.max(u, e.to);
      edgeSet.add(`${min}-${max}`);
    }
  });
  return edgeSet;
}

/**
 * Helper to check cycle in undirected graph
 */
function checkAcyclic(nodes: GraphNode[], edges: Map<number, GraphEdge[]>): boolean {
  const visited = new Set<number>();
  const parentMap = new Map<number, number>();

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const queue: number[] = [node.id];
      visited.add(node.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = edges.get(curr) || [];
        for (const edge of neighbors) {
          const next = edge.to;
          if (!visited.has(next)) {
            visited.add(next);
            parentMap.set(next, curr);
            queue.push(next);
          } else if (parentMap.get(curr) !== next) {
            return false; // Found cycle
          }
        }
      }
    }
  }
  return true;
}

/**
 * Checks connectivity of graph
 */
function isConnected(nodes: GraphNode[], edges: Map<number, GraphEdge[]>): boolean {
  if (nodes.length <= 1) return true;
  const visited = new Set<number>();
  const queue = [nodes[0].id];
  visited.add(nodes[0].id);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const edge of edges.get(curr) || []) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return visited.size === nodes.length;
}

/**
 * Analyzes candidate subgraph H against parent graph G.
 */
export function analyzeSubgraph(
  parent: { nodes: GraphNode[]; edges: Map<number, GraphEdge[]> },
  candidate: { nodes: GraphNode[]; edges: Map<number, GraphEdge[]> }
): SubgraphClassification {
  const pNodes = parent.nodes;
  const pEdges = parent.edges;
  const cNodes = candidate.nodes;
  const cEdges = candidate.edges;

  if (cNodes.length === 0) {
    return {
      isSubgraph: true,
      primaryType: "Empty Subgraph",
      reason: "The null / empty graph is vacuously a subgraph of any graph.",
      details: ["Empty vertex set V(H) = ∅."],
      isProper: pNodes.length > 0,
      isSpanning: pNodes.length === 0,
      isInduced: true,
      isEdgeInduced: true,
      isClique: false,
      isIndependent: true,
      isAcyclic: true,
      isSpanningTree: false,
      matchingNodeMap: [],
      missingVertices: [],
      missingEdges: [],
      omittedInducedEdgesCount: 0,
    };
  }

  // Strategy 1: Match by label if present and unique
  let nodeMap = new Map<number, number>(); // cNodeId -> pNodeId
  let matchByLabel = false;

  const pLabelMap = new Map<string, number>();
  let pHasUniqueLabels = true;
  for (const n of pNodes) {
    const lbl = (n.label || String(n.id)).trim().toUpperCase();
    if (pLabelMap.has(lbl)) pHasUniqueLabels = false;
    pLabelMap.set(lbl, n.id);
  }

  const cLabelMap = new Map<string, number>();
  let cHasUniqueLabels = true;
  for (const n of cNodes) {
    const lbl = (n.label || String(n.id)).trim().toUpperCase();
    if (cLabelMap.has(lbl)) cHasUniqueLabels = false;
    cLabelMap.set(lbl, n.id);
  }

  if (pHasUniqueLabels && cHasUniqueLabels) {
    let allFound = true;
    for (const [lbl, cId] of cLabelMap.entries()) {
      if (pLabelMap.has(lbl)) {
        nodeMap.set(cId, pLabelMap.get(lbl)!);
      } else {
        allFound = false;
      }
    }
    if (allFound) {
      matchByLabel = true;
    }
  }

  // Strategy 2: If labels don't directly match or some are missing, test by ID matching
  if (!matchByLabel) {
    const pIds = new Set(pNodes.map((n) => n.id));
    const allCIdsInP = cNodes.every((n) => pIds.has(n.id));
    if (allCIdsInP) {
      nodeMap.clear();
      for (const n of cNodes) {
        nodeMap.set(n.id, n.id);
      }
    } else {
      // Strategy 3: Backtracking Subgraph Isomorphism to find an embedding
      const pIdList = pNodes.map((n) => n.id);
      const cIdList = cNodes.map((n) => n.id);
      const pEdgeSet = getEdgeSet(pEdges);
      const cEdgePairs: [number, number][] = [];
      cEdges.forEach((list, u) => {
        for (const e of list) {
          if (u < e.to) cEdgePairs.push([u, e.to]);
        }
      });

      const usedInP = new Set<number>();
      let foundMapping: Map<number, number> | null = null;

      function backtrack(cIdx: number, currentMap: Map<number, number>) {
        if (foundMapping) return;
        if (cIdx === cIdList.length) {
          foundMapping = new Map(currentMap);
          return;
        }
        const cId = cIdList[cIdx];
        for (const pId of pIdList) {
          if (!usedInP.has(pId)) {
            // Check edge compatibility with previously mapped nodes
            let valid = true;
            for (const [u, v] of cEdgePairs) {
              if (u === cId && currentMap.has(v)) {
                const targetV = currentMap.get(v)!;
                const min = Math.min(pId, targetV);
                const max = Math.max(pId, targetV);
                if (!pEdgeSet.has(`${min}-${max}`)) {
                  valid = false;
                  break;
                }
              } else if (v === cId && currentMap.has(u)) {
                const targetU = currentMap.get(u)!;
                const min = Math.min(targetU, pId);
                const max = Math.max(targetU, pId);
                if (!pEdgeSet.has(`${min}-${max}`)) {
                  valid = false;
                  break;
                }
              }
            }

            if (valid) {
              usedInP.add(pId);
              currentMap.set(cId, pId);
              backtrack(cIdx + 1, currentMap);
              currentMap.delete(cId);
              usedInP.delete(pId);
            }
          }
        }
      }

      backtrack(0, new Map<number, number>());
      if (foundMapping) {
        nodeMap = foundMapping;
      }
    }
  }

  // Check vertex containment
  const missingVertices: string[] = [];
  for (const cNode of cNodes) {
    if (!nodeMap.has(cNode.id)) {
      missingVertices.push(cNode.label || `Node ${cNode.id}`);
    }
  }

  const matchingDisplay = Array.from(nodeMap.entries()).map(([cId, pId]) => {
    const cNode = cNodes.find((n) => n.id === cId);
    const pNode = pNodes.find((n) => n.id === pId);
    return {
      subNodeId: cId,
      subLabel: cNode?.label || `v${cId}`,
      parentNodeId: pId,
      parentLabel: pNode?.label || `v${pId}`,
    };
  });

  if (missingVertices.length > 0) {
    return {
      isSubgraph: false,
      primaryType: "Not a Subgraph",
      reason: `Graph H contains ${missingVertices.length} vertex/vertices not found in graph G (${missingVertices.join(", ")}). By definition, V(H) ⊆ V(G) must hold.`,
      details: [`Missing vertices: ${missingVertices.join(", ")}`],
      isProper: false,
      isSpanning: false,
      isInduced: false,
      isEdgeInduced: false,
      isClique: false,
      isIndependent: false,
      isAcyclic: false,
      isSpanningTree: false,
      matchingNodeMap: matchingDisplay,
      missingVertices,
      missingEdges: [],
      omittedInducedEdgesCount: 0,
    };
  }

  // Check edge containment
  const pEdgeSet = getEdgeSet(pEdges);
  const missingEdges: string[] = [];
  const cEdgeSet = new Set<string>();

  cEdges.forEach((list, u) => {
    const pU = nodeMap.get(u)!;
    for (const e of list) {
      if (u < e.to) {
        const pV = nodeMap.get(e.to)!;
        const minP = Math.min(pU, pV);
        const maxP = Math.max(pU, pV);
        const pKey = `${minP}-${maxP}`;
        cEdgeSet.add(pKey);

        if (!pEdgeSet.has(pKey)) {
          const uLabel = cNodes.find((n) => n.id === u)?.label || `v${u}`;
          const vLabel = cNodes.find((n) => n.id === e.to)?.label || `v${e.to}`;
          missingEdges.push(`${uLabel} — ${vLabel}`);
        }
      }
    }
  });

  if (missingEdges.length > 0) {
    return {
      isSubgraph: false,
      primaryType: "Not a Subgraph",
      reason: `Graph H contains ${missingEdges.length} edge(s) not present in graph G (${missingEdges.join(", ")}). In graph theory, E(H) ⊆ E(G) must hold.`,
      details: [`Missing edges: ${missingEdges.join(", ")}`],
      isProper: false,
      isSpanning: false,
      isInduced: false,
      isEdgeInduced: false,
      isClique: false,
      isIndependent: false,
      isAcyclic: false,
      isSpanningTree: false,
      matchingNodeMap: matchingDisplay,
      missingVertices: [],
      missingEdges,
      omittedInducedEdgesCount: 0,
    };
  }

  // VALID SUBGRAPH H ⊆ G
  const vG = pNodes.length;
  const eG = countUniqueEdges(pEdges);
  const vH = cNodes.length;
  const eH = countUniqueEdges(cEdges);

  const isProper = vH < vG || eH < eG;
  const isSpanning = vH === vG;

  // Calculate induced edges: edges in G whose both endpoints are in V(H)
  const mappedPIds = new Set(Array.from(nodeMap.values()));
  let inducedEdgesInG = 0;
  pEdges.forEach((list, u) => {
    if (mappedPIds.has(u)) {
      for (const e of list) {
        if (u < e.to && mappedPIds.has(e.to)) {
          inducedEdgesInG++;
        }
      }
    }
  });

  const omittedInducedEdgesCount = Math.max(0, inducedEdgesInG - eH);
  const isInduced = omittedInducedEdgesCount === 0;

  // Edge-induced: V(H) contains only the endpoints of E(H)
  // i.e., no vertex in H is isolated unless eH === 0 and vH <= 1
  let isolatedCountInH = 0;
  cNodes.forEach((n) => {
    const deg = (cEdges.get(n.id) || []).length;
    if (deg === 0) isolatedCountInH++;
  });
  const isEdgeInduced = eH > 0 ? isolatedCountInH === 0 : vH <= 1;

  // Clique: complete subgraph K_k
  const isClique = vH >= 1 && eH === (vH * (vH - 1)) / 2;

  // Independent set
  const isIndependent = eH === 0;

  // Acyclic & Spanning Tree
  const isAcyclic = checkAcyclic(cNodes, cEdges);
  const isConnectedH = isConnected(cNodes, cEdges);
  const isSpanningTree = isSpanning && isAcyclic && isConnectedH && eH === vH - 1;

  // Determine Primary Type Label
  let primaryType = "Proper Subgraph";
  if (!isProper) {
    primaryType = "Identical Graph (H = G)";
  } else if (isSpanningTree) {
    primaryType = "Spanning Tree";
  } else if (isSpanning) {
    primaryType = "Spanning Subgraph";
  } else if (isClique && vH >= 3) {
    primaryType = `Clique Subgraph (Complete K_${vH})`;
  } else if (isInduced) {
    primaryType = "Vertex-Induced Subgraph G[S]";
  } else if (isEdgeInduced) {
    primaryType = "Edge-Induced Subgraph";
  } else if (isIndependent) {
    primaryType = "Independent / Stable Subgraph";
  }

  const details: string[] = [];
  details.push(`Vertices: |V(H)| = ${vH} / ${vG} (${isSpanning ? "Spanning" : `${vG - vH} vertices excluded`})`);
  details.push(`Edges: |E(H)| = ${eH} / ${eG} (${eG - eH} edges excluded)`);
  if (isInduced) {
    details.push(`Vertex-Induced: YES. Contains ALL ${inducedEdgesInG} edges of G between the chosen vertices.`);
  } else {
    details.push(`Vertex-Induced: NO. Omits ${omittedInducedEdgesCount} existing edge(s) of G connecting vertices in V(H).`);
  }
  if (isEdgeInduced && eH > 0) {
    details.push("Edge-Induced: YES. Every vertex in H is an endpoint of at least one edge in E(H).");
  }
  if (isClique) {
    details.push(`Complete Clique: Every pair of vertices in H is connected by an edge (K_${vH}).`);
  }
  if (isSpanningTree) {
    details.push("Spanning Tree: Spans all vertices of G, is connected, and contains no cycles (|E| = |V| - 1).");
  } else if (isAcyclic) {
    details.push("Acyclic: H contains no cycles (is a forest or tree).");
  }

  const reason = isSpanningTree
    ? "H is a Spanning Tree of G because it includes every vertex of G, is connected, and contains no cycles."
    : isInduced
    ? `H is a Vertex-Induced Subgraph G[S] because it retains all edges present in G between the selected ${vH} vertices.`
    : isSpanning
    ? `H is a Spanning Subgraph because it contains all ${vG} vertices of G with a reduced edge set (${eH} of ${eG} edges).`
    : `H is a valid ${primaryType} of G with ${vH} vertices and ${eH} edges.`;

  return {
    isSubgraph: true,
    primaryType,
    reason,
    details,
    isProper,
    isSpanning,
    isInduced,
    isEdgeInduced,
    isClique,
    isIndependent,
    isAcyclic,
    isSpanningTree,
    matchingNodeMap: matchingDisplay,
    missingVertices: [],
    missingEdges: [],
    omittedInducedEdgesCount,
  };
}

/**
 * Extracts the vertex-induced subgraph G[S] on the given subset of node IDs.
 */
export function extractInducedSubgraph(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  nodeCounter: number,
  selectedNodeIds: number[]
): GeneratedGraph {
  const selectedSet = new Set(selectedNodeIds);
  const subNodes = nodes.filter((n) => selectedSet.has(n.id));

  const subEdges = new Map<number, GraphEdge[]>();
  subNodes.forEach((n) => subEdges.set(n.id, []));

  edges.forEach((list, u) => {
    if (selectedSet.has(u)) {
      for (const e of list) {
        if (selectedSet.has(e.to)) {
          const fromNode = subNodes.find((n) => n.id === u)!;
          const toNode = subNodes.find((n) => n.id === e.to)!;
          const { tempX: tX, tempY: tY } = calculateAccurateCoords(fromNode.x, fromNode.y, toNode.x, toNode.y);
          subEdges.get(u)!.push({
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
      }
    }
  });

  return {
    nodes: subNodes,
    edges: subEdges,
    nodeCounter,
  };
}

/**
 * Extracts a Spanning Tree subgraph of G using Breadth-First Search.
 */
export function extractSpanningTree(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  nodeCounter: number
): GeneratedGraph {
  if (nodes.length === 0) {
    return { nodes: [], edges: new Map(), nodeCounter };
  }

  const subEdges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => subEdges.set(n.id, []));

  const visited = new Set<number>();
  const queue = [nodes[0].id];
  visited.add(nodes[0].id);

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const fromNode = nodes.find((n) => n.id === currId)!;

    for (const edge of edges.get(currId) || []) {
      const nextId = edge.to;
      if (!visited.has(nextId)) {
        visited.add(nextId);
        const toNode = nodes.find((n) => n.id === nextId)!;
        const { tempX: t1X, tempY: t1Y } = calculateAccurateCoords(fromNode.x, fromNode.y, toNode.x, toNode.y);
        const { tempX: t2X, tempY: t2Y } = calculateAccurateCoords(toNode.x, toNode.y, fromNode.x, fromNode.y);

        subEdges.get(currId)!.push({
          x1: fromNode.x,
          y1: fromNode.y,
          x2: t1X,
          y2: t1Y,
          nodeX2: toNode.x,
          nodeY2: toNode.y,
          from: currId,
          to: nextId,
          type: EDGE_TYPE.UNDIRECTED,
          weight: edge.weight || 1,
        });
        subEdges.get(nextId)!.push({
          x1: toNode.x,
          y1: toNode.y,
          x2: t2X,
          y2: t2Y,
          nodeX2: fromNode.x,
          nodeY2: fromNode.y,
          from: nextId,
          to: currId,
          type: EDGE_TYPE.UNDIRECTED,
          weight: edge.weight || 1,
        });

        queue.push(nextId);
      }
    }
  }

  return {
    nodes: [...nodes],
    edges: subEdges,
    nodeCounter,
  };
}

/**
 * Places parent graph G on left and subgraph H on right side-by-side.
 */
export function placeSideBySideSubgraph(
  parent: { nodes: GraphNode[]; edges: Map<number, GraphEdge[]>; nodeCounter: number },
  subgraph: { nodes: GraphNode[]; edges: Map<number, GraphEdge[]> }
): GeneratedGraph {
  let parentMinX = Infinity, parentMaxX = -Infinity;
  for (const n of parent.nodes) {
    parentMinX = Math.min(parentMinX, n.x);
    parentMaxX = Math.max(parentMaxX, n.x);
  }
  const parentWidth = parentMaxX - parentMinX || 300;
  const offsetX = Math.max(parentWidth + 120, 420);

  const combinedNodes: GraphNode[] = [];
  const combinedEdges = new Map<number, GraphEdge[]>();

  for (const n of parent.nodes) {
    combinedNodes.push({ ...n });
    combinedEdges.set(n.id, []);
  }
  parent.edges.forEach((list, u) => {
    for (const e of list) {
      combinedEdges.get(u)?.push({ ...e });
    }
  });

  let idCounter = parent.nodeCounter + 10;
  const subIdMap = new Map<number, number>();

  for (const n of subgraph.nodes) {
    const newId = idCounter++;
    subIdMap.set(n.id, newId);
    combinedNodes.push({
      ...n,
      id: newId,
      x: n.x + offsetX,
      label: n.label ? `${n.label}_sub` : `H_${n.id}`,
    });
    combinedEdges.set(newId, []);
  }

  subgraph.edges.forEach((list, u) => {
    const newU = subIdMap.get(u);
    if (newU !== undefined) {
      for (const e of list) {
        const newV = subIdMap.get(e.to);
        if (newV !== undefined) {
          const fromNode = combinedNodes.find((n) => n.id === newU)!;
          const toNode = combinedNodes.find((n) => n.id === newV)!;
          const { tempX: tX, tempY: tY } = calculateAccurateCoords(fromNode.x, fromNode.y, toNode.x, toNode.y);
          combinedEdges.get(newU)!.push({
            x1: fromNode.x,
            y1: fromNode.y,
            x2: tX,
            y2: tY,
            nodeX2: toNode.x,
            nodeY2: toNode.y,
            from: newU,
            to: newV,
            type: EDGE_TYPE.UNDIRECTED,
            weight: e.weight || 1,
          });
        }
      }
    }
  });

  return {
    nodes: combinedNodes,
    edges: combinedEdges,
    nodeCounter: idCounter + 1,
  };
}
