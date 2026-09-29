import { useEffect } from "react";
import { useGraphStore } from "../store/graphStore";
import { algorithmRegistry } from "../algorithms";
import { VisualizationMode } from "../constants/visualization";
import {
  generateWeighted,
  type GeneratedGraph,
} from "../utils/graph/graphGenerator";

const graphForAlgorithm: Record<string, () => GeneratedGraph> = {
  "dijkstra": generateWeighted,
  "bellman-ford": generateWeighted,
};

/**
 * Reads `?algorithm=` from the URL on mount, selects the algorithm,
 * generates an appropriate graph, and cleans the URL.
 */
export function useAlgorithmFromUrl() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const algorithmParam = params.get("algorithm");
    if (!algorithmParam) return;

    const algo = algorithmRegistry.get(algorithmParam);
    if (!algo) return;

    const { setVisualizationAlgorithm, setVisualizationMode, setGraph } = useGraphStore.getState();

    setVisualizationAlgorithm({
      key: algorithmParam,
      text: algo.metadata.name,
    });

    setVisualizationMode(VisualizationMode.MANUAL);

    const generator = graphForAlgorithm[algorithmParam];
    if (generator) {
      const { nodes, edges, nodeCounter } = generator();
      setGraph(nodes, edges, nodeCounter);
    }

    window.history.replaceState({}, "", "/");
  }, []);
}
