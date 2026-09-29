/**
 * Algorithm Module Entry Point
 */

import { algorithmRegistry } from "./registry";

// Import algorithm adapters
import dijkstraAdapter from "./adapters/dijkstra";

// Register algorithms
algorithmRegistry.register(dijkstraAdapter);

// Export registry and types for use in components
export { algorithmRegistry } from "./registry";
export * from "./types";