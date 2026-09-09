import { createHistoryStore, withAutoHistory, withBatchedAutoHistory } from "./historyStore";
import { GraphSnapshot, GraphNode, GraphEdge, CanvasTextBox } from "../components/Graph/types";
import { GraphData } from "./graphStore";
import { STORE_NAME } from "../constants/store";

// ============================================================================
// Graph History Store
// ============================================================================

const areSnapshotsEqual = (a: GraphSnapshot, b: GraphSnapshot): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const useGraphHistoryStore = createHistoryStore<GraphSnapshot>({
  name: STORE_NAME.GRAPH_HISTORY,
  areEqual: areSnapshotsEqual,
});

// ============================================================================
// Graph Snapshot Utilities
// ============================================================================

export const createGraphSnapshot = (
  nodes: GraphNode[],
  edges: Map<number, GraphEdge[]>,
  nodeCounter: number,
  stackingOrder: Set<number>,
  textBoxes?: CanvasTextBox[]
): GraphSnapshot => ({
  nodes,
  edges: Array.from(edges.entries()).map(([k, v]) => [k, v || []]),
  nodeCounter,
  stackingOrder: [...stackingOrder],  // Convert Set to array for serialization
  textBoxes: textBoxes ? [...textBoxes] : [],
});

// ============================================================================
// Graph-Specific Auto-History Wrappers
// ============================================================================

type GraphStoreState = { data: GraphData };

/**
 * Graph-specific auto-history wrapper.
 * Captures a graph snapshot before each mutation for undo/redo support.
 */
export function withGraphAutoHistory<TArgs extends unknown[], TReturn>(
  getState: () => GraphStoreState,
  mutation: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  return withAutoHistory(
    useGraphHistoryStore,
    () => {
      const { nodes, edges, nodeCounter, stackingOrder, textBoxes } = getState().data;
      return createGraphSnapshot(nodes, edges, nodeCounter, stackingOrder, textBoxes);
    },
    mutation
  );
}

/**
 * Graph-specific batched auto-history wrapper for high-frequency mutations.
 * Captures a snapshot on first call, then debounces pushing to history.
 */
export function withGraphBatchedAutoHistory<TArgs extends unknown[], TReturn>(
  getState: () => GraphStoreState,
  mutation: (...args: TArgs) => TReturn,
  debounceMs?: number
): (...args: TArgs) => TReturn {
  return withBatchedAutoHistory(
    useGraphHistoryStore,
    () => {
      const { nodes, edges, nodeCounter, stackingOrder, textBoxes } = getState().data;
      return createGraphSnapshot(nodes, edges, nodeCounter, stackingOrder, textBoxes);
    },
    mutation,
    debounceMs
  );
}
