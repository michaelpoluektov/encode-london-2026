import { type JSX, useCallback } from "react";
import { editorFrame } from "../app-shell.css";
import type { GraphSourceLoader } from "./graph/graph-types";
import { EXAMPLE_GRAPH_SOURCE } from "./graph/example";
import { Graph } from "./graph/Graph";
import {
  getProjectGraphSource,
  useProjectStore,
} from "../store/project-store";

export const GraphEditor = (): JSX.Element => {
  const project = useProjectStore((s) => s.project);
  const graphSource = getProjectGraphSource(project);

  const loadCustomNodeSource = useCallback<GraphSourceLoader>(
    async (filepath) => {
      const entry = await window.shadily.project.readEntry({
        folderPath: project!.folderPath,
        manifest: project!.manifest,
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
      {project === null ? (
        <Graph graphSource={EXAMPLE_GRAPH_SOURCE} />
      ) : (
        <Graph
          graphSource={graphSource}
          loadCustomNodeSource={loadCustomNodeSource}
        />
      )}
    </div>
  );
};
