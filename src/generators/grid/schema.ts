import { defineSchema, type InferParams } from "../../param-lib";

export const schema = defineSchema({
  seed: { type: "string", default: "grid", label: "Seed", randomize: true },
  width: { type: "float", default: 600, min: 50, max: 5000, step: 1 },
  height: { type: "float", default: 400, min: 50, max: 5000, step: 1 },
  columns: { type: "int", default: 12, min: 1, max: 200 },
  rows: { type: "int", default: 8, min: 1, max: 200 },
  jitter: { type: "float", default: 4, min: 0, max: 100, step: 0.1 },
  strokeWidth: { type: "float", default: 1.5, min: 0.1, max: 10, step: 0.1 },
});

export type Params = InferParams<typeof schema>;
