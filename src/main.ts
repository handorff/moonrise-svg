import paper from "paper";

type Mode = "preview" | "export";

type Params = {
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

const DEFAULTS: Params = {
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

function clampInt(n: number, min: number, max: number) {
  n = Math.round(n);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

function coerceParams(partial: Partial<Params>): Params {
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

function renderSvg(params: Params): string {
  // "World" dimensions (always used to generate the artwork)
  const WIDTH = params.totalWidth;
  const HEIGHT = params.totalHeight;

  const NUM_CIRCLES = params.panels;
  const CIRCLE_RADIUS = params.circleRadius;
  const RECT_WIDTH = params.panelWidth;

  const f = (x: number) => {
    const t = x / WIDTH;
    const e = Math.sqrt(t);
    return HEIGHT - CIRCLE_RADIUS + (2 * CIRCLE_RADIUS - HEIGHT) * e;
  };

  // To keep panel rectangles inside the border, place centers from [RECT_WIDTH/2 .. WIDTH-RECT_WIDTH/2]
  const MARGIN = RECT_WIDTH / 2;

  if (params.mode === "export") {
    return renderExportSvg({
      WIDTH,
      HEIGHT,
      NUM_CIRCLES,
      CIRCLE_RADIUS,
      MARGIN,
      f,
      params,
    });
  }

  const canvas = document.createElement("canvas");
  paper.setup(canvas);
  paper.view.viewSize = new paper.Size(WIDTH, HEIGHT);

  // ----- border (debug / optional) -----
  const border = new paper.Path.Rectangle(
    new paper.Point(0, 0),
    new paper.Point(WIDTH, HEIGHT)
  );
  border.strokeWidth = 2;
  border.strokeColor = new paper.Color("blue");

  // ----- random curves -----
  const randomPoints = getRandomPoints(params.points, params.seed, WIDTH, HEIGHT);
  const paths = randomPoints.map((pt) => makeTranslatedTruncatedCurve(pt, f, WIDTH, { steps: 120 }));

  // ----- circles + panel rects -----
  const centers = circleCenters(NUM_CIRCLES, WIDTH, HEIGHT, MARGIN, CIRCLE_RADIUS);

  const circles = centers.map(({ x, y }) => {
    const c = new paper.Path.Circle(new paper.Point(x, y), CIRCLE_RADIUS);
    c.strokeColor = new paper.Color("blue");
    c.strokeWidth = 2;
    return c;
  });

  centers.map(({ x }) => {
    const r = new paper.Path.Rectangle(
      new paper.Point(x - RECT_WIDTH / 2, 0),
      new paper.Point(x + RECT_WIDTH / 2, HEIGHT)
    );
    r.strokeWidth = 2;
    r.strokeColor = new paper.Color("red");
    return r;
  });

  // ----- intersections (this creates new items in the project) -----
  for (const c of circles) {
    for (const p of paths) {
      // Boolean intersect result is added to the scene; keep it, remove originals later
      p.intersect(c, { trace: false });
    }
  }

  // Remove originals (as in notebook)
  paths.forEach((p) => p.remove());
  circles.forEach((c) => c.remove());

  const svg = paper.project.exportSVG({ asString: true });
  paper.project.clear();
  return String(svg);
}

function renderExportSvg({
  WIDTH,
  HEIGHT,
  NUM_CIRCLES,
  CIRCLE_RADIUS,
  MARGIN,
  f,
  params,
}: {
  WIDTH: number;
  HEIGHT: number;
  NUM_CIRCLES: number;
  CIRCLE_RADIUS: number;
  MARGIN: number;
  f: (x: number) => number;
  params: Params;
}): string {
  const canvas = document.createElement("canvas");
  paper.setup(canvas);

  const squareSize = CIRCLE_RADIUS * 2;
  paper.view.viewSize = new paper.Size(squareSize, squareSize);

  const randomPoints = getRandomPoints(params.points, params.seed, WIDTH, HEIGHT);
  const paths = randomPoints.map((pt) => makeTranslatedTruncatedCurve(pt, f, WIDTH, { steps: 120 }));

  const centers = circleCenters(NUM_CIRCLES, WIDTH, HEIGHT, MARGIN, CIRCLE_RADIUS);
  const panelIndex = Math.max(1, Math.min(params.exportPanel, params.panels)) - 1;
  const panelCenter = centers[panelIndex] ?? centers[0];

  const circle = new paper.Path.Circle(new paper.Point(panelCenter.x, panelCenter.y), CIRCLE_RADIUS);
  const circlePaths = paths.map((p) => p.intersect(circle, { trace: false }));
  circlePaths.forEach((p) =>
    p.translate(new paper.Point(-panelCenter.x + CIRCLE_RADIUS, -panelCenter.y + CIRCLE_RADIUS))
  );

  const boundingSquare = new paper.Path.Rectangle(
    new paper.Point(0, 0),
    new paper.Size(squareSize, squareSize)
  );
  boundingSquare.strokeWidth = 2;
  boundingSquare.strokeColor = new paper.Color("blue");

  paths.forEach((p) => p.remove());
  circle.remove();

  const svg = paper.project.exportSVG({ asString: true });
  paper.project.clear();
  return String(svg);
}

function makeTranslatedTruncatedCurve(
  pt: { x: number; y: number },
  f: (x: number) => number,
  WIDTH: number,
  { steps = 120 }: { steps?: number } = {}
) {
  const { x, y } = pt;
  const shift = y - f(x);

  const path = new paper.Path({
    strokeColor: new paper.Color("black"),
    strokeWidth: 0.5,
  });

  for (let i = 0; i <= steps; i++) {
    const xi = x * (i / steps);
    const yi = f(xi) + shift;
    path.add(new paper.Point(xi, yi));
  }

  path.lastSegment.point = new paper.Point(x, f(x) + shift);
  return path;
}

function circleCenters(
  numCircles: number,
  WIDTH: number,
  HEIGHT: number,
  MARGIN: number,
  CIRCLE_RADIUS: number
) {
  if (numCircles <= 1) {
    const x = WIDTH / 2;
    const y = HEIGHT - CIRCLE_RADIUS;
    return [{ x, y }];
  }

  const w = WIDTH - MARGIN * 2;
  const xs = Array.from({ length: numCircles }, (_, i) => MARGIN + (i * w) / (numCircles - 1));

  const yBottom = HEIGHT - CIRCLE_RADIUS;
  const yTop = CIRCLE_RADIUS;

  return xs.map((x) => {
    const t = x / WIDTH;
    const e = 1 - Math.sqrt(t);
    const y = yTop + e * (yBottom - yTop);
    return { x, y };
  });
}

function getRandomPoints(numPoints: number, seed: string, WIDTH: number, HEIGHT: number) {
  const rand = seededRandom(seed);
  return Array.from({ length: numPoints }, () => ({
    x: rand() * WIDTH,
    y: rand() * HEIGHT,
  }));
}

function seededRandom(seed: string) {
  const seedStr = String(seed);
  const seedFn = xmur3(seedStr);
  return mulberry32(seedFn());
}

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


// ---------- UI ----------
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
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

const els = {
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

let lastSvg = "";
let lastParams: Params = DEFAULTS;

function readParamsFromUI(): Params {
  const mode = (els.modeRadios.find((r) => r.checked)?.value ?? "preview") as Mode;

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

function applyParamsToUI(params: Params) {
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

  syncExportControls(params);
}

function syncExportControls(params: Params) {
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

async function doRender() {
  els.status.textContent = "Rendering…";
  const params = readParamsFromUI();
  lastParams = params;

  syncExportControls(params);

  // placeholder render only (no async)
  lastSvg = renderSvg(params);
  els.preview.innerHTML = lastSvg;

  els.status.textContent = "Done.";
}

function generateSeed(length = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
  }
  return Array.from({ length }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
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
  const params = readParamsFromUI();
  const payload = JSON.stringify(params, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
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
  applyParamsToUI(nextParams);
  lastParams = nextParams;
  void doRender();
}

els.render.addEventListener("click", () => void doRender());
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
  void doRender();
});

// re-render on input change (optional but nice)
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
  input.addEventListener("change", () => void doRender());
}

for (const r of els.modeRadios) {
  r.addEventListener("change", () => void doRender());
}

els.seed.addEventListener("input", () => void doRender());

// initial render
syncExportControls(DEFAULTS);
void doRender();
