/**
 * Algorithm Module Entry Point
 */

import { algorithmRegistry } from "./registry";

// Import algorithm adapters
import bfsAdapter from "./adapters/bfs";
import dfsAdapter from "./adapters/dfs";
import bfsPathfindingAdapter from "./adapters/bfs-pathfinding";
import dfsPathfindingAdapter from "./adapters/dfs-pathfinding";
import dijkstraAdapter from "./adapters/dijkstra";
import cycleDetectionAdapter from "./adapters/cycleDetection";
import eulerianAdapter from "./adapters/eulerian";
import hamiltonianAdapter from "./adapters/hamiltonian";
import connectedComponentsAdapter from "./adapters/connectedComponents";

// Register algorithms
algorithmRegistry.register(bfsAdapter);
algorithmRegistry.register(dfsAdapter);
algorithmRegistry.register(bfsPathfindingAdapter);
algorithmRegistry.register(dfsPathfindingAdapter);
algorithmRegistry.register(dijkstraAdapter);
algorithmRegistry.register(cycleDetectionAdapter);
algorithmRegistry.register(eulerianAdapter);
algorithmRegistry.register(hamiltonianAdapter);
algorithmRegistry.register(connectedComponentsAdapter);

// Export registry and types for use in components
export { algorithmRegistry } from "./registry";
export * from "./types";