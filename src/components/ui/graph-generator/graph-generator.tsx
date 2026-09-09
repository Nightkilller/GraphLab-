import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";
import { Button } from "../button";
import { ToolbarButton } from "../toolbar";
import { useGraphStore } from "../../../store/graphStore";
import { type GeneratedGraph } from "../../../utils/graph/graphGenerator";
import { TemplatesTab } from "./templates-tab";
import { CustomGeneratorForm } from "./custom-generator-form";

interface GraphGeneratorProps {
  disabled?: boolean;
}

export const GraphGenerator = ({ disabled }: GraphGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const appendGraph = useGraphStore((state) => state.appendGraph);

  const handleGenerate = (result: GeneratedGraph) => {
    appendGraph(result.nodes, result.edges, result.nodeCounter);
    setOpen(false);
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Generate graph"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size='sm'
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Generate</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(340px,calc(100vw-1.5rem))] max-h-[520px] overflow-y-auto p-0"
        align="center"
        sideOffset={12}
      >
        <Tabs defaultValue="templates">
          <div className="p-2 border-b border-(--color-divider)">
            <TabsList>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-3">
            <TabsContent value="templates">
              <TemplatesTab onGenerate={handleGenerate} />
            </TabsContent>

            <TabsContent value="custom">
              <CustomGeneratorForm onGenerate={handleGenerate} />
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
