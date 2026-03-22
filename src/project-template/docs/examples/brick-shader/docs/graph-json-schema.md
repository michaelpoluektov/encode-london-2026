# graph.json Validation Schema

These excerpts mirror the implementation used by the app.

## GLSL value and editor schema

```ts
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

export const glslValueSchema = z.union([
  z.boolean(),
  finiteNumberSchema,
  vec2ValueSchema,
  vec3ValueSchema,
  vec4ValueSchema,
]);

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
```

## Graph schema

```ts
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
```
