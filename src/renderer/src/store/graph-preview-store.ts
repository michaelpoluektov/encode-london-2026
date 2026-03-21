import { create } from "zustand";
import type { GraphUniformValues } from "../components/graph/graph-types";

type GraphPreviewState = {
  readonly fragmentShaderSource: string | null;
  readonly uniformValues: GraphUniformValues;
  readonly clearCompiledGraphShader: () => void;
  readonly setCompiledGraphShader: (
    fragmentShaderSource: string,
    uniformValues: GraphUniformValues,
  ) => void;
  readonly setUniformValues: (uniformValues: GraphUniformValues) => void;
};

const EMPTY_UNIFORM_VALUES: GraphUniformValues = Object.freeze({});

export const useGraphPreviewStore = create<GraphPreviewState>((set) => ({
  fragmentShaderSource: null,
  uniformValues: EMPTY_UNIFORM_VALUES,
  clearCompiledGraphShader: () =>
    set({
      fragmentShaderSource: null,
      uniformValues: EMPTY_UNIFORM_VALUES,
    }),
  setCompiledGraphShader: (fragmentShaderSource, uniformValues) =>
    set({
      fragmentShaderSource,
      uniformValues: { ...uniformValues },
    }),
  setUniformValues: (uniformValues) =>
    set((state) =>
      state.fragmentShaderSource === null
        ? state
        : {
            uniformValues: { ...uniformValues },
          },
    ),
}));
