import type { ShadilyManifest } from "./contracts";

export const DEFAULT_PROJECT_FILE_PATHS = {
  agentInstructions: "AGENTS.md",
  capturesDir: "captures",
  graph: "graph.json",
  manifest: "shadily.json",
  nodesDir: "nodes",
  vertex: "vertex.vert",
} as const;

export const DEFAULT_AGENTS_MD = `# Shadily Shader Project

This is a Shadily project. You can read and edit GLSL shader files (\`.frag\`, \`.vert\`) to change the visual output.

## Workflow

When making shader changes, always follow this order:

1. Call \`render_preview\` before making any changes to see the current state.
2. Make your changes, then call \`check_compilation\` to verify they compile without errors.
3. Call \`render_preview\` again to see what changed and confirm the result.

Iterate on steps 2–3 until the output looks correct.

You should create shaders by creating glsl functions in the nodes repo, these can then be accessed and used by the shader in graph.json

## Environment constraints

- \`rg\` (ripgrep) is **not available**. Use \`grep\` for text search or read files directly.
- Prefer reading and writing files directly over using search tools.
- Do not attempt to install packages or run build commands — the app handles compilation.
`;

export const DEFAULT_VERTEX_SHADER = `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Keep in sync with src/renderer/src/components/graph/example/graph.ts
export const DEFAULT_GRAPH_SOURCE = JSON.stringify(
  {
    nodes: [
      {
        instanceName: "time",
        kind: "time",
      },
      {
        instanceName: "uv",
        kind: "varying",
        valueType: "vec2",
        varyingName: "vUv",
      },
      {
        filepath: "./nodes/pulse.glsl",
        inputs: {
          time: "time",
          uv: "uv",
        },
        instanceName: "pulse",
        kind: "custom",
      },
      {
        inputs: { color: "pulse" },
        kind: "glFragColor",
      },
    ],
  },
  null,
  2,
);

export const DEFAULT_NODE_GLSL_FILES: Readonly<Record<string, string>> = {
  "pulse.glsl": `vec4 pulseNode(vec2 uv, float time) {
  vec2 centeredUv = uv - 0.5;
  float radius = length(centeredUv);
  float wave = 0.5 + 0.5 * sin(time * 1.5 - radius * 18.0);
  vec3 color = mix(vec3(0.08, 0.12, 0.18), vec3(0.95, 0.55, 0.24), wave);

  color *= 1.0 - smoothstep(0.35, 0.75, radius);

  return vec4(color, 1.0);
}`,
};

export type DefaultProjectContents = {
  readonly manifest: ShadilyManifest;
  readonly graphSource: string;
};

export const createDefaultProjectContents = (
  name: string,
  timestamp = new Date().toISOString(),
): DefaultProjectContents => ({
  manifest: {
    projectId: crypto.randomUUID(),
    name,
    version: "2",
    graph: { source: DEFAULT_PROJECT_FILE_PATHS.graph },
    preview: { mesh: "torusKnot" },
    created: timestamp,
    modified: timestamp,
  },
  graphSource: DEFAULT_GRAPH_SOURCE,
});
