import type { ZodIssue } from "zod";
import type {
  GraphSourceLoader,
  ValidatedCustomNode,
  ValidatedGraph,
  ValidatedGraphEdge,
  ValidatedGraphNode,
  ValidatedTimeBinding,
  ValidatedTimeNode,
  ValidatedUniformBinding,
  ValidatedUniformNode,
  ValidatedVaryingBinding,
  ValidatedVaryingNode,
} from "../graph-types";
import {
  loadResolvedCustomNodeSource,
  matchCustomNodeSignature,
  type ParsedGlslFunctionSignature,
} from "./custom-node-glsl";
import {
  areGlslValuesEqual,
  cloneGlslValue,
  formatGlslValue,
  normalizeUniformEditor,
} from "./glsl-type-registry";
import type {
  CustomNode,
  GraphDefinition,
  GraphNodeDefinition,
  TimeNode,
  UniformNode,
  VaryingNode,
} from "./json-schema";
import { graphSchema } from "./json-schema";

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

type InferredCustomNodeData = {
  readonly signature: ParsedGlslFunctionSignature;
  readonly source: string;
};

const GRAPH_TIME_UNIFORM_NAME = "u_time";

const formatSchemaIssuePath = (issue: ZodIssue): string =>
  issue.path.length === 0 ? "graph" : `graph.${issue.path.join(".")}`;

const formatSchemaIssue = (issue: ZodIssue): string =>
  `${formatSchemaIssuePath(issue)}: ${issue.message}`;

const parseGraphJson = (
  graphSource: string,
): { graph: GraphDefinition; ok: true } | { errors: string[]; ok: false } => {
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

const createNodeDisplayName = (node: GraphNodeDefinition): string =>
  node.kind === "glFragColor" ? "gl_FragColor" : node.instanceName;

const createFlowNodeId = (
  node: GraphNodeDefinition,
  index: number,
  seenIds: Map<string, number>,
): string => {
  const baseId =
    node.kind === "glFragColor" ? `glFragColor_${index}` : node.instanceName;
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

const createDuplicateInstanceNameErrors = (
  graph: GraphDefinition,
): string[] => {
  const seenNodes = new Set<string>();
  const errors: string[] = [];

  for (const node of graph.nodes) {
    if (node.kind === "glFragColor") {
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

const inferCustomNodeData = async (
  node: CustomNode,
  loadCustomNodeSource: GraphSourceLoader | undefined,
): Promise<
  | { readonly data: InferredCustomNodeData; readonly errors: readonly [] }
  | { readonly data: null; readonly errors: readonly string[] }
> => {
  let source: string;

  try {
    source = await loadResolvedCustomNodeSource(node, loadCustomNodeSource);
  } catch (error) {
    return {
      data: null,
      errors: [
        `node [${node.instanceName}] could not load custom node source from [${node.filepath}] to infer its input and output types. ${error instanceof Error ? error.message : "Unknown error."}`,
      ],
    };
  }

  const { availableFunctions, expectedFunctionName, signature } =
    matchCustomNodeSignature(node, source);

  if (signature === null) {
    return {
      data: null,
      errors: [
        `node [${node.instanceName}] could not infer a custom node signature from [${node.filepath}]. Expected a function named [${expectedFunctionName}] or a file with exactly one supported GLSL function. Available functions: ${availableFunctions}.`,
      ],
    };
  }

  return {
    data: {
      signature,
      source: source.trim(),
    },
    errors: [],
  };
};

const createValidatedUniformNode = (
  node: UniformNode,
  flowId: string,
  errors: string[],
): ValidatedUniformNode => {
  const defaultValue = cloneGlslValue(node.defaultValue);
  const normalizedEditor = normalizeUniformEditor(
    node.valueType,
    defaultValue,
    node.editor,
  );

  for (const error of normalizedEditor.errors) {
    errors.push(
      `node [${node.instanceName}] has an invalid editor configuration. ${error}`,
    );
  }

  return {
    defaultValue,
    definition: node,
    displayName: node.instanceName,
    editor: normalizedEditor.editor,
    flowId,
    kind: "uniform",
    outputType: node.valueType,
    uniformBindingKey: node.uniformName,
  };
};

const createValidatedVaryingNode = (
  node: VaryingNode,
  flowId: string,
): ValidatedVaryingNode => ({
  definition: node,
  displayName: node.instanceName,
  flowId,
  kind: "varying",
  outputType: node.valueType,
  varyingBindingKey: node.varyingName,
});

const createValidatedTimeNode = (
  node: TimeNode,
  flowId: string,
): ValidatedTimeNode => ({
  definition: node,
  displayName: node.instanceName,
  flowId,
  kind: "time",
  outputType: "float",
  timeBindingKey: GRAPH_TIME_UNIFORM_NAME,
});

const createUniformBindings = (
  nodes: readonly ValidatedGraphNode[],
): {
  bindings: readonly ValidatedUniformBinding[];
  errors: readonly string[];
} => {
  const errors: string[] = [];
  const bindings: ValidatedUniformBinding[] = [];
  const bindingByKey = new Map<
    string,
    {
      defaultValue: ValidatedUniformBinding["defaultValue"];
      nodeIds: string[];
      node: ValidatedUniformNode;
      valueType: ValidatedUniformBinding["valueType"];
    }
  >();

  for (const node of nodes) {
    if (node.kind !== "uniform") {
      continue;
    }

    const existingBinding = bindingByKey.get(node.uniformBindingKey);

    if (existingBinding === undefined) {
      const nextBinding = {
        defaultValue: cloneGlslValue(node.defaultValue),
        node,
        nodeIds: [node.flowId],
        valueType: node.outputType,
      };

      bindingByKey.set(node.uniformBindingKey, nextBinding);
      bindings.push({
        defaultValue: cloneGlslValue(node.defaultValue),
        key: node.uniformBindingKey,
        nodeIds: nextBinding.nodeIds,
        valueType: node.outputType,
      });
      continue;
    }

    existingBinding.nodeIds.push(node.flowId);

    if (existingBinding.valueType !== node.outputType) {
      errors.push(
        `uniform [${node.uniformBindingKey}] is shared by node [${existingBinding.node.displayName}] and node [${node.displayName}], but they resolve to different GLSL types [${existingBinding.valueType}] and [${node.outputType}]. Shared uniforms must use the same type.`,
      );
      continue;
    }

    if (!areGlslValuesEqual(existingBinding.defaultValue, node.defaultValue)) {
      errors.push(
        `uniform [${node.uniformBindingKey}] is shared by node [${existingBinding.node.displayName}] and node [${node.displayName}], but their default values differ: node [${existingBinding.node.displayName}] uses [${formatGlslValue(existingBinding.defaultValue, existingBinding.valueType)}] while node [${node.displayName}] uses [${formatGlslValue(node.defaultValue, node.outputType)}]. Shared uniforms must start with the same value.`,
      );
    }
  }

  return {
    bindings,
    errors,
  };
};

const createVaryingBindings = (
  nodes: readonly ValidatedGraphNode[],
): {
  bindings: readonly ValidatedVaryingBinding[];
  errors: readonly string[];
} => {
  const errors: string[] = [];
  const bindings: ValidatedVaryingBinding[] = [];
  const bindingByKey = new Map<
    string,
    {
      nodeIds: string[];
      node: ValidatedVaryingNode;
      valueType: ValidatedVaryingBinding["valueType"];
    }
  >();

  for (const node of nodes) {
    if (node.kind !== "varying") {
      continue;
    }

    const existingBinding = bindingByKey.get(node.varyingBindingKey);

    if (existingBinding === undefined) {
      const nextBinding = {
        node,
        nodeIds: [node.flowId],
        valueType: node.outputType,
      };

      bindingByKey.set(node.varyingBindingKey, nextBinding);
      bindings.push({
        key: node.varyingBindingKey,
        nodeIds: nextBinding.nodeIds,
        valueType: node.outputType,
      });
      continue;
    }

    existingBinding.nodeIds.push(node.flowId);

    if (existingBinding.valueType !== node.outputType) {
      errors.push(
        `varying [${node.varyingBindingKey}] is shared by node [${existingBinding.node.displayName}] and node [${node.displayName}], but they resolve to different GLSL types [${existingBinding.valueType}] and [${node.outputType}]. Shared varyings must use the same type.`,
      );
    }
  }

  return {
    bindings,
    errors,
  };
};

const createTimeBindings = (
  nodes: readonly ValidatedGraphNode[],
): {
  bindings: readonly ValidatedTimeBinding[];
  errors: readonly string[];
} => {
  const errors: string[] = [];
  const bindings: ValidatedTimeBinding[] = [];
  const bindingByKey = new Map<
    string,
    {
      nodeIds: string[];
      node: ValidatedTimeNode;
      valueType: ValidatedTimeBinding["valueType"];
    }
  >();

  for (const node of nodes) {
    if (node.kind !== "time") {
      continue;
    }

    const existingBinding = bindingByKey.get(node.timeBindingKey);

    if (existingBinding === undefined) {
      const nextBinding = {
        node,
        nodeIds: [node.flowId],
        valueType: node.outputType,
      };

      bindingByKey.set(node.timeBindingKey, nextBinding);
      bindings.push({
        key: node.timeBindingKey,
        nodeIds: nextBinding.nodeIds,
        valueType: node.outputType,
      });
      continue;
    }

    existingBinding.nodeIds.push(node.flowId);
  }

  return {
    bindings,
    errors,
  };
};

const validateGraphDefinition = async (
  graph: GraphDefinition,
  options: ReadValidatedGraphOptions = {},
): Promise<ReadValidatedGraphResult> => {
  const errors = createDuplicateInstanceNameErrors(graph);
  const nodeByInstanceName = new Map<string, GraphNodeDefinition>();

  for (const node of graph.nodes) {
    if (
      node.kind !== "glFragColor" &&
      !nodeByInstanceName.has(node.instanceName)
    ) {
      nodeByInstanceName.set(node.instanceName, node);
    }
  }

  const inferredCustomDataByNode = new Map<
    CustomNode,
    InferredCustomNodeData
  >();

  await Promise.all(
    graph.nodes.map(async (node) => {
      if (node.kind !== "custom") {
        return;
      }

      const result = await inferCustomNodeData(
        node,
        options.loadCustomNodeSource,
      );

      errors.push(...result.errors);

      if (result.data !== null) {
        inferredCustomDataByNode.set(node, result.data);
      }
    }),
  );

  const seenFlowIds = new Map<string, number>();
  const validatedNodes: ValidatedGraphNode[] = [];

  for (const [index, node] of graph.nodes.entries()) {
    const flowId = createFlowNodeId(node, index, seenFlowIds);

    switch (node.kind) {
      case "uniform":
        validatedNodes.push(createValidatedUniformNode(node, flowId, errors));
        break;
      case "custom": {
        const inferredCustomData = inferredCustomDataByNode.get(node);

        if (inferredCustomData === undefined) {
          break;
        }

        validatedNodes.push({
          definition: node,
          displayName: node.instanceName,
          flowId,
          inputTypes: inferredCustomData.signature.inputTypes,
          kind: "custom",
          outputType: inferredCustomData.signature.outputType,
          signature: inferredCustomData.signature,
          source: inferredCustomData.source,
        });
        break;
      }
      case "time":
        validatedNodes.push(createValidatedTimeNode(node, flowId));
        break;
      case "varying":
        validatedNodes.push(createValidatedVaryingNode(node, flowId));
        break;
      case "glFragColor":
        validatedNodes.push({
          definition: node,
          displayName: createNodeDisplayName(node),
          flowId,
          kind: "glFragColor",
        });
        break;
    }
  }

  const { bindings, errors: uniformBindingErrors } =
    createUniformBindings(validatedNodes);
  const { bindings: timeBindings, errors: timeBindingErrors } =
    createTimeBindings(validatedNodes);
  const { bindings: varyingBindings, errors: varyingBindingErrors } =
    createVaryingBindings(validatedNodes);

  errors.push(...uniformBindingErrors);
  errors.push(...timeBindingErrors);
  errors.push(...varyingBindingErrors);

  const validatedNodeByInstanceName = new Map<
    string,
    | ValidatedCustomNode
    | ValidatedTimeNode
    | ValidatedUniformNode
    | ValidatedVaryingNode
  >();

  for (const validatedNode of validatedNodes) {
    if (validatedNode.kind === "glFragColor") {
      continue;
    }

    validatedNodeByInstanceName.set(
      validatedNode.definition.instanceName,
      validatedNode,
    );
  }

  const validatedEdges: ValidatedGraphEdge[] = [];

  for (const validatedNode of validatedNodes) {
    if (
      validatedNode.kind === "time" ||
      validatedNode.kind === "uniform" ||
      validatedNode.kind === "varying"
    ) {
      continue;
    }

    if (validatedNode.kind === "custom") {
      for (const [inputName, inputType] of validatedNode.inputTypes.entries()) {
        if (validatedNode.definition.inputs[inputName] === undefined) {
          errors.push(
            `node [${validatedNode.definition.instanceName}] is missing a connection for input [${inputName}] of type [${inputType}]. Function [${validatedNode.signature.name}] in [${validatedNode.definition.filepath}] requires this input.`,
          );
        }
      }
    }

    for (const [inputName, sourceRef] of Object.entries(
      validatedNode.definition.inputs,
    )) {
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

      if (validatedNode.kind === "custom") {
        const expectedInputType = validatedNode.inputTypes.get(inputName);

        if (expectedInputType === undefined) {
          const availableInputs = Array.from(
            validatedNode.inputTypes.keys(),
          ).join(", ");

          errors.push(
            `node [${validatedNode.definition.instanceName}] declares a graph input [${inputName}], but function [${validatedNode.signature.name}] in [${validatedNode.definition.filepath}] has no parameter with that name. Available inputs: ${availableInputs || "none"}.`,
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
      times: timeBindings,
      uniforms: bindings,
      varyings: varyingBindings,
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
