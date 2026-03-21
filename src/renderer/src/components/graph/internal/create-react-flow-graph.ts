import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type NodeTypes } from "@xyflow/react";
import type {
  GraphInputValue,
  ValidatedGraph,
  ValidatedGraphNode,
} from "../graph-types";
import type { ColorValue, GraphNodeDefinition } from "./json-schema";
import {
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
} from "./nodes";

const NODE_WIDTH = 240;
const BASE_NODE_HEIGHT = 88;
const INPUT_ROW_HEIGHT = 40;
const DETAIL_ROW_HEIGHT = 28;
const CONTROL_ROW_HEIGHT = 44;
const SECTION_GAP_HEIGHT = 20;

type FlowGraphNode =
  | ColorGraphFlowNode
  | CustomGraphFlowNode
  | FloatGraphFlowNode
  | GlFragColorGraphFlowNode;

type CreateFlowElementsOptions = {
  readonly onInputValueChange: (flowId: string, value: GraphInputValue) => void;
};

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
    case "color":
    case "custom":
    case "float":
    case "glFragColor":
      return 1;
  }
};

const getRenderedControlHeight = (node: GraphNodeDefinition): number => {
  switch (node.kind) {
    case "color":
    case "float":
      return CONTROL_ROW_HEIGHT;
    case "custom":
    case "glFragColor":
      return 0;
  }
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

const createFlowNode = (
  node: ValidatedGraphNode,
  position: { x: number; y: number },
  options: CreateFlowElementsOptions,
): FlowGraphNode => {
  const baseNode = {
    connectable: false,
    draggable: false,
    focusable: false,
    id: node.flowId,
    position,
    selectable: false,
    style: {
      pointerEvents: "all" as const,
      width: NODE_WIDTH,
    },
  };

  switch (node.definition.kind) {
    case "color": {
      const data: ColorGraphNodeData = {
        definition: node.definition,
        onValueChange: (nextValue) => {
          options.onInputValueChange(node.flowId, nextValue);
        },
        value: {
          ...node.definition.defaultValue,
        },
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
        onValueChange: (nextValue) => {
          options.onInputValueChange(node.flowId, nextValue);
        },
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
  nodes.map((node) => {
    if (node.id !== flowId) {
      return node;
    }

    if (node.type === "float" && typeof value === "number") {
      return {
        ...node,
        data: {
          ...node.data,
          value,
        },
      };
    }

    if (node.type === "color" && typeof value === "object" && value !== null) {
      const nextValue: ColorValue = {
        a: value.a,
        b: value.b,
        g: value.g,
        r: value.r,
      };

      return {
        ...node,
        data: {
          ...node.data,
          value: nextValue,
        },
      };
    }

    return node;
  });
