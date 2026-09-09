import React, { useState, useRef, useCallback } from "react";
import {
  GitFork,
  UploadCloud,
  Check,
  AlertCircle,
  Play,
  X,
  Columns,
  Sparkles,
  FileCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import { parseGraphFromImage, compressImageFile } from "../../lib/groq";
import {
  analyzeSubgraph,
  extractInducedSubgraph,
  extractSpanningTree,
  placeSideBySideSubgraph,
  type SubgraphClassification,
} from "../../utils/graph/subgraph";
import { type GeneratedGraph } from "../../utils/graph/graphGenerator";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface SubgraphModalProps {
  disabled?: boolean;
}

export const SubgraphModal = ({ disabled }: SubgraphModalProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "extract">("extract");

  // State for Upload Mode
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [parsedCandidate, setParsedCandidate] = useState<GeneratedGraph | null>(null);
  const [uploadAnalysis, setUploadAnalysis] = useState<SubgraphClassification | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Extract Mode
  const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);

  const graphData = useGraphStore((state) => state.data);
  const setGraph = useGraphStore((state) => state.setGraph);

  // Handle file upload
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or WebP).");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 640);
      setPreview(compressed);
      setParsedCandidate(null);
      setUploadAnalysis(null);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setParsedCandidate(null);
        setUploadAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    }
  }, []);

  const handleAnalyzeUploadedImage = async () => {
    if (!preview) return;
    setIsScanning(true);
    try {
      const parsed = await parseGraphFromImage(preview);
      setParsedCandidate(parsed);

      const analysis = analyzeSubgraph(
        { nodes: graphData.nodes, edges: graphData.edges },
        { nodes: parsed.nodes, edges: parsed.edges }
      );
      setUploadAnalysis(analysis);

      if (analysis.isSubgraph) {
        toast.success(`Identified as ${analysis.primaryType}!`);
      } else {
        toast.warning("Uploaded graph is not a subgraph of the canvas graph.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse subgraph image.");
    } finally {
      setIsScanning(false);
    }
  };

  // Extract mode selection
  const toggleNodeSelection = (id: number) => {
    setSelectedNodeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllNodes = () => {
    setSelectedNodeIds(graphData.nodes.map((n) => n.id));
  };

  const clearSelection = () => {
    setSelectedNodeIds([]);
  };

  // Compute live analysis for extract mode
  const extractCandidate = selectedNodeIds.length > 0
    ? extractInducedSubgraph(graphData.nodes, graphData.edges, graphData.nodeCounter, selectedNodeIds)
    : null;

  const extractAnalysis = extractCandidate
    ? analyzeSubgraph(
        { nodes: graphData.nodes, edges: graphData.edges },
        { nodes: extractCandidate.nodes, edges: extractCandidate.edges }
      )
    : null;

  // Actions
  const handleLoadToCanvas = (g: GeneratedGraph) => {
    setGraph(g.nodes, g.edges, g.nodeCounter);
    toast.success(`Loaded subgraph (${g.nodes.length} nodes) to canvas!`);
    setOpen(false);
  };

  const handlePlaceSideBySide = (sub: GeneratedGraph) => {
    const combined = placeSideBySideSubgraph(
      { nodes: graphData.nodes, edges: graphData.edges, nodeCounter: graphData.nodeCounter },
      { nodes: sub.nodes, edges: sub.edges }
    );
    setGraph(combined.nodes, combined.edges, combined.nodeCounter);
    toast.success("Placed parent graph G and subgraph H side-by-side!");
    setOpen(false);
  };

  const handleExtractSpanningTree = () => {
    if (graphData.nodes.length === 0) return;
    const st = extractSpanningTree(graphData.nodes, graphData.edges, graphData.nodeCounter);
    setGraph(st.nodes, st.edges, st.nodeCounter);
    toast.success("Extracted Spanning Tree subgraph onto canvas!");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Subgraph Suite"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <GitFork className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden lg:inline">Subgraph</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(500px,calc(100vw-1.5rem))] max-h-[min(600px,85vh)] overflow-y-auto p-4 bg-(--color-surface) border border-(--color-border) rounded-xl shadow-2xl relative"
        onPaste={handlePaste}
      >
        <GrainTexture baseFrequency={3} className="rounded-xl opacity-20 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-(--color-border) mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <GitFork size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-(--color-text)">Subgraph Suite</h3>
              <p className="text-xs text-(--color-text-muted)">
                Analyze, classify, and extract subgraphs (Induced, Spanning, Clique)
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

        {/* Tab Selector */}
        <div className="flex bg-(--color-surface-hover) p-1 rounded-lg mb-3">
          <button
            onClick={() => setActiveTab("extract")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "extract"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Extract from Canvas
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "upload"
                ? "bg-(--color-surface) text-(--color-text) shadow-sm"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Upload Subgraph Photo (AI)
          </button>
        </div>

        {/* TAB 1: EXTRACT FROM CANVAS */}
        {activeTab === "extract" && (
          <div className="space-y-3">
            {graphData.nodes.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-(--color-border) text-xs text-(--color-text-muted)">
                Please add or generate a graph on the canvas first.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-(--color-text)">
                    Select Vertices for Subgraph ({selectedNodeIds.length}/{graphData.nodes.length}):
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllNodes}
                      className="text-[11px] text-blue-500 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-(--color-border)">|</span>
                    <button
                      onClick={clearSelection}
                      className="text-[11px] text-(--color-text-muted) hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Node Chip Grid */}
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg bg-(--color-surface-hover)/50 border border-(--color-border)">
                  {graphData.nodes.map((node) => {
                    const isSelected = selectedNodeIds.includes(node.id);
                    return (
                      <button
                        key={node.id}
                        onClick={() => toggleNodeSelection(node.id)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                          isSelected
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-(--color-surface) text-(--color-text) border border-(--color-border) hover:bg-(--color-surface-hover)"
                        )}
                      >
                        {isSelected && <Check size={12} />}
                        {node.label || `Node ${node.id}`}
                      </button>
                    );
                  })}
                </div>

                {/* Spanning Tree Shortcut */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-(--color-surface-hover) border border-(--color-border)">
                  <div className="text-xs">
                    <span className="font-semibold text-(--color-text)">Spanning Tree</span>
                    <p className="text-[11px] text-(--color-text-muted)">
                      Extracts a connected acyclic subgraph spanning all {graphData.nodes.length} vertices
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleExtractSpanningTree}>
                    Extract Tree
                  </Button>
                </div>

                {/* Live Classification Result */}
                {extractAnalysis && extractCandidate && (
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileCheck size={14} className="text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">
                          {extractAnalysis.primaryType}
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                        |V|={extractCandidate.nodes.length}, |E|={extractAnalysis.details[1]?.match(/\d+/)?.[0] || ""}
                      </span>
                    </div>

                    <p className="text-xs text-(--color-text) leading-relaxed">
                      {extractAnalysis.reason}
                    </p>

                    <div className="text-[11px] text-(--color-text-muted) space-y-0.5 border-t border-(--color-border) pt-2">
                      {extractAnalysis.details.map((d, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-emerald-500">•</span>
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => handleLoadToCanvas(extractCandidate)}
                      >
                        <Play size={13} className="mr-1" />
                        Load Subgraph
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handlePlaceSideBySide(extractCandidate)}
                      >
                        <Columns size={13} className="mr-1" />
                        Side-by-Side (G vs H)
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD SUBGRAPH PHOTO */}
        {activeTab === "upload" && (
          <div className="space-y-3">
            <p className="text-xs text-(--color-text-muted)">
              Upload a photo or sketch of a subgraph. AI will parse it and test whether it forms a valid subgraph of the graph currently on canvas, determining if it is Induced, Spanning, Clique, etc.
            </p>

            {/* Upload Box */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                preview
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-(--color-border) hover:border-emerald-500/40 bg-(--color-surface-hover)/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {preview ? (
                <div className="relative w-full max-h-40 flex items-center justify-center overflow-hidden rounded-lg">
                  <img src={preview} alt="Subgraph Preview" className="max-h-40 object-contain rounded-lg" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      setParsedCandidate(null);
                      setUploadAnalysis(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2.5 rounded-full bg-(--color-surface) shadow-sm border border-(--color-border)">
                    <UploadCloud size={22} className="text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-(--color-text)">
                      Click to upload or drag & drop subgraph image
                    </span>
                    <p className="text-[11px] text-(--color-text-muted)">PNG, JPG, or WebP. Or paste with Cmd+V</p>
                  </div>
                </div>
              )}
            </div>

            {preview && (
              <Button
                onClick={handleAnalyzeUploadedImage}
                disabled={isScanning || graphData.nodes.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isScanning ? (
                  <>
                    <Sparkles size={14} className="animate-spin mr-1.5" />
                    Scanning & Analyzing Subgraph...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze Subgraph with AI
                  </>
                )}
              </Button>
            )}

            {/* Upload Analysis Result */}
            {uploadAnalysis && parsedCandidate && (
              <div
                className={cn(
                  "p-3 rounded-lg border space-y-2",
                  uploadAnalysis.isSubgraph
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-rose-500/30 bg-rose-500/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {uploadAnalysis.isSubgraph ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={14} className="text-rose-500" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        uploadAnalysis.isSubgraph ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {uploadAnalysis.primaryType}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-(--color-text) leading-relaxed">
                  {uploadAnalysis.reason}
                </p>

                {uploadAnalysis.details.length > 0 && (
                  <div className="text-[11px] text-(--color-text-muted) space-y-0.5 border-t border-(--color-border) pt-2">
                    {uploadAnalysis.details.map((d, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span>•</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subgraph Vertex Mapping Table */}
                {uploadAnalysis.matchingNodeMap.length > 0 && (
                  <div className="border-t border-(--color-border) pt-2">
                    <span className="text-[11px] font-semibold text-(--color-text)">
                      Subgraph Embedding Mapping:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {uploadAnalysis.matchingNodeMap.map((m, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-(--color-surface-hover) border border-(--color-border) text-(--color-text)"
                        >
                          H({m.subLabel}) → G({m.parentLabel})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {uploadAnalysis.isSubgraph && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={() => handleLoadToCanvas(parsedCandidate)}
                    >
                      <Play size={13} className="mr-1" />
                      Load Subgraph
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handlePlaceSideBySide(parsedCandidate)}
                    >
                      <Columns size={13} className="mr-1" />
                      Side-by-Side (G vs H)
                    </Button>
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
