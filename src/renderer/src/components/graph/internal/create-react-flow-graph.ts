import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type NodeTypes } from "@xyflow/react";
import type {
  GraphUniformValue,
  GraphUniformValues,
  ValidatedGraph,
  ValidatedGraphNode,
  ValidatedTimeNode,
  ValidatedUniformNode,
} from "../graph-types";
import {
  areGlslValuesEqual,
  getGlslVectorComponentNames,
} from "./glsl-type-registry";
import {
  type CustomGraphFlowNode,
  CustomGraphNode,
  type GlFragColorGraphFlowNode,
  GlFragColorGraphNode,
  GRAPH_NODE_OUTPUT_HANDLE_ID,
  type TimeGraphFlowNode,
  TimeGraphNode,
  type UniformGraphFlowNode,
  UniformGraphNode,
  type VaryingGraphFlowNode,
  VaryingGraphNode,
} from "./nodes";

const NODE_WIDTH = 240;
const BASE_NODE_HEIGHT = 88;
const INPUT_ROW_HEIGHT = 40;
const DETAIL_ROW_HEIGHT = 28;
const CONTROL_ROW_HEIGHT = 44;
const CONTROL_ROW_GAP_HEIGHT = 8;
const SECTION_GAP_HEIGHT = 20;

type FlowGraphNode =
  | CustomGraphFlowNode
  | GlFragColorGraphFlowNode
  | TimeGraphFlowNode
  | UniformGraphFlowNode
  | VaryingGraphFlowNode;

type CreateReactFlowGraphOptions = {
  readonly onUniformValueChange: (
    uniformBindingKey: string,
    value: GraphUniformValue,
  ) => void;
};

export const graphNodeTypes = {
  custom: CustomGraphNode,
  glFragColor: GlFragColorGraphNode,
  time: TimeGraphNode,
  uniform: UniformGraphNode,
  varying: VaryingGraphNode,
} satisfies NodeTypes;

const getRenderedInputCount = (node: ValidatedGraphNode): number => {
  switch (node.kind) {
    case "custom":
      return node.signature.inputTypes.size;
    case "glFragColor":
      return 1;
    case "time":
    case "uniform":
    case "varying":
      return 0;
  }
};

const getRenderedDetailCount = (_node: ValidatedGraphNode): number => 1;

const getRenderedControlRowCount = (node: ValidatedGraphNode): number => {
  if (node.kind !== "uniform") {
    return 0;
  }

  switch (node.editor.kind) {
    case "checkbox":
    case "color":
    case "number":
    case "slider":
      return 1;
    case "vector":
      return getGlslVectorComponentNames(node.outputType).length;
  }
};

const getRenderedControlHeight = (node: ValidatedGraphNode): number => {
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
  const inputCount = getRenderedInputCount(node);
  const detailCount = getRenderedDetailCount(node);
  const controlHeight = getRenderedControlHeight(node);

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
): dagre.graphlib.Graph => {
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

const getUniformNodeValue = (
  node: ValidatedUniformNode,
  uniformValues: GraphUniformValues,
): GraphUniformValue =>
  uniformValues[node.uniformBindingKey] ?? node.defaultValue;

const createTimeNodeData = (node: ValidatedTimeNode) => ({
  node,
});

const createFlowNode = (
  node: ValidatedGraphNode,
  position: { x: number; y: number },
  options: CreateReactFlowGraphOptions,
): FlowGraphNode => {
  const baseNode = createBaseNode(node.flowId, position);

  switch (node.kind) {
    case "uniform":
      return {
        ...baseNode,
        data: {
          node,
          onValueChange: (nextValue: GraphUniformValue) => {
            options.onUniformValueChange(node.uniformBindingKey, nextValue);
          },
          value: node.defaultValue,
        },
        type: "uniform",
      };
    case "custom":
      return {
        ...baseNode,
        data: {
          node,
        },
        type: "custom",
      };
    case "glFragColor":
      return {
        ...baseNode,
        data: {
          node,
        },
        type: "glFragColor",
      };
    case "time":
      return {
        ...baseNode,
        data: createTimeNodeData(node),
        type: "time",
      };
    case "varying":
      return {
        ...baseNode,
        data: {
          node,
        },
        type: "varying",
      };
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
  options: CreateReactFlowGraphOptions,
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

export const createReactFlowGraph = (
  validatedGraph: ValidatedGraph,
  options: CreateReactFlowGraphOptions,
): { edges: Edge[]; nodes: FlowGraphNode[] } => {
  const edges = createFlowEdges(validatedGraph);
  const nodes = createFlowNodes(validatedGraph, edges, options);

  return { edges, nodes };
};

export const syncReactFlowGraphUniformValues = (
  nodes: readonly FlowGraphNode[],
  uniformValues: GraphUniformValues,
): FlowGraphNode[] =>
  nodes.map((node) => {
    if (node.type !== "uniform") {
      return node;
    }

    const nextValue = getUniformNodeValue(node.data.node, uniformValues);

    if (areGlslValuesEqual(node.data.value, nextValue)) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        value: nextValue,
      },
    };
  });

export const syncReactFlowGraphSubgraphPreviews = (
  nodes: readonly FlowGraphNode[],
  subgraphPreviews: ReadonlyMap<string, string>,
): FlowGraphNode[] =>
  nodes.map((node): FlowGraphNode => {
    if (node.type !== "custom") {
      return node;
    }

    const nextPreviewDataUrl = subgraphPreviews.get(node.id);

    if (nextPreviewDataUrl === node.data.previewDataUrl) {
      return node;
    }

    return {
      ...node,
      data: { ...node.data, previewDataUrl: nextPreviewDataUrl },
    };
  });
