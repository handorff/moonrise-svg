import paper from "paper";
import type { Params } from "./schema";
import { seededRandom } from "../../random";

function jittered(
  value: number,
  amount: number,
  rand: () => number
): number {
  return value + (rand() - 0.5) * 2 * amount;
}

export function renderSvg(params: Params): string {
  const canvas = document.createElement("canvas");
  paper.setup(canvas);
  paper.view.viewSize = new paper.Size(params.width, params.height);

  const rand = seededRandom(params.seed);
  const cellWidth = params.width / params.columns;
  const cellHeight = params.height / params.rows;

  for (let c = 0; c <= params.columns; c += 1) {
    const x = jittered(c * cellWidth, params.jitter, rand);
    const line = new paper.Path.Line(
      new paper.Point(x, 0),
      new paper.Point(x, params.height)
    );
    line.strokeColor = new paper.Color("black");
    line.strokeWidth = params.strokeWidth;
  }

  for (let r = 0; r <= params.rows; r += 1) {
    const y = jittered(r * cellHeight, params.jitter, rand);
    const line = new paper.Path.Line(
      new paper.Point(0, y),
      new paper.Point(params.width, y)
    );
    line.strokeColor = new paper.Color("black");
    line.strokeWidth = params.strokeWidth;
  }

  const svg = paper.project.exportSVG({ asString: true });
  paper.project.clear();
  return String(svg);
}
