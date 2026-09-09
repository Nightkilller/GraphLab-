import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

DIAGRAM_DIR = "/Users/adityagupta/Desktop/testing/docs_diagrams"
DOCX_OUTPUT_PATH = "/Users/adityagupta/Desktop/testing/GraphLab_Comprehensive_Theory_and_Algorithms_Guide.docx"

# Color Palette Constants
COLOR_NAVY = RGBColor(30, 58, 138)      # #1E3A8A
COLOR_TEAL = RGBColor(15, 118, 110)     # #0F766E
COLOR_SLATE = RGBColor(30, 41, 59)      # #1E293B
COLOR_MUTED = RGBColor(100, 116, 139)   # #64748B
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_AMBER = RGBColor(180, 83, 9)      # #B45309

HEX_NAVY = "1E3A8A"
HEX_TEAL = "0F766E"
HEX_BG_LIGHT = "F8FAFC"
HEX_CALLOUT_BG = "F1F5F9"
HEX_BORDER = "CBD5E1"

def set_cell_shading(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_callout(doc, text, title="KEY THEORETICAL INSIGHT"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_shading(cell, HEX_CALLOUT_BG)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{HEX_NAVY}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(f"★ {title}: ")
    run_title.bold = True
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(10.5)
    run_title.font.color.rgb = COLOR_NAVY
    
    run_text = p.add_run(text)
    run_text.font.name = "Calibri"
    run_text.font.size = Pt(10)
    run_text.font.color.rgb = COLOR_SLATE

def add_custom_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(18)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return h

def add_custom_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = COLOR_TEAL
    return h

def add_custom_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(2)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = COLOR_SLATE
    return h

def add_body_paragraph(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(10.5)
        r_pre.font.color.rgb = COLOR_SLATE
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.color.rgb = COLOR_SLATE
    return p

def add_bullet_point(doc, bold_title, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    r_b = p.add_run(bold_title + ": ")
    r_b.bold = True
    r_b.font.name = "Calibri"
    r_b.font.size = Pt(10.5)
    r_b.font.color.rgb = COLOR_SLATE
    r_t = p.add_run(text)
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(10.5)
    r_t.font.color.rgb = COLOR_SLATE

def add_diagram_image(doc, filename, caption_text):
    path = os.path.join(DIAGRAM_DIR, filename)
    if os.path.exists(path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(3)
        run = p_img.add_run()
        run.add_picture(path, width=Inches(6.2))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run(f"Figure: {caption_text}")
        r_cap.italic = True
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(9.5)
        r_cap.font.color.rgb = COLOR_MUTED

def style_table(table, col_widths=None):
    set_table_borders(table, color=HEX_BORDER)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Format Header Row
    for cell in table.rows[0].cells:
        set_cell_shading(cell, HEX_NAVY)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            for r in p.runs:
                r.bold = True
                r.font.name = "Calibri"
                r.font.size = Pt(10)
                r.font.color.rgb = COLOR_WHITE
    # Format Body Rows
    for i, row in enumerate(table.rows[1:]):
        bg = HEX_BG_LIGHT if i % 2 == 1 else "FFFFFF"
        for cell in row.cells:
            set_cell_shading(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                for r in p.runs:
                    r.font.name = "Calibri"
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = COLOR_SLATE
    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)

def build_word_document():
    doc = Document()
    
    # Page setup - Margins 1 inch
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # ==========================================
    # COVER PAGE / TITLE SECTION
    # ==========================================
    logo_path = "/Users/adityagupta/Desktop/testing/public/logo.png"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(20)
        p_logo.paragraph_format.space_after = Pt(14)
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_path, width=Inches(1.5))
        
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("GraphLab: Comprehensive Graph Theory & Algorithms Laboratory Guide")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(24)
    r_title.font.color.rgb = COLOR_NAVY
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("A Formal Mathematical Treatise, Algorithmic Analysis, Step-by-Step Numerical Walkthroughs, and System Architecture")
    r_sub.italic = True
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = COLOR_TEAL
    
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(20)
    r_meta = p_meta.add_run("Live Application: https://graph-lab-one.vercel.app/ | GitHub: Nightkilller/GraphLab-\nAuthor: Aditya Gupta | Framework: React 19, TypeScript, Three.js, Groq AI")
    r_meta.font.name = "Calibri"
    r_meta.font.size = Pt(10)
    r_meta.font.color.rgb = COLOR_MUTED
    
    doc.add_page_break()
    
    # ==========================================
    # EXECUTIVE SUMMARY & SYSTEM OVERVIEW
    # ==========================================
    add_custom_heading_1(doc, "Executive Summary & System Overview")
    add_body_paragraph(
        doc,
        "GraphLab is an advanced, modern interactive computational laboratory designed to bridge abstract discrete mathematics, graph theoretical theorems, and algorithmic visualization into a tactile, high-performance visual environment. Built using modern web standards (React 19, TypeScript 5, Vite 6, WebGL / Three.js, and Groq/OpenRouter LLMs), GraphLab enables mathematicians, computer scientists, students, and engineers to interactively construct, manipulate, analyze, and test graphs with mathematical rigor."
    )
    add_body_paragraph(
        doc,
        "Unlike conventional static algorithm demonstrators, GraphLab functions as a fully reactive mathematical workbench. It incorporates structural invariant solvers including the Havel-Hakimi degree sequence reduction engine, two-graph component isomorphism verification with exact vertex bijection proofs, complement graph invariant computation, 2-coloring bipartite BFS decomposition, Eulerian and Hamiltonian path solvers, and step-by-step execution of classic traversal and optimization algorithms (BFS, DFS, Dijkstra, Bellman-Ford, Prim's MST, and Cycle Detection)."
    )
    
    add_callout(
        doc,
        "GraphLab unites rigorous mathematical proofs with real-time interactive canvas mechanics. Every visual element—from node degrees to priority queues and distance tables—is directly bound to the mathematical state machine.",
        "PHILOSOPHY & DESIGN"
    )
    
    # ==========================================
    # CHAPTER 1: MATHEMATICAL FOUNDATIONS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 1: Mathematical Foundations of Graph Theory")
    
    add_custom_heading_2(doc, "1.1 Formal Graph Definitions & Notation")
    add_body_paragraph(
        doc,
        "A graph G is a mathematical structure defined as an ordered pair G = (V, E), where:",
        "Definition: "
    )
    add_bullet_point(doc, "Vertex Set V(G)", "A non-empty finite set of elements called vertices (or nodes). The order of the graph is denoted by n = |V|.")
    add_bullet_point(doc, "Edge Set E(G)", "A set of pairs of vertices called edges (or arcs). The size of the graph is denoted by m = |E|.")
    add_bullet_point(doc, "Undirected Edge", "An unordered pair {u, v} representing a bidirectional symmetric relationship between u and v.")
    add_bullet_point(doc, "Directed Edge (Arc)", "An ordered pair (u, v) denoting a relationship pointing from the source u to the target v.")
    add_bullet_point(doc, "Edge Weight Function w", "A mapping w: E -> R that assigns a numerical cost, distance, or capacity to each edge.")
    
    add_custom_heading_2(doc, "1.2 Vertex Degrees & The Handshaking Lemma")
    add_body_paragraph(
        doc,
        "The degree of a vertex v in an undirected graph, denoted deg(v) or d(v), is the number of edges incident with v (with loops counted twice in multigraphs). In a directed graph, vertex degree is bifurcated into in-degree deg-(v) (incoming arcs) and out-degree deg+(v) (outgoing arcs)."
    )
    
    add_body_paragraph(
        doc,
        "For any undirected graph G = (V, E), the sum of the degrees of all vertices is equal to twice the total number of edges:\n"
        "    sum_{v in V} deg(v) = 2 * |E|\n"
        "Proof: Each edge e = {u, v} contributes exactly +1 to deg(u) and +1 to deg(v). Summing over all edges accounts for each edge exactly twice. As an immediate consequence, every graph must contain an even number of vertices with odd degree.",
        "Theorem 1.1 (Euler's Handshaking Lemma): "
    )
    
    add_diagram_image(doc, "diagram_1_graph_basics.png", "Undirected Weighted Graph (Handshaking: sum deg(v) = 2|E|) and Directed Graph with In/Out-Degrees")
    
    add_custom_heading_2(doc, "1.3 Computational Representations of Graphs")
    add_body_paragraph(
        doc,
        "In GraphLab's internal engine, graphs can be represented through three standard data structures, each optimizing for specific algorithmic operations:"
    )
    
    tbl_rep = doc.add_table(rows=4, cols=5)
    tbl_rep.rows[0].cells[0].paragraphs[0].add_run("Representation")
    tbl_rep.rows[0].cells[1].paragraphs[0].add_run("Space")
    tbl_rep.rows[0].cells[2].paragraphs[0].add_run("Add Edge")
    tbl_rep.rows[0].cells[3].paragraphs[0].add_run("Check (u, v)")
    tbl_rep.rows[0].cells[4].paragraphs[0].add_run("Iterate Neighbors")
    
    row_data_rep = [
        ("Adjacency Matrix", "O(V^2)", "O(1)", "O(1)", "O(V)"),
        ("Adjacency List", "O(V + E)", "O(1)", "O(deg(u))", "O(deg(u)) [Optimal]"),
        ("Edge List", "O(E)", "O(1)", "O(E)", "O(E)")
    ]
    for idx, r in enumerate(row_data_rep):
        tbl_rep.rows[idx + 1].cells[0].paragraphs[0].add_run(r[0])
        tbl_rep.rows[idx + 1].cells[1].paragraphs[0].add_run(r[1])
        tbl_rep.rows[idx + 1].cells[2].paragraphs[0].add_run(r[2])
        tbl_rep.rows[idx + 1].cells[3].paragraphs[0].add_run(r[3])
        tbl_rep.rows[idx + 1].cells[4].paragraphs[0].add_run(r[4])
    style_table(tbl_rep, col_widths=[1.5, 1.0, 1.0, 1.2, 1.5])
    
    # ==========================================
    # CHAPTER 2: CANONICAL GRAPH FAMILIES
    # ==========================================
    add_custom_heading_1(doc, "Chapter 2: Canonical Graph Families & Topological Structures")
    add_body_paragraph(
        doc,
        "GraphLab provides one-click generators for standard graph families, allowing users to analyze foundational benchmarks and test structural invariants:"
    )
    
    add_bullet_point(doc, "Complete Graph (K_n)", "A simple undirected graph in which every pair of distinct vertices is connected by a unique edge. Every vertex has degree n - 1. Total edges = C(n, 2) = n(n - 1)/2. It has clique number omega(G) = n and chromatic number chi(G) = n.")
    add_bullet_point(doc, "Cycle Graph (C_n)", "A connected 2-regular graph on n >= 3 vertices consisting of a single closed loop. If n is even, C_n is bipartite (2-colorable). If n is odd, C_n has chromatic number 3 and serves as an odd-cycle witness.")
    add_bullet_point(doc, "Complete Bipartite Graph (K_{m,n})", "A graph whose vertex set can be partitioned into two disjoint sets V1 (|V1|=m) and V2 (|V2|=n) such that every vertex in V1 is adjacent to every vertex in V2, and no edges exist within the same set. Total edges = m * n.")
    add_bullet_point(doc, "Star Graph (S_n = K_{1, n-1})", "A tree with one central vertex of degree n - 1 and n - 1 peripheral leaves of degree 1. Diameter is 2.")
    add_bullet_point(doc, "Trees & Forests", "A tree is an undirected connected graph without cycles. Essential theorem: for any tree with n vertices, |E| = n - 1. A forest is a disjoint union of trees.")
    add_bullet_point(doc, "Grid Graph (P_m x P_n)", "The Cartesian product of two path graphs. Always bipartite, planar, and contains m*n vertices with m(n-1) + n(m-1) edges.")
    
    add_diagram_image(doc, "diagram_2_graph_families.png", "Canonical Graph Families: Complete K5, Cycle C6, Complete Bipartite K3,3, Star S6, Binary Tree T7, and Grid P3 x P3")
    
    # ==========================================
    # CHAPTER 3: GRAPH INVARIANTS & SOLVERS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 3: Graph Invariants & Discrete Mathematics Solvers")
    
    add_custom_heading_2(doc, "3.1 Havel-Hakimi Theorem & Graphical Sequences")
    add_body_paragraph(
        doc,
        "A finite sequence of non-negative integers (d1, d2, ..., dn) is called graphical (or graphic) if there exists a simple undirected graph whose degree sequence is precisely (d1, d2, ..., dn)."
    )
    add_body_paragraph(
        doc,
        "Let S = (d1, d2, ..., dn) be a non-increasing sequence of non-negative integers with d1 >= 1. S is graphical if and only if the modified sequence S' = (d2 - 1, d3 - 1, ..., d_{d1+1} - 1, d_{d1+2}, ..., dn) is graphical after re-sorting in descending order.",
        "Theorem 3.1 (Havel-Hakimi Reduction): "
    )
    add_body_paragraph(
        doc,
        "Step-by-Step Reduction Walkthrough for Sequence S0 = (3, 3, 2, 2, 2):\n"
        "1. d1 = 3. Subtract 1 from the next 3 elements: (3-1, 2-1, 2-1, 2) = (2, 1, 1, 2). Sort descending -> S1 = (2, 2, 1, 1).\n"
        "2. d1 = 2. Subtract 1 from the next 2 elements: (2-1, 1-1, 1) = (1, 0, 1). Sort descending -> S2 = (1, 1, 0).\n"
        "3. d1 = 1. Subtract 1 from the next 1 element: (1-1, 0) = (0, 0). Sort descending -> S3 = (0, 0).\n"
        "4. S3 = (0, 0) consists solely of non-negative zeros and is trivially graphical (two isolated vertices). By Havel-Hakimi, (3, 3, 2, 2, 2) is proved to be GRAPHICAL!",
        "Algorithmic Execution Trace: "
    )
    
    add_diagram_image(doc, "diagram_3_havel_hakimi.png", "Havel-Hakimi Reduction Proof and Synthesized Realization Graph on Canvas")
    
    add_custom_heading_2(doc, "3.2 Graph Isomorphism Problem & Canvas Two-Graph Checker")
    add_body_paragraph(
        doc,
        "Two graphs G1 = (V1, E1) and G2 = (V2, E2) are isomorphic (denoted G1 =~ G2) if there exists a bijective function f: V1 -> V2 such that for any two vertices u, v in V1:\n"
        "    {u, v} in E1 <===> {f(u), f(v)} in E2\n"
        "Isomorphism preserves all structural graph invariants: vertex order, edge cardinality, degree multiset, eigenvalues of the adjacency matrix, and subgraph counts.",
        "Definition 3.2 (Graph Isomorphism): "
    )
    add_body_paragraph(
        doc,
        "GraphLab features an automated canvas isomorphism inspector. When two disjoint graphs or components are drawn on the canvas, GraphLab executes a hierarchical filtering pipeline:\n"
        "1. Invariant Filter: Checks if |V1| == |V2| and |E1| == |E2|.\n"
        "2. Degree Sequence Filter: Sorts and compares degree multisets.\n"
        "3. Neighborhood Invariant Profile: Hashes neighbor degree profiles for each vertex.\n"
        "4. Exact Bijection Search: Performs backtracking search with constraint satisfaction to find the exact vertex mapping f: u -> v, displaying the result on canvas or giving an explicit counterexample."
    )
    
    add_diagram_image(doc, "diagram_4_isomorphism.png", "Two-Graph Isomorphism Verification: Vertex Bijection Mapping f(u) = v between Distinct Components")
    
    add_custom_heading_2(doc, "3.3 Complement Graphs & Invariants")
    add_body_paragraph(
        doc,
        "The complement (or inverse) of a simple graph G = (V, E), denoted G_bar, is a graph on the same vertex set V such that two distinct vertices are adjacent in G_bar if and only if they are NOT adjacent in G.",
        "Definition 3.3 (Complement Graph): "
    )
    add_body_paragraph(
        doc,
        "1. Sum of Edge Sizes: |E(G)| + |E(G_bar)| = C(n, 2) = n(n - 1) / 2.\n"
        "2. Degree Inversion Rule: deg_{G_bar}(v) = (n - 1) - deg_G(v) for all v in V.\n"
        "3. Self-Complementary Graphs: A graph G is self-complementary if G =~ G_bar. This implies |E(G)| = n(n - 1)/4, requiring n = 0 or 1 (mod 4). Examples include P4 (order 4) and C5 (order 5).",
        "Key Complement Invariants: "
    )
    
    add_diagram_image(doc, "diagram_5_complement.png", "Complement Graph Invariant: Original G (6 edges) + Complement G' (4 edges) = C(5, 2) = 10 Edges")
    
    add_custom_heading_2(doc, "3.4 Bipartite Graphs & Kőnig's Theorem")
    add_body_paragraph(
        doc,
        "A graph G is bipartite if and only if it contains no odd-length cycles. Furthermore, G is bipartite if and only if its chromatic number chi(G) <= 2.",
        "Theorem 3.4 (Kőnig's Theorem, 1936): "
    )
    add_body_paragraph(
        doc,
        "GraphLab employs Breadth-First Search (BFS) starting from any unvisited node. The root is assigned color 0; every neighbor is assigned color 1 - c. If an edge connects two vertices of the same color, the algorithm terminates, extracts the shortest odd cycle, and displays the exact odd-cycle counterexample proof. If 2-colorable, GraphLab can rearrange the vertices into two clean vertical columns."
    )
    
    add_diagram_image(doc, "diagram_6_bipartite.png", "Bipartite 2-Coloring BFS Partition vs Non-Bipartite Odd-Cycle Witness Triangle")
    
    add_custom_heading_2(doc, "3.5 Eulerian & Hamiltonian Paths and Circuits")
    add_body_paragraph(
        doc,
        "Eulerian Circuit Theorem: A connected undirected graph G has an Eulerian circuit (traversing every edge exactly once and returning to the start) if and only if every vertex has EVEN degree. It contains an open Eulerian path if and only if exactly TWO vertices have ODD degree.",
        "Eulerian Graphs: "
    )
    add_body_paragraph(
        doc,
        "A Hamiltonian cycle visits every VERTEX exactly once and returns to the start. Unlike Eulerian trails (which are polynomial O(E) via Fleury's or Hierholzer's algorithms), the Hamiltonian cycle problem is NP-complete. GraphLab utilizes Dirac's Theorem (min deg >= n/2 implies Hamiltonian) and Ore's Theorem (deg(u)+deg(v) >= n for non-adjacent pairs) as sufficient conditions, alongside branch-and-bound backtracking.",
        "Hamiltonian Graphs: "
    )
    
    # ==========================================
    # CHAPTER 4: CLASSIC GRAPH ALGORITHMS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 4: Classic Graph Traversal & Optimization Algorithms")
    
    add_custom_heading_2(doc, "4.1 Breadth-First Search (BFS)")
    add_body_paragraph(
        doc,
        "Breadth-First Search explores vertices in order of increasing distance (hop count) from the start node. It systematically builds a shortest-path tree on unweighted graphs using a FIFO (First-In, First-Out) Queue.",
        "Algorithmic Invariant: "
    )
    add_body_paragraph(
        doc,
        "Time Complexity: O(|V| + |E|). Space Complexity: O(|V|) auxiliary storage for Queue and Visited array.",
        "Complexity: "
    )
    
    add_custom_heading_2(doc, "4.2 Depth-First Search (DFS) & 3-Color Cycle Detection")
    add_body_paragraph(
        doc,
        "Depth-First Search explores deeply along each branch before backtracking using a LIFO Stack or recursion. It computes discovery d[u] and finishing f[u] timestamps, satisfying the Parenthesis Theorem.",
        "Algorithmic Invariant: "
    )
    add_body_paragraph(
        doc,
        "Cycle Detection is implemented via Tri-Coloring state machine:\n"
        "• WHITE: Vertex unvisited.\n"
        "• GRAY: Vertex currently being explored on the recursion stack (ancestor).\n"
        "• BLACK: Vertex and all its descendants are fully explored.\n"
        "A cycle is detected if and only if DFS encounters a directed edge (u, v) where v is GRAY (a back-edge pointing to an ancestor!).",
        "Cycle Detection State Machine: "
    )
    
    add_diagram_image(doc, "diagram_7_bfs_dfs.png", "BFS Queue Discovery Tree vs DFS Stack Recursion Tree with Gray Back-Edge Cycle Witness")
    
    add_custom_heading_2(doc, "4.3 Dijkstra's Shortest Path Algorithm")
    add_body_paragraph(
        doc,
        "Dijkstra's algorithm computes the single-source shortest path on graphs with non-negative edge weights (w(e) >= 0). It maintains a set of settled vertices S whose shortest path is finalized, and repeatedly extracts the vertex u in V \ S with minimal tentative distance d[u] using a Min-Priority Queue.",
        "Greedy Choice Property: "
    )
    add_body_paragraph(
        doc,
        "For every edge (u, v) incident to settled vertex u:\n"
        "    if d[u] + w(u, v) < d[v]:\n"
        "        d[v] = d[u] + w(u, v)\n"
        "        parent[v] = u",
        "Edge Relaxation Formula: "
    )
    add_body_paragraph(
        doc,
        "Time Complexity: O((|V| + |E|) * log |V|) using a binary min-heap; O(|V| * log |V| + |E|) using Fibonacci heap. Space: O(|V|).",
        "Complexity: "
    )
    
    add_diagram_image(doc, "diagram_8_dijkstra.png", "Dijkstra's Shortest Path Tree from Source A to All Destinations (Optimal Path to Z = 13)")
    
    # Table of Dijkstra Step-by-Step execution
    add_custom_heading_3(doc, "Dijkstra Step-by-Step Numerical Trace Table")
    tbl_dijkstra = doc.add_table(rows=7, cols=5)
    tbl_dijkstra.rows[0].cells[0].paragraphs[0].add_run("Step")
    tbl_dijkstra.rows[0].cells[1].paragraphs[0].add_run("Extracted Node u")
    tbl_dijkstra.rows[0].cells[2].paragraphs[0].add_run("d[u]")
    tbl_dijkstra.rows[0].cells[3].paragraphs[0].add_run("Edges Relaxed")
    tbl_dijkstra.rows[0].cells[4].paragraphs[0].add_run("Priority Queue State (v, dist)")
    
    dijkstra_steps = [
        ("0", "Init", "0", "Set d[A]=0, others=inf", "[(A, 0)]"),
        ("1", "A", "0", "(A, C): d[C]=2; (A, B): d[B]=4", "[(C, 2), (B, 4)]"),
        ("2", "C", "2", "(C, B): d[B]=min(4, 2+1)=3; (C, D): d[D]=10", "[(B, 3), (D, 10)]"),
        ("3", "B", "3", "(B, D): d[D]=min(10, 3+5)=8", "[(D, 8), (C, 2)*]"),
        ("4", "D", "8", "(D, E): d[E]=8+2=10; (D, Z): d[Z]=8+6=14", "[(E, 10), (Z, 14)]"),
        ("5", "E", "10", "(E, Z): d[Z]=min(14, 10+3)=13", "[(Z, 13)]")
    ]
    for idx, r in enumerate(dijkstra_steps):
        tbl_dijkstra.rows[idx + 1].cells[0].paragraphs[0].add_run(r[0])
        tbl_dijkstra.rows[idx + 1].cells[1].paragraphs[0].add_run(r[1])
        tbl_dijkstra.rows[idx + 1].cells[2].paragraphs[0].add_run(r[2])
        tbl_dijkstra.rows[idx + 1].cells[3].paragraphs[0].add_run(r[3])
        tbl_dijkstra.rows[idx + 1].cells[4].paragraphs[0].add_run(r[4])
    style_table(tbl_dijkstra, col_widths=[0.6, 1.2, 0.8, 2.0, 1.6])
    
    add_custom_heading_2(doc, "4.4 Bellman-Ford Algorithm (Negative Edge & Cycle Detection)")
    add_body_paragraph(
        doc,
        "The Bellman-Ford algorithm solves the single-source shortest path problem on general directed graphs, including edges with negative weights. By dynamic programming, it iterates |V| - 1 times, relaxing all edges in each pass. If a |V|-th pass succeeds in further reducing any distance, a negative-weight cycle exists!",
        "Principle: "
    )
    add_body_paragraph(
        doc,
        "Time Complexity: O(|V| * |E|). Space Complexity: O(|V|).",
        "Complexity: "
    )
    
    add_custom_heading_2(doc, "4.5 Prim's Minimum Spanning Tree (MST)")
    add_body_paragraph(
        doc,
        "For any cut (S, V \\ S) of a connected, undirected weighted graph, the minimum-weight edge crossing the cut belongs to every Minimum Spanning Tree of G.",
        "Cut Property Theorem: "
    )
    add_body_paragraph(
        doc,
        "Prim's algorithm starts from an arbitrary root vertex, growing a single connected tree T. At each step, it selects the minimum-weight edge connecting a tree vertex in S to a non-tree vertex in V \\ S using a Min-Priority Queue.",
        "Greedy Construction: "
    )
    add_body_paragraph(
        doc,
        "Time Complexity: O(|E| * log |V|). Space Complexity: O(|V|). An MST always contains exactly |V| - 1 edges.",
        "Complexity: "
    )
    
    add_diagram_image(doc, "diagram_9_prims_mst.png", "Prim's Minimum Spanning Tree Execution: Cut Property & Final MST (Weight = 11, Edges = 5)")
    
    # ==========================================
    # CHAPTER 5: COMPARATIVE COMPLEXITY MATRIX
    # ==========================================
    add_custom_heading_1(doc, "Chapter 5: Comparative Algorithmic Complexity Reference")
    add_body_paragraph(
        doc,
        "The following comprehensive matrix provides asymptotic bounds, algorithmic paradigms, and constraints across all algorithms implemented in GraphLab:"
    )
    
    tbl_comp = doc.add_table(rows=8, cols=6)
    headers_comp = ["Algorithm", "Paradigm", "Time", "Space", "Weights", "Primary Goal"]
    for idx, h in enumerate(headers_comp):
        tbl_comp.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    comp_data = [
        ("BFS", "Queue Exploration", "O(V + E)", "O(V)", "Unweighted", "Shortest Hops / Connectivity"),
        ("DFS", "Recursive / Stack", "O(V + E)", "O(V)", "Unweighted", "Cycle Detection / Topological"),
        ("Dijkstra", "Greedy / Min-Heap", "O((V+E) log V)", "O(V)", "Non-negative (>=0)", "Single-Source Shortest Path"),
        ("Bellman-Ford", "Dynamic Programming", "O(V * E)", "O(V)", "General (+/-)", "Negative Cycle Detection"),
        ("Prim's MST", "Greedy Cut Property", "O(E log V)", "O(V)", "General (Undirected)", "Minimum Total Edge Cost"),
        ("Havel-Hakimi", "Degree Reduction", "O(n^2 log n)", "O(n)", "Integers", "Graphical Realizability"),
        ("Isomorphism", "Branch & Bound", "O(V!) worst-case", "O(V + E)", "Structural", "Vertex Bijection Proof")
    ]
    for r_idx, row in enumerate(comp_data):
        for c_idx, val in enumerate(row):
            tbl_comp.rows[r_idx + 1].cells[c_idx].paragraphs[0].add_run(val)
    style_table(tbl_comp, col_widths=[1.2, 1.2, 1.1, 0.8, 1.1, 1.6])
    
    # ==========================================
    # CHAPTER 6: SOFTWARE ARCHITECTURE & TOOLS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 6: Software Architecture & Interactive Mechanics")
    
    add_custom_heading_2(doc, "6.1 Multi-Renderer Graphics Pipeline")
    add_body_paragraph(
        doc,
        "GraphLab implements an abstract renderer architecture supporting three interchangeable rendering modes:"
    )
    add_bullet_point(doc, "Vector SVG Mode", "Standard mode offering pixel-perfect mathematical curves, sub-pixel SVG markers, text anchors, and native DOM accessibility.")
    add_bullet_point(doc, "Canvas 2D Mode", "High-performance immediate-mode rendering capable of sustaining 60 FPS on dense networks exceeding 1,000+ vertices and edges.")
    add_bullet_point(doc, "3D WebGL Mode", "Interactive 3D spatial viewport powered by Three.js and React Three Fiber with orbit controls, spatial depth, and lighting.")
    
    add_custom_heading_2(doc, "6.2 Dual Execution & Time-Travel Engine")
    add_body_paragraph(
        doc,
        "GraphLab's visualization engine supports two operational modes:\n"
        "• Continuous Auto-Play: Plays algorithm transitions automatically with speed sliders ranging from 0.5x to 4x.\n"
        "• Manual Step-by-Step Mode: Allows jumping to start, stepping forward, stepping backward, or jumping to the end with complete state inspection at every transition."
    )
    add_body_paragraph(
        doc,
        "Every canvas manipulation (adding nodes, moving coordinates, deleting edges, adding text annotations) is recorded as an immutable snapshot in Zustand state with full cross-platform Undo/Redo (Ctrl+Z / Cmd+Z, Ctrl+Y / Cmd+Shift+Z).",
        "Undo / Redo Architecture: "
    )
    
    add_custom_heading_2(doc, "6.3 Photoshop-Style Canvas Text Box Tool")
    add_body_paragraph(
        doc,
        "The newly integrated Photoshop-Style Text Tool ('T') allows users to place rich text annotations, mathematical notes, and theorem labels anywhere on the canvas. Text boxes support:"
    )
    add_bullet_point(doc, "Direct World-Coordinate Dragging", "Text cards pan and zoom seamlessly alongside graph nodes.")
    add_bullet_point(doc, "Rich Style Formatting", "Font sizes (S, M, L, XL), color themes (Default, Emerald, Sky, Rose, Amber, Purple), and background card styles (Card, Badge, Sticky Note).")
    add_bullet_point(doc, "Double-Click Inline Editing", "Fast inline editing with Enter / Cmd+Enter to confirm and Esc to cancel.")
    add_bullet_point(doc, "Automated Annotation Placement", "The Isomorphism checker can automatically place verified bijection proofs directly onto the canvas as text cards.")
    
    add_custom_heading_2(doc, "6.4 Multi-Provider AI Graph Theory Tutor")
    add_body_paragraph(
        doc,
        "The AI Tutor provides interactive theorem proofs, Dirac/Ore invariant checks, and planarity analyses. It features universal multi-provider API key detection:\n"
        "• OpenRouter AI (sk-or-v1-...)\n"
        "• Groq LPU (gsk_...)\n"
        "• OpenAI (sk-...)\n"
        "• Google Gemini (AIza...)\n"
        "If no API key is provided or the network is offline, GraphLab seamlessly activates its built-in deterministic mathematical heuristics engine, ensuring 100% functionality with zero downtime."
    )
    
    add_custom_heading_2(doc, "6.5 Responsive Cross-Screen Design")
    add_body_paragraph(
        doc,
        "GraphLab is fully responsive across mobile phones (<768px with docked bottom controls), tablets/iPads (768px-1024px with streamlined icon toolbars), and desktop workstations (>=1024px with complete multi-renderer tools and hotkey navigation)."
    )
    
    # Save document
    doc.save(DOCX_OUTPUT_PATH)
    print("Document successfully created and saved to:", DOCX_OUTPUT_PATH)

if __name__ == "__main__":
    build_word_document()
