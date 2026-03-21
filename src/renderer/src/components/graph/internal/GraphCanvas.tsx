import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type JSX, useMemo } from "react";
import { cx } from "../../../lib/cx";
import { graphCanvas } from "../graph.css";
import type {
  GraphUniformValue,
  GraphUniformValues,
  ValidatedGraph,
} from "../graph-types";
import {
  createReactFlowGraph,
  graphNodeTypes,
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

  const flowGraph = useMemo(
    () => ({
      edges: baseFlowGraph.edges,
      nodes: syncReactFlowGraphSubgraphPreviews(
        syncReactFlowGraphUniformValues(baseFlowGraph.nodes, uniformValues),
        subgraphPreviews,
      ),
    }),
    [baseFlowGraph.edges, baseFlowGraph.nodes, uniformValues, subgraphPreviews],
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
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};
