export type Mode = "preview" | "export";

export type Params = {
  points: number;
  panels: number;
  circleRadius: number;
  panelWidth: number;
  totalHeight: number;
  totalWidth: number;

  seed: string;

  mode: Mode;
  exportPanel: number; // 1..panels
};

export const DEFAULTS: Params = {
  points: 300,
  panels: 4,
  circleRadius: 27.5,
  panelWidth: 75,
  totalHeight: 270,
  totalWidth: 570,

  seed: "demo",

  mode: "preview",
  exportPanel: 1,
};
