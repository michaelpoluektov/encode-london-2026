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
const SUBGRAPH_PREVIEW_HEIGHT = 120;
const PREVIEW_GAP_HEIGHT = 6;
const BASE_NODE_HEIGHT = 80;
const INPUT_ROW_HEIGHT = 34;
const DETAIL_ROW_HEIGHT = 24;
const CONTROL_ROW_HEIGHT = 38;
const CONTROL_ROW_GAP_HEIGHT = 6;
const SECTION_GAP_HEIGHT = 12;

export type FlowGraphNode =
  | CustomGraphFlowNode
  | GlFragColorGraphFlowNode
  | TimeGraphFlowNode
  | UniformGraphFlowNode
  | VaryingGraphFlowNode;

export type GraphNodeMeasurement = {
  readonly height?: number;
  readonly width?: number;
};

export type GraphNodeMeasurements = ReadonlyMap<string, GraphNodeMeasurement>;

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

  if (node.kind === "custom") {
    height += PREVIEW_GAP_HEIGHT + SUBGRAPH_PREVIEW_HEIGHT;
  }

  return height;
};

const getNodeDimensions = (
  node: ValidatedGraphNode,
  measurements?: GraphNodeMeasurements,
): { height: number; width: number } => {
  const measuredDimensions = measurements?.get(node.flowId);

  return {
    height: measuredDimensions?.height ?? getEstimatedNodeHeight(node),
    width: measuredDimensions?.width ?? NODE_WIDTH,
  };
};

const createDagreGraph = (
  validatedGraph: ValidatedGraph,
  edges: readonly Edge[],
  measurements?: GraphNodeMeasurements,
): dagre.graphlib.Graph => {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    marginx: 20,
    marginy: 20,
    nodesep: 40,
    rankdir: "LR",
    ranksep: 96,
  });

  for (const node of validatedGraph.nodes) {
    const dimensions = getNodeDimensions(node, measurements);

    dagreGraph.setNode(node.flowId, {
      height: dimensions.height,
      width: dimensions.width,
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
  options: CreateReactFlowGraphOptions,
): FlowGraphNode[] => {
  return validatedGraph.nodes.map((node) =>
    createFlowNode(node, { x: 0, y: 0 }, options),
  );
};

const createValidatedGraphNodeLookup = (
  validatedGraph: ValidatedGraph,
): ReadonlyMap<string, ValidatedGraphNode> =>
  new Map(validatedGraph.nodes.map((node) => [node.flowId, node]));

export const layoutReactFlowNodes = (
  validatedGraph: ValidatedGraph,
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  measurements?: GraphNodeMeasurements,
): FlowGraphNode[] => {
  const dagreGraph = createDagreGraph(validatedGraph, edges, measurements);
  const validatedNodes = createValidatedGraphNodeLookup(validatedGraph);

  return nodes.map((node) => {
    const validatedNode = validatedNodes.get(node.id);

    if (validatedNode === undefined) {
      return node;
    }

    const dagreNode = dagreGraph.node(node.id);
    const dimensions = getNodeDimensions(validatedNode, measurements);

    return {
      ...node,
      position: {
        x: (dagreNode.x as number) - dimensions.width / 2,
        y: (dagreNode.y as number) - dimensions.height / 2,
      },
    };
  });
};

export const createReactFlowGraph = (
  validatedGraph: ValidatedGraph,
  options: CreateReactFlowGraphOptions,
): { edges: Edge[]; nodes: FlowGraphNode[] } => {
  const edges = createFlowEdges(validatedGraph);
  const nodes = layoutReactFlowNodes(
    validatedGraph,
    createFlowNodes(validatedGraph, options),
    edges,
  );

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
