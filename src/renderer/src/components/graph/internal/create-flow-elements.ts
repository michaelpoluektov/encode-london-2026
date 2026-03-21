import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type NodeTypes } from "@xyflow/react";
import type { DagNode } from "../dag-schema";
import {
  type ClampedFloatGraphFlowNode,
  ClampedFloatGraphNode,
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
import type { ParsedDagGraph, ParsedDagNode } from "./parse-graph";

const NODE_WIDTH = 240;
const BASE_NODE_HEIGHT = 88;
const INPUT_ROW_HEIGHT = 40;
const DETAIL_ROW_HEIGHT = 28;
const SECTION_GAP_HEIGHT = 20;

type DagFlowNode =
  | ClampedFloatGraphFlowNode
  | ColorGraphFlowNode
  | CustomGraphFlowNode
  | FloatGraphFlowNode
  | GlFragColorGraphFlowNode;

export const dagNodeTypes = {
  clampedFloat: ClampedFloatGraphNode,
  color: ColorGraphNode,
  custom: CustomGraphNode,
  float: FloatGraphNode,
  glFragColor: GlFragColorGraphNode,
} satisfies NodeTypes;

const getRenderedInputs = (node: DagNode): Readonly<Record<string, string>> => {
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

const getEstimatedNodeHeight = (node: ParsedDagNode): number => {
  const inputCount = Object.keys(getRenderedInputs(node.graphNode)).length;
  const detailCount = 1;

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
  parsedGraph: ParsedDagGraph,
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

  for (const node of parsedGraph.nodes) {
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
  node: ParsedDagNode,
  position: { x: number; y: number },
): DagFlowNode => {
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

  switch (node.graphNode.kind) {
    case "clampedFloat":
      return {
        ...baseNode,
        data: node.graphNode,
        type: "clampedFloat",
      };
    case "color":
      return {
        ...baseNode,
        data: node.graphNode,
        type: "color",
      };
    case "custom":
      return {
        ...baseNode,
        data: node.graphNode,
        type: "custom",
      };
    case "float":
      return {
        ...baseNode,
        data: node.graphNode,
        type: "float",
      };
    case "glFragColor":
      return {
        ...baseNode,
        data: node.graphNode,
        type: "glFragColor",
      };
  }
};

const createFlowEdges = (parsedGraph: ParsedDagGraph): Edge[] =>
  parsedGraph.edges.map((edge, index) => ({
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
  parsedGraph: ParsedDagGraph,
  edges: readonly Edge[],
): DagFlowNode[] => {
  const dagreGraph = createDagreGraph(parsedGraph, edges);

  return parsedGraph.nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.flowId);
    const height = getEstimatedNodeHeight(node);

    return createFlowNode(node, {
      x: (dagreNode.x as number) - NODE_WIDTH / 2,
      y: (dagreNode.y as number) - height / 2,
    });
  });
};

export const createFlowElements = (
  parsedGraph: ParsedDagGraph,
): { edges: Edge[]; nodes: DagFlowNode[] } => {
  const edges = createFlowEdges(parsedGraph);
  const nodes = createFlowNodes(parsedGraph, edges);

  return { edges, nodes };
};
