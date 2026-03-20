import { create } from "zustand";
import type { BootstrapPayload } from "../../../shared/contracts";

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

const starterShader = `uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
}`;

export const useAppStore = create<AppState>((set) => ({
  bootstrap: null,
  shaderSource: starterShader,
  workspacePaneSizes: [58, 42],
  setBootstrap: (bootstrap) => set({ bootstrap }),
  setShaderSource: (shaderSource) => set({ shaderSource }),
  setWorkspacePaneSizes: (workspacePaneSizes) => set({ workspacePaneSizes }),
}));
