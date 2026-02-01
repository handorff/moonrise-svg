/**
 * Schema types for declarative parameter definitions.
 */

/** Reference to another field's value for dynamic constraints */
export type FieldRef = { ref: string };

/** Base properties shared by all field types */
type BaseField = {
  label?: string;
  group?: string;
};

/** String field definition */
export type StringField = BaseField & {
  type: "string";
  default: string;
  randomize?: boolean;
};

/** Integer field definition */
export type IntField = BaseField & {
  type: "int";
  default: number;
  min?: number | FieldRef;
  max?: number | FieldRef;
  step?: number;
};

/** Float field definition */
export type FloatField = BaseField & {
  type: "float";
  default: number;
  min?: number | FieldRef;
  max?: number | FieldRef;
  step?: number;
};

/** Enum field definition */
export type EnumField<T extends readonly string[] = readonly string[]> =
  BaseField & {
    type: "enum";
    options: T;
    default: T[number];
    display?: "radio" | "select";
  };

/** Boolean field definition */
export type BooleanField = BaseField & {
  type: "boolean";
  default: boolean;
};

/** Union of all field types */
export type FieldDef =
  | StringField
  | IntField
  | FloatField
  | EnumField
  | BooleanField;

/** Schema is a record of field definitions */
export type Schema = Record<string, FieldDef>;

/** Infer the TypeScript type for a single field */
type InferFieldType<F extends FieldDef> = F extends StringField
  ? string
  : F extends IntField
    ? number
    : F extends FloatField
      ? number
      : F extends BooleanField
        ? boolean
        : F extends EnumField<infer T>
          ? T[number]
          : never;

/** Infer the Params type from a schema */
export type InferParams<S extends Schema> = {
  [K in keyof S]: InferFieldType<S[K]>;
};

/**
 * Helper function for defining a schema with proper type inference.
 * This is an identity function that helps TypeScript infer the exact types.
 */
export function defineSchema<S extends Schema>(schema: S): S {
  return schema;
}
