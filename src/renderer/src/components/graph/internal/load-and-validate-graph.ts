import type { ZodIssue } from "zod";
import type {
  GlslValueType,
  GraphSourceLoader,
  ValidatedGraph,
  ValidatedGraphEdge,
  ValidatedGraphNode,
} from "../graph-types";
import type {
  ColorNode,
  CustomNode,
  FloatNode,
  GlFragColorNode,
  GraphDefinition,
  GraphNodeDefinition,
} from "./json-schema";
import { graphSchema } from "./json-schema";

type InferredNodeTypeInfo = {
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly outputType: GlslValueType | null;
};

type ParsedGlslFunctionSignature = {
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly name: string;
  readonly outputType: GlslValueType;
};

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

const SUPPORTED_GLSL_TYPES = new Set<GlslValueType>([
  "bool",
  "float",
  "int",
  "vec2",
  "vec3",
  "vec4",
]);

const glslFunctionPattern =
  /\b(?<returnType>[A-Za-z_]\w*)\s+(?<name>[A-Za-z_]\w*)\s*\((?<parameters>[^)]*)\)\s*\{/g;

const exampleNodeSourceLoaders = import.meta.glob("../example/nodes/*.glsl", {
  import: "default",
  query: "?raw",
});

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

const normalizeExampleNodePath = (filepath: string): string | null => {
  const normalizedFilePath = filepath.replace(/\\/g, "/");
  const nodePathIndex = normalizedFilePath.indexOf("/nodes/");

  if (normalizedFilePath.startsWith("./nodes/")) {
    return normalizedFilePath;
  }

  if (nodePathIndex >= 0) {
    return `.${normalizedFilePath.slice(nodePathIndex)}`;
  }

  return null;
};

const loadExampleNodeSource = async (
  filepath: string,
): Promise<string | null> => {
  const normalizedFilePath = normalizeExampleNodePath(filepath);

  if (normalizedFilePath === null) {
    return null;
  }

  for (const [modulePath, loadModule] of Object.entries(
    exampleNodeSourceLoaders,
  )) {
    const normalizedModulePath = normalizeExampleNodePath(modulePath);

    if (normalizedModulePath === normalizedFilePath) {
      const source = await loadModule();

      return typeof source === "string" ? source : null;
    }
  }

  return null;
};

const createNodeLabel = (
  node: GraphNodeDefinition,
  fallback: string,
): string => ("instanceName" in node ? node.instanceName : fallback);

const getNodeInputs = (
  node: GraphNodeDefinition,
): Readonly<Record<string, string>> => {
  switch (node.kind) {
    case "custom":
      return node.inputs;
    case "glFragColor":
      return node.inputs;
    case "color":
    case "float":
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
  node: FloatNode | ColorNode | GlFragColorNode,
): InferredNodeTypeInfo => {
  switch (node.kind) {
    case "float":
      return {
        inputTypes: new Map(),
        outputType: "float",
      };
    case "color":
      return {
        inputTypes: new Map(),
        outputType: "vec4",
      };
    case "glFragColor":
      return {
        inputTypes: new Map(),
        outputType: null,
      };
  }
};

const parseParameter = (
  parameterSource: string,
): { name: string; type: GlslValueType } | null => {
  const parameterMatch = parameterSource
    .trim()
    .match(
      /^(?:(?:const|in|out|inout)\s+)?(?<type>[A-Za-z_]\w*)\s+(?<name>[A-Za-z_]\w*)$/,
    );

  if (
    parameterMatch?.groups?.type === undefined ||
    parameterMatch.groups.name === undefined
  ) {
    return null;
  }

  if (!SUPPORTED_GLSL_TYPES.has(parameterMatch.groups.type as GlslValueType)) {
    return null;
  }

  return {
    name: parameterMatch.groups.name,
    type: parameterMatch.groups.type as GlslValueType,
  };
};

const parseFunctionSignatures = (
  source: string,
): ParsedGlslFunctionSignature[] => {
  const signatures: ParsedGlslFunctionSignature[] = [];

  for (const match of source.matchAll(glslFunctionPattern)) {
    const returnType = match.groups?.returnType;
    const name = match.groups?.name;
    const parameters = match.groups?.parameters;

    if (
      returnType === undefined ||
      name === undefined ||
      parameters === undefined ||
      !SUPPORTED_GLSL_TYPES.has(returnType as GlslValueType)
    ) {
      continue;
    }

    const inputTypes = new Map<string, GlslValueType>();
    const rawParameters = parameters
      .split(",")
      .map((parameter) => parameter.trim())
      .filter(Boolean);

    let hasInvalidParameter = false;

    for (const rawParameter of rawParameters) {
      const parsedParameter = parseParameter(rawParameter);

      if (parsedParameter === null) {
        hasInvalidParameter = true;
        break;
      }

      inputTypes.set(parsedParameter.name, parsedParameter.type);
    }

    if (hasInvalidParameter) {
      continue;
    }

    signatures.push({
      inputTypes,
      name,
      outputType: returnType as GlslValueType,
    });
  }

  return signatures;
};

const formatFunctionSignature = (
  signature: ParsedGlslFunctionSignature,
): string => {
  const parameters = Array.from(signature.inputTypes.entries())
    .map(([name, type]) => `${type} ${name}`)
    .join(", ");

  return `${signature.outputType} ${signature.name}(${parameters})`;
};

const inferCustomNodeTypeInfo = async (
  node: CustomNode,
  loadCustomNodeSource: GraphSourceLoader | undefined,
): Promise<
  | { errors: string[]; info: InferredNodeTypeInfo }
  | { errors: string[]; info: null }
> => {
  const loadSource =
    loadCustomNodeSource ??
    (async (filepath: string) => {
      const source = await loadExampleNodeSource(filepath);

      if (source === null) {
        throw new Error(
          `No source loader is configured for custom node file [${filepath}].`,
        );
      }

      return source;
    });

  let source: string;

  try {
    source = await loadSource(node.filepath, node);
  } catch (error) {
    return {
      errors: [
        `node [${node.instanceName}] could not load custom node source from [${node.filepath}] to infer its input and output types. ${error instanceof Error ? error.message : "Unknown error."}`,
      ],
      info: null,
    };
  }

  const parsedFunctionSignatures = parseFunctionSignatures(source);
  const expectedFunctionName = `${node.instanceName}Node`;
  const matchedSignature =
    parsedFunctionSignatures.find(
      (signature) => signature.name === expectedFunctionName,
    ) ??
    (parsedFunctionSignatures.length === 1
      ? parsedFunctionSignatures[0]
      : null);

  if (matchedSignature === null) {
    const availableFunctions =
      parsedFunctionSignatures.length > 0
        ? parsedFunctionSignatures.map(formatFunctionSignature).join(", ")
        : "none";

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
      inputTypes: matchedSignature.inputTypes,
      outputType: matchedSignature.outputType,
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
    case "glFragColor":
    case "color":
    case "float":
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
      } satisfies ValidatedGraphNode;
    })
    .filter((node): node is ValidatedGraphNode => node !== null);

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
