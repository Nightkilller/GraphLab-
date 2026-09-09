import { useState, useMemo } from "react";
import {
  GitCompare,
  Check,
  X,
  Columns,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import { useComplementStore } from "../../store/complementStore";
import {
  analyzeComplementGraph,
  computeComplementGraph,
} from "../../utils/graph/complementGraph";
import {
  generatePath,
  generateCycle,
  generateComplete,
  generateStar,
  generatePetersen,
} from "../../utils/graph/graphGenerator";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface ComplementModalProps {
  disabled?: boolean;
}

export const ComplementModal = ({ disabled }: ComplementModalProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analyze" | "degrees" | "presets">("analyze");

  const nodes = useGraphStore((state) => state.data.nodes);
  const edges = useGraphStore((state) => state.data.edges);
  const nodeCounter = useGraphStore((state) => state.data.nodeCounter);
  const setGraph = useGraphStore((state) => state.setGraph);
  const appendGraph = useGraphStore((state) => state.appendGraph);

  const analysis = useMemo(() => {
    if (nodes.length === 0) return null;
    return analyzeComplementGraph(nodes, edges);
  }, [nodes, edges]);

  const handleOpenSideBySide = () => {
    if (nodes.length === 0) {
      toast.info("Please create or generate a graph first!");
      return;
    }
    const comp = computeComplementGraph(nodes, edges, nodeCounter);
    useComplementStore.getState().startComparison(nodes, edges, comp.edges, nodeCounter);
    setOpen(false);
    toast.info("Opened Side-by-Side Complement Graph G' on canvas!");
  };

  const handleReplaceWithComplement = () => {
    if (nodes.length === 0) {
      toast.info("Please create or generate a graph first!");
      return;
    }
    const comp = computeComplementGraph(nodes, edges, nodeCounter);
    setGraph(comp.nodes, comp.edges, comp.nodeCounter);
    setOpen(false);
    toast.success("Swapped canvas with Complement Graph G'!");
  };

  const handleApplyPreset = (generator: () => any, label: string) => {
    const graph = generator();
    appendGraph(graph.nodes, graph.edges, graph.nodeCounter);
    toast.success(`Generated ${label} on canvas!`);
    setActiveTab("analyze");
  };

  const n = nodes.length;
  const maxEdges = (n * (n - 1)) / 2;

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Complement Graph Suite"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <GitCompare className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden lg:inline">Complement</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(450px,calc(100vw-1.5rem))] max-h-[min(580px,calc(100dvh-4rem))] p-4 bg-(--color-surface) border border-(--color-divider) rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
        align="center"
        sideOffset={12}
      >
        <GrainTexture className="rounded-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-(--color-divider) mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-(--color-accent)/10 text-(--color-accent)">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-(--color-text)">Complement Graph Suite</h3>
              <p className="text-[10px] text-(--color-text-muted)">G ↔ G' Invariants, Degree Inversion & Compare</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-(--color-text-muted) hover:text-(--color-text) p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-(--color-paper) p-0.5 rounded-lg border border-(--color-divider) mb-3 shrink-0">
          <button
            onClick={() => setActiveTab("analyze")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              activeTab === "analyze"
                ? "bg-(--color-surface) text-(--color-text) shadow-xs font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Invariants & Compare
          </button>
          <button
            onClick={() => setActiveTab("degrees")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              activeTab === "degrees"
                ? "bg-(--color-surface) text-(--color-text) shadow-xs font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Degree Inversion
          </button>
          <button
            onClick={() => setActiveTab("presets")}
            className={cn(
              "flex-1 py-1 rounded-md text-xs font-medium transition-all",
              activeTab === "presets"
                ? "bg-(--color-surface) text-(--color-text) shadow-xs font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Presets
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {/* TAB 1: Invariants & Operations */}
          {activeTab === "analyze" && (
            <div className="space-y-3">
              {nodes.length === 0 ? (
                <div className="p-4 text-center rounded-lg border border-dashed border-(--color-divider) text-xs text-(--color-text-muted) space-y-2">
                  <p>Canvas is empty. Add nodes or load a preset below to analyze its complement.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyPreset(() => generateCycle(5), "C₅ (Cycle 5)")}
                    className="text-xs"
                  >
                    Load C₅ Self-Complementary Preset
                  </Button>
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-(--color-paper) border border-(--color-divider) text-center">
                      <span className="text-[10px] text-(--color-text-muted) block">Vertices n</span>
                      <span className="font-mono font-bold text-sm text-(--color-text)">{n}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-(--color-paper) border border-(--color-divider) text-center">
                      <span className="text-[10px] text-(--color-text-muted) block">Edges |E(G)|</span>
                      <span className="font-mono font-bold text-sm text-blue-500">{analysis?.origEdgeCount ?? 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-(--color-paper) border border-(--color-divider) text-center">
                      <span className="text-[10px] text-(--color-text-muted) block">Edges |E(G')|</span>
                      <span className="font-mono font-bold text-sm text-amber-500">{analysis?.compEdgeCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Mathematical Invariant Card */}
                  <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-(--color-text) flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Fundamental Invariant
                      </span>
                      <span className="text-[10.5px] font-mono text-emerald-500 font-medium">Verified</span>
                    </div>
                    <p className="font-mono text-[11px] text-(--color-accent) bg-(--color-surface) p-1.5 rounded border border-(--color-divider) text-center">
                      |E(G)| + |E(G')| = C(n, 2) = {analysis?.origEdgeCount ?? 0} + {analysis?.compEdgeCount ?? 0} = {maxEdges}
                    </p>
                    <p className="text-[10.5px] text-(--color-text-muted)">
                      The edges of graph G and complement G' partition the complete graph K_{n}.
                    </p>
                  </div>

                  {/* Self-Complementary Status */}
                  <div className={cn(
                    "p-2.5 rounded-lg border text-xs space-y-1",
                    analysis?.isSelfComplementaryCandidate
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-(--color-paper) border-(--color-divider) text-(--color-text-muted)"
                  )}>
                    <div className="flex items-center justify-between font-semibold">
                      <span>Self-Complementary Status (G ≅ G')</span>
                      <span>{analysis?.isSelfComplementaryCandidate ? "Candidate" : "Not Self-Complementary"}</span>
                    </div>
                    <p className="text-[10.5px]">
                      {analysis?.isSelfComplementaryCandidate
                        ? `Satisfies both necessary conditions: n = ${n} ≡ ${n % 4} (mod 4) and |E(G)| = |E(G')| = ${analysis.origEdgeCount}.`
                        : n % 4 !== 0 && (n - 1) % 4 !== 0
                        ? `A self-complementary graph must have n ≡ 0 or 1 (mod 4). Here n = ${n} ≡ ${n % 4} (mod 4).`
                        : `|E(G)| (${analysis?.origEdgeCount}) does not equal half of C(${n}, 2) = ${maxEdges / 2}.`}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <Button
                      onClick={handleOpenSideBySide}
                      className="w-full gap-2 text-xs h-9 justify-center"
                    >
                      <Columns className="w-3.5 h-3.5 text-(--color-accent)" />
                      <span>Open Side-by-Side Comparison (G ↔ G')</span>
                    </Button>
                    <Button
                      onClick={handleReplaceWithComplement}
                      variant="outline"
                      className="w-full gap-2 text-xs h-8 justify-center"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Replace Canvas with Complement G'</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Degree Inversion Table */}
          {activeTab === "degrees" && (
            <div className="space-y-2.5">
              <div className="p-2 rounded-lg bg-(--color-paper) border border-(--color-divider) text-[11px] text-(--color-text-muted)">
                <div className="font-semibold text-(--color-text) mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-(--color-accent)" />
                  Degree Inversion Theorem
                </div>
                For every vertex v: <strong className="font-mono text-(--color-accent)">deg_G'(v) = (n - 1) - deg_G(v)</strong>.
                The sum deg_G(v) + deg_G'(v) always equals {n > 0 ? n - 1 : "n - 1"}.
              </div>

              {nodes.length === 0 ? (
                <div className="p-4 text-center rounded-lg border border-dashed border-(--color-divider) text-xs text-(--color-text-muted)">
                  Canvas is empty. Add vertices to see the degree inversion table.
                </div>
              ) : (
                <div className="border border-(--color-divider) rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-(--color-paper) text-(--color-text-muted) border-b border-(--color-divider)">
                      <tr>
                        <th className="py-1.5 px-2 text-left font-medium">Vertex v</th>
                        <th className="py-1.5 px-2 text-center font-medium">deg_G(v)</th>
                        <th className="py-1.5 px-2 text-center font-medium">deg_G'(v)</th>
                        <th className="py-1.5 px-2 text-center font-medium">Sum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--color-divider)">
                      {analysis?.degrees.map((row) => (
                        <tr key={row.id} className="hover:bg-(--color-paper)/50">
                          <td className="py-1.5 px-2 font-mono font-medium text-(--color-text)">
                            {row.label}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono text-blue-500 font-semibold">
                            {row.origDegree}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono text-amber-500 font-semibold">
                            {row.compDegree}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono text-(--color-text-muted)">
                            {row.origDegree + row.compDegree}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Presets */}
          {activeTab === "presets" && (
            <div className="space-y-2">
              <p className="text-[11px] text-(--color-text-muted)">
                Load classic graphs with noteworthy complement and self-complementary properties:
              </p>

              <div className="space-y-1.5">
                <button
                  onClick={() => handleApplyPreset(() => generatePath(4), "P₄ (Path 4)")}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-(--color-paper) hover:border-(--color-accent)/40 border border-(--color-divider) transition-all text-left group"
                >
                  <div>
                    <div className="font-semibold text-xs text-(--color-text) group-hover:text-(--color-accent)">
                      Path P₄ (Smallest Self-Complementary Graph)
                    </div>
                    <div className="text-[10px] text-(--color-text-muted)">
                      4 vertices, 3 edges — P₄ is isomorphic to its complement P₄'
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-(--color-text-muted) group-hover:text-(--color-accent) transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => handleApplyPreset(() => generateCycle(5), "C₅ (Cycle 5)")}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-(--color-paper) hover:border-(--color-accent)/40 border border-(--color-divider) transition-all text-left group"
                >
                  <div>
                    <div className="font-semibold text-xs text-(--color-text) group-hover:text-(--color-accent)">
                      Cycle C₅ (Only Self-Complementary Cycle)
                    </div>
                    <div className="text-[10px] text-(--color-text-muted)">
                      5 vertices, 5 edges — C₅ ≅ C₅' with pentagram complement
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-(--color-text-muted) group-hover:text-(--color-accent) transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => handleApplyPreset(() => generateComplete(4), "K₄ (Complete 4)")}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-(--color-paper) hover:border-(--color-accent)/40 border border-(--color-divider) transition-all text-left group"
                >
                  <div>
                    <div className="font-semibold text-xs text-(--color-text) group-hover:text-(--color-accent)">
                      Complete Graph K₄
                    </div>
                    <div className="text-[10px] text-(--color-text-muted)">
                      4 vertices, 6 edges — Its complement is the empty graph K̄₄ (0 edges)
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-(--color-text-muted) group-hover:text-(--color-accent) transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => handleApplyPreset(() => generateStar(5), "S₅ (Star Graph 5)")}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-(--color-paper) hover:border-(--color-accent)/40 border border-(--color-divider) transition-all text-left group"
                >
                  <div>
                    <div className="font-semibold text-xs text-(--color-text) group-hover:text-(--color-accent)">
                      Star Graph S₅
                    </div>
                    <div className="text-[10px] text-(--color-text-muted)">
                      5 vertices, 4 edges — Complement disconnects center into K₄ ∪ K₁
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-(--color-text-muted) group-hover:text-(--color-accent) transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => handleApplyPreset(() => generatePetersen(), "Petersen Graph")}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-(--color-paper) hover:border-(--color-accent)/40 border border-(--color-divider) transition-all text-left group"
                >
                  <div>
                    <div className="font-semibold text-xs text-(--color-text) group-hover:text-(--color-accent)">
                      Petersen Graph (10 Vertices)
                    </div>
                    <div className="text-[10px] text-(--color-text-muted)">
                      15 edges — Complement is 6-regular with 30 edges
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-(--color-text-muted) group-hover:text-(--color-accent) transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
