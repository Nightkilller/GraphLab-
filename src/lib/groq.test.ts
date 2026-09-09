import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_GROQ_API_KEY,
  getGroqApiKey,
  setGroqApiKey,
  getGroqApiKeys,
  extractJsonFromText,
  cleanReasoningText,
  cleanMathFormatting,
  GROQ_VISION_MODELS,
  GROQ_TEXT_MODELS,
} from "./groq";

describe("Groq LPU AI Client", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("handles empty default API key when env var is not set", () => {
    expect(typeof DEFAULT_GROQ_API_KEY).toBe("string");
    expect(Array.isArray(getGroqApiKeys())).toBe(true);
  });

  it("allows setting and retrieving a custom API key", () => {
    setGroqApiKey("gsk_test_mock_dummy_key_12345");
    expect(getGroqApiKey()).toBe("gsk_test_mock_dummy_key_12345");
  });

  it("has vision models configured", () => {
    expect(GROQ_VISION_MODELS).toContain("qwen/qwen3.6-27b");
    expect(GROQ_VISION_MODELS.length).toBeGreaterThanOrEqual(1);
  });

  it("has text models configured", () => {
    expect(GROQ_TEXT_MODELS).toContain("qwen/qwen3.6-27b");
    expect(GROQ_TEXT_MODELS.length).toBeGreaterThanOrEqual(1);
  });

  it("correctly extracts JSON from LLM response text", () => {
    const rawOutput = `
\`\`\`json
{
  "nodes": [
    { "id": 1, "label": "A", "x": 50, "y": 50 },
    { "id": 2, "label": "B", "x": 150, "y": 50 }
  ],
  "edges": [
    { "from": 1, "to": 2, "directed": false, "weight": 1 }
  ]
}
\`\`\``;

    const parsed = extractJsonFromText(rawOutput);
    expect(parsed).toBeDefined();
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.nodes[0].label).toBe("A");
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.edges[0].from).toBe(1);
  });

  it("strips <think> tags from response text", () => {
    const text = `<think>Some internal reasoning here</think>{"nodes":[],"edges":[]}`;
    const cleaned = cleanReasoningText(text);
    expect(cleaned).not.toContain("<think>");
    expect(cleaned).toContain("nodes");
  });

  it("cleanReasoningText handles clean markdown rendering", () => {
    const text = `# Graph Theory Analysis\n- The graph has 3 vertices.`;
    const cleaned = cleanReasoningText(text);
    expect(cleaned).toContain("# Graph Theory Analysis");
  });

  it("cleanMathFormatting removes LaTeX dollar signs and converts symbols", () => {
    const latex = `The sum $\\sum \\deg(v) = 2 \\times |E|$ with $\\delta(G) = 1$ and $\\Delta(G) = 3$. Also $\\overline{G}$ has $|E(G')| = \\binom{n}{2} - m$.`;
    const cleaned = cleanMathFormatting(latex);
    expect(cleaned).not.toContain("$");
    expect(cleaned).toContain("Σ deg(v) = 2 × |E|");
    expect(cleaned).toContain("δ(G) = 1");
    expect(cleaned).toContain("Δ(G) = 3");
    expect(cleaned).toContain("G'");
    expect(cleaned).toContain("C(n, 2)");
  });
});
