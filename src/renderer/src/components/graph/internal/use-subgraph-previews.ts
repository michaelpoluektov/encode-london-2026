import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../../../store/project-store";
import type { GraphUniformValues, ValidatedGraph } from "../graph-types";
import { compileSubgraphFragmentShader } from "./compile-fragment-shader";
import { renderSubgraphToDataUrl } from "./render-subgraph";

const SUBGRAPH_PREVIEW_WIDTH = 240;
const SUBGRAPH_PREVIEW_HEIGHT = 120;
const UNIFORM_DEBOUNCE_MS = 150;

export const useSubgraphPreviews = (
  validatedGraph: ValidatedGraph | null,
  uniformValues: GraphUniformValues,
): ReadonlyMap<string, string> => {
  const [previews, setPreviews] = useState<ReadonlyMap<string, string>>(
    new Map(),
  );
  const previewMesh = useProjectStore(
    (s) => s.project?.manifest.preview.mesh ?? "sphere",
  );

  const [debouncedUniformValues, setDebouncedUniformValues] =
    useState(uniformValues);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedUniformValues(uniformValues);
    }, UNIFORM_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [uniformValues]);

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
      const activeNodeIds = new Set(valueNodes.map((node) => node.flowId));

      setPreviews((previousPreviews) => {
        const nextPreviews = new Map<string, string>();

        for (const [nodeId, dataUrl] of previousPreviews) {
          if (activeNodeIds.has(nodeId)) {
            nextPreviews.set(nodeId, dataUrl);
          }
        }

        return nextPreviews;
      });

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
          debouncedUniformValues,
          SUBGRAPH_PREVIEW_WIDTH,
          SUBGRAPH_PREVIEW_HEIGHT,
          previewMesh,
        );

        if (cancelled) {
          return;
        }

        if (dataUrl !== null) {
          setPreviews((previousPreviews) => {
            if (previousPreviews.get(node.flowId) === dataUrl) {
              return previousPreviews;
            }

            const nextPreviews = new Map(previousPreviews);
            nextPreviews.set(node.flowId, dataUrl);

            return nextPreviews;
          });
        }
      }
    };

    void renderAll().catch((error) => {
      if (cancelled) {
        return;
      }

      console.error(
        "[graph-preview] Failed to render subgraph previews:",
        error,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [validatedGraph, previewMesh, debouncedUniformValues]);

  return previews;
};
