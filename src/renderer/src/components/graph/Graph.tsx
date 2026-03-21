import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type JSX, useCallback, useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { useGraphPreviewStore } from "../../store/graph-preview-store";
import { usePreviewStore } from "../../store/preview-store";
import { graphCanvas } from "./graph.css";
import type {
  GraphInputValue,
  GraphSourceLoader,
  ValidatedGraph,
} from "./graph-types";
import { compileFragmentShader } from "./internal/compile-fragment-shader";
import {
  collectFlowGraphUniformValues,
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
  const [validatedGraph, setValidatedGraph] = useState<ValidatedGraph | null>(
    null,
  );
  const [flowElements, setFlowElements] =
    useState<FlowElements>(EMPTY_FLOW_ELEMENTS);

  const handleInputValueChange = useCallback(
    (flowId: string, value: GraphInputValue) => {
      setFlowElements((previousFlowElements) => {
        const nextNodes = updateFlowNodeValue(
          previousFlowElements.nodes,
          flowId,
          value,
        );

        useGraphPreviewStore
          .getState()
          .setUniformValues(collectFlowGraphUniformValues(nextNodes));

        return {
          ...previousFlowElements,
          nodes: nextNodes,
        };
      });
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
          const nextFlowElements = createFlowElements(result.graph, {
            onInputValueChange: handleInputValueChange,
          });

          setValidatedGraph(result.graph);
          setFlowElements(nextFlowElements);
          setErrors([]);
          useGraphPreviewStore
            .getState()
            .setUniformValues(
              collectFlowGraphUniformValues(nextFlowElements.nodes),
            );
          usePreviewStore.getState().clearFailureStage("compile");
          return;
        }

        setValidatedGraph(null);
        setFlowElements(EMPTY_FLOW_ELEMENTS);
        setErrors(result.errors);
        useGraphPreviewStore.getState().clearCompiledGraphShader();
        usePreviewStore.getState().markFailure({
          stage: "compile",
          message: result.errors.join("\n\n"),
          revision: null,
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [graphSource, handleInputValueChange, loadCustomNodeSource]);

  useEffect(() => {
    return () => {
      useGraphPreviewStore.getState().clearCompiledGraphShader();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (validatedGraph === null || flowElements.nodes.length === 0) {
      return;
    }

    const uniformValues = collectFlowGraphUniformValues(flowElements.nodes);

    void compileFragmentShader(validatedGraph, {
      loadCustomNodeSource,
    }).then((result) => {
      if (cancelled) {
        return;
      }

      if (result.ok) {
        useGraphPreviewStore
          .getState()
          .setCompiledGraphShader(result.shaderSource, uniformValues);
        usePreviewStore.getState().clearFailureStage("compile");
        return;
      }

      useGraphPreviewStore.getState().clearCompiledGraphShader();
      usePreviewStore.getState().markFailure({
        stage: "compile",
        message: result.errors.join("\n\n"),
        revision: null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [flowElements.nodes, loadCustomNodeSource, validatedGraph]);

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
