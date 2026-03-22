import { useEffect, useRef } from "react";
import { useProjectStore } from "../../../store/project-store";
import type { GraphUniformValues, ValidatedGraph } from "../graph-types";
import { compileSubgraphFragmentShader } from "./compile-fragment-shader";
import { renderSubgraphToDataUrl } from "./render-subgraph";

const SUBGRAPH_MCP_PREVIEW_WIDTH = 200;
const SUBGRAPH_MCP_PREVIEW_HEIGHT = 200;

type SubgraphMcpBridgeProps = {
  readonly validatedGraph: ValidatedGraph | null;
  readonly uniformValues: GraphUniformValues;
};

export const SubgraphMcpBridge = ({
  validatedGraph,
  uniformValues,
}: SubgraphMcpBridgeProps): null => {
  const validatedGraphRef = useRef(validatedGraph);
  const uniformValuesRef = useRef(uniformValues);

  useEffect(() => {
    validatedGraphRef.current = validatedGraph;
  }, [validatedGraph]);

  useEffect(() => {
    uniformValuesRef.current = uniformValues;
  }, [uniformValues]);

  useEffect(() => {
    return window.shadily.preview.onRenderSubgraph(
      async (requestId, nodeInstanceName) => {
        const graph = validatedGraphRef.current;

        if (graph === null) {
          await window.shadily.preview.respondRenderSubgraph(
            requestId,
            null,
            "Graph not ready.",
          );
          return;
        }

        const node = graph.nodes.find(
          (n) => n.kind !== "glFragColor" && n.displayName === nodeInstanceName,
        );

        if (node === undefined || node.kind === "glFragColor") {
          await window.shadily.preview.respondRenderSubgraph(
            requestId,
            null,
            `Node "${nodeInstanceName}" not found.`,
          );
          return;
        }

        const compiled = compileSubgraphFragmentShader(graph, node.flowId);

        if (!compiled.ok) {
          await window.shadily.preview.respondRenderSubgraph(
            requestId,
            null,
            compiled.errors.join("\n"),
          );
          return;
        }

        const dataUrl = await renderSubgraphToDataUrl(
          compiled.shaderSource,
          uniformValuesRef.current,
          SUBGRAPH_MCP_PREVIEW_WIDTH,
          SUBGRAPH_MCP_PREVIEW_HEIGHT,
          useProjectStore.getState().project?.manifest.preview.mesh ?? "sphere",
        );

        await window.shadily.preview.respondRenderSubgraph(
          requestId,
          dataUrl,
          dataUrl === null ? "Render failed." : undefined,
        );
      },
    );
  }, []);

  return null;
};
