import { z } from "zod";

const nodeInstanceNameSchema = z.string().min(1);
const nodeFilePathSchema = z.string().min(1);
const uniformNameSchema = z.string().min(1);
const finiteNumberSchema = z.number();
const integerNumberSchema = z.number().int();
const normalizedChannelSchema = finiteNumberSchema.min(0).max(1);

// Inputs are modeled as `thisNodeInput -> sourceNodeOutputRef`.
const customNodeInputsSchema = z.record(z.string().min(1), z.string().min(1));

const glFragColorInputsSchema = z
  .object({
    color: z.string().min(1).optional(),
  })
  .strict();

// `color` is a graph-level alias for `vec4` with RGBA channels so the UI can
// render it through a color picker while validation treats it as `vec4`.
const colorValueSchema = z
  .object({
    a: normalizedChannelSchema,
    b: normalizedChannelSchema,
    g: normalizedChannelSchema,
    r: normalizedChannelSchema,
  })
  .strict();

const vec2ValueSchema = z
  .object({
    x: finiteNumberSchema,
    y: finiteNumberSchema,
  })
  .strict();

const vec3ValueSchema = z
  .object({
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    z: finiteNumberSchema,
  })
  .strict();

const vec4ValueSchema = z
  .object({
    w: finiteNumberSchema,
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    z: finiteNumberSchema,
  })
  .strict();

export const customNodeSchema = z.object({
  kind: z.literal("custom"),
  instanceName: nodeInstanceNameSchema,
  filepath: nodeFilePathSchema,
  inputs: customNodeInputsSchema,
});

export const glFragColorNodeSchema = z.object({
  kind: z.literal("glFragColor"),
  inputs: glFragColorInputsSchema,
});

export const floatNodeSchema = z
  .object({
    kind: z.literal("float"),
    instanceName: nodeInstanceNameSchema,
    uniformName: uniformNameSchema,
    defaultValue: finiteNumberSchema,
    min: finiteNumberSchema.optional(),
    max: finiteNumberSchema.optional(),
  })
  .superRefine(({ defaultValue, max, min }, context) => {
    if (min !== undefined && max !== undefined && min > max) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Float min must be less than or equal to max.",
        path: ["max"],
      });
    }

    if (min !== undefined && defaultValue < min) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Float defaultValue must be greater than or equal to min.",
        path: ["defaultValue"],
      });
    }

    if (max !== undefined && defaultValue > max) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Float defaultValue must be less than or equal to max.",
        path: ["defaultValue"],
      });
    }
  });

export const boolNodeSchema = z.object({
  kind: z.literal("bool"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: z.boolean(),
});

export const intNodeSchema = z.object({
  kind: z.literal("int"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: integerNumberSchema,
});

export const vec2NodeSchema = z.object({
  kind: z.literal("vec2"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: vec2ValueSchema,
});

export const vec3NodeSchema = z.object({
  kind: z.literal("vec3"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: vec3ValueSchema,
});

export const vec4NodeSchema = z.object({
  kind: z.literal("vec4"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: vec4ValueSchema,
});

export const colorNodeSchema = z.object({
  kind: z.literal("color"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: colorValueSchema,
});

export const graphNodeSchema = z.discriminatedUnion("kind", [
  boolNodeSchema,
  colorNodeSchema,
  customNodeSchema,
  floatNodeSchema,
  glFragColorNodeSchema,
  intNodeSchema,
  vec2NodeSchema,
  vec3NodeSchema,
  vec4NodeSchema,
]);

export const graphSchema = z.object({
  nodes: z.array(graphNodeSchema),
});

export type CustomNode = z.infer<typeof customNodeSchema>;
export type GlFragColorNode = z.infer<typeof glFragColorNodeSchema>;
export type BoolNode = z.infer<typeof boolNodeSchema>;
export type FloatNode = z.infer<typeof floatNodeSchema>;
export type IntNode = z.infer<typeof intNodeSchema>;
export type Vec2Node = z.infer<typeof vec2NodeSchema>;
export type Vec3Node = z.infer<typeof vec3NodeSchema>;
export type Vec4Node = z.infer<typeof vec4NodeSchema>;
export type ColorNode = z.infer<typeof colorNodeSchema>;
export type ColorValue = z.infer<typeof colorValueSchema>;
export type Vec2Value = z.infer<typeof vec2ValueSchema>;
export type Vec3Value = z.infer<typeof vec3ValueSchema>;
export type Vec4Value = z.infer<typeof vec4ValueSchema>;
export type GraphNodeDefinition = z.infer<typeof graphNodeSchema>;
export type GraphDefinition = z.infer<typeof graphSchema>;
