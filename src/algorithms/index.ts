/**
 * Algorithm Module Entry Point
 */

import { algorithmRegistry } from "./registry";

// Import algorithm adapters
import dijkstraAdapter from "./adapters/dijkstra";
import bellmanFordAdapter from "./adapters/bellmanFord";

// Register algorithms
algorithmRegistry.register(dijkstraAdapter);
algorithmRegistry.register(bellmanFordAdapter);

// Export registry and types for use in components
export { algorithmRegistry } from "./registry";
export * from "./types";