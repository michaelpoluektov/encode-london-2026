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

export const colorNodeSchema = z.object({
  kind: z.literal("color"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: colorValueSchema,
});

export const graphNodeSchema = z.discriminatedUnion("kind", [
  customNodeSchema,
  glFragColorNodeSchema,
  floatNodeSchema,
  colorNodeSchema,
]);

export const graphSchema = z.object({
  nodes: z.array(graphNodeSchema),
});

export type CustomNode = z.infer<typeof customNodeSchema>;
export type GlFragColorNode = z.infer<typeof glFragColorNodeSchema>;
export type FloatNode = z.infer<typeof floatNodeSchema>;
export type ColorNode = z.infer<typeof colorNodeSchema>;
export type ColorValue = z.infer<typeof colorValueSchema>;
export type GraphNodeDefinition = z.infer<typeof graphNodeSchema>;
export type GraphDefinition = z.infer<typeof graphSchema>;
