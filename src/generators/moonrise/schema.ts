import { defineSchema, type InferParams } from "../../param-lib";

export const schema = defineSchema({
  seed: { type: "string", default: "demo", label: "Seed", randomize: true },
  points: { type: "int", default: 300, min: 1, max: 100000, label: "Points" },
  panels: { type: "int", default: 4, min: 1, max: 50, label: "Panels" },
  circleRadius: {
    type: "float",
    default: 27.5,
    min: 0,
    max: 10000,
    step: 0.1,
    label: "Circle radius",
  },
  panelWidth: {
    type: "float",
    default: 75,
    min: 1,
    max: 10000,
    step: 0.1,
    label: "Panel width",
  },
  totalHeight: {
    type: "float",
    default: 270,
    min: 1,
    max: 100000,
    step: 0.1,
    label: "Total height",
  },
  totalWidth: {
    type: "float",
    default: 570,
    min: 1,
    max: 100000,
    step: 0.1,
    label: "Total width",
  },
  mode: {
    type: "enum",
    options: ["preview", "export"] as const,
    default: "preview",
    display: "radio",
  },
  exportPanel: {
    type: "int",
    default: 1,
    min: 1,
    max: { ref: "panels" },
    label: "Panel #",
    group: "export",
  },
});

export type Params = InferParams<typeof schema>;
