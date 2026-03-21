import { create } from "zustand";
import type { GraphPreviewSnapshot } from "../../../shared/contracts";
import type { GraphUniformValues } from "../components/graph/graph-types";

type GraphPreviewState = {
  readonly fragmentShaderSource: string | null;
  readonly previewSnapshot: GraphPreviewSnapshot | null;
  readonly uniformValues: GraphUniformValues;
  readonly clearCompiledGraphShader: () => void;
  readonly setCompiledGraphShader: (
    fragmentShaderSource: string,
    uniformValues: GraphUniformValues,
  ) => void;
};

const EMPTY_UNIFORM_VALUES: GraphUniformValues = Object.freeze({});

export const useGraphPreviewStore = create<GraphPreviewState>((set) => ({
  fragmentShaderSource: null,
  previewSnapshot: null,
  uniformValues: EMPTY_UNIFORM_VALUES,
  clearCompiledGraphShader: () =>
    set({
      fragmentShaderSource: null,
      previewSnapshot: null,
      uniformValues: EMPTY_UNIFORM_VALUES,
    }),
  setCompiledGraphShader: (fragmentShaderSource, uniformValues) =>
    set({
      fragmentShaderSource,
      previewSnapshot: {
        fragmentShaderSource,
        uniformValues: { ...uniformValues },
      },
      uniformValues: { ...uniformValues },
    }),
}));
