import type { FieldDef, FieldRef, InferParams, Schema } from "./types";
import { clampFloat, clampInt, resolveRef } from "./utils";

/**
 * Extract default values from a schema.
 */
export function getDefaults<S extends Schema>(schema: S): InferParams<S> {
  const defaults = {} as Record<string, unknown>;
  for (const [key, field] of Object.entries(schema)) {
    defaults[key] = field.default;
  }
  return defaults as InferParams<S>;
}

/**
 * Create a coercion function for a schema.
 * The returned function validates and normalizes partial params.
 */
export function createCoercer<S extends Schema>(
  schema: S
): (partial: Partial<InferParams<S>>) => InferParams<S> {
  const defaults = getDefaults(schema);

  return (partial: Partial<InferParams<S>>): InferParams<S> => {
    const result = { ...defaults } as Record<string, unknown>;

    // First pass: coerce all fields that don't have ref dependencies
    for (const [key, field] of Object.entries(schema)) {
      const rawValue = partial[key as keyof typeof partial];
      result[key] = coerceField(field, rawValue, schema, result);
    }

    // Second pass: re-coerce fields with ref dependencies now that all values are available
    for (const [key, field] of Object.entries(schema)) {
      if (hasRefDependency(field)) {
        const rawValue = partial[key as keyof typeof partial];
        result[key] = coerceField(field, rawValue, schema, result);
      }
    }

    return result as InferParams<S>;
  };
}

function hasRefDependency(field: FieldDef): boolean {
  if (field.type === "int" || field.type === "float") {
    return isFieldRef(field.min) || isFieldRef(field.max);
  }
  return false;
}

function isFieldRef(value: unknown): value is FieldRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "ref" in value &&
    typeof (value as FieldRef).ref === "string"
  );
}

function coerceField(
  field: FieldDef,
  rawValue: unknown,
  schema: Schema,
  currentParams: Record<string, unknown>
): unknown {
  switch (field.type) {
    case "string": {
      if (rawValue === undefined || rawValue === null) {
        return field.default;
      }
      return String(rawValue);
    }

    case "int": {
      const num = Number(rawValue ?? field.default);
      const min = resolveRef(schema, currentParams, field.min ?? -Infinity);
      const max = resolveRef(schema, currentParams, field.max ?? Infinity);
      return clampInt(num, min, max);
    }

    case "float": {
      const num = Number(rawValue ?? field.default);
      const min = resolveRef(schema, currentParams, field.min ?? -Infinity);
      const max = resolveRef(schema, currentParams, field.max ?? Infinity);
      return clampFloat(num, min, max);
    }

    case "boolean": {
      if (rawValue === undefined || rawValue === null) {
        return field.default;
      }
      return Boolean(rawValue);
    }

    case "enum": {
      const value = rawValue ?? field.default;
      if (field.options.includes(value as string)) {
        return value;
      }
      return field.default;
    }

    default:
      return (field as FieldDef).default;
  }
}
