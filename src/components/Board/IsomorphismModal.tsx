import { useState } from "react";
import {
  Shuffle,
  Sparkles,
  Check,
  AlertCircle,
  Columns,
  Play,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  generateIsomorphicGraph,
  checkIsomorphism,
  type GeneratedIsomorphicResult,
  type IsomorphismCheckResult,
} from "../../utils/graph/isomorphism";
import {
  generateCycle,
  generateComplete,
  generatePetersen,
  generateCompleteBipartiteK33,
} from "../../utils/graph/graphGenerator";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface IsomorphismModalProps {
  disabled?: boolean;
}

export const IsomorphismModal = ({ disabled }: IsomorphismModalProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"generate" | "check">("generate");

  // State for Isomorphism Generator
  const [isoResult, setIsoResult] = useState<GeneratedIsomorphicResult | null>(null);

  // State for Isomorphism Checker
  const [targetPreset, setTargetPreset] = useState<string>("c5");
  const [checkResult, setCheckResult] = useState<IsomorphismCheckResult | null>(null);

  const nodes = useGraphStore((state) => state.data.nodes);
  const edges = useGraphStore((state) => state.data.edges);
  const nodeCounter = useGraphStore((state) => state.data.nodeCounter);
  const setGraph = useGraphStore((state) => state.setGraph);

  const handleGenerateTwin = () => {
    if (nodes.length === 0) {
      toast.info("Please create or generate a graph first!");
      return;
    }
    const result = generateIsomorphicGraph(nodes, edges, nodeCounter);
    setIsoResult(result);
    toast.success(`Generated isomorphic twin with ${result.mappingDisplay.length} vertices!`);
  };

  const handleRenderTwinOnCanvas = (sideBySide = false) => {
    if (!isoResult) return;

    if (!sideBySide) {
      setGraph(isoResult.graph.nodes, isoResult.graph.edges, isoResult.graph.nodeCounter);
      toast.success("Rendered isomorphic graph on canvas!");
    } else {
      // Place both side-by-side
      const separation = 360;
      const leftNodes = nodes.map((n) => ({ ...n, x: n.x - separation / 2 }));
      const rightNodes = isoResult.graph.nodes.map((n) => ({ ...n, x: n.x + separation / 2 }));

      const combinedNodes = [...leftNodes, ...rightNodes];
      const combinedEdges = new Map(edges);
      isoResult.graph.edges.forEach((list, id) => {
        combinedEdges.set(id, list);
      });

      setGraph(combinedNodes, combinedEdges, isoResult.graph.nodeCounter);
      toast.success("Rendered both isomorphic graphs side-by-side for direct visual comparison!");
    }
    setOpen(false);
  };

  const handleRunCheck = () => {
    if (nodes.length === 0) {
      toast.info("Please draw or generate a graph first!");
      return;
    }

    let compareGraph: any = null;
    if (targetPreset === "c5") {
      compareGraph = generateCycle(5);
    } else if (targetPreset === "k4") {
      compareGraph = generateComplete(4);
    } else if (targetPreset === "petersen") {
      compareGraph = generatePetersen();
    } else if (targetPreset === "k33") {
      compareGraph = generateCompleteBipartiteK33();
    } else if (targetPreset === "twin" && isoResult) {
      compareGraph = isoResult.graph;
    } else {
      compareGraph = generateCycle(nodes.length);
    }

    const res = checkIsomorphism({ nodes, edges }, compareGraph);
    setCheckResult(res);

    if (res.isIsomorphic) {
      toast.success("Graphs are Isomorphic!");
    } else {
      toast.error("Graphs are NOT Isomorphic.");
    }
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Graph Isomorphism Suite"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <Shuffle className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden md:inline">Isomorphism</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-[430px] max-h-[580px] p-4 bg-(--color-surface) border border-(--color-divider) rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
        align="center"
        sideOffset={12}
      >
        <GrainTexture className="rounded-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-(--color-divider) mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-(--color-accent)/10 text-(--color-accent)">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-(--color-text)">Graph Isomorphism ($G_1 \cong G_2$)</h3>
              <p className="text-[10px] text-(--color-text-muted)">Bijection Generator & Invariant Checker</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-(--color-text-muted) hover:text-(--color-text) p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-(--color-paper) p-0.5 rounded-lg border border-(--color-divider) mb-3 shrink-0">
          <button
            onClick={() => setTab("generate")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              tab === "generate"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Generate Isomorphic Twin
          </button>
          <button
            onClick={() => setTab("check")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              tab === "check"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Check Isomorphism
          </button>
        </div>

        {/* Tab 1: Generate Isomorphic Twin */}
        {tab === "generate" ? (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <p className="text-xs text-(--color-text-muted) leading-relaxed">
              Creates an exact structural duplicate of your active graph with a <strong>randomized vertex permutation</strong> and rotated circular layout, demonstrating that isomorphic graphs have identical connection topologies despite different visual appearances.
            </p>

            <Button
              size="sm"
              onClick={handleGenerateTwin}
              disabled={nodes.length === 0}
              className="w-full gap-2 justify-center font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Isomorphic Twin for Canvas Graph</span>
            </Button>

            {isoResult && (
              <div className="p-3 rounded-xl bg-(--color-paper)/80 border border-(--color-divider) space-y-2 text-xs">
                <div className="font-bold text-xs text-(--color-accent) flex items-center justify-between">
                  <span>Isomorphic Bijection Mapping ($\pi: V \to V'$)</span>
                  <span className="text-[10px] text-(--color-text-muted)">{isoResult.mappingDisplay.length} vertices</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 border border-(--color-divider) rounded-lg bg-(--color-surface)">
                  {isoResult.mappingDisplay.map((m) => (
                    <div
                      key={m.fromId}
                      className="flex items-center justify-between px-2 py-1 rounded bg-(--color-paper) text-[11px] font-mono"
                    >
                      <span className="font-bold text-blue-500">{m.fromLabel}</span>
                      <ArrowRight className="w-3 h-3 text-(--color-text-muted)" />
                      <span className="font-bold text-pink-500">{m.toLabel}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleRenderTwinOnCanvas(true)}
                    className="flex-1 gap-1.5 text-xs font-medium"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Compare Side-by-Side</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRenderTwinOnCanvas(false)}
                    className="flex-1 gap-1.5 text-xs font-medium"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Replace Canvas</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Check Isomorphism */
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs">
            <p className="text-(--color-text-muted) leading-relaxed">
              Compares your active canvas graph $G_1$ against a target graph $G_2$ using vertex, edge, degree-sequence invariants and exact adjacency-matrix bijection solving.
            </p>

            <div className="space-y-1.5">
              <label className="font-semibold text-(--color-text)">Compare Canvas Graph against:</label>
              <select
                value={targetPreset}
                onChange={(e) => setTargetPreset(e.target.value)}
                className="w-full bg-(--color-paper) border border-(--color-divider) rounded-lg p-2 text-xs text-(--color-text)"
              >
                <option value="c5">5-Cycle Graph C5</option>
                <option value="k4">Complete Graph K4</option>
                <option value="petersen">Petersen Graph (10 vertices)</option>
                <option value="k33">Utility Graph K3,3</option>
                {isoResult && <option value="twin">Generated Isomorphic Twin</option>}
              </select>
            </div>

            <Button
              size="sm"
              onClick={handleRunCheck}
              disabled={nodes.length === 0}
              className="w-full gap-2 justify-center font-semibold"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Check Isomorphism (Invariant & Bijection Test)</span>
            </Button>

            {checkResult && (
              <div
                className={cn(
                  "p-3 rounded-xl border text-xs space-y-2",
                  checkResult.isIsomorphic
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {checkResult.isIsomorphic ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Graphs are ISOMORPHIC ($G_1 \cong G_2$)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Graphs are NOT Isomorphic ($G_1 \not\cong G_2$)</span>
                    </>
                  )}
                </div>

                <p className="leading-relaxed opacity-95">{checkResult.reason}</p>

                {/* Invariant Summary */}
                <div className="p-2 rounded-lg bg-(--color-surface)/80 border border-(--color-divider)/50 text-[11px] text-(--color-text) space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Vertices |V|:</span>
                    <span>G1: {checkResult.invariants.v1} | G2: {checkResult.invariants.v2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Edges |E|:</span>
                    <span>G1: {checkResult.invariants.e1} | G2: {checkResult.invariants.e2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deg Seq (G1):</span>
                    <span>[{checkResult.invariants.degreeSeq1.slice(0, 6).join(", ")}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deg Seq (G2):</span>
                    <span>[{checkResult.invariants.degreeSeq2.slice(0, 6).join(", ")}]</span>
                  </div>
                </div>

                {/* Bijection Display */}
                {checkResult.mappingDisplay && checkResult.mappingDisplay.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-semibold text-[10px] uppercase tracking-wider block opacity-70">
                      Discovered Bijection Mapping:
                    </span>
                    <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                      {checkResult.mappingDisplay.map((m) => (
                        <div
                          key={m.fromId}
                          className="px-2 py-0.5 rounded bg-(--color-surface) text-[11px] font-mono flex items-center justify-between"
                        >
                          <span className="font-bold">{m.fromLabel}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                          <span className="font-bold">{m.toLabel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
