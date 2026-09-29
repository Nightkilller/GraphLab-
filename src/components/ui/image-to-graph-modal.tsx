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
  Layers,
  ExternalLink,
} from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ToolbarButton } from "./toolbar";
import { GrainTexture } from "./grain-texture";
import { useGraphStore } from "../../store/graphStore";
import {
  parseGraphFromImage,
  parseGraphOffline,
  compressImageFile,
  getGroqApiKey,
  setGroqApiKey,
  DEFAULT_GROQ_API_KEY,
} from "../../lib/groq";
import { toast } from "sonner";

interface ImageToGraphModalProps {
  disabled?: boolean;
}

const SAMPLE_PRESETS = [
  {
    id: "triangle",
    name: "Triangle K₃",
    desc: "3 nodes, 3 edges",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="100%" height="100%" fill="%23f1f5f9" rx="6"/><circle cx="60" cy="20" r="9" fill="%233b82f6"/><circle cx="28" cy="62" r="9" fill="%233b82f6"/><circle cx="92" cy="62" r="9" fill="%233b82f6"/><line x1="60" y1="20" x2="28" y2="62" stroke="%2364748b" stroke-width="2.5"/><line x1="60" y1="20" x2="92" y2="62" stroke="%2364748b" stroke-width="2.5"/><line x1="28" y1="62" x2="92" y2="62" stroke="%2364748b" stroke-width="2.5"/></svg>`,
  },
  {
    id: "star",
    name: "Star K₁,₅",
    desc: "1 hub, 5 spokes",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="100%" height="100%" fill="%23f1f5f9" rx="6"/><circle cx="60" cy="40" r="8" fill="%23ec4899"/><circle cx="60" cy="14" r="6" fill="%233b82f6"/><circle cx="86" cy="26" r="6" fill="%233b82f6"/><circle cx="78" cy="64" r="6" fill="%233b82f6"/><circle cx="42" cy="64" r="6" fill="%233b82f6"/><circle cx="34" cy="26" r="6" fill="%233b82f6"/><line x1="60" y1="40" x2="60" y2="14" stroke="%2364748b" stroke-width="2"/><line x1="60" y1="40" x2="86" y2="26" stroke="%2364748b" stroke-width="2"/><line x1="60" y1="40" x2="78" y2="64" stroke="%2364748b" stroke-width="2"/><line x1="60" y1="40" x2="42" y2="64" stroke="%2364748b" stroke-width="2"/><line x1="60" y1="40" x2="34" y2="26" stroke="%2364748b" stroke-width="2"/></svg>`,
  },
  {
    id: "cycle",
    name: "Cycle C₅",
    desc: "5-node pentagon",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="100%" height="100%" fill="%23f1f5f9" rx="6"/><circle cx="60" cy="16" r="7" fill="%2310b981"/><circle cx="92" cy="38" r="7" fill="%2310b981"/><circle cx="80" cy="66" r="7" fill="%2310b981"/><circle cx="40" cy="66" r="7" fill="%2310b981"/><circle cx="28" cy="38" r="7" fill="%2310b981"/><polygon points="60,16 92,38 80,66 40,66 28,38" fill="none" stroke="%2364748b" stroke-width="2"/></svg>`,
  },
];

export const ImageToGraphModal = ({ disabled }: ImageToGraphModalProps) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
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
    setSelectedPresetId(null);
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

  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setPreview(preset.svg);
    setSelectedPresetId(preset.id);
    setErrorMessage(null);
  };

  const handleBuildOffline = (presetId?: string) => {
    try {
      const targetPreset = presetId || selectedPresetId || undefined;
      const graph = parseGraphOffline(targetPreset);
      appendGraph(graph.nodes, graph.edges, graph.nodeCounter);
      toast.success(`Generated graph with ${graph.nodes.length} nodes (Offline Mode)!`);
      setOpen(false);
      setPreview(null);
      setSelectedPresetId(null);
      setErrorMessage(null);
    } catch (err: any) {
      toast.error("Failed to build offline graph.");
    }
  };

  const handleGenerateFromImage = async () => {
    if (!preview) return;

    // If it's a pre-built sample preset, load offline instantly
    if (selectedPresetId) {
      handleBuildOffline(selectedPresetId);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const graph = await parseGraphFromImage(preview);
      appendGraph(graph.nodes, graph.edges, graph.nodeCounter);
      toast.success(`Generated graph with ${graph.nodes.length} nodes!`);
      setOpen(false);
      setPreview(null);
      setSelectedPresetId(null);
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
            <span className="hidden lg:inline">Photo</span>
          </Button>
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(380px,calc(100vw-1.5rem))] p-4 bg-(--color-surface) border border-(--color-divider) rounded-xl shadow-xl relative overflow-hidden"
        align="center"
        sideOffset={12}
        onPaste={handlePaste}
      >
        <GrainTexture className="rounded-xl" />

        <div className="flex items-center justify-between pb-3 border-b border-(--color-divider) mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-(--color-accent)" />
            <span className="font-semibold text-sm text-(--color-text)">Photo to Graph</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-(--color-text-muted) hover:text-(--color-text) p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-(--color-text-muted) mb-3 leading-relaxed">
          Upload a sketch/diagram to detect nodes and edges with AI, or pick an offline sample sketch below.
        </p>

        {!preview ? (
          <div className="space-y-3 mb-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-(--color-divider) hover:border-(--color-accent) rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-(--color-paper)/50"
            >
              <UploadCloud className="w-7 h-7 text-(--color-accent) mb-2 opacity-80" />
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

            <div>
              <span className="text-[11px] font-medium text-(--color-text-muted) block mb-1.5">
                Or try a sample sketch (Offline Ready):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-1.5 rounded-lg border border-(--color-divider) hover:border-(--color-accent) bg-(--color-paper)/40 hover:bg-(--color-paper) transition-all text-left flex flex-col items-center cursor-pointer group"
                  >
                    <img
                      src={preset.svg}
                      alt={preset.name}
                      className="w-full h-11 object-contain rounded mb-1 bg-white/50"
                    />
                    <span className="text-[10px] font-medium text-(--color-text) truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-3">
            <div className="relative rounded-lg overflow-hidden border border-(--color-divider) max-h-[170px] bg-black/5 flex items-center justify-center">
              <img src={preview} alt="Graph Preview" className="object-contain max-h-[170px] w-full" />
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedPresetId(null);
                  setErrorMessage(null);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs space-y-2">
                <div className="flex items-start gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
                <div className="pt-1 border-t border-red-500/20 flex items-center justify-between">
                  <span className="text-[10px] text-(--color-text-muted)">Offline or no API key?</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBuildOffline()}
                    className="h-6 text-[10px] px-2 gap-1 text-(--color-accent) border-(--color-accent)/30"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Build as Offline Graph</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleGenerateFromImage}
                disabled={isLoading}
                className="gap-1.5 justify-center font-medium text-xs h-8"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-(--color-accent)" />
                    <span>{selectedPresetId ? "Build on Canvas" : "Build with AI"}</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleBuildOffline()}
                disabled={isLoading}
                variant="outline"
                className="gap-1.5 justify-center font-medium text-xs h-8 text-(--color-text-muted) hover:text-(--color-text)"
                size="sm"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Build Offline</span>
              </Button>
            </div>
          </div>
        )}

        {/* API Key Settings Drawer */}
        <div className="pt-2 border-t border-(--color-divider) text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-(--color-text-muted) text-[10px]">
              Offline Ready + Groq / OpenRouter AI
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-(--color-text-muted) hover:text-(--color-text) flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Key className="w-3 h-3" />
              <span>{showSettings ? "Hide Key" : "API Key"}</span>
            </button>
          </div>

          {showSettings && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-(--color-paper) border border-(--color-divider) space-y-2.5 animate-in fade-in-50 duration-150">
              <div>
                <label className="text-[10px] font-medium text-(--color-text) block mb-1">
                  API Key for Cloud AI Vision
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your key (gsk_..., sk-or-..., AIza..., or sk-proj-...)"
                  className="w-full px-2 py-1 text-xs rounded bg-(--color-surface) border border-(--color-divider) text-(--color-text) font-mono"
                />
              </div>

              <div className="text-[10px] text-(--color-text-muted) space-y-1 bg-(--color-surface)/60 p-2 rounded border border-(--color-divider)">
                <span className="font-medium text-(--color-text) block">Free Vision API Keys:</span>
                <div className="flex items-center justify-between">
                  <span>Groq (Recommended, fastest):</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--color-accent) hover:underline flex items-center gap-0.5"
                  >
                    console.groq.com <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span>Google Gemini:</span>
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--color-accent) hover:underline flex items-center gap-0.5"
                  >
                    aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
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
