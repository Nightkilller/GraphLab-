import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np

DIAGRAM_DIR = "/Users/adityagupta/Desktop/testing/docs_diagrams"
os.makedirs(DIAGRAM_DIR, exist_ok=True)

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# 1. Graph Basics Diagram (Directed vs Undirected with Weights)
def generate_diagram_1():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    
    # Undirected Weighted
    G1 = nx.Graph()
    G1.add_edge('A', 'B', weight=4)
    G1.add_edge('A', 'C', weight=2)
    G1.add_edge('B', 'C', weight=1)
    G1.add_edge('B', 'D', weight=5)
    G1.add_edge('C', 'D', weight=8)
    G1.add_edge('C', 'E', weight=10)
    G1.add_edge('D', 'E', weight=2)
    pos1 = {'A': (0, 1), 'B': (1, 2), 'C': (1, 0), 'D': (2, 2), 'E': (2, 0)}
    
    ax1.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G1, pos1, ax=ax1, node_color='#3B82F6', node_size=700, edgecolors='#1D4ED8', linewidths=2)
    nx.draw_networkx_labels(G1, pos1, ax=ax1, font_color='white', font_weight='bold', font_size=11)
    nx.draw_networkx_edges(G1, pos1, ax=ax1, edge_color='#64748B', width=2)
    edge_labels1 = nx.get_edge_attributes(G1, 'weight')
    nx.draw_networkx_edge_labels(G1, pos1, edge_labels=edge_labels1, ax=ax1, font_color='#0F172A', font_weight='bold', font_size=10, bbox=dict(boxstyle="round,pad=0.2", fc="#F1F5F9", ec="#CBD5E1"))
    ax1.set_title(r"Undirected Weighted Graph $G = (V, E, w)$" + "\n" + r"Handshaking Lemma: $\sum \deg(v) = 2|E| = 14$", fontsize=11, fontweight='bold', pad=10, color='#1E293B')
    ax1.axis('off')
    
    # Directed Graph (Digraph)
    G2 = nx.DiGraph()
    G2.add_edges_from([('1', '2'), ('1', '3'), ('2', '3'), ('3', '4'), ('4', '1'), ('4', '5'), ('5', '3')])
    pos2 = {'1': (0, 1), '2': (1, 1.8), '3': (1, 0.2), '4': (2, 1.6), '5': (2, 0.4)}
    
    ax2.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G2, pos2, ax=ax2, node_color='#10B981', node_size=700, edgecolors='#047857', linewidths=2)
    nx.draw_networkx_labels(G2, pos2, ax=ax2, font_color='white', font_weight='bold', font_size=11)
    nx.draw_networkx_edges(G2, pos2, ax=ax2, edge_color='#475569', width=2, arrowsize=18, arrowstyle='-|>', connectionstyle='arc3,rad=0.08')
    ax2.set_title("Directed Graph (Digraph) G = (V, E)\n" + r"In-Degree & Out-Degree: $\sum \deg^+(v) = \sum \deg^-(v) = 7$", fontsize=11, fontweight='bold', pad=10, color='#1E293B')
    ax2.axis('off')
    
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_1_graph_basics.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 2. Graph Families Composite Diagram
def generate_diagram_2():
    fig, axes = plt.subplots(2, 3, figsize=(12, 7.5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    
    # 1. Complete K5
    ax = axes[0, 0]
    ax.set_facecolor('#FAFAFB')
    G_k5 = nx.complete_graph(5)
    pos = nx.circular_layout(G_k5)
    nx.draw_networkx_nodes(G_k5, pos, ax=ax, node_color='#6366F1', node_size=450, edgecolors='#4338CA', linewidths=1.5)
    nx.draw_networkx_labels(G_k5, pos, ax=ax, font_color='white', font_weight='bold', font_size=9)
    nx.draw_networkx_edges(G_k5, pos, ax=ax, edge_color='#94A3B8', width=1.5)
    ax.set_title(r"Complete Graph $K_5$" + "\n" + r"$|E| = \binom{5}{2} = 10$, 4-Regular", fontsize=10, fontweight='bold', color='#1E293B')
    ax.axis('off')
    
    # 2. Cycle C6
    ax = axes[0, 1]
    ax.set_facecolor('#FAFAFB')
    G_c6 = nx.cycle_graph(6)
    pos = nx.circular_layout(G_c6)
    nx.draw_networkx_nodes(G_c6, pos, ax=ax, node_color='#EC4899', node_size=450, edgecolors='#BE185D', linewidths=1.5)
    nx.draw_networkx_labels(G_c6, pos, ax=ax, font_color='white', font_weight='bold', font_size=9)
    nx.draw_networkx_edges(G_c6, pos, ax=ax, edge_color='#94A3B8', width=2)
    ax.set_title(r"Cycle Graph $C_6$" + "\n" + r"$|E| = 6$, 2-Regular, Bipartite", fontsize=10, fontweight='bold', color='#1E293B')
    ax.axis('off')
    
    # 3. Complete Bipartite K3,3
    ax = axes[0, 2]
    ax.set_facecolor('#FAFAFB')
    G_k33 = nx.complete_bipartite_graph(3, 3)
    pos = {}
    for i in range(3):
        pos[i] = (0, 2 - i)
        pos[i + 3] = (1.5, 2 - i)
    node_colors = ['#0284C7']*3 + ['#F59E0B']*3
    nx.draw_networkx_nodes(G_k33, pos, ax=ax, node_color=node_colors, node_size=450, edgecolors='#334155', linewidths=1.5)
    nx.draw_networkx_labels(G_k33, pos, ax=ax, font_color='white', font_weight='bold', font_size=9)
    nx.draw_networkx_edges(G_k33, pos, ax=ax, edge_color='#94A3B8', width=1.4)
    ax.set_title(r"Complete Bipartite $K_{3,3}$" + "\n" + r"$|E| = 3 \times 3 = 9$, Non-Planar", fontsize=10, fontweight='bold', color='#1E293B')
    ax.axis('off')
    
    # 4. Star Graph S6
    ax = axes[1, 0]
    ax.set_facecolor('#FAFAFB')
    G_star = nx.star_graph(5)
    pos = nx.spring_layout(G_star, seed=42)
    pos[0] = (0, 0)
    colors = ['#EF4444'] + ['#38BDF8']*5
    nx.draw_networkx_nodes(G_star, pos, ax=ax, node_color=colors, node_size=450, edgecolors='#334155', linewidths=1.5)
    nx.draw_networkx_labels(G_star, pos, ax=ax, font_color='white', font_weight='bold', font_size=9)
    nx.draw_networkx_edges(G_star, pos, ax=ax, edge_color='#94A3B8', width=2)
    ax.set_title(r"Star Graph $S_6$" + "\n" + r"Center $\deg=5$, Leaves $\deg=1$, Tree", fontsize=10, fontweight='bold', color='#1E293B')
    ax.axis('off')
    
    # 5. Tree Graph T7
    ax = axes[1, 1]
    ax.set_facecolor('#FAFAFB')
    G_tree = nx.balanced_tree(2, 2)
    pos = {0: (0, 2), 1: (-1, 1), 2: (1, 1), 3: (-1.5, 0), 4: (-0.5, 0), 5: (0.5, 0), 6: (1.5, 0)}
    nx.draw_networkx_nodes(G_tree, pos, ax=ax, node_color='#10B981', node_size=450, edgecolors='#047857', linewidths=1.5)
    nx.draw_networkx_labels(G_tree, pos, ax=ax, font_color='white', font_weight='bold', font_size=9)
    nx.draw_networkx_edges(G_tree, pos, ax=ax, edge_color='#94A3B8', width=2)
    ax.set_title(r"Binary Tree $T_7$" + "\n" + r"$|V| = 7, |E| = 6 = n - 1$, Acyclic", fontsize=10, fontweight='bold', color='#1E293B')
    ax.axis('off')
    
    # 6. Grid Graph 3x3
    ax = axes[1, 2]
    ax.set_facecolor('#FAFAFB')
    G_grid = nx.grid_2d_graph(3, 3)
    pos = {n: (n[1], 2 - n[0]) for n in G_grid.nodes()}
    labels = {n: f"{n[0]},{n[1]}" for n in G_grid.nodes()}
    nx.draw_networkx_nodes(G_grid, pos, ax=ax, node_color='#8B5CF6', node_size=450, edgecolors='#5B21B6', linewidths=1.5)
    nx.draw_networkx_labels(G_grid, pos, labels=labels, ax=ax, font_color='white', font_weight='bold', font_size=7)
    nx.draw_networkx_edges(G_grid, pos, ax=ax, edge_color='#94A3B8', width=2)
    ax.set_title(r"Grid Graph $P_3 \times P_3$" + "\n" + r"$|V| = 9, |E| = 12$, Bipartite & Planar", fontsize=10, fontweight='bold', color='#1E293B')
    ax.axis('off')
    
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_2_graph_families.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 3. Havel-Hakimi Theorem & Graph Realization
def generate_diagram_3():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    
    # Left: Reduction Table
    ax1.set_facecolor('#F8FAFC')
    ax1.axis('off')
    steps_text = (
        "Havel-Hakimi Reduction Steps:\n"
        "----------------------------------------------------\n"
        "Initial:      S0 = (3, 3, 2, 2, 2)\n"
        "Step 1:      Pop d1 = 3 -> Subtract 1 from next 3 items\n"
        "             Remaining: (3 - 1, 2 - 1, 2 - 1, 2) = (2, 1, 1, 2)\n"
        "             Sort desc: S1 = (2, 2, 1, 1)\n\n"
        "Step 2:      Pop d1 = 2 -> Subtract 1 from next 2 items\n"
        "             Remaining: (2 - 1, 1 - 1, 1) = (1, 0, 1)\n"
        "             Sort desc: S2 = (1, 1, 0)\n\n"
        "Step 3:      Pop d1 = 1 -> Subtract 1 from next 1 item\n"
        "             Remaining: (1 - 1, 0) = (0, 0)\n"
        "             Sort desc: S3 = (0, 0)  [All zeros!]\n\n"
        "Conclusion:  (0, 0) is trivially graphical.\n"
        "             Therefore, (3, 3, 2, 2, 2) is GRAPHICAL!"
    )
    ax1.text(0.05, 0.95, steps_text, transform=ax1.transAxes, fontsize=9.5, fontfamily='monospace',
             verticalalignment='top', bbox=dict(boxstyle="round,pad=0.5", fc="#FFFFFF", ec="#CBD5E1", lw=1.5))
    ax1.set_title("Havel-Hakimi Algorithmic Proof", fontsize=11, fontweight='bold', color='#1E293B', pad=10)
    
    # Right: Realized Graph
    ax2.set_facecolor('#FAFAFB')
    G = nx.Graph()
    edges = [('v1', 'v2'), ('v1', 'v3'), ('v1', 'v4'), ('v2', 'v3'), ('v2', 'v5'), ('v4', 'v5')]
    G.add_edges_from(edges)
    pos = {'v1': (0.3, 1), 'v2': (1.7, 1), 'v3': (1, 1.7), 'v4': (0.3, 0), 'v5': (1.7, 0)}
    degrees = dict(G.degree())
    labels = {node: f"{node}\ndeg={degrees[node]}" for node in G.nodes()}
    
    nx.draw_networkx_nodes(G, pos, ax=ax2, node_color='#3B82F6', node_size=900, edgecolors='#1D4ED8', linewidths=2)
    nx.draw_networkx_labels(G, pos, labels=labels, ax=ax2, font_color='white', font_weight='bold', font_size=8.5)
    nx.draw_networkx_edges(G, pos, ax=ax2, edge_color='#64748B', width=2.5)
    ax2.set_title(r"Realization Graph $G$ on Canvas" + "\n" + r"Degree Sequence: $(3, 3, 2, 2, 2)$", fontsize=11, fontweight='bold', color='#1E293B', pad=10)
    ax2.axis('off')
    
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_3_havel_hakimi.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 4. Graph Isomorphism Diagram (Bijection f: V1 -> V2)
def generate_diagram_4():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    
    # Graph 1 (House shape)
    G1 = nx.Graph()
    G1.add_edges_from([('1', '2'), ('2', '3'), ('3', '4'), ('4', '1'), ('1', '3'), ('3', '5'), ('4', '5')])
    pos1 = {'1': (0, 0), '2': (1, 0), '3': (1, 1), '4': (0, 1), '5': (0.5, 1.8)}
    color_map = {'1': '#EF4444', '2': '#F59E0B', '3': '#10B981', '4': '#3B82F6', '5': '#8B5CF6'}
    node_colors1 = [color_map[n] for n in G1.nodes()]
    
    ax1.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G1, pos1, ax=ax1, node_color=node_colors1, node_size=650, edgecolors='#1E293B', linewidths=2)
    nx.draw_networkx_labels(G1, pos1, ax=ax1, font_color='white', font_weight='bold', font_size=10)
    nx.draw_networkx_edges(G1, pos1, ax=ax1, edge_color='#64748B', width=2)
    ax1.set_title("Graph $G_1$ (Component 1)\nDegree Sequence: $(4, 3, 3, 2, 2)$", fontsize=10.5, fontweight='bold', color='#1E293B')
    ax1.axis('off')
    
    # Graph 2 (Permuted layout and vertex identifiers)
    G2 = nx.Graph()
    G2.add_edges_from([('A', 'B'), ('B', 'C'), ('C', 'D'), ('D', 'A'), ('A', 'C'), ('C', 'E'), ('D', 'E')])
    pos2 = {'A': (1, 0), 'B': (0.5, -0.8), 'C': (0, 0), 'D': (0.5, 0.8), 'E': (-0.5, 0.8)}
    node_colors2 = [color_map['1'], color_map['2'], color_map['3'], color_map['4'], color_map['5']]
    
    ax2.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G2, pos2, ax=ax2, node_color=node_colors2, node_size=650, edgecolors='#1E293B', linewidths=2)
    nx.draw_networkx_labels(G2, pos2, ax=ax2, font_color='white', font_weight='bold', font_size=10)
    nx.draw_networkx_edges(G2, pos2, ax=ax2, edge_color='#64748B', width=2)
    ax2.set_title(r"Graph $G_2$ (Component 2)" + "\n" + r"Isomorphism Confirmed: $G_1 \cong G_2$", fontsize=10.5, fontweight='bold', color='#1E293B')
    ax2.axis('off')
    
    fig.suptitle(r"Graph Isomorphism: Bijection $f(1)=A, f(2)=B, f(3)=C, f(4)=D, f(5)=E$", fontsize=11, fontweight='bold', color='#0F172A', y=0.98)
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_4_isomorphism.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 5. Complement Graph (G and G')
def generate_diagram_5():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    
    G = nx.cycle_graph(5)
    G.add_edge(0, 2)
    pos = nx.circular_layout(G)
    
    ax1.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G, pos, ax=ax1, node_color='#3B82F6', node_size=600, edgecolors='#1D4ED8', linewidths=2)
    nx.draw_networkx_labels(G, pos, ax=ax1, font_color='white', font_weight='bold', font_size=10)
    nx.draw_networkx_edges(G, pos, ax=ax1, edge_color='#2563EB', width=2.5)
    ax1.set_title("Original Graph $G$\n$|V| = 5, |E| = 6$", fontsize=11, fontweight='bold', color='#1E293B')
    ax1.axis('off')
    
    G_comp = nx.complement(G)
    ax2.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G_comp, pos, ax=ax2, node_color='#EC4899', node_size=600, edgecolors='#BE185D', linewidths=2)
    nx.draw_networkx_labels(G_comp, pos, ax=ax2, font_color='white', font_weight='bold', font_size=10)
    nx.draw_networkx_edges(G_comp, pos, ax=ax2, edge_color='#DB2777', width=2.5, style='dashed')
    ax2.set_title(r"Complement Graph $\overline{G}$" + "\n" + r"$|V| = 5, |E| = 4$", fontsize=11, fontweight='bold', color='#1E293B')
    ax2.axis('off')
    
    fig.suptitle(r"Complement Invariant: $|E(G)| + |E(\overline{G})| = 6 + 4 = \binom{5}{2} = 10$ edges", fontsize=11.5, fontweight='bold', color='#0F172A', y=0.98)
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_5_complement.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 6. Bipartite Verification & 2-Coloring vs Odd Cycle Witness
def generate_diagram_6():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    
    # Left: Valid Bipartite 2-Coloring
    G1 = nx.Graph()
    G1.add_edges_from([('U1', 'V1'), ('U1', 'V2'), ('U2', 'V2'), ('U2', 'V3'), ('U3', 'V1'), ('U3', 'V3')])
    pos1 = {'U1': (0, 2), 'U2': (0, 1), 'U3': (0, 0), 'V1': (1.5, 2), 'V2': (1.5, 1), 'V3': (1.5, 0)}
    
    ax1.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G1, pos1, nodelist=['U1', 'U2', 'U3'], ax=ax1, node_color='#0284C7', node_size=600, edgecolors='#0369A1', linewidths=2)
    nx.draw_networkx_nodes(G1, pos1, nodelist=['V1', 'V2', 'V3'], ax=ax1, node_color='#F59E0B', node_size=600, edgecolors='#D97706', linewidths=2)
    nx.draw_networkx_labels(G1, pos1, ax=ax1, font_color='white', font_weight='bold', font_size=9)
    nx.draw_networkx_edges(G1, pos1, ax=ax1, edge_color='#64748B', width=2)
    ax1.set_title("Bipartite Graph (2-Colorable)\nPartition V1 (Blue) and V2 (Amber)", fontsize=10.5, fontweight='bold', color='#1E293B')
    ax1.axis('off')
    
    # Right: Non-Bipartite (Odd Cycle Witness)
    G2 = nx.Graph()
    G2.add_edges_from([('A', 'B'), ('B', 'C'), ('C', 'A'), ('C', 'D'), ('D', 'E'), ('E', 'C')])
    pos2 = {'A': (0.5, 1.8), 'B': (0, 1), 'C': (1, 1), 'D': (1.8, 1.8), 'E': (2, 0.8)}
    
    ax2.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G2, pos2, ax=ax2, node_color='#E2E8F0', node_size=550, edgecolors='#64748B', linewidths=1.5)
    nx.draw_networkx_nodes(G2, pos2, nodelist=['A', 'B', 'C'], ax=ax2, node_color='#F43F5E', node_size=600, edgecolors='#BE123C', linewidths=2.5)
    nx.draw_networkx_labels(G2, pos2, ax=ax2, font_color='#0F172A', font_weight='bold', font_size=9)
    nx.draw_networkx_edges(G2, pos2, ax=ax2, edge_color='#94A3B8', width=1.5)
    nx.draw_networkx_edges(G2, pos2, edgelist=[('A', 'B'), ('B', 'C'), ('C', 'A')], ax=ax2, edge_color='#E11D48', width=3)
    ax2.set_title("Non-Bipartite Graph (Konig's Theorem)\nOdd-Cycle Witness Triangle (A -> B -> C -> A)", fontsize=10.5, fontweight='bold', color='#1E293B')
    ax2.axis('off')
    
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_6_bipartite.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 7. BFS & DFS Execution Trees
def generate_diagram_7():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    
    # BFS Tree
    G_bfs = nx.DiGraph()
    G_bfs.add_edges_from([('S', 'A'), ('S', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'E')])
    pos_bfs = {'S': (0.5, 2), 'A': (0.2, 1), 'B': (0.8, 1), 'C': (0, 0), 'D': (0.4, 0), 'E': (0.8, 0)}
    labels_bfs = {'S': 'S (d=0)', 'A': 'A (d=1)', 'B': 'B (d=1)', 'C': 'C (d=2)', 'D': 'D (d=2)', 'E': 'E (d=2)'}
    
    ax1.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G_bfs, pos_bfs, ax=ax1, node_color='#0284C7', node_size=850, edgecolors='#0369A1', linewidths=2)
    nx.draw_networkx_labels(G_bfs, pos_bfs, labels=labels_bfs, ax=ax1, font_color='white', font_weight='bold', font_size=7.5)
    nx.draw_networkx_edges(G_bfs, pos_bfs, ax=ax1, edge_color='#0284C7', width=2.5, arrowsize=16, arrowstyle='-|>', connectionstyle='arc3,rad=0.0')
    ax1.set_title("Breadth-First Search (BFS)\nQueue FIFO - Discovers Shortest Unweighted Hops", fontsize=10.5, fontweight='bold', color='#1E293B')
    ax1.axis('off')
    
    # DFS Tree
    G_dfs = nx.DiGraph()
    G_dfs.add_edges_from([('1', '2'), ('2', '3'), ('3', '4'), ('4', '1'), ('2', '5')])
    pos_dfs = {'1': (0.5, 2), '2': (0.2, 1.2), '3': (0.2, 0.2), '4': (0.8, 0.2), '5': (-0.3, 0.5)}
    labels_dfs = {'1': '1 [1/10]', '2': '2 [2/7]', '3': '3 [3/6]', '4': '4 [4/5]', '5': '5 [8/9]'}
    
    ax2.set_facecolor('#FAFAFB')
    nx.draw_networkx_nodes(G_dfs, pos_dfs, ax=ax2, node_color='#8B5CF6', node_size=850, edgecolors='#6D28D9', linewidths=2)
    nx.draw_networkx_labels(G_dfs, pos_dfs, labels=labels_dfs, ax=ax2, font_color='white', font_weight='bold', font_size=7.5)
    nx.draw_networkx_edges(G_dfs, pos_dfs, edgelist=[('1', '2'), ('2', '3'), ('3', '4'), ('2', '5')], ax=ax2, edge_color='#8B5CF6', width=2.5, arrowsize=16, arrowstyle='-|>')
    nx.draw_networkx_edges(G_dfs, pos_dfs, edgelist=[('4', '1')], ax=ax2, edge_color='#EF4444', width=2.5, style='dashed', arrowsize=16, arrowstyle='-|>', connectionstyle='arc3,rad=0.25')
    ax2.set_title("Depth-First Search (DFS) & Cycle Detection\nStack LIFO - Gray Back-Edge 4 -> 1 Detects Cycle", fontsize=10.5, fontweight='bold', color='#1E293B')
    ax2.axis('off')
    
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_7_bfs_dfs.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 8. Dijkstra Shortest Path Tree
def generate_diagram_8():
    fig, ax = plt.subplots(figsize=(9, 5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    ax.set_facecolor('#FAFAFB')
    
    G = nx.Graph()
    G.add_edge('A', 'B', weight=4)
    G.add_edge('A', 'C', weight=2)
    G.add_edge('B', 'C', weight=1)
    G.add_edge('B', 'D', weight=5)
    G.add_edge('C', 'D', weight=8)
    G.add_edge('C', 'E', weight=10)
    G.add_edge('D', 'E', weight=2)
    G.add_edge('D', 'Z', weight=6)
    G.add_edge('E', 'Z', weight=3)
    
    pos = {'A': (0, 1), 'B': (1, 2), 'C': (1, 0), 'D': (2, 2), 'E': (2, 0), 'Z': (3, 1)}
    
    spt_edges = [('A', 'C'), ('C', 'B'), ('B', 'D'), ('D', 'E'), ('E', 'Z')]
    other_edges = [e for e in G.edges() if e not in spt_edges and (e[1], e[0]) not in spt_edges]
    
    nx.draw_networkx_edges(G, pos, edgelist=other_edges, ax=ax, edge_color='#CBD5E1', width=1.5, style='dotted')
    nx.draw_networkx_edges(G, pos, edgelist=spt_edges, ax=ax, edge_color='#10B981', width=3.5)
    
    dist_labels = {'A': 'A (d=0)', 'B': 'B (d=3)', 'C': 'C (d=2)', 'D': 'D (d=8)', 'E': 'E (d=10)', 'Z': 'Z (d=13)'}
    nx.draw_networkx_nodes(G, pos, ax=ax, node_color='#10B981', node_size=850, edgecolors='#047857', linewidths=2)
    nx.draw_networkx_labels(G, pos, labels=dist_labels, ax=ax, font_color='white', font_weight='bold', font_size=8)
    
    edge_weights = nx.get_edge_attributes(G, 'weight')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_weights, ax=ax, font_color='#0F172A', font_weight='bold', font_size=9, bbox=dict(boxstyle="round,pad=0.2", fc="#F8FAFC", ec="#94A3B8"))
    
    ax.set_title("Dijkstra's Shortest Path Tree from Source A\nOptimal Path to Z: A -> C -> B -> D -> E -> Z (Total Cost = 13)", fontsize=11, fontweight='bold', color='#1E293B', pad=12)
    ax.axis('off')
    
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_8_dijkstra.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

# 9. Prim's Minimum Spanning Tree
def generate_diagram_9():
    fig, ax = plt.subplots(figsize=(9, 5), dpi=300)
    fig.patch.set_facecolor('#FAFAFB')
    ax.set_facecolor('#FAFAFB')
    
    G = nx.Graph()
    G.add_edge('1', '2', weight=3)
    G.add_edge('1', '4', weight=1)
    G.add_edge('2', '4', weight=3)
    G.add_edge('2', '3', weight=1)
    G.add_edge('2', '5', weight=5)
    G.add_edge('3', '5', weight=6)
    G.add_edge('3', '6', weight=4)
    G.add_edge('4', '5', weight=6)
    G.add_edge('5', '6', weight=2)
    
    pos = {'1': (0, 1), '2': (1, 2), '3': (2, 2), '4': (0.5, 0), '5': (1.5, 0), '6': (2.5, 1)}
    
    mst_edges = [('1', '4'), ('2', '3'), ('5', '6'), ('1', '2'), ('3', '6')]
    non_mst = [e for e in G.edges() if e not in mst_edges and (e[1], e[0]) not in mst_edges]
    
    nx.draw_networkx_edges(G, pos, edgelist=non_mst, ax=ax, edge_color='#CBD5E1', width=1.5, style='dashed')
    nx.draw_networkx_edges(G, pos, edgelist=mst_edges, ax=ax, edge_color='#F59E0B', width=3.5)
    
    nx.draw_networkx_nodes(G, pos, ax=ax, node_color='#F59E0B', node_size=750, edgecolors='#B45309', linewidths=2)
    nx.draw_networkx_labels(G, pos, ax=ax, font_color='white', font_weight='bold', font_size=10)
    
    edge_weights = nx.get_edge_attributes(G, 'weight')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_weights, ax=ax, font_color='#0F172A', font_weight='bold', font_size=9, bbox=dict(boxstyle="round,pad=0.2", fc="#FFFBEB", ec="#FCD34D"))
    
    ax.set_title("Prim's Minimum Spanning Tree (MST)\nGreedy Cut Property: Total Weight = 1 + 1 + 2 + 3 + 4 = 11 (|E| = |V|-1 = 5)", fontsize=11, fontweight='bold', color='#1E293B', pad=12)
    ax.axis('off')
    
    plt.tight_layout()
    path = os.path.join(DIAGRAM_DIR, "diagram_9_prims_mst.png")
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved:", path)

if __name__ == "__main__":
    generate_diagram_1()
    generate_diagram_2()
    generate_diagram_3()
    generate_diagram_4()
    generate_diagram_5()
    generate_diagram_6()
    generate_diagram_7()
    generate_diagram_8()
    generate_diagram_9()
    print("All diagrams generated successfully in", DIAGRAM_DIR)
