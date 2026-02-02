# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the TypeScript source for the procedural SVG generator.
  - `main.ts` is the entry point and boots the UI.
  - `render.ts`, `geometry.ts`, `random.ts`, `schema.ts`, and `ui.ts` contain the core rendering and parameter logic.
  - `src/param-lib/` is a schema-driven parameter/UI library used by the app.
- `index.html` is the Vite HTML entry.
- `dist/` is the production build output (generated).
- `vite.config.ts` contains bundler configuration.

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server with hot reload.
- `npm run build` — produce a production build in `dist/`.
- `npm run preview` — serve the production build locally for final checks.

## Coding Style & Naming Conventions
- Language: TypeScript with ES module imports.
- Indentation: 2 spaces; keep line length readable.
- Prefer descriptive, math-friendly names for geometry functions (e.g., `circleCenters`, `makeTranslatedTruncatedCurve`).
- Files use lower-case names with hyphens avoided; export functions with `camelCase`.
- No explicit formatter/linter is configured; keep style consistent with existing files.

## Testing Guidelines
- No automated test framework is currently configured.
- If you add tests, place them under a new `tests/` directory and document the runner in this file.

## Commit & Pull Request Guidelines
- Commit messages follow an imperative style (e.g., “Add schema-driven param-lib”, “Refactor main.ts…”).
- Include a brief, single-sentence summary; avoid verbose bodies unless necessary.
- For PRs: describe the change, link related issues if any, and include before/after screenshots for UI or SVG output changes.

## Architecture Notes
- Rendering is handled by Paper.js and operates in two modes: preview (multi-panel debug) and export (single-panel SVG).
- Parameter definitions and UI generation are schema-driven via `src/param-lib/`.

## Agent-Specific Instructions
- Consult `CLAUDE.md` for architectural and module details before making non-trivial changes.
