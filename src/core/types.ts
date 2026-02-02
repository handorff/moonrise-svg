import type { ParamUIConfig, Schema } from "../param-lib";

type GeneratorUIConfig = Pick<ParamUIConfig, "title" | "groups">;

export type Generator = {
  id: string;
  name: string;
  description?: string;
  schema: Schema;
  render: (params: Record<string, unknown>) => string;
  ui?: GeneratorUIConfig;
};
