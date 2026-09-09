import { create } from "zustand";
import { GraphEdge, GraphNode } from "../components/Graph/types";
import { useGraphStore } from "./graphStore";
import {
  computeSideBySideComplement,
  analyzeComplementGraph,
  type ComplementAnalysis,
  type SideBySideGraphResult,
} from "../utils/graph/complementGraph";

export type ComplementViewMode = "side-by-side" | "both" | "original" | "complement";

interface ComplementState {
  isActive: boolean;
  viewMode: ComplementViewMode;
  originalNodes: GraphNode[];
  originalEdges: Map<number, GraphEdge[]>;
  complementEdges: Map<number, GraphEdge[]>;
  nodeCounter: number;
  sideBySideResult: SideBySideGraphResult | null;
  analysis: ComplementAnalysis | null;
}

interface ComplementActions {
  startComparison: (
    nodes: GraphNode[],
    originalEdges: Map<number, GraphEdge[]>,
    complementEdges: Map<number, GraphEdge[]>,
    nodeCounter: number
  ) => void;
  setViewMode: (mode: ComplementViewMode) => void;
  applyComplement: () => void;
  applySideBySide: () => void;
  revertOriginal: () => void;
}

type ComplementStore = ComplementState & ComplementActions;

function deepCloneEdges(edges: Map<number, GraphEdge[]>): Map<number, GraphEdge[]> {
  const cloned = new Map<number, GraphEdge[]>();
  edges.forEach((list, id) => {
    cloned.set(
      id,
      list.map((e) => ({ ...e }))
    );
  });
  return cloned;
}

function buildComparisonEdges(
  originalEdges: Map<number, GraphEdge[]>,
  complementEdges: Map<number, GraphEdge[]>
): Map<number, GraphEdge[]> {
  const combined = new Map<number, GraphEdge[]>();

  originalEdges.forEach((list, id) => {
    if (!combined.has(id)) combined.set(id, []);
    for (const e of list) {
      combined.get(id)?.push({ ...e, category: "original" });
    }
  });

  complementEdges.forEach((list, id) => {
    if (!combined.has(id)) combined.set(id, []);
    for (const e of list) {
      combined.get(id)?.push({ ...e, category: "complement" });
    }
  });

  return combined;
}

export const useComplementStore = create<ComplementStore>((set, get) => ({
  isActive: false,
  viewMode: "side-by-side",
  originalNodes: [],
  originalEdges: new Map(),
  complementEdges: new Map(),
  nodeCounter: 0,
  sideBySideResult: null,
  analysis: null,

  startComparison: (nodes, originalEdges, complementEdges, nodeCounter) => {
    const origClone = deepCloneEdges(originalEdges);
    const compClone = deepCloneEdges(complementEdges);

    // Compute side-by-side adjacent layout and auto analysis
    const sideBySideResult = computeSideBySideComplement(nodes, origClone, nodeCounter);
    const analysis = analyzeComplementGraph(nodes, origClone);

    set({
      isActive: true,
      viewMode: "side-by-side",
      originalNodes: [...nodes],
      originalEdges: origClone,
      complementEdges: compClone,
      nodeCounter,
      sideBySideResult,
      analysis,
    });

    // Default to Side-by-Side adjacent view (places G on left and G' on right)
    useGraphStore
      .getState()
      .setGraph(sideBySideResult.nodes, sideBySideResult.edges, sideBySideResult.nodeCounter);
  },

  setViewMode: (mode) => {
    const { originalNodes, originalEdges, complementEdges, nodeCounter, sideBySideResult } = get();
    set({ viewMode: mode });

    if (mode === "side-by-side") {
      if (sideBySideResult) {
        useGraphStore
          .getState()
          .setGraph(sideBySideResult.nodes, sideBySideResult.edges, sideBySideResult.nodeCounter);
      }
    } else if (mode === "both") {
      const combined = buildComparisonEdges(originalEdges, complementEdges);
      useGraphStore.getState().setGraph(originalNodes, combined, nodeCounter);
    } else if (mode === "original") {
      const orig = deepCloneEdges(originalEdges);
      useGraphStore.getState().setGraph(originalNodes, orig, nodeCounter);
    } else if (mode === "complement") {
      const comp = deepCloneEdges(complementEdges);
      useGraphStore.getState().setGraph(originalNodes, comp, nodeCounter);
    }
  },

  applyComplement: () => {
    const { originalNodes, complementEdges, nodeCounter } = get();
    const comp = deepCloneEdges(complementEdges);
    useGraphStore.getState().setGraph(originalNodes, comp, nodeCounter);
    set({ isActive: false });
  },

  applySideBySide: () => {
    const { sideBySideResult } = get();
    if (sideBySideResult) {
      useGraphStore
        .getState()
        .setGraph(sideBySideResult.nodes, sideBySideResult.edges, sideBySideResult.nodeCounter);
    }
    set({ isActive: false });
  },

  revertOriginal: () => {
    const { originalNodes, originalEdges, nodeCounter } = get();
    const orig = deepCloneEdges(originalEdges);
    useGraphStore.getState().setGraph(originalNodes, orig, nodeCounter);
    set({ isActive: false });
  },
}));
