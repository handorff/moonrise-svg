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

export function seededRandom(seed: string) {
  const seedStr = String(seed);
  const seedFn = xmur3(seedStr);
  return mulberry32(seedFn());
}

export function getRandomPoints(
  numPoints: number,
  seed: string,
  WIDTH: number,
  HEIGHT: number
) {
  const rand = seededRandom(seed);
  return Array.from({ length: numPoints }, () => ({
    x: rand() * WIDTH,
    y: rand() * HEIGHT,
  }));
}
