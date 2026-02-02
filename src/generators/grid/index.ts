import type { Generator } from "../../core/types";
import { schema, type Params } from "./schema";
import { renderSvg } from "./render";

export const grid: Generator = {
  id: "grid",
  name: "Jittered Grid",
  description: "A rectilinear grid with seeded jitter for plotter studies.",
  schema,
  render: (params) => renderSvg(params as Params),
  ui: {
    title: "Jittered Grid",
  },
};
