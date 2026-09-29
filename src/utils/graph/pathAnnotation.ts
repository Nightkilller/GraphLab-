import { useGraphStore } from "../../store/graphStore";
import { AlgorithmStep, StepType } from "../../algorithms/types";
import { GraphNode } from "../../components/Graph/types";

/**
 * Extracts shortest path and minimum length from algorithm steps,
 * and writes a clean, formatted text annotation box directly onto the canvas.
 */
export function writeShortestPathAnnotation(history: AlgorithmStep[]): string | null {
  if (!history || history.length === 0) return null;

  const resultSteps = history.filter((s) => s.type === StepType.RESULT);
  if (resultSteps.length === 0) return null;

  const store = useGraphStore.getState();
  const { data, addTextBox, deleteTextBox } = store;

  // Extract path nodes in order from result edges
  const pathNodeIds = resultSteps.map((s) => s.edge.to);
  if (pathNodeIds.length === 0) return null;

  // Extract minimum length from trace message of the last step
  const lastStep = history[history.length - 1];
  let minLength = "";
  if (lastStep?.trace?.message) {
    const lengthMatch = lastStep.trace.message.match(/Minimum Length(?:\*\*|\:)?\s*:?\s*\*?\*?([^*\n\r]+)/i);
    if (lengthMatch) {
      minLength = lengthMatch[1].replace(/\*+/g, "").trim();
    }
  }

  // Resolve node labels
  const nodeMap = new Map<number, GraphNode>();
  data.nodes.forEach((n) => nodeMap.set(n.id, n));

  const pathLabelString = pathNodeIds
    .map((id) => nodeMap.get(id)?.label || String(id))
    .join(" → ");

  const textContent = [
    `Shortest Path: ${pathLabelString}`,
    minLength ? `Minimum Length: ${minLength}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Check if this exact text box is already on the canvas to avoid duplicates
  const existingBox = data.textBoxes.find(
    (b) => b.text.startsWith("Shortest Path:") || b.text === textContent
  );
  if (existingBox && existingBox.text === textContent) {
    return existingBox.id;
  }
  if (existingBox) {
    deleteTextBox(existingBox.id);
  }

  // Calculate ideal placement position on canvas
  const pathNodes = pathNodeIds
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as GraphNode[];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of pathNodes.length > 0 ? pathNodes : data.nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const targetNode = pathNodes[pathNodes.length - 1];

  let targetX = Math.round((minX + maxX) / 2) - 85;
  let targetY = Math.round(minY) - 75;

  // If too high up near the top bar, position beside or below target node
  if (targetY < -100) {
    if (targetNode) {
      targetX = targetNode.x + 35;
      targetY = targetNode.y - 25;
    } else {
      targetY = Math.round(maxY) + 40;
    }
  }

  const newId = addTextBox({
    x: targetX,
    y: targetY,
    text: textContent,
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: "card",
    borderEnabled: true,
    borderColor: "#10b981",
    color: "var(--color-text)",
  });

  return newId;
}
