import { z } from "zod";

const nodeInstanceNameSchema = z.string().min(1);
const nodeFilePathSchema = z.string().min(1);
const uniformNameSchema = z.string().min(1);
const finiteNumberSchema = z.number();

// Inputs are modeled as `thisNodeInput -> sourceNodeOutputRef`.
const customNodeInputsSchema = z.record(z.string().min(1), z.string().min(1));

const outputGlFragColorInputsSchema = z
  .object({
    gl_frag_color_input: z.string().min(1).optional(),
  })
  .strict();

export const customNodeSchema = z.object({
  kind: z.literal("custom"),
  instanceName: nodeInstanceNameSchema,
  filepath: nodeFilePathSchema,
  inputs: customNodeInputsSchema,
});

export const outputGlFragColorNodeSchema = z.object({
  kind: z.literal("output_gl_frag_color"),
  inputs: outputGlFragColorInputsSchema,
});

export const inputFloatNodeSchema = z.object({
  kind: z.literal("input_float"),
  instanceName: nodeInstanceNameSchema,
  uniformName: uniformNameSchema,
  defaultValue: finiteNumberSchema,
});

export const inputClampedFloatNodeSchema = z
  .object({
    kind: z.literal("input_clamped_float"),
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

export const dagNodeSchema = z.discriminatedUnion("kind", [
  customNodeSchema,
  outputGlFragColorNodeSchema,
  inputFloatNodeSchema,
  inputClampedFloatNodeSchema,
]);

export const dagGraphSchema = z.object({
  nodes: z.array(dagNodeSchema),
});

export type CustomNode = z.infer<typeof customNodeSchema>;
export type OutputGlFragColorNode = z.infer<typeof outputGlFragColorNodeSchema>;
export type InputFloatNode = z.infer<typeof inputFloatNodeSchema>;
export type InputClampedFloatNode = z.infer<typeof inputClampedFloatNodeSchema>;
export type DagNode = z.infer<typeof dagNodeSchema>;
export type DagGraph = z.infer<typeof dagGraphSchema>;
