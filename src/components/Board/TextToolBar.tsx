import { useState, useRef, useEffect } from "react";
import {
  useGraphStore,
  selectIsTextToolActive,
  selectSelectedTextBoxId,
  selectEditingTextBoxId,
  selectTextBoxes,
  selectDefaultTextBoxStyle,
} from "../../store/graphStore";
import {
  Type,
  Bold,
  Italic,
  Square,
  ChevronDown,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const FONT_FAMILIES = [
  { label: "Sans", value: "Inter, -apple-system, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: "Hand", value: "'Caveat', 'Comic Sans MS', cursive" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
];

export const FONT_SIZES = [
  { label: "S", size: 12 },
  { label: "M", size: 15 },
  { label: "L", size: 19 },
  { label: "XL", size: 24 },
  { label: "2X", size: 32 },
];

export const COLOR_PALETTE = [
  { name: "Default", color: "default", bg: "card" },
  { name: "Emerald", color: "#10b981", bg: "rgba(16, 185, 129, 0.08)" },
  { name: "Sky", color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.08)" },
  { name: "Rose", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.08)" },
  { name: "Amber", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
  { name: "Purple", color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)" },
  { name: "Indigo", color: "#6366f1", bg: "rgba(99, 102, 241, 0.08)" },
  { name: "Pink", color: "#ec4899", bg: "rgba(236, 72, 153, 0.08)" },
];

export const BORDER_COLORS = [
  { name: "Accent", color: "var(--color-accent)" },
  { name: "Gray", color: "#9ca3af" },
  { name: "Red", color: "#ef4444" },
  { name: "Green", color: "#22c55e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Orange", color: "#f97316" },
];

export function TextToolBar() {
  const textToolActive = useGraphStore(selectIsTextToolActive);
  const selectedTextBoxId = useGraphStore(selectSelectedTextBoxId);
  const editingTextBoxId = useGraphStore(selectEditingTextBoxId);
  const textBoxes = useGraphStore(selectTextBoxes);
  const defaultStyle = useGraphStore(selectDefaultTextBoxStyle);

  const updateTextBox = useGraphStore((s) => s.updateTextBox);
  const deleteTextBox = useGraphStore((s) => s.deleteTextBox);
  const selectTextBox = useGraphStore((s) => s.selectTextBox);
  const setTextToolActive = useGraphStore((s) => s.setTextToolActive);
  const setDefaultTextBoxStyle = useGraphStore((s) => s.setDefaultTextBoxStyle);
  const addTextBox = useGraphStore((s) => s.addTextBox);
  const setEditingTextBoxId = useGraphStore((s) => s.setEditingTextBoxId);

  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showBorderDropdown, setShowBorderDropdown] = useState(false);

  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const borderDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(e.target as Node)
      ) {
        setShowFontDropdown(false);
      }
      if (
        borderDropdownRef.current &&
        !borderDropdownRef.current.contains(e.target as Node)
      ) {
        setShowBorderDropdown(false);
      }
    };
    document.addEventListener("pointerdown", handleDocClick);
    return () => document.removeEventListener("pointerdown", handleDocClick);
  }, []);

  // Only render when Text Tool is active OR a text box is selected/edited
  const isVisible = textToolActive || selectedTextBoxId !== null || editingTextBoxId !== null;
  if (!isVisible) return null;

  const targetBoxId = editingTextBoxId || selectedTextBoxId;
  const activeBox = textBoxes.find((b) => b.id === targetBoxId);

  // Active values (either from activeBox or defaultStyle)
  const activeFont = activeBox?.fontFamily ?? defaultStyle.fontFamily ?? FONT_FAMILIES[0].value;
  const activeSize = activeBox?.fontSize ?? defaultStyle.fontSize ?? 15;
  const activeWeight = activeBox?.fontWeight ?? defaultStyle.fontWeight ?? 500;
  const activeStyle = activeBox?.fontStyle ?? defaultStyle.fontStyle ?? "normal";
  const activeColor = activeBox?.color ?? defaultStyle.color ?? "default";
  const activeBorderEnabled = activeBox?.borderEnabled ?? defaultStyle.borderEnabled ?? false;
  const activeBorderColor = activeBox?.borderColor ?? defaultStyle.borderColor ?? "var(--color-accent)";

  const handleApplyUpdates = (updates: Parameters<typeof updateTextBox>[1]) => {
    setDefaultTextBoxStyle(updates);
    if (activeBox) {
      updateTextBox(activeBox.id, updates);
    }
  };

  const handleCreateNewBox = () => {
    const s = useGraphStore.getState();
    const pan = s.viewport.pan;
    const offset = (s.data.textBoxes.length % 6) * 24;
    const newId = addTextBox({
      x: -Math.round(pan.x) + offset,
      y: -Math.round(pan.y) + offset,
      text: "",
      fontSize: activeSize,
      fontFamily: activeFont,
      fontWeight: activeWeight,
      fontStyle: activeStyle,
      color: activeColor,
      borderEnabled: activeBorderEnabled,
      borderColor: activeBorderColor,
    });
    setTextToolActive(true);
    selectTextBox(newId);
    setEditingTextBoxId(newId);
  };

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 bg-(--color-surface)/95 backdrop-blur-md border border-(--color-divider) rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 text-xs select-none max-w-[calc(100vw-1.5rem)] overflow-x-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Tool / Status Indicator */}
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-(--color-accent)/10 text-(--color-accent) font-semibold shrink-0">
        <Type size={13} className="shrink-0" />
        <span className="text-[11px] whitespace-nowrap">
          {activeBox ? (activeBox.text ? `"${activeBox.text.slice(0, 10)}${activeBox.text.length > 10 ? "…" : ""}"` : "Active Note") : "Text Tool"}
        </span>
      </div>

      <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5 shrink-0" />

      {/* Font Family Dropdown */}
      <div className="relative shrink-0" ref={fontDropdownRef}>
        <button
          onClick={() => {
            setShowFontDropdown(!showFontDropdown);
            setShowBorderDropdown(false);
          }}
          title="Font Family"
          className={cn(
            "px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors border border-transparent hover:border-(--color-divider)",
            showFontDropdown
              ? "bg-(--color-accent)/15 text-(--color-accent) border-(--color-accent)/30"
              : "text-(--color-text) hover:bg-(--color-paper)"
          )}
        >
          <span style={{ fontFamily: activeFont }}>
            {FONT_FAMILIES.find((f) => f.value === activeFont)?.label || "Sans"}
          </span>
          <ChevronDown size={11} className="opacity-70" />
        </button>

        {showFontDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-2xl p-1 min-w-[135px] z-[90] animate-in fade-in zoom-in-95 duration-100">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  handleApplyUpdates({ fontFamily: f.value });
                  setShowFontDropdown(false);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1 rounded-lg text-[12px] transition-colors",
                  activeFont === f.value
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

      <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5 shrink-0" />

      {/* Font Size Swatches */}
      <div className="flex items-center gap-0.5 shrink-0">
        {FONT_SIZES.map((f) => (
          <button
            key={f.size}
            onClick={() => handleApplyUpdates({ fontSize: f.size })}
            title={`Font Size: ${f.size}px`}
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[11px] font-bold transition-all",
              activeSize === f.size
                ? "bg-(--color-accent) text-white shadow-xs scale-105"
                : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5 shrink-0" />

      {/* Bold Toggle */}
      <button
        onClick={() =>
          handleApplyUpdates({
            fontWeight: activeWeight >= 700 ? 500 : 700,
          })
        }
        title={activeWeight >= 700 ? "Bold (Active)" : "Bold"}
        className={cn(
          "p-1 rounded-md transition-colors shrink-0",
          activeWeight >= 700
            ? "bg-(--color-accent)/15 text-(--color-accent)"
            : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
        )}
      >
        <Bold size={13} />
      </button>

      {/* Italic Toggle */}
      <button
        onClick={() =>
          handleApplyUpdates({
            fontStyle: activeStyle === "italic" ? "normal" : "italic",
          })
        }
        title={activeStyle === "italic" ? "Italic (Active)" : "Italic"}
        className={cn(
          "p-1 rounded-md transition-colors shrink-0",
          activeStyle === "italic"
            ? "bg-(--color-accent)/15 text-(--color-accent)"
            : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
        )}
      >
        <Italic size={13} />
      </button>

      <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5 shrink-0" />

      {/* Color Palette Swatches */}
      <div className="flex items-center gap-1 shrink-0" title="Text & Card Color">
        {COLOR_PALETTE.map((p) => {
          const isSelected = activeColor === p.color;
          return (
            <button
              key={p.name}
              onClick={() =>
                handleApplyUpdates({
                  color: p.color,
                  backgroundColor: p.bg,
                })
              }
              title={p.name}
              className={cn(
                "w-4 h-4 rounded-full border border-(--color-divider) transition-transform hover:scale-115",
                isSelected && "ring-2 ring-(--color-accent) scale-115 shadow-xs"
              )}
              style={{
                backgroundColor:
                  p.color === "default" ? "var(--color-text)" : p.color,
              }}
            />
          );
        })}
      </div>

      <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5 shrink-0" />

      {/* Border Toggle & Color Dropdown */}
      <div className="relative shrink-0" ref={borderDropdownRef}>
        <button
          onClick={() => {
            if (!activeBorderEnabled) {
              handleApplyUpdates({
                borderEnabled: true,
                borderColor: activeBorderColor || "var(--color-accent)",
              });
            } else {
              setShowBorderDropdown(!showBorderDropdown);
              setShowFontDropdown(false);
            }
          }}
          title={activeBorderEnabled ? "Border Options" : "Add Border"}
          className={cn(
            "p-1 rounded-md transition-colors flex items-center gap-0.5",
            activeBorderEnabled
              ? "bg-(--color-accent)/15 text-(--color-accent)"
              : "text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text)"
          )}
        >
          <Square size={13} />
          {activeBorderEnabled && <ChevronDown size={9} />}
        </button>

        {showBorderDropdown && activeBorderEnabled && (
          <div className="absolute top-full right-0 mt-1 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-2xl p-1.5 min-w-[130px] z-[90] animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-semibold text-(--color-text-muted) mb-1 px-1">
              Border Color
            </div>
            <div className="flex items-center gap-1 mb-2 px-1">
              {BORDER_COLORS.map((bc) => (
                <button
                  key={bc.name}
                  onClick={() => {
                    handleApplyUpdates({ borderColor: bc.color });
                  }}
                  title={bc.name}
                  className={cn(
                    "w-4 h-4 rounded-full border border-(--color-divider)/50 transition-transform hover:scale-115",
                    activeBorderColor === bc.color && "ring-2 ring-(--color-accent) scale-115"
                  )}
                  style={{ backgroundColor: bc.color }}
                />
              ))}
            </div>
            <button
              onClick={() => {
                handleApplyUpdates({
                  borderEnabled: false,
                  borderColor: undefined,
                });
                setShowBorderDropdown(false);
              }}
              className="w-full text-left px-2 py-1 rounded-md text-[11px] text-red-500 hover:bg-red-500/10 transition-colors font-medium"
            >
              Remove Border
            </button>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-(--color-divider) mx-0.5 shrink-0" />

      {/* Add New Note Button */}
      <button
        onClick={handleCreateNewBox}
        title="Add New Note with Current Styles"
        className="px-2 py-1 rounded-lg bg-(--color-accent) text-white font-semibold text-[11px] flex items-center gap-1 hover:opacity-90 transition-opacity shrink-0"
      >
        <Plus size={12} />
        <span>Add Note</span>
      </button>

      {/* Delete selected text box if active */}
      {activeBox && (
        <button
          onClick={() => {
            deleteTextBox(activeBox.id);
            selectTextBox(null);
            setEditingTextBoxId(null);
          }}
          title="Delete Note"
          className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <Trash2 size={13} />
        </button>
      )}

      {/* Close Text Tool */}
      <button
        onClick={() => {
          setTextToolActive(false);
          selectTextBox(null);
          setEditingTextBoxId(null);
        }}
        title="Done / Close Text Tool"
        className="p-1 rounded-md text-(--color-text-muted) hover:bg-(--color-paper) hover:text-(--color-text) transition-colors shrink-0 ml-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}
