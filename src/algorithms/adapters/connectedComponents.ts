/**
 * Connected Components Algorithm Adapter
 *
 * Discovers and visualizes all connected components in a graph.
 * For undirected graphs: finds connected components.
 * Explores each component completely before moving to the next.
 */

import { ConnectedComponentsIcon } from "../icons";
import { nid } from "../traceHelpers";
import {
  AlgorithmAdapter,
  AlgorithmInput,
  AlgorithmResult,
  AlgorithmType,
  AlgorithmGenerator,
  StepType,
} from "../types";
import { Queue } from "../utils/dataStructures";

/**
 * Generator function for step-through Connected Components exploration.
 */
function* connectedComponentsGenerator(input: AlgorithmInput): AlgorithmGenerator {
  const { adjacencyList, nodes, startNodeId } = input;

  if (nodes.length === 0) return;

  const visited = new Set<number>();
  let componentCount = 0;

  // Prioritize startNodeId for the first component
  const orderedNodes = [
    ...nodes.filter((n) => n.id === startNodeId),
    ...nodes.filter((n) => n.id !== startNodeId),
  ];

  for (const startNode of orderedNodes) {
    if (visited.has(startNode.id)) continue;

    componentCount++;
    const componentNodes: number[] = [];
    const queue = new Queue<{ from: number; to: number }>();

    queue.push({ from: -1, to: startNode.id });
    visited.add(startNode.id);

    yield {
      type: StepType.VISIT,
      edge: { from: -1, to: startNode.id },
      trace: {
        message: `**Discovered Component #${componentCount}** starting at **node ${nid(
          startNode.id
        )}**`,
        dataStructure: {
          type: "queue",
          items: [{ id: startNode.id }],
          processing: { id: startNode.id },
        },
      },
    };

    while (!queue.isEmpty()) {
      const current = queue.shift()!;
      const u = current.to;
      componentNodes.push(u);

      const neighbors = adjacencyList.get(u) || [];
      const addedToQueue: number[] = [];

      for (const edge of neighbors) {
        const v = edge.to;
        if (!visited.has(v)) {
          visited.add(v);
          queue.push({ from: u, to: v });
          addedToQueue.push(v);
        }
      }

      if (current.from !== -1) {
        yield {
          type: StepType.VISIT,
          edge: { from: current.from, to: u },
          trace: {
            message: `**Component #${componentCount}**: Added **node ${nid(u)}** (total: ${
              componentNodes.length
            } nodes)`,
            dataStructure: {
              type: "queue",
              items: queue.getContents().map((item) => ({ id: item.to })),
              processing: { id: u },
              justAdded: addedToQueue.length > 0 ? addedToQueue : undefined,
            },
          },
        };
      }
    }
  }

  // Final summary step
  yield {
    type: StepType.RESULT,
    edge: { from: -1, to: startNodeId },
    trace: {
      message: `**Graph Analysis Complete**: Total of **${componentCount} connected component${
        componentCount === 1 ? "" : "s"
      }** found.`,
      dataStructure: {
        type: "queue",
        items: nodes.map((n) => ({ id: n.id })),
        processing: { id: startNodeId },
      },
    },
  };
}

function executeConnectedComponents(input: AlgorithmInput): AlgorithmResult {
  return {
    steps: [...connectedComponentsGenerator(input)],
  };
}

const connectedComponentsAdapter: AlgorithmAdapter = {
  metadata: {
    id: "connected-components",
    name: "Connected Components",
    type: AlgorithmType.TRAVERSAL,
    tagline: "Partition graph into connected subgraphs",
    icon: ConnectedComponentsIcon,
    inputStepHints: ["Select a starting vertex to begin component discovery"],
  },
  generator: connectedComponentsGenerator,
  execute: executeConnectedComponents,
};

export default connectedComponentsAdapter;
