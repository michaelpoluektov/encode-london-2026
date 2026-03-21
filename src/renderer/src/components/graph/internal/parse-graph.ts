import type {
  ClampedFloatNode,
  ColorNode,
  CustomNode,
  DagGraph,
  DagNode,
  FloatNode,
  GlFragColorNode,
} from "../dag-schema";

export type GlslValueType = "bool" | "float" | "int" | "vec2" | "vec3" | "vec4";

type InferredNodeTypeInfo = {
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly outputType: GlslValueType | null;
};

type ParsedGlslFunctionSignature = {
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly name: string;
  readonly outputType: GlslValueType;
};

export type GraphParseIssue = {
  readonly message: string;
  readonly nodeInstanceName?: string;
  readonly inputName?: string;
  readonly sourceNodeInstanceName?: string;
};

export type GraphSourceLoader = (
  filepath: string,
  node: CustomNode,
) => Promise<string> | string;

export type GraphParseOptions = {
  readonly loadCustomNodeSource?: GraphSourceLoader;
};

export type ParsedDagNode = {
  readonly displayName: string;
  readonly flowId: string;
  readonly graphNode: DagNode;
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly outputType: GlslValueType | null;
};

export type ParsedDagEdge = {
  readonly sourceNode: ParsedDagNode;
  readonly sourceRef: string;
  readonly targetInputName: string;
  readonly targetNode: ParsedDagNode;
  readonly valueType: GlslValueType;
};

export type ParsedDagGraph = {
  readonly edges: readonly ParsedDagEdge[];
  readonly nodeByInstanceName: ReadonlyMap<string, ParsedDagNode>;
  readonly nodes: readonly ParsedDagNode[];
  readonly sourceGraph: DagGraph;
};

export type GraphParseResult =
  | {
      readonly graph: ParsedDagGraph;
      readonly issues: readonly [];
      readonly ok: true;
    }
  | {
      readonly graph: null;
      readonly issues: readonly GraphParseIssue[];
      readonly ok: false;
    };

export class GraphParseError extends Error {
  public readonly issues: readonly GraphParseIssue[];

  public constructor(issues: readonly GraphParseIssue[]) {
    super(issues.map((issue) => issue.message).join("\n"));
    this.name = "GraphParseError";
    this.issues = issues;
  }
}

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

const createNodeLabel = (node: DagNode, fallback: string): string =>
  "instanceName" in node ? node.instanceName : fallback;

const getNodeInputs = (node: DagNode): Readonly<Record<string, string>> => {
  switch (node.kind) {
    case "custom":
      return node.inputs;
    case "glFragColor":
      return node.inputs;
    case "clampedFloat":
      return {};
    case "color":
      return {};
    case "float":
      return {};
  }
};

const createFlowNodeId = (
  node: DagNode,
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
  nodeByInstanceName: ReadonlyMap<string, DagNode>,
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
  node: FloatNode | ClampedFloatNode | ColorNode | GlFragColorNode,
): InferredNodeTypeInfo => {
  switch (node.kind) {
    case "float":
      return {
        inputTypes: new Map(),
        outputType: "float",
      };
    case "clampedFloat":
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
  | { info: InferredNodeTypeInfo; issues: GraphParseIssue[] }
  | { info: null; issues: GraphParseIssue[] }
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
      info: null,
      issues: [
        {
          message: `node [${node.instanceName}] could not load custom node source from [${node.filepath}] to infer its input and output types. ${error instanceof Error ? error.message : "Unknown error."}`,
          nodeInstanceName: node.instanceName,
        },
      ],
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
      info: null,
      issues: [
        {
          message: `node [${node.instanceName}] could not infer a custom node signature from [${node.filepath}]. Expected a function named [${expectedFunctionName}] or a file with exactly one supported GLSL function. Available functions: ${availableFunctions}.`,
          nodeInstanceName: node.instanceName,
        },
      ],
    };
  }

  return {
    info: {
      inputTypes: matchedSignature.inputTypes,
      outputType: matchedSignature.outputType,
    },
    issues: [],
  };
};

const inferNodeTypeInfo = async (
  node: DagNode,
  loadCustomNodeSource: GraphSourceLoader | undefined,
): Promise<
  | { info: InferredNodeTypeInfo; issues: GraphParseIssue[] }
  | { info: null; issues: GraphParseIssue[] }
> => {
  switch (node.kind) {
    case "custom":
      return inferCustomNodeTypeInfo(node, loadCustomNodeSource);
    case "glFragColor":
    case "clampedFloat":
    case "color":
    case "float":
      return {
        info: inferStaticNodeTypeInfo(node),
        issues: [],
      };
  }
};

const createDuplicateInstanceNameIssues = (
  graph: DagGraph,
): GraphParseIssue[] => {
  const seenNodes = new Set<string>();
  const issues: GraphParseIssue[] = [];

  for (const node of graph.nodes) {
    if (!("instanceName" in node)) {
      continue;
    }

    if (seenNodes.has(node.instanceName)) {
      issues.push({
        message: `graph contains multiple nodes with the same instance name [${node.instanceName}]. Source references must be unique so edge types can be resolved unambiguously.`,
        nodeInstanceName: node.instanceName,
      });
      continue;
    }

    seenNodes.add(node.instanceName);
  }

  return issues;
};

export const parseGraph = async (
  graph: DagGraph,
  options: GraphParseOptions = {},
): Promise<GraphParseResult> => {
  const issues = createDuplicateInstanceNameIssues(graph);
  const rawNodeByInstanceName = new Map<string, DagNode>();

  for (const node of graph.nodes) {
    if (
      "instanceName" in node &&
      !rawNodeByInstanceName.has(node.instanceName)
    ) {
      rawNodeByInstanceName.set(node.instanceName, node);
    }
  }

  const inferredTypeInfoByNode = new Map<DagNode, InferredNodeTypeInfo>();

  await Promise.all(
    graph.nodes.map(async (node) => {
      const result = await inferNodeTypeInfo(
        node,
        options.loadCustomNodeSource,
      );

      issues.push(...result.issues);

      if (result.info !== null) {
        inferredTypeInfoByNode.set(node, result.info);
      }
    }),
  );

  const seenFlowIds = new Map<string, number>();
  const parsedNodes: ParsedDagNode[] = graph.nodes
    .map((node, index) => {
      const inferredTypeInfo = inferredTypeInfoByNode.get(node);

      if (inferredTypeInfo === undefined) {
        return null;
      }

      return {
        displayName: createNodeLabel(node, "gl_FragColor"),
        flowId: createFlowNodeId(node, index, seenFlowIds),
        graphNode: node,
        inputTypes: inferredTypeInfo.inputTypes,
        outputType: inferredTypeInfo.outputType,
      } satisfies ParsedDagNode;
    })
    .filter((node): node is ParsedDagNode => node !== null);

  const parsedNodeByInstanceName = new Map<string, ParsedDagNode>();

  for (const parsedNode of parsedNodes) {
    if ("instanceName" in parsedNode.graphNode) {
      parsedNodeByInstanceName.set(
        parsedNode.graphNode.instanceName,
        parsedNode,
      );
    }
  }

  const parsedEdges: ParsedDagEdge[] = [];

  for (const parsedNode of parsedNodes) {
    const { graphNode } = parsedNode;
    const nodeInputs = getNodeInputs(graphNode);

    if (graphNode.kind === "custom") {
      for (const [inputName, inputType] of parsedNode.inputTypes.entries()) {
        if (graphNode.inputs[inputName] === undefined) {
          issues.push({
            message: `node [${graphNode.instanceName}] is missing a connection for input [${inputName}] of type [${inputType}]. Function [${graphNode.instanceName}Node] in [${graphNode.filepath}] requires this input.`,
            inputName,
            nodeInstanceName: graphNode.instanceName,
          });
        }
      }
    }

    for (const [inputName, sourceRef] of Object.entries(nodeInputs)) {
      const sourceNodeInstanceName = resolveSourceNodeInstanceName(
        sourceRef,
        rawNodeByInstanceName,
      );

      if (sourceNodeInstanceName === null) {
        issues.push({
          message: `node [${parsedNode.displayName}] input [${inputName}] is connected to [${sourceRef}], but that source does not resolve to any node instance in this graph.`,
          inputName,
          nodeInstanceName: parsedNode.displayName,
        });
        continue;
      }

      const sourceParsedNode = parsedNodeByInstanceName.get(
        sourceNodeInstanceName,
      );

      if (sourceParsedNode === undefined) {
        continue;
      }

      if (sourceParsedNode.outputType === null) {
        issues.push({
          message: `node [${parsedNode.displayName}] input [${inputName}] is connected to node [${sourceNodeInstanceName}], but node [${sourceNodeInstanceName}] does not expose an output value.`,
          inputName,
          nodeInstanceName: parsedNode.displayName,
          sourceNodeInstanceName,
        });
        continue;
      }

      if (graphNode.kind !== "glFragColor" && graphNode.kind !== "custom") {
        continue;
      }

      if (graphNode.kind === "custom") {
        const expectedInputType = parsedNode.inputTypes.get(inputName);

        if (expectedInputType === undefined) {
          const availableInputs = Array.from(parsedNode.inputTypes.keys()).join(
            ", ",
          );

          issues.push({
            message: `node [${graphNode.instanceName}] declares a graph input [${inputName}], but function [${graphNode.instanceName}Node] in [${graphNode.filepath}] has no parameter with that name. Available inputs: ${availableInputs || "none"}.`,
            inputName,
            nodeInstanceName: graphNode.instanceName,
            sourceNodeInstanceName,
          });
          continue;
        }

        if (expectedInputType !== sourceParsedNode.outputType) {
          issues.push({
            message: `node [${graphNode.instanceName}] has input [${inputName}] of type [${expectedInputType}], it is connected to node [${sourceNodeInstanceName}] which has an output type of [${sourceParsedNode.outputType}]. [${expectedInputType}] != [${sourceParsedNode.outputType}].`,
            inputName,
            nodeInstanceName: graphNode.instanceName,
            sourceNodeInstanceName,
          });
          continue;
        }
      }

      parsedEdges.push({
        sourceNode: sourceParsedNode,
        sourceRef,
        targetInputName: inputName,
        targetNode: parsedNode,
        valueType: sourceParsedNode.outputType,
      });
    }
  }

  if (issues.length > 0) {
    return {
      graph: null,
      issues,
      ok: false,
    };
  }

  return {
    graph: {
      edges: parsedEdges,
      nodeByInstanceName: parsedNodeByInstanceName,
      nodes: parsedNodes,
      sourceGraph: graph,
    },
    issues: [],
    ok: true,
  };
};

export const parseGraphOrThrow = async (
  graph: DagGraph,
  options: GraphParseOptions = {},
): Promise<ParsedDagGraph> => {
  const result = await parseGraph(graph, options);

  if (!result.ok) {
    throw new GraphParseError(result.issues);
  }

  return result.graph;
};
