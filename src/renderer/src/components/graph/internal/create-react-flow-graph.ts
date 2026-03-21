import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type NodeTypes } from "@xyflow/react";
import type {
  GraphInputValue,
  ValidatedGraph,
  ValidatedGraphNode,
} from "../graph-types";
import type {
  ColorValue,
  GraphNodeDefinition,
  Vec2Value,
  Vec3Value,
  Vec4Value,
} from "./json-schema";
import {
  type BoolGraphFlowNode,
  BoolGraphNode,
  type BoolGraphNodeData,
  type ColorGraphFlowNode,
  ColorGraphNode,
  type ColorGraphNodeData,
  type CustomGraphFlowNode,
  CustomGraphNode,
  type CustomGraphNodeData,
  type FloatGraphFlowNode,
  FloatGraphNode,
  type FloatGraphNodeData,
  type GlFragColorGraphFlowNode,
  GlFragColorGraphNode,
  type GlFragColorGraphNodeData,
  GRAPH_NODE_OUTPUT_HANDLE_ID,
  type IntGraphFlowNode,
  IntGraphNode,
  type IntGraphNodeData,
  type Vec2GraphFlowNode,
  Vec2GraphNode,
  type Vec2GraphNodeData,
  type Vec3GraphFlowNode,
  Vec3GraphNode,
  type Vec3GraphNodeData,
  type Vec4GraphFlowNode,
  Vec4GraphNode,
  type Vec4GraphNodeData,
} from "./nodes";

const NODE_WIDTH = 240;
const BASE_NODE_HEIGHT = 88;
const INPUT_ROW_HEIGHT = 40;
const DETAIL_ROW_HEIGHT = 28;
const CONTROL_ROW_HEIGHT = 44;
const CONTROL_ROW_GAP_HEIGHT = 8;
const SECTION_GAP_HEIGHT = 20;

type FlowGraphNode =
  | BoolGraphFlowNode
  | ColorGraphFlowNode
  | CustomGraphFlowNode
  | FloatGraphFlowNode
  | GlFragColorGraphFlowNode
  | IntGraphFlowNode
  | Vec2GraphFlowNode
  | Vec3GraphFlowNode
  | Vec4GraphFlowNode;

type UniformBindingValue = boolean | number | Vec2Value | Vec3Value | Vec4Value;

type CreateFlowElementsOptions = {
  readonly onInputValueChange: (flowId: string, value: GraphInputValue) => void;
};

export const graphNodeTypes = {
  bool: BoolGraphNode,
  color: ColorGraphNode,
  custom: CustomGraphNode,
  float: FloatGraphNode,
  glFragColor: GlFragColorGraphNode,
  int: IntGraphNode,
  vec2: Vec2GraphNode,
  vec3: Vec3GraphNode,
  vec4: Vec4GraphNode,
} satisfies NodeTypes;

const getRenderedInputs = (
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

const getRenderedDetailCount = (node: GraphNodeDefinition): number => {
  switch (node.kind) {
    case "bool":
    case "color":
    case "custom":
    case "float":
    case "glFragColor":
    case "int":
    case "vec2":
    case "vec3":
    case "vec4":
      return 1;
  }
};

const getRenderedControlRowCount = (node: GraphNodeDefinition): number => {
  switch (node.kind) {
    case "bool":
    case "color":
    case "float":
    case "int":
      return 1;
    case "custom":
    case "glFragColor":
      return 0;
    case "vec2":
      return 2;
    case "vec3":
      return 3;
    case "vec4":
      return 4;
  }
};

const getRenderedControlHeight = (node: GraphNodeDefinition): number => {
  const controlRowCount = getRenderedControlRowCount(node);

  if (controlRowCount === 0) {
    return 0;
  }

  return (
    controlRowCount * CONTROL_ROW_HEIGHT +
    (controlRowCount - 1) * CONTROL_ROW_GAP_HEIGHT
  );
};

const getEstimatedNodeHeight = (node: ValidatedGraphNode): number => {
  const inputCount = Object.keys(getRenderedInputs(node.definition)).length;
  const detailCount = getRenderedDetailCount(node.definition);
  const controlHeight = getRenderedControlHeight(node.definition);

  let height =
    BASE_NODE_HEIGHT +
    inputCount * INPUT_ROW_HEIGHT +
    detailCount * DETAIL_ROW_HEIGHT +
    controlHeight;

  if (inputCount > 0 && detailCount > 0) {
    height += SECTION_GAP_HEIGHT;
  }

  if ((inputCount > 0 || detailCount > 0) && controlHeight > 0) {
    height += SECTION_GAP_HEIGHT;
  }

  return height;
};

const createDagreGraph = (
  validatedGraph: ValidatedGraph,
  edges: readonly Edge[],
) => {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    marginx: 24,
    marginy: 24,
    nodesep: 72,
    rankdir: "LR",
    ranksep: 120,
  });

  for (const node of validatedGraph.nodes) {
    dagreGraph.setNode(node.flowId, {
      height: getEstimatedNodeHeight(node),
      width: NODE_WIDTH,
    });
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  return dagreGraph;
};

const createBaseNode = (
  flowId: string,
  position: { x: number; y: number },
) => ({
  connectable: false,
  draggable: false,
  focusable: false,
  id: flowId,
  position,
  selectable: false,
  style: {
    pointerEvents: "all" as const,
    width: NODE_WIDTH,
  },
});

const cloneColorValue = (value: ColorValue): ColorValue => ({
  a: value.a,
  b: value.b,
  g: value.g,
  r: value.r,
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

const colorValueToVec4Value = (value: ColorValue): Vec4Value => ({
  w: value.a,
  x: value.r,
  y: value.g,
  z: value.b,
});

const vec4ValueToColorValue = (value: Vec4Value): ColorValue => ({
  a: value.w,
  b: value.z,
  g: value.y,
  r: value.x,
});

const createInputValueChangeHandler =
  <Value>(
    flowId: string,
    options: CreateFlowElementsOptions,
  ): ((nextValue: Value) => void) =>
  (nextValue) => {
    options.onInputValueChange(flowId, nextValue as GraphInputValue);
  };

const replaceNodeData = <NodeType extends FlowGraphNode>(
  node: NodeType,
  data: NodeType["data"],
): NodeType => ({
  ...node,
  data,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isColorValue = (value: unknown): value is ColorValue =>
  isRecord(value) &&
  typeof value.r === "number" &&
  typeof value.g === "number" &&
  typeof value.b === "number" &&
  typeof value.a === "number";

const isVec2Value = (value: unknown): value is Vec2Value =>
  isRecord(value) && typeof value.x === "number" && typeof value.y === "number";

const isVec3Value = (value: unknown): value is Vec3Value =>
  isRecord(value) &&
  typeof value.x === "number" &&
  typeof value.y === "number" &&
  typeof value.z === "number";

const isVec4Value = (value: unknown): value is Vec4Value =>
  isRecord(value) &&
  typeof value.x === "number" &&
  typeof value.y === "number" &&
  typeof value.z === "number" &&
  typeof value.w === "number";

const isInteractiveFlowNode = (
  node: FlowGraphNode,
): node is Exclude<
  FlowGraphNode,
  CustomGraphFlowNode | GlFragColorGraphFlowNode
> => node.type !== "custom" && node.type !== "glFragColor";

const toUniformBindingValue = (
  node: Exclude<FlowGraphNode, CustomGraphFlowNode | GlFragColorGraphFlowNode>,
  value: GraphInputValue,
): UniformBindingValue | null => {
  switch (node.type) {
    case "bool":
      return typeof value === "boolean" ? value : null;
    case "color":
      return isColorValue(value) ? colorValueToVec4Value(value) : null;
    case "float":
    case "int":
      return typeof value === "number" ? value : null;
    case "vec2":
      return isVec2Value(value) ? cloneVec2Value(value) : null;
    case "vec3":
      return isVec3Value(value) ? cloneVec3Value(value) : null;
    case "vec4":
      return isVec4Value(value) ? cloneVec4Value(value) : null;
  }
};

const applyUniformBindingValue = (
  node: Exclude<FlowGraphNode, CustomGraphFlowNode | GlFragColorGraphFlowNode>,
  value: UniformBindingValue,
): FlowGraphNode => {
  switch (node.type) {
    case "bool":
      return typeof value === "boolean"
        ? replaceNodeData(node, { ...node.data, value })
        : node;
    case "color":
      return isVec4Value(value)
        ? replaceNodeData(node, {
            ...node.data,
            value: vec4ValueToColorValue(value),
          })
        : node;
    case "float":
    case "int":
      return typeof value === "number"
        ? replaceNodeData(node, { ...node.data, value })
        : node;
    case "vec2":
      return isVec2Value(value)
        ? replaceNodeData(node, {
            ...node.data,
            value: cloneVec2Value(value),
          })
        : node;
    case "vec3":
      return isVec3Value(value)
        ? replaceNodeData(node, {
            ...node.data,
            value: cloneVec3Value(value),
          })
        : node;
    case "vec4":
      return isVec4Value(value)
        ? replaceNodeData(node, {
            ...node.data,
            value: cloneVec4Value(value),
          })
        : node;
  }
};

const createFlowNode = (
  node: ValidatedGraphNode,
  position: { x: number; y: number },
  options: CreateFlowElementsOptions,
): FlowGraphNode => {
  const baseNode = createBaseNode(node.flowId, position);

  switch (node.definition.kind) {
    case "bool": {
      const data: BoolGraphNodeData = {
        definition: node.definition,
        onValueChange: createInputValueChangeHandler<boolean>(
          node.flowId,
          options,
        ),
        uniformBindingKey: node.uniformBindingKey ?? node.flowId,
        value: node.definition.defaultValue,
      };

      return {
        ...baseNode,
        data,
        type: "bool",
      };
    }
    case "color": {
      const data: ColorGraphNodeData = {
        definition: node.definition,
        onValueChange: createInputValueChangeHandler<ColorValue>(
          node.flowId,
          options,
        ),
        uniformBindingKey: node.uniformBindingKey ?? node.flowId,
        value: cloneColorValue(node.definition.defaultValue),
      };

      return {
        ...baseNode,
        data,
        type: "color",
      };
    }
    case "custom": {
      const data: CustomGraphNodeData = {
        definition: node.definition,
      };

      return {
        ...baseNode,
        data,
        type: "custom",
      };
    }
    case "float": {
      const data: FloatGraphNodeData = {
        definition: node.definition,
        onValueChange: createInputValueChangeHandler<number>(
          node.flowId,
          options,
        ),
        uniformBindingKey: node.uniformBindingKey ?? node.flowId,
        value: node.definition.defaultValue,
      };

      return {
        ...baseNode,
        data,
        type: "float",
      };
    }
    case "glFragColor": {
      const data: GlFragColorGraphNodeData = {
        definition: node.definition,
      };

      return {
        ...baseNode,
        data,
        type: "glFragColor",
      };
    }
    case "int": {
      const data: IntGraphNodeData = {
        definition: node.definition,
        onValueChange: createInputValueChangeHandler<number>(
          node.flowId,
          options,
        ),
        uniformBindingKey: node.uniformBindingKey ?? node.flowId,
        value: node.definition.defaultValue,
      };

      return {
        ...baseNode,
        data,
        type: "int",
      };
    }
    case "vec2": {
      const data: Vec2GraphNodeData = {
        definition: node.definition,
        onValueChange: createInputValueChangeHandler<Vec2Value>(
          node.flowId,
          options,
        ),
        uniformBindingKey: node.uniformBindingKey ?? node.flowId,
        value: cloneVec2Value(node.definition.defaultValue),
      };

      return {
        ...baseNode,
        data,
        type: "vec2",
      };
    }
    case "vec3": {
      const data: Vec3GraphNodeData = {
        definition: node.definition,
        onValueChange: createInputValueChangeHandler<Vec3Value>(
          node.flowId,
          options,
        ),
        uniformBindingKey: node.uniformBindingKey ?? node.flowId,
        value: cloneVec3Value(node.definition.defaultValue),
      };

      return {
        ...baseNode,
        data,
        type: "vec3",
      };
    }
    case "vec4": {
      const data: Vec4GraphNodeData = {
        definition: node.definition,
        onValueChange: createInputValueChangeHandler<Vec4Value>(
          node.flowId,
          options,
        ),
        uniformBindingKey: node.uniformBindingKey ?? node.flowId,
        value: cloneVec4Value(node.definition.defaultValue),
      };

      return {
        ...baseNode,
        data,
        type: "vec4",
      };
    }
  }
};

const createFlowEdges = (validatedGraph: ValidatedGraph): Edge[] =>
  validatedGraph.edges.map((edge, index) => ({
    id: `${edge.sourceNode.flowId}->${edge.targetNode.flowId}:${edge.targetInputName}:${index}`,
    interactionWidth: 28,
    markerEnd: { type: MarkerType.ArrowClosed },
    selectable: false,
    source: edge.sourceNode.flowId,
    sourceHandle: GRAPH_NODE_OUTPUT_HANDLE_ID,
    target: edge.targetNode.flowId,
    targetHandle: edge.targetInputName,
    type: "default",
  }));

const createFlowNodes = (
  validatedGraph: ValidatedGraph,
  edges: readonly Edge[],
  options: CreateFlowElementsOptions,
): FlowGraphNode[] => {
  const dagreGraph = createDagreGraph(validatedGraph, edges);

  return validatedGraph.nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.flowId);
    const height = getEstimatedNodeHeight(node);

    return createFlowNode(
      node,
      {
        x: (dagreNode.x as number) - NODE_WIDTH / 2,
        y: (dagreNode.y as number) - height / 2,
      },
      options,
    );
  });
};

export const createFlowElements = (
  validatedGraph: ValidatedGraph,
  options: CreateFlowElementsOptions,
): { edges: Edge[]; nodes: FlowGraphNode[] } => {
  const edges = createFlowEdges(validatedGraph);
  const nodes = createFlowNodes(validatedGraph, edges, options);

  return { edges, nodes };
};

export const updateFlowNodeValue = (
  nodes: readonly FlowGraphNode[],
  flowId: string,
  value: GraphInputValue,
): FlowGraphNode[] =>
  (() => {
    const sourceNode = nodes.find(
      (
        node,
      ): node is Exclude<
        FlowGraphNode,
        CustomGraphFlowNode | GlFragColorGraphFlowNode
      > => node.id === flowId && isInteractiveFlowNode(node),
    );

    if (sourceNode === undefined) {
      return [...nodes];
    }

    const bindingValue = toUniformBindingValue(sourceNode, value);

    if (bindingValue === null) {
      return [...nodes];
    }

    return nodes.map<FlowGraphNode>((node) => {
      if (
        !isInteractiveFlowNode(node) ||
        node.data.uniformBindingKey !== sourceNode.data.uniformBindingKey
      ) {
        return node;
      }

      return applyUniformBindingValue(node, bindingValue);
    });
  })();
