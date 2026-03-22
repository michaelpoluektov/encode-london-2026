import {
  Background,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  type Dispatch,
  type JSX,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cx } from "../../../lib/cx";
import { graphCanvas } from "../graph.css";
import type {
  GraphUniformValue,
  GraphUniformValues,
  ValidatedGraph,
} from "../graph-types";
import {
  createReactFlowGraph,
  type FlowGraphNode,
  type GraphNodeMeasurements,
  graphNodeTypes,
  layoutReactFlowNodes,
  syncReactFlowGraphSubgraphPreviews,
  syncReactFlowGraphUniformValues,
} from "./create-react-flow-graph";
import { useSubgraphPreviews } from "./use-subgraph-previews";

type GraphCanvasProps = {
  readonly className?: string;
  readonly errors: readonly string[];
  readonly setUniformValue: (
    uniformBindingKey: string,
    value: GraphUniformValue,
  ) => void;
  readonly uniformValues: GraphUniformValues;
  readonly validatedGraph: ValidatedGraph | null;
};

const EMPTY_FLOW_GRAPH = {
  edges: [],
  nodes: [],
};

type MeasuredGraphLayoutProps = {
  readonly edges: ReturnType<typeof createReactFlowGraph>["edges"];
  readonly setLayoutedNodes: Dispatch<SetStateAction<FlowGraphNode[]>>;
  readonly validatedGraph: ValidatedGraph;
};

const areNodePositionsEqual = (
  currentNodes: readonly FlowGraphNode[],
  nextNodes: readonly FlowGraphNode[],
): boolean =>
  currentNodes.length === nextNodes.length &&
  currentNodes.every((node, index) => {
    const nextNode = nextNodes[index];

    return (
      nextNode !== undefined &&
      node.id === nextNode.id &&
      node.position.x === nextNode.position.x &&
      node.position.y === nextNode.position.y
    );
  });

const MeasuredGraphLayout = ({
  edges,
  setLayoutedNodes,
  validatedGraph,
}: MeasuredGraphLayoutProps): null => {
  const nodesInitialized = useNodesInitialized();
  const { getInternalNode } = useReactFlow<FlowGraphNode>();

  useEffect(() => {
    if (!nodesInitialized) {
      return;
    }

    const measurements: GraphNodeMeasurements = new Map(
      validatedGraph.nodes.map((node) => {
        const measuredNode = getInternalNode(node.flowId);

        return [
          node.flowId,
          {
            height: measuredNode?.measured.height,
            width: measuredNode?.measured.width,
          },
        ];
      }),
    );

    setLayoutedNodes((currentNodes) => {
      const nextNodes = layoutReactFlowNodes(
        validatedGraph,
        currentNodes,
        edges,
        measurements,
      );

      return areNodePositionsEqual(currentNodes, nextNodes)
        ? currentNodes
        : nextNodes;
    });
  }, [
    edges,
    getInternalNode,
    nodesInitialized,
    setLayoutedNodes,
    validatedGraph,
  ]);

  return null;
};

export const GraphCanvas = ({
  className,
  errors,
  setUniformValue,
  uniformValues,
  validatedGraph,
}: GraphCanvasProps): JSX.Element => {
  const subgraphPreviews = useSubgraphPreviews(validatedGraph, uniformValues);

  const baseFlowGraph = useMemo(() => {
    if (validatedGraph === null) {
      return EMPTY_FLOW_GRAPH;
    }

    return createReactFlowGraph(validatedGraph, {
      onUniformValueChange: setUniformValue,
    });
  }, [setUniformValue, validatedGraph]);

  const [layoutedNodes, setLayoutedNodes] = useState<FlowGraphNode[]>(
    baseFlowGraph.nodes,
  );

  useEffect(() => {
    setLayoutedNodes(baseFlowGraph.nodes);
  }, [baseFlowGraph.nodes]);

  const flowGraph = useMemo(
    () => ({
      edges: baseFlowGraph.edges,
      nodes: syncReactFlowGraphSubgraphPreviews(
        syncReactFlowGraphUniformValues(layoutedNodes, uniformValues),
        subgraphPreviews,
      ),
    }),
    [baseFlowGraph.edges, layoutedNodes, uniformValues, subgraphPreviews],
  );

  if (errors.length > 0 && validatedGraph === null) {
    return (
      <div className={cx(graphCanvas, className)}>
        <pre
          style={{
            margin: 0,
            overflow: "auto",
            padding: "12px",
            whiteSpace: "pre-wrap",
          }}
        >
          {errors.join("\n\n")}
        </pre>
      </div>
    );
  }

  return (
    <div className={cx(graphCanvas, className)}>
      <ReactFlow
        edges={flowGraph.edges}
        edgesFocusable={false}
        elementsSelectable={false}
        fitView
        nodes={flowGraph.nodes}
        nodesFocusable={false}
        nodeTypes={graphNodeTypes}
        nodesConnectable={false}
        nodesDraggable={false}
        panOnDrag
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={false}
        zoomOnDoubleClick={false}
        zoomOnPinch
        zoomOnScroll
      >
        {validatedGraph !== null ? (
          <MeasuredGraphLayout
            edges={baseFlowGraph.edges}
            setLayoutedNodes={setLayoutedNodes}
            validatedGraph={validatedGraph}
          />
        ) : null}
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};
