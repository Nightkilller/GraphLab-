import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useGraphStore, selectTextBoxes, selectSelectedTextBoxId } from "../../store/graphStore";
import { CanvasTextBox } from "./types";
import { Trash2, Edit3, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface CanvasTextBoxLayerProps {
  screenToSvgCoords: (clientX: number, clientY: number) => { x: number; y: number };
  svgToScreenCoords: (svgX: number, svgY: number) => { x: number; y: number };
  isVisualizing: boolean;
}

const FONT_SIZES = [
  { label: "S", size: 12 },
  { label: "M", size: 15 },
  { label: "L", size: 19 },
  { label: "XL", size: 24 },
];

const COLOR_PALETTE = [
  { name: "Default", color: "default", bg: "card" },
  { name: "Emerald", color: "#10b981", bg: "badge" },
  { name: "Sky", color: "#0ea5e9", bg: "card" },
  { name: "Rose", color: "#f43f5e", bg: "card" },
  { name: "Amber", color: "#f59e0b", bg: "note" },
  { name: "Purple", color: "#a855f7", bg: "card" },
];

export const CanvasTextBoxLayer = ({
  screenToSvgCoords,
  svgToScreenCoords,
  isVisualizing,
}: CanvasTextBoxLayerProps) => {
  const textBoxes = useGraphStore(selectTextBoxes);
  const selectedTextBoxId = useGraphStore(selectSelectedTextBoxId);
  const selectTextBox = useGraphStore((state) => state.selectTextBox);
  const moveTextBox = useGraphStore((state) => state.moveTextBox);
  const updateTextBox = useGraphStore((state) => state.updateTextBox);
  const deleteTextBox = useGraphStore((state) => state.deleteTextBox);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dragging state
  const dragState = useRef<{
    id: string;
    startPointerSvg: { x: number; y: number };
    startBoxPos: { x: number; y: number };
    hasMoved: boolean;
  } | null>(null);

  // Measure card dimensions for each text box
  const getBoxMetrics = useCallback((box: CanvasTextBox) => {
    const fontSize = box.fontSize || 15;
    const lines = (box.text || "Type text...").split("\n");
    const maxLineLen = Math.max(...lines.map((l) => l.length), 6);
    const charWidth = fontSize * 0.58;
    const paddingX = 14;
    const paddingY = 10;
    const lineHeight = fontSize * 1.35;

    const width = Math.max(120, Math.round(maxLineLen * charWidth + paddingX * 2));
    const height = Math.max(38, Math.round(lines.length * lineHeight + paddingY * 2));

    return { width, height, lines, fontSize, lineHeight, paddingX, paddingY };
  }, []);

  // Enter edit mode
  const startEditing = useCallback((box: CanvasTextBox) => {
    if (isVisualizing) return;
    setEditingId(box.id);
    setEditText(box.text);
    selectTextBox(box.id);
  }, [isVisualizing, selectTextBox]);

  // Commit text edit
  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (trimmed.length > 0) {
      updateTextBox(editingId, { text: trimmed });
    }
    setEditingId(null);
  }, [editingId, editText, updateTextBox]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingId]);

  // Handle pointer down for dragging / selection
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGGElement>, box: CanvasTextBox) => {
    if (isVisualizing) return;
    e.stopPropagation();

    // Select text box
    selectTextBox(box.id);

    const svgCoords = screenToSvgCoords(e.clientX, e.clientY);
    dragState.current = {
      id: box.id,
      startPointerSvg: svgCoords,
      startBoxPos: { x: box.x, y: box.y },
      hasMoved: false,
    };

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
  }, [isVisualizing, selectTextBox, screenToSvgCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (!dragState.current) return;
    const { id, startPointerSvg, startBoxPos } = dragState.current;
    const currSvg = screenToSvgCoords(e.clientX, e.clientY);
    const dx = currSvg.x - startPointerSvg.x;
    const dy = currSvg.y - startPointerSvg.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.current.hasMoved = true;
    }

    if (dragState.current.hasMoved) {
      moveTextBox(id, Math.round(startBoxPos.x + dx), Math.round(startBoxPos.y + dy));
    }
  }, [screenToSvgCoords, moveTextBox]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGGElement>, box: CanvasTextBox) => {
    if (!dragState.current) return;
    const hadMoved = dragState.current.hasMoved;
    dragState.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer already released
    }

    // Single click without movement selects
    if (!hadMoved) {
      selectTextBox(box.id);
    }
  }, [selectTextBox]);

  // Keyboard events when text box is selected (Delete / Backspace / Esc / Enter)
  useEffect(() => {
    if (!selectedTextBoxId || editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing inside an input or button, ignore
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        deleteTextBox(selectedTextBoxId);
        selectTextBox(null);
      } else if (e.key === "Escape") {
        selectTextBox(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const box = textBoxes.find((b) => b.id === selectedTextBoxId);
        if (box) startEditing(box);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTextBoxId, editingId, deleteTextBox, selectTextBox, textBoxes, startEditing]);

  const editingBox = useMemo(() => {
    return textBoxes.find((b) => b.id === editingId);
  }, [textBoxes, editingId]);

  const selectedBox = useMemo(() => {
    return textBoxes.find((b) => b.id === selectedTextBoxId);
  }, [textBoxes, selectedTextBoxId]);

  // Calculate screen coordinates for floating editor and toolbar
  const editorScreenPos = useMemo(() => {
    if (!editingBox) return null;
    return svgToScreenCoords(editingBox.x, editingBox.y);
  }, [editingBox, svgToScreenCoords]);

  const selectedScreenPos = useMemo(() => {
    if (!selectedBox) return null;
    const metrics = getBoxMetrics(selectedBox);
    const screen = svgToScreenCoords(selectedBox.x, selectedBox.y);
    return {
      x: screen.x,
      y: screen.y - 42,
      width: metrics.width,
    };
  }, [selectedBox, svgToScreenCoords, getBoxMetrics]);

  return (
    <>
      <g className="canvas-text-boxes">
        {textBoxes.map((box) => {
          const isSelected = box.id === selectedTextBoxId;
          const isCurrentlyEditing = box.id === editingId;
          const { width, height, lines, fontSize, lineHeight, paddingX, paddingY } = getBoxMetrics(box);

          const isCustomColor = box.color && box.color !== "default";
          const textColor = isCustomColor ? box.color : "var(--color-text)";

          let cardBg = "var(--color-surface)";
          let cardBorder = isSelected ? "var(--color-accent)" : "var(--color-divider)";
          if (box.backgroundColor === "badge") {
            cardBg = "rgba(16, 185, 129, 0.08)";
            cardBorder = isSelected ? "var(--color-accent)" : "rgba(16, 185, 129, 0.3)";
          } else if (box.backgroundColor === "note") {
            cardBg = "rgba(245, 158, 11, 0.08)";
            cardBorder = isSelected ? "var(--color-accent)" : "rgba(245, 158, 11, 0.3)";
          }

          return (
            <g
              key={box.id}
              transform={`translate(${box.x}, ${box.y})`}
              className="cursor-move select-none"
              onPointerDown={(e) => handlePointerDown(e, box)}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => handlePointerUp(e, box)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing(box);
              }}
              data-testid={`textbox-${box.id}`}
            >
              {/* Background Card */}
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                rx={10}
                ry={10}
                fill={cardBg}
                stroke={cardBorder}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={isSelected ? "none" : undefined}
                className="transition-colors duration-150"
                style={{
                  filter: isSelected ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.06))",
                }}
              />

              {/* Text content (hidden while active inline editor is open) */}
              {!isCurrentlyEditing && (
                <text
                  x={paddingX}
                  y={paddingY + fontSize * 0.85}
                  fill={textColor}
                  fontSize={fontSize}
                  fontFamily="Inter, -apple-system, sans-serif"
                  fontWeight={500}
                  className="pointer-events-none"
                >
                  {lines.map((line, idx) => (
                    <tspan
                      key={idx}
                      x={paddingX}
                      dy={idx === 0 ? 0 : lineHeight}
                    >
                      {line || " "}
                    </tspan>
                  ))}
                </text>
              )}

              {/* Subtle Double-click hint when selected */}
              {isSelected && !isCurrentlyEditing && (
                <text
                  x={width - 8}
                  y={height - 6}
                  textAnchor="end"
                  fill="var(--color-text-muted)"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  opacity={0.6}
                  className="pointer-events-none"
                >
                  2× click to edit
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Floating Toolbar when a text box is selected (Portaled to body) */}
      {selectedBox && !editingId && selectedScreenPos && createPortal(
        <div
          style={{
            position: "fixed",
            left: selectedScreenPos.x,
            top: selectedScreenPos.y,
            transform: "translateY(-100%)",
            zIndex: 60,
          }}
          className="flex items-center gap-1 p-1 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Edit Button */}
          <button
            onClick={() => startEditing(selectedBox)}
            title="Edit Text"
            className="p-1 rounded-md text-xs font-semibold hover:bg-(--color-paper) text-(--color-text) flex items-center gap-1 transition-colors"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>

          <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

          {/* Font Size Swatches */}
          <div className="flex items-center gap-0.5">
            {FONT_SIZES.map((f) => (
              <button
                key={f.size}
                onClick={() => updateTextBox(selectedBox.id, { fontSize: f.size })}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[11px] font-bold transition-all",
                  (selectedBox.fontSize || 15) === f.size
                    ? "bg-(--color-accent) text-white shadow-xs"
                    : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

          {/* Color Swatches */}
          <div className="flex items-center gap-1">
            {COLOR_PALETTE.map((p) => (
              <button
                key={p.name}
                onClick={() => updateTextBox(selectedBox.id, { color: p.color, backgroundColor: p.bg })}
                title={p.name}
                className={cn(
                  "w-4 h-4 rounded-full border border-(--color-divider) transition-transform hover:scale-110",
                  (selectedBox.color || "default") === p.color && "ring-2 ring-(--color-accent) scale-110"
                )}
                style={{
                  backgroundColor: p.color === "default" ? "var(--color-text)" : p.color,
                }}
              />
            ))}
          </div>

          <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

          {/* Delete Button */}
          <button
            onClick={() => {
              deleteTextBox(selectedBox.id);
              selectTextBox(null);
            }}
            title="Delete Text Box"
            className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>,
        document.body
      )}

      {/* Floating Inline HTML Textarea Editor when actively editing (Portaled to body) */}
      {editingBox && editorScreenPos && createPortal(
        <div
          style={{
            position: "fixed",
            left: editorScreenPos.x,
            top: editorScreenPos.y,
            zIndex: 70,
          }}
          className="flex flex-col animate-in fade-in zoom-in-95 duration-100"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="relative shadow-2xl rounded-xl border-2 border-(--color-accent) bg-(--color-surface) overflow-hidden min-w-[200px]">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  commitEdit();
                } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  commitEdit();
                }
              }}
              rows={Math.max(2, editText.split("\n").length)}
              className="w-full p-2.5 bg-transparent text-(--color-text) focus:outline-none resize font-medium leading-snug"
              style={{
                fontSize: `${editingBox.fontSize || 15}px`,
                color: editingBox.color && editingBox.color !== "default" ? editingBox.color : "var(--color-text)",
              }}
              placeholder="Type notes or equations..."
            />
            <div className="flex items-center justify-between px-2 py-1 bg-(--color-paper) border-t border-(--color-divider) text-[10px] text-(--color-text-muted)">
              <span>Esc or ⌘+Enter to finish</span>
              <div className="flex gap-1">
                <button
                  onClick={commitEdit}
                  className="px-2 py-0.5 rounded bg-(--color-accent) text-white font-semibold hover:opacity-90 flex items-center gap-1"
                >
                  <Check size={11} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
