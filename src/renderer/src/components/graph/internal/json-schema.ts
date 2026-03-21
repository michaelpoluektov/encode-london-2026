import { z } from "zod";
import {
  type GlslValue,
  glslValueSchema,
  glslValueTypeSchema,
  normalizeUniformEditor,
  parseGlslValueOfType,
  uniformEditorSchema,
} from "./glsl-type-registry";

const nodeInstanceNameSchema = z.string().min(1);
const nodeFilePathSchema = z.string().min(1);
const uniformNameSchema = z.string().min(1);
const varyingNameSchema = z.string().min(1);

const customNodeInputsSchema = z.record(z.string().min(1), z.string().min(1));

const glFragColorInputsSchema = z
  .object({
    color: z.string().min(1).optional(),
  })
  .strict();

export const uniformNodeSchema = z
  .object({
    defaultValue: glslValueSchema,
    editor: uniformEditorSchema.optional(),
    instanceName: nodeInstanceNameSchema,
    kind: z.literal("uniform"),
    uniformName: uniformNameSchema,
    valueType: glslValueTypeSchema,
  })
  .superRefine((node, context) => {
    const parsedDefaultValue = parseGlslValueOfType(
      node.valueType,
      node.defaultValue,
    );

    if (!parsedDefaultValue.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `defaultValue must match declared valueType [${node.valueType}].`,
        path: ["defaultValue"],
      });
      return;
    }

    const { errors } = normalizeUniformEditor(
      node.valueType,
      parsedDefaultValue.data,
      node.editor,
    );

    for (const error of errors) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
        path: ["editor"],
      });
    }
  });

export const customNodeSchema = z.object({
  filepath: nodeFilePathSchema,
  inputs: customNodeInputsSchema,
  instanceName: nodeInstanceNameSchema,
  kind: z.literal("custom"),
});

export const timeNodeSchema = z.object({
  instanceName: nodeInstanceNameSchema,
  kind: z.literal("time"),
});

export const varyingNodeSchema = z.object({
  instanceName: nodeInstanceNameSchema,
  kind: z.literal("varying"),
  valueType: glslValueTypeSchema,
  varyingName: varyingNameSchema,
});

export const glFragColorNodeSchema = z.object({
  inputs: glFragColorInputsSchema,
  kind: z.literal("glFragColor"),
});

export const graphNodeSchema = z.discriminatedUnion("kind", [
  uniformNodeSchema,
  customNodeSchema,
  timeNodeSchema,
  varyingNodeSchema,
  glFragColorNodeSchema,
]);

export const graphSchema = z.object({
  nodes: z.array(graphNodeSchema),
});

export type UniformNode = Omit<
  z.infer<typeof uniformNodeSchema>,
  "defaultValue"
> & {
  readonly defaultValue: GlslValue;
};
export type CustomNode = z.infer<typeof customNodeSchema>;
export type TimeNode = z.infer<typeof timeNodeSchema>;
export type VaryingNode = z.infer<typeof varyingNodeSchema>;
export type GlFragColorNode = z.infer<typeof glFragColorNodeSchema>;
export type GraphNodeDefinition = z.infer<typeof graphNodeSchema>;
export type GraphDefinition = z.infer<typeof graphSchema>;
