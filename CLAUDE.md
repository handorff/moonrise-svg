# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Build for production (TypeScript + Vite)
npm run preview  # Preview production build locally
```

## Architecture

Moonrise SVG is a procedural SVG artwork generator using Paper.js for vector graphics and boolean operations. The entire application lives in a single file (`src/main.ts`, ~580 lines).

### Tech Stack
- TypeScript + Vite
- Paper.js for vector graphics and path intersections
- Deployed to GitHub Pages via GitHub Actions

### Code Structure (src/main.ts)

The file is organized into distinct sections:

1. **Types & Defaults (lines 3-31)**: `Params` type defines all configurable parameters; `DEFAULTS` provides initial values

2. **Parameter Validation (lines 33-81)**: `coerceParams()` validates and normalizes user input with clamping

3. **Rendering (lines 83-215)**:
   - `renderSvg()`: Main renderer for preview mode (shows all panels with debug borders)
   - `renderExportSvg()`: Single-panel export renderer (square SVG of selected circle)

4. **Geometry Functions (lines 217-303)**:
   - `makeTranslatedTruncatedCurve()`: Creates curved paths following a mathematical function
   - `circleCenters()`: Calculates panel positions along an arc
   - Seeded random: `xmur3()` + `mulberry32()` for reproducible randomness

5. **UI (lines 306-578)**: Inline HTML template with event handlers

### How the Algorithm Works

1. A mathematical function `f(x)` defines an arc curve
2. Random points are generated using a seeded PRNG
3. Curved paths are created that follow the arc function
4. Circular "panels" are positioned along the arc
5. Paper.js computes boolean intersections between paths and circles
6. Original shapes are removed, leaving only the intersected segments

### Two Rendering Modes

- **Preview**: All panels rendered with blue circle borders and red panel rectangles
- **Export**: Single selected panel rendered as a square SVG for download
