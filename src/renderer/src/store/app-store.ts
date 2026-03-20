import { create } from "zustand";
import type { BootstrapPayload } from "../../../shared/contracts";
import { STARTER_FRAGMENT_SHADER } from "../shader-source";

type AppState = {
  readonly bootstrap: BootstrapPayload | null;
  readonly shaderSource: string;
  readonly workspacePaneSizes: readonly number[];
  readonly setBootstrap: (bootstrap: BootstrapPayload) => void;
  readonly setShaderSource: (shaderSource: string) => void;
  readonly setWorkspacePaneSizes: (
    workspacePaneSizes: readonly number[],
  ) => void;
};

export const useAppStore = create<AppState>((set) => ({
  bootstrap: null,
  shaderSource: STARTER_FRAGMENT_SHADER,
  workspacePaneSizes: [58, 42],
  setBootstrap: (bootstrap) => set({ bootstrap }),
  setShaderSource: (shaderSource) => set({ shaderSource }),
  setWorkspacePaneSizes: (workspacePaneSizes) => set({ workspacePaneSizes }),
}));
