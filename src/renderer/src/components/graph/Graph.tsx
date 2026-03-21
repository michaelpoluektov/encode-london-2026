import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type JSX, useEffect, useMemo, useState } from "react";
import { cx } from "../../lib/cx";
import { graphCanvas } from "./graph.css";
import type { GraphSourceLoader, ValidatedGraph } from "./graph-types";
import {
  createFlowElements,
  graphNodeTypes,
} from "./internal/create-react-flow-graph";
import { readValidatedGraph } from "./internal/load-and-validate-graph";

type FlowElements = ReturnType<typeof createFlowElements>;

type GraphProps = {
  readonly className?: string;
  readonly graphSource: string;
  readonly loadCustomNodeSource?: GraphSourceLoader;
};

const EMPTY_FLOW_ELEMENTS: FlowElements = {
  edges: [],
  nodes: [],
};

export const Graph = ({
  className,
  graphSource,
  loadCustomNodeSource,
}: GraphProps): JSX.Element => {
  const [validatedGraph, setValidatedGraph] = useState<ValidatedGraph | null>(
    null,
  );
  const [errors, setErrors] = useState<readonly string[]>([]);

  useEffect(() => {
    let cancelled = false;

    void readValidatedGraph(graphSource, { loadCustomNodeSource }).then(
      (result) => {
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setValidatedGraph(result.graph);
          setErrors([]);
          return;
        }

        setValidatedGraph(null);
        setErrors(result.errors);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [graphSource, loadCustomNodeSource]);

  const flowElements = useMemo(
    () =>
      validatedGraph === null
        ? EMPTY_FLOW_ELEMENTS
        : createFlowElements(validatedGraph),
    [validatedGraph],
  );

  if (errors.length > 0) {
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
        edges={flowElements.edges}
        elementsSelectable={false}
        fitView
        nodes={flowElements.nodes}
        nodeTypes={graphNodeTypes}
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
