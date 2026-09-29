import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZOOM } from "../../constants/ui";
import { useGraphStore } from "../../store/graphStore";
import { isMac } from "../../utils/keyboard";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const ZoomControls = ({ onZoomIn, onZoomOut, onZoomReset }: ZoomControlsProps) => {
  const zoom = useGraphStore((state) => state.viewport.zoom);

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoomOut();
            }}
            disabled={zoom <= ZOOM.MIN}
            variant="ghost"
            size="icon-sm"
            className="relative z-10 shrink-0 cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut className={cn("h-4 w-4", zoom > ZOOM.MIN ? "text-(--color-text)" : "text-(--color-text-muted)")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out ({isMac ? "⌘-" : "Ctrl+-"})</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoomReset();
            }}
            variant="ghost"
            size="icon-xs"
            aria-label="Reset zoom"
            className="min-w-10 relative z-10 font-medium text-xs px-1.5 shrink-0 cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset Zoom ({isMac ? "⌘0" : "Ctrl+0"})</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoomIn();
            }}
            disabled={zoom >= ZOOM.MAX}
            variant="ghost"
            size="icon-sm"
            className="relative z-10 shrink-0 cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn className={cn("h-4 w-4", zoom < ZOOM.MAX ? "text-(--color-text)" : "text-(--color-text-muted)")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom In ({isMac ? "⌘+" : "Ctrl++"})</TooltipContent>
      </Tooltip>
    </div>
  );
};
