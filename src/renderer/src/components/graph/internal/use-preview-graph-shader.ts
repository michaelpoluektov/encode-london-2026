import { useCallback, useMemo } from "react";
import {
  DEFAULT_GRAPH_SOURCE,
  DEFAULT_NODE_GLSL_FILES,
} from "../../../../../shared/default-project";
import { shadilyApi } from "../../../api/shadily-api";
import { useGraphPreviewStore } from "../../../store/graph-preview-store";
import {
  getProjectGraphSource,
  useProjectStore,
} from "../../../store/project-store";
import type { GraphSourceLoader, GraphUniformValues } from "../graph-types";
import { useGraphRuntime } from "./use-graph-runtime";

type PreviewGraphShaderState = {
  readonly errors: readonly string[];
  readonly fragmentSource: string | null;
  readonly uniformValues: GraphUniformValues;
};

const EMPTY_UNIFORM_VALUES: GraphUniformValues = Object.freeze({});

const normalizeDefaultNodePath = (filepath: string): string[] => {
  const normalizedPath = filepath.replace(/\\/g, "/");
  const fileName = normalizedPath.split("/").at(-1);

  return fileName === undefined ? [normalizedPath] : [normalizedPath, fileName];
};

const loadDefaultNodeSource = (filepath: string): string => {
  for (const candidatePath of normalizeDefaultNodePath(filepath)) {
    const source = DEFAULT_NODE_GLSL_FILES[candidatePath];

    if (source !== undefined) {
      return source;
    }
  }

  throw new Error(`No bundled default node source exists for [${filepath}].`);
};

export const usePreviewGraphShader = (): PreviewGraphShaderState => {
  const project = useProjectStore((state) => state.project);
  const graphFragmentSource = useGraphPreviewStore(
    (state) => state.fragmentShaderSource,
  );
  const graphUniformValues = useGraphPreviewStore(
    (state) => state.uniformValues,
  );

  const graphSource =
    project === null ? DEFAULT_GRAPH_SOURCE : getProjectGraphSource(project);

  const loadCustomNodeSource = useCallback<GraphSourceLoader>(
    async (filepath) => {
      if (project === null) {
        return loadDefaultNodeSource(filepath);
      }

      const entry = await shadilyApi.project.readEntry({
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

  const fallbackRuntime = useGraphRuntime({
    graphSource,
    loadCustomNodeSource,
  });

  const fallbackErrors = useMemo(() => {
    if (fallbackRuntime.errors.length > 0) {
      return fallbackRuntime.errors;
    }

    if (fallbackRuntime.compiledShader?.ok === false) {
      return fallbackRuntime.compiledShader.errors;
    }

    return [];
  }, [fallbackRuntime.compiledShader, fallbackRuntime.errors]);

  if (graphFragmentSource !== null) {
    return {
      errors: [],
      fragmentSource: graphFragmentSource,
      uniformValues: graphUniformValues,
    };
  }

  return {
    errors: fallbackErrors,
    fragmentSource:
      fallbackRuntime.compiledShader?.ok === true
        ? fallbackRuntime.compiledShader.shaderSource
        : null,
    uniformValues:
      fallbackRuntime.validatedGraph === null
        ? EMPTY_UNIFORM_VALUES
        : fallbackRuntime.uniformValues,
  };
};
