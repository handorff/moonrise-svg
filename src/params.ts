import { DEFAULTS, type Mode, type Params } from "./types";

function clampInt(n: number, min: number, max: number) {
  n = Math.round(n);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

export function coerceParams(partial: Partial<Params>): Params {
  const panels = clampInt(Number(partial.panels ?? DEFAULTS.panels), 1, 50);

  const mode: Mode = partial.mode === "export" ? "export" : "preview";
  const exportPanel = clampInt(
    Number(partial.exportPanel ?? DEFAULTS.exportPanel),
    1,
    panels
  );

  return {
    ...DEFAULTS,
    ...partial,
    points: clampInt(Number(partial.points ?? DEFAULTS.points), 1, 100000),
    panels,
    circleRadius: clampNum(
      Number(partial.circleRadius ?? DEFAULTS.circleRadius),
      0,
      10000
    ),
    panelWidth: clampNum(
      Number(partial.panelWidth ?? DEFAULTS.panelWidth),
      1,
      10000
    ),
    totalHeight: clampNum(
      Number(partial.totalHeight ?? DEFAULTS.totalHeight),
      1,
      100000
    ),
    totalWidth: clampNum(
      Number(partial.totalWidth ?? DEFAULTS.totalWidth),
      1,
      100000
    ),
    seed: String(partial.seed ?? DEFAULTS.seed),
    mode,
    exportPanel,
  };
}
