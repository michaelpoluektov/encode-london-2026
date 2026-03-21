import {
  Background,
  type Edge,
  MarkerType,
  type NodeTypes,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { JSX } from "react";
import type { DagGraph, DagNode } from "../../dag/dag-schema";
import { cx } from "../../lib/cx";
import { type CustomGraphFlowNode, CustomGraphNode } from "./CustomGraphNode";
import { GRAPH_NODE_OUTPUT_HANDLE_ID } from "./GraphNode";
import { graphCanvas } from "./graph.css";
import {
  type InputClampedFloatGraphFlowNode,
  InputClampedFloatGraphNode,
} from "./InputClampedFloatGraphNode";
import {
  type InputFloatGraphFlowNode,
  InputFloatGraphNode,
} from "./InputFloatGraphNode";
import {
  type OutputGlFragColorGraphFlowNode,
  OutputGlFragColorGraphNode,
} from "./OutputGlFragColorGraphNode";

const NODE_WIDTH = 240;
const COLUMN_GAP = 320;
const ROW_GAP = 220;

type GraphProps = {
  readonly className?: string;
  readonly graph: DagGraph;
};

type DagFlowNode =
  | CustomGraphFlowNode
  | InputClampedFloatGraphFlowNode
  | InputFloatGraphFlowNode
  | OutputGlFragColorGraphFlowNode;

const dagNodeTypes = {
  custom: CustomGraphNode,
  input_clamped_float: InputClampedFloatGraphNode,
  input_float: InputFloatGraphNode,
  output_gl_frag_color: OutputGlFragColorGraphNode,
} satisfies NodeTypes;

type VisualNodeDescriptor = {
  readonly flowId: string;
  readonly graphNode: DagNode;
};

const getNodeInputs = (node: DagNode): Readonly<Record<string, string>> => {
  switch (node.kind) {
    case "custom":
      return node.inputs;
    case "output_gl_frag_color":
      return node.inputs;
    case "input_clamped_float":
      return {};
    case "input_float":
      return {};
  }
};

const createFlowNodeId = (
  node: DagNode,
  index: number,
  seenIds: Map<string, number>,
): string => {
  const baseId =
    "instanceName" in node
      ? node.instanceName
      : `output_gl_frag_color_${index}`;
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
        markerEnd: { type: MarkerType.ArrowClosed },
        selectable: false,
        source: sourceNodeId,
        sourceHandle: GRAPH_NODE_OUTPUT_HANDLE_ID,
        target: descriptor.flowId,
        targetHandle: targetInput,
        type: "smoothstep",
      });
      inputIndex += 1;
    }
  }

  return edges;
};

const createNodeLevels = (
  nodeIds: readonly string[],
  edges: readonly Edge[],
): ReadonlyMap<string, number> => {
  const nodeLevels = new Map<string, number>();
  const incomingEdgeCounts = new Map<string, number>();
  const outgoingNodeIds = new Map<string, string[]>();

  for (const nodeId of nodeIds) {
    nodeLevels.set(nodeId, 0);
    incomingEdgeCounts.set(nodeId, 0);
    outgoingNodeIds.set(nodeId, []);
  }

  for (const edge of edges) {
    incomingEdgeCounts.set(
      edge.target,
      (incomingEdgeCounts.get(edge.target) ?? 0) + 1,
    );
    outgoingNodeIds.set(edge.source, [
      ...(outgoingNodeIds.get(edge.source) ?? []),
      edge.target,
    ]);
  }

  const pendingNodeIds = nodeIds.filter(
    (nodeId) => (incomingEdgeCounts.get(nodeId) ?? 0) === 0,
  );

  while (pendingNodeIds.length > 0) {
    const nodeId = pendingNodeIds.shift();

    if (nodeId === undefined) {
      break;
    }

    for (const targetNodeId of outgoingNodeIds.get(nodeId) ?? []) {
      nodeLevels.set(
        targetNodeId,
        Math.max(
          nodeLevels.get(targetNodeId) ?? 0,
          (nodeLevels.get(nodeId) ?? 0) + 1,
        ),
      );

      const nextIncomingEdgeCount =
        (incomingEdgeCounts.get(targetNodeId) ?? 1) - 1;

      incomingEdgeCounts.set(targetNodeId, nextIncomingEdgeCount);

      if (nextIncomingEdgeCount === 0) {
        pendingNodeIds.push(targetNodeId);
      }
    }
  }

  return nodeLevels;
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
    case "custom":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "custom",
      };
    case "input_clamped_float":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "input_clamped_float",
      };
    case "input_float":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "input_float",
      };
    case "output_gl_frag_color":
      return {
        ...baseNode,
        data: descriptor.graphNode,
        type: "output_gl_frag_color",
      };
  }
};

const createFlowNodes = (
  descriptors: readonly VisualNodeDescriptor[],
  edges: readonly Edge[],
): DagFlowNode[] => {
  const nodeLevels = createNodeLevels(
    descriptors.map((descriptor) => descriptor.flowId),
    edges,
  );
  const rowByLevel = new Map<number, number>();

  return descriptors.map((descriptor) => {
    const level = nodeLevels.get(descriptor.flowId) ?? 0;
    const row = rowByLevel.get(level) ?? 0;

    rowByLevel.set(level, row + 1);

    return createFlowNode(descriptor, {
      x: level * COLUMN_GAP,
      y: row * ROW_GAP,
    });
  });
};

const createFlowElements = (
  graph: DagGraph,
): { edges: Edge[]; nodes: DagFlowNode[] } => {
  const descriptors = createVisualNodeDescriptors(graph);
  const edges = createFlowEdges(descriptors);
  const nodes = createFlowNodes(descriptors, edges);

  return { edges, nodes };
};

export const Graph = ({ className, graph }: GraphProps): JSX.Element => {
  const { edges, nodes } = createFlowElements(graph);

  return (
    <div className={cx(graphCanvas, className)}>
      <ReactFlow
        edges={edges}
        elementsSelectable={false}
        fitView
        nodes={nodes}
        nodeTypes={dagNodeTypes}
        nodesConnectable={false}
        nodesDraggable={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};
