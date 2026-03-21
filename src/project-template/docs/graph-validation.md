# Graph Validation After Parsing

These excerpts mirror the implementation used by the app after `graph.json` has passed schema validation.

## Parse stage

```ts
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
```

## Validation stage

```ts
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
```
