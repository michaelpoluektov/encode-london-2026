import {
  Background,
  Panel,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  type Dispatch,
  type JSX,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cx } from "../../../lib/cx";
import { Button } from "../../ui/Button";
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
  readonly layoutedNodes: readonly FlowGraphNode[];
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
  layoutedNodes,
  setLayoutedNodes,
  validatedGraph,
}: MeasuredGraphLayoutProps): null => {
  const nodesInitialized = useNodesInitialized();
  const { fitView, getInternalNode } = useReactFlow<FlowGraphNode>();

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

    const nextNodes = layoutReactFlowNodes(
      validatedGraph,
      layoutedNodes,
      edges,
      measurements,
    );

    if (areNodePositionsEqual(layoutedNodes, nextNodes)) {
      return;
    }

    setLayoutedNodes(nextNodes);

    queueMicrotask(() => {
      void fitView({ padding: 0.16 });
    });
  }, [
    edges,
    fitView,
    getInternalNode,
    layoutedNodes,
    nodesInitialized,
    setLayoutedNodes,
    validatedGraph,
  ]);

  return null;
};

const GraphViewportControls = (): JSX.Element => {
  const { fitView, getNodes } = useReactFlow<FlowGraphNode>();

  const handleCenterView = useCallback(() => {
    if (getNodes().length === 0) {
      return;
    }

    void fitView({ duration: 180, padding: 0.16 });
  }, [fitView, getNodes]);

  return (
    <Panel position="top-right">
      <Button
        aria-label="Center graph view"
        onClick={handleCenterView}
        size="sm"
      >
        Center View
      </Button>
    </Panel>
  );
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
            layoutedNodes={layoutedNodes}
            setLayoutedNodes={setLayoutedNodes}
            validatedGraph={validatedGraph}
          />
        ) : null}
        <GraphViewportControls />
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};
