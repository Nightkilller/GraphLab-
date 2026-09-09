import { useState, useMemo } from "react";
import {
  GraduationCap,
  Sparkles,
  Loader2,
  X,
  Send,
  Copy,
  Check,
  BookOpen,
  Key,
  ShieldCheck,
  RefreshCw,
  Hash,
  GitCompare,
  Split,
  Columns,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  explainGraphTheory,
  getGroqApiKey,
  setGroqApiKey,
  DEFAULT_GROQ_API_KEY,
  cleanMathFormatting,
} from "../../lib/groq";
import { generateLocalGraphTheoryExplanation } from "../../utils/graph/localGraphTheoryExplainer";
import {
  analyzeComplementGraph,
  computeComplementGraph,
} from "../../utils/graph/complementGraph";
import { useComplementStore } from "../../store/complementStore";
import { checkBipartite, arrangeBipartiteLayout } from "../../utils/graph/bipartite";
import { EDGE_TYPE } from "../../constants/graph";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface AITutorPanelProps {
  disabled?: boolean;
}

type TabType = "overview" | "degree" | "complement" | "bipartite";

export const AITutorPanel = ({ disabled }: AITutorPanelProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState(getGroqApiKey());

  const nodes = useGraphStore((state) => state.data.nodes);
  const edges = useGraphStore((state) => state.data.edges);
  const nodeCounter = useGraphStore((state) => state.data.nodeCounter);
  const setGraph = useGraphStore((state) => state.setGraph);

  // Compute graph properties & degrees
  const graphSummary = useMemo(() => {
    let edgeCount = 0;
    let isDirected = false;
    const inDegMap = new Map<number, number>();
    const outDegMap = new Map<number, number>();
    const degreeMap = new Map<number, number>();
    nodes.forEach((n) => {
      inDegMap.set(n.id, 0);
      outDegMap.set(n.id, 0);
      degreeMap.set(n.id, 0);
    });

    const processedUndirected = new Set<string>();

    edges.forEach((edgeList, u) => {
      for (const e of edgeList) {
        if (e.type === EDGE_TYPE.DIRECTED) {
          isDirected = true;
          outDegMap.set(u, (outDegMap.get(u) || 0) + 1);
          inDegMap.set(e.to, (inDegMap.get(e.to) || 0) + 1);
          edgeCount++;
        } else {
          const key = [Math.min(u, e.to), Math.max(u, e.to)].join("-");
          if (!processedUndirected.has(key)) {
            processedUndirected.add(key);
            edgeCount++;
          }
          if (u === e.from) {
            degreeMap.set(u, (degreeMap.get(u) || 0) + 1);
          }
        }
      }
    });

    const degrees = nodes.map((n) => {
      const inD = inDegMap.get(n.id) || 0;
      const outD = outDegMap.get(n.id) || 0;
      const undirectedD = (edges.get(n.id) || []).length;
      const deg = isDirected ? inD + outD : undirectedD;
      return {
        id: n.id,
        label: n.label || `v${n.id}`,
        degree: deg,
        inDegree: inD,
        outDegree: outD,
        isEven: deg % 2 === 0,
      };
    });

    const sortedDegrees = [...degrees].sort((a, b) => b.degree - a.degree);
    const degSeq = sortedDegrees.map((d) => d.degree);
    const sumDegrees = degrees.reduce((acc, d) => acc + d.degree, 0);
    const minDeg = degSeq.length > 0 ? degSeq[degSeq.length - 1] : 0;
    const maxDeg = degSeq.length > 0 ? degSeq[0] : 0;
    const isRegular = nodes.length > 0 && minDeg === maxDeg;
    const oddVertices = degrees.filter((d) => !d.isEven);
    const evenVertices = degrees.filter((d) => d.isEven);

    return {
      nodeCount: nodes.length,
      edgeCount,
      degrees,
      degSeq,
      sumDegrees,
      minDeg,
      maxDeg,
      isRegular,
      oddVertices,
      evenVertices,
      isDirected,
    };
  }, [nodes, edges]);

  // Complement analysis
  const compAnalysis = useMemo(() => {
    return analyzeComplementGraph(nodes, edges);
  }, [nodes, edges]);

  // Bipartite analysis
  const bipartiteAnalysis = useMemo(() => {
    return checkBipartite(nodes, edges);
  }, [nodes, edges]);

  const handleAnalyze = async (query?: string) => {
    if (nodes.length === 0) {
      toast.info("Please draw or generate a graph first!");
      return;
    }

    setLoading(true);
    try {
      const summary = {
        nodeCount: graphSummary.nodeCount,
        edgeCount: graphSummary.edgeCount,
        degrees: graphSummary.degrees,
        isDirected: graphSummary.isDirected,
      };
      const result = await explainGraphTheory(summary, query || undefined);
      setExplanation(cleanMathFormatting(result));
    } catch (err: any) {
      console.warn("Groq API fallback to deterministic engine:", err);
      try {
        const fallback = generateLocalGraphTheoryExplanation(nodes, edges, query || undefined);
        setExplanation(cleanMathFormatting(fallback));
        toast.warning("Generated via offline mathematical engine.");
      } catch {
        toast.error(err.message || "Failed to analyze graph.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Explanation copied to clipboard!");
  };

  const handleSaveKey = () => {
    setGroqApiKey(groqKeyInput.trim());
    toast.success("API key saved successfully!");
    setShowKeySettings(false);
  };

  const handleResetKey = () => {
    setGroqKeyInput(DEFAULT_GROQ_API_KEY);
    setGroqApiKey(DEFAULT_GROQ_API_KEY);
    toast.info("Reset API key to default.");
  };

  const handleOpenComplement = () => {
    if (nodes.length === 0) return;
    const comp = computeComplementGraph(nodes, edges, nodeCounter);
    useComplementStore.getState().startComparison(nodes, edges, comp.edges, nodeCounter);
    setOpen(false);
    toast.info("Opened Side-by-Side Complement Graph G' on canvas!");
  };

  const handleArrangeBipartite = () => {
    if (!bipartiteAnalysis.isBipartite || nodes.length === 0) return;
    const arranged = arrangeBipartiteLayout(
      nodes,
      edges,
      bipartiteAnalysis.partition1,
      bipartiteAnalysis.partition2,
      nodeCounter
    );
    setGraph(arranged.nodes, arranged.edges, nodeCounter);
    setOpen(false);
    toast.success("Arranged graph into 2 vertical bipartite columns!");
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="AI Graph Theory Tutor"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <GraduationCap className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden md:inline">AI Tutor</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-[440px] max-h-[600px] p-4 bg-(--color-surface) border border-(--color-divider) rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
        align="center"
        sideOffset={12}
      >
        <GrainTexture className="rounded-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-(--color-divider) mb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-(--color-accent)/10 text-(--color-accent)">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-(--color-text)">Graph Theory Tutor</h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Groq AI
                </span>
              </div>
              <p className="text-[10.5px] text-(--color-text-muted)">
                Degrees, Complement, Bipartite & Invariants
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-(--color-text-muted) hover:text-(--color-text) p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-(--color-paper) p-0.5 rounded-lg border border-(--color-divider) mb-3 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "flex-1 py-1 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "overview"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <Sparkles className="w-3 h-3 text-(--color-accent)" />
            <span>AI Tutor</span>
          </button>
          <button
            onClick={() => setActiveTab("degree")}
            className={cn(
              "flex-1 py-1 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "degree"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <Hash className="w-3 h-3 text-emerald-500" />
            <span>Degree</span>
          </button>
          <button
            onClick={() => setActiveTab("complement")}
            className={cn(
              "flex-1 py-1 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "complement"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <GitCompare className="w-3 h-3 text-pink-500" />
            <span>Complement</span>
          </button>
          <button
            onClick={() => setActiveTab("bipartite")}
            className={cn(
              "flex-1 py-1 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1",
              activeTab === "bipartite"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            <Split className="w-3 h-3 text-sky-500" />
            <span>Bipartite</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-2 text-xs">
          {/* ================= TAB 1: AI TUTOR OVERVIEW ================= */}
          {activeTab === "overview" && (
            <div className="space-y-3">
              {!explanation && !loading ? (
                <div className="text-center py-5 px-3 space-y-3">
                  <Sparkles className="w-8 h-8 text-(--color-accent) mx-auto opacity-80" />
                  <p className="text-(--color-text-muted) leading-relaxed text-xs">
                    Get an instant pedagogical analysis covering <strong>Eulerian circuits</strong>,{" "}
                    <strong>Hamiltonian paths</strong>, <strong>connectivity</strong>, and{" "}
                    <strong>algebraic invariants</strong>.
                  </p>
                  <Button
                    onClick={() => handleAnalyze()}
                    className="gap-1.5 mx-auto font-medium"
                    size="sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Active Graph</span>
                  </Button>
                </div>
              ) : loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-(--color-text-muted)">
                  <Loader2 className="w-6 h-6 animate-spin text-(--color-accent)" />
                  <span className="text-xs">Reasoning with Groq AI…</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-(--color-accent) tracking-wider">
                      Analysis Results
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] text-(--color-text-muted) hover:text-(--color-text) transition-colors px-1.5 py-0.5 rounded border border-(--color-divider)"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-(--color-paper)/60 border border-(--color-divider) text-(--color-text) leading-relaxed space-y-1.5 whitespace-pre-wrap font-sans text-xs">
                    {explanation}
                  </div>
                </div>
              )}

              {/* Input for custom query */}
              <div className="pt-2 border-t border-(--color-divider) flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ask a question (e.g. Is this planar? Dirac condition?)..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customQuery.trim()) {
                      handleAnalyze(customQuery);
                      setCustomQuery("");
                    }
                  }}
                  className="flex-1 bg-(--color-paper) border border-(--color-divider) rounded-md px-2.5 py-1.5 text-xs text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-1 focus:ring-(--color-accent)"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (customQuery.trim()) {
                      handleAnalyze(customQuery);
                      setCustomQuery("");
                    } else {
                      handleAnalyze();
                    }
                  }}
                  disabled={loading}
                  className="px-3"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: DEGREE ANALYSIS ================= */}
          {activeTab === "degree" && (
            <div className="space-y-3">
              {nodes.length === 0 ? (
                <div className="text-center py-8 text-(--color-text-muted)">
                  No vertices on canvas. Draw vertices or generate a graph to view degree invariants.
                </div>
              ) : (
                <>
                  {/* Sequence Card */}
                  <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-(--color-text)">Degree Sequence</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        |V| = {graphSummary.nodeCount}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-(--color-surface) font-mono text-xs font-bold text-(--color-accent) border border-(--color-divider)">
                      ({graphSummary.degSeq.join(", ")})
                    </div>
                  </div>

                  {/* Handshaking Lemma & Invariants Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-1">
                      <span className="text-[10.5px] text-(--color-text-muted) block">Handshaking Lemma</span>
                      <p className="font-mono text-xs font-semibold text-(--color-text)">
                        Σ deg(v) = {graphSummary.sumDegrees}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        = 2 × {graphSummary.edgeCount} edges (Even ✓)
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-1">
                      <span className="text-[10.5px] text-(--color-text-muted) block">Degree Bounds</span>
                      <p className="font-mono text-xs font-semibold text-(--color-text)">
                        δ(G) = {graphSummary.minDeg}, Δ(G) = {graphSummary.maxDeg}
                      </p>
                      <p className="text-[10px] text-(--color-text-muted)">
                        {graphSummary.isRegular ? `${graphSummary.minDeg}-regular graph` : "Non-regular"}
                      </p>
                    </div>
                  </div>

                  {/* Parity Breakdown */}
                  <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-(--color-text)">Eulerian Parity:</span>
                      <span className="text-[10.5px] font-mono">
                        {graphSummary.oddVertices.length} odd, {graphSummary.evenVertices.length} even
                      </span>
                    </div>
                    <p className="text-[10.5px] text-(--color-text-muted)">
                      {graphSummary.oddVertices.length === 0
                        ? "All vertices have even degree → Euler circuit exists."
                        : graphSummary.oddVertices.length === 2
                        ? "Exactly 2 vertices have odd degree → Euler path exists."
                        : "More than 2 vertices have odd degree → Non-Eulerian."}
                    </p>
                  </div>

                  {/* Vertex Degree Breakdown Table */}
                  <div className="border border-(--color-divider) rounded-lg overflow-hidden">
                    <div className="bg-(--color-paper) px-2.5 py-1.5 border-b border-(--color-divider) font-semibold text-[11px] text-(--color-text) flex items-center justify-between">
                      <span>Vertex Degrees</span>
                      <span className="text-[10px] text-(--color-text-muted)">Hover vertex on canvas for degree badge</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-center text-xs">
                        <thead className="bg-(--color-surface) text-(--color-text-muted) border-b border-(--color-divider) text-[10.5px]">
                          <tr>
                            <th className="py-1 px-2 text-left">Vertex</th>
                            <th className="py-1 px-2">Degree</th>
                            {graphSummary.isDirected && <th className="py-1 px-2">In / Out</th>}
                            <th className="py-1 px-2">Parity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--color-divider)">
                          {graphSummary.degrees.map((d) => (
                            <tr key={d.id} className="hover:bg-(--color-paper)/50">
                              <td className="py-1 px-2 text-left font-semibold text-(--color-text)">{d.label}</td>
                              <td className="py-1 px-2 font-mono font-bold text-(--color-accent)">{d.degree}</td>
                              {graphSummary.isDirected && (
                                <td className="py-1 px-2 font-mono text-[10.5px] text-(--color-text-muted)">
                                  {d.inDegree} in / {d.outDegree} out
                                </td>
                              )}
                              <td className="py-1 px-2">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.2 rounded-full text-[9.5px] font-medium",
                                    d.isEven
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  )}
                                >
                                  {d.isEven ? "Even" : "Odd"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= TAB 3: COMPLEMENT GRAPH ================= */}
          {activeTab === "complement" && (
            <div className="space-y-3">
              {nodes.length === 0 ? (
                <div className="text-center py-8 text-(--color-text-muted)">
                  No vertices on canvas. Draw vertices or generate a graph to view complement analysis.
                </div>
              ) : (
                <>
                  {/* Complement Formula Card */}
                  <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-(--color-text)">Complement Invariant</span>
                      <span className="text-[10.5px] font-mono text-(--color-accent) font-semibold">
                        |E(G)| + |E(G')| = C(n, 2)
                      </span>
                    </div>
                    <div className="p-2 rounded bg-(--color-surface) border border-(--color-divider) flex items-center justify-between text-xs">
                      <span className="text-blue-500 font-medium">Original G: <strong>{compAnalysis.origEdgeCount}</strong> edges</span>
                      <span className="text-(--color-text-muted)">+</span>
                      <span className="text-pink-500 font-medium">Complement G': <strong>{compAnalysis.compEdgeCount}</strong> edges</span>
                      <span className="text-(--color-text-muted)">=</span>
                      <span className="font-bold text-(--color-text)">Max {compAnalysis.maxEdges}</span>
                    </div>
                  </div>

                  {/* Degree Inversion Rule Card */}
                  <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-(--color-text)">
                      <Info className="w-3.5 h-3.5 text-(--color-accent)" />
                      <span>Degree Inversion Rule</span>
                    </div>
                    <p className="text-[11px] text-(--color-text-muted)">
                      Every vertex in G' has degree: <code className="text-(--color-accent) font-mono">deg_G'(v) = (n - 1) - deg_G(v)</code>
                    </p>
                    {compAnalysis.isSelfComplementaryCandidate && (
                      <div className="p-1.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10.5px] font-medium">
                        ★ Self-Complementary Candidate: |E(G)| = |E(G')| with n ≡ 0 or 1 (mod 4)!
                      </div>
                    )}
                  </div>

                  {/* Degree Inversion Table */}
                  <div className="border border-(--color-divider) rounded-lg overflow-hidden">
                    <div className="bg-(--color-paper) px-2.5 py-1.5 border-b border-(--color-divider) font-semibold text-[11px] text-(--color-text)">
                      Vertex Degree Inversion Table
                    </div>
                    <div className="max-h-36 overflow-y-auto">
                      <table className="w-full text-center text-xs">
                        <thead className="bg-(--color-surface) text-(--color-text-muted) border-b border-(--color-divider) text-[10.5px]">
                          <tr>
                            <th className="py-1 px-2 text-left">Vertex</th>
                            <th className="py-1 px-2 text-blue-500 font-semibold">deg in G</th>
                            <th className="py-1 px-2 text-pink-500 font-semibold">deg in G'</th>
                            <th className="py-1 px-2 text-(--color-text-muted)">Sum (n - 1)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--color-divider)">
                          {compAnalysis.degrees.map((d) => (
                            <tr key={d.id} className="hover:bg-(--color-paper)/50">
                              <td className="py-1 px-2 text-left font-semibold text-(--color-text)">{d.label}</td>
                              <td className="py-1 px-2 font-mono text-blue-500 font-bold">{d.origDegree}</td>
                              <td className="py-1 px-2 font-mono text-pink-500 font-bold">{d.compDegree}</td>
                              <td className="py-1 px-2 font-mono text-(--color-text-muted)">{nodes.length - 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action: Open Side-by-Side Comparison on Canvas */}
                  <Button
                    size="sm"
                    onClick={handleOpenComplement}
                    className="w-full gap-1.5 font-medium bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Open Side-by-Side Complement on Canvas</span>
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ================= TAB 4: BIPARTITE ANALYSIS ================= */}
          {activeTab === "bipartite" && (
            <div className="space-y-3">
              {nodes.length === 0 ? (
                <div className="text-center py-8 text-(--color-text-muted)">
                  No vertices on canvas. Draw vertices or generate a graph to check bipartiteness.
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div
                    className={cn(
                      "p-3 rounded-lg border text-xs space-y-1.5",
                      bipartiteAnalysis.isBipartite
                        ? "bg-sky-500/10 border-sky-500/20 text-sky-950 dark:text-sky-100"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-100"
                    )}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <Split className={cn("w-4 h-4", bipartiteAnalysis.isBipartite ? "text-sky-500" : "text-rose-500")} />
                      <span>
                        {bipartiteAnalysis.isBipartite
                          ? bipartiteAnalysis.isCompleteBipartite
                            ? "Complete Bipartite Graph"
                            : "Bipartite Graph (2-Colorable ✓)"
                          : "Not Bipartite (Odd Cycle Detected ✗)"}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{bipartiteAnalysis.reason}</p>
                  </div>

                  {/* Partitions or Odd Cycle */}
                  {bipartiteAnalysis.isBipartite ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-1">
                          <span className="font-semibold text-sky-500 text-[11px]">
                            Partition V₁ ({bipartiteAnalysis.partition1.length})
                          </span>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {bipartiteAnalysis.partition1.map((n) => (
                              <span
                                key={n.id}
                                className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 font-mono text-[10px] font-bold"
                              >
                                {n.label || `v${n.id}`}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-1">
                          <span className="font-semibold text-indigo-500 text-[11px]">
                            Partition V₂ ({bipartiteAnalysis.partition2.length})
                          </span>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {bipartiteAnalysis.partition2.map((n) => (
                              <span
                                key={n.id}
                                className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-mono text-[10px] font-bold"
                              >
                                {n.label || `v${n.id}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Turán Bound info */}
                      <div className="p-2 rounded-lg bg-(--color-paper) border border-(--color-divider) text-[11px] text-(--color-text-muted) space-y-0.5">
                        <div className="flex justify-between text-(--color-text) font-semibold">
                          <span>Turán's Theorem Bound:</span>
                          <span className="font-mono">⌊n²/4⌋ = {Math.floor((nodes.length * nodes.length) / 4)} edges max</span>
                        </div>
                        <p>Current graph has {bipartiteAnalysis.crossEdgesCount} edges connecting V₁ and V₂.</p>
                      </div>

                      {/* Rearrange Action */}
                      <Button
                        size="sm"
                        onClick={handleArrangeBipartite}
                        className="w-full gap-1.5 font-medium bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Rearrange in 2-Column Bipartite Layout</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) text-xs space-y-1.5">
                      <span className="font-semibold text-rose-500 block">
                        Odd Cycle Proof (Length {bipartiteAnalysis.oddCycleLength || 3})
                      </span>
                      {bipartiteAnalysis.oddCycleLabels && (
                        <div className="flex flex-wrap items-center gap-1 font-mono text-[11px] text-(--color-text)">
                          {bipartiteAnalysis.oddCycleLabels.map((lbl, idx) => (
                            <span key={idx} className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                                {lbl}
                              </span>
                              {idx < (bipartiteAnalysis.oddCycleLabels?.length || 0) - 1 && (
                                <span className="text-(--color-text-muted)">→</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10.5px] text-(--color-text-muted) leading-relaxed">
                        By Kőnig's Theorem, a graph is bipartite if and only if it contains no odd cycles.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* API Settings Footer */}
        <div className="mt-1 pt-2 border-t border-(--color-divider) text-[11px] shrink-0">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-(--color-text-muted)">
              <RefreshCw className="w-3 h-3 text-emerald-500" />
              Engine: <strong className="text-(--color-accent)">{groqKeyInput.startsWith("sk-or-") ? "OpenRouter AI" : "Groq LPU"}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowKeySettings(!showKeySettings)}
              className="text-blue-500 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Key className="w-3 h-3" />
              <span>{showKeySettings ? "Hide Key" : "API Key"}</span>
            </button>
          </div>

          {showKeySettings && (
            <div className="mt-2 p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-2">
              <div>
                <label className="text-[10px] font-medium text-(--color-text) block mb-0.5">
                  OpenRouter / Groq API Key
                </label>
                <input
                  type="password"
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  placeholder="sk-or-... or gsk_..."
                  className="w-full px-2 py-1 text-xs rounded bg-(--color-surface) border border-(--color-divider) text-(--color-text) font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetKey}
                  className="h-6 text-[10px] px-2 text-(--color-text-muted)"
                >
                  Reset Default
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveKey}
                  className="h-6 text-[10px] px-2.5"
                >
                  Save Key
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
