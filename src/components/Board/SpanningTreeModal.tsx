import { useState } from "react";
import {
  TreePine,
  Calculator,
  Layers,
  BookOpen,
  Sparkles,
  Check,
  AlertCircle,
  FileText,
  X,
  Play,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  calculateCayleysFormula,
  analyzeGraphSpanningTrees,
  applyTreeEdgesToGraph,
  formatSpanningTreeAnnotation,
  type SpanningTreeItem,
} from "../../utils/graph/spanningTree";
import { generateComplete } from "../../utils/graph/graphGenerator";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface SpanningTreeModalProps {
  disabled?: boolean;
}

export const SpanningTreeModal = ({ disabled }: SpanningTreeModalProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"calculator" | "active" | "browse" | "theory">("calculator");

  // Calculator State
  const [vertexInput, setVertexInput] = useState<number>(5);

  const graphData = useGraphStore((state) => state.data);
  const setGraph = useGraphStore((state) => state.setGraph);
  const addTextBox = useGraphStore((state) => state.addTextBox);

  // Live Cayley Calculation
  const cayleyResult = calculateCayleysFormula(vertexInput);

  // Live Analysis of Active Canvas Graph
  const graphAnalysis = analyzeGraphSpanningTrees(graphData.nodes, graphData.edges);

  // Generate Kn on canvas
  const handleGenerateCompleteGraph = (n: number) => {
    if (n < 1 || n > 12) {
      toast.error("Please choose n between 1 and 12 for canvas display.");
      return;
    }
    const generated = generateComplete(n);
    setGraph(generated.nodes, generated.edges, generated.nodeCounter);
    toast.success(`Generated Complete Graph K_${n} (${n} vertices, ${(n * (n - 1)) / 2} edges)!`);
    setActiveTab("active");
  };

  // Isolate MST on canvas
  const handleIsolateMST = () => {
    if (!graphAnalysis.mst || !graphAnalysis.isConnected) {
      toast.error("Graph must be connected to extract a Minimum Spanning Tree.");
      return;
    }
    const updated = applyTreeEdgesToGraph(
      graphData.nodes,
      graphAnalysis.mst.edges,
      graphData.nodeCounter
    );
    setGraph(updated.nodes, updated.edges, updated.nodeCounter);
    toast.success(`Isolated Minimum Spanning Tree (Total Weight: ${graphAnalysis.mst.totalWeight})!`);
  };

  // Apply a specific enumerated spanning tree to canvas
  const handleApplyTree = (tree: SpanningTreeItem) => {
    const updated = applyTreeEdgesToGraph(
      graphData.nodes,
      tree.edges,
      graphData.nodeCounter
    );
    setGraph(updated.nodes, updated.edges, updated.nodeCounter);
    toast.success(`Applied Spanning Tree #${tree.id} to canvas!`);
  };

  // Annotate on canvas
  const handleAnnotateCanvas = () => {
    if (graphData.nodes.length === 0) {
      toast.error("Canvas is empty. Draw or generate a graph first!");
      return;
    }
    let targetX = 100;
    let targetY = 100;
    if (graphData.nodes.length > 0) {
      const avgX = graphData.nodes.reduce((acc, n) => acc + n.x, 0) / graphData.nodes.length;
      const minY = Math.min(...graphData.nodes.map((n) => n.y));
      targetX = avgX - 140;
      targetY = minY - 130;
    }

    const annotation = formatSpanningTreeAnnotation(graphAnalysis);
    addTextBox({
      x: targetX,
      y: targetY,
      text: annotation,
      fontSize: 13,
      backgroundColor: graphAnalysis.isConnected ? "badge" : "card",
      color: graphAnalysis.isConnected ? "#10b981" : "#ef4444",
    });

    toast.success("Written Spanning Tree analysis to canvas!");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Spanning Tree Suite"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <TreePine className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="hidden lg:inline">Spanning Tree</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(520px,calc(100vw-1.5rem))] max-h-[min(650px,88vh)] overflow-y-auto p-4 bg-(--color-surface) border border-(--color-border) rounded-xl shadow-2xl relative"
      >
        <GrainTexture baseFrequency={3} className="rounded-xl opacity-20 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-(--color-border) mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TreePine size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-(--color-text)">Spanning Tree Suite</h3>
              <p className="text-xs text-(--color-text-muted)">
                Cayley's formula ($n^{'{n-2}'}$), Kirchhoff's Matrix-Tree, MST & Enumeration
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

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-(--color-surface-hover) rounded-lg mb-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("calculator")}
            className={cn(
              "py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "calculator"
                ? "bg-(--color-surface) text-(--color-text) shadow-xs font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <Calculator size={13} />
            <span>Vertices</span>
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "active"
                ? "bg-(--color-surface) text-(--color-text) shadow-xs font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <Sparkles size={13} />
            <span>Canvas & MST</span>
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={cn(
              "py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "browse"
                ? "bg-(--color-surface) text-(--color-text) shadow-xs font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <Layers size={13} />
            <span>Different Trees</span>
          </button>
          <button
            onClick={() => setActiveTab("theory")}
            className={cn(
              "py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "theory"
                ? "bg-(--color-surface) text-(--color-text) shadow-xs font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <BookOpen size={13} />
            <span>Concept</span>
          </button>
        </div>

        {/* TAB 1: VERTEX CALCULATOR (CAYLEY'S THEOREM) */}
        {activeTab === "calculator" && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-(--color-surface-hover)/60 border border-(--color-border) text-xs">
              <span className="font-semibold text-(--color-text)">Cayley's Tree Formula ($K_n$):</span>
              <p className="text-(--color-text-muted) mt-0.5">
                Every labeled complete graph on $n$ vertices has exactly{" "}
                <span className="text-emerald-500 font-mono font-semibold">n^(n-2)</span> distinct
                spanning trees, each containing exactly{" "}
                <span className="text-emerald-500 font-mono font-semibold">n - 1</span> edges.
              </p>
            </div>

            {/* Vertex Input Controls */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-(--color-text) mb-1.5">
                <span>Enter Number of Vertices ($n$):</span>
                <span className="font-mono text-emerald-500 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded">
                  n = {vertexInput}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                value={vertexInput}
                onChange={(e) => setVertexInput(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between items-center text-[10px] text-(--color-text-muted) mt-1">
                <span>1 vertex</span>
                <div className="flex gap-1.5">
                  {[3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      onClick={() => setVertexInput(num)}
                      className={cn(
                        "px-1.5 py-0.5 rounded border border-(--color-border) text-[10px]",
                        vertexInput === num
                          ? "bg-emerald-500 text-white border-emerald-500 font-bold"
                          : "hover:bg-(--color-surface-hover)"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <span>15 vertices</span>
              </div>
            </div>

            {/* Computation Results Card */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Total Distinct Spanning Trees in $K_{vertexInput}$
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-500 mt-0.5">
                    {BigInt(cayleyResult.treesCount).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-(--color-text-muted)">Formula breakdown</div>
                  <div className="text-xs font-mono font-semibold text-(--color-text) mt-0.5">
                    {cayleyResult.formulaDisplay}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-xs">
                <div className="p-2 rounded bg-(--color-surface) border border-(--color-border)">
                  <span className="text-[10px] text-(--color-text-muted) block">Edges in each tree ($n - 1$)</span>
                  <span className="font-mono font-bold text-sm text-(--color-text)">
                    {cayleyResult.edgesPerTree} edges
                  </span>
                </div>
                <div className="p-2 rounded bg-(--color-surface) border border-(--color-border)">
                  <span className="text-[10px] text-(--color-text-muted) block">Total edges in $K_{vertexInput}$</span>
                  <span className="font-mono font-bold text-sm text-(--color-text)">
                    {cayleyResult.totalCompleteEdges} edges
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={() => handleGenerateCompleteGraph(vertexInput)}
                className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Play size={13} />
                <span>Generate $K_{vertexInput}$ on Canvas</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE CANVAS GRAPH ANALYSIS & MST */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {graphData.nodes.length === 0 ? (
              <div className="p-6 text-center text-xs text-(--color-text-muted) border border-dashed border-(--color-border) rounded-xl">
                Canvas is empty. Draw a graph or generate one from the Vertices tab to analyze spanning trees.
              </div>
            ) : (
              <>
                {/* Status Alert */}
                <div
                  className={cn(
                    "p-3 rounded-lg border text-xs flex items-start gap-2.5",
                    graphAnalysis.isConnected
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {graphAnalysis.isConnected ? (
                    <Check size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {graphAnalysis.isConnected
                        ? `Connected Graph (${graphAnalysis.vertexCount} vertices, ${graphAnalysis.edgeCount} edges)`
                        : `Disconnected Graph (${graphAnalysis.vertexCount} vertices)`}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      {graphAnalysis.isConnected
                        ? `Kirchhoff's Matrix Tree Theorem calculates exactly ${graphAnalysis.spanningTreeCount.toLocaleString()} spanning tree(s).`
                        : "Spanning trees require the graph to be connected. Disconnected graphs have 0 spanning trees."}
                    </div>
                  </div>
                </div>

                {/* Spanning Tree Stats */}
                {graphAnalysis.isConnected && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-(--color-border) bg-(--color-surface-hover)/50">
                      <div className="text-[10px] text-(--color-text-muted)">Total Spanning Trees $\tau(G)$</div>
                      <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
                        {graphAnalysis.spanningTreeCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-(--color-text-muted) mt-0.5">
                        {"det(L*) = det(Cofactor(D - A))"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-(--color-border) bg-(--color-surface-hover)/50">
                      <div className="text-[10px] text-(--color-text-muted)">Tree Edges Required</div>
                      <div className="text-xl font-bold font-mono text-(--color-text) mt-1">
                        {graphAnalysis.vertexCount - 1} edges
                      </div>
                      <div className="text-[10px] text-(--color-text-muted) mt-0.5">
                        Acyclic & spanning all $V$
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimum Spanning Tree (MST) Card */}
                {graphAnalysis.mst && (
                  <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-500 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        Minimum Spanning Tree (MST)
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-500">
                        Weight $\sum w$ = {graphAnalysis.mst.totalWeight}
                      </span>
                    </div>

                    <div className="text-[11px] text-(--color-text-muted)">
                      Optimal tree spanning all {graphAnalysis.vertexCount} vertices using {graphAnalysis.mst.edges.length} edges:
                    </div>

                    {/* Edge Tags */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {graphAnalysis.mst.edges.map((e, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded bg-(--color-surface) border border-(--color-border) text-[11px] font-mono"
                        >
                          {e.fromLabel} — {e.toLabel}{" "}
                          <span className="text-sky-500 font-semibold">(w={e.weight})</span>
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        onClick={handleIsolateMST}
                        size="sm"
                        className="w-full text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white gap-1.5"
                      >
                        <TreePine size={13} />
                        <span>Isolate MST on Canvas</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Annotation Button */}
                <Button
                  onClick={handleAnnotateCanvas}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 gap-1.5"
                >
                  <FileText size={13} />
                  <span>Write Spanning Tree Verdict to Canvas</span>
                </Button>
              </>
            )}
          </div>
        )}

        {/* TAB 3: BROWSE DIFFERENT SPANNING TREES */}
        {activeTab === "browse" && (
          <div className="space-y-3">
            <div className="text-xs text-(--color-text-muted) flex items-center justify-between">
              <span>
                Found {graphAnalysis.spanningTrees.length} distinct spanning tree(s)
                {graphAnalysis.spanningTreeCount > 50 && " (showing first 50)"}:
              </span>
            </div>

            {graphAnalysis.spanningTrees.length === 0 ? (
              <div className="p-6 text-center text-xs text-(--color-text-muted) border border-dashed border-(--color-border) rounded-xl">
                {graphData.nodes.length === 0
                  ? "Canvas is empty. Draw or generate a graph to enumerate trees."
                  : "No spanning trees found (graph might be disconnected or has insufficient edges)."}
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {graphAnalysis.spanningTrees.map((tree) => {
                  const isMST = graphAnalysis.mst && tree.totalWeight === graphAnalysis.mst.totalWeight;
                  return (
                    <div
                      key={tree.id}
                      className={cn(
                        "p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors",
                        isMST
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : "bg-(--color-surface) border-(--color-border) hover:bg-(--color-surface-hover)"
                      )}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-(--color-text)">
                            Tree #{tree.id}
                          </span>
                          {isMST && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500 font-bold">
                              MST
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-(--color-text-muted)">
                            Weight: {tree.totalWeight}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-(--color-text-muted) truncate">
                          {tree.edges.map((e) => `${e.fromLabel}-${e.toLabel}`).join(", ")}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleApplyTree(tree)}
                        className="h-7 px-2.5 text-[11px] shrink-0 gap-1 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        <Play size={10} />
                        <span>Apply</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONCEPT & THEORY */}
        {activeTab === "theory" && (
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3 rounded-lg bg-(--color-surface-hover)/60 border border-(--color-border) space-y-1.5">
              <h4 className="font-bold text-(--color-text) flex items-center gap-1.5">
                <TreePine size={14} className="text-emerald-500" />
                1. What is a Spanning Tree?
              </h4>
              <p className="text-(--color-text-muted)">
                A <strong>Spanning Tree</strong> of an undirected graph $G = (V, E)$ is a connected subgraph
                that includes <em>all</em> vertices $V$ of $G$ and is a tree.
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-(--color-text-muted)">
                <li>Contains all $|V| = n$ vertices.</li>
                <li>Contains exactly $n - 1$ edges.</li>
                <li>Has no cycles (acyclic).</li>
                <li>Removing any edge disconnects it; adding any edge creates a unique cycle.</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-(--color-surface-hover)/60 border border-(--color-border) space-y-1.5">
              <h4 className="font-bold text-(--color-text) flex items-center gap-1.5">
                <Calculator size={14} className="text-sky-500" />
                2. Cayley's Formula ($n^{'{n-2}'}$)
              </h4>
              <p className="text-(--color-text-muted)">
                Proved by Arthur Cayley in 1889 (and bijectively with Prüfer sequences):
                For a complete graph $K_n$, the number of distinct labeled spanning trees is:
              </p>
              <div className="p-2 rounded bg-(--color-surface) border border-(--color-border) font-mono text-center text-emerald-500 font-bold">
                $\tau(K_n) = n^{'{n-2}'}$
              </div>
              <p className="text-[11px] text-(--color-text-muted)">
                Example: For $n = 4$, $4^{'{4-2}'} = 4^2 = 16$ trees. For $n = 5$, $5^3 = 125$ trees.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-(--color-surface-hover)/60 border border-(--color-border) space-y-1.5">
              <h4 className="font-bold text-(--color-text) flex items-center gap-1.5">
                <Layers size={14} className="text-purple-500" />
                3. Kirchhoff's Matrix-Tree Theorem
              </h4>
              <p className="text-(--color-text-muted)">
                For <em>any</em> arbitrary graph $G$:
              </p>
              <ol className="list-decimal pl-4 space-y-0.5 text-(--color-text-muted)">
                <li>Build Degree Matrix $D$ and Adjacency Matrix $A$.</li>
                <li>Construct the Laplacian Matrix $L = D - A$.</li>
                <li>Delete any row $i$ and column $i$ to get reduced matrix $L^*$.</li>
                <li>The exact number of spanning trees is $\tau(G) = \det(L^*)$.</li>
              </ol>
            </div>

            <div className="p-3 rounded-lg bg-(--color-surface-hover)/60 border border-(--color-border) space-y-1.5">
              <h4 className="font-bold text-(--color-text) flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                4. Minimum Spanning Tree (MST)
              </h4>
              <p className="text-(--color-text-muted)">
                In a weighted graph, the <strong>Minimum Spanning Tree</strong> is the spanning tree with the
                minimum possible total edge weight:
              </p>
              <div className="p-2 rounded bg-(--color-surface) border border-(--color-border) font-mono text-center text-sky-500 font-bold">
                $\min \sum_{'{e \\in T}'} w(e)$
              </div>
              <p className="text-[11px] text-(--color-text-muted)">
                Computed via <strong>Kruskal's Algorithm</strong> (greedily adds lightest edge without cycles using Disjoint-Set)
                or <strong>Prim's Algorithm</strong> (grows tree from a seed vertex).
              </p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
