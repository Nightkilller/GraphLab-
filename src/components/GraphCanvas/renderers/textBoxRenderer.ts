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

  // Colors
  const textColor = box.color && box.color !== "default" ? box.color : getCSSVar("--color-text");
  let bgColor = getCSSVar("--color-surface");
  let borderColor = isSelected ? getCSSVar("--color-accent") : getCSSVar("--color-divider");

  if (box.backgroundColor === "badge") {
    bgColor = "rgba(16, 185, 129, 0.08)";
    borderColor = isSelected ? getCSSVar("--color-accent") : "rgba(16, 185, 129, 0.3)";
  } else if (box.backgroundColor === "note") {
    bgColor = "rgba(245, 158, 11, 0.08)";
    borderColor = isSelected ? getCSSVar("--color-accent") : "rgba(245, 158, 11, 0.3)";
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
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.stroke();

  // Draw text lines
  ctx.fillStyle = textColor;
  ctx.font = `500 ${fontSize}px Inter, -apple-system, sans-serif`;
  ctx.textBaseline = "middle";

  lines.forEach((line, idx) => {
    const textY = box.y + paddingY + (idx + 0.5) * lineHeight;
    ctx.fillText(line, box.x + paddingX, textY);
  });

  ctx.restore();
}
