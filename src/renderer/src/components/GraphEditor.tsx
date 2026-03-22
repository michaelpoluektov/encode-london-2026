import { type JSX, type ReactNode, useCallback, useRef } from "react";
import { editorFrame } from "../app-shell.css";
import {
  createProjectSavePayload,
  getProjectGraphSource,
  useProjectStore,
} from "../store/project-store";
import { getGraphDocumentPath } from "../store/project-store-helpers";
import { FloatingPreview } from "./FloatingPreview";
import { EXAMPLE_GRAPH_SOURCE } from "./graph/example";
import { Graph } from "./graph/Graph";
import type {
  GraphSourceLoader,
  GraphUniformValues,
} from "./graph/graph-types";
import { applyUniformValuesToGraphSource } from "./graph/internal/use-graph-runtime";
import { graphContainer } from "./graph-panel.css";

const PARAM_SAVE_DEBOUNCE_MS = 1000;

export const GraphEditor = ({
  collapseAction = null,
  previewHeaderActions = null,
  sourceCollapsed = false,
}: {
  readonly collapseAction?: ReactNode;
  readonly previewHeaderActions?: ReactNode;
  readonly sourceCollapsed?: boolean;
}): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const project = useProjectStore((s) => s.project);
  const updateDraft = useProjectStore((s) => s.updateDraft);
  const graphSource = getProjectGraphSource(project);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCustomNodeSource = useCallback<GraphSourceLoader>(
    async (filepath) => {
      if (project === null) {
        throw new Error("A project must be open to load node source files.");
      }

      const entry = await window.shadily.project.readEntry({
        folderPath: project.folderPath,
        manifest: project.manifest,
        path: filepath,
      });

      if (entry.kind !== "text") {
        throw new Error(`Node source file [${filepath}] is not a text file.`);
      }

      return entry.content;
    },
    [project],
  );

  const handleUniformValuesChange = useCallback(
    (uniformValues: GraphUniformValues) => {
      if (project === null) {
        return;
      }

      const graphPath = getGraphDocumentPath(project.manifest);
      const updatedSource = applyUniformValuesToGraphSource(
        graphSource,
        uniformValues,
      );

      updateDraft(graphPath, updatedSource);

      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        const currentProject = useProjectStore.getState().project;

        if (currentProject === null) {
          return;
        }

        void window.shadily.project
          .save(createProjectSavePayload(currentProject))
          .then((savedProject) => {
            useProjectStore.getState().commitSavedProject(savedProject);
          });
      }, PARAM_SAVE_DEBOUNCE_MS);
    },
    [project, graphSource, updateDraft],
  );

  return (
    <div className={editorFrame}>
      <div className={graphContainer} ref={containerRef}>
        {project === null ? (
          <Graph controls={collapseAction} graphSource={EXAMPLE_GRAPH_SOURCE} />
        ) : (
          <Graph
            controls={collapseAction}
            graphSource={graphSource}
            loadCustomNodeSource={loadCustomNodeSource}
            onUniformValuesChange={handleUniformValuesChange}
          />
        )}
        <FloatingPreview
          containerRef={containerRef}
          headerActions={previewHeaderActions}
          sourceCollapsed={sourceCollapsed}
        />
      </div>
    </div>
  );
};
