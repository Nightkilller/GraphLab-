import React, { useRef, useCallback, useState, useMemo, memo } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { EdgeConnector } from "../EdgeConnector";
import { DRAG_THRESHOLD, STROKE_ANIMATION, NODE_STROKE } from "../../../constants/ui";
import { NODE, EDGE_TYPE } from "../../../constants/graph";
import { useGraphStore } from "../../../store/graphStore";
import { useShallow } from "zustand/shallow";
import { useIsDesktop } from "../../../hooks/useMediaQuery";
import { useAppHaptics } from "../../../hooks/useAppHaptics";
import { resolveNodeVisState } from "../../../utils/visualization/nodeVisState";

export interface NodeProps {
  nodeId: number;
  onNodeMove: (nodeId: number, x: number, y: number) => void;
  onGroupMove: (nodeIds: number[], deltaX: number, deltaY: number) => void;
  onConnectorDragStart: (
    sourceNodeId: number,
    position: string,
    startX: number,
    startY: number
  ) => void;
  isVisualizing: boolean;
  isAlgorithmSelected: boolean;
  onNodeSelect: (nodeId: number | null) => void;
  screenToSvgCoords: (clientX: number, clientY: number) => { x: number; y: number };
  isGestureActive: () => boolean;
  onLabelEdit: (nodeId: number) => void;
}


export const Node = memo(function Node(props: NodeProps) {
  const {
    nodeId,
    onNodeMove,
    onGroupMove,
    onConnectorDragStart,
    isVisualizing,
    isAlgorithmSelected,
    onNodeSelect,
    screenToSvgCoords,
    isGestureActive,
    onLabelEdit,
  } = props;

  // Subscribe to THIS node's data only
  const node = useGraphStore(useShallow((state) =>
    state.data.nodes.find((n) => n.id === nodeId)
  ));

  // Subscribe to THIS node's visualization flags only
  const visFlags = useGraphStore((state) => state.visualization.trace.nodes.get(nodeId));

  const visualizationInput = useGraphStore((state) => state.visualization.input);

  // Derived selector: only re-renders when THIS node's selection state changes
  const isSelected = useGraphStore((state) => state.selection.nodeIds.has(nodeId));

  const bringNodeToFront = useGraphStore((state) => state.bringNodeToFront);

  const [isHovered, setIsHovered] = useState(false);
  const [isBodyHovered, setIsBodyHovered] = useState(false);
  const isDragging = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const haptics = useAppHaptics();

  // Derived degree info: computed only when hovered to keep additions instantaneous and avoid un-cached getSnapshot loops
  const degreeInfo = useMemo(() => {
    if (!isHovered && !isBodyHovered) {
      return { degree: 0, inDegree: 0, outDegree: 0, isDirected: false };
    }
    const edges = useGraphStore.getState().data.edges;
    let undirectedCount = 0;
    let inDeg = 0;
    let outDeg = 0;
    let isDirected = false;

    edges.forEach((list, u) => {
      for (const e of list) {
        if (e.type === EDGE_TYPE.DIRECTED) {
          isDirected = true;
          if (u === nodeId) outDeg++;
          if (e.to === nodeId) inDeg++;
        } else {
          if (u === nodeId || e.to === nodeId) undirectedCount++;
        }
      }
    });

    return {
      degree: isDirected ? inDeg + outDeg : undirectedCount,
      inDegree: inDeg,
      outDegree: outDeg,
      isDirected,
    };
  }, [isHovered, isBodyHovered, nodeId]);

  // Group-level hover (hit area + body) — used for connector visibility
  const handleMouseEnter = useCallback(() => {
    if (!isVisualizing) {
      setIsHovered(true);
    }
  }, [isVisualizing]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsBodyHovered(false);
  }, []);

  // Body-only hover — used for algorithm mode scale effect
  const handleBodyMouseEnter = useCallback(() => {
    if (!isVisualizing) {
      setIsBodyHovered(true);
    }
  }, [isVisualizing]);

  const handleBodyMouseLeave = useCallback(() => {
    setIsBodyHovered(false);
  }, []);

  const handleConnectorDrag = useCallback(
    (position: string, startX: number, startY: number) => {
      onConnectorDragStart(nodeId, position, startX, startY);
    },
    [nodeId, onConnectorDragStart]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGCircleElement>) => {
      // Don't allow interactions during pinch gestures
      if (isGestureActive()) return;
      // Don't allow dragging/deletion when visualizing or algorithm is selected
      if (isVisualizing || isAlgorithmSelected) return;

      event.stopPropagation();
      const target = event.target as SVGCircleElement;
      target.setPointerCapture(event.pointerId);

      const startX = event.clientX;
      const startY = event.clientY;
      isDragging.current = false;

      // Capture initial SVG position for delta calculation
      const startSvgPos = screenToSvgCoords(startX, startY);
      let lastSvgPos = startSvgPos;

      // Get current selection from store at drag start (avoids subscription)
      const currentSelection = useGraphStore.getState().selection.nodeIds;

      // Determine if we're doing a group drag (this node is part of multi-selection)
      const isGroupDrag = isSelected && currentSelection.size > 1;
      const groupNodeIds = isGroupDrag ? Array.from(currentSelection) : [];

      const handlePointerMove = (e: PointerEvent) => {
        // Stop node drag if pinch gesture starts
        if (isGestureActive()) return;

        const deltaScreenX = Math.abs(e.clientX - startX);
        const deltaScreenY = Math.abs(e.clientY - startY);

        // Check if movement exceeds threshold - user is dragging
        if (deltaScreenX > DRAG_THRESHOLD || deltaScreenY > DRAG_THRESHOLD) {
          // Bring node(s) to front on first drag movement
          if (!isDragging.current) {
            if (isGroupDrag) {
              // Bring all selected nodes to front, preserving their relative order
              useGraphStore.getState().bringNodesToFront(groupNodeIds);
            } else {
              bringNodeToFront(nodeId);
              // If dragging an unselected node, select only that node
              if (!isSelected) {
                onNodeSelect(nodeId);
                haptics.light();
              }
            }
            // Set cursor to move while dragging
            target.style.cursor = 'move';
          }
          isDragging.current = true;

          const currentSvgPos = screenToSvgCoords(e.clientX, e.clientY);

          if (isGroupDrag) {
            // Group drag: move all selected nodes by delta
            const deltaX = currentSvgPos.x - lastSvgPos.x;
            const deltaY = currentSvgPos.y - lastSvgPos.y;
            onGroupMove(groupNodeIds, deltaX, deltaY);
            lastSvgPos = currentSvgPos;
          } else {
            // Single node drag: move to absolute position
            onNodeMove(nodeId, currentSvgPos.x, currentSvgPos.y);
          }
        }
      };

      const handlePointerUp = (e: PointerEvent) => {
        target.releasePointerCapture(e.pointerId);
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);

        // Reset cursor
        target.style.cursor = '';

        // If not dragging and not pinching, toggle node selection (single click)
        if (!isDragging.current && !isGestureActive()) {
          if (isSelected) {
            onNodeSelect(null);
          } else {
            onNodeSelect(nodeId);
            haptics.light();
          }
        }
        isDragging.current = false;
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [nodeId, onNodeMove, onGroupMove, onNodeSelect, isVisualizing, isAlgorithmSelected, screenToSvgCoords, isSelected, isGestureActive, bringNodeToFront, haptics]
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isDesktop || isVisualizing || isAlgorithmSelected) return;
      event.preventDefault();
      event.stopPropagation();
      onLabelEdit(nodeId);
    },
    [isDesktop, isVisualizing, isAlgorithmSelected, onLabelEdit, nodeId]
  );

  // Early return if node not found - after all hooks
  if (!node) return null;

  // Hide connectors when visualizing or algorithm is selected (CSS handles hiding during edge drag)
  const connectorsVisible = !isVisualizing && !isAlgorithmSelected && isHovered;

  // Hit area radius: node radius + padding for connectors and touch target
  const hitAreaRadius = node.r + NODE.HIT_AREA_PADDING;

  const visState = resolveNodeVisState(node.id, visFlags, visualizationInput);

  // Solid colors (not gradients) so Framer Motion can animate the fill smoothly
  const getNodeFill = () => `var(--gradient-${visState}-mid)`;

  // Stroke color for non-selected states (selected state handled by Framer Motion animate)
  const getNodeStroke = () =>
    visState === 'default' ? "var(--color-node-stroke)" : `var(--color-tint-${visState})`;

  return (
    <m.g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        type: 'spring',
        stiffness: 600,
        damping: 28,
      }}
      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
    >
      {/* Invisible hit area - styled via DOM during edge drag */}
      <circle
        cx={node.x}
        cy={node.y}
        r={hitAreaRadius}
        id={`hit-${node.id}`}
        className="node-hit-area fill-transparent pointer-events-auto [transition:fill_150ms,stroke_150ms]"
      />
      {/* Main node token - tangible, pickable button */}
      <m.circle
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleBodyMouseEnter}
        onMouseLeave={handleBodyMouseLeave}
        initial={{
          r: node.r
        }}
        animate={{
          fill: getNodeFill(),
          stroke: isSelected ? 'var(--color-accent-form)' : getNodeStroke(),
          // Keyframes for pop effect: default → active → selected
          strokeWidth: isSelected
            ? [NODE_STROKE.DEFAULT, NODE_STROKE.ACTIVE, NODE_STROKE.SELECTED]
            : NODE_STROKE.DEFAULT,
          r: isAlgorithmSelected && isBodyHovered ? node.r * NODE.HOVER_SCALE : node.r,
        }}
        transition={prefersReducedMotion ? { duration: 0 } : {
          fill: { duration: STROKE_ANIMATION.DURATION },
          stroke: { duration: STROKE_ANIMATION.DURATION },
          strokeWidth: isSelected
            ? { duration: STROKE_ANIMATION.POP_DURATION, times: [...STROKE_ANIMATION.POP_TIMES], ease: [...STROKE_ANIMATION.POP_EASE] }
            : { duration: STROKE_ANIMATION.DURATION },
          r: { duration: STROKE_ANIMATION.DURATION },
        }}
        className={cn(
          // Cursor: pointer when algorithm selected, grab otherwise
          isAlgorithmSelected ? "cursor-pointer" : "cursor-default"
        )}
        cx={node.x}
        cy={node.y}
        id={node.id.toString()}
      >
        <title>{`Vertex ${node.label || node.id}: Degree ${degreeInfo.degree}${degreeInfo.isDirected ? ` (${degreeInfo.inDegree} in / ${degreeInfo.outDegree} out)` : ""}`}</title>
      </m.circle>
      {/* Crosshatch pattern overlay — plain circle with CSS transition instead of motion.circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={isAlgorithmSelected && isBodyHovered ? node.r * NODE.HOVER_SCALE : node.r}
        fill="url(#crosshatch)"
        mask="url(#sphereMask)"
        className="pointer-events-none"
        style={{ transition: prefersReducedMotion ? 'none' : `r ${STROKE_ANIMATION.DURATION}s` }}
      />
      {/* Vertex Degree Tooltip Badge on Hover */}
      {(isHovered || isBodyHovered) && !isVisualizing && (
        <g className="pointer-events-none select-none">
          {(() => {
            const isTop = node.y - node.r - 28 >= 8;
            const badgeY = isTop ? node.y - node.r - 28 : node.y + node.r + 14;
            const badgeText = degreeInfo.isDirected
              ? `deg: ${degreeInfo.degree} (${degreeInfo.inDegree} in / ${degreeInfo.outDegree} out)`
              : `deg: ${degreeInfo.degree}`;
            const badgeWidth = degreeInfo.isDirected ? 120 : 54;

            return (
              <g>
                <rect
                  x={node.x - badgeWidth / 2}
                  y={badgeY}
                  width={badgeWidth}
                  height={19}
                  rx={9.5}
                  className="fill-(--color-surface) stroke-(--color-accent)"
                  strokeWidth={1.2}
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                />
                <polygon
                  points={
                    isTop
                      ? `${node.x - 3.5},${badgeY + 19} ${node.x + 3.5},${badgeY + 19} ${node.x},${badgeY + 22.5}`
                      : `${node.x - 3.5},${badgeY} ${node.x + 3.5},${badgeY} ${node.x},${badgeY - 3.5}`
                  }
                  className="fill-(--color-accent)"
                />
                <text
                  x={node.x}
                  y={badgeY + 10.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[10px] font-bold fill-(--color-text) tracking-tight"
                >
                  {badgeText}
                </text>
              </g>
            );
          })()}
        </g>
      )}
      {/* Edge Connectors - only mounted on hover to avoid unnecessary renders during drag */}
      {connectorsVisible && (
        <>
          <EdgeConnector
            nodeX={node.x}
            nodeY={node.y}
            nodeR={node.r}
            position="top"
            onDragStart={handleConnectorDrag}
          />
          <EdgeConnector
            nodeX={node.x}
            nodeY={node.y}
            nodeR={node.r}
            position="right"
            onDragStart={handleConnectorDrag}
          />
          <EdgeConnector
            nodeX={node.x}
            nodeY={node.y}
            nodeR={node.r}
            position="bottom"
            onDragStart={handleConnectorDrag}
          />
          <EdgeConnector
            nodeX={node.x}
            nodeY={node.y}
            nodeR={node.r}
            position="left"
            onDragStart={handleConnectorDrag}
          />
        </>
      )}

      {/* Node label - hidden while editing to avoid overlap with portal input */}
      <text
        className="pointer-events-none select-none font-bold text-sm [text-anchor:middle] [dominant-baseline:central] [-webkit-user-select:none] [-moz-user-select:none] [-ms-user-select:none] lg:text-xs"
        style={{ fill: 'var(--color-text)' }}
        x={node.x}
        y={node.y}
      >
        {node.label || node.id}
      </text>
    </m.g>
  );
});
