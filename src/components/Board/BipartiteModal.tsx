import { useState } from "react";
import {
  Split,
  Check,
  AlertCircle,
  Play,
  Columns,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  checkBipartite,
  checkBipartiteRealizabilityBySets,
  checkBipartiteRealizabilityByTotal,
  arrangeBipartiteLayout,
  type BipartiteAnalysisResult,
  type BipartiteRealizabilityResult,
} from "../../utils/graph/bipartite";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface BipartiteModalProps {
  disabled?: boolean;
}

export const BipartiteModal = ({ disabled }: BipartiteModalProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analyze" | "sets" | "total">("analyze");

  // Mode 2: By Sets
  const [n1, setN1] = useState(3);
  const [n2, setN2] = useState(4);
  const [edgesBySets, setEdgesBySets] = useState(6);

  // Mode 3: By Total (n, m)
  const [totalN, setTotalN] = useState(6);
  const [totalM, setTotalM] = useState(7);

  const graphData = useGraphStore((state) => state.data);
  const setGraph = useGraphStore((state) => state.setGraph);
  const appendGraph = useGraphStore((state) => state.appendGraph);

  // Compute live analysis on active canvas graph
  const analysis: BipartiteAnalysisResult = checkBipartite(graphData.nodes, graphData.edges);

  // Compute live realizability for sets mode
  const setsResult: BipartiteRealizabilityResult = checkBipartiteRealizabilityBySets(
    n1,
    n2,
    edgesBySets,
    graphData.nodeCounter
  );

  // Compute live realizability for total mode
  const totalResult: BipartiteRealizabilityResult = checkBipartiteRealizabilityByTotal(
    totalN,
    totalM,
    graphData.nodeCounter
  );

  // Actions
  const handleArrangeBipartite = () => {
    if (!analysis.isBipartite || graphData.nodes.length === 0) return;
    const arranged = arrangeBipartiteLayout(
      graphData.nodes,
      graphData.edges,
      analysis.partition1,
      analysis.partition2,
      graphData.nodeCounter
    );
    setGraph(arranged.nodes, arranged.edges, arranged.nodeCounter);
    toast.success("Arranged graph into 2 vertical bipartite columns!");
    setOpen(false);
  };

  const handleGenerateSetsGraph = () => {
    if (!setsResult.isPossible || !setsResult.graph) {
      toast.error("Cannot generate impossible bipartite graph.");
      return;
    }
    appendGraph(setsResult.graph.nodes, setsResult.graph.edges, setsResult.graph.nodeCounter);
    toast.success(`Generated Bipartite Graph (${n1} + ${n2} vertices, ${edgesBySets} edges)!`);
    setOpen(false);
  };

  const handleGenerateTotalGraph = () => {
    if (!totalResult.isPossible || !totalResult.graph) {
      toast.error("Cannot generate impossible bipartite graph.");
      return;
    }
    appendGraph(totalResult.graph.nodes, totalResult.graph.edges, totalResult.graph.nodeCounter);
    toast.success(`Generated Bipartite Graph (${totalN} vertices, ${totalM} edges)!`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Bipartite Graph Suite"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <Split className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden md:inline">Bipartite</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[490px] max-h-[85vh] overflow-y-auto p-4 bg-(--color-surface) border border-(--color-border) rounded-xl shadow-2xl relative"
      >
        <GrainTexture baseFrequency={3} className="rounded-xl opacity-20 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-(--color-border) mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Split size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-(--color-text)">Bipartite Graph Suite</h3>
              <p className="text-xs text-(--color-text-muted)">
                2-Coloring check, Turán realizability bounds & 2-column layout
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-hover)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-(--color-surface-hover) p-1 rounded-lg mb-3">
          <button
            onClick={() => setActiveTab("analyze")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "analyze"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Analyze Active Graph
          </button>
          <button
            onClick={() => setActiveTab("sets")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "sets"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            By Sets (|V₁|, |V₂|, m)
          </button>
          <button
            onClick={() => setActiveTab("total")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "total"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            By (n, m) Counts
          </button>
        </div>

        {/* TAB 1: ANALYZE ACTIVE GRAPH */}
        {activeTab === "analyze" && (
          <div className="space-y-3">
            {graphData.nodes.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-(--color-border) text-xs text-(--color-text-muted)">
                Canvas is empty. Add nodes or select a preset from the Generate menu.
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "p-3 rounded-lg border space-y-2",
                    analysis.isBipartite
                      ? "border-sky-500/30 bg-sky-500/5"
                      : "border-rose-500/30 bg-rose-500/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {analysis.isBipartite ? (
                        <Check size={15} className="text-sky-500" />
                      ) : (
                        <AlertCircle size={15} className="text-rose-500" />
                      )}
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide",
                          analysis.isBipartite ? "text-sky-500" : "text-rose-500"
                        )}
                      >
                        {analysis.isBipartite
                          ? analysis.isCompleteBipartite
                            ? "Complete Bipartite Graph"
                            : "Bipartite Graph (2-Colorable)"
                          : "Not Bipartite"}
                      </span>
                    </div>

                    {analysis.isBipartite && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">
                        {analysis.partition1.length} + {analysis.partition2.length} nodes
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-(--color-text) leading-relaxed">
                    {analysis.reason}
                  </p>

                  {/* If Bipartite: Show Partitions */}
                  {analysis.isBipartite ? (
                    <div className="space-y-2 border-t border-(--color-border) pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Partition V1 */}
                        <div className="p-2 rounded-md bg-sky-500/10 border border-sky-500/20">
                          <div className="text-[11px] font-semibold text-sky-400 mb-1">
                            Set V₁ ({analysis.partition1.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {analysis.partition1.map((n) => (
                              <span
                                key={n.id}
                                className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-sky-500/20 text-sky-300"
                              >
                                {n.label || `v${n.id}`}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Partition V2 */}
                        <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20">
                          <div className="text-[11px] font-semibold text-rose-400 mb-1">
                            Set V₂ ({analysis.partition2.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {analysis.partition2.map((n) => (
                              <span
                                key={n.id}
                                className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-rose-500/20 text-rose-300"
                              >
                                {n.label || `v${n.id}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleArrangeBipartite}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white"
                      >
                        <Columns size={13} className="mr-1.5" />
                        Rearrange in Bipartite Layout (2 Columns)
                      </Button>
                    </div>
                  ) : (
                    /* If Not Bipartite: Show Odd Cycle */
                    analysis.oddCycleLabels && (
                      <div className="border-t border-(--color-border) pt-2 space-y-1">
                        <span className="text-[11px] font-semibold text-rose-400">
                          Odd Cycle Detected (Length {analysis.oddCycleLength}):
                        </span>
                        <div className="p-1.5 rounded bg-(--color-surface) border border-rose-500/20 font-mono text-xs text-rose-300">
                          {[...analysis.oddCycleLabels, analysis.oddCycleLabels[0]].join(" → ")}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: REALIZABILITY BY SETS (n1, n2, m) */}
        {activeTab === "sets" && (
          <div className="space-y-3">
            <p className="text-xs text-(--color-text-muted)">
              Specify partition set sizes |V₁| and |V₂|, and number of edges. Automatically verifies if a simple bipartite graph can exist without multigraph edges.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium text-(--color-text)">Set |V₁|:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={n1}
                  onChange={(e) => setN1(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-md bg-(--color-surface-hover) border border-(--color-border) text-(--color-text)"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-(--color-text)">Set |V₂|:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={n2}
                  onChange={(e) => setN2(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-md bg-(--color-surface-hover) border border-(--color-border) text-(--color-text)"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-(--color-text)">Edges (m):</label>
                <input
                  type="number"
                  min={0}
                  max={n1 * n2}
                  value={edgesBySets}
                  onChange={(e) => setEdgesBySets(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-md bg-(--color-surface-hover) border border-(--color-border) text-(--color-text)"
                />
              </div>
            </div>

            {/* Live Result */}
            <div
              className={cn(
                "p-3 rounded-lg border space-y-2",
                setsResult.isPossible
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {setsResult.isPossible ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={14} className="text-rose-500" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      setsResult.isPossible ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {setsResult.isPossible ? "Graph is Possible" : "Not Possible"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-(--color-text-muted)">
                  Max Edges: {setsResult.maxPossibleEdges} (K_{n1},{n2})
                </span>
              </div>

              <p className="text-xs text-(--color-text) leading-relaxed">
                {setsResult.reason}
              </p>

              {setsResult.isPossible && (
                <Button
                  size="sm"
                  onClick={handleGenerateSetsGraph}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-1"
                >
                  <Play size={13} className="mr-1.5" />
                  Generate & Load to Canvas
                </Button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REALIZABILITY BY TOTAL (n, m) */}
        {activeTab === "total" && (
          <div className="space-y-3">
            <p className="text-xs text-(--color-text-muted)">
              Input total vertices n and edges m. Verifies if any bipartite graph is possible using Turán's Theorem bound ⌊n²/4⌋.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-(--color-text)">Vertices (n):</label>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={totalN}
                  onChange={(e) => setTotalN(Math.max(2, parseInt(e.target.value, 10) || 2))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-md bg-(--color-surface-hover) border border-(--color-border) text-(--color-text)"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-(--color-text)">Edges (m):</label>
                <input
                  type="number"
                  min={0}
                  max={Math.floor((totalN * totalN) / 4) + 10}
                  value={totalM}
                  onChange={(e) => setTotalM(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-md bg-(--color-surface-hover) border border-(--color-border) text-(--color-text)"
                />
              </div>
            </div>

            {/* Live Result */}
            <div
              className={cn(
                "p-3 rounded-lg border space-y-2",
                totalResult.isPossible
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {totalResult.isPossible ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={14} className="text-rose-500" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      totalResult.isPossible ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {totalResult.isPossible ? "Bipartite Graph Possible" : "Not Possible"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-(--color-text-muted)">
                  Turán Bound: ⌊{totalN}²/4⌋ = {Math.floor((totalN * totalN) / 4)}
                </span>
              </div>

              <p className="text-xs text-(--color-text) leading-relaxed">
                {totalResult.reason}
              </p>

              {totalResult.isPossible && (
                <Button
                  size="sm"
                  onClick={handleGenerateTotalGraph}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-1"
                >
                  <Play size={13} className="mr-1.5" />
                  Generate Bipartition & Load to Canvas
                </Button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
