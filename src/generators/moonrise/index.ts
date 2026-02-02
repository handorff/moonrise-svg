import type { Generator } from "../../core/types";
import { schema, type Params } from "./schema";
import { renderSvg } from "./render";

export const moonrise: Generator = {
  id: "moonrise",
  name: "Moonrise",
  description: "Arc-based multi-panel SVG with boolean intersections.",
  schema,
  render: (params) => renderSvg(params as Params),
  ui: {
    title: "Moonrise SVG",
    groups: {
      export: {
        label: "Export",
        description: "In export mode, the SVG will contain only the selected panel.",
      },
    },
  },
};
