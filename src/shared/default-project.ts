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

This is a Shadily shader project. Build fragment shaders by composing reusable GLSL functions through \`graph.json\`.

## Files you can edit

- \`graph.json\`: the source of truth for the fragment shader graph.
- \`nodes/*.glsl\`: one reusable GLSL function per file. Prefer many small focused functions over one large function.
- \`vertex.vert\`: the project vertex shader.

## Available tools

You can use normal file reads/edits in the project and you also have these preview tools:

- \`render_preview\`: render the current shader preview as an image. It optionally accepts \`u_time\` so you can inspect the shader at a specific time value.
- \`check_compilation\`: verify that the current shader setup compiles successfully in the preview.

## Workflow

When making shader changes, always follow this order:

1. Call \`render_preview\` before making any changes to see the current state.
2. Make your changes, then call \`check_compilation\` to verify they compile without errors.
3. Call \`render_preview\` again to see what changed and confirm the result.

Iterate on steps 2-3 until the output looks correct.

## Preferred fragment-shader architecture

- Break the shader into many reusable GLSL functions.
- Each function should live in its own file inside \`nodes/\`.
- Compose simple functions into richer ones by wiring them together in \`graph.json\`.
- Prefer adding a new focused function over making an existing function handle many unrelated responsibilities.
- Keep functions easy to reuse across multiple graphs. Small math, shaping, masking, blending, distortion, color, and utility functions are encouraged.
- Use the graph to orchestrate the program. The fragment shader should be derived from the graph, not handwritten as one monolithic file.

## Working with graph inputs

When a value is likely to be tuned or art-directed, pull it out into a graph input node instead of hardcoding it inside GLSL.

Good candidates for graph inputs:

- colors and tints
- amplitudes, scales, intensities, thresholds, radii, speeds, frequencies
- boolean feature toggles
- integer step counts or band counts
- vector controls such as offsets, directions, uv scales, and positions

Prefer using:

- \`uniform\` nodes for editable shader parameters
- \`time\` nodes for \`u_time\`
- \`varying\` nodes for values supplied by the vertex shader such as \`vUv\`

When authoring uniform nodes:

- Use \`valueType\` to match the intended GLSL type such as \`float\`, \`int\`, \`bool\`, \`vec2\`, \`vec3\`, or \`vec4\`.
- For color controls, use a \`vec4\` uniform with \`editor: { kind: "color" }\`.
- For tunable scalar parameters, prefer a slider editor when sensible min/max bounds exist.
- Reuse the same \`uniformName\` when two graph nodes should represent the same underlying shader uniform.

## Custom node conventions

- A custom node should usually expose its important controls as inputs rather than hiding constants in the function body.
- Name functions clearly based on what they do.
- Keep parameter names descriptive because the graph validator uses function signatures to infer input types.
- Return the narrowest useful GLSL type from each function. Compose several functions together rather than returning oversized structs or packing unrelated results together.
- If a node becomes too complex, split it into helper nodes and wire them together through the graph.

## Vertex shader guidance

- The vertex shader lives in \`vertex.vert\`.
- If the fragment shader needs vertex-provided data, expose it with varyings and then represent those varyings in \`graph.json\` using \`varying\` input nodes.
- The default setup already provides \`vUv\`.

## Expectations

- Prefer graph-driven, reusable shader construction over hardcoded one-off fragment logic.
- Prefer editable inputs over embedded magic numbers.
- Prefer many composable functions over one large function.
- After each meaningful shader change, compile and preview it. Do not stop after only editing files.

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
