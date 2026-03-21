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

type CompileFragmentShaderOptions = {
  readonly loadCustomNodeSource?: GraphSourceLoader;
};

export type CompiledFragmentShaderUniform = {
  readonly name: string;
  readonly type: GlslValueType;
};

type CompileFragmentShaderResult =
  | {
      readonly errors: readonly [];
      readonly ok: true;
      readonly shaderSource: string;
      readonly uniforms: readonly CompiledFragmentShaderUniform[];
    }
  | {
      readonly errors: readonly string[];
      readonly ok: false;
      readonly shaderSource: null;
      readonly uniforms: readonly [];
    };

const GLSL_IDENTIFIER_PATTERN = /^[A-Za-z_]\w*$/;

const sanitizeIdentifierSegment = (value: string): string => {
  const sanitizedValue = value.replace(/[^A-Za-z0-9_]/g, "_");

  if (sanitizedValue.length === 0) {
    return "node";
  }

  return /^[A-Za-z_]/.test(sanitizedValue)
    ? sanitizedValue
    : `_${sanitizedValue}`;
};

const createCompiledNodeVariableName = (
  node: ValidatedGraphNode,
  index: number,
): string => `node_${sanitizeIdentifierSegment(node.flowId)}_${index}`;

const createIncomingEdgesByTargetNodeId = (
  graph: ValidatedGraph,
): ReadonlyMap<string, readonly ValidatedGraphEdge[]> => {
  const incomingEdgesByTargetNodeId = new Map<string, ValidatedGraphEdge[]>();

  for (const edge of graph.edges) {
    const incomingEdges =
      incomingEdgesByTargetNodeId.get(edge.targetNode.flowId) ?? [];

    incomingEdges.push(edge);
    incomingEdgesByTargetNodeId.set(edge.targetNode.flowId, incomingEdges);
  }

  return incomingEdgesByTargetNodeId;
};

const createIncomingEdgeMapByTargetInput = (
  graph: ValidatedGraph,
): ReadonlyMap<string, ReadonlyMap<string, ValidatedGraphEdge>> => {
  const edgeMap = new Map<string, Map<string, ValidatedGraphEdge>>();

  for (const edge of graph.edges) {
    const targetInputMap = edgeMap.get(edge.targetNode.flowId) ?? new Map();

    targetInputMap.set(edge.targetInputName, edge);
    edgeMap.set(edge.targetNode.flowId, targetInputMap);
  }

  return edgeMap;
};

const createOutputEdge = (
  graph: ValidatedGraph,
): { edge: ValidatedGraphEdge | null; errors: string[] } => {
  const outputNodes = graph.nodes.filter(
    (node) => node.definition.kind === "glFragColor",
  );

  if (outputNodes.length === 0) {
    return {
      edge: null,
      errors: [
        "graph does not contain a [glFragColor] node. Fragment shader compilation requires exactly one output node.",
      ],
    };
  }

  if (outputNodes.length > 1) {
    return {
      edge: null,
      errors: [
        `graph contains ${outputNodes.length} [glFragColor] nodes. Fragment shader compilation requires exactly one output node.`,
      ],
    };
  }

  const [outputNode] = outputNodes;
  const outputEdges = graph.edges.filter(
    (edge) =>
      edge.targetNode.flowId === outputNode.flowId &&
      edge.targetInputName === "color",
  );

  if (outputEdges.length === 0) {
    return {
      edge: null,
      errors: [
        "node [gl_FragColor] is missing a [color] connection. Fragment shader compilation requires one final color source.",
      ],
    };
  }

  if (outputEdges.length > 1) {
    return {
      edge: null,
      errors: [
        `node [gl_FragColor] has ${outputEdges.length} [color] connections. Fragment shader compilation requires exactly one final color source.`,
      ],
    };
  }

  return {
    edge: outputEdges[0],
    errors: [],
  };
};

const collectReachableNodeIds = (
  graph: ValidatedGraph,
  outputEdge: ValidatedGraphEdge,
): ReadonlySet<string> => {
  const incomingEdgesByTargetNodeId = createIncomingEdgesByTargetNodeId(graph);
  const reachableNodeIds = new Set<string>([
    outputEdge.targetNode.flowId,
    outputEdge.sourceNode.flowId,
  ]);
  const pendingNodeIds = [outputEdge.sourceNode.flowId];

  while (pendingNodeIds.length > 0) {
    const currentNodeId = pendingNodeIds.pop();

    if (currentNodeId === undefined) {
      continue;
    }

    for (const incomingEdge of incomingEdgesByTargetNodeId.get(currentNodeId) ??
      []) {
      if (reachableNodeIds.has(incomingEdge.sourceNode.flowId)) {
        continue;
      }

      reachableNodeIds.add(incomingEdge.sourceNode.flowId);
      pendingNodeIds.push(incomingEdge.sourceNode.flowId);
    }
  }

  return reachableNodeIds;
};

const topologicallySortReachableNodes = (
  graph: ValidatedGraph,
  reachableNodeIds: ReadonlySet<string>,
): { errors: string[]; nodes: ValidatedGraphNode[] } => {
  const relevantNodes = graph.nodes.filter(
    (node) =>
      reachableNodeIds.has(node.flowId) &&
      node.definition.kind !== "glFragColor",
  );
  const relevantNodeIdSet = new Set(relevantNodes.map((node) => node.flowId));
  const orderIndexByFlowId = new Map(
    graph.nodes.map((node, index) => [node.flowId, index]),
  );
  const indegreeByNodeId = new Map<string, number>(
    relevantNodes.map((node) => [node.flowId, 0]),
  );
  const outgoingEdgesBySourceNodeId = new Map<string, ValidatedGraphEdge[]>();

  for (const edge of graph.edges) {
    if (
      !relevantNodeIdSet.has(edge.sourceNode.flowId) ||
      !relevantNodeIdSet.has(edge.targetNode.flowId)
    ) {
      continue;
    }

    const outgoingEdges =
      outgoingEdgesBySourceNodeId.get(edge.sourceNode.flowId) ?? [];

    outgoingEdges.push(edge);
    outgoingEdgesBySourceNodeId.set(edge.sourceNode.flowId, outgoingEdges);
    indegreeByNodeId.set(
      edge.targetNode.flowId,
      (indegreeByNodeId.get(edge.targetNode.flowId) ?? 0) + 1,
    );
  }

  const pendingNodes = relevantNodes
    .filter((node) => (indegreeByNodeId.get(node.flowId) ?? 0) === 0)
    .sort(
      (left, right) =>
        (orderIndexByFlowId.get(left.flowId) ?? 0) -
        (orderIndexByFlowId.get(right.flowId) ?? 0),
    );
  const orderedNodes: ValidatedGraphNode[] = [];

  while (pendingNodes.length > 0) {
    const currentNode = pendingNodes.shift();

    if (currentNode === undefined) {
      continue;
    }

    orderedNodes.push(currentNode);

    for (const edge of outgoingEdgesBySourceNodeId.get(currentNode.flowId) ??
      []) {
      const nextIndegree =
        (indegreeByNodeId.get(edge.targetNode.flowId) ?? 0) - 1;

      indegreeByNodeId.set(edge.targetNode.flowId, nextIndegree);

      if (nextIndegree === 0) {
        pendingNodes.push(edge.targetNode);
        pendingNodes.sort(
          (left, right) =>
            (orderIndexByFlowId.get(left.flowId) ?? 0) -
            (orderIndexByFlowId.get(right.flowId) ?? 0),
        );
      }
    }
  }

  if (orderedNodes.length === relevantNodes.length) {
    return {
      errors: [],
      nodes: orderedNodes,
    };
  }

  const remainingNodes = relevantNodes
    .filter(
      (node) => !orderedNodes.some((ordered) => ordered.flowId === node.flowId),
    )
    .map((node) => `[${node.displayName}]`)
    .join(", ");

  return {
    errors: [
      `graph contains a cycle or unresolved dependency between nodes ${remainingNodes}. Fragment shader compilation requires an acyclic graph.`,
    ],
    nodes: [],
  };
};

const coerceExpressionToFragmentColor = (
  expression: string,
  valueType: GlslValueType,
): string => {
  switch (valueType) {
    case "bool":
      return `vec4(vec3(${expression} ? 1.0 : 0.0), 1.0)`;
    case "float":
      return `vec4(vec3(${expression}), 1.0)`;
    case "int":
      return `vec4(vec3(float(${expression})), 1.0)`;
    case "vec2":
      return `vec4(${expression}, 0.0, 1.0)`;
    case "vec3":
      return `vec4(${expression}, 1.0)`;
    case "vec4":
      return expression;
  }
};

const collectUniforms = (
  graph: ValidatedGraph,
): { errors: string[]; uniforms: CompiledFragmentShaderUniform[] } => {
  const uniforms: CompiledFragmentShaderUniform[] = [];
  const uniformByName = new Map<string, CompiledFragmentShaderUniform>();
  const errors: string[] = [];

  for (const node of graph.nodes) {
    if (
      !("uniformName" in node.definition) ||
      node.outputType === null ||
      node.uniformBindingKey === null
    ) {
      continue;
    }

    if (!GLSL_IDENTIFIER_PATTERN.test(node.definition.uniformName)) {
      errors.push(
        `node [${node.displayName}] uses uniform name [${node.definition.uniformName}], but that is not a valid GLSL identifier.`,
      );
      continue;
    }

    if (!uniformByName.has(node.uniformBindingKey)) {
      const uniform = {
        name: node.uniformBindingKey,
        type: node.outputType,
      } satisfies CompiledFragmentShaderUniform;

      uniformByName.set(node.uniformBindingKey, uniform);
      uniforms.push(uniform);
    }
  }

  return { errors, uniforms };
};

export const compileFragmentShader = async (
  graph: ValidatedGraph,
  options: CompileFragmentShaderOptions = {},
): Promise<CompileFragmentShaderResult> => {
  const errors: string[] = [];
  const { edge: outputEdge, errors: outputErrors } = createOutputEdge(graph);

  errors.push(...outputErrors);

  const { uniforms, errors: uniformErrors } = collectUniforms(graph);

  errors.push(...uniformErrors);

  if (outputEdge === null || errors.length > 0) {
    return {
      errors,
      ok: false,
      shaderSource: null,
      uniforms: [],
    };
  }

  const reachableNodeIds = collectReachableNodeIds(graph, outputEdge);
  const { errors: topologicalErrors, nodes: orderedNodes } =
    topologicallySortReachableNodes(graph, reachableNodeIds);

  errors.push(...topologicalErrors);

  if (errors.length > 0) {
    return {
      errors,
      ok: false,
      shaderSource: null,
      uniforms: [],
    };
  }

  const incomingEdgeMapByTargetInput =
    createIncomingEdgeMapByTargetInput(graph);
  const expressionByNodeId = new Map<string, string>();
  const customNodeSourceByFilepath = new Map<string, string>();
  const mainStatements: string[] = [];

  for (const [index, node] of orderedNodes.entries()) {
    if ("uniformName" in node.definition) {
      expressionByNodeId.set(node.flowId, node.definition.uniformName);
      continue;
    }

    if (node.definition.kind !== "custom" || node.outputType === null) {
      continue;
    }

    let source: string;

    try {
      source = await loadResolvedCustomNodeSource(
        node.definition,
        options.loadCustomNodeSource,
      );
    } catch (error) {
      errors.push(
        `node [${node.displayName}] could not load custom node source from [${node.definition.filepath}] during fragment shader compilation. ${error instanceof Error ? error.message : "Unknown error."}`,
      );
      continue;
    }

    const { availableFunctions, expectedFunctionName, signature } =
      matchCustomNodeSignature(node.definition, source);

    if (signature === null) {
      errors.push(
        `node [${node.displayName}] could not resolve a callable GLSL function from [${node.definition.filepath}] during fragment shader compilation. Expected a function named [${expectedFunctionName}] or a file with exactly one supported GLSL function. Available functions: ${availableFunctions}.`,
      );
      continue;
    }

    if (!customNodeSourceByFilepath.has(node.definition.filepath)) {
      customNodeSourceByFilepath.set(node.definition.filepath, source.trim());
    }

    const incomingEdgesByInputName =
      incomingEdgeMapByTargetInput.get(node.flowId) ?? new Map();
    const callArguments: string[] = [];

    for (const [inputName] of signature.inputTypes.entries()) {
      const inputEdge = incomingEdgesByInputName.get(inputName);

      if (inputEdge === undefined) {
        errors.push(
          `node [${node.displayName}] is missing a compiled source for input [${inputName}]. The validated graph should have provided this connection.`,
        );
        continue;
      }

      const sourceExpression = expressionByNodeId.get(
        inputEdge.sourceNode.flowId,
      );

      if (sourceExpression === undefined) {
        errors.push(
          `node [${node.displayName}] depends on node [${inputEdge.sourceNode.displayName}], but that value was not available when fragment shader compilation reached [${node.displayName}].`,
        );
        continue;
      }

      callArguments.push(sourceExpression);
    }

    if (errors.length > 0) {
      continue;
    }

    const outputVariableName = createCompiledNodeVariableName(node, index);

    mainStatements.push(
      `${node.outputType} ${outputVariableName} = ${signature.name}(${callArguments.join(", ")});`,
    );
    expressionByNodeId.set(node.flowId, outputVariableName);
  }

  if (errors.length > 0) {
    return {
      errors,
      ok: false,
      shaderSource: null,
      uniforms: [],
    };
  }

  const finalExpression = expressionByNodeId.get(outputEdge.sourceNode.flowId);

  if (finalExpression === undefined) {
    return {
      errors: [
        `node [gl_FragColor] is connected to node [${outputEdge.sourceNode.displayName}], but no compiled expression was produced for that source.`,
      ],
      ok: false,
      shaderSource: null,
      uniforms: [],
    };
  }

  const functionBlocks = Array.from(customNodeSourceByFilepath.values());
  const shaderSections = [
    ...uniforms.map((uniform) => `uniform ${uniform.type} ${uniform.name};`),
    "varying vec2 vUv;",
    functionBlocks.length > 0 ? "" : null,
    ...functionBlocks.flatMap((source, index) =>
      index === functionBlocks.length - 1 ? [source] : [source, ""],
    ),
    functionBlocks.length > 0 ? "" : null,
    "void main() {",
    ...mainStatements.map((statement) => `  ${statement}`),
    `  gl_FragColor = ${coerceExpressionToFragmentColor(finalExpression, outputEdge.valueType)};`,
    "}",
  ].filter((section): section is string => section !== null);

  return {
    errors: [],
    ok: true,
    shaderSource: shaderSections.join("\n"),
    uniforms,
  };
};
