import paper from "paper";
import type { Params } from "./types";
import { getRandomPoints } from "./random";
import { makeTranslatedTruncatedCurve, circleCenters } from "./geometry";

export function renderSvg(params: Params): string {
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
  const randomPoints = getRandomPoints(
    params.points,
    params.seed,
    WIDTH,
    HEIGHT
  );
  const paths = randomPoints.map((pt) =>
    makeTranslatedTruncatedCurve(pt, f, WIDTH, { steps: 120 })
  );

  // ----- circles + panel rects -----
  const centers = circleCenters(
    NUM_CIRCLES,
    WIDTH,
    HEIGHT,
    MARGIN,
    CIRCLE_RADIUS
  );

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

  const randomPoints = getRandomPoints(
    params.points,
    params.seed,
    WIDTH,
    HEIGHT
  );
  const paths = randomPoints.map((pt) =>
    makeTranslatedTruncatedCurve(pt, f, WIDTH, { steps: 120 })
  );

  const centers = circleCenters(
    NUM_CIRCLES,
    WIDTH,
    HEIGHT,
    MARGIN,
    CIRCLE_RADIUS
  );
  const panelIndex =
    Math.max(1, Math.min(params.exportPanel, params.panels)) - 1;
  const panelCenter = centers[panelIndex] ?? centers[0];

  const circle = new paper.Path.Circle(
    new paper.Point(panelCenter.x, panelCenter.y),
    CIRCLE_RADIUS
  );
  const circlePaths = paths.map((p) => p.intersect(circle, { trace: false }));
  circlePaths.forEach((p) =>
    p.translate(
      new paper.Point(
        -panelCenter.x + CIRCLE_RADIUS,
        -panelCenter.y + CIRCLE_RADIUS
      )
    )
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
