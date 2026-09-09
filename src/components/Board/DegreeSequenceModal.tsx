import { useState } from "react";
import { Hash, Sparkles, Check, AlertCircle, Play, GitCompare, X } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  checkHavelHakimi,
  generateDegreeSequenceVariants,
  generateSequenceFromVertexEdgeCount,
  type CheckGraphicalResult,
  type RealizationVariant,
} from "../../utils/graph/havelHakimi";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface DegreeSequenceModalProps {
  disabled?: boolean;
}

export const DegreeSequenceModal = ({ disabled }: DegreeSequenceModalProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"active" | "sequence" | "counts">("active");
  const [sequenceInput, setSequenceInput] = useState("3, 3, 2, 2, 2");
  const [numVertices, setNumVertices] = useState(5);
  const [numEdges, setNumEdges] = useState(6);

  const [result, setResult] = useState<CheckGraphicalResult | null>(null);
  const [variants, setVariants] = useState<RealizationVariant[]>([]);

  const nodes = useGraphStore((state) => state.data.nodes);
  const edges = useGraphStore((state) => state.data.edges);
  const appendGraph = useGraphStore((state) => state.appendGraph);

  const getActiveGraphDegrees = (): number[] => {
    return nodes
      .map((node) => (edges.get(node.id) || []).length)
      .sort((a, b) => b - a);
  };

  const parseSequence = (text: string): number[] => {
    return text
      .split(/[\s,]+/)
      .filter((s) => s.trim().length > 0)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  };

  const handleEvaluate = () => {
    let degrees: number[] = [];

    if (mode === "active") {
      if (nodes.length === 0) {
        toast.info("Canvas is empty. Draw or generate a graph first!");
        return;
      }
      degrees = getActiveGraphDegrees();
    } else if (mode === "sequence") {
      degrees = parseSequence(sequenceInput);
    } else {
      const syn = generateSequenceFromVertexEdgeCount(numVertices, numEdges);
      if (!syn.success || !syn.sequence) {
        toast.error(syn.error || "Cannot construct graph with these counts.");
        return;
      }
      degrees = syn.sequence;
      setSequenceInput(degrees.join(", "));
    }

    const check = checkHavelHakimi(degrees);
    setResult(check);

    if (check.isGraphical) {
      const genVariants = generateDegreeSequenceVariants(check.cleanedSequence, 4);
      setVariants(genVariants);
      toast.success(`Found ${genVariants.length} valid graph realization variants!`);
    } else {
      setVariants([]);
      toast.error("Degree sequence is not graphical.");
    }
  };

  const handleRenderVariant = (variant: RealizationVariant, isComplement = false) => {
    const targetGraph = isComplement ? variant.complement : variant.graph;
    appendGraph(targetGraph.nodes, targetGraph.edges, targetGraph.nodeCounter);
    toast.success(
      `Rendered ${isComplement ? "Complement of " : ""}${variant.name} on canvas!`
    );
    setOpen(false);
  };

  const activeDegrees = getActiveGraphDegrees();

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Degree Sequence Realizability"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <Hash className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden md:inline">Degree</span>
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
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-(--color-text)">Degree Sequence Solver</h3>
              <p className="text-[10px] text-(--color-text-muted)">Havel-Hakimi Theorem & Variants</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-(--color-text-muted) hover:text-(--color-text) p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-(--color-paper) p-0.5 rounded-lg border border-(--color-divider) mb-3 shrink-0">
          <button
            onClick={() => setMode("active")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              mode === "active"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Active Graph
          </button>
          <button
            onClick={() => setMode("sequence")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              mode === "sequence"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Custom Sequence
          </button>
          <button
            onClick={() => setMode("counts")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              mode === "counts"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            By (n, m) Counts
          </button>
        </div>

        {/* Inputs */}
        {mode === "active" ? (
          <div className="space-y-2 mb-3 shrink-0 p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider)">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-text-muted)">Active Canvas Graph:</span>
              <span className="font-semibold text-(--color-text)">{nodes.length} Vertices</span>
            </div>
            <div className="font-mono text-xs font-bold text-(--color-accent) bg-(--color-surface) p-2 rounded border border-(--color-divider)">
              {nodes.length > 0 ? `(${activeDegrees.join(", ")})` : "Canvas is empty"}
            </div>
            <p className="text-[10.5px] text-(--color-text-muted)">
              Automatically extracts and analyzes the degree sequence from your current canvas graph.
            </p>
          </div>
        ) : mode === "sequence" ? (
          <div className="space-y-2 mb-3 shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-(--color-text)">Degree Sequence:</label>
              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setSequenceInput("3, 3, 2, 2, 2")}
                  className="px-1.5 py-0.5 rounded bg-(--color-paper) hover:text-(--color-accent) border border-(--color-divider)"
                >
                  [3,3,2,2,2]
                </button>
                <button
                  onClick={() => setSequenceInput("3, 3, 3, 3")}
                  className="px-1.5 py-0.5 rounded bg-(--color-paper) hover:text-(--color-accent) border border-(--color-divider)"
                >
                  K4
                </button>
                <button
                  onClick={() => setSequenceInput("3, 3, 3, 1")}
                  className="px-1.5 py-0.5 rounded bg-(--color-paper) text-red-500 border border-(--color-divider)"
                >
                  Invalid
                </button>
              </div>
            </div>
            <input
              type="text"
              value={sequenceInput}
              onChange={(e) => setSequenceInput(e.target.value)}
              placeholder="e.g. 3, 3, 2, 2, 2 or 4, 3, 3, 2, 2"
              className="w-full bg-(--color-paper) border border-(--color-divider) rounded-lg p-2 text-xs font-mono text-(--color-text) focus:outline-none focus:ring-1 focus:ring-(--color-accent)"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
            <div>
              <label className="text-xs font-medium text-(--color-text)">Vertices (n):</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numVertices}
                onChange={(e) => setNumVertices(parseInt(e.target.value, 10) || 1)}
                className="w-full mt-1 bg-(--color-paper) border border-(--color-divider) rounded-lg p-2 text-xs font-mono text-(--color-text)"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-(--color-text)">Edges (m):</label>
              <input
                type="number"
                min={0}
                max={190}
                value={numEdges}
                onChange={(e) => setNumEdges(parseInt(e.target.value, 10) || 0)}
                className="w-full mt-1 bg-(--color-paper) border border-(--color-divider) rounded-lg p-2 text-xs font-mono text-(--color-text)"
              />
            </div>
          </div>
        )}

        <Button
          size="sm"
          onClick={handleEvaluate}
          className="w-full gap-2 justify-center font-semibold mb-3 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Analyze & Generate Possible Graphs</span>
        </Button>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {result && (
            <div
              className={cn(
                "p-3 rounded-xl border text-xs space-y-1.5",
                result.isGraphical
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              )}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {result.isGraphical ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Graphical Sequence (Possible Graph)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Non-Graphical Sequence (Impossible)</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed opacity-90">{result.reason}</p>

              {/* Havel-Hakimi Reduction Steps */}
              {result.steps.length > 1 && (
                <div className="mt-2 pt-2 border-t border-(--color-divider)/40 space-y-1 text-[11px] font-mono">
                  <span className="font-sans font-semibold text-[10px] uppercase tracking-wider block opacity-70">
                    Havel-Hakimi Reduction Trace:
                  </span>
                  {result.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="opacity-60">{idx + 1}.</span>
                      <span>[{step.sequence.join(", ")}]</span>
                      {step.removedDegree !== undefined && (
                        <span className="text-[10px] opacity-70 font-sans">
                          (remove {step.removedDegree}, subtract 1 from next {step.subtractedCount})
                        </span>
                      )}
                      {step.note && <span className="text-red-500 text-[10px] font-sans">({step.note})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Realization Variants */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase font-bold text-(--color-accent) tracking-wider px-0.5">
                Possible Graph Structures ({variants.length} Variants):
              </div>

              {variants.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-(--color-paper)/80 border border-(--color-divider) flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-xs text-(--color-text)">{v.name}</div>
                    <div className="text-[10px] text-(--color-text-muted)">{v.description}</div>
                    <div className="text-[10px] text-(--color-text-muted) mt-1 font-mono">
                      |V| = {v.graph.nodes.length}, |E| = {result?.edgeCount}, Comp |E'| ={" "}
                      {(v.graph.nodes.length * (v.graph.nodes.length - 1)) / 2 - (result?.edgeCount || 0)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleRenderVariant(v, false)}
                      className="h-6 px-2 text-[11px] gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Canvas</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRenderVariant(v, true)}
                      className="h-6 px-2 text-[11px] gap-1"
                    >
                      <GitCompare className="w-3 h-3 text-pink-500" />
                      <span>Complement</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
