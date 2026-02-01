import { DEFAULTS, type Mode, type Params } from "./types";
import { coerceParams } from "./params";
import { renderSvg } from "./render";

const HTML_TEMPLATE = `
  <div style="display:flex; gap:24px; align-items:flex-start; font-family: system-ui; padding: 16px;">
    <div style="width: 360px;">
      <h2 style="margin:0 0 12px 0;">Moonrise SVG</h2>

      <div style="display:flex; gap:8px; margin-bottom: 12px;">
        <label style="display:flex; gap:6px; align-items:center;">
          <input type="radio" name="mode" value="preview" checked />
          Preview
        </label>
        <label style="display:flex; gap:6px; align-items:center;">
          <input type="radio" name="mode" value="export" />
          Export
        </label>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 120px; gap: 10px; align-items:center;">
        <label style="display:flex; align-items:center; gap:6px;">
          Seed
          <button
            id="randomSeed"
            type="button"
            aria-label="Randomize seed"
            title="Randomize seed"
            style="width:28px; height:28px; padding:0; line-height:1;"
          >
            🎲
          </button>
        </label>
        <input id="seed" type="text" value="${DEFAULTS.seed}" />

        <label>Points</label>
        <input id="points" type="number" min="1" step="1" value="${DEFAULTS.points}" />

        <label>Panels</label>
        <input id="panels" type="number" min="1" step="1" value="${DEFAULTS.panels}" />

        <label>Circle radius</label>
        <input id="circleRadius" type="number" step="0.1" value="${DEFAULTS.circleRadius}" />

        <label>Panel width</label>
        <input id="panelWidth" type="number" step="0.1" value="${DEFAULTS.panelWidth}" />

        <label>Total height</label>
        <input id="totalHeight" type="number" step="0.1" value="${DEFAULTS.totalHeight}" />

        <label>Total width</label>
        <input id="totalWidth" type="number" step="0.1" value="${DEFAULTS.totalWidth}" />
      </div>

      <div id="exportControls" style="margin-top: 14px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="font-weight: 600; margin-bottom: 8px;">Export</div>
        <div style="display:grid; grid-template-columns: 1fr 120px; gap: 10px; align-items:center;">
          <label>Panel #</label>
          <input id="exportPanel" type="number" min="1" step="1" value="${DEFAULTS.exportPanel}" />
        </div>
        <div style="font-size: 12px; color: #555; margin-top: 8px;">
          In export mode, the SVG will contain only the selected panel.
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top: 14px;">
        <button id="render">Render</button>
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

type Elements = {
  seed: HTMLInputElement;
  points: HTMLInputElement;
  panels: HTMLInputElement;
  circleRadius: HTMLInputElement;
  panelWidth: HTMLInputElement;
  totalHeight: HTMLInputElement;
  totalWidth: HTMLInputElement;
  exportPanel: HTMLInputElement;
  exportControls: HTMLDivElement;
  preview: HTMLDivElement;
  status: HTMLParagraphElement;
  render: HTMLButtonElement;
  download: HTMLButtonElement;
  exportParams: HTMLButtonElement;
  importParams: HTMLButtonElement;
  paramsFile: HTMLInputElement;
  randomSeed: HTMLButtonElement;
  modeRadios: HTMLInputElement[];
};

function getElements(): Elements {
  return {
    seed: document.querySelector<HTMLInputElement>("#seed")!,
    points: document.querySelector<HTMLInputElement>("#points")!,
    panels: document.querySelector<HTMLInputElement>("#panels")!,
    circleRadius: document.querySelector<HTMLInputElement>("#circleRadius")!,
    panelWidth: document.querySelector<HTMLInputElement>("#panelWidth")!,
    totalHeight: document.querySelector<HTMLInputElement>("#totalHeight")!,
    totalWidth: document.querySelector<HTMLInputElement>("#totalWidth")!,
    exportPanel: document.querySelector<HTMLInputElement>("#exportPanel")!,
    exportControls: document.querySelector<HTMLDivElement>("#exportControls")!,
    preview: document.querySelector<HTMLDivElement>("#preview")!,
    status: document.querySelector<HTMLParagraphElement>("#status")!,
    render: document.querySelector<HTMLButtonElement>("#render")!,
    download: document.querySelector<HTMLButtonElement>("#download")!,
    exportParams: document.querySelector<HTMLButtonElement>("#exportParams")!,
    importParams: document.querySelector<HTMLButtonElement>("#importParams")!,
    paramsFile: document.querySelector<HTMLInputElement>("#paramsFile")!,
    randomSeed: document.querySelector<HTMLButtonElement>("#randomSeed")!,
    modeRadios: Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="mode"]')
    ),
  };
}

function readParamsFromUI(els: Elements): Params {
  const mode = (els.modeRadios.find((r) => r.checked)?.value ??
    "preview") as Mode;

  return coerceParams({
    seed: els.seed.value,
    points: Number(els.points.value),
    panels: Number(els.panels.value),
    circleRadius: Number(els.circleRadius.value),
    panelWidth: Number(els.panelWidth.value),
    totalHeight: Number(els.totalHeight.value),
    totalWidth: Number(els.totalWidth.value),
    mode,
    exportPanel: Number(els.exportPanel.value),
  });
}

function applyParamsToUI(els: Elements, params: Params) {
  els.seed.value = params.seed;
  els.points.value = String(params.points);
  els.panels.value = String(params.panels);
  els.circleRadius.value = String(params.circleRadius);
  els.panelWidth.value = String(params.panelWidth);
  els.totalHeight.value = String(params.totalHeight);
  els.totalWidth.value = String(params.totalWidth);
  els.exportPanel.value = String(params.exportPanel);

  for (const radio of els.modeRadios) {
    radio.checked = radio.value === params.mode;
  }

  syncExportControls(els, params);
}

function syncExportControls(els: Elements, params: Params) {
  const isExport = params.mode === "export";
  els.exportControls.style.opacity = isExport ? "1" : "0.5";
  els.exportPanel.disabled = !isExport;

  // Keep export panel range in sync with panels
  els.exportPanel.min = "1";
  els.exportPanel.max = String(params.panels);
  if (Number(els.exportPanel.value) > params.panels) {
    els.exportPanel.value = String(params.panels);
  }
}

function generateSeed(length = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
      ""
    );
  }
  return Array.from({ length }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

export function initUI() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = HTML_TEMPLATE;

  const els = getElements();

  let lastSvg = "";
  let lastParams: Params = DEFAULTS;

  function doRender() {
    els.status.textContent = "Rendering…";
    const params = readParamsFromUI(els);
    lastParams = params;

    syncExportControls(els, params);

    lastSvg = renderSvg(params);
    els.preview.innerHTML = lastSvg;

    els.status.textContent = "Done.";
  }

  function downloadSvg() {
    if (!lastSvg) return;

    const suffix =
      lastParams.mode === "export"
        ? `panel-${lastParams.exportPanel}-of-${lastParams.panels}`
        : `preview-${lastParams.panels}-panels`;

    const blob = new Blob([lastSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `moonrise-${suffix}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function downloadParams() {
    const params = readParamsFromUI(els);
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

  async function importParamsFromFile(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<Params>;
    const nextParams = coerceParams(parsed);
    applyParamsToUI(els, nextParams);
    lastParams = nextParams;
    doRender();
  }

  // Event listeners
  els.render.addEventListener("click", () => doRender());
  els.download.addEventListener("click", () => downloadSvg());
  els.exportParams.addEventListener("click", () => downloadParams());
  els.importParams.addEventListener("click", () => els.paramsFile.click());
  els.paramsFile.addEventListener("change", async () => {
    const file = els.paramsFile.files?.[0];
    if (!file) return;
    try {
      await importParamsFromFile(file);
      els.status.textContent = "Params imported.";
    } catch (error) {
      console.error(error);
      els.status.textContent = "Unable to import params JSON.";
    } finally {
      els.paramsFile.value = "";
    }
  });
  els.randomSeed.addEventListener("click", () => {
    els.seed.value = generateSeed();
    els.seed.focus();
    els.seed.select();
    doRender();
  });

  // Re-render on input change
  for (const input of [
    els.seed,
    els.points,
    els.panels,
    els.circleRadius,
    els.panelWidth,
    els.totalHeight,
    els.totalWidth,
    els.exportPanel,
  ]) {
    input.addEventListener("change", () => doRender());
  }

  for (const r of els.modeRadios) {
    r.addEventListener("change", () => doRender());
  }

  els.seed.addEventListener("input", () => doRender());

  // Initial render
  syncExportControls(els, DEFAULTS);
  doRender();
}
