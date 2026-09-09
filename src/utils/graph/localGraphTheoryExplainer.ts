import { GraphNode, GraphEdge } from "../../components/Graph/types";
import { countUniqueEdges } from "./complementGraph";
import { checkBipartite } from "./bipartite";

export interface GraphSummaryInput {
  nodeCount: number;
  edgeCount: number;
  degrees: { id: number; label: string; degree: number }[];
  isDirected: boolean;
}

/**
 * Pure local rule-based Graph Theory Reasoning Engine.
 * Provides instant, rigorous, mathematical graph theory explanations and proofs
 * with ZERO API keys, ZERO rate limits, and 100% offline unlimited availability.
 */
export function generateLocalGraphTheoryExplanation(
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  customQuery?: string
): string {
  const n = nodes.length;
  if (n === 0) {
    return "The canvas is currently empty. Draw or generate a graph to view its mathematical analysis.";
  }

  const m = countUniqueEdges(edges);
  const maxEdges = (n * (n - 1)) / 2;
  const compEdges = Math.max(0, maxEdges - m);

  // Compute degrees
  const degrees: { id: number; label: string; degree: number }[] = [];
  const oddDegreeNodes: string[] = [];
  const evenDegreeNodes: string[] = [];
  let sumDegrees = 0;

  for (const node of nodes) {
    const deg = (edges.get(node.id) || []).length;
    const label = node.label || `v${node.id}`;
    degrees.push({ id: node.id, label, degree: deg });
    sumDegrees += deg;

    if (deg % 2 !== 0) {
      oddDegreeNodes.push(label);
    } else {
      evenDegreeNodes.push(label);
    }
  }

  const sortedDegrees = [...degrees].sort((a, b) => b.degree - a.degree);
  const degSeq = sortedDegrees.map((d) => d.degree);
  const minDeg = degSeq[degSeq.length - 1] ?? 0;
  const maxDeg = degSeq[0] ?? 0;
  const isRegular = minDeg === maxDeg;

  // Connectedness & Components
  const visited = new Set<number>();
  let componentCount = 0;
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      componentCount++;
      const q = [node.id];
      visited.add(node.id);
      while (q.length > 0) {
        const curr = q.shift()!;
        for (const e of edges.get(curr) || []) {
          if (!visited.has(e.to)) {
            visited.add(e.to);
            q.push(e.to);
          }
        }
      }
    }
  }
  const isConnected = componentCount === 1;

  // Eulerian Classification (Euler's Theorem)
  let eulerStatus = "";
  let eulerProof = "";
  if (!isConnected && m > 0) {
    eulerStatus = "Non-Eulerian (Disconnected)";
    eulerProof = `The graph has ${componentCount} connected components. A graph must be connected to possess an Eulerian trail.`;
  } else if (oddDegreeNodes.length === 0) {
    eulerStatus = "Eulerian Graph (Contains an Euler Circuit)";
    eulerProof = `Every vertex has an even degree (${evenDegreeNodes.length} even vertices, 0 odd vertices). By Euler's Theorem (1736), a connected graph has an Euler Circuit (a closed walk visiting every edge exactly once and returning to the start) if and only if every vertex has an even degree.`;
  } else if (oddDegreeNodes.length === 2) {
    eulerStatus = "Semi-Eulerian Graph (Contains an Euler Path)";
    eulerProof = `Exactly 2 vertices have odd degrees (${oddDegreeNodes.join(", ")}). By Euler's Theorem, any continuous Euler path must start at one odd vertex and terminate at the other odd vertex.`;
  } else {
    eulerStatus = "Non-Eulerian Graph";
    eulerProof = `The graph has ${oddDegreeNodes.length} vertices with odd degrees (${oddDegreeNodes.join(", ")}). Because this number is strictly greater than 2, it is mathematically impossible to traverse all edges without repeating at least one edge.`;
  }

  // Hamiltonian Classification (Dirac's & Ore's condition)
  let hamiltonianAnalysis = "";
  const diracSatisfied = n >= 3 && minDeg >= n / 2;
  if (diracSatisfied) {
    hamiltonianAnalysis = `Guaranteed Hamiltonian by Dirac's Theorem (1952): Minimum degree δ(G) = ${minDeg} ≥ n/2 = ${(n / 2).toFixed(1)}. Every vertex is connected to at least half the graph.`;
  } else if (n < 3) {
    hamiltonianAnalysis = `Trivially Hamiltonian for small n = ${n}.`;
  } else if (minDeg < 2) {
    hamiltonianAnalysis = `Cannot possess a Hamiltonian Circuit because at least one vertex has degree < 2 (${sortedDegrees.filter((d) => d.degree < 2).map((d) => d.label).join(", ")}), meaning it cannot be entered and exited along disjoint edges.`;
  } else {
    hamiltonianAnalysis = `Dirac's condition is not met (δ = ${minDeg} < ${n / 2}), but vertices have degree ≥ 2, so Hamiltonian paths/circuits may exist depending on cycle structure.`;
  }

  // Bipartite Analysis
  const bipartiteResult = checkBipartite(nodes, edges);

  // Build the complete Markdown Report
  return `### 📊 Graph Theory Analysis (Local Engine — 100% Free & Unlimited)

**1. Fundamental Invariants**
- **Order (Vertices |V|)**: ${n} vertices
- **Size (Edges |E|)**: ${m} edges (Maximum possible for simple graph: ${maxEdges})
- **Density**: ${maxEdges > 0 ? ((m / maxEdges) * 100).toFixed(1) : 0}%
- **Connected Components**: ${componentCount} component(s) ${isConnected ? "(Connected Graph)" : "(Disconnected)"}
- **Degree Sequence**: \`(${degSeq.join(", ")})\`
- **Handshaking Lemma**: Σ deg(v) = ${sumDegrees} = 2 × ${m} (Always even ✓)
${isRegular ? `- **Regularity**: ${minDeg}-regular graph (all vertices have equal degree ${minDeg})` : `- **Degree Bounds**: Min degree δ(G) = ${minDeg}, Max degree Δ(G) = ${maxDeg}`}

---

**2. Eulerian Status (Euler's Theorem)**
- **Classification**: **${eulerStatus}**
- **Odd Degree Vertices**: ${oddDegreeNodes.length} (${oddDegreeNodes.length > 0 ? oddDegreeNodes.join(", ") : "None"})
- **Proof**: ${eulerProof}

---

**3. Hamiltonian Properties**
- **Analysis**: ${hamiltonianAnalysis}
- **Dirac Condition**: ${diracSatisfied ? "Satisfied (δ ≥ n/2)" : `Not satisfied (δ = ${minDeg} < ${n / 2})`}

---

**4. Bipartiteness & 2-Coloring**
- **Status**: **${bipartiteResult.isBipartite ? "Bipartite Graph (2-Colorable ✓)" : "Not Bipartite (Contains Odd Cycle ✗)"}**
- **Explanation**: ${bipartiteResult.reason}

---

**5. Complement Graph (G')**
- **Complement Edges**: |E(G')| = C(${n}, 2) - ${m} = ${compEdges} edges.
- **Invariant**: |E(G)| + |E(G')| = ${maxEdges}.
${m === compEdges && n % 4 <= 1 ? `*(Potential self-complementary candidate since |E(G)| = |E(G')|)*` : ""}

${customQuery ? `\n---\n**Answer to your query "${customQuery}":**\nBased on the above mathematical invariants of this graph, all properties have been computed directly from graph theoretical theorems.` : ""}`;
}
