import type { FieldDef, InferParams, Schema } from "./types";
import { createCoercer, getDefaults } from "./coerce";
import { generateSeed, isFieldRef, resolveRef } from "./utils";

export type GroupConfig = {
  label: string;
  collapsible?: boolean;
  description?: string;
};

export type ParamUIConfig<S extends Schema> = {
  title: string;
  container: HTMLElement;
  onRender: (params: InferParams<S>) => void;
  groups?: Record<string, GroupConfig>;
  onDownload?: (params: InferParams<S>, svg: string) => void;
};

export type ParamUI<S extends Schema> = {
  getParams: () => InferParams<S>;
  setParams: (params: Partial<InferParams<S>>) => void;
  render: () => void;
};

/**
 * Create a parameter UI from a schema definition.
 */
export function createParamUI<S extends Schema>(
  schema: S,
  config: ParamUIConfig<S>
): ParamUI<S> {
  const coerce = createCoercer(schema);
  const defaults = getDefaults(schema);

  let currentParams = { ...defaults };
  let lastSvg = "";

  // Build DOM structure
  const { container, title, onRender, groups = {} } = config;
  const elements: Record<string, HTMLInputElement | HTMLInputElement[]> = {};
  const fieldContainers: Record<string, HTMLElement> = {};

  // Create main HTML structure
  container.innerHTML = buildHTML(schema, title, defaults, groups);

  // Cache element references
  for (const key of Object.keys(schema)) {
    const field = schema[key];
    if (field.type === "enum" && field.display !== "select") {
      elements[key] = Array.from(
        container.querySelectorAll<HTMLInputElement>(`input[name="${key}"]`)
      );
    } else {
      elements[key] = container.querySelector<HTMLInputElement>(`#${key}`)!;
    }
    fieldContainers[key] =
      container.querySelector<HTMLElement>(`[data-field="${key}"]`) ??
      (elements[key] as HTMLElement);
  }

  const preview = container.querySelector<HTMLDivElement>("#preview")!;
  const status = container.querySelector<HTMLParagraphElement>("#status")!;
  const downloadBtn = container.querySelector<HTMLButtonElement>("#download")!;
  const exportParamsBtn =
    container.querySelector<HTMLButtonElement>("#exportParams")!;
  const importParamsBtn =
    container.querySelector<HTMLButtonElement>("#importParams")!;
  const paramsFile =
    container.querySelector<HTMLInputElement>("#paramsFile")!;

  // Group containers for conditional styling
  const groupContainers: Record<string, HTMLElement> = {};
  for (const groupName of Object.keys(groups)) {
    const el = container.querySelector<HTMLElement>(
      `[data-group="${groupName}"]`
    );
    if (el) groupContainers[groupName] = el;
  }

  function readFromUI(): InferParams<S> {
    const partial: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(schema)) {
      const el = elements[key];
      if (Array.isArray(el)) {
        // Radio buttons
        const checked = el.find((r) => r.checked);
        partial[key] = checked?.value ?? field.default;
      } else if (field.type === "boolean") {
        partial[key] = el.checked;
      } else if (field.type === "int" || field.type === "float") {
        partial[key] = Number(el.value);
      } else {
        partial[key] = el.value;
      }
    }
    return coerce(partial as Partial<InferParams<S>>);
  }

  function writeToUI(params: InferParams<S>): void {
    for (const [key, field] of Object.entries(schema)) {
      const el = elements[key];
      const value = params[key as keyof typeof params];
      if (Array.isArray(el)) {
        // Radio buttons
        for (const radio of el) {
          radio.checked = radio.value === value;
        }
      } else if (field.type === "boolean") {
        el.checked = value as boolean;
      } else {
        el.value = String(value);
      }
    }
    syncDynamicConstraints(params);
    syncGroupVisibility(params);
  }

  function syncDynamicConstraints(params: InferParams<S>): void {
    for (const [key, field] of Object.entries(schema)) {
      if (field.type === "int" || field.type === "float") {
        const el = elements[key] as HTMLInputElement;
        if (isFieldRef(field.min)) {
          el.min = String(
            resolveRef(
              schema,
              params as unknown as Record<string, unknown>,
              field.min
            )
          );
        }
        if (isFieldRef(field.max)) {
          const maxVal = resolveRef(
            schema,
            params as unknown as Record<string, unknown>,
            field.max
          );
          el.max = String(maxVal);
          // Clamp current value if needed
          if (Number(el.value) > maxVal) {
            el.value = String(maxVal);
          }
        }
      }
    }
  }

  function syncGroupVisibility(params: InferParams<S>): void {
    // Handle export group visibility based on mode
    const mode = (params as Record<string, unknown>)["mode"];
    const exportGroup = groupContainers["export"];
    if (exportGroup) {
      const isExport = mode === "export";
      exportGroup.style.opacity = isExport ? "1" : "0.5";
      // Disable inputs in the group
      const inputs = exportGroup.querySelectorAll<HTMLInputElement>("input");
      for (const input of inputs) {
        input.disabled = !isExport;
      }
    }
  }

  function doRender(): void {
    status.textContent = "Rendering…";
    currentParams = readFromUI();
    syncDynamicConstraints(currentParams);
    syncGroupVisibility(currentParams);

    lastSvg = "";
    onRender(currentParams);
  }

  // We need a way to capture the SVG from onRender
  // Modify to accept the SVG back
  function doRenderWithResult(): void {
    status.textContent = "Rendering…";
    currentParams = readFromUI();
    syncDynamicConstraints(currentParams);
    syncGroupVisibility(currentParams);

    // The onRender callback should return the SVG or we capture it differently
    // For now, we'll assume the caller updates preview directly
    onRender(currentParams);
    status.textContent = "Done.";
  }

  function downloadSvg(): void {
    const svgEl = preview.querySelector("svg");
    if (!svgEl) return;
    lastSvg = svgEl.outerHTML;

    const mode = (currentParams as Record<string, unknown>)["mode"] as string;
    const panels = (currentParams as Record<string, unknown>)[
      "panels"
    ] as number;
    const exportPanel = (currentParams as Record<string, unknown>)[
      "exportPanel"
    ] as number;

    const suffix =
      mode === "export"
        ? `panel-${exportPanel}-of-${panels}`
        : `preview-${panels}-panels`;

    const blob = new Blob([lastSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `moonrise-${suffix}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function downloadParams(): void {
    const params = readFromUI();
    const payload = JSON.stringify(params, null, 2);
    const blob = new Blob([payload], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "moonrise-params.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  async function importParamsFromFile(file: File): Promise<void> {
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<InferParams<S>>;
    const nextParams = coerce(parsed);
    writeToUI(nextParams);
    currentParams = nextParams;
    doRenderWithResult();
  }

  // Bind events
  downloadBtn.addEventListener("click", downloadSvg);
  exportParamsBtn.addEventListener("click", downloadParams);
  importParamsBtn.addEventListener("click", () => paramsFile.click());
  paramsFile.addEventListener("change", async () => {
    const file = paramsFile.files?.[0];
    if (!file) return;
    try {
      await importParamsFromFile(file);
      status.textContent = "Params imported.";
    } catch (error) {
      console.error(error);
      status.textContent = "Unable to import params JSON.";
    } finally {
      paramsFile.value = "";
    }
  });

  // Bind randomize buttons
  for (const [key, field] of Object.entries(schema)) {
    if (field.type === "string" && field.randomize) {
      const btn = container.querySelector<HTMLButtonElement>(
        `#randomize-${key}`
      );
      if (btn) {
        btn.addEventListener("click", () => {
          const el = elements[key] as HTMLInputElement;
          el.value = generateSeed();
          el.focus();
          el.select();
          doRenderWithResult();
        });
      }
    }
  }

  // Bind change events to all inputs
  for (const [key, field] of Object.entries(schema)) {
    const el = elements[key];
    if (Array.isArray(el)) {
      for (const radio of el) {
        radio.addEventListener("change", doRenderWithResult);
      }
    } else {
      el.addEventListener("change", doRenderWithResult);
      // For text inputs, also listen to input event
      if (field.type === "string") {
        el.addEventListener("input", doRenderWithResult);
      }
    }
  }

  // Initial render
  syncDynamicConstraints(currentParams);
  syncGroupVisibility(currentParams);
  doRenderWithResult();

  return {
    getParams: () => currentParams,
    setParams: (params: Partial<InferParams<S>>) => {
      currentParams = coerce({ ...currentParams, ...params });
      writeToUI(currentParams);
    },
    render: doRenderWithResult,
  };
}

function buildHTML<S extends Schema>(
  schema: S,
  title: string,
  defaults: InferParams<S>,
  groups: Record<string, GroupConfig>
): string {
  // Separate fields by group
  const ungrouped: [string, FieldDef][] = [];
  const grouped: Record<string, [string, FieldDef][]> = {};

  for (const [key, field] of Object.entries(schema)) {
    if (field.group) {
      if (!grouped[field.group]) grouped[field.group] = [];
      grouped[field.group].push([key, field]);
    } else {
      ungrouped.push([key, field]);
    }
  }

  // Find enum fields with radio display for mode-like controls at top
  const modeFields = ungrouped.filter(
    ([, f]) => f.type === "enum" && f.display === "radio"
  );
  const regularFields = ungrouped.filter(
    ([, f]) => !(f.type === "enum" && f.display === "radio")
  );

  let html = `
    <div style="display:flex; gap:24px; align-items:flex-start; font-family: system-ui; padding: 16px;">
      <div style="width: 360px;">
        <h2 style="margin:0 0 12px 0;">${title}</h2>
  `;

  // Render mode-like radio fields at top
  for (const [key, field] of modeFields) {
    html += buildRadioGroup(
      key,
      field as Extract<FieldDef, { type: "enum" }>,
      defaults
    );
  }

  // Render regular ungrouped fields
  html += `<div style="display:grid; grid-template-columns: 1fr 120px; gap: 10px; align-items:center;">`;
  for (const [key, field] of regularFields) {
    html += buildField(key, field, defaults);
  }
  html += `</div>`;

  // Render grouped fields
  for (const [groupName, fields] of Object.entries(grouped)) {
    const groupConfig = groups[groupName] || { label: groupName };
    const descriptionHtml = groupConfig.description
      ? `<div style="font-size: 12px; color: #555; margin-top: 8px;">${groupConfig.description}</div>`
      : "";
    html += `
      <div data-group="${groupName}" style="margin-top: 14px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="font-weight: 600; margin-bottom: 8px;">${groupConfig.label}</div>
        <div style="display:grid; grid-template-columns: 1fr 120px; gap: 10px; align-items:center;">
    `;
    for (const [key, field] of fields) {
      html += buildField(key, field, defaults);
    }
    html += `
        </div>
        ${descriptionHtml}
      </div>
    `;
  }

  // Action buttons
  html += `
      <div style="display:flex; gap:10px; margin-top: 14px;">
        <button id="download">Download SVG</button>
      </div>

      <div style="display:flex; gap:10px; margin-top: 10px;">
        <button id="exportParams">Export Params</button>
        <button id="importParams">Import Params</button>
        <input id="paramsFile" type="file" accept="application/json" style="display:none;" />
      </div>

      <p id="status" style="min-height: 1.2em; color:#555;"></p>
    </div>

    <div style="flex:1;">
      <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
        <div style="font-weight:600;">Preview</div>
      </div>
      <div id="preview" style="border:1px solid #ddd; padding:8px; border-radius: 8px; overflow:auto;"></div>
    </div>
  </div>
  `;

  return html;
}

function buildRadioGroup<S extends Schema>(
  key: string,
  field: Extract<FieldDef, { type: "enum" }>,
  defaults: InferParams<S>
): string {
  const defaultValue = defaults[key as keyof typeof defaults];
  let html = `<div style="display:flex; gap:8px; margin-bottom: 12px;">`;
  for (const option of field.options) {
    const checked = option === defaultValue ? "checked" : "";
    const label =
      option.charAt(0).toUpperCase() + option.slice(1).toLowerCase();
    html += `
      <label style="display:flex; gap:6px; align-items:center;">
        <input type="radio" name="${key}" value="${option}" ${checked} />
        ${label}
      </label>
    `;
  }
  html += `</div>`;
  return html;
}

function buildField<S extends Schema>(
  key: string,
  field: FieldDef,
  defaults: InferParams<S>
): string {
  const defaultValue = defaults[key as keyof typeof defaults];
  const label = field.label || key;

  switch (field.type) {
    case "string": {
      let labelHtml = label;
      if (field.randomize) {
        labelHtml = `
          <label style="display:flex; align-items:center; gap:6px;">
            ${label}
            <button
              id="randomize-${key}"
              type="button"
              aria-label="Randomize ${label}"
              title="Randomize ${label}"
              style="width:28px; height:28px; padding:0; line-height:1;"
            >
              🎲
            </button>
          </label>
        `;
        return `
          ${labelHtml}
          <input id="${key}" type="text" value="${defaultValue}" />
        `;
      }
      return `
        <label>${label}</label>
        <input id="${key}" type="text" value="${defaultValue}" />
      `;
    }

    case "int": {
      const min = typeof field.min === "number" ? `min="${field.min}"` : "";
      const max = typeof field.max === "number" ? `max="${field.max}"` : "";
      const step = field.step ?? 1;
      return `
        <label>${label}</label>
        <input id="${key}" type="number" ${min} ${max} step="${step}" value="${defaultValue}" />
      `;
    }

    case "float": {
      const min = typeof field.min === "number" ? `min="${field.min}"` : "";
      const max = typeof field.max === "number" ? `max="${field.max}"` : "";
      const step = field.step ?? 0.1;
      return `
        <label>${label}</label>
        <input id="${key}" type="number" ${min} ${max} step="${step}" value="${defaultValue}" />
      `;
    }

    case "boolean": {
      const checked = defaultValue ? "checked" : "";
      return `
        <label>${label}</label>
        <input id="${key}" type="checkbox" ${checked} />
      `;
    }

    case "enum": {
      if (field.display === "select") {
        let options = "";
        for (const opt of field.options) {
          const selected = opt === defaultValue ? "selected" : "";
          options += `<option value="${opt}" ${selected}>${opt}</option>`;
        }
        return `
          <label>${label}</label>
          <select id="${key}">${options}</select>
        `;
      }
      // Radio handled separately at top level
      return "";
    }

    default:
      return "";
  }
}
