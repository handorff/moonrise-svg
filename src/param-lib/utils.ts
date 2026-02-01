import type { FieldRef, Schema } from "./types";

/**
 * Clamp a number to an integer range.
 */
export function clampInt(n: number, min: number, max: number): number {
  n = Math.round(n);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

/**
 * Clamp a number to a float range.
 */
export function clampFloat(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

/**
 * Generate a random alphanumeric seed string.
 */
export function generateSeed(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(
      values,
      (value) => alphabet[value % alphabet.length]
    ).join("");
  }
  return Array.from({ length }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

/**
 * Check if a value is a field reference.
 */
export function isFieldRef(value: unknown): value is FieldRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "ref" in value &&
    typeof (value as FieldRef).ref === "string"
  );
}

/**
 * Resolve a field reference or return the value directly.
 */
export function resolveRef<T>(
  schema: Schema,
  params: Record<string, unknown>,
  refOrValue: T | FieldRef
): T {
  if (isFieldRef(refOrValue)) {
    const fieldName = refOrValue.ref;
    if (fieldName in params) {
      return params[fieldName] as T;
    }
    // Fall back to schema default if param not yet resolved
    const field = schema[fieldName];
    if (field && "default" in field) {
      return field.default as T;
    }
  }
  return refOrValue as T;
}
