import { useState, useMemo } from "react";
import { Table2, Copy, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToolbarButton } from "../ui/toolbar";
import { GrainTexture } from "../ui/grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  generateAdjacencyMatrix,
  generateIncidenceMatrix,
} from "../../utils/graph/matrixGenerator";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface MatrixModalProps {
  disabled?: boolean;
}

type MatrixTab = "adjacency" | "incidence";

export const MatrixModal = ({ disabled }: MatrixModalProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MatrixTab>("adjacency");
  const [copied, setCopied] = useState(false);

  const nodes = useGraphStore((state) => state.data.nodes);
  const edges = useGraphStore((state) => state.data.edges);

  const adjResult = useMemo(() => {
    if (nodes.length === 0) return null;
    return generateAdjacencyMatrix(nodes, edges);
  }, [nodes, edges]);

  const incResult = useMemo(() => {
    if (nodes.length === 0) return null;
    return generateIncidenceMatrix(nodes, edges);
  }, [nodes, edges]);

  const handleCopy = (type: MatrixTab) => {
    const result = type === "adjacency" ? adjResult : incResult;
    if (!result) return;

    const labels = result.nodeLabels;
    const rows = result.matrix.map(
      (row, i) => `${labels[i]}\t${row.join("\t")}`
    );

    let header = "";
    if (type === "adjacency") {
      header = `\t${labels.join("\t")}`;
    } else {
      const inc = incResult!;
      header = `\t${inc.edgeLabels.map((_, i) => `e${i + 1}`).join("\t")}`;
    }

    const text = [header, ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(`${type === "adjacency" ? "Adjacency" : "Incidence"} matrix copied!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasNodes = nodes.length > 0;

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Matrix Generator"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <Table2 className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden lg:inline">Matrix</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(500px,calc(100vw-1.5rem))] max-h-[min(580px,calc(100dvh-4rem))] p-4 bg-(--color-surface) border border-(--color-divider) rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
        align="center"
        sideOffset={12}
      >
        <GrainTexture className="rounded-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-(--color-accent)/15 text-(--color-accent)">
              <Table2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-(--color-text)">Matrix Generator</h3>
              <p className="text-[10.5px] text-(--color-text-muted)">
                Adjacency &amp; Incidence Matrix
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-paper) transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-(--color-paper) p-0.5 rounded-lg border border-(--color-divider) mb-3 relative z-10">
          <button
            onClick={() => setActiveTab("adjacency")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === "adjacency"
                ? "bg-(--color-surface) text-(--color-accent) shadow-sm border border-(--color-divider)/60 font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Adjacency Matrix
          </button>
          <button
            onClick={() => setActiveTab("incidence")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === "incidence"
                ? "bg-(--color-surface) text-(--color-accent) shadow-sm border border-(--color-divider)/60 font-semibold"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            Incidence Matrix
          </button>
        </div>

        {/* Matrix Content */}
        <div className="flex-1 overflow-auto relative z-10">
          {!hasNodes ? (
            <div className="text-center py-8 text-xs text-(--color-text-muted)">
              Draw or generate a graph first to see its matrix representation.
            </div>
          ) : activeTab === "adjacency" && adjResult ? (
            <div className="space-y-2">
              <div className="text-[10.5px] text-(--color-text-muted) mb-1">
                {adjResult.nodeLabels.length} × {adjResult.nodeLabels.length} matrix
              </div>
              <div className="overflow-auto max-h-[320px] rounded-lg border border-(--color-divider) bg-(--color-paper)">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr>
                      <th className="sticky top-0 left-0 z-20 p-1.5 bg-(--color-surface) border-b border-r border-(--color-divider) text-(--color-text-muted) font-semibold min-w-[36px]"></th>
                      {adjResult.nodeLabels.map((label, j) => (
                        <th
                          key={j}
                          className="sticky top-0 z-10 p-1.5 bg-(--color-surface) border-b border-(--color-divider) text-(--color-accent) font-semibold min-w-[36px] text-center"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adjResult.matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="sticky left-0 z-10 p-1.5 bg-(--color-surface) border-r border-(--color-divider) text-(--color-accent) font-semibold text-center">
                          {adjResult.nodeLabels[i]}
                        </td>
                        {row.map((val, j) => (
                          <td
                            key={j}
                            className={cn(
                              "p-1.5 text-center border-b border-(--color-divider)/30",
                              val !== 0
                                ? "text-(--color-text) font-semibold bg-(--color-accent)/8"
                                : "text-(--color-text-muted)/40"
                            )}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "incidence" && incResult ? (
            <div className="space-y-2">
              <div className="text-[10.5px] text-(--color-text-muted) mb-1">
                {incResult.nodeLabels.length} × {incResult.edgeLabels.length} matrix
                <span className="ml-2 text-(--color-text-muted)/60">
                  (rows = vertices, columns = edges)
                </span>
              </div>
              <div className="overflow-auto max-h-[320px] rounded-lg border border-(--color-divider) bg-(--color-paper)">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr>
                      <th className="sticky top-0 left-0 z-20 p-1.5 bg-(--color-surface) border-b border-r border-(--color-divider) text-(--color-text-muted) font-semibold min-w-[36px]"></th>
                      {incResult.edgeLabels.map((_, j) => (
                        <th
                          key={j}
                          className="sticky top-0 z-10 p-1.5 bg-(--color-surface) border-b border-(--color-divider) text-(--color-accent) font-semibold min-w-[36px] text-center"
                          title={incResult.edgeLabels[j]}
                        >
                          e{j + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incResult.matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="sticky left-0 z-10 p-1.5 bg-(--color-surface) border-r border-(--color-divider) text-(--color-accent) font-semibold text-center">
                          {incResult.nodeLabels[i]}
                        </td>
                        {row.map((val, j) => (
                          <td
                            key={j}
                            className={cn(
                              "p-1.5 text-center border-b border-(--color-divider)/30",
                              val === 1
                                ? "text-emerald-500 font-semibold bg-emerald-500/8"
                                : val === -1
                                  ? "text-rose-500 font-semibold bg-rose-500/8"
                                  : "text-(--color-text-muted)/40"
                            )}
                          >
                            {val === -1 ? "−1" : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edge Legend */}
              <div className="mt-2 p-2 rounded-lg bg-(--color-paper) border border-(--color-divider)">
                <div className="text-[10px] text-(--color-text-muted) font-semibold mb-1 uppercase tracking-wider">
                  Edge Legend
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-(--color-text-muted)">
                  {incResult.edgeLabels.map((label, idx) => (
                    <span key={idx}>
                      <strong className="text-(--color-accent)">e{idx + 1}</strong> = {label.replace(/^e\d+/, "").replace(/[()]/g, "")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Copy Button */}
        {hasNodes && (
          <div className="mt-3 pt-3 border-t border-(--color-divider) relative z-10">
            <Button
              onClick={() => handleCopy(activeTab)}
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy {activeTab === "adjacency" ? "Adjacency" : "Incidence"} Matrix
                </>
              )}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
