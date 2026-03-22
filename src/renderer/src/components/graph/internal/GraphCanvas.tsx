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
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../../lib/cx";
import { Button } from "../../ui/Button";
import { CrosshairIcon } from "../../ui/icons";
import { Text } from "../../ui/Text";
import {
  graphCanvas,
  graphDiagnosticMessage,
  graphDiagnosticPanel,
  graphDiagnosticPanelStale,
  graphViewportControls,
} from "../graph.css";
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
  syncReactFlowGraphUniformValues,
} from "./create-react-flow-graph";
import { SubgraphPreviewCoordinator } from "./SubgraphPreviewCoordinator";

type GraphCanvasProps = {
  readonly className?: string;
  readonly controls?: ReactNode;
  readonly errors: readonly string[];
  readonly isStale: boolean;
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

const GRAPH_VIEW_PADDING = 0.16;
const GRAPH_VIEW_CENTER_DURATION_MS = 180;

type GraphViewportSize = {
  readonly height: number;
  readonly width: number;
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

    const animationFrameId = window.requestAnimationFrame(() => {
      void fitView({ padding: GRAPH_VIEW_PADDING });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
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

const AutoCenterOnGraphRender = ({
  validatedGraph,
}: {
  readonly validatedGraph: ValidatedGraph;
}): null => {
  const nodesInitialized = useNodesInitialized();
  const { fitView, getNodes } = useReactFlow<FlowGraphNode>();
  const lastCenteredGraphRef = useRef<ValidatedGraph | null>(null);

  useEffect(() => {
    if (!nodesInitialized || getNodes().length === 0) {
      return;
    }

    if (lastCenteredGraphRef.current === validatedGraph) {
      return;
    }

    lastCenteredGraphRef.current = validatedGraph;

    const animationFrameId = window.requestAnimationFrame(() => {
      void fitView({
        duration: GRAPH_VIEW_CENTER_DURATION_MS,
        padding: GRAPH_VIEW_PADDING,
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [fitView, getNodes, nodesInitialized, validatedGraph]);

  return null;
};

const GraphViewportControls = ({
  controls = null,
}: {
  readonly controls?: ReactNode;
}): JSX.Element => {
  const { fitView, getNodes } = useReactFlow<FlowGraphNode>();

  const handleCenterView = useCallback(() => {
    if (getNodes().length === 0) {
      return;
    }

    void fitView({
      duration: GRAPH_VIEW_CENTER_DURATION_MS,
      padding: GRAPH_VIEW_PADDING,
    });
  }, [fitView, getNodes]);

  return (
    <Panel className={graphViewportControls} position="top-right">
      <Button
        aria-label="Center graph view"
        onClick={handleCenterView}
        size="sm"
        square
        variant="plain"
      >
        <CrosshairIcon />
      </Button>
      {controls}
    </Panel>
  );
};

export const GraphCanvas = ({
  className,
  controls = null,
  errors,
  isStale,
  setUniformValue,
  uniformValues,
  validatedGraph,
}: GraphCanvasProps): JSX.Element => {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<GraphViewportSize>({
    height: 0,
    width: 0,
  });

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

  useEffect(() => {
    const host = canvasHostRef.current;

    if (host === null) {
      return;
    }

    const syncViewportSize = (): void => {
      setViewportSize({
        height: Math.max(Math.floor(host.clientHeight), 0),
        width: Math.max(Math.floor(host.clientWidth), 0),
      });
    };

    syncViewportSize();

    const resizeObserver = new ResizeObserver(() => {
      syncViewportSize();
    });

    resizeObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const flowGraph = useMemo(
    () => ({
      edges: baseFlowGraph.edges,
      nodes: syncReactFlowGraphUniformValues(layoutedNodes, uniformValues),
    }),
    [baseFlowGraph.edges, layoutedNodes, uniformValues],
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

  const isViewportReady = viewportSize.width > 0 && viewportSize.height > 0;

  return (
    <div className={cx(graphCanvas, className)} ref={canvasHostRef}>
      {errors.length > 0 ? (
        <div
          className={cx(
            graphDiagnosticPanel,
            isStale && graphDiagnosticPanelStale,
          )}
        >
          <Text as="div" tone="default" variant="label">
            {isStale
              ? "Graph update failed. Showing last valid graph."
              : "Graph error"}
          </Text>
          <pre className={graphDiagnosticMessage}>{errors.join("\n\n")}</pre>
        </div>
      ) : null}
      {isViewportReady ? (
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
            <>
              <SubgraphPreviewCoordinator
                enabled={isViewportReady}
                uniformValues={uniformValues}
                validatedGraph={validatedGraph}
              />
              <AutoCenterOnGraphRender validatedGraph={validatedGraph} />
              <MeasuredGraphLayout
                edges={baseFlowGraph.edges}
                layoutedNodes={layoutedNodes}
                setLayoutedNodes={setLayoutedNodes}
                validatedGraph={validatedGraph}
              />
            </>
          ) : null}
          <GraphViewportControls controls={controls} />
          <Background gap={24} size={1} />
        </ReactFlow>
      ) : null}
    </div>
  );
};
