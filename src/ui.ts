import { createParamUI, type ParamUI } from "./param-lib";
import type { Generator } from "./core/types";

export function mountGeneratorUI(
  container: HTMLElement,
  generator: Generator
): ParamUI {
  container.innerHTML = "";

  const ui = createParamUI(generator.schema, {
    title: generator.ui?.title ?? generator.name,
    container,
    onRender: (params) => {
      const svg = generator.render(params as Record<string, unknown>);
      const preview = container.querySelector<HTMLDivElement>("#preview");
      if (preview) {
        preview.innerHTML = svg;
      }
    },
    groups: generator.ui?.groups,
  });

  (window as unknown as Record<string, unknown>).activeGeneratorUI = ui;
  return ui;
}
