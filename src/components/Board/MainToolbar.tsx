import { useCallback, type RefObject } from "react";
import { useIsDesktop } from "../../hooks/useMediaQuery";
import { type GraphRendererHandle } from "../GraphRenderer";
import { algorithmRegistry } from "../../algorithms";
import { AlgorithmPicker } from "../ui/algorithm-picker";
import { GraphGenerator } from "../ui/graph-generator";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { RotateCcw, Download, FileCode, Image, Box, Feather, Zap, BoxSelect } from "lucide-react";
import { useGraphStore } from "../../store/graphStore";
import { useSettingsStore } from "../../store/settingsStore";
import { SPEED_LEVELS, VisualizationState } from "../../constants/visualization";
import { GrainTexture } from "../ui/grain-texture";
import { exportSvg } from "../../utils/export/exportSvg";
import { exportPng } from "../../utils/export/exportPng";
import { export3DPng } from "../../utils/export/export3DPng";
import { exportCanvasPng } from "../../utils/export/exportCanvasPng";
import { ImageToGraphModal } from "../ui/image-to-graph-modal";
import { DegreeSequenceModal } from "./DegreeSequenceModal";
import { IsomorphismModal } from "./IsomorphismModal";
import { ComplementModal } from "./ComplementModal";
import { SubgraphModal } from "./SubgraphModal";
import { BipartiteModal } from "./BipartiteModal";
import { AITutorPanel } from "./AITutorPanel";
import { EdgeVisibilityToggle } from "./EdgeVisibilityToggle";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import { SpeedControl } from "./SpeedControl";
import { ModeToggle } from "./ModeToggle";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "../ui/toolbar";
import { cn } from "../../lib/utils";

interface MainToolbarProps {
  graphRendererRef: RefObject<GraphRendererHandle | null>;
}

export function MainToolbar({ graphRendererRef }: MainToolbarProps) {
  const visualizationAlgorithm = useGraphStore((state) => state.visualization.algorithm);
  const visualizationState = useGraphStore((state) => state.visualization.state);
  const hasNodes = useGraphStore((state) => state.data.nodes.length > 0);
  const visualizationSpeed = useGraphStore((state) => state.visualization.speed);
  const visualizationMode = useGraphStore((state) => state.visualization.mode);
  const setVisualizationAlgorithm = useGraphStore((state) => state.setVisualizationAlgorithm);
  const setVisualizationSpeed = useGraphStore((state) => state.setVisualizationSpeed);
  const resetGraph = useGraphStore((state) => state.resetGraph);
  const setVisualizationMode = useGraphStore((state) => state.setVisualizationMode);
  const selectToolActive = useGraphStore((state) => state.selectToolActive);
  const setSelectToolActive = useGraphStore((state) => state.setSelectToolActive);

  const renderMode = useSettingsStore((state) => state.renderMode);
  const setRenderMode = useSettingsStore((state) => state.setRenderMode);

  const isVisualizing = visualizationState === VisualizationState.RUNNING;
  const is3DMode = renderMode === "3d";
  const isDesktop = useIsDesktop();

  const handleAlgoChange = (algoId: string) => {
    const algo = algorithmRegistry.get(algoId);
    if (!algo) return;
    setVisualizationAlgorithm({
      key: algoId,
      text: algo.metadata.name,
    });
  };

  const currentSpeedIndex = SPEED_LEVELS.findIndex((l) => l.ms === visualizationSpeed);
  const currentSpeedMultiplier = currentSpeedIndex >= 0 ? SPEED_LEVELS[currentSpeedIndex].multiplier : "1x";

  const handleIncreaseSpeed = () => {
    if (currentSpeedIndex < SPEED_LEVELS.length - 1) {
      setVisualizationSpeed(SPEED_LEVELS[currentSpeedIndex + 1].ms);
    }
  };

  const handleDecreaseSpeed = () => {
    if (currentSpeedIndex > 0) {
      setVisualizationSpeed(SPEED_LEVELS[currentSpeedIndex - 1].ms);
    }
  };

  const handleExportSvg = useCallback(async () => {
    const svgElement = graphRendererRef.current?.getGraphRef()?.getSvgElement();
    if (svgElement) await exportSvg(svgElement, { includeGrid: true, filename: "graph.svg" });
  }, [graphRendererRef]);

  const handleExport2DPng = useCallback(async () => {
    const currentRenderMode = useSettingsStore.getState().renderMode;
    if (currentRenderMode === "canvas") {
      const canvasElement = graphRendererRef.current?.getCanvasGraphRef()?.getCanvasElement();
      if (canvasElement) await exportCanvasPng(canvasElement, { filename: "graph.png" });
    } else {
      const svgElement = graphRendererRef.current?.getGraphRef()?.getSvgElement();
      if (svgElement) await exportPng(svgElement, { includeGrid: true, filename: "graph.png" });
    }
  }, [graphRendererRef]);

  const handleExport3DPng = useCallback(async () => {
    const canvas = graphRendererRef.current?.getGraph3DRef()?.getCanvas();
    if (canvas) await export3DPng(canvas, { filename: "graph-3d.png" });
  }, [graphRendererRef]);

  return (
    <Toolbar
      aria-label="Graph controls"
      className="flex items-center relative p-1 rounded-xl bg-(--color-surface) shadow-(--shadow-premium) gap-1 whitespace-nowrap max-w-full overflow-x-auto no-scrollbar"
    >
      <GrainTexture baseFrequency={3} className="rounded-xl" />

      {/* Execution Mode (Auto / Step) */}
      <div className="shrink-0">
        <ModeToggle
          mode={visualizationMode}
          onModeChange={setVisualizationMode}
          disabled={isVisualizing}
        />
      </div>

      {/* Marquee Select Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolbarButton asChild>
            <Button
              variant={selectToolActive ? "secondary" : "ghost"}
              size="icon-sm"
              disabled={isVisualizing}
              onClick={() => {
                const next = !selectToolActive;
                setSelectToolActive(next);
                if (next) {
                  toast.info("Marquee Select active: Click & drag on canvas to select vertices, or drag group");
                }
              }}
              aria-label="Marquee Select Tool"
              className={cn(
                "z-10 transition-colors shrink-0",
                selectToolActive && "bg-(--color-accent)/20 text-(--color-accent) border border-(--color-accent)/40 shadow-xs"
              )}
            >
              <BoxSelect size={16} />
            </Button>
          </ToolbarButton>
        </TooltipTrigger>
        <TooltipContent>
          {selectToolActive
            ? "Marquee Select (Active — Drag on canvas to select)"
            : "Marquee Select Tool (Hold & drag on canvas to select)"}
        </TooltipContent>
      </Tooltip>

      <ToolbarSeparator className="mx-0.5 shrink-0" />

      {/* Algorithm Selection */}
      <AlgorithmPicker
        selectedAlgo={visualizationAlgorithm}
        onSelect={handleAlgoChange}
        disabled={isVisualizing || !hasNodes}
      />

      <ToolbarSeparator className="mx-0.5 shrink-0" />

      {/* Graph Theory & Creation Suite */}
      <div className="flex items-center gap-1 shrink-0">
        <GraphGenerator disabled={isVisualizing} />
        <ImageToGraphModal disabled={isVisualizing} />
        <DegreeSequenceModal disabled={isVisualizing} />
        <IsomorphismModal disabled={isVisualizing} />
        <ComplementModal disabled={isVisualizing} />
        <BipartiteModal disabled={isVisualizing} />
        <SubgraphModal disabled={isVisualizing} />
        <EdgeVisibilityToggle disabled={!hasNodes} />
        <AITutorPanel disabled={isVisualizing} />
      </div>

      {isDesktop && <ToolbarSeparator className="mx-0.5 shrink-0" />}

      {/* Speed Control */}
      {isDesktop && (
        <SpeedControl
          speedMultiplier={currentSpeedMultiplier}
          disabled={isVisualizing}
          canDecrease={currentSpeedIndex > 0}
          canIncrease={currentSpeedIndex < SPEED_LEVELS.length - 1}
          onDecrease={handleDecreaseSpeed}
          onIncrease={handleIncreaseSpeed}
        />
      )}

      <ToolbarSeparator className="mx-0.5 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
        {/* Render Mode Selector - Desktop only */}
        <Select value={renderMode} onValueChange={(value) => setRenderMode(value as "svg" | "canvas" | "3d")} disabled={isVisualizing}>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToolbarButton asChild>
                <SelectTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="z-10 shrink-0 hidden lg:inline-flex"
                    disabled={isVisualizing}
                    aria-label="View mode"
                  >
                    {renderMode === "3d" ? (
                      <Box size={16} className="text-(--color-text)" />
                    ) : renderMode === "canvas" ? (
                      <Zap size={16} className="text-(--color-text)" />
                    ) : (
                      <Feather size={16} className="text-(--color-text)" />
                    )}
                  </Button>
                </SelectTrigger>
              </ToolbarButton>
            </TooltipTrigger>
            <TooltipContent>View mode</TooltipContent>
          </Tooltip>
          <SelectContent align="center" sideOffset={8}>
            <SelectItem value="svg">
              <div className="flex items-center">
                <Feather className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>Standard</span>
                  <span className="text-xs opacity-70">Smooth animations</span>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="canvas">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>Performance</span>
                  <span className="text-xs opacity-70">For large graphs</span>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="3d">
              <div className="flex items-center">
                <Box className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>3D</span>
                  <span className="text-xs opacity-70">View only</span>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Export — direct button in 3D mode, dropdown in 2D mode */}
        {is3DMode ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ToolbarButton asChild>
                <Button
                  onClick={handleExport3DPng}
                  disabled={isVisualizing || !hasNodes}
                  variant="ghost"
                  size="icon-sm"
                  className="z-10 shrink-0"
                  aria-label="Export PNG"
                >
                  <Download className="h-4 w-4 text-(--color-text)" />
                </Button>
              </ToolbarButton>
            </TooltipTrigger>
            <TooltipContent>Export PNG</TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={isVisualizing || !hasNodes}
                      variant="ghost"
                      size="icon-sm"
                      className="z-10 shrink-0"
                      aria-label="Export"
                    >
                      <Download className="h-4 w-4 text-(--color-text)" />
                    </Button>
                  </DropdownMenuTrigger>
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent>Export</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="center" sideOffset={8}>
              {renderMode === "svg" && (
                <DropdownMenuItem onClick={handleExportSvg}>
                  <FileCode className="h-4 w-4 mr-2" />
                  Export as SVG
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleExport2DPng}>
                <Image className="h-4 w-4 mr-2" />
                Export as PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Reset */}
        <Tooltip>
          <TooltipTrigger asChild>
            <ToolbarButton asChild>
              <Button
                onClick={resetGraph}
                disabled={isVisualizing}
                variant="ghost"
                size="icon-sm"
                className="z-10 shrink-0"
                aria-label="Reset Graph"
              >
                <RotateCcw className="h-4 w-4 text-(--color-error)" />
              </Button>
            </ToolbarButton>
          </TooltipTrigger>
          <TooltipContent>Reset Graph</TooltipContent>
        </Tooltip>
      </div>
    </Toolbar>
  );
}
