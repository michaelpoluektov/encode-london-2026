import { type JSX, useCallback, useRef } from "react";
import { editorFrame } from "../app-shell.css";
import { getProjectGraphSource, useProjectStore } from "../store/project-store";
import { FloatingPreview } from "./FloatingPreview";
import { EXAMPLE_GRAPH_SOURCE } from "./graph/example";
import { Graph } from "./graph/Graph";
import type { GraphSourceLoader } from "./graph/graph-types";
import { graphContainer } from "./graph-panel.css";

export const GraphEditor = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const project = useProjectStore((s) => s.project);
  const graphSource = getProjectGraphSource(project);

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

  return (
    <div className={editorFrame}>
      <div className={graphContainer} ref={containerRef}>
        {project === null ? (
          <Graph graphSource={EXAMPLE_GRAPH_SOURCE} />
        ) : (
          <Graph
            graphSource={graphSource}
            loadCustomNodeSource={loadCustomNodeSource}
          />
        )}
        <FloatingPreview containerRef={containerRef} />
      </div>
    </div>
  );
};
