/**
 * Text Box renderer for Canvas mode.
 */

import type { CanvasTextBox } from "../../Graph/types";
import { getCSSVar } from "@/theme";

export function drawTextBox(
  ctx: CanvasRenderingContext2D,
  box: CanvasTextBox,
  isSelected: boolean
): void {
  const fontSize = box.fontSize || 15;
  const lines = (box.text || "Type text...").split("\n");
  const maxLineLen = Math.max(...lines.map((l) => l.length), 6);
  const charWidth = fontSize * 0.58;
  const paddingX = 14;
  const paddingY = 10;
  const lineHeight = fontSize * 1.35;

  const width = Math.max(120, Math.round(maxLineLen * charWidth + paddingX * 2));
  const height = Math.max(38, Math.round(lines.length * lineHeight + paddingY * 2));

  ctx.save();

  // Colors & Styles
  const isCustomColor = box.color && box.color !== "default";
  const textColor = isCustomColor ? box.color! : getCSSVar("--color-text");
  let bgColor = getCSSVar("--color-surface");
  let borderColor = isSelected ? getCSSVar("--color-accent") : getCSSVar("--color-divider");
  let lineWidth = isSelected ? 2 : 1;

  if (box.backgroundColor && box.backgroundColor !== "card") {
    bgColor = box.backgroundColor;
  } else if (isCustomColor) {
    bgColor = `${box.color}14`;
  }

  if (box.borderEnabled) {
    borderColor = box.borderColor || (isCustomColor ? box.color! : getCSSVar("--color-accent"));
    lineWidth = isSelected ? 3 : 2;
  } else if (isCustomColor) {
    borderColor = isSelected ? getCSSVar("--color-accent") : `${box.color}40`;
    lineWidth = isSelected ? 2 : 1.5;
  }

  // Draw background card with rounded corners
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(box.x, box.y, width, height, 10);
  } else {
    ctx.rect(box.x, box.y, width, height);
  }

  // Card shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = isSelected ? 12 : 4;
  ctx.shadowOffsetY = isSelected ? 4 : 2;

  ctx.fillStyle = bgColor;
  ctx.fill();

  // Reset shadow for border
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Draw text lines with font family, weight, style
  const fontStyle = box.fontStyle === "italic" ? "italic" : "normal";
  const fontWeight = box.fontWeight || 500;
  const fontFamily = box.fontFamily || "Inter, -apple-system, sans-serif";

  ctx.fillStyle = textColor;
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "middle";

  lines.forEach((line, idx) => {
    const textY = box.y + paddingY + (idx + 0.5) * lineHeight;
    ctx.fillText(line, box.x + paddingX, textY);
  });

  ctx.restore();
}
