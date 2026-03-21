import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type NodeTypes } from "@xyflow/react";
import type { ValidatedGraph, ValidatedGraphNode } from "../graph-types";
import type { GraphNodeDefinition } from "./json-schema";
import {
  type ColorGraphFlowNode,
  ColorGraphNode,
  type CustomGraphFlowNode,
  CustomGraphNode,
  type FloatGraphFlowNode,
  FloatGraphNode,
  type GlFragColorGraphFlowNode,
  GlFragColorGraphNode,
  GRAPH_NODE_OUTPUT_HANDLE_ID,
} from "./nodes";

const NODE_WIDTH = 240;
const BASE_NODE_HEIGHT = 88;
const INPUT_ROW_HEIGHT = 40;
const DETAIL_ROW_HEIGHT = 28;
const SECTION_GAP_HEIGHT = 20;

type FlowGraphNode =
  | ColorGraphFlowNode
  | CustomGraphFlowNode
  | FloatGraphFlowNode
  | GlFragColorGraphFlowNode;

export const graphNodeTypes = {
  color: ColorGraphNode,
  custom: CustomGraphNode,
  float: FloatGraphNode,
  glFragColor: GlFragColorGraphNode,
} satisfies NodeTypes;

const getRenderedInputs = (
  node: GraphNodeDefinition,
): Readonly<Record<string, string>> => {
  switch (node.kind) {
    case "custom":
      return node.inputs;
    case "glFragColor":
      return node.inputs;
    case "color":
      return {};
    case "float":
      return {};
  }
};

const getRenderedDetailCount = (node: GraphNodeDefinition): number => {
  switch (node.kind) {
    case "float":
      return node.min !== undefined || node.max !== undefined ? 2 : 1;
    case "color":
    case "custom":
    case "glFragColor":
      return 1;
  }
};

const getEstimatedNodeHeight = (node: ValidatedGraphNode): number => {
  const inputCount = Object.keys(getRenderedInputs(node.definition)).length;
  const detailCount = getRenderedDetailCount(node.definition);

  let height =
    BASE_NODE_HEIGHT +
    inputCount * INPUT_ROW_HEIGHT +
    detailCount * DETAIL_ROW_HEIGHT;

  if (inputCount > 0 && detailCount > 0) {
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

const createFlowNode = (
  node: ValidatedGraphNode,
  position: { x: number; y: number },
): FlowGraphNode => {
  const baseNode = {
    connectable: false,
    draggable: false,
    focusable: false,
    id: node.flowId,
    position,
    selectable: false,
    style: {
      width: NODE_WIDTH,
    },
  };

  switch (node.definition.kind) {
    case "color":
      return {
        ...baseNode,
        data: node.definition,
        type: "color",
      };
    case "custom":
      return {
        ...baseNode,
        data: node.definition,
        type: "custom",
      };
    case "float":
      return {
        ...baseNode,
        data: node.definition,
        type: "float",
      };
    case "glFragColor":
      return {
        ...baseNode,
        data: node.definition,
        type: "glFragColor",
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
): FlowGraphNode[] => {
  const dagreGraph = createDagreGraph(validatedGraph, edges);

  return validatedGraph.nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.flowId);
    const height = getEstimatedNodeHeight(node);

    return createFlowNode(node, {
      x: (dagreNode.x as number) - NODE_WIDTH / 2,
      y: (dagreNode.y as number) - height / 2,
    });
  });
};

export const createFlowElements = (
  validatedGraph: ValidatedGraph,
): { edges: Edge[]; nodes: FlowGraphNode[] } => {
  const edges = createFlowEdges(validatedGraph);
  const nodes = createFlowNodes(validatedGraph, edges);

  return { edges, nodes };
};
