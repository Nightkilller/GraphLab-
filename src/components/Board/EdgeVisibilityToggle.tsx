import { Eye, EyeOff, Layers } from "lucide-react";
import { Button } from "../ui/button";
import { ToolbarButton } from "../ui/toolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useSettingsStore } from "../../store/settingsStore";

interface EdgeVisibilityToggleProps {
  disabled?: boolean;
}

export const EdgeVisibilityToggle = ({ disabled }: EdgeVisibilityToggleProps) => {
  const edgeVisibility = useSettingsStore((state) => state.edgeVisibility);
  const setEdgeVisibility = useSettingsStore((state) => state.setEdgeVisibility);

  const getLabel = () => {
    switch (edgeVisibility) {
      case "dim":
        return "Dim Unused";
      case "hide":
        return "Hide Unused";
      default:
        return "All Edges";
    }
  };

  const getIcon = () => {
    switch (edgeVisibility) {
      case "hide":
        return <EyeOff className="w-4 h-4 text-(--color-accent)" />;
      case "dim":
        return <Layers className="w-4 h-4 text-(--color-accent)" />;
      default:
        return <Eye className="w-4 h-4 text-(--color-text)" />;
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolbarButton asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label="Edge visibility"
                className="z-10 shrink-0"
              >
                {getIcon()}
              </Button>
            </DropdownMenuTrigger>
          </ToolbarButton>
        </TooltipTrigger>
        <TooltipContent>Edge Visibility: {getLabel()}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="center" sideOffset={8} className="w-44">
        <DropdownMenuItem onClick={() => setEdgeVisibility("all")} className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-(--color-text-muted)" />
          <div className="flex flex-col">
            <span className="font-medium text-xs">Show All Edges</span>
            <span className="text-[10px] text-(--color-text-muted)">Default graph display</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setEdgeVisibility("dim")} className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-(--color-accent)" />
          <div className="flex flex-col">
            <span className="font-medium text-xs">Dim Unused Edges</span>
            <span className="text-[10px] text-(--color-text-muted)">Highlight path/cycles</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setEdgeVisibility("hide")} className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-pink-500" />
          <div className="flex flex-col">
            <span className="font-medium text-xs">Hide Unused Edges</span>
            <span className="text-[10px] text-(--color-text-muted)">Show path only</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
