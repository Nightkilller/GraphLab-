import os
import subprocess
import markdown

SOURCE_MD = "/Users/adityagupta/.gemini/antigravity-ide/brain/59734c15-6f54-407b-ae93-77596ed1b13a/GraphLab_Algorithms_Explanation.md"
TARGET_MD = "/Users/adityagupta/Desktop/testing/GraphLab_Teacher_Explanation_Guide.md"
TARGET_HTML = "/Users/adityagupta/Desktop/testing/GraphLab_Teacher_Explanation_Guide.html"
TARGET_PDF = "/Users/adityagupta/Desktop/testing/GraphLab_Teacher_Explanation_Guide.pdf"

# 1. Read source markdown
with open(SOURCE_MD, "r", encoding="utf-8") as f:
    content = f.read()

# Also mention the newly added Random Weighted Graph for Dijkstra
if "Random Weighted Graph" not in content:
    dijkstra_addition = """
### 3.1.1 Random Weighted Graph Generation for Dijkstra

GraphLab includes an automatic **Random Weighted Graph Generator** specifically calibrated for Dijkstra's algorithm:
- **Guaranteed Connectivity**: First generates a random spanning tree so all vertices are reachable.
- **Positive Edge Weights**: Generates weights randomly distributed between 1 and 15 (strictly non-negative, fulfilling Dijkstra's prerequisites).
- **Alternative Pathways**: Adds random cross-edges (density ~60%) so the visualizer demonstrates priority-queue path relaxation and optimal route discovery.
- **Instant 1-Click Access**: Available directly via the Dijkstra instruction banner and the Template Library.
"""
    content = content.replace("### 3.2 Bellman-Ford Algorithm", dijkstra_addition + "\n### 3.2 Bellman-Ford Algorithm")

# 2. Write Markdown to project root
with open(TARGET_MD, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Wrote Markdown to: {TARGET_MD}")

# 3. Convert markdown to HTML
html_body = markdown.markdown(content, extensions=['tables', 'fenced_code', 'codehilite'])

styled_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GraphLab — Algorithms & Features Explanation Guide</title>
<style>
  @page {{
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 11pt;
    background: #ffffff;
  }}
  h1 {{
    color: #0f172a;
    font-size: 24pt;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 8px;
    margin-top: 0;
  }}
  h2 {{
    color: #1e3a8a;
    font-size: 16pt;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 24pt;
    page-break-after: avoid;
  }}
  h3 {{
    color: #0369a1;
    font-size: 13pt;
    margin-top: 16pt;
    page-break-after: avoid;
  }}
  p, li {{
    color: #334155;
  }}
  code {{
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    font-size: 9.5pt;
    color: #0f766e;
  }}
  pre {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;
    padding: 12px;
    border-radius: 4px;
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    font-size: 9pt;
    line-height: 1.45;
    overflow-x: auto;
    page-break-inside: avoid;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16pt 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 8px 10px;
    text-align: left;
  }}
  th {{
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 600;
  }}
  tr:nth-child(even) {{
    background: #f8fafc;
  }}
  blockquote {{
    margin: 12pt 0;
    padding: 8pt 14pt;
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    border-radius: 0 6px 6px 0;
    color: #1e40af;
  }}
  hr {{
    border: 0;
    height: 1px;
    background: #e2e8f0;
    margin: 20pt 0;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

with open(TARGET_HTML, "w", encoding="utf-8") as f:
    f.write(styled_html)
print(f"Wrote HTML to: {TARGET_HTML}")

# 4. Run wkhtmltopdf to create PDF
cmd = [
    "/usr/local/bin/wkhtmltopdf",
    "--enable-local-file-access",
    "--page-size", "A4",
    "--margin-top", "15mm",
    "--margin-bottom", "15mm",
    "--margin-left", "15mm",
    "--margin-right", "15mm",
    "--footer-center", "[page] / [topage]",
    "--footer-font-size", "9",
    "--footer-spacing", "5",
    TARGET_HTML,
    TARGET_PDF
]

res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0:
    print(f"Successfully generated PDF: {TARGET_PDF}")
else:
    print("wkhtmltopdf warning/error:", res.stderr)
    if os.path.exists(TARGET_PDF):
        print(f"PDF was created despite warnings: {TARGET_PDF}")
