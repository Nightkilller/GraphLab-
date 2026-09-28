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
import eulerianAdapter from "./adapters/eulerian";
import hamiltonianAdapter from "./adapters/hamiltonian";

// Register algorithms
algorithmRegistry.register(bfsAdapter);
algorithmRegistry.register(dfsAdapter);
algorithmRegistry.register(bfsPathfindingAdapter);
algorithmRegistry.register(dfsPathfindingAdapter);
algorithmRegistry.register(dijkstraAdapter);
algorithmRegistry.register(eulerianAdapter);
algorithmRegistry.register(hamiltonianAdapter);

// Export registry and types for use in components
export { algorithmRegistry } from "./registry";
export * from "./types";