import { z } from "zod";

const nodeInstanceNameSchema = z.string().min(1);
const nodeFilePathSchema = z.string().min(1);
const uniformNameSchema = z.string().min(1);
const finiteNumberSchema = z.number();
const normalizedChannelSchema = finiteNumberSchema.min(0).max(1);

// Inputs are modeled as `thisNodeInput -> sourceNodeOutputRef`.
const customNodeInputsSchema = z.record(z.string().min(1), z.string().min(1));

const glFragColorInputsSchema = z
  .object({
    color: z.string().min(1).optional(),
  })
  .strict();

const colorValueSchema = z
  .object({
    a: normalizedChannelSchema,
    b: normalizedChannelSchema,
    g: normalizedChannelSchema,
    r: normalizedChannelSchema,
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

export const floatNodeSchema = z.object({
  kind: z.literal("float"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: finiteNumberSchema,
});

export const clampedFloatNodeSchema = z
  .object({
    kind: z.literal("clampedFloat"),
    instanceName: nodeInstanceNameSchema,
    uniformName: uniformNameSchema,
    defaultValue: finiteNumberSchema,
    min: finiteNumberSchema,
    max: finiteNumberSchema,
  })
  .refine(({ min, max }) => min <= max, {
    message: "Clamped float min must be less than or equal to max.",
    path: ["max"],
  })
  .refine(
    ({ defaultValue, min, max }) => defaultValue >= min && defaultValue <= max,
    {
      message: "Clamped float defaultValue must be within min/max bounds.",
      path: ["defaultValue"],
    },
  );

export const colorNodeSchema = z.object({
  kind: z.literal("color"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: colorValueSchema,
});

export const dagNodeSchema = z.discriminatedUnion("kind", [
  customNodeSchema,
  glFragColorNodeSchema,
  floatNodeSchema,
  clampedFloatNodeSchema,
  colorNodeSchema,
]);

export const dagGraphSchema = z.object({
  nodes: z.array(dagNodeSchema),
});

export type CustomNode = z.infer<typeof customNodeSchema>;
export type GlFragColorNode = z.infer<typeof glFragColorNodeSchema>;
export type FloatNode = z.infer<typeof floatNodeSchema>;
export type ClampedFloatNode = z.infer<typeof clampedFloatNodeSchema>;
export type ColorNode = z.infer<typeof colorNodeSchema>;
export type ColorValue = z.infer<typeof colorValueSchema>;
export type DagNode = z.infer<typeof dagNodeSchema>;
export type DagGraph = z.infer<typeof dagGraphSchema>;
