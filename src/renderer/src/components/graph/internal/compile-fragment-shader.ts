import type {
  GlslValueType,
  ValidatedCustomNode,
  ValidatedGraph,
  ValidatedGraphEdge,
  ValidatedGraphNode,
  ValidatedValueNode,
} from "../graph-types";

export type CompiledFragmentShaderUniform = {
  readonly name: string;
  readonly type: GlslValueType;
};

type CompiledFragmentShaderTimeUniform = {
  readonly name: string;
  readonly type: "float";
};

type CompiledFragmentShaderVarying = {
  readonly name: string;
  readonly type: GlslValueType;
};

export type CompileFragmentShaderResult =
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
  const outputNodes = graph.nodes.filter((node) => node.kind === "glFragColor");

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
): { errors: string[]; nodes: ValidatedValueNode[] } => {
  const relevantNodes = graph.nodes.filter(
    (node): node is ValidatedValueNode =>
      reachableNodeIds.has(node.flowId) && node.kind !== "glFragColor",
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
  const orderedNodes: ValidatedValueNode[] = [];

  while (pendingNodes.length > 0) {
    const currentNode = pendingNodes.shift();

    if (currentNode === undefined) {
      continue;
    }

    orderedNodes.push(currentNode);

    for (const edge of outgoingEdgesBySourceNodeId.get(currentNode.flowId) ??
      []) {
      if (edge.targetNode.kind === "glFragColor") {
        continue;
      }

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
  const errors: string[] = [];

  for (const uniform of graph.uniforms) {
    if (!GLSL_IDENTIFIER_PATTERN.test(uniform.key)) {
      errors.push(`uniform [${uniform.key}] is not a valid GLSL identifier.`);
      continue;
    }

    uniforms.push({
      name: uniform.key,
      type: uniform.valueType,
    });
  }

  return { errors, uniforms };
};

const collectTimeUniforms = (
  graph: ValidatedGraph,
): { errors: string[]; uniforms: CompiledFragmentShaderTimeUniform[] } => {
  const uniforms: CompiledFragmentShaderTimeUniform[] = [];
  const errors: string[] = [];

  for (const time of graph.times) {
    if (!GLSL_IDENTIFIER_PATTERN.test(time.key)) {
      errors.push(`uniform [${time.key}] is not a valid GLSL identifier.`);
      continue;
    }

    uniforms.push({
      name: time.key,
      type: time.valueType,
    });
  }

  return { errors, uniforms };
};

const collectVaryings = (
  graph: ValidatedGraph,
): { errors: string[]; varyings: CompiledFragmentShaderVarying[] } => {
  const varyings: CompiledFragmentShaderVarying[] = [];
  const errors: string[] = [];

  for (const varying of graph.varyings) {
    if (!GLSL_IDENTIFIER_PATTERN.test(varying.key)) {
      errors.push(`varying [${varying.key}] is not a valid GLSL identifier.`);
      continue;
    }

    varyings.push({
      name: varying.key,
      type: varying.valueType,
    });
  }

  return { errors, varyings };
};

const isReachableCustomNode = (
  node: ValidatedValueNode,
): node is ValidatedCustomNode => node.kind === "custom";

export const compileFragmentShader = (
  graph: ValidatedGraph,
): CompileFragmentShaderResult => {
  const errors: string[] = [];
  const { edge: outputEdge, errors: outputErrors } = createOutputEdge(graph);

  errors.push(...outputErrors);

  const { uniforms, errors: uniformErrors } = collectUniforms(graph);
  const { uniforms: timeUniforms, errors: timeUniformErrors } =
    collectTimeUniforms(graph);
  const { varyings, errors: varyingErrors } = collectVaryings(graph);

  errors.push(...uniformErrors);
  errors.push(...timeUniformErrors);
  errors.push(...varyingErrors);

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
    if (node.kind === "time") {
      expressionByNodeId.set(node.flowId, node.timeBindingKey);
      continue;
    }

    if (node.kind === "uniform") {
      expressionByNodeId.set(node.flowId, node.uniformBindingKey);
      continue;
    }

    if (node.kind === "varying") {
      expressionByNodeId.set(node.flowId, node.varyingBindingKey);
      continue;
    }

    if (!isReachableCustomNode(node)) {
      continue;
    }

    customNodeSourceByFilepath.set(
      node.definition.filepath,
      node.source.trim(),
    );

    const incomingEdgesByInputName =
      incomingEdgeMapByTargetInput.get(node.flowId) ?? new Map();
    const callArguments: string[] = [];

    for (const [inputName] of node.signature.inputTypes.entries()) {
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
      `${node.outputType} ${outputVariableName} = ${node.signature.name}(${callArguments.join(", ")});`,
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
    ...timeUniforms.map(
      (uniform) => `uniform ${uniform.type} ${uniform.name};`,
    ),
    ...uniforms.map((uniform) => `uniform ${uniform.type} ${uniform.name};`),
    ...varyings.map((varying) => `varying ${varying.type} ${varying.name};`),
    varyings.length > 0 ? "" : null,
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
    uniforms: [...timeUniforms, ...uniforms],
  };
};
