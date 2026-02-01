/**
 * param-lib: Schema-driven parameter library
 *
 * Define parameter schemas declaratively and get:
 * - TypeScript types inferred automatically
 * - Coercion/validation logic generated
 * - UI components generated
 */

export { defineSchema } from "./types";
export type { InferParams, Schema, FieldDef, FieldRef } from "./types";

export { createCoercer, getDefaults } from "./coerce";

export { createParamUI } from "./ui";
export type { ParamUI, ParamUIConfig, GroupConfig } from "./ui";

export { generateSeed, clampInt, clampFloat } from "./utils";
