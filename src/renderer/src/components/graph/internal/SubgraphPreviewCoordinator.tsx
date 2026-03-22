import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../../../store/project-store";
import { useSubgraphPreviewStore } from "../../../store/subgraph-preview-store";
import type { GraphUniformValues, ValidatedGraph } from "../graph-types";
import { compileSubgraphFragmentShader } from "./compile-fragment-shader";
import { renderSubgraphToDataUrl } from "./render-subgraph";

const SUBGRAPH_PREVIEW_WIDTH = 240;
const SUBGRAPH_PREVIEW_HEIGHT = 120;
const UNIFORM_DEBOUNCE_MS = 150;

const createRunId = (): string =>
  `${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;

type SubgraphPreviewCoordinatorProps = {
  readonly enabled: boolean;
  readonly uniformValues: GraphUniformValues;
  readonly validatedGraph: ValidatedGraph | null;
};

export const SubgraphPreviewCoordinator = ({
  enabled,
  uniformValues,
  validatedGraph,
}: SubgraphPreviewCoordinatorProps): null => {
  const previewMesh = useProjectStore(
    (s) => s.project?.manifest.preview.mesh ?? "sphere",
  );
  const [debouncedUniformValues, setDebouncedUniformValues] =
    useState(uniformValues);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

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
      useSubgraphPreviewStore.getState().clear();
      return;
    }

    const customNodeIds = validatedGraph.nodes
      .filter((node) => node.kind === "custom")
      .map((node) => node.flowId);

    useSubgraphPreviewStore.getState().syncNodes(customNodeIds);
  }, [validatedGraph]);

  useEffect(() => {
    if (validatedGraph === null || !enabled) {
      return;
    }

    let cancelled = false;

    const customNodes = validatedGraph.nodes.filter(
      (node) => node.kind === "custom",
    );

    const runPreviews = async (): Promise<void> => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          resolve();
        });
      });

      if (cancelled) {
        return;
      }

      const runId = createRunId();
      const store = useSubgraphPreviewStore.getState();

      for (const node of customNodes) {
        if (cancelled) {
          return;
        }

        const requestKey = `${runId}:${node.flowId}`;
        store.markQueued(node.flowId, requestKey);

        const compiled = compileSubgraphFragmentShader(
          validatedGraph,
          node.flowId,
        );

        if (!compiled.ok) {
          store.markError(node.flowId, requestKey, compiled.errors.join("\n"));
          continue;
        }

        store.markRendering(node.flowId, requestKey);

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

        if (dataUrl === null) {
          store.markError(
            node.flowId,
            requestKey,
            "Failed to render subgraph preview.",
          );
          continue;
        }

        store.markReady(node.flowId, requestKey, dataUrl);
      }
    };

    void runPreviews().catch((error) => {
      if (cancelled) {
        return;
      }

      console.error(
        "[graph-preview] Failed to coordinate subgraph previews:",
        error,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedUniformValues, enabled, previewMesh, validatedGraph]);

  return null;
};
