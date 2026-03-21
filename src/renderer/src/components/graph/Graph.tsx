import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type JSX, useCallback, useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { graphCanvas } from "./graph.css";
import type { GraphInputValue, GraphSourceLoader } from "./graph-types";
import {
  createFlowElements,
  graphNodeTypes,
  updateFlowNodeValue,
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
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [flowElements, setFlowElements] =
    useState<FlowElements>(EMPTY_FLOW_ELEMENTS);

  const handleInputValueChange = useCallback(
    (flowId: string, value: GraphInputValue) => {
      setFlowElements((previousFlowElements) => ({
        ...previousFlowElements,
        nodes: updateFlowNodeValue(previousFlowElements.nodes, flowId, value),
      }));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void readValidatedGraph(graphSource, { loadCustomNodeSource }).then(
      (result) => {
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setFlowElements(
            createFlowElements(result.graph, {
              onInputValueChange: handleInputValueChange,
            }),
          );
          setErrors([]);
          return;
        }

        setFlowElements(EMPTY_FLOW_ELEMENTS);
        setErrors(result.errors);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [graphSource, handleInputValueChange, loadCustomNodeSource]);

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
        edgesFocusable={false}
        elementsSelectable={false}
        fitView
        nodes={flowElements.nodes}
        nodesFocusable={false}
        nodeTypes={graphNodeTypes}
        nodesConnectable={false}
        nodesDraggable={false}
        panOnDrag
        selectionOnDrag={false}
        zoomOnScroll
        zoomOnDoubleClick={false}
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};
