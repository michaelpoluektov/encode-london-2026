import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type JSX, useEffect, useMemo, useState } from "react";
import { cx } from "../../lib/cx";
import type { DagGraph } from "./dag-schema";
import { graphCanvas } from "./graph.css";
import {
  createFlowElements,
  dagNodeTypes,
} from "./internal/create-flow-elements";
import {
  type GraphParseIssue,
  type GraphSourceLoader,
  type ParsedDagGraph,
  parseGraph,
} from "./internal/parse-graph";

type FlowElements = ReturnType<typeof createFlowElements>;

type GraphProps = {
  readonly className?: string;
  readonly graph: DagGraph;
  readonly loadCustomNodeSource?: GraphSourceLoader;
};

const EMPTY_FLOW_ELEMENTS: FlowElements = {
  edges: [],
  nodes: [],
};

export const Graph = ({
  className,
  graph,
  loadCustomNodeSource,
}: GraphProps): JSX.Element => {
  const [parsedGraph, setParsedGraph] = useState<ParsedDagGraph | null>(null);
  const [parseIssues, setParseIssues] = useState<readonly GraphParseIssue[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void parseGraph(graph, { loadCustomNodeSource }).then((result) => {
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setParsedGraph(result.graph);
        setParseIssues([]);
        return;
      }

      setParsedGraph(null);
      setParseIssues(result.issues);
    });

    return () => {
      cancelled = true;
    };
  }, [graph, loadCustomNodeSource]);

  const flowElements = useMemo(
    () =>
      parsedGraph === null
        ? EMPTY_FLOW_ELEMENTS
        : createFlowElements(parsedGraph),
    [parsedGraph],
  );

  if (parseIssues.length > 0) {
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
          {parseIssues.map((issue) => issue.message).join("\n\n")}
        </pre>
      </div>
    );
  }

  return (
    <div className={cx(graphCanvas, className)}>
      <ReactFlow
        edges={flowElements.edges}
        elementsSelectable={false}
        fitView
        nodes={flowElements.nodes}
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
