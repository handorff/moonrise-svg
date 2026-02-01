import paper from "paper";

export function makeTranslatedTruncatedCurve(
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

export function circleCenters(
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
  const xs = Array.from(
    { length: numCircles },
    (_, i) => MARGIN + (i * w) / (numCircles - 1)
  );

  const yBottom = HEIGHT - CIRCLE_RADIUS;
  const yTop = CIRCLE_RADIUS;

  return xs.map((x) => {
    const t = x / WIDTH;
    const e = 1 - Math.sqrt(t);
    const y = yTop + e * (yBottom - yTop);
    return { x, y };
  });
}
