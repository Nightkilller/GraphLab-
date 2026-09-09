import { useState } from "react";
import { Keyboard, Laptop, Monitor } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { GrainTexture } from "../ui/grain-texture";
import { isMac } from "../../utils/keyboard";
import { cn } from "../../lib/utils";

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const getShortcutGroups = (platform: "windows" | "mac"): ShortcutGroup[] => {
  const isWin = platform === "windows";
  const mod = isWin ? "Ctrl" : "⌘";

  return [
    {
      title: "General & Canvas",
      shortcuts: [
        { keys: [mod, "Z"], description: "Undo" },
        { keys: isWin ? [mod, "Y"] : [mod, "⇧", "Z"], description: isWin ? "Redo (or Ctrl+Shift+Z)" : "Redo" },
        { keys: [mod, "A"], description: "Select all vertices" },
        { keys: [mod, "+ / −"], description: "Zoom in / out" },
        { keys: [mod, "0"], description: "Reset zoom to 100%" },
        { keys: [isWin ? "Shift" : "⇧", "Drag"], description: "Multi-select box" },
      ],
    },
    {
      title: "When Vertex Selected",
      shortcuts: [
        { keys: ["↑", "↓", "←", "→"], description: "Navigate to nearby vertex" },
        { keys: ["E"], description: "Cycle connected edges" },
        { keys: ["Enter"], description: "Edit label / focused edge" },
        { keys: isWin ? ["Delete", "Backspace"] : ["Delete", "⌫"], description: "Delete vertex" },
        { keys: ["Esc"], description: "Deselect vertex" },
      ],
    },
    {
      title: "Algorithm Step Mode",
      shortcuts: [
        { keys: ["←", "→"], description: "Previous / next step" },
        { keys: ["Space"], description: "Play / pause playback" },
        { keys: ["Home", "End"], description: "Jump to start / end" },
        { keys: ["Esc"], description: "Exit step mode" },
      ],
    },
  ];
};

export const KeyboardShortcuts = () => {
  // Default to windows if on Windows laptop/PC, otherwise mac
  const [platform, setPlatform] = useState<"windows" | "mac">(isMac ? "mac" : "windows");

  const groups = getShortcutGroups(platform);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              aria-label="Keyboard shortcuts"
              className="relative"
            >
              <GrainTexture baseFrequency={4.2} className="rounded-lg overflow-hidden" />
              <Keyboard size={20} className="text-(--color-text-muted)" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Keyboard shortcuts ({platform === "windows" ? "Windows" : "Mac"})</TooltipContent>
      </Tooltip>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-76 p-0 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-2xl overflow-hidden"
      >
        <GrainTexture baseFrequency={4.2} className="rounded-xl" />
        <div className="relative p-3.5 space-y-3">
          {/* Header & Platform Toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-(--color-divider)">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-(--color-text)">
              <Keyboard className="w-3.5 h-3.5 text-(--color-accent)" />
              <span>Keyboard Shortcuts</span>
            </div>

            {/* Segmented OS selector */}
            <div className="flex bg-(--color-paper) p-0.5 rounded-md border border-(--color-divider)">
              <button
                onClick={() => setPlatform("windows")}
                className={cn(
                  "px-2 py-0.5 text-[10.5px] rounded transition-all flex items-center gap-1 font-medium",
                  platform === "windows"
                    ? "bg-(--color-surface) text-(--color-accent) font-semibold shadow-xs"
                    : "text-(--color-text-muted) hover:text-(--color-text)"
                )}
                title="Windows Laptop / PC Shortcuts"
              >
                <Laptop className="w-3 h-3" />
                <span>Windows</span>
              </button>
              <button
                onClick={() => setPlatform("mac")}
                className={cn(
                  "px-2 py-0.5 text-[10.5px] rounded transition-all flex items-center gap-1 font-medium",
                  platform === "mac"
                    ? "bg-(--color-surface) text-(--color-accent) font-semibold shadow-xs"
                    : "text-(--color-text-muted) hover:text-(--color-text)"
                )}
                title="Mac Shortcuts"
              >
                <Monitor className="w-3 h-3" />
                <span>Mac</span>
              </button>
            </div>
          </div>

          {/* Shortcuts Groups */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-(--color-accent) uppercase tracking-wider">
                  {group.title}
                </h4>
                <div className="space-y-1.5">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <span className="text-[11.5px] text-(--color-text-muted)">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((k, idx) => (
                          <span key={idx} className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-(--color-paper) border border-(--color-divider) text-(--color-text) font-mono text-[10px] font-medium shadow-xs">
                              {k}
                            </kbd>
                            {idx < shortcut.keys.length - 1 && (
                              <span className="text-[10px] text-(--color-text-muted)/60 font-mono">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-(--color-divider) text-[10px] text-(--color-text-muted) flex items-center justify-between">
            <span>Platform: <strong>{platform === "windows" ? "Windows PC / Laptop" : "macOS"}</strong></span>
            <span className="text-emerald-500 font-medium">Auto-configured</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
