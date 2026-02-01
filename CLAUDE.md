# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Build for production (TypeScript + Vite)
npm run preview  # Preview production build locally
```

## Architecture

Moonrise SVG is a procedural SVG artwork generator using Paper.js for vector graphics and boolean operations.

### Tech Stack
- TypeScript + Vite
- Paper.js for vector graphics and path intersections
- Deployed to GitHub Pages via GitHub Actions

### Code Structure

The codebase is organized into focused modules under `src/`:

| File | Purpose |
|------|---------|
| `main.ts` | Entry point; calls `initUI()` |
| `types.ts` | `Params` type definition and `DEFAULTS` constant |
| `params.ts` | `coerceParams()` for validating/normalizing user input |
| `random.ts` | Seeded PRNG (`xmur3` + `mulberry32`) and `getRandomPoints()` |
| `geometry.ts` | `makeTranslatedTruncatedCurve()` and `circleCenters()` |
| `render.ts` | `renderSvg()` for preview mode, `renderExportSvg()` for single-panel export |
| `ui.ts` | HTML template, DOM bindings, event handlers, param import/export |

### How the Algorithm Works

1. A mathematical function `f(x)` defines an arc curve
2. Random points are generated using a seeded PRNG
3. Curved paths are created that follow the arc function
4. Circular "panels" are positioned along the arc
5. Paper.js computes boolean intersections between paths and circles
6. Original shapes are removed, leaving only the intersected segments

### Two Rendering Modes

- **Preview**: All panels rendered with blue border and red panel rectangles for debugging
- **Export**: Single selected panel rendered as a square SVG for download
