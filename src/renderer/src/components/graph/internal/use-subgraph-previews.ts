import { useEffect, useState } from "react";
import type { GraphUniformValues, ValidatedGraph } from "../graph-types";
import { compileSubgraphFragmentShader } from "./compile-fragment-shader";
import { renderSubgraphToDataUrl } from "./render-subgraph";

const SUBGRAPH_PREVIEW_WIDTH = 240;
const SUBGRAPH_PREVIEW_HEIGHT = 120;

export const useSubgraphPreviews = (
  validatedGraph: ValidatedGraph | null,
  uniformValues: GraphUniformValues,
): ReadonlyMap<string, string> => {
  const [previews, setPreviews] = useState<ReadonlyMap<string, string>>(
    new Map(),
  );

  useEffect(() => {
    if (validatedGraph === null) {
      setPreviews(new Map());
      return;
    }

    let cancelled = false;

    const valueNodes = validatedGraph.nodes.filter(
      (node) => node.kind === "custom",
    );

    const renderAll = async (): Promise<void> => {
      const nextPreviews = new Map<string, string>();

      for (const node of valueNodes) {
        if (cancelled) {
          return;
        }

        const compiled = compileSubgraphFragmentShader(
          validatedGraph,
          node.flowId,
        );

        if (!compiled.ok) {
          continue;
        }

        const dataUrl = await renderSubgraphToDataUrl(
          compiled.shaderSource,
          uniformValues,
          SUBGRAPH_PREVIEW_WIDTH,
          SUBGRAPH_PREVIEW_HEIGHT,
        );

        if (cancelled) {
          return;
        }

        if (dataUrl !== null) {
          nextPreviews.set(node.flowId, dataUrl);
        }
      }

      if (!cancelled) {
        setPreviews(nextPreviews);
      }
    };

    void renderAll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validatedGraph]);

  return previews;
};
