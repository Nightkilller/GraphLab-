import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  X,
  AlertCircle,
  Key,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ToolbarButton } from "./toolbar";
import { GrainTexture } from "./grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  parseGraphFromImage,
  compressImageFile,
  getGroqApiKey,
  setGroqApiKey,
  DEFAULT_GROQ_API_KEY,
} from "../../lib/groq";
import { toast } from "sonner";

interface ImageToGraphModalProps {
  disabled?: boolean;
}

export const ImageToGraphModal = ({ disabled }: ImageToGraphModalProps) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGroqApiKey());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendGraph = useGraphStore((state) => state.appendGraph);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or WebP).");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 800);
      setPreview(compressed);
      setErrorMessage(null);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setErrorMessage(null);
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

  const handleGenerateFromImage = async () => {
    if (!preview) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const graph = await parseGraphFromImage(preview);
      appendGraph(graph.nodes, graph.edges, graph.nodeCounter);
      toast.success(`Generated graph with ${graph.nodes.length} nodes!`);
      setOpen(false);
      setPreview(null);
    } catch (err: any) {
      console.error("Vision generation error:", err);
      const msg = err.message || "Failed to analyze graph image.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = () => {
    setGroqApiKey(apiKeyInput.trim());
    toast.success("API key saved successfully!");
    setShowSettings(false);
  };

  const handleResetKey = () => {
    setApiKeyInput(DEFAULT_GROQ_API_KEY);
    setGroqApiKey(DEFAULT_GROQ_API_KEY);
    toast.info("Reset API key to default.");
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton asChild>
          <Button
            disabled={disabled}
            aria-label="Scan graph from image"
            className="w-auto px-2 h-8 gap-1.5 justify-center shrink-0"
            size="sm"
          >
            <ImageIcon className="w-4 h-4 shrink-0 text-(--color-accent)" />
            <span className="hidden md:inline">Photo</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-[360px] p-4 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-xl relative overflow-hidden"
        align="center"
        sideOffset={12}
        onPaste={handlePaste}
      >
        <GrainTexture className="rounded-xl" />

        <div className="flex items-center justify-between pb-3 border-b border-(--color-divider) mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-(--color-accent)" />
            <span className="font-semibold text-sm text-(--color-text)">Photo to Graph (Groq AI)</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-(--color-text-muted) hover:text-(--color-text) p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-(--color-text-muted) mb-3 leading-relaxed">
          Upload or paste a photo, screenshot, or sketch of any graph. Groq AI will automatically detect the nodes and connections.
        </p>

        {!preview ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-(--color-divider) hover:border-(--color-accent) rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-(--color-paper)/50 mb-3"
          >
            <UploadCloud className="w-8 h-8 text-(--color-accent) mb-2 opacity-80" />
            <span className="text-xs font-medium text-(--color-text)">Click to upload or drag & drop</span>
            <span className="text-[10px] text-(--color-text-muted) mt-1">Supports PNG, JPG, or Paste (Cmd+V)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-3 mb-3">
            <div className="relative rounded-lg overflow-hidden border border-(--color-divider) max-h-[180px] bg-black/5 flex items-center justify-center">
              <img src={preview} alt="Graph Preview" className="object-contain max-h-[180px] w-full" />
              <button
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              onClick={handleGenerateFromImage}
              disabled={isLoading}
              className="w-full gap-2 justify-center font-medium"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Graph…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Build Graph on Canvas</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Unobtrusive API Key Settings Footer */}
        <div className="pt-2 border-t border-(--color-divider) text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-(--color-text-muted) text-[10px]">
              Engine: <strong className="text-(--color-accent) font-medium">Groq LPU</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-(--color-text-muted) hover:text-(--color-text) flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Key className="w-3 h-3" />
              <span>{showSettings ? "Close Key" : "API Key"}</span>
            </button>
          </div>

          {showSettings && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-2 animate-in fade-in-50 duration-150">
              <div>
                <label className="text-[10px] font-medium text-(--color-text) block mb-0.5">
                  Groq API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-2 py-1 text-xs rounded bg-(--color-surface) border border-(--color-divider) text-(--color-text) font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetKey}
                  className="h-6 text-[10px] px-2 gap-1 text-(--color-text-muted)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveKey}
                  className="h-6 text-[10px] px-2.5 gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Save Key</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
