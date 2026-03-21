import type { ShadilyManifest } from "./contracts";

export const DEFAULT_PROJECT_FILE_PATHS = {
  capturesDir: "captures",
  fragmentShader: "material.frag",
  manifest: "shadily.json",
  vertexShader: "material.vert",
} as const;

export const DEFAULT_FRAGMENT_SHADER = `uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
}`;

export const DEFAULT_VERTEX_SHADER = `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export type DefaultProjectContents = {
  readonly manifest: ShadilyManifest;
  readonly shaders: {
    readonly fragment: string;
    readonly vertex: string;
  };
};

export const createDefaultProjectContents = (
  name: string,
  timestamp = new Date().toISOString(),
): DefaultProjectContents => ({
  manifest: {
    projectId: crypto.randomUUID(),
    name,
    version: "1",
    shaders: {
      fragment: DEFAULT_PROJECT_FILE_PATHS.fragmentShader,
      vertex: DEFAULT_PROJECT_FILE_PATHS.vertexShader,
    },
    preview: { mesh: "torusKnot" },
    created: timestamp,
    modified: timestamp,
  },
  shaders: {
    fragment: DEFAULT_FRAGMENT_SHADER,
    vertex: DEFAULT_VERTEX_SHADER,
  },
});
