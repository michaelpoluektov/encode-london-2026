import { z } from "zod";

const finiteNumberSchema = z.number().finite();

export const SUPPORTED_GLSL_TYPES = [
  "bool",
  "float",
  "int",
  "vec2",
  "vec3",
  "vec4",
] as const;

export const glslValueTypeSchema = z.enum(SUPPORTED_GLSL_TYPES);

export type GlslValueType = z.infer<typeof glslValueTypeSchema>;

export const vec2ValueSchema = z
  .object({
    x: finiteNumberSchema,
    y: finiteNumberSchema,
  })
  .strict();

export const vec3ValueSchema = z
  .object({
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    z: finiteNumberSchema,
  })
  .strict();

export const vec4ValueSchema = z
  .object({
    w: finiteNumberSchema,
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    z: finiteNumberSchema,
  })
  .strict();

export type Vec2Value = z.infer<typeof vec2ValueSchema>;
export type Vec3Value = z.infer<typeof vec3ValueSchema>;
export type Vec4Value = z.infer<typeof vec4ValueSchema>;

export type GlslValue = boolean | number | Vec2Value | Vec3Value | Vec4Value;

export const glslValueSchema = z.union([
  z.boolean(),
  finiteNumberSchema,
  vec2ValueSchema,
  vec3ValueSchema,
  vec4ValueSchema,
]);

const glslValueSchemaByType = {
  bool: z.boolean(),
  float: finiteNumberSchema,
  int: z.number().int(),
  vec2: vec2ValueSchema,
  vec3: vec3ValueSchema,
  vec4: vec4ValueSchema,
} satisfies Record<GlslValueType, z.ZodType<GlslValue>>;

const checkboxUniformEditorSchema = z
  .object({
    kind: z.literal("checkbox"),
  })
  .strict();

const colorUniformEditorSchema = z
  .object({
    kind: z.literal("color"),
  })
  .strict();

const numberUniformEditorSchema = z
  .object({
    kind: z.literal("number"),
  })
  .strict();

const sliderUniformEditorSchema = z
  .object({
    kind: z.literal("slider"),
    max: finiteNumberSchema,
    min: finiteNumberSchema,
  })
  .strict();

const vectorUniformEditorSchema = z
  .object({
    kind: z.literal("vector"),
  })
  .strict();

export const uniformEditorSchema = z.discriminatedUnion("kind", [
  checkboxUniformEditorSchema,
  colorUniformEditorSchema,
  numberUniformEditorSchema,
  sliderUniformEditorSchema,
  vectorUniformEditorSchema,
]);

export type UniformEditorDefinition = z.infer<typeof uniformEditorSchema>;
export type ValidatedUniformEditor = UniformEditorDefinition;

const isObjectValue = (
  value: GlslValue,
): value is Vec2Value | Vec3Value | Vec4Value =>
  typeof value === "object" && value !== null;

export const cloneGlslValue = <Value extends GlslValue>(
  value: Value,
): Value => {
  if (!isObjectValue(value)) {
    return value;
  }

  const clonedValue = {
    ...value,
  } as Vec2Value | Vec3Value | Vec4Value;

  return clonedValue as Value;
};

export const isGlslValueOfType = (
  valueType: GlslValueType,
  value: unknown,
): value is GlslValue =>
  glslValueSchemaByType[valueType].safeParse(value).success;

export const parseGlslValueOfType = (
  valueType: GlslValueType,
  value: unknown,
) => glslValueSchemaByType[valueType].safeParse(value);

export const areGlslValuesEqual = (
  left: GlslValue,
  right: GlslValue,
): boolean => {
  if (typeof left !== typeof right) {
    return false;
  }

  if (!isObjectValue(left) || !isObjectValue(right)) {
    return left === right;
  }

  return JSON.stringify(left) === JSON.stringify(right);
};

export const formatGlslValue = (
  value: GlslValue,
  valueType: GlslValueType,
): string => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toString();
  }

  switch (valueType) {
    case "vec2":
      return `vec2(${(value as Vec2Value).x}, ${(value as Vec2Value).y})`;
    case "vec3":
      return `vec3(${(value as Vec3Value).x}, ${(value as Vec3Value).y}, ${(value as Vec3Value).z})`;
    case "vec4":
      return `vec4(${(value as Vec4Value).x}, ${(value as Vec4Value).y}, ${(value as Vec4Value).z}, ${(value as Vec4Value).w})`;
    case "bool":
    case "float":
    case "int":
      return JSON.stringify(value);
  }
};

export const getDefaultUniformEditor = (
  valueType: GlslValueType,
): ValidatedUniformEditor => {
  switch (valueType) {
    case "bool":
      return { kind: "checkbox" };
    case "float":
    case "int":
      return { kind: "number" };
    case "vec2":
    case "vec3":
    case "vec4":
      return { kind: "vector" };
  }
};

export const getGlslVectorComponentNames = (
  valueType: GlslValueType,
): readonly string[] => {
  switch (valueType) {
    case "vec2":
      return ["x", "y"];
    case "vec3":
      return ["x", "y", "z"];
    case "vec4":
      return ["x", "y", "z", "w"];
    case "bool":
    case "float":
    case "int":
      return [];
  }
};

export const normalizeUniformEditor = (
  valueType: GlslValueType,
  defaultValue: GlslValue,
  editor: UniformEditorDefinition | undefined,
): { editor: ValidatedUniformEditor; errors: string[] } => {
  const nextEditor = editor ?? getDefaultUniformEditor(valueType);
  const errors: string[] = [];

  switch (nextEditor.kind) {
    case "checkbox":
      if (valueType !== "bool") {
        errors.push(
          `editor kind [checkbox] is only valid for [bool] uniforms, but this node uses [${valueType}].`,
        );
      }
      break;
    case "color":
      if (valueType !== "vec4") {
        errors.push(
          `editor kind [color] is only valid for [vec4] uniforms, but this node uses [${valueType}].`,
        );
      }
      break;
    case "number":
      if (valueType !== "float" && valueType !== "int") {
        errors.push(
          `editor kind [number] is only valid for [float] or [int] uniforms, but this node uses [${valueType}].`,
        );
      }
      break;
    case "slider":
      if (valueType !== "float" && valueType !== "int") {
        errors.push(
          `editor kind [slider] is only valid for [float] or [int] uniforms, but this node uses [${valueType}].`,
        );
      }

      if (nextEditor.min > nextEditor.max) {
        errors.push(
          `slider min [${nextEditor.min}] must be less than or equal to max [${nextEditor.max}].`,
        );
      }

      if (typeof defaultValue === "number") {
        if (defaultValue < nextEditor.min || defaultValue > nextEditor.max) {
          errors.push(
            `slider default value [${defaultValue}] must be within [${nextEditor.min}, ${nextEditor.max}].`,
          );
        }

        if (
          valueType === "int" &&
          (!Number.isInteger(defaultValue) ||
            !Number.isInteger(nextEditor.min) ||
            !Number.isInteger(nextEditor.max))
        ) {
          errors.push(
            "integer slider editors must use integer defaultValue, min, and max values.",
          );
        }
      }
      break;
    case "vector":
      if (
        valueType !== "vec2" &&
        valueType !== "vec3" &&
        valueType !== "vec4"
      ) {
        errors.push(
          `editor kind [vector] is only valid for vector uniforms, but this node uses [${valueType}].`,
        );
      }
      break;
  }

  return {
    editor: nextEditor,
    errors,
  };
};
