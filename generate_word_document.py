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
    h.paragraph_format.space_before = Pt(20)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(17)
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
    run.font.size = Pt(13.5)
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
    run.font.size = Pt(11.5)
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
    r_sub = p_sub.add_run("A Formal Mathematical Treatise: Degree Sequence Constructive Realization, Subgraphs, Structural Invariants, Worked Examples, and Interactive Architecture")
    r_sub.italic = True
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(12.5)
    r_sub.font.color.rgb = COLOR_TEAL
    
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(20)
    r_meta = p_meta.add_run("Live Application: https://graph-lab-one.vercel.app/ | GitHub: Nightkilller/GraphLab-\nAuthor: Aditya Gupta | Framework: React 19, TypeScript, Three.js, Groq / OpenRouter AI")
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
        "GraphLab is an interactive discrete mathematics laboratory designed to bridge formal graph theory theorems, algebraic structural invariants, and visual canvas mechanics into an intuitive, high-performance workbench. Built using modern web engineering standards (React 19, TypeScript 5, Vite 6, Three.js WebGL, and Groq/OpenRouter LLMs), GraphLab enables mathematicians, educators, researchers, and students to construct, analyze, decompose, and verify graph structures with mathematical rigor."
    )
    add_body_paragraph(
        doc,
        "Unlike generic algorithm animators, GraphLab functions as a reactive mathematical engine. Its primary capabilities focus on fundamental discrete mathematics: step-by-step constructive graph realization from degree sequences via the Havel-Hakimi theorem; vertex-induced, edge-induced, and spanning subgraph extraction; two-graph component isomorphism verification with exact vertex bijection proofs; complement graph invariant computation; 2-coloring bipartite BFS decomposition; Eulerian and Hamiltonian path solvers; tri-color DFS cycle detection; and BFS unweighted shortest-path trees."
    )
    
    add_callout(
        doc,
        "GraphLab unites rigorous mathematical proofs with real-time interactive canvas mechanics. Every visual element—from node degrees to priority queues, adjacency matrices, and text annotations—is directly synchronized with the mathematical graph state machine.",
        "PHILOSOPHY & DESIGN"
    )
    
    # ==========================================
    # CHAPTER 1: MATHEMATICAL FOUNDATIONS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 1: Mathematical Foundations of Graph Theory")
    
    add_custom_heading_2(doc, "1.1 Formal Graph Definitions & Notation")
    add_body_paragraph(
        doc,
        "A graph G is formally defined as an ordered pair G = (V, E), where:",
        "Definition 1.1: "
    )
    add_bullet_point(doc, "Vertex Set V(G)", "A non-empty finite set of elements called vertices (or nodes). The order of the graph is denoted by n = |V|.")
    add_bullet_point(doc, "Edge Set E(G)", "A set of pairs of vertices called edges (or arcs). The size of the graph is denoted by m = |E|.")
    add_bullet_point(doc, "Undirected Edge", "An unordered pair {u, v} representing a bidirectional symmetric adjacency between u and v.")
    add_bullet_point(doc, "Directed Edge (Arc)", "An ordered pair (u, v) denoting an asymmetrical arc directed from source u to target v.")
    add_bullet_point(doc, "Simple Graph", "An undirected graph containing no self-loops (edges from a vertex to itself) and no multi-edges (multiple edges between the same pair of vertices).")
    
    add_custom_heading_3(doc, "Concrete Worked Example 1.1: Graph Representation")
    add_body_paragraph(
        doc,
        "Consider an undirected simple graph G1 with vertex set V = {1, 2, 3, 4, 5} and edge set E = {(1, 2), (1, 3), (2, 3), (2, 4), (3, 5), (4, 5)}. Here, order n = |V| = 5 and size m = |E| = 6."
    )
    add_body_paragraph(
        doc,
        "We can represent G1 computationally in three ways:\n"
        "1. Adjacency Matrix A (symmetric 5x5 binary matrix where A[i][j] = 1 if (i, j) in E, else 0):\n"
        "       [0, 1, 1, 0, 0]\n"
        "       [1, 0, 1, 1, 0]\n"
        "   A = [1, 1, 0, 0, 1]\n"
        "       [0, 1, 0, 0, 1]\n"
        "       [0, 0, 1, 1, 0]\n"
        "2. Adjacency List: { 1: [2, 3], 2: [1, 3, 4], 3: [1, 2, 5], 4: [2, 5], 5: [3, 4] }.\n"
        "3. Edge List: [ (1, 2), (1, 3), (2, 3), (2, 4), (3, 5), (4, 5) ]."
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
    
    add_custom_heading_2(doc, "1.2 Vertex Degrees & The Handshaking Lemma")
    add_body_paragraph(
        doc,
        "The degree of a vertex v in an undirected graph, denoted deg(v) or d(v), is the number of edges incident with v. In directed graphs, degree is bifurcated into in-degree deg-(v) (incoming arcs) and out-degree deg+(v) (outgoing arcs)."
    )
    add_body_paragraph(
        doc,
        "For any undirected graph G = (V, E), the sum of the degrees of all vertices equals exactly twice the total number of edges:\n"
        "    sum_{v in V} deg(v) = 2 * |E|\n"
        "Proof: Each undirected edge e = {u, v} has two endpoints. When we sum the degrees across all vertices, edge e contributes exactly +1 to deg(u) and +1 to deg(v). Therefore, each edge is counted precisely twice. An immediate corollary is that every graph must have an EVEN number of vertices with odd degree.",
        "Theorem 1.1 (Euler's Handshaking Lemma, 1736): "
    )
    
    add_custom_heading_3(doc, "Concrete Worked Example 1.2: Handshaking Lemma Verification")
    add_body_paragraph(
        doc,
        "Let us calculate the vertex degrees for graph G1 from Example 1.1:\n"
        "• deg(1) = 2 (incident to {1, 2}, {1, 3})\n"
        "• deg(2) = 3 (incident to {2, 1}, {2, 3}, {2, 4})\n"
        "• deg(3) = 3 (incident to {3, 1}, {3, 2}, {3, 5})\n"
        "• deg(4) = 2 (incident to {4, 2}, {4, 5})\n"
        "• deg(5) = 2 (incident to {5, 3}, {5, 4})\n"
        "Sum of degrees: 2 + 3 + 3 + 2 + 2 = 12.\n"
        "Check twice edge count: 2 * |E| = 2 * 6 = 12. Perfect match!\n"
        "Notice also that vertices with odd degrees are {2, 3} (count = 2, which is even, satisfying the Handshaking corollary)."
    )
    
    add_diagram_image(doc, "diagram_1_graph_basics.png", "Undirected Graph (Handshaking: sum deg(v) = 2|E| = 14) and Directed Graph with In/Out-Degrees")
    
    # ==========================================
    # CHAPTER 2: CANONICAL GRAPH FAMILIES
    # ==========================================
    add_custom_heading_1(doc, "Chapter 2: Canonical Graph Families & Topological Benchmarks")
    add_body_paragraph(
        doc,
        "GraphLab provides one-click visual generators for canonical graph families. These families serve as theoretical benchmarks for invariant testing, chromatic number analysis, and planarity checks:"
    )
    
    add_bullet_point(doc, "Complete Graph (K_n)", "A simple undirected graph in which every distinct pair of vertices is connected by an edge. Every vertex has degree n - 1 (it is (n-1)-regular). Total edges = C(n, 2) = n(n - 1)/2. Clique number omega(K_n) = n, chromatic number chi(K_n) = n.")
    add_bullet_point(doc, "Cycle Graph (C_n)", "A connected 2-regular graph on n >= 3 vertices forming a closed loop. Total edges = n. If n is even, C_n is bipartite (chi = 2). If n is odd, chi = 3, serving as an odd-cycle witness against bipartiteness.")
    add_bullet_point(doc, "Complete Bipartite Graph (K_{m,n})", "A graph whose vertex set is partitioned into disjoint sets V1 (|V1|=m) and V2 (|V2|=n) such that every vertex in V1 is adjacent to every vertex in V2, and no edges exist within V1 or V2. Total edges = m * n. By Kuratowski's theorem, K_{3,3} is non-planar.")
    add_bullet_point(doc, "Star Graph (S_n = K_{1, n-1})", "A tree with 1 central hub vertex of degree n - 1 and n - 1 peripheral leaves of degree 1. Total edges = n - 1, diameter = 2.")
    add_bullet_point(doc, "Trees & Forests", "A tree is an undirected connected acyclic graph. Fundamental theorem: any tree on n vertices has exactly |E| = n - 1 edges. Every tree on n >= 2 vertices possesses at least two leaves (vertices of degree 1). A forest is an acyclic graph (disjoint union of trees).")
    add_bullet_point(doc, "Grid Graph (P_m x P_n)", "Cartesian product of two path graphs. Always bipartite and planar. Contains m * n vertices and m(n - 1) + n(m - 1) edges.")
    
    add_custom_heading_3(doc, "Concrete Worked Examples 2.1: Family Numerical Profiles")
    add_body_paragraph(
        doc,
        "The following table provides the exact mathematical parameters for standard instances generated in GraphLab:"
    )
    
    tbl_fam = doc.add_table(rows=7, cols=6)
    headers_fam = ["Family", "Order (n)", "Size (m)", "Degree Sequence", "Chromatic chi", "Planar?"]
    for idx, h in enumerate(headers_fam):
        tbl_fam.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    fam_data = [
        ("Complete K5", "5", "10", "(4, 4, 4, 4, 4)", "5", "No (Kuratowski)"),
        ("Cycle C6", "6", "6", "(2, 2, 2, 2, 2, 2)", "2 (Bipartite)", "Yes"),
        ("Bipartite K3,3", "6", "9", "(3, 3, 3, 3, 3, 3)", "2", "No (Kuratowski)"),
        ("Star S6", "6", "5", "(5, 1, 1, 1, 1, 1)", "2", "Yes"),
        ("Binary Tree T7", "7", "6", "(3, 3, 2, 1, 1, 1, 1)", "2", "Yes"),
        ("Grid P3 x P3", "9", "12", "(4, 3, 3, 3, 3, 2, 2, 2, 2)", "2", "Yes")
    ]
    for r_idx, row in enumerate(fam_data):
        for c_idx, val in enumerate(row):
            tbl_fam.rows[r_idx + 1].cells[c_idx].paragraphs[0].add_run(val)
    style_table(tbl_fam, col_widths=[1.3, 0.8, 0.8, 1.8, 1.1, 1.2])
    
    add_diagram_image(doc, "diagram_2_graph_families.png", "Canonical Graph Families: Complete K5, Cycle C6, Complete Bipartite K3,3, Star S6, Binary Tree T7, and Grid P3 x P3")
    
    # ==========================================
    # CHAPTER 3: DEGREE SEQUENCES & REALIZATION
    # ==========================================
    add_custom_heading_1(doc, "Chapter 3: Degree Sequences & Constructive Graph Realization (Havel-Hakimi)")
    
    add_custom_heading_2(doc, "3.1 Degree Sequences & Graphical Realizability")
    add_body_paragraph(
        doc,
        "The degree sequence of an undirected graph G is the monotonic non-increasing sequence formed by ordering the degrees of its vertices:\n"
        "    d = (d1, d2, d3, ..., dn)   where d1 >= d2 >= ... >= dn >= 0.\n"
        "A sequence of non-negative integers is called graphical (or graphic) if there exists a simple undirected graph whose degree sequence is precisely d. The corresponding graph is called a realization of d.",
        "Definition 3.1: "
    )
    
    add_body_paragraph(
        doc,
        "Before applying constructive algorithms, three necessary conditions must hold:\n"
        "1. Sum of Degrees is Even: By the Handshaking Lemma, sum_{i=1}^n di = 2|E|. An odd sum immediately proves non-graphicality.\n"
        "2. Maximum Degree Constraint: In a simple graph with n vertices, no vertex can have degree exceeding n - 1 (i.e., d1 < n). A value d1 >= n immediately invalidates the sequence.\n"
        "3. Erdős–Gallai Theorem (1960): A non-increasing sequence d is graphical if and only if sum di is even and for every k in {1, 2, ..., n}:\n"
        "       sum_{i=1}^k di <= k(k - 1) + sum_{i=k+1}^n min(di, k).",
        "Necessary Conditions for Graphicality: "
    )
    
    add_custom_heading_2(doc, "3.2 The Havel-Hakimi Theorem (1955, 1962)")
    add_body_paragraph(
        doc,
        "Let S = (d1, d2, ..., dn) be a non-increasing sequence of non-negative integers with d1 >= 1. Then S is graphical if and only if the modified sequence:\n"
        "    S' = (d2 - 1, d3 - 1, ..., d_{d1+1} - 1, d_{d1+2}, ..., dn)\n"
        "is graphical after sorting into non-increasing order.",
        "Theorem 3.2 (Havel-Hakimi Reduction): "
    )
    add_body_paragraph(
        doc,
        "The proof relies on an edge-switching argument (2-switch). If there exists any realization of S, there exists a realization wherein vertex v1 (the vertex of maximum degree d1) is adjacent to the d1 vertices of next highest degree. Thus, connecting v1 greedily to the next d1 vertices preserves the existence of a simple realization without loss of generality.",
        "Proof Sketch: "
    )
    
    add_custom_heading_2(doc, "3.3 How GraphLab Constructs the Graph from the Degree Sequence")
    add_body_paragraph(
        doc,
        "GraphLab implements an automated constructive edge realization algorithm. It transforms an abstract degree sequence into a fully interactive, clickable graph on the canvas through the following deterministic pipeline:"
    )
    add_bullet_point(doc, "Step 1: Input Validation & Vertex Spawning", "GraphLab checks that sum di is even and d1 < n. It then instantiates n vertices labeled v1, v2, ..., vn, each assigned its target degree requirement di. Vertices are positioned evenly around a circular regular polygon on the canvas for optimal visual clarity.")
    add_bullet_point(doc, "Step 2: Priority Queue of Unsatisfied Degrees", "The algorithm maintains a list of vertices paired with their remaining degree demand. Vertices are sorted in descending order of remaining demand.")
    add_bullet_point(doc, "Step 3: Greedy Edge Wiring", "The vertex with the highest remaining demand, v*, is extracted (say demand = d*). The algorithm selects the next d* vertices in the sorted list that are NOT yet adjacent to v* and have positive remaining demand.")
    add_bullet_point(doc, "Step 4: Edge Creation & Demand Decrement", "For each chosen neighbor vj, an undirected edge (v*, vj) is synthesized on the canvas. The remaining demand of vj is decremented by 1, and the remaining demand of v* becomes 0.")
    add_bullet_point(doc, "Step 5: Iterative Re-Sorting", "The list is re-sorted in descending order. Steps 3–5 repeat until all remaining demands reach 0.")
    add_bullet_point(doc, "Step 6: Realization Finalization", "GraphLab displays the synthesized graph on canvas with node badges showing exact achieved degrees and edge counts. If at any point a vertex cannot find enough non-adjacent candidates or demand drops below 0, the algorithm terminates with a proof of non-graphicality.")
    
    add_custom_heading_3(doc, "Concrete Worked Example 3.1: Step-by-Step Graphical Construction")
    add_body_paragraph(
        doc,
        "Let us execute the complete realization algorithm on target sequence S = (3, 3, 2, 2, 2) on 5 vertices {v1, v2, v3, v4, v5}:"
    )
    
    tbl_hh = doc.add_table(rows=5, cols=5)
    hh_headers = ["Iteration", "Active Vertex v*", "Target Neighbors", "Edges Wired", "Remaining Degrees (v1..v5)"]
    for idx, h in enumerate(hh_headers):
        tbl_hh.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    hh_trace = [
        ("Init", "-", "-", "None", "v1:3, v2:3, v3:2, v4:2, v5:2"),
        ("1", "v1 (deg=3)", "Next 3 highest: {v2, v3, v4}", "(v1, v2), (v1, v3), (v1, v4)", "v1:0, v2:2, v3:1, v4:1, v5:2\nSorted: v2(2), v5(2), v3(1), v4(1)"),
        ("2", "v2 (deg=2)", "Next 2 highest: {v5, v3}", "(v2, v5), (v2, v3)", "v2:0, v5:1, v3:0, v4:1\nSorted: v5(1), v4(1), v3(0)"),
        ("3", "v5 (deg=1)", "Next 1 highest: {v4}", "(v5, v4)", "All remaining demands = 0!\nRealization Complete.")
    ]
    for r_idx, row in enumerate(hh_trace):
        for c_idx, val in enumerate(row):
            tbl_hh.rows[r_idx + 1].cells[c_idx].paragraphs[0].add_run(val)
    style_table(tbl_hh, col_widths=[0.9, 1.2, 1.7, 1.6, 1.8])
    
    add_body_paragraph(
        doc,
        "Total edges wired: |E| = 6. Edge set = { (v1, v2), (v1, v3), (v1, v4), (v2, v5), (v2, v3), (v5, v4) }.\n"
        "Verification of Achieved Degrees on Canvas:\n"
        "• deg(v1) = |{v2, v3, v4}| = 3\n"
        "• deg(v2) = |{v1, v3, v5}| = 3\n"
        "• deg(v3) = |{v1, v2}| = 2\n"
        "• deg(v4) = |{v1, v5}| = 2\n"
        "• deg(v5) = |{v2, v4}| = 2\n"
        "The resulting graph matches the input sequence (3, 3, 2, 2, 2) perfectly!"
    )
    
    add_custom_heading_3(doc, "Concrete Worked Example 3.2: Non-Graphical Sequences & Failure Proofs")
    add_body_paragraph(
        doc,
        "Case A (Odd Degree Sum Failure):\n"
        "Consider sequence S_A = (3, 2, 2, 1, 1). Order n = 5.\n"
        "Sum of degrees = 3 + 2 + 2 + 1 + 1 = 9 (ODD).\n"
        "Proof of impossibility: By Euler's Handshaking Lemma, sum di = 2|E|, which must be even for any graph. An odd sum cannot be partitioned into edges. GraphLab flags this instantly before running reduction.\n\n"
        "Case B (Havel-Hakimi Negative Degree Failure):\n"
        "Consider sequence S_B = (3, 3, 3, 1). Order n = 4. Sum = 3+3+3+1 = 10 (even).\n"
        "• Step 1: Extract d1 = 3. Subtract 1 from the next 3 elements: (3-1, 3-1, 1-1) = (2, 2, 0). Sequence S1 = (2, 2, 0).\n"
        "• Step 2: Extract d1 = 2. Subtract 1 from next 2 elements: (2-1, 0-1) = (1, -1).\n"
        "The element -1 is strictly negative! Because negative vertex degrees are impossible in graph theory, (3, 3, 3, 1) is NOT graphical. No simple graph on 4 vertices can possess this degree sequence."
    )
    
    add_diagram_image(doc, "diagram_3_havel_hakimi.png", "Havel-Hakimi Constructive Graph Realization: Algorithmic Edge Wiring and Realized Graph on Canvas")
    
    # ==========================================
    # CHAPTER 4: SUBGRAPHS & INDUCED SUBGRAPHS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 4: Subgraphs & Induced Subgraphs (Theory, Types, Extraction & Examples)")
    
    add_custom_heading_2(doc, "4.1 Formal Mathematical Taxonomy of Subgraphs")
    add_body_paragraph(
        doc,
        "Let G = (V, E) be a graph. A graph H = (V', E') is called a subgraph of G (written H <= G or H subseteq G) if and only if:\n"
        "    V' subseteq V   and   E' subseteq E,\n"
        "such that every edge e = {u, v} in E' satisfies u in V' and v in V'. That is, no edge in H can dangle into a vertex outside V'.",
        "Definition 4.1 (General Subgraph): "
    )
    
    add_body_paragraph(
        doc,
        "In graph theory and network analysis, subgraphs are classified into three primary canonical types:"
    )
    add_bullet_point(doc, "1. Vertex-Induced Subgraph G[S]", "Let S subseteq V be a subset of vertices. The subgraph induced by S, denoted G[S], has vertex set S, and its edge set consists of ALL edges of G that have both endpoints in S:\n    E(G[S]) = { {u, v} in E(G) | u in S and v in S }.\nAn induced subgraph preserves the complete local connectivity between the selected vertices. A subgraph H <= G is induced if and only if no edge of G exists between vertices of H that is missing from H.")
    add_bullet_point(doc, "2. Edge-Induced Subgraph G[E']", "Let E' subseteq E be a subset of edges. The subgraph induced by E', denoted G[E'], has edge set E', and its vertex set consists of all vertices in G that are incident to at least one edge in E':\n    V(G[E']) = { v in V(G) | exists e in E' such that v is incident to e }.")
    add_bullet_point(doc, "3. Spanning Subgraph", "A subgraph H <= G is a spanning subgraph if it contains ALL vertices of G (i.e., V(H) = V(G)) but a proper subset of edges (E(H) subseteq E(G)). A Spanning Tree is a minimally connected spanning subgraph of G.")
    add_bullet_point(doc, "Cliques & Independent Sets", "A clique of size k in G is a subset of vertices S such that G[S] is isomorphic to the complete graph K_k. An independent set of size k is a subset of vertices S such that G[S] contains zero edges (an empty graph).")
    
    add_custom_heading_2(doc, "4.2 Subgraph Extraction Mechanics in GraphLab")
    add_body_paragraph(
        doc,
        "GraphLab provides interactive tools for subgraph analysis. Users can select any subset of nodes using either the Marquee Selection Box ('B' or Shift+Drag) or individual clicks. Once selected, GraphLab can:\n"
        "• Highlight the vertex-induced subgraph G[S] in real time, showing internal edges versus cut edges crossing to V \\ S.\n"
        "• Extract G[S] as an independent graph component onto a dedicated canvas region.\n"
        "• Calculate the induced density: rho(S) = |E(G[S])| / C(|S|, 2).\n"
        "• Compute the cut boundary: delta(S) = { {u, v} in E | u in S, v not in S }."
    )
    
    add_custom_heading_3(doc, "Concrete Worked Example 4.1: Comprehensive Subgraph Extraction")
    add_body_paragraph(
        doc,
        "Consider a base graph G with 6 vertices V = {1, 2, 3, 4, 5, 6} and 9 edges:\n"
        "E = { (1, 2), (1, 3), (2, 3), (2, 4), (3, 4), (3, 5), (4, 5), (4, 6), (5, 6) }."
    )
    add_body_paragraph(
        doc,
        "Scenario A: Extraction of Vertex-Induced Subgraph G[S] for S = {1, 2, 3, 5}:\n"
        "To construct G[S], we evaluate each of the 9 edges in E to check if BOTH endpoints reside in S = {1, 2, 3, 5}:"
    )
    
    tbl_sub = doc.add_table(rows=10, cols=5)
    sub_headers = ["Edge in G", "Endpoint u in S?", "Endpoint v in S?", "Both in S?", "Status in G[S]"]
    for idx, h in enumerate(sub_headers):
        tbl_sub.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    sub_eval = [
        ("(1, 2)", "1 in S (Yes)", "2 in S (Yes)", "Yes", "PRESERVED in G[S]"),
        ("(1, 3)", "1 in S (Yes)", "3 in S (Yes)", "Yes", "PRESERVED in G[S]"),
        ("(2, 3)", "2 in S (Yes)", "3 in S (Yes)", "Yes", "PRESERVED in G[S]"),
        ("(2, 4)", "2 in S (Yes)", "4 not in S (No)", "No", "DISCARDED (Cut Edge)"),
        ("(3, 4)", "3 in S (Yes)", "4 not in S (No)", "No", "DISCARDED (Cut Edge)"),
        ("(3, 5)", "3 in S (Yes)", "5 in S (Yes)", "Yes", "PRESERVED in G[S]"),
        ("(4, 5)", "4 not in S (No)", "5 in S (Yes)", "No", "DISCARDED (Cut Edge)"),
        ("(4, 6)", "4 not in S (No)", "6 not in S (No)", "No", "DISCARDED"),
        ("(5, 6)", "5 in S (Yes)", "6 not in S (No)", "No", "DISCARDED (Cut Edge)")
    ]
    for r_idx, row in enumerate(sub_eval):
        for c_idx, val in enumerate(row):
            tbl_sub.rows[r_idx + 1].cells[c_idx].paragraphs[0].add_run(val)
    style_table(tbl_sub, col_widths=[1.1, 1.3, 1.3, 1.0, 1.5])
    
    add_body_paragraph(
        doc,
        "Result of Vertex-Induced Subgraph G[S]:\n"
        "• Vertex set: V(G[S]) = {1, 2, 3, 5} (Order = 4).\n"
        "• Edge set: E(G[S]) = { (1, 2), (1, 3), (2, 3), (3, 5) } (Size = 4).\n"
        "• Notice that triangle {1, 2, 3} is completely preserved as a 3-clique K3 within G[S].\n"
        "• Cut edges discarded: delta(S) = { (2, 4), (3, 4), (4, 5), (5, 6) } (4 edges connecting S to V \\ S)."
    )
    
    add_body_paragraph(
        doc,
        "Scenario B: Spanning Subgraph Construction on the Same Graph G:\n"
        "• Keep ALL 6 vertices: V(H) = {1, 2, 3, 4, 5, 6}.\n"
        "• Select edge subset: E(H) = { (1, 2), (1, 3), (2, 4), (4, 5), (5, 6) } (5 edges).\n"
        "• Because H has n = 6 vertices, |E| = 5 = n - 1 edges, and is connected without cycles, H constitutes a valid Spanning Tree of G!\n\n"
        "Scenario C: Edge-Induced Subgraph G[E'] for E' = { (2, 4), (4, 6), (5, 6) }:\n"
        "• Edge set: E(G[E']) = { (2, 4), (4, 6), (5, 6) } (3 edges).\n"
        "• Incident vertices: V(G[E']) = {2, 4, 5, 6}. Note that vertices 1 and 3 are completely excluded because neither participates in any edge in E'."
    )
    
    add_diagram_image(doc, "diagram_subgraphs.png", "Subgraphs: Original Graph G with Subset S highlighted, Vertex-Induced Subgraph G[S], and Spanning Subgraph")
    
    # ==========================================
    # CHAPTER 5: GRAPH ISOMORPHISM
    # ==========================================
    add_custom_heading_1(doc, "Chapter 5: Graph Isomorphism & Canvas Component Verification")
    
    add_custom_heading_2(doc, "5.1 Formal Definition & Invariant Theory")
    add_body_paragraph(
        doc,
        "Two graphs G1 = (V1, E1) and G2 = (V2, E2) are isomorphic (denoted G1 =~ G2) if there exists a bijective function f: V1 -> V2 such that for all u, v in V1:\n"
        "    {u, v} in E1 <===> {f(u), f(v)} in E2.\n"
        "The bijection f is called an isomorphism. If an isomorphism exists, G1 and G2 are structurally indistinguishable; they differ solely in the naming or layout of their vertices.",
        "Definition 5.1 (Graph Isomorphism): "
    )
    add_body_paragraph(
        doc,
        "Isomorphism preserves all structural graph invariants:\n"
        "1. Vertex order: |V1| = |V2|.\n"
        "2. Edge cardinality: |E1| = |E2|.\n"
        "3. Degree multiset: sorted degree sequence of G1 must be identical to G2.\n"
        "4. Graph spectrum: eigenvalues of the adjacency matrices must match.\n"
        "5. Subgraph census: counts of triangles, k-cycles, and cliques must coincide."
    )
    
    add_custom_heading_2(doc, "5.2 GraphLab's Automated Two-Component Canvas Checker")
    add_body_paragraph(
        doc,
        "GraphLab includes an automated canvas isomorphism inspector. When a user draws multiple graphs or disconnected components on the canvas, clicking 'Isomorphism' runs a multi-tier verification engine:\n"
        "• Single Component Check: If only 1 component exists on canvas, GraphLab alerts the user: 'Only 1 graph present. Draw a second graph component or clone the current graph to test isomorphism.'\n"
        "• Invariant Filtering: Instantly checks |V1|==|V2|, |E1|==|E2|, and sorted degree multisets.\n"
        "• Constraint Satisfaction Backtracking: GraphLab explores candidate mappings f: u -> v restricted by vertex degree, neighborhood degree profiles, and distance matrices.\n"
        "• Visual Proof Placement: If isomorphic, GraphLab prints the exact bijection table f(u) = v directly onto the canvas as an editable text annotation card!"
    )
    
    add_custom_heading_3(doc, "Concrete Worked Example 5.1: Two-Graph Isomorphism Verification")
    add_body_paragraph(
        doc,
        "Consider two graphs on canvas: Component 1 (G1, labeled {1, 2, 3, 4, 5}) and Component 2 (G2, labeled {A, B, C, D, E}).\n"
        "• E(G1) = { (1, 2), (2, 3), (3, 4), (4, 1), (1, 3), (3, 5), (4, 5) } (7 edges).\n"
        "• E(G2) = { (A, B), (B, C), (C, D), (D, A), (A, C), (C, E), (D, E) } (7 edges).\n"
        "1. Order check: |V1| = 5, |V2| = 5 (Match).\n"
        "2. Size check: |E1| = 7, |E2| = 7 (Match).\n"
        "3. Degree Sequences:\n"
        "   G1: deg(3)=4, deg(1)=3, deg(4)=3, deg(2)=2, deg(5)=2 -> (4, 3, 3, 2, 2).\n"
        "   G2: deg(C)=4, deg(A)=3, deg(D)=3, deg(B)=2, deg(E)=2 -> (4, 3, 3, 2, 2). (Match!)."
    )
    
    tbl_iso = doc.add_table(rows=6, cols=5)
    iso_headers = ["v in V1", "deg(v)", "Candidate f(v) in V2", "deg(f(v))", "Adjacency Verification"]
    for idx, h in enumerate(iso_headers):
        tbl_iso.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    iso_trace = [
        ("3", "4", "C", "4", "N(3)={1, 2, 4, 5} maps to N(C)={A, B, D, E} [OK]"),
        ("1", "3", "A", "3", "N(1)={2, 3, 4} maps to N(A)={B, C, D} [OK]"),
        ("4", "3", "D", "3", "N(4)={1, 3, 5} maps to N(D)={A, C, E} [OK]"),
        ("2", "2", "B", "2", "N(2)={1, 3} maps to N(B)={A, C} [OK]"),
        ("5", "2", "E", "2", "N(5)={3, 4} maps to N(E)={C, D} [OK]")
    ]
    for r_idx, row in enumerate(iso_trace):
        for c_idx, val in enumerate(row):
            tbl_iso.rows[r_idx + 1].cells[c_idx].paragraphs[0].add_run(val)
    style_table(tbl_iso, col_widths=[0.8, 0.8, 1.5, 1.0, 2.1])
    
    add_body_paragraph(
        doc,
        "Every edge (u, v) in E(G1) maps to an edge (f(u), f(v)) in E(G2). Thus, the bijection f = { 1->A, 2->B, 3->C, 4->D, 5->E } proves rigorously that G1 =~ G2!"
    )
    
    add_diagram_image(doc, "diagram_4_isomorphism.png", "Two-Graph Isomorphism: Component Vertex Bijection Mapping f(u) = v")
    
    # ==========================================
    # CHAPTER 6: COMPLEMENT GRAPHS & INVARIANTS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 6: Complement Graphs & Invariant Theory")
    
    add_custom_heading_2(doc, "6.1 Definition & Mathematical Invariants")
    add_body_paragraph(
        doc,
        "The complement (or inverse) of a simple graph G = (V, E), denoted G_bar, is a graph on the same vertex set V such that distinct vertices u and v are adjacent in G_bar if and only if they are NOT adjacent in G:\n"
        "    E(G_bar) = { {u, v} | u, v in V, u != v, and {u, v} not in E(G) }.",
        "Definition 6.1: "
    )
    add_body_paragraph(
        doc,
        "Fundamental Invariant Relations:\n"
        "1. Sum of Edges: |E(G)| + |E(G_bar)| = C(n, 2) = n(n - 1) / 2.\n"
        "2. Degree Inversion Formula: For every vertex v in V, deg_{G_bar}(v) = (n - 1) - deg_G(v).\n"
        "3. Connectivity Invariant: If a graph G is disconnected, its complement G_bar is guaranteed to be connected with diameter <= 2.\n"
        "4. Self-Complementary Graphs: A graph G is called self-complementary if G =~ G_bar. A necessary condition is that |E(G)| = n(n - 1) / 4, requiring n = 0 or 1 (mod 4). Canonical examples include the 4-path P4 and the 5-cycle C5."
    )
    
    add_custom_heading_3(doc, "Concrete Worked Example 6.1: Complement Invariant Verification")
    add_body_paragraph(
        doc,
        "Let G be a graph on n = 5 vertices {0, 1, 2, 3, 4} with edge set E(G) = { (0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (0, 2) } (|E| = 6).\n"
        "• Total possible edges on 5 vertices: C(5, 2) = 5 * 4 / 2 = 10 edges.\n"
        "• Expected edges in complement G_bar: 10 - 6 = 4 edges.\n"
        "• Non-adjacent pairs in G: { (0, 3), (1, 3), (1, 4), (2, 4) }.\n"
        "• Edge set of G_bar: E(G_bar) = { (0, 3), (1, 3), (1, 4), (2, 4) } (exactly 4 edges!)."
    )
    add_body_paragraph(
        doc,
        "Degree Inversion Verification:\n"
        "• deg_G(0) = 3 -> deg_{G_bar}(0) = (5 - 1) - 3 = 1 (incident to (0, 3))\n"
        "• deg_G(1) = 2 -> deg_{G_bar}(1) = 4 - 2 = 2 (incident to (1, 3), (1, 4))\n"
        "• deg_G(2) = 3 -> deg_{G_bar}(2) = 4 - 3 = 1 (incident to (2, 4))\n"
        "• deg_G(3) = 2 -> deg_{G_bar}(3) = 4 - 2 = 2 (incident to (0, 3), (1, 3))\n"
        "• deg_G(4) = 2 -> deg_{G_bar}(4) = 4 - 2 = 2 (incident to (1, 4), (2, 4))\n"
        "The formula deg_{G_bar}(v) = (n - 1) - deg_G(v) holds exactly across all vertices."
    )
    
    add_diagram_image(doc, "diagram_5_complement.png", "Complement Graph Invariant: Original G (6 edges) + Complement G' (4 edges) = C(5, 2) = 10 Edges")
    
    # ==========================================
    # CHAPTER 7: BIPARTITE GRAPHS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 7: Bipartite Graphs & Kőnig's Theorem")
    
    add_custom_heading_2(doc, "7.1 Theoretical Characterization & Odd Cycle Witness")
    add_body_paragraph(
        doc,
        "A graph G = (V, E) is bipartite if its vertex set can be partitioned into two disjoint independent sets V1 and V2 (V = V1 union V2, V1 intersect V2 = empty) such that every edge connects a vertex in V1 to a vertex in V2. Equivalently, G is bipartite if and only if its chromatic number satisfies chi(G) <= 2.",
        "Definition 7.1: "
    )
    add_body_paragraph(
        doc,
        "A graph G is bipartite if and only if it contains NO odd-length cycles.\n"
        "If a graph fails to be bipartite, any cycle of odd length (e.g., C3 triangle, C5 pentagon) constitutes an irrefutable mathematical witness (counterexample) proving that a valid 2-coloring is impossible.",
        "Theorem 7.1 (Kőnig's Theorem, 1936): "
    )
    
    add_custom_heading_2(doc, "7.2 GraphLab's 2-Coloring BFS Algorithm")
    add_body_paragraph(
        doc,
        "GraphLab implements Breadth-First Search (BFS) for bipartite verification:\n"
        "1. Pick an unvisited vertex r and set color(r) = 0. Enqueue r.\n"
        "2. While queue is non-empty, dequeue vertex u with color c.\n"
        "3. For each neighbor v of u:\n"
        "   a. If v is uncolored, assign color(v) = 1 - c and enqueue v.\n"
        "   b. If v is already colored and color(v) == color(u), an ODD CYCLE IS DETECTED! GraphLab halts, traces the ancestor path, extracts the odd cycle, and highlights the conflicting edge.\n"
        "4. If all components are colored without conflict, GraphLab confirms bipartiteness and reorganizes the vertices into two clean vertical columns (V1 on left, V2 on right)."
    )
    
    add_custom_heading_3(doc, "Concrete Worked Examples 7.1: Bipartite vs Non-Bipartite")
    add_body_paragraph(
        doc,
        "Example A (Bipartite 2-Coloring on 6 vertices):\n"
        "Graph with edges: { (U1, V1), (U1, V2), (U2, V2), (U2, V3), (U3, V1), (U3, V3) }.\n"
        "• BFS assigns Color 0 to: { U1, U2, U3 } (Blue Partition).\n"
        "• BFS assigns Color 1 to: { V1, V2, V3 } (Amber Partition).\n"
        "• Every edge runs between {U} and {V}. Zero internal edges exist. Verified bipartite!\n\n"
        "Example B (Non-Bipartite Odd Cycle Witness):\n"
        "Graph containing triangle {A, B, C} with edges (A, B), (B, C), (C, A):\n"
        "1. Start at A: color(A) = 0.\n"
        "2. Explore neighbors of A: color(B) = 1, color(C) = 1.\n"
        "3. Explore neighbors of B: edge (B, C) connects B (color 1) to C (color 1). Both endpoints have Color 1! Conflict detected!\n"
        "Odd cycle witness extracted: A -> B -> C -> A (length = 3). Non-bipartite proof complete."
    )
    
    add_diagram_image(doc, "diagram_6_bipartite.png", "Bipartite 2-Coloring BFS Partition vs Non-Bipartite Odd-Cycle Witness Triangle")
    
    # ==========================================
    # CHAPTER 8: TRAVERSAL & CONNECTIVITY
    # ==========================================
    add_custom_heading_1(doc, "Chapter 8: Graph Traversal, Connectivity & Cycles (BFS & DFS)")
    
    add_custom_heading_2(doc, "8.1 Breadth-First Search (BFS)")
    add_body_paragraph(
        doc,
        "Breadth-First Search explores vertices in order of increasing distance (hop count) from a designated start vertex using a First-In, First-Out (FIFO) Queue. It computes single-source shortest paths on unweighted graphs and partitions vertices into concentric frontier layers L0, L1, L2, ...",
        "Principle: "
    )
    add_body_paragraph(
        doc,
        "Time Complexity: O(|V| + |E|). Space Complexity: O(|V|) auxiliary storage for the FIFO Queue and Visited hash set.",
        "Complexity: "
    )
    
    add_custom_heading_2(doc, "8.2 Depth-First Search (DFS) & Tri-Color Cycle Detection")
    add_body_paragraph(
        doc,
        "Depth-First Search explores as deeply as possible along each branch before backtracking using a Last-In, First-Out (LIFO) Stack or recursion. It computes discovery timestamps d[u] and finishing timestamps f[u], satisfying the Parenthesis Theorem.",
        "Principle: "
    )
    add_body_paragraph(
        doc,
        "Cycle Detection is implemented via a Tri-Color State Machine:\n"
        "• WHITE: Vertex unvisited.\n"
        "• GRAY: Vertex currently active on the recursion call stack (ancestor).\n"
        "• BLACK: Vertex and all its descendants are fully explored.\n"
        "Theorem: A directed graph contains a cycle if and only if DFS encounters a GRAY vertex (a back-edge pointing directly to an active ancestor on the stack!).",
        "Tri-Color Cycle Detection: "
    )
    
    add_custom_heading_3(doc, "Concrete Worked Example 8.1: Traversal Traces")
    add_body_paragraph(
        doc,
        "BFS Trace from Source S on graph with edges (S, A), (S, B), (A, C), (A, D), (B, E):\n"
        "• Layer 0: [S] (distance = 0)\n"
        "• Layer 1: [A, B] (distance = 1)\n"
        "• Layer 2: [C, D, E] (distance = 2)\n"
        "Discovered tree edges form a minimal hop spanning tree from S.\n\n"
        "DFS Cycle Trace on vertices {1, 2, 3, 4} with edges (1, 2), (2, 3), (3, 4), (4, 1):\n"
        "• Visit 1 (GRAY, d[1]=1) -> Visit 2 (GRAY, d[2]=2) -> Visit 3 (GRAY, d[3]=3) -> Visit 4 (GRAY, d[4]=4).\n"
        "• At vertex 4, neighbor 1 is examined. Vertex 1 is GRAY! Back-edge (4, 1) detected!\n"
        "• Cycle reported: 1 -> 2 -> 3 -> 4 -> 1."
    )
    
    add_diagram_image(doc, "diagram_7_bfs_dfs.png", "BFS Queue Discovery Tree vs DFS Stack Recursion Tree with Gray Back-Edge Cycle Witness")
    
    # ==========================================
    # CHAPTER 9: EULERIAN & HAMILTONIAN GRAPHS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 9: Eulerian & Hamiltonian Graph Theory")
    
    add_custom_heading_2(doc, "9.1 Eulerian Circuits & Trails")
    add_body_paragraph(
        doc,
        "An Eulerian trail is a walk in a graph that visits every EDGE exactly once. An Eulerian circuit is an Eulerian trail that starts and ends at the same vertex.",
        "Definition 9.1: "
    )
    add_body_paragraph(
        doc,
        "A connected undirected graph G has an Eulerian circuit if and only if EVERY vertex has an EVEN degree.\n"
        "A connected undirected graph G has an open Eulerian trail (different start and end) if and only if EXACTLY TWO vertices have ODD degree. (The trail must start at one odd vertex and terminate at the other).",
        "Theorem 9.1 (Euler, 1736): "
    )
    
    add_custom_heading_2(doc, "9.2 Hamiltonian Cycles & Paths")
    add_body_paragraph(
        doc,
        "A Hamiltonian cycle is a closed loop that visits every VERTEX in G exactly once. While finding Eulerian circuits is polynomial O(|E|) via Hierholzer's algorithm, determining whether a graph contains a Hamiltonian cycle is NP-complete.",
        "Definition 9.2: "
    )
    add_body_paragraph(
        doc,
        "GraphLab provides automated verification using classical sufficient conditions:\n"
        "• Dirac's Theorem (1952): If G is a simple graph with n >= 3 vertices and for every vertex v, deg(v) >= n / 2, then G is Hamiltonian.\n"
        "• Ore's Theorem (1960): If G is a simple graph with n >= 3 vertices and for every pair of non-adjacent vertices u and v, deg(u) + deg(v) >= n, then G is Hamiltonian."
    )
    
    add_custom_heading_3(doc, "Concrete Worked Example 9.1: Eulerian vs Hamiltonian")
    add_body_paragraph(
        doc,
        "Eulerian Example: Bowtie Graph with 5 vertices {A, B, C, D, E} and edges { (C, A), (A, B), (B, C), (C, D), (D, E), (E, C) }.\n"
        "• Degrees: deg(C) = 4, deg(A) = 2, deg(B) = 2, deg(D) = 2, deg(E) = 2. ALL DEGREES ARE EVEN!\n"
        "• Verified Eulerian circuit: C -> A -> B -> C -> D -> E -> C (traverses all 6 edges exactly once).\n\n"
        "Hamiltonian Example: 6-vertex graph with n = 6 vertices {v1, v2, v3, v4, v5, v6} forming a 6-cycle with chords (v1, v4), (v2, v5), (v3, v6).\n"
        "• Every vertex has degree 3. Minimum degree delta = 3 >= 6 / 2 = 3. Dirac's condition is satisfied!\n"
        "• Verified Hamiltonian cycle: v1 -> v2 -> v3 -> v4 -> v5 -> v6 -> v1 (visits all 6 vertices exactly once)."
    )
    
    add_diagram_image(doc, "diagram_eulerian_hamiltonian.png", "Eulerian Graph (All Even Degrees, Circuit Traverses Every Edge) vs Hamiltonian Graph (Cycle Visits Every Vertex)")
    
    # ==========================================
    # CHAPTER 10: COMPARATIVE COMPLEXITY MATRIX
    # ==========================================
    add_custom_heading_1(doc, "Chapter 10: Comparative Theoretical Complexity Reference")
    add_body_paragraph(
        doc,
        "The following matrix summarizes the algorithmic paradigms, asymptotic time/space bounds, and theoretical constraints across all discrete mathematics solvers and traversal engines implemented in GraphLab:"
    )
    
    tbl_comp = doc.add_table(rows=11, cols=6)
    headers_comp = ["Solver / Algorithm", "Mathematical Paradigm", "Time Complexity", "Space", "Data Requirements", "Primary Theoretical Goal"]
    for idx, h in enumerate(headers_comp):
        tbl_comp.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    comp_data = [
        ("Havel-Hakimi Realization", "Greedy Degree Reduction", "O(n^2 log n)", "O(n)", "Integer Sequence", "Construct Graph Realization"),
        ("Subgraph Extractor", "Induced Set Filtering", "O(V + E)", "O(V + E)", "Vertex Subset S", "Extract G[S] & Cut Edges"),
        ("Component Isomorphism", "Constraint Satisfaction", "O(V!) worst-case", "O(V + E)", "Two Graph Components", "Prove Vertex Bijection f: u->v"),
        ("Complement Graph", "Adjacency Inversion", "O(V^2)", "O(V^2)", "Simple Graph", "Synthesize G_bar & Invariants"),
        ("Bipartite 2-Coloring", "Alternating BFS Search", "O(V + E)", "O(V)", "Undirected Graph", "2-Coloring or Odd-Cycle Proof"),
        ("BFS Traversal", "FIFO Queue Frontier", "O(V + E)", "O(V)", "Unweighted Graph", "Minimal Hop Shortest Path Tree"),
        ("DFS & Tri-Color Cycle", "LIFO Call Stack", "O(V + E)", "O(V)", "Directed / Undirected", "Cycle Detection via Gray Edges"),
        ("Connected Components", "Disjoint Set / BFS", "O(V + E)", "O(V)", "General Graph", "Partition V into Components"),
        ("Eulerian Circuit", "Degree Parity / Hierholzer", "O(V + E)", "O(V + E)", "All Even Degrees", "Traverse Every Edge Exactly Once"),
        ("Hamiltonian Cycle", "Dirac / Ore + Backtrack", "O(2^n * n^2) worst", "O(V)", "Undirected Simple", "Visit Every Vertex Exactly Once")
    ]
    for r_idx, row in enumerate(comp_data):
        for c_idx, val in enumerate(row):
            tbl_comp.rows[r_idx + 1].cells[c_idx].paragraphs[0].add_run(val)
    style_table(tbl_comp, col_widths=[1.3, 1.2, 1.1, 0.7, 1.1, 1.6])
    
    # ==========================================
    # CHAPTER 11: SOFTWARE ARCHITECTURE & TOOLS
    # ==========================================
    add_custom_heading_1(doc, "Chapter 11: Software Architecture & Interactive Canvas Mechanics")
    
    add_custom_heading_2(doc, "11.1 Multi-Renderer Graphics Pipeline")
    add_body_paragraph(
        doc,
        "GraphLab implements an abstract renderer architecture supporting three interchangeable rendering modes:"
    )
    add_bullet_point(doc, "Vector SVG Mode", "Default standard mode offering pixel-perfect mathematical curves, sub-pixel SVG markers, text anchors, and native DOM accessibility.")
    add_bullet_point(doc, "Canvas 2D Mode", "High-performance immediate-mode rendering capable of sustaining 60 FPS on dense networks exceeding 1,000+ vertices and edges.")
    add_bullet_point(doc, "3D WebGL Mode", "Interactive 3D spatial viewport powered by Three.js and React Three Fiber with orbit controls, spatial depth, and lighting.")
    
    add_custom_heading_2(doc, "11.2 Dual Execution & Time-Travel Engine")
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
    
    add_custom_heading_2(doc, "11.3 Photoshop-Style Canvas Text Box Tool & Multi-Selection")
    add_body_paragraph(
        doc,
        "The newly integrated Photoshop-Style Text Tool ('T') allows users to place rich text annotations, mathematical notes, and theorem labels anywhere on the canvas. Key mechanics include:"
    )
    add_bullet_point(doc, "Direct World-Coordinate Dragging", "Text cards pan and zoom seamlessly alongside graph nodes.")
    add_bullet_point(doc, "Rich Style Formatting", "Font sizes (S, M, L, XL), color themes (Default, Emerald, Sky, Rose, Amber, Purple), and background card styles (Card, Badge, Sticky Note).")
    add_bullet_point(doc, "Instant Inline Editing", "Clicking on the canvas immediately spawns a focused textarea for instant typing; Esc, ⌘+Enter, or clicking outside immediately commits the text.")
    add_bullet_point(doc, "Marquee Box Selection Integration", "The Marquee Selection tool ('B' or Shift+Drag) queries both nodes and text boxes simultaneously. Selected text boxes can be dragged together with nodes, copied, or deleted via Backspace/Delete.")
    add_bullet_point(doc, "Automated Annotation Placement", "The Isomorphism checker can automatically place verified bijection proofs directly onto the canvas as text cards.")
    
    add_custom_heading_2(doc, "11.4 Multi-Provider AI Graph Theory Tutor")
    add_body_paragraph(
        doc,
        "The AI Tutor provides interactive theorem proofs, Dirac/Ore invariant checks, and planarity analyses. It features universal multi-provider API key detection:\n"
        "• OpenRouter AI (sk-or-v1-...)\n"
        "• Groq LPU (gsk_...)\n"
        "• OpenAI (sk-...)\n"
        "• Google Gemini (AIza...)\n"
        "If no API key is provided or the network is offline, GraphLab seamlessly activates its built-in deterministic mathematical heuristics engine, ensuring 100% functionality with zero downtime."
    )
    
    add_custom_heading_2(doc, "11.5 Responsive Cross-Screen Design")
    add_body_paragraph(
        doc,
        "GraphLab is fully responsive across mobile phones (<768px with docked bottom controls), tablets/iPads (768px-1024px with streamlined icon toolbars), and desktop workstations (>=1024px with complete multi-renderer tools and hotkey navigation)."
    )
    
    # Save document
    doc.save(DOCX_OUTPUT_PATH)
    print("Document successfully created and saved to:", DOCX_OUTPUT_PATH)

if __name__ == "__main__":
    build_word_document()
