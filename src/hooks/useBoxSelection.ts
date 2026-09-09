import { useState, useCallback, useRef } from "react";
import { GraphNode, CanvasTextBox } from "../components/Graph/types";
import { DRAG_THRESHOLD, TIMING } from "../constants/ui";
import { useGraphStore } from "../store/graphStore";

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseBoxSelectionProps {
  screenToSvgCoords: (clientX: number, clientY: number) => { x: number; y: number };
  isGestureActive: () => boolean;
}

function isNodeInBox(node: GraphNode, box: SelectionBox): boolean {
  const boxLeft = Math.min(box.startX, box.currentX);
  const boxRight = Math.max(box.startX, box.currentX);
  const boxTop = Math.min(box.startY, box.currentY);
  const boxBottom = Math.max(box.startY, box.currentY);

  return node.x >= boxLeft && node.x <= boxRight &&
         node.y >= boxTop && node.y <= boxBottom;
}

function isTextBoxInBox(tb: CanvasTextBox, box: SelectionBox): boolean {
  const boxLeft = Math.min(box.startX, box.currentX);
  const boxRight = Math.max(box.startX, box.currentX);
  const boxTop = Math.min(box.startY, box.currentY);
  const boxBottom = Math.max(box.startY, box.currentY);

  const fontSize = tb.fontSize || 15;
  const lines = (tb.text || "").split("\n");
  const maxLineLen = Math.max(...lines.map((l) => l.length), 6);
  const charWidth = fontSize * 0.58;
  const width = tb.width || Math.max(120, Math.round(maxLineLen * charWidth + 28));
  const height = tb.height || Math.max(38, Math.round(lines.length * (fontSize * 1.35) + 20));

  const tbRight = tb.x + width;
  const tbBottom = tb.y + height;

  return !(tb.x > boxRight || tbRight < boxLeft || tb.y > boxBottom || tbBottom < boxTop);
}

function getNodesInBox(nodes: GraphNode[], box: SelectionBox): number[] {
  return nodes
    .filter((node) => isNodeInBox(node, box))
    .map((node) => node.id);
}

function getTextBoxesInBox(textBoxes: CanvasTextBox[], box: SelectionBox): string[] {
  return textBoxes
    .filter((tb) => isTextBoxInBox(tb, box))
    .map((tb) => tb.id);
}

export function useBoxSelection({
  screenToSvgCoords,
  isGestureActive,
}: UseBoxSelectionProps) {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const isBoxSelecting = useRef(false);

  const handleBoxSelectionPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>): boolean => {
      const isSelectToolActive = useGraphStore.getState().selectToolActive;
      // Activate box selection with Shift key held OR when Marquee Select Tool is active
      if (!event.shiftKey && !isSelectToolActive) return false;

      const target = event.target as SVGElement;
      // Only start box selection on empty canvas (svg element)
      if (target.tagName !== "svg") return false;

      // Don't start if gesture (pinch) is active
      if (isGestureActive()) return false;

      // Don't allow box selection when algorithm is selected or visualizing
      const { algorithm } = useGraphStore.getState().visualization;
      const isAlgorithmSelected = algorithm?.key != null && algorithm.key !== 'select';
      if (isAlgorithmSelected) return false;

      const { x, y } = screenToSvgCoords(event.clientX, event.clientY);
      const startX = event.clientX;
      const startY = event.clientY;

      isBoxSelecting.current = false;

      const handlePointerMove = (e: PointerEvent) => {
        if (isGestureActive()) return;

        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);

        // Start box selection after threshold
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
          isBoxSelecting.current = true;
          const { x: currentX, y: currentY } = screenToSvgCoords(e.clientX, e.clientY);
          const box = { startX: x, startY: y, currentX, currentY };
          setSelectionBox(box);

          // Select nodes and text boxes in real-time as box changes
          const { nodes, textBoxes } = useGraphStore.getState().data;
          const { selectItems } = useGraphStore.getState();
          const nodeIdsInBox = getNodesInBox(nodes, box);
          const textBoxIdsInBox = getTextBoxesInBox(textBoxes, box);
          selectItems(nodeIdsInBox, textBoxIdsInBox);
        }
      };

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);

        setSelectionBox(null);
        // Delay resetting flag so click handler can check it
        setTimeout(() => { isBoxSelecting.current = false; }, TIMING.POPUP_DELAY);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);

      return true; // Indicate we're handling this event
    },
    [screenToSvgCoords, isGestureActive]
  );

  return {
    selectionBox,
    handleBoxSelectionPointerDown,
    isBoxSelecting,
  };
}
