import { useState, useMemo } from "react";
import {
  Shuffle,
  Sparkles,
  Check,
  AlertCircle,
  Columns,
  Play,
  X,
  ArrowRight,
  Type,
  Layers,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  generateIsomorphicGraph,
  checkIsomorphism,
  extractConnectedComponents,
  formatIsomorphismAnnotation,
  type GeneratedIsomorphicResult,
  type IsomorphismCheckResult,
} from "../../utils/graph/isomorphism";
import {
  generateCycle,
  generateComplete,
  generatePetersen,
  generateCompleteBipartiteK33,
} from "../../utils/graph/graphGenerator";
import { countUniqueEdges } from "../../utils/graph/complementGraph";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface IsomorphismModalProps {
  disabled?: boolean;
}

export const IsomorphismModal = ({ disabled }: IsomorphismModalProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"check" | "generate">("check");

  // State for Canvas comparison & presets
  const [selectedComp1, setSelectedComp1] = useState<number>(1);
  const [selectedComp2, setSelectedComp2] = useState<number>(2);
  const [targetPreset, setTargetPreset] = useState<string>("c5");
  const [checkResult, setCheckResult] = useState<IsomorphismCheckResult | null>(null);

  // State for Isomorphism Generator
  const [isoResult, setIsoResult] = useState<GeneratedIsomorphicResult | null>(null);

  const nodes = useGraphStore((state) => state.data.nodes);
  const edges = useGraphStore((state) => state.data.edges);
  const nodeCounter = useGraphStore((state) => state.data.nodeCounter);
  const setGraph = useGraphStore((state) => state.setGraph);
  const addTextBox = useGraphStore((state) => state.addTextBox);

  // Detect connected components on the canvas
  const components = useMemo(() => {
    return extractConnectedComponents(nodes, edges);
  }, [nodes, edges]);

  // Adjust selection if component count changes
  const comp1 = components.find((c) => c.id === selectedComp1) || components[0];
  const comp2 = components.find((c) => c.id === selectedComp2) || components[1];

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
      toast.success("Rendered both isomorphic graphs side-by-side on canvas!");
    }
    setOpen(false);
  };

  // 1-click action when only 1 graph is on canvas: automatically place twin side-by-side
  const handlePlaceTwinSideBySide = () => {
    if (nodes.length === 0) return;
    const twin = generateIsomorphicGraph(nodes, edges, nodeCounter);
    // Find rightmost point of current nodes
    const maxX = Math.max(...nodes.map((n) => n.x));
    const separation = 340;
    const offsetX = maxX + separation - Math.min(...twin.graph.nodes.map((n) => n.x));

    const shiftedTwinNodes = twin.graph.nodes.map((n) => ({
      ...n,
      x: n.x + offsetX,
    }));

    // Update edge coordinates for shifted nodes
    const shiftedTwinEdges = new Map<number, typeof edges extends Map<number, infer V> ? V : never>();
    const nodePos = new Map(shiftedTwinNodes.map((n) => [n.id, n]));

    twin.graph.edges.forEach((list, u) => {
      const uNode = nodePos.get(u);
      if (!uNode) return;
      const updated = list.map((e) => {
        const vNode = nodePos.get(e.to);
        return {
          ...e,
          x1: uNode.x,
          y1: uNode.y,
          x2: vNode ? vNode.x : e.x2,
          y2: vNode ? vNode.y : e.y2,
          nodeX2: vNode ? vNode.x : e.nodeX2,
          nodeY2: vNode ? vNode.y : e.nodeY2,
        };
      });
      shiftedTwinEdges.set(u, updated);
    });

    const combinedNodes = [...nodes, ...shiftedTwinNodes];
    const combinedEdges = new Map(edges);
    shiftedTwinEdges.forEach((list, id) => combinedEdges.set(id, list));

    setGraph(combinedNodes, combinedEdges, twin.graph.nodeCounter);
    toast.success("Placed isomorphic twin on canvas! You now have 2 graphs to test.");
  };

  const handleCheckCanvasGraphs = () => {
    if (!comp1 || !comp2) {
      toast.info("Need 2 components on canvas to compare!");
      return;
    }

    const res = checkIsomorphism(comp1, comp2);
    setCheckResult(res);

    if (res.isIsomorphic) {
      toast.success("Graphs on canvas are ISOMORPHIC!");
    } else {
      toast.error("Graphs on canvas are NOT isomorphic.");
    }
  };

  const handleCheckPreset = () => {
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

    const sourceGraph = components.length > 0 ? components[0] : { nodes, edges };
    const res = checkIsomorphism(sourceGraph, compareGraph);
    setCheckResult(res);

    if (res.isIsomorphic) {
      toast.success("Graphs are Isomorphic!");
    } else {
      toast.error("Graphs are NOT Isomorphic.");
    }
  };

  const handleWriteToCanvas = () => {
    if (!checkResult) {
      toast.info("Run an isomorphism check first!");
      return;
    }

    let targetX = 0;
    let targetY = -120;

    if (components.length >= 2 && comp1 && comp2) {
      targetX = Math.round((comp1.center.x + comp2.center.x) / 2) - 80;
      targetY = Math.min(comp1.center.y, comp2.center.y) - 130;
    } else if (components.length === 1) {
      targetX = components[0].center.x - 70;
      targetY = components[0].center.y - 120;
    }

    const g1Label = comp1?.label.split(" ")[1] || "G1";
    const g2Label = comp2?.label.split(" ")[1] || "G2";
    const annotationText = formatIsomorphismAnnotation(checkResult, g1Label, g2Label);

    addTextBox({
      x: targetX,
      y: targetY,
      text: annotationText,
      fontSize: 14,
      backgroundColor: checkResult.isIsomorphic ? "badge" : "card",
      color: checkResult.isIsomorphic ? "#10b981" : "#ef4444",
    });

    toast.success("Written isomorphism verdict to canvas as text annotation!");
    setOpen(false);
  };

  const handleWriteSingleGraphNote = () => {
    if (components.length === 0) return;
    const c = components[0];
    const text = [
      `Graph G1 (${c.nodes.length} vertices, ${countUniqueEdges(c.edges)} edges)`,
      `Degree Sequence: [${c.nodes.map(n => (c.edges.get(n.id) || []).length).sort((a,b)=>b-a).join(", ")}]`,
      `Note: Draw a 2nd graph or click "Place Twin" to test isomorphism.`,
    ].join("\n");

    addTextBox({
      x: c.center.x - 80,
      y: c.center.y - 120,
      text,
      fontSize: 13,
      backgroundColor: "card",
    });

    toast.success("Written graph summary to canvas!");
    setOpen(false);
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
            <span className="hidden xl:inline">Isomorphism</span>
            <span className="hidden md:inline xl:hidden">Iso</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(450px,calc(100vw-1.5rem))] max-h-[min(600px,calc(100dvh-4rem))] p-4 bg-(--color-surface) border border-(--color-divider) rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
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
              <p className="text-[10px] text-(--color-text-muted)">Multi-Graph Canvas Detection & Invariant Checker</p>
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
            onClick={() => setTab("check")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              tab === "check"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Check Canvas Isomorphism
          </button>
          <button
            onClick={() => setTab("generate")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              tab === "generate"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Generate Twin
          </button>
        </div>

        {/* Tab 1: Check Isomorphism with Canvas Detection */}
        {tab === "check" ? (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs">
            {/* Canvas Graphs Status Box */}
            <div className="p-2.5 rounded-xl border border-(--color-divider) bg-(--color-paper)/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-(--color-text)">
                  <Layers className="w-3.5 h-3.5 text-(--color-accent)" />
                  <span>Canvas Graphs Analysis</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-(--color-accent)/10 text-(--color-accent)">
                  {components.length} {components.length === 1 ? "Graph" : "Graphs"} on Canvas
                </span>
              </div>

              {components.length === 0 && (
                <p className="text-(--color-text-muted) text-[11px]">
                  Canvas is empty. Draw or generate nodes and edges to begin isomorphism analysis.
                </p>
              )}

              {components.length === 1 && (
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Only 1 graph detected on canvas ({components[0].nodes.length} vertices, {countUniqueEdges(components[0].edges)} edges).</p>
                      <p className="opacity-90">Isomorphism testing requires two separate graphs ($G_1$ and $G_2$) to compare.</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handlePlaceTwinSideBySide}
                      className="flex-1 gap-1.5 text-xs font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Place Twin on Canvas</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleWriteSingleGraphNote}
                      className="gap-1.5 text-xs"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Write Note</span>
                    </Button>
                  </div>
                </div>
              )}

              {components.length === 2 && (
                <div className="space-y-2">
                  <p className="text-(--color-text-muted) text-[11px]">
                    2 separate graphs detected! Compare <strong>{components[0].label}</strong> against <strong>{components[1].label}</strong>.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-(--color-surface) border border-(--color-divider) text-[11px]">
                      <span className="font-bold text-blue-500">Graph G1</span>
                      <p className="text-(--color-text-muted)">{components[0].nodes.length} vertices, {countUniqueEdges(components[0].edges)} edges</p>
                    </div>
                    <div className="p-2 rounded-lg bg-(--color-surface) border border-(--color-divider) text-[11px]">
                      <span className="font-bold text-pink-500">Graph G2</span>
                      <p className="text-(--color-text-muted)">{components[1].nodes.length} vertices, {countUniqueEdges(components[1].edges)} edges</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleCheckCanvasGraphs}
                    className="w-full gap-2 justify-center font-bold"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Check Isomorphism Between Canvas Graphs</span>
                  </Button>
                </div>
              )}

              {components.length > 2 && (
                <div className="space-y-2">
                  <p className="text-(--color-text-muted) text-[11px]">
                    Multiple graphs found on canvas. Select which two to test:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedComp1}
                      onChange={(e) => setSelectedComp1(Number(e.target.value))}
                      className="bg-(--color-surface) border border-(--color-divider) rounded-lg p-1.5 text-xs"
                    >
                      {components.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedComp2}
                      onChange={(e) => setSelectedComp2(Number(e.target.value))}
                      className="bg-(--color-surface) border border-(--color-divider) rounded-lg p-1.5 text-xs"
                    >
                      {components.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleCheckCanvasGraphs}
                    disabled={selectedComp1 === selectedComp2}
                    className="w-full gap-2 justify-center font-bold"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Compare Selected Graphs</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Alternative: Compare with Preset Library */}
            <div className="pt-1">
              <details className="group">
                <summary className="cursor-pointer text-[11px] font-semibold text-(--color-text-muted) hover:text-(--color-text) flex items-center justify-between">
                  <span>Or compare against standard library presets (C5, K4, Petersen...)</span>
                  <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-2 space-y-2">
                  <select
                    value={targetPreset}
                    onChange={(e) => setTargetPreset(e.target.value)}
                    className="w-full bg-(--color-paper) border border-(--color-divider) rounded-lg p-1.5 text-xs text-(--color-text)"
                  >
                    <option value="c5">5-Cycle Graph C5</option>
                    <option value="k4">Complete Graph K4</option>
                    <option value="petersen">Petersen Graph (10 vertices)</option>
                    <option value="k33">Utility Graph K3,3</option>
                    {isoResult && <option value="twin">Generated Isomorphic Twin</option>}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCheckPreset}
                    disabled={nodes.length === 0}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Check against Preset</span>
                  </Button>
                </div>
              </details>
            </div>

            {/* Check Results */}
            {checkResult && (
              <div
                className={cn(
                  "p-3 rounded-xl border text-xs space-y-2 animate-in fade-in-50 duration-200",
                  checkResult.isIsomorphic
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {checkResult.isIsomorphic ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>ISOMORPHIC ($G_1 \cong G_2$)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>NOT ISOMORPHIC ($G_1 \not\cong G_2$)</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleWriteToCanvas}
                    className="h-7 px-2 text-[11px] gap-1 bg-(--color-surface) text-(--color-text) hover:bg-(--color-paper)"
                  >
                    <Type className="w-3.5 h-3.5 text-(--color-accent)" />
                    <span>Write to Canvas</span>
                  </Button>
                </div>

                <p className="leading-relaxed opacity-95 text-[11px]">{checkResult.reason}</p>

                {/* Invariant Summary */}
                <div className="p-2 rounded-lg bg-(--color-surface)/90 border border-(--color-divider)/50 text-[11px] text-(--color-text) space-y-1 font-mono">
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
                      Vertex Bijection Mapping:
                    </span>
                    <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                      {checkResult.mappingDisplay.map((m) => (
                        <div
                          key={m.fromId}
                          className="px-2 py-0.5 rounded bg-(--color-surface) text-[11px] font-mono flex items-center justify-between"
                        >
                          <span className="font-bold text-blue-500">{m.fromLabel}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                          <span className="font-bold text-pink-500">{m.toLabel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Generate Isomorphic Twin */
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
        )}
      </PopoverContent>
    </Popover>
  );
};
