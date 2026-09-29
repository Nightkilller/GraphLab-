import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
  GitCompare,
  Check,
  RotateCcw,
  Columns,
  Layers,
  Info,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { GrainTexture } from "../ui/grain-texture";
import { useComplementStore } from "../../store/complementStore";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";

export const ComplementInspector = () => {
  const isActive = useComplementStore((state) => state.isActive);
  const viewMode = useComplementStore((state) => state.viewMode);
  const setViewMode = useComplementStore((state) => state.setViewMode);
  const applyComplement = useComplementStore((state) => state.applyComplement);
  const applySideBySide = useComplementStore((state) => state.applySideBySide);
  const revertOriginal = useComplementStore((state) => state.revertOriginal);
  const analysis = useComplementStore((state) => state.analysis);
  const [showAnalysis, setShowAnalysis] = useState(false);

  if (!isActive || !analysis) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 max-w-[95vw] pointer-events-none"
      >
        {/* Main Floating Control Bar */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 p-2 px-3.5 rounded-2xl bg-(--color-surface)/95 backdrop-blur-md border border-(--color-divider) shadow-2xl shadow-black/20 text-xs">
          <GrainTexture className="rounded-2xl" />

          {/* Title & Edge Count Summary */}
          <div className="flex items-center gap-2 pr-2 border-r border-(--color-divider)">
            <div className="p-1.5 rounded-lg bg-(--color-accent)/15 text-(--color-accent)">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-(--color-text) flex items-center gap-1.5">
                <span>Complement Graph (G ↔ G')</span>
              </div>
              <div className="flex items-center gap-2 text-[10.5px] text-(--color-text-muted)">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 border-t-2 border-dashed border-blue-500 inline-block" />
                  Original G: <strong className="text-blue-500 font-semibold">{analysis.origEdgeCount}</strong>
                </span>
                <span>+</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-pink-500 inline-block" />
                  Complement G': <strong className="text-pink-500 font-semibold">{analysis.compEdgeCount}</strong>
                </span>
                <span>=</span>
                <span>Max <strong className="text-(--color-text)">{analysis.maxEdges}</strong></span>
              </div>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-(--color-paper) p-0.5 rounded-lg border border-(--color-divider)">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "side-by-side"
                  ? "bg-(--color-surface) text-(--color-accent) shadow-sm border border-(--color-divider)/60 font-semibold"
                  : "text-(--color-text-muted) hover:text-(--color-text)"
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>

            <button
              onClick={() => setViewMode("both")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "both"
                  ? "bg-(--color-surface) text-(--color-text) shadow-sm border border-(--color-divider)/60 font-semibold"
                  : "text-(--color-text-muted) hover:text-(--color-text)"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overlay</span>
            </button>

            <button
              onClick={() => setViewMode("original")}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                viewMode === "original"
                  ? "bg-(--color-surface) text-blue-500 shadow-sm border border-(--color-divider)/60 font-semibold"
                  : "text-(--color-text-muted) hover:text-(--color-text)"
              )}
            >
              G Only
            </button>

            <button
              onClick={() => setViewMode("complement")}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                viewMode === "complement"
                  ? "bg-(--color-surface) text-pink-500 shadow-sm border border-(--color-divider)/60 font-semibold"
                  : "text-(--color-text-muted) hover:text-(--color-text)"
              )}
            >
              G' Only
            </button>
          </div>

          {/* Theory Details Popover */}
          <Popover open={showAnalysis} onOpenChange={setShowAnalysis}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-(--color-text-muted) hover:text-(--color-text)"
              >
                <Sparkles className="w-3.5 h-3.5 text-(--color-accent)" />
                <span className="hidden sm:inline">Analysis</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-3.5 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-xl text-xs space-y-2.5"
              align="center"
              sideOffset={10}
            >
              <div className="flex items-center gap-1.5 pb-2 border-b border-(--color-divider) font-semibold text-(--color-text)">
                <Info className="w-4 h-4 text-(--color-accent)" />
                <span>Complement Graph Theory Analysis</span>
              </div>

              <div className="text-[11px] text-(--color-text-muted) space-y-1">
                <p>
                  Complement is computed for the entire graph: edges present in <strong>G</strong> are absent in <strong>G'</strong>, and vice-versa.
                </p>
                <p className="p-1.5 rounded bg-(--color-paper) font-mono text-[10.5px] text-(--color-text)">
                  |E(G)| + |E(G')| = n(n - 1) / 2 = {analysis.maxEdges}
                </p>
                <p>
                  Degree Inversion: <code className="text-(--color-accent)">deg_G'(v) = (n - 1) - deg_G(v)</code>
                </p>
              </div>

              {/* Degrees Table */}
              <div className="max-h-36 overflow-y-auto border border-(--color-divider) rounded-lg">
                <table className="w-full text-center text-[11px]">
                  <thead className="bg-(--color-paper) text-(--color-text-muted) border-b border-(--color-divider)">
                    <tr>
                      <th className="py-1 px-2 text-left">Vertex</th>
                      <th className="py-1 px-2 text-blue-500">deg(G)</th>
                      <th className="py-1 px-2 text-pink-500">deg(G')</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-divider)">
                    {analysis.degrees.map((d) => (
                      <tr key={d.id}>
                        <td className="py-0.5 px-2 text-left font-semibold">{d.label}</td>
                        <td className="py-0.5 px-2 font-mono">{d.origDegree}</td>
                        <td className="py-0.5 px-2 font-mono">{d.compDegree}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PopoverContent>
          </Popover>

          {/* Action Commits */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-(--color-divider)">
            {viewMode === "side-by-side" ? (
              <Button
                size="sm"
                onClick={applySideBySide}
                className="h-7 px-2.5 text-xs gap-1 font-medium bg-(--color-accent) hover:bg-(--color-accent)/90 text-white"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Keep Both</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={applyComplement}
                className="h-7 px-2.5 text-xs gap-1 font-medium bg-(--color-accent) hover:bg-(--color-accent)/90 text-white"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Keep G'</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={revertOriginal}
              className="h-7 px-2 text-xs gap-1 text-(--color-text-muted) hover:text-(--color-text)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Button>
          </div>
        </div>

        {/* Clear Graph Identifiers (Positioned directly below the control bar without any overlap) */}
        {viewMode === "side-by-side" && (
          <div className="w-[90vw] max-w-4xl flex items-center justify-between px-2 sm:px-8 animate-in fade-in-50 duration-200">
            {/* Left Graph G Badge */}
            <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-(--color-surface)/95 backdrop-blur-md border-2 border-blue-500/60 shadow-lg text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs tracking-wide">Left: Original Graph G</span>
                <span className="text-[10px] text-(--color-text-muted)">
                  {analysis.origEdgeCount} {analysis.origEdgeCount === 1 ? "edge" : "edges"} (Blue Dashed)
                </span>
              </div>
            </div>

            {/* Right Graph G' Badge */}
            <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-(--color-surface)/95 backdrop-blur-md border-2 border-pink-500/60 shadow-lg text-pink-600 dark:text-pink-400">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs tracking-wide">Right: Complement Graph G'</span>
                <span className="text-[10px] text-(--color-text-muted)">
                  {analysis.compEdgeCount} {analysis.compEdgeCount === 1 ? "edge" : "edges"} (Pink Solid)
                </span>
              </div>
            </div>
          </div>
        )}

        {viewMode === "both" && (
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-(--color-surface)/95 backdrop-blur-md border border-(--color-divider) shadow-lg text-xs animate-in fade-in-50 duration-200">
            <span className="flex items-center gap-1.5 text-blue-500 font-semibold">
              <span className="w-2 h-0.5 border-t-2 border-dashed border-blue-500 inline-block" />
              Original G ({analysis.origEdgeCount})
            </span>
            <span className="text-(--color-text-muted)">+</span>
            <span className="flex items-center gap-1.5 text-pink-500 font-semibold">
              <span className="w-2 h-0.5 bg-pink-500 inline-block" />
              Complement G' ({analysis.compEdgeCount})
            </span>
            <span className="text-(--color-text-muted)">
              = Complete Graph K{analysis.nodeCount} ({analysis.maxEdges} edges)
            </span>
          </div>
        )}

        {viewMode === "original" && (
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-(--color-surface)/95 backdrop-blur-md border border-blue-500/50 shadow-lg text-xs text-blue-500 font-semibold animate-in fade-in-50 duration-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Showing Original Graph G Only ({analysis.origEdgeCount} edges)</span>
          </div>
        )}

        {viewMode === "complement" && (
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-(--color-surface)/95 backdrop-blur-md border border-pink-500/50 shadow-lg text-xs text-pink-500 font-semibold animate-in fade-in-50 duration-200">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span>Showing Complement Graph G' Only ({analysis.compEdgeCount} edges)</span>
          </div>
        )}
      </m.div>
    </AnimatePresence>
  );
};
