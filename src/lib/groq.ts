/**
 * Groq LPU AI Client for Graphisual
 * Fast vision & text inference with native browser CORS support
 */

import { GraphNode, GraphEdge } from "../components/Graph/types";
import { NODE, EDGE, EDGE_TYPE, type EdgeType } from "../constants/graph";
import { calculateAccurateCoords } from "../utils/geometry/calc";
import { type GeneratedGraph } from "../utils/graph/graphGenerator";

export const DEFAULT_GROQ_API_KEY = (import.meta.env?.VITE_GROQ_API_KEY as string | undefined) || "";

// Backward-compatible exports
export const DEFAULT_AI_KEY = DEFAULT_GROQ_API_KEY;
export const DEFAULT_GROQ_API_KEYS = DEFAULT_GROQ_API_KEY ? [DEFAULT_GROQ_API_KEY] : [];

let memoryApiKey: string | null = null;

export function getGroqApiKey(): string {
  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem("graphisual_ai_api_key") || localStorage.getItem("graphisual_groq_api_key");
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
    } catch {}
  }
  if (memoryApiKey) return memoryApiKey;
  return DEFAULT_GROQ_API_KEY;
}

export function setGroqApiKey(key: string): void {
  const trimmed = key.trim();
  if (typeof localStorage !== "undefined") {
    try {
      if (trimmed) {
        localStorage.setItem("graphisual_ai_api_key", trimmed);
        localStorage.setItem("graphisual_groq_api_key", trimmed);
      } else {
        localStorage.removeItem("graphisual_ai_api_key");
        localStorage.removeItem("graphisual_groq_api_key");
      }
    } catch {}
  }
  memoryApiKey = trimmed || null;
}

// Backward compatibility helpers
export function getGroqApiKeys(): string[] {
  return [getGroqApiKey()];
}

export function setGroqApiKeys(keys: string[]): void {
  if (keys && keys.length > 0 && keys[0]) {
    setGroqApiKey(keys[0]);
  }
}

export function getActiveKeyIndex(): number {
  return 0;
}

export const GROQ_VISION_MODELS = [
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
];

export const GROQ_TEXT_MODELS = [
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
];

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
}

/**
 * Safely extracts JSON from LLM response text, stripping out any formatting or thinking tags
 */
export function extractJsonFromText(text: string): any {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 1. Try markdown block ```json ... ``` or ``` ... ```
  const blockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (blockMatch && blockMatch[1]) {
    try {
      return JSON.parse(blockMatch[1].trim());
    } catch {}
  }

  // 2. Try outermost { ... }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  // 3. Fallback direct parse
  return JSON.parse(cleaned);
}

/**
 * Strips reasoning tokens from text output for clean user display
 */
export function cleanReasoningText(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/**
 * Sanitizes LaTeX math formatting and dollar signs into clean, readable text.
 * Converts common LaTeX notation (e.g. \sum, \delta, \Delta, \times, \overline{G})
 * and removes enclosing $ and $$ delimiters so formulas look natural and clean.
 */
export function cleanMathFormatting(text: string): string {
  return text
    // Replace common LaTeX expressions
    .replace(/\\sum/g, "Σ")
    .replace(/\\deg/g, "deg")
    .replace(/\\delta/g, "δ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\le(q)?/g, "≤")
    .replace(/\\ge(q)?/g, "≥")
    .replace(/\\ne(q)?/g, "≠")
    .replace(/\\in/g, "∈")
    .replace(/\\notin/g, "∉")
    .replace(/\\leftrightarrow/g, "↔")
    .replace(/\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\binom\{([^}]+)\}\{([^}]+)\}/g, "C($1, $2)")
    .replace(/\\overline\{([^}]+)\}/g, "$1'")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\lfloor\s*(.*?)\s*\\rfloor/g, "⌊$1⌋")
    .replace(/\\lceil\s*(.*?)\s*\\rceil/g, "⌈$1⌉")
    // Remove block and inline dollar delimiters: $$formula$$ or $formula$
    .replace(/\$\$([^$]+)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    // Cleanup any lingering backslashes before plain variable names like \v or \n
    .replace(/\\([a-zA-Z]+)/g, "$1");
}

/**
 * Resizes and compresses an image file before sending to Vision API.
 * Keeps resolution sharp (up to 800px) while reducing payload size to ~35KB for fast transmission.
 */
export async function compressImageFile(file: File, maxDim = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(width, 10);
        canvas.height = Math.max(height, 10);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Call the Groq API with a specific model
 */
async function executeGroqCall(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  timeoutMs = 30000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("Request timeout")), timeoutMs);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.1,
        reasoning_effort: "none",
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) throw new Error(`Empty response from model ${model}`);
    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Call Groq AI API — tries each model in sequence until one succeeds
 */
export async function callAIAPI(messages: ChatMessage[], maxTokens = 900): Promise<string> {
  const apiKey = getGroqApiKey();
  const isVision = messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c) => c.type === "image_url")
  );

  const models = isVision ? GROQ_VISION_MODELS : GROQ_TEXT_MODELS;

  for (const model of models) {
    try {
      return await executeGroqCall(apiKey, model, messages, maxTokens, 30000);
    } catch (err: any) {
      console.warn(`[Groq] ${model} failed:`, err?.message || err);
    }
  }

  throw new Error("AI generation failed. Please check your network connection or verify your API key.");
}

export const callGroqAPI = callAIAPI;

/**
 * Parses an uploaded graph image into nodes and edges.
 */
export async function parseGraphFromImage(base64DataUrl: string): Promise<GeneratedGraph> {
  const prompt = `/no_think
You are an expert graph theory computer vision engine.
Analyze the user's diagram/sketch of a graph.
Identify all vertices (nodes) and all connections (edges).
Return ONLY a valid JSON object matching this exact specification:
{
  "nodes": [
    { "id": 1, "label": "A", "x": 100, "y": 100 },
    { "id": 2, "label": "B", "x": 300, "y": 100 }
  ],
  "edges": [
    { "from": 1, "to": 2, "directed": false, "weight": 1 }
  ]
}
Rules:
1. Detect ALL vertices and their labels (letters or numbers).
2. Assign each vertex a unique integer id (1, 2, 3...).
3. Detect ALL edges connecting vertices. In "edges", set "from" and "to" using the integer "id" of the connected vertices.
4. Set "directed": true only if arrows are clearly visible, otherwise false.
Do NOT include any explanation, markdown formatting, or thinking. Output ONLY the raw JSON object.`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: base64DataUrl } },
      ],
    },
  ];

  const rawResponse = await callAIAPI(messages, 900);

  let parsed: any;
  try {
    parsed = extractJsonFromText(rawResponse);
  } catch (err) {
    console.error("Failed to parse vision response:", rawResponse);
    throw new Error("Could not parse graph structure from image. Please try a clearer sketch or photo.");
  }

  if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    throw new Error("Could not detect any vertices in the image. Please upload a clearer diagram.");
  }

  const rawNodes: any[] = parsed.nodes;
  const count = rawNodes.length;

  // Collect coordinate distributions
  const rawXs = rawNodes.map((n) => (typeof n.x === "number" ? n.x : 0));
  const rawYs = rawNodes.map((n) => (typeof n.y === "number" ? n.y : 0));
  const minX = Math.min(...rawXs);
  const maxX = Math.max(...rawXs);
  const minY = Math.min(...rawYs);
  const maxY = Math.max(...rawYs);
  const spanX = maxX - minX;
  const spanY = maxY - minY;

  const isDegenerate = spanX < 10 && spanY < 10;

  // Build normalized nodes
  const nodes: GraphNode[] = [];
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  // Scaling factor to fit within canvas bounds
  let scale = 1;
  if (!isDegenerate) {
    if (Math.max(spanX, spanY) <= 2) {
      scale = 320;
    } else {
      const maxSpan = Math.max(spanX, spanY);
      scale = Math.min(480 / (spanX || 1), 340 / (spanY || 1), 400 / maxSpan);
    }
  }

  for (let i = 0; i < count; i++) {
    const raw = rawNodes[i];
    const id = typeof raw.id === "number" ? raw.id : i + 1;
    const label = raw.label ? String(raw.label).trim() : String(i + 1);

    let x = 0;
    let y = 0;

    if (isDegenerate) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      const radius = Math.min(180, 70 + count * 18);
      x = Math.round(Math.cos(angle) * radius);
      y = Math.round(Math.sin(angle) * radius);
    } else {
      x = Math.round((rawXs[i] - midX) * scale);
      y = Math.round((rawYs[i] - midY) * scale);
      x = Math.max(-270, Math.min(270, x));
      y = Math.max(-190, Math.min(190, y));
    }

    nodes.push({
      id,
      label,
      x,
      y,
      r: NODE.RADIUS,
    });
  }

  // Node repulsion pass to ensure minimum distance between nodes (avoid overlapping)
  const minDistance = 68;
  for (let iter = 0; iter < 15; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.hypot(dx, dy) || 0.1;
        if (dist < minDistance) {
          const overlap = (minDistance - dist) / 2;
          const nx = (dx / dist) * overlap;
          const ny = (dy / dist) * overlap;
          nodes[i].x -= nx;
          nodes[i].y -= ny;
          nodes[j].x += nx;
          nodes[j].y += ny;
        }
      }
    }
  }

  // Lookup map for edge connections
  const nodeLookup = new Map<string, GraphNode>();
  nodes.forEach((n, idx) => {
    nodeLookup.set(String(n.id), n);
    nodeLookup.set(String(n.label).toUpperCase(), n);
    nodeLookup.set(String(n.label).toLowerCase(), n);
    nodeLookup.set(String(idx + 1), n);
    nodeLookup.set(String(idx), n);
  });

  const findNode = (key: any): GraphNode | undefined => {
    if (key === undefined || key === null) return undefined;
    const str = String(key).trim();
    return (
      nodeLookup.get(str) ||
      nodeLookup.get(str.toUpperCase()) ||
      nodeLookup.get(str.toLowerCase()) ||
      nodeLookup.get(String(Number(str)))
    );
  };

  const edges = new Map<number, GraphEdge[]>();
  nodes.forEach((n) => edges.set(n.id, []));

  if (Array.isArray(parsed.edges)) {
    for (const e of parsed.edges) {
      const fromNode = findNode(e.from);
      const toNode = findNode(e.to);
      if (!fromNode || !toNode || fromNode.id === toNode.id) continue;

      const edgeType: EdgeType = e.directed ? EDGE_TYPE.DIRECTED : EDGE_TYPE.UNDIRECTED;
      const weight = typeof e.weight === "number" ? e.weight : EDGE.DEFAULT_WEIGHT;

      const { tempX, tempY } = calculateAccurateCoords(fromNode.x, fromNode.y, toNode.x, toNode.y);
      const newEdge: GraphEdge = {
        x1: fromNode.x,
        y1: fromNode.y,
        x2: tempX,
        y2: tempY,
        nodeX2: toNode.x,
        nodeY2: toNode.y,
        from: fromNode.id,
        to: toNode.id,
        weight,
        type: edgeType,
      };
      edges.get(fromNode.id)?.push(newEdge);

      if (edgeType === EDGE_TYPE.UNDIRECTED) {
        const { tempX: rx, tempY: ry } = calculateAccurateCoords(toNode.x, toNode.y, fromNode.x, fromNode.y);
        edges.get(toNode.id)?.push({
          x1: toNode.x,
          y1: toNode.y,
          x2: rx,
          y2: ry,
          nodeX2: fromNode.x,
          nodeY2: fromNode.y,
          from: toNode.id,
          to: fromNode.id,
          weight,
          type: edgeType,
        });
      }
    }
  }

  const maxId = Math.max(0, ...nodes.map((n) => n.id));

  return {
    nodes,
    edges,
    nodeCounter: maxId + 1,
  };
}

/**
 * Ask AI to explain the current graph according to Graph Theory fundamentals
 */
export async function explainGraphTheory(
  graphSummary: {
    nodeCount: number;
    edgeCount: number;
    degrees: Array<{ id: number; label: string; degree: number }>;
    isDirected: boolean;
  },
  customQuery?: string
): Promise<string> {
  const prompt = `/no_think
You are a world-class Discrete Mathematics and Graph Theory professor.
The user has constructed a graph on canvas with:
- Vertices: ${graphSummary.nodeCount} (${graphSummary.degrees.map((d) => `${d.label}: deg ${d.degree}`).join(", ")})
- Total Edges: ${graphSummary.edgeCount} (${graphSummary.isDirected ? "Directed" : "Undirected"})

${
  customQuery
    ? `User Question: "${customQuery}"`
    : `Please provide a concise, engaging Graph Theory Analysis covering:
1. **Eulerian Status**: Is it an Euler Circuit, Euler Path, or Non-Eulerian? Explain using vertex degrees.
2. **Hamiltonian Characteristics**: Does it satisfy Dirac's or Ore's theorem or have an apparent Hamiltonian path/cycle?
3. **Connectedness & Components**: Brief assessment of connectivity.
4. **Complement Graph (G')**: Mention how many edges the complement graph would have: |E(G')| = n(n-1)/2 - |E(G)|.`
}

FORMATTING INSTRUCTIONS:
- Use clean GitHub markdown with bold headers and short bullet points.
- STRICT RULE: Do NOT use LaTeX math syntax or dollar signs ($ or $$). Write all mathematical expressions, variables, formulas, and notations using plain text or unicode characters (e.g. use 'deg(v)', 'Σ deg(v)', '|V|', '|E|', 'δ(G)', 'Δ(G)', 'G complement', 'n(n-1)/2'). Never output raw $ symbols.`;

  const messages: ChatMessage[] = [
    { role: "system", content: "You are an expert Graph Theory and Algorithm Tutor. Respond with clear markdown. Never use dollar signs ($) or LaTeX math syntax." },
    { role: "user", content: prompt },
  ];

  const raw = await callAIAPI(messages, 900);
  const cleanedReasoning = cleanReasoningText(raw);
  return cleanMathFormatting(cleanedReasoning);
}
