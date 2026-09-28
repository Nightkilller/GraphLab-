import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  useGraphStore,
  selectTextBoxes,
  selectSelectedTextBoxId,
  selectSelectedTextBoxIds,
  selectEditingTextBoxId,
} from "../../store/graphStore";
import { CanvasTextBox } from "./types";
import { Trash2, Edit3, Check, Bold, Italic, Square, ChevronDown } from "lucide-react";
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
  { label: "2X", size: 32 },
];

const FONT_FAMILIES = [
  { label: "Sans", value: "Inter, -apple-system, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: "Hand", value: "'Caveat', 'Comic Sans MS', cursive" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
];

const COLOR_PALETTE = [
  { name: "Default", color: "default", bg: "card" },
  { name: "Emerald", color: "#10b981", bg: "badge" },
  { name: "Sky", color: "#0ea5e9", bg: "card" },
  { name: "Rose", color: "#f43f5e", bg: "card" },
  { name: "Amber", color: "#f59e0b", bg: "note" },
  { name: "Purple", color: "#a855f7", bg: "card" },
  { name: "Indigo", color: "#6366f1", bg: "card" },
  { name: "Pink", color: "#ec4899", bg: "card" },
];

const BORDER_COLORS = [
  { name: "Accent", color: "var(--color-accent)" },
  { name: "Gray", color: "#9ca3af" },
  { name: "Red", color: "#ef4444" },
  { name: "Green", color: "#22c55e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Orange", color: "#f97316" },
];

export const CanvasTextBoxLayer = ({
  screenToSvgCoords,
  svgToScreenCoords,
  isVisualizing,
}: CanvasTextBoxLayerProps) => {
  const textBoxes = useGraphStore(selectTextBoxes);
  const selectedTextBoxId = useGraphStore(selectSelectedTextBoxId);
  const selectedTextBoxIds = useGraphStore(selectSelectedTextBoxIds);
  const editingTextBoxId = useGraphStore(selectEditingTextBoxId);
  const setEditingTextBoxId = useGraphStore((state) => state.setEditingTextBoxId);
  const selectTextBox = useGraphStore((state) => state.selectTextBox);
  const moveTextBox = useGraphStore((state) => state.moveTextBox);
  const moveTextBoxes = useGraphStore((state) => state.moveTextBoxes);
  const updateTextBox = useGraphStore((state) => state.updateTextBox);
  const deleteTextBox = useGraphStore((state) => state.deleteTextBox);

  // Local draft text for active textarea
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);

  // Sync draft text when editing begins (only on editingTextBoxId change, NOT on textBoxes change)
  useEffect(() => {
    if (editingTextBoxId) {
      const current = useGraphStore.getState().data.textBoxes.find((b) => b.id === editingTextBoxId);
      setEditText(current ? current.text : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTextBoxId]);

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
    const lines = (box.text || "Type note...").split("\n");
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
    setEditText(box.text);
    setEditingTextBoxId(box.id);
    selectTextBox(box.id);
  }, [isVisualizing, selectTextBox, setEditingTextBoxId]);

  // Commit text edit
  const commitEdit = useCallback(() => {
    if (!editingTextBoxId) return;
    const trimmed = editText.trim();
    if (trimmed.length > 0) {
      updateTextBox(editingTextBoxId, { text: trimmed });
      selectTextBox(editingTextBoxId);
    } else {
      deleteTextBox(editingTextBoxId);
      selectTextBox(null);
    }
    setEditingTextBoxId(null);
  }, [editingTextBoxId, editText, updateTextBox, deleteTextBox, selectTextBox, setEditingTextBoxId]);

  // Focus textarea when editing starts — use rAF because the portaled textarea
  // may not have mounted yet on the very first render cycle
  useEffect(() => {
    if (!editingTextBoxId) return;
    const tryFocus = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      } else {
        // Textarea portal hasn't rendered yet; retry next frame
        requestAnimationFrame(tryFocus);
      }
    };
    requestAnimationFrame(tryFocus);
  }, [editingTextBoxId]);

  // Keyboard events when text box is selected but NOT being edited
  // (Delete/Backspace to delete, Enter to start editing, Escape to deselect)
  useEffect(() => {
    if (!selectedTextBoxId || editingTextBoxId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keypresses inside inputs/textareas
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        deleteTextBox(selectedTextBoxId);
        selectTextBox(null);
      } else if (e.key === "Escape") {
        e.preventDefault();
        selectTextBox(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const box = textBoxes.find((b) => b.id === selectedTextBoxId);
        if (box) startEditing(box);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTextBoxId, editingTextBoxId, deleteTextBox, selectTextBox, textBoxes, startEditing]);

  // Handle pointer down for dragging / selection
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGGElement>, box: CanvasTextBox) => {
    if (isVisualizing) return;
    e.stopPropagation();

    // Select text box if not already part of multi-selection
    if (!selectedTextBoxIds.has(box.id)) {
      selectTextBox(box.id);
    }

    const svgCoords = screenToSvgCoords(e.clientX, e.clientY);
    dragState.current = {
      id: box.id,
      startPointerSvg: svgCoords,
      startBoxPos: { x: box.x, y: box.y },
      hasMoved: false,
    };

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
  }, [isVisualizing, selectedTextBoxIds, selectTextBox, screenToSvgCoords]);

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
      if (selectedTextBoxIds.size > 1 && selectedTextBoxIds.has(id)) {
        const frameDx = Math.round(currSvg.x - startPointerSvg.x);
        const frameDy = Math.round(currSvg.y - startPointerSvg.y);
        moveTextBoxes(Array.from(selectedTextBoxIds), frameDx, frameDy);
        dragState.current.startPointerSvg = currSvg;
      } else {
        moveTextBox(id, Math.round(startBoxPos.x + dx), Math.round(startBoxPos.y + dy));
      }
    }
  }, [screenToSvgCoords, selectedTextBoxIds, moveTextBox, moveTextBoxes]);

  const lastClickRef = useRef<{ id: string; time: number }>({ id: "", time: 0 });

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGGElement>, box: CanvasTextBox) => {
    if (!dragState.current) return;
    const hadMoved = dragState.current.hasMoved;
    dragState.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer already released
    }

    // Single click without movement selects; double-click activates inline text edit
    if (!hadMoved) {
      const now = Date.now();
      if (lastClickRef.current.id === box.id && now - lastClickRef.current.time < 350) {
        startEditing(box);
        lastClickRef.current = { id: "", time: 0 };
      } else {
        lastClickRef.current = { id: box.id, time: now };
        selectTextBox(box.id);
      }
    }
  }, [selectTextBox, startEditing]);

  const editingBox = useMemo(() => {
    return textBoxes.find((b) => b.id === editingTextBoxId);
  }, [textBoxes, editingTextBoxId]);

  const selectedBox = useMemo(() => {
    return textBoxes.find((b) => b.id === selectedTextBoxId);
  }, [textBoxes, selectedTextBoxId]);

  const activeBox = editingBox || selectedBox;

  // Calculate screen coordinates for floating editor and toolbar
  const editorScreenPos = useMemo(() => {
    if (!editingBox) return null;
    return svgToScreenCoords(editingBox.x, editingBox.y);
  }, [editingBox, svgToScreenCoords]);

  const toolbarScreenPos = useMemo(() => {
    if (!activeBox) return null;
    const metrics = getBoxMetrics(activeBox);
    const screen = svgToScreenCoords(activeBox.x, activeBox.y);
    return {
      x: screen.x,
      y: screen.y - 12,
      width: metrics.width,
    };
  }, [activeBox, svgToScreenCoords, getBoxMetrics]);

  return (
    <>
      <g className="canvas-text-boxes">
        {textBoxes.map((box) => {
          const isSelected = box.id === selectedTextBoxId || selectedTextBoxIds.has(box.id);
          const isCurrentlyEditing = box.id === editingTextBoxId;
          const { width, height, lines, fontSize, lineHeight, paddingX, paddingY } = getBoxMetrics(box);

          const isCustomColor = box.color && box.color !== "default";
          const textColor = isCustomColor ? box.color : "var(--color-text)";
          const fontFamily = box.fontFamily || "Inter, -apple-system, sans-serif";
          const fontWeight = box.fontWeight || 500;
          const fontStyle = box.fontStyle || "normal";

          let cardBg = "var(--color-surface)";
          let cardBorder = isSelected ? "var(--color-accent)" : "var(--color-divider)";
          let cardStrokeWidth = isSelected ? 2.5 : 1;

          if (box.backgroundColor && box.backgroundColor !== "card") {
            cardBg = box.backgroundColor;
          } else if (isCustomColor) {
            cardBg = `${box.color}14`;
          }

          // Apply custom border or colored border
          if (box.borderEnabled) {
            cardBorder = box.borderColor || (isCustomColor ? box.color! : "var(--color-accent)");
            cardStrokeWidth = isSelected ? 3 : 2;
          } else if (isCustomColor) {
            cardBorder = isSelected ? "var(--color-accent)" : `${box.color}40`;
            cardStrokeWidth = isSelected ? 2.5 : 1.5;
          }

          return (
            <g
              key={box.id}
              transform={`translate(${box.x}, ${box.y})`}
              className="canvas-text-box cursor-move select-none"
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
                strokeWidth={cardStrokeWidth}
                strokeDasharray={isSelected ? "none" : undefined}
                className="transition-colors duration-150"
                style={{
                  filter: isSelected ? "drop-shadow(0 4px 14px rgba(59, 130, 246, 0.35))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.06))",
                }}
              />

              {/* Text content (hidden while active inline editor is open) */}
              {!isCurrentlyEditing && (
                <text
                  x={paddingX}
                  y={paddingY + fontSize * 0.85}
                  fill={textColor}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  fontWeight={fontWeight}
                  fontStyle={fontStyle}
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

      {/* Floating Toolbar when a text box is selected or being edited (Portaled to body) */}
      {activeBox && toolbarScreenPos && createPortal(
        <div
          style={{
            position: "fixed",
            left: toolbarScreenPos.x,
            top: toolbarScreenPos.y,
            transform: "translateY(-100%)",
            zIndex: 75,
          }}
          className="flex flex-col items-start gap-1 animate-in fade-in zoom-in-95 duration-150"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Main Row */}
          <div className="flex items-center gap-1 p-1 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-xl backdrop-blur-md">
            {/* Edit / Done Button */}
            {editingBox ? (
              <button
                onClick={commitEdit}
                title="Done Editing"
                className="px-2 py-1 rounded-md text-xs font-semibold bg-(--color-accent) text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
              >
                <Check size={13} />
                <span>Done</span>
              </button>
            ) : (
              <button
                onClick={() => startEditing(activeBox)}
                title="Edit Text (2x click)"
                className="p-1 rounded-md text-xs font-semibold hover:bg-(--color-paper) text-(--color-text) flex items-center gap-1 transition-colors"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}

            <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

            {/* Font Family Picker */}
            <div className="relative">
              <button
                onClick={() => { setShowFontPicker(!showFontPicker); setShowBorderPicker(false); }}
                title="Font Family"
                className={cn(
                  "px-1.5 py-0.5 rounded text-[11px] font-medium flex items-center gap-0.5 transition-colors",
                  showFontPicker
                    ? "bg-(--color-accent)/15 text-(--color-accent)"
                    : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
                )}
              >
                <span style={{ fontFamily: activeBox.fontFamily || "Inter" }}>
                  {FONT_FAMILIES.find(f => f.value === (activeBox.fontFamily || FONT_FAMILIES[0].value))?.label || "Sans"}
                </span>
                <ChevronDown size={10} />
              </button>
              {showFontPicker && (
                <div className="absolute top-full left-0 mt-1 bg-(--color-surface) border border-(--color-divider) rounded-lg shadow-2xl p-1 min-w-[130px] z-[85]">
                  {FONT_FAMILIES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => { updateTextBox(activeBox.id, { fontFamily: f.value }); setShowFontPicker(false); }}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-[12px] transition-colors",
                        (activeBox.fontFamily || FONT_FAMILIES[0].value) === f.value
                          ? "bg-(--color-accent)/15 text-(--color-accent) font-semibold"
                          : "text-(--color-text) hover:bg-(--color-paper)"
                      )}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

            {/* Font Size Swatches */}
            <div className="flex items-center gap-0.5">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.size}
                  onClick={() => updateTextBox(activeBox.id, { fontSize: f.size })}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-bold transition-all",
                    (activeBox.fontSize || 15) === f.size
                      ? "bg-(--color-accent) text-white shadow-xs"
                      : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

            {/* Bold Toggle */}
            <button
              onClick={() => updateTextBox(activeBox.id, { fontWeight: (activeBox.fontWeight || 500) >= 700 ? 500 : 700 })}
              title="Bold"
              className={cn(
                "p-1 rounded-md transition-colors",
                (activeBox.fontWeight || 500) >= 700
                  ? "bg-(--color-accent)/15 text-(--color-accent)"
                  : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
              )}
            >
              <Bold size={13} />
            </button>

            {/* Italic Toggle */}
            <button
              onClick={() => updateTextBox(activeBox.id, { fontStyle: activeBox.fontStyle === "italic" ? "normal" : "italic" })}
              title="Italic"
              className={cn(
                "p-1 rounded-md transition-colors",
                activeBox.fontStyle === "italic"
                  ? "bg-(--color-accent)/15 text-(--color-accent)"
                  : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
              )}
            >
              <Italic size={13} />
            </button>

            <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

            {/* Color Swatches */}
            <div className="flex items-center gap-1">
              {COLOR_PALETTE.map((p) => (
                <button
                  key={p.name}
                  onClick={() => updateTextBox(activeBox.id, { color: p.color, backgroundColor: p.bg })}
                  title={p.name}
                  className={cn(
                    "w-4 h-4 rounded-full border border-(--color-divider) transition-transform hover:scale-110",
                    (activeBox.color || "default") === p.color && "ring-2 ring-(--color-accent) scale-110"
                  )}
                  style={{
                    backgroundColor: p.color === "default" ? "var(--color-text)" : p.color,
                  }}
                />
              ))}
            </div>

            <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

            {/* Border Toggle + Color Picker */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!activeBox.borderEnabled) {
                    updateTextBox(activeBox.id, { borderEnabled: true, borderColor: "var(--color-accent)" });
                  } else {
                    setShowBorderPicker(!showBorderPicker);
                    setShowFontPicker(false);
                  }
                }}
                title={activeBox.borderEnabled ? "Border Options" : "Add Border"}
                className={cn(
                  "p-1 rounded-md transition-colors flex items-center gap-0.5",
                  activeBox.borderEnabled
                    ? "bg-(--color-accent)/15 text-(--color-accent)"
                    : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
                )}
              >
                <Square size={13} />
                {activeBox.borderEnabled && <ChevronDown size={9} />}
              </button>
              {showBorderPicker && activeBox.borderEnabled && (
                <div className="absolute top-full right-0 mt-1 bg-(--color-surface) border border-(--color-divider) rounded-lg shadow-2xl p-1.5 min-w-[120px] z-[85]">
                  <div className="flex items-center gap-1 mb-1.5">
                    {BORDER_COLORS.map((bc) => (
                      <button
                        key={bc.name}
                        onClick={() => { updateTextBox(activeBox.id, { borderColor: bc.color }); }}
                        title={bc.name}
                        className={cn(
                          "w-4 h-4 rounded-full border border-(--color-divider)/50 transition-transform hover:scale-110",
                          (activeBox.borderColor || "var(--color-accent)") === bc.color && "ring-2 ring-(--color-accent) scale-110"
                        )}
                        style={{ backgroundColor: bc.color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => { updateTextBox(activeBox.id, { borderEnabled: false, borderColor: undefined }); setShowBorderPicker(false); }}
                    className="w-full text-left px-2 py-0.5 rounded text-[11px] text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    Remove Border
                  </button>
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5" />

            {/* Delete Button */}
            <button
              onClick={() => {
                deleteTextBox(activeBox.id);
                selectTextBox(null);
                setEditingTextBoxId(null);
              }}
              title="Delete Text Box"
              className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Backdrop when editing so clicking anywhere outside commits edit */}
      {editingBox && createPortal(
        <div
          className="fixed inset-0"
          style={{ zIndex: 65, cursor: "default" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            commitEdit();
          }}
        />,
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
          <div
            className="relative shadow-2xl rounded-xl bg-(--color-surface) overflow-hidden min-w-[240px]"
            style={{
              border: editingBox.borderEnabled
                ? `2px solid ${editingBox.borderColor || "var(--color-accent)"}`
                : "2px solid var(--color-accent)",
              boxShadow: "0 14px 40px -6px rgba(0, 0, 0, 0.45)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  commitEdit();
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  commitEdit();
                }
              }}
              rows={Math.max(2, editText.split("\n").length)}
              className="w-full p-2.5 bg-transparent text-(--color-text) focus:outline-none resize font-medium leading-snug"
              style={{
                fontSize: `${editingBox.fontSize || 15}px`,
                fontFamily: editingBox.fontFamily || "Inter, -apple-system, sans-serif",
                fontWeight: editingBox.fontWeight || 500,
                fontStyle: editingBox.fontStyle || "normal",
                color: editingBox.color && editingBox.color !== "default" ? editingBox.color : "var(--color-text)",
              }}
              placeholder="Type note or text here... (Enter to save)"
            />
            <div className="flex items-center justify-between px-2.5 py-1 bg-(--color-paper) border-t border-(--color-divider) text-[10px] text-(--color-text-muted)">
              <span>Shift+Enter newline • Enter to save</span>
              <div className="flex gap-1">
                <button
                  onClick={commitEdit}
                  className="px-2 py-0.5 rounded bg-(--color-accent) text-white font-semibold hover:opacity-90 flex items-center gap-1 transition-opacity"
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
