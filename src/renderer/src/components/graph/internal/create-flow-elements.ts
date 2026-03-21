import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type NodeTypes } from "@xyflow/react";
import type { DagGraph, DagNode } from "../../../dag/dag-schema";
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

type VisualNodeDescriptor = {
  readonly flowId: string;
  readonly graphNode: DagNode;
};

export const dagNodeTypes = {
  clampedFloat: ClampedFloatGraphNode,
  color: ColorGraphNode,
  custom: CustomGraphNode,
  float: FloatGraphNode,
  glFragColor: GlFragColorGraphNode,
} satisfies NodeTypes;

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

const resolveSourceNodeId = (
  sourceRef: string,
  nodeIdsByReference: ReadonlyMap<string, string>,
): string | null => {
  const candidates = [sourceRef];

  for (const separator of [".", ":"]) {
    const separatorIndex = sourceRef.indexOf(separator);

    if (separatorIndex > 0) {
      candidates.push(sourceRef.slice(0, separatorIndex));
    }
  }

  for (const candidate of candidates) {
    const nodeId = nodeIdsByReference.get(candidate);

    if (nodeId !== undefined) {
      return nodeId;
    }
  }

  return null;
};

const createVisualNodeDescriptors = (
  graph: DagGraph,
): VisualNodeDescriptor[] => {
  const seenIds = new Map<string, number>();

  return graph.nodes.map((node, index) => ({
    flowId: createFlowNodeId(node, index, seenIds),
    graphNode: node,
  }));
};

const createFlowEdges = (
  descriptors: readonly VisualNodeDescriptor[],
): Edge[] => {
  const nodeIdsByReference = new Map<string, string>();

  for (const descriptor of descriptors) {
    if ("instanceName" in descriptor.graphNode) {
      nodeIdsByReference.set(
        descriptor.graphNode.instanceName,
        descriptor.flowId,
      );
    }
  }

  const edges: Edge[] = [];

  for (const descriptor of descriptors) {
    const inputs = getNodeInputs(descriptor.graphNode);
    let inputIndex = 0;

    for (const [targetInput, sourceRef] of Object.entries(inputs)) {
      const sourceNodeId = resolveSourceNodeId(sourceRef, nodeIdsByReference);

      if (sourceNodeId === null || sourceNodeId === descriptor.flowId) {
        continue;
      }

      edges.push({
        id: `${sourceNodeId}->${descriptor.flowId}:${targetInput}:${inputIndex}`,
        interactionWidth: 28,
        markerEnd: { type: MarkerType.ArrowClosed },
        selectable: false,
        source: sourceNodeId,
        sourceHandle: GRAPH_NODE_OUTPUT_HANDLE_ID,
        target: descriptor.flowId,
        targetHandle: targetInput,
        type: "default",
      });
      inputIndex += 1;
    }
  }

  return edges;
};

const getEstimatedNodeHeight = (node: DagNode): number => {
  const inputCount = Object.keys(getNodeInputs(node)).length;
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
  descriptors: readonly VisualNodeDescriptor[],
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

  for (const descriptor of descriptors) {
    dagreGraph.setNode(descriptor.flowId, {
      height: getEstimatedNodeHeight(descriptor.graphNode),
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
  descriptor: VisualNodeDescriptor,
  position: { x: number; y: number },
): DagFlowNode => {
  const baseNode = {
    connectable: false,
    draggable: false,
    focusable: false,
    id: descriptor.flowId,
    position,
    selectable: false,
    style: {
      width: NODE_WIDTH,
    },
  };

  switch (descriptor.graphNode.kind) {
    case "clampedFloat":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "clampedFloat",
      };
    case "color":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "color",
      };
    case "custom":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "custom",
      };
    case "float":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "float",
      };
    case "glFragColor":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "glFragColor",
      };
  }
};

const createFlowNodes = (
  descriptors: readonly VisualNodeDescriptor[],
  edges: readonly Edge[],
): DagFlowNode[] => {
  const dagreGraph = createDagreGraph(descriptors, edges);

  return descriptors.map((descriptor) => {
    const dagreNode = dagreGraph.node(descriptor.flowId);
    const height = getEstimatedNodeHeight(descriptor.graphNode);

    return createFlowNode(descriptor, {
      x: (dagreNode.x as number) - NODE_WIDTH / 2,
      y: (dagreNode.y as number) - height / 2,
    });
  });
};

export const createFlowElements = (
  graph: DagGraph,
): { edges: Edge[]; nodes: DagFlowNode[] } => {
  const descriptors = createVisualNodeDescriptors(graph);
  const edges = createFlowEdges(descriptors);
  const nodes = createFlowNodes(descriptors, edges);

  return { edges, nodes };
};
