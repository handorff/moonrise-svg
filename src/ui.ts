import { createParamUI } from "./param-lib";
import { schema } from "./schema";
import { renderSvg } from "./render";

export function initUI() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  const ui = createParamUI(schema, {
    title: "Moonrise SVG",
    container: app,
    onRender: (params) => {
      const svg = renderSvg(params);
      const preview = app.querySelector<HTMLDivElement>("#preview");
      if (preview) {
        preview.innerHTML = svg;
      }
    },
    groups: {
      export: {
        label: "Export",
        description: "In export mode, the SVG will contain only the selected panel.",
      },
    },
  });

  // Expose for debugging if needed
  (window as unknown as Record<string, unknown>).moonriseUI = ui;
}
