# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A frameworkless **Workflow Editor** — a visual node-graph editor rendered on a native `<canvas>`. Three files: `editor.html`, `editor.js` (~970 lines, single IIFE), `editor.css`. No build step, no dependencies, no test runner.

## Running

There is no toolchain. Open `editor.html` in a browser, or serve the directory:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/editor.html
```

## Architecture (`editor.js`)

Organized by section banners (`// ====`). Key invariants:

- **All rendering is on one `<canvas>`**, redrawn from scratch each frame. There are no per-node DOM elements. Anything visual goes through `render()` → `drawGrid` / `drawConnection` / `drawNode`. To trigger a redraw, call `requestRender()` (rAF-coalesced).
- **Coordinate system.** State is stored in *world* coordinates. The render transform combines DPR and viewport in one matrix: `ctx.setTransform(dpr*scale, 0, 0, dpr*scale, dpr*viewport.x, dpr*viewport.y)`. Mouse events come in as CSS pixels and must go through `screenToWorld()` before hit-testing or drag math. The canvas backing store is sized `width*dpr × height*dpr`; never assume CSS pixels equal canvas pixels.
- **Node z-order** is `state.nodesOrder` (array of ids), separate from `state.nodes` (Map). Iterate `nodesOrder` for rendering and reverse-iterate for hit-testing. Selecting a node calls `bringToFront`.
- **Connections** are routed orthogonally by `buildOrthogonalRoute` based on the source `portType` (`output`, `output-true`, `output-false`, `input`). Condition nodes have two side outputs (true=green right, false=red left); other non-end nodes have one bottom output. Ports are visual only — connections store `{fromNodeId, toNodeId, portType}` and the geometry is recomputed from current node positions every frame.
- **Public API** is `window.WorkflowEditor` (`createNode`, `createConnection`, `exportWorkflow`, zoom helpers, etc.). Don't break this surface.
- **History context:** `editor.js` was rewritten from a Fabric.js implementation to native Canvas 2D (commit `aa417e5`); if you find references to Fabric in comments/docs, they're stale.

## Conventions

- Single IIFE in `editor.js`; keep new code inside it rather than introducing modules.
- No frameworks, no bundler, no `package.json`. Don't introduce one without asking — the "vanilla JS, no toolchain" choice is deliberate.
- CSS uses a glassmorphism / liquid-glass theme (commits `eee4489`, `f43bdbd`). When restyling, check `editor.css` for the existing palette before inventing new colors.
