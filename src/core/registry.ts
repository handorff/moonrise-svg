import type { Generator } from "./types";
import { grid } from "../generators/grid";
import { moonrise } from "../generators/moonrise";

export const generators: Generator[] = [moonrise, grid];

export function getGeneratorById(id: string): Generator | undefined {
  return generators.find((generator) => generator.id === id);
}
