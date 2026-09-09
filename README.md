# GraphLab 🧪

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)

An advanced, interactive graph theory laboratory and visualizer. Draw graphs, test theorems and invariants, run classic and structural algorithms step-by-step, verify graph isomorphism, evaluate Havel-Hakimi degree sequences, explore complement graphs and bipartite colorings, and consult the AI Graph Tutor.

---

## ✨ Features

### 🎨 Visual Graph Lab & Canvas
- **Interactive Editor**: Add, reposition, connect, and delete nodes and edges with intuitive click-and-drag mechanics.
- **Side-by-Side Graph Generation**: Generate template graphs (Complete, Cycle, Bipartite, Path, Star, Trees, Grids) placed neatly beside your existing graph without overwriting your canvas.
- **Marquee Selection Tool**: Click & drag a selection box (Hold & Drag) to select multiple nodes and edges, moving or deleting them in bulk.
- **Node Degree Hover Inspection**: Hover over any vertex to instantly view its total degree, in-degree, and out-degree.
- **Edge Visibility Toggle**: Toggle edge rendering visibility on dense graphs for clearer vertex inspection.
- **Flexible Edge Weights**: Directed and undirected edges with customizable weights (-999 to 999).
- **Multi-Renderer Abstraction**: Switch seamlessly between **SVG** (vector precision), **Canvas** (high-performance 60FPS for large graphs), and **3D WebGL** (Three.js / React Three Fiber).
- **Cross-Platform Shortcuts**: Native hotkey support tailored for both Windows (`Ctrl`, `Alt`) and macOS (`⌘`, `⌥`).

---

### 📐 Graph Theory Invariants & Solvers
- **Havel-Hakimi Degree Sequence Solver**:
  - Test if an arbitrary sequence of non-negative integers is graphical.
  - Interactive step-by-step reduction visualization with realization graph generation.
- **Graph Isomorphism Tester**:
  - Compare two graphs or distinct components to verify if they are structurally isomorphic.
  - Provides exact vertex-to-vertex mappings or non-isomorphism counterexamples.
- **Complement Graph Generator**:
  - View and generate the complement graph $\overline{G} = (V, \overline{E})$ with an interactive inspector.
- **Bipartite Verification & 2-Coloring**:
  - Test bipartiteness using 2-coloring BFS and reveal odd-cycle witnesses when non-bipartite.
- **Eulerian Circuits & Paths**:
  - Verify Euler's theorem and trace Eulerian paths/circuits step-by-step using Fleury's algorithm.
- **Hamiltonian Paths & Cycles**:
  - Backtracking solver with branch pruning to detect and animate Hamiltonian paths and cycles.
- **Connected & Strongly Connected Components**:
  - BFS connected components for undirected graphs and Tarjan's SCC algorithm for directed graphs.
- **Subgraph Extraction**:
  - Select any subset of vertices to extract and inspect the induced subgraph.

---

### 🚀 Classic Algorithm Visualizer
- **Breadth-First Search (BFS)** & **Depth-First Search (DFS)**
- **Cycle Detection**
- **Dijkstra's Shortest Path Algorithm**
- **Bellman-Ford Shortest Path Algorithm** (with negative cycle detection)
- **Prim's Minimum Spanning Tree (MST)**
- **Real-Time Data Structure Visualizer**: Inspect the algorithm's internal queue, stack, priority queue, and distance table updated live on every step.
- **Playback Control**: Auto-play with adjustable speed (0.5x – 4x) or manual forward/backward stepping.

---

### 🤖 AI Graph Theory Tutor & Image Import
- **AI Graph Theory Tutor**: In-canvas AI tutor powered by Groq (Llama 3.3 70B) with automatic local heuristic fallback to explain theorems, invariants, and step-by-step algorithm operations.
- **Image-to-Graph Import**: Upload an image or sketch of a graph to automatically recognize vertices and edges onto the canvas.

---

## 🛠️ Tech Stack

- **Framework**: React 19, TypeScript, React Compiler
- **Bundler & Tooling**: Vite 6, Vitest
- **Styling**: Tailwind CSS v4, Lucide Icons, Radix UI
- **3D Graphics**: Three.js, React Three Fiber
- **State Management**: Zustand with persistent storage
- **AI Acceleration**: Groq SDK + local algorithmic heuristics

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- `pnpm` (or `npm` / `yarn`)

### Installation

```bash
# Clone the repository
git clone https://github.com/Nightkilller/GraphLab-.git
cd GraphLab-

# Install dependencies
pnpm install

# Start the local development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
```

> **Note**: The production output will be generated in the `build/` directory (configured via `vite.config.ts`).

---

## 🌐 Hosting Live

You can easily deploy GraphLab to popular static hosting platforms in minutes:

### Option 1: Vercel (Recommended ⚡)
1. Push your code to GitHub (`https://github.com/Nightkilller/GraphLab-`).
2. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
3. Click **"Add New..."** → **"Project"** and select `GraphLab-`.
4. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `pnpm build` (or `npm run build`)
   - **Output Directory**: `build` *(Important: GraphLab outputs to `build`, not `dist`)*
   - **Install Command**: `pnpm install` (or `npm install`)
5. *(Optional)* Under **Environment Variables**, add:
   - `VITE_GROQ_API_KEY`: Your Groq API key for the AI Graph Tutor (optional, local explainer works offline without it).
6. Click **Deploy**. Vercel will build and assign you a live HTTPS domain (e.g. `graphlab.vercel.app`).

---

### Option 2: Netlify
1. Go to [netlify.com](https://www.netlify.com) and click **"Add new site"** → **"Import an existing project"**.
2. Connect your GitHub repository `GraphLab-`.
3. Set the build configurations:
   - **Build command**: `pnpm build`
   - **Publish directory**: `build`
4. Click **Deploy site**.

---

### Option 3: GitHub Pages
1. In `vite.config.ts`, ensure `base` matches your repository name if hosting under `https://<username>.github.io/GraphLab-/`:
   ```ts
   base: '/GraphLab-/',
   ```
2. Enable GitHub Pages in repository settings:
   - Go to **Settings** → **Pages** → **Build and deployment** → **Source**: **GitHub Actions**.
   - Create `.github/workflows/deploy.yml` with a standard Vite deployment action pointing to `build/`.

---

## ⌨️ Keyboard Shortcuts

| Action | Windows / Linux | macOS |
|---|---|---|
| Select Mode | `V` | `V` |
| Add Node | `N` | `N` |
| Add Edge | `E` | `E` |
| Box / Marquee Select | `B` | `B` |
| Delete Selected | `Delete` / `Backspace` | `Backspace` |
| Undo | `Ctrl + Z` | `⌘ + Z` |
| Redo | `Ctrl + Y` or `Ctrl + Shift + Z` | `⌘ + Shift + Z` |
| Select All | `Ctrl + A` | `⌘ + A` |
| Fit to Screen | `Ctrl + 0` | `⌘ + 0` |
| Toggle Pan | `Space` (Hold) | `Space` (Hold) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
