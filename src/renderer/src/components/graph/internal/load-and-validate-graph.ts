import type { ZodIssue } from "zod";
import type {
  GlslValueType,
  GraphSourceLoader,
  ValidatedGraph,
  ValidatedGraphEdge,
  ValidatedGraphNode,
} from "../graph-types";
import {
  loadResolvedCustomNodeSource,
  matchCustomNodeSignature,
} from "./custom-node-glsl";
import type {
  BoolNode,
  ColorNode,
  ColorValue,
  CustomNode,
  FloatNode,
  GlFragColorNode,
  GraphDefinition,
  GraphNodeDefinition,
  IntNode,
  Vec2Node,
  Vec2Value,
  Vec3Node,
  Vec3Value,
  Vec4Node,
  Vec4Value,
} from "./json-schema";
import { graphSchema } from "./json-schema";

type InferredNodeTypeInfo = {
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly outputType: GlslValueType | null;
};

type UniformInputNodeDefinition =
  | BoolNode
  | ColorNode
  | FloatNode
  | IntNode
  | Vec2Node
  | Vec3Node
  | Vec4Node;

type UniformBindingValue = boolean | number | Vec2Value | Vec3Value | Vec4Value;

type ReadValidatedGraphOptions = {
  readonly loadCustomNodeSource?: GraphSourceLoader;
};

type ReadValidatedGraphResult =
  | {
      readonly errors: readonly [];
      readonly graph: ValidatedGraph;
      readonly ok: true;
    }
  | {
      readonly errors: readonly string[];
      readonly graph: null;
      readonly ok: false;
    };

const formatSchemaIssuePath = (issue: ZodIssue): string =>
  issue.path.length === 0 ? "graph" : `graph.${issue.path.join(".")}`;

const formatSchemaIssue = (issue: ZodIssue): string =>
  `${formatSchemaIssuePath(issue)}: ${issue.message}`;

const parseGraphJson = (
  graphSource: string,
): { ok: true; graph: GraphDefinition } | { ok: false; errors: string[] } => {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(graphSource);
  } catch (error) {
    return {
      errors: [
        `graph JSON could not be parsed. ${error instanceof Error ? error.message : "Unknown error."}`,
      ],
      ok: false,
    };
  }

  const parsedGraph = graphSchema.safeParse(parsedJson);

  if (!parsedGraph.success) {
    return {
      errors: parsedGraph.error.issues.map(formatSchemaIssue),
      ok: false,
    };
  }

  return {
    graph: parsedGraph.data,
    ok: true,
  };
};

const createNodeLabel = (
  node: GraphNodeDefinition,
  fallback: string,
): string => ("instanceName" in node ? node.instanceName : fallback);

const isUniformInputNodeDefinition = (
  node: GraphNodeDefinition,
): node is UniformInputNodeDefinition => "uniformName" in node;

const getNodeInputs = (
  node: GraphNodeDefinition,
): Readonly<Record<string, string>> => {
  switch (node.kind) {
    case "custom":
      return node.inputs;
    case "glFragColor":
      return node.inputs;
    case "bool":
    case "color":
    case "float":
    case "int":
    case "vec2":
    case "vec3":
    case "vec4":
      return {};
  }
};

const createFlowNodeId = (
  node: GraphNodeDefinition,
  index: number,
  seenIds: Map<string, number>,
): string => {
  const baseId =
    "instanceName" in node ? node.instanceName : `glFragColor_${index}`;
  const seenCount = seenIds.get(baseId) ?? 0;

  seenIds.set(baseId, seenCount + 1);

  return seenCount === 0 ? baseId : `${baseId}__${seenCount + 1}`;
};

const resolveSourceNodeInstanceName = (
  sourceRef: string,
  nodeByInstanceName: ReadonlyMap<string, GraphNodeDefinition>,
): string | null => {
  const candidates = [sourceRef];

  for (const separator of [".", ":"]) {
    const separatorIndex = sourceRef.indexOf(separator);

    if (separatorIndex > 0) {
      candidates.push(sourceRef.slice(0, separatorIndex));
    }
  }

  for (const candidate of candidates) {
    if (nodeByInstanceName.has(candidate)) {
      return candidate;
    }
  }

  return null;
};

const inferStaticNodeTypeInfo = (
  node:
    | BoolNode
    | ColorNode
    | FloatNode
    | GlFragColorNode
    | IntNode
    | Vec2Node
    | Vec3Node
    | Vec4Node,
): InferredNodeTypeInfo => {
  switch (node.kind) {
    case "bool":
      return {
        inputTypes: new Map(),
        outputType: "bool",
      };
    case "color":
      return {
        inputTypes: new Map(),
        outputType: "vec4",
      };
    case "float":
      return {
        inputTypes: new Map(),
        outputType: "float",
      };
    case "glFragColor":
      return {
        inputTypes: new Map(),
        outputType: null,
      };
    case "int":
      return {
        inputTypes: new Map(),
        outputType: "int",
      };
    case "vec2":
      return {
        inputTypes: new Map(),
        outputType: "vec2",
      };
    case "vec3":
      return {
        inputTypes: new Map(),
        outputType: "vec3",
      };
    case "vec4":
      return {
        inputTypes: new Map(),
        outputType: "vec4",
      };
  }
};

const colorValueToVec4Value = (value: ColorValue): Vec4Value => ({
  w: value.a,
  x: value.r,
  y: value.g,
  z: value.b,
});

const cloneVec2Value = (value: Vec2Value): Vec2Value => ({
  x: value.x,
  y: value.y,
});

const cloneVec3Value = (value: Vec3Value): Vec3Value => ({
  x: value.x,
  y: value.y,
  z: value.z,
});

const cloneVec4Value = (value: Vec4Value): Vec4Value => ({
  w: value.w,
  x: value.x,
  y: value.y,
  z: value.z,
});

const createUniformBindingValue = (
  node: UniformInputNodeDefinition,
): UniformBindingValue => {
  switch (node.kind) {
    case "bool":
    case "float":
    case "int":
      return node.defaultValue;
    case "color":
      return colorValueToVec4Value(node.defaultValue);
    case "vec2":
      return cloneVec2Value(node.defaultValue);
    case "vec3":
      return cloneVec3Value(node.defaultValue);
    case "vec4":
      return cloneVec4Value(node.defaultValue);
  }
};

const areUniformBindingValuesEqual = (
  left: UniformBindingValue,
  right: UniformBindingValue,
): boolean => {
  if (typeof left !== typeof right) {
    return false;
  }

  if (
    typeof left === "boolean" ||
    typeof left === "number" ||
    typeof right === "boolean" ||
    typeof right === "number"
  ) {
    return left === right;
  }

  return JSON.stringify(left) === JSON.stringify(right);
};

const formatUniformBindingValue = (
  value: UniformBindingValue,
  valueType: GlslValueType,
): string => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toString();
  }

  switch (valueType) {
    case "vec2": {
      const vec2Value = value as Vec2Value;

      return `vec2(${vec2Value.x}, ${vec2Value.y})`;
    }
    case "vec3": {
      const vec3Value = value as Vec3Value;

      return `vec3(${vec3Value.x}, ${vec3Value.y}, ${vec3Value.z})`;
    }
    case "vec4": {
      const vec4Value = value as Vec4Value;

      return `vec4(${vec4Value.x}, ${vec4Value.y}, ${vec4Value.z}, ${vec4Value.w})`;
    }
    case "bool":
    case "float":
    case "int":
      return JSON.stringify(value);
  }
};

const createSharedUniformErrors = (
  validatedNodes: readonly ValidatedGraphNode[],
): string[] => {
  const errors: string[] = [];
  const uniformBindingByName = new Map<
    string,
    {
      readonly defaultValue: UniformBindingValue;
      readonly node: ValidatedGraphNode;
      readonly valueType: GlslValueType;
    }
  >();

  for (const validatedNode of validatedNodes) {
    if (
      !isUniformInputNodeDefinition(validatedNode.definition) ||
      validatedNode.outputType === null
    ) {
      continue;
    }

    const uniformName = validatedNode.definition.uniformName;
    const defaultValue = createUniformBindingValue(validatedNode.definition);
    const existingBinding = uniformBindingByName.get(uniformName);

    if (existingBinding === undefined) {
      uniformBindingByName.set(uniformName, {
        defaultValue,
        node: validatedNode,
        valueType: validatedNode.outputType,
      });
      continue;
    }

    if (existingBinding.valueType !== validatedNode.outputType) {
      errors.push(
        `uniform [${uniformName}] is shared by node [${existingBinding.node.displayName}] and node [${validatedNode.displayName}], but they resolve to different GLSL types [${existingBinding.valueType}] and [${validatedNode.outputType}]. Shared uniforms must use the same type.`,
      );
      continue;
    }

    if (
      !areUniformBindingValuesEqual(existingBinding.defaultValue, defaultValue)
    ) {
      errors.push(
        `uniform [${uniformName}] is shared by node [${existingBinding.node.displayName}] and node [${validatedNode.displayName}], but their default values differ: node [${existingBinding.node.displayName}] uses [${formatUniformBindingValue(existingBinding.defaultValue, existingBinding.valueType)}] while node [${validatedNode.displayName}] uses [${formatUniformBindingValue(defaultValue, validatedNode.outputType)}]. Shared uniforms must start with the same value.`,
      );
    }
  }

  return errors;
};

const inferCustomNodeTypeInfo = async (
  node: CustomNode,
  loadCustomNodeSource: GraphSourceLoader | undefined,
): Promise<
  | { errors: string[]; info: InferredNodeTypeInfo }
  | { errors: string[]; info: null }
> => {
  let source: string;

  try {
    source = await loadResolvedCustomNodeSource(node, loadCustomNodeSource);
  } catch (error) {
    return {
      errors: [
        `node [${node.instanceName}] could not load custom node source from [${node.filepath}] to infer its input and output types. ${error instanceof Error ? error.message : "Unknown error."}`,
      ],
      info: null,
    };
  }

  const { availableFunctions, expectedFunctionName, signature } =
    matchCustomNodeSignature(node, source);

  if (signature === null) {
    return {
      errors: [
        `node [${node.instanceName}] could not infer a custom node signature from [${node.filepath}]. Expected a function named [${expectedFunctionName}] or a file with exactly one supported GLSL function. Available functions: ${availableFunctions}.`,
      ],
      info: null,
    };
  }

  return {
    errors: [],
    info: {
      inputTypes: signature.inputTypes,
      outputType: signature.outputType,
    },
  };
};

const inferNodeTypeInfo = async (
  node: GraphNodeDefinition,
  loadCustomNodeSource: GraphSourceLoader | undefined,
): Promise<
  | { errors: string[]; info: InferredNodeTypeInfo }
  | { errors: string[]; info: null }
> => {
  switch (node.kind) {
    case "custom":
      return inferCustomNodeTypeInfo(node, loadCustomNodeSource);
    case "bool":
    case "color":
    case "float":
    case "glFragColor":
    case "int":
    case "vec2":
    case "vec3":
    case "vec4":
      return {
        errors: [],
        info: inferStaticNodeTypeInfo(node),
      };
  }
};

const createDuplicateInstanceNameErrors = (
  graph: GraphDefinition,
): string[] => {
  const seenNodes = new Set<string>();
  const errors: string[] = [];

  for (const node of graph.nodes) {
    if (!("instanceName" in node)) {
      continue;
    }

    if (seenNodes.has(node.instanceName)) {
      errors.push(
        `graph contains multiple nodes with the same instance name [${node.instanceName}]. Source references must be unique so edge types can be resolved unambiguously.`,
      );
      continue;
    }

    seenNodes.add(node.instanceName);
  }

  return errors;
};

const validateGraphDefinition = async (
  graph: GraphDefinition,
  options: ReadValidatedGraphOptions = {},
): Promise<ReadValidatedGraphResult> => {
  const errors = createDuplicateInstanceNameErrors(graph);
  const nodeByInstanceName = new Map<string, GraphNodeDefinition>();

  for (const node of graph.nodes) {
    if ("instanceName" in node && !nodeByInstanceName.has(node.instanceName)) {
      nodeByInstanceName.set(node.instanceName, node);
    }
  }

  const inferredTypeInfoByNode = new Map<
    GraphNodeDefinition,
    InferredNodeTypeInfo
  >();

  await Promise.all(
    graph.nodes.map(async (node) => {
      const result = await inferNodeTypeInfo(
        node,
        options.loadCustomNodeSource,
      );

      errors.push(...result.errors);

      if (result.info !== null) {
        inferredTypeInfoByNode.set(node, result.info);
      }
    }),
  );

  const seenFlowIds = new Map<string, number>();
  const validatedNodes: ValidatedGraphNode[] = graph.nodes
    .map((node, index) => {
      const inferredTypeInfo = inferredTypeInfoByNode.get(node);

      if (inferredTypeInfo === undefined) {
        return null;
      }

      return {
        definition: node,
        displayName: createNodeLabel(node, "gl_FragColor"),
        flowId: createFlowNodeId(node, index, seenFlowIds),
        inputTypes: inferredTypeInfo.inputTypes,
        outputType: inferredTypeInfo.outputType,
        uniformBindingKey: isUniformInputNodeDefinition(node)
          ? node.uniformName
          : null,
      } satisfies ValidatedGraphNode;
    })
    .filter((node): node is ValidatedGraphNode => node !== null);

  errors.push(...createSharedUniformErrors(validatedNodes));

  const validatedNodeByInstanceName = new Map<string, ValidatedGraphNode>();

  for (const validatedNode of validatedNodes) {
    if ("instanceName" in validatedNode.definition) {
      validatedNodeByInstanceName.set(
        validatedNode.definition.instanceName,
        validatedNode,
      );
    }
  }

  const validatedEdges: ValidatedGraphEdge[] = [];

  for (const validatedNode of validatedNodes) {
    const nodeInputs = getNodeInputs(validatedNode.definition);

    if (validatedNode.definition.kind === "custom") {
      for (const [inputName, inputType] of validatedNode.inputTypes.entries()) {
        if (validatedNode.definition.inputs[inputName] === undefined) {
          errors.push(
            `node [${validatedNode.definition.instanceName}] is missing a connection for input [${inputName}] of type [${inputType}]. Function [${validatedNode.definition.instanceName}Node] in [${validatedNode.definition.filepath}] requires this input.`,
          );
        }
      }
    }

    for (const [inputName, sourceRef] of Object.entries(nodeInputs)) {
      const sourceNodeInstanceName = resolveSourceNodeInstanceName(
        sourceRef,
        nodeByInstanceName,
      );

      if (sourceNodeInstanceName === null) {
        errors.push(
          `node [${validatedNode.displayName}] input [${inputName}] is connected to [${sourceRef}], but that source does not resolve to any node instance in this graph.`,
        );
        continue;
      }

      const sourceValidatedNode = validatedNodeByInstanceName.get(
        sourceNodeInstanceName,
      );

      if (sourceValidatedNode === undefined) {
        continue;
      }

      if (sourceValidatedNode.outputType === null) {
        errors.push(
          `node [${validatedNode.displayName}] input [${inputName}] is connected to node [${sourceNodeInstanceName}], but node [${sourceNodeInstanceName}] does not expose an output value.`,
        );
        continue;
      }

      if (
        validatedNode.definition.kind !== "glFragColor" &&
        validatedNode.definition.kind !== "custom"
      ) {
        continue;
      }

      if (validatedNode.definition.kind === "custom") {
        const expectedInputType = validatedNode.inputTypes.get(inputName);

        if (expectedInputType === undefined) {
          const availableInputs = Array.from(
            validatedNode.inputTypes.keys(),
          ).join(", ");

          errors.push(
            `node [${validatedNode.definition.instanceName}] declares a graph input [${inputName}], but function [${validatedNode.definition.instanceName}Node] in [${validatedNode.definition.filepath}] has no parameter with that name. Available inputs: ${availableInputs || "none"}.`,
          );
          continue;
        }

        if (expectedInputType !== sourceValidatedNode.outputType) {
          errors.push(
            `node [${validatedNode.definition.instanceName}] has input [${inputName}] of type [${expectedInputType}], it is connected to node [${sourceNodeInstanceName}] which has an output type of [${sourceValidatedNode.outputType}]. [${expectedInputType}] != [${sourceValidatedNode.outputType}].`,
          );
          continue;
        }
      }

      validatedEdges.push({
        sourceNode: sourceValidatedNode,
        sourceRef,
        targetInputName: inputName,
        targetNode: validatedNode,
        valueType: sourceValidatedNode.outputType,
      });
    }
  }

  if (errors.length > 0) {
    return {
      errors,
      graph: null,
      ok: false,
    };
  }

  return {
    errors: [],
    graph: {
      edges: validatedEdges,
      nodes: validatedNodes,
    },
    ok: true,
  };
};

export const readValidatedGraph = async (
  graphSource: string,
  options: ReadValidatedGraphOptions = {},
): Promise<ReadValidatedGraphResult> => {
  const parsedGraph = parseGraphJson(graphSource);

  if (!parsedGraph.ok) {
    return {
      errors: parsedGraph.errors,
      graph: null,
      ok: false,
    };
  }

  return validateGraphDefinition(parsedGraph.graph, options);
};
