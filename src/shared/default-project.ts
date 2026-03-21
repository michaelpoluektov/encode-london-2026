import type { ShadilyManifest } from "./contracts";

export const DEFAULT_PROJECT_FILE_PATHS = {
  agentInstructions: "AGENTS.md",
  capturesDir: "captures",
  graph: "graph.json",
  manifest: "shadily.json",
  nodesDir: "nodes",
} as const;

export const DEFAULT_AGENTS_MD = `# Shadily Shader Project

This is a Shadily project. You can read and edit GLSL shader files (\`.frag\`, \`.vert\`) to change the visual output.

## Workflow

When making shader changes, always follow this order:

1. Call \`render_preview\` before making any changes to see the current state.
2. Make your changes, then call \`check_compilation\` to verify they compile without errors.
3. Call \`render_preview\` again to see what changed and confirm the result.

Iterate on steps 2–3 until the output looks correct.

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

export const DEFAULT_FRAGMENT_SHADER = `uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
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
        defaultValue: 3,
        instanceName: "frequency",
        kind: "uniform",
        uniformName: "u_frequency",
        valueType: "float",
      },
      {
        defaultValue: 0.35,
        editor: { kind: "slider", max: 1, min: 0 },
        instanceName: "roughness",
        kind: "uniform",
        uniformName: "u_roughness",
        valueType: "float",
      },
      {
        defaultValue: 0.7,
        editor: { kind: "slider", max: 1, min: 0 },
        instanceName: "intensity",
        kind: "uniform",
        uniformName: "u_intensity",
        valueType: "float",
      },
      {
        defaultValue: 5,
        editor: { kind: "slider", max: 8, min: 1 },
        instanceName: "bandCount",
        kind: "uniform",
        uniformName: "u_band_count",
        valueType: "int",
      },
      {
        defaultValue: false,
        instanceName: "invertMask",
        kind: "uniform",
        uniformName: "u_invert_mask",
        valueType: "bool",
      },
      {
        defaultValue: { x: 1.1, y: 0.9 },
        instanceName: "uvScale",
        kind: "uniform",
        uniformName: "u_uv_scale",
        valueType: "vec2",
      },
      {
        instanceName: "uv",
        kind: "varying",
        valueType: "vec2",
        varyingName: "vUv",
      },
      {
        defaultValue: { x: 0.08, y: 0.03, z: 0.12 },
        instanceName: "colorBias",
        kind: "uniform",
        uniformName: "u_color_bias",
        valueType: "vec3",
      },
      {
        defaultValue: { w: 1, x: 0.14, y: 0.52, z: 0.95 },
        editor: { kind: "color" },
        instanceName: "baseTint",
        kind: "uniform",
        uniformName: "u_base_tint",
        valueType: "vec4",
      },
      {
        defaultValue: { w: 1, x: 0.94, y: 0.76, z: 0.42 },
        editor: { kind: "color" },
        instanceName: "accentTint",
        kind: "uniform",
        uniformName: "u_accent_tint",
        valueType: "vec4",
      },
      {
        filepath: "./nodes/wave.glsl",
        inputs: {
          frequency: "frequency",
          time: "time",
          uv: "uv",
          uvScale: "uvScale",
        },
        instanceName: "wave",
        kind: "custom",
      },
      {
        filepath: "./nodes/noise.glsl",
        inputs: {
          frequency: "frequency",
          time: "time",
          uv: "uv",
          uvScale: "uvScale",
        },
        instanceName: "noise",
        kind: "custom",
      },
      {
        filepath: "./nodes/remap.glsl",
        inputs: { signal: "wave" },
        instanceName: "remap",
        kind: "custom",
      },
      {
        filepath: "./nodes/mask.glsl",
        inputs: {
          intensity: "intensity",
          invert: "invertMask",
          pattern: "noise",
        },
        instanceName: "mask",
        kind: "custom",
      },
      {
        filepath: "./nodes/blend.glsl",
        inputs: { base: "remap", mask: "mask", steps: "bandCount" },
        instanceName: "blend",
        kind: "custom",
      },
      {
        filepath: "./nodes/tint.glsl",
        inputs: { accent: "accentTint", base: "baseTint", mask: "mask" },
        instanceName: "tint",
        kind: "custom",
      },
      {
        filepath: "./nodes/shade.glsl",
        inputs: {
          bias: "colorBias",
          detail: "noise",
          roughness: "roughness",
          signal: "blend",
          tint: "tint",
        },
        instanceName: "shade",
        kind: "custom",
      },
      {
        inputs: { color: "shade" },
        kind: "glFragColor",
      },
    ],
  },
  null,
  2,
);

export const DEFAULT_NODE_GLSL_FILES: Readonly<Record<string, string>> = {
  "wave.glsl": `float waveNode(vec2 uv, float time, float frequency, vec2 uvScale) {
  vec2 p = uv * max(uvScale, vec2(0.001));
  float phase = (p.x + p.y) * max(frequency, 0.001);

  return sin(phase + time);
}`,
  "noise.glsl": `float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);

  return fract(p.x * p.y);
}

float noiseNode(vec2 uv, float time, float frequency, vec2 uvScale) {
  vec2 p = uv * max(frequency, 0.001) * max(uvScale, vec2(0.001));

  return hash21(floor(p + time * 0.25));
}`,
  "remap.glsl": `float remapNode(float signal) {
  return signal * 0.5 + 0.5;
}`,
  "mask.glsl": `float maskNode(float pattern, float intensity, bool invert) {
  float clampedIntensity = clamp(intensity, 0.0, 1.0);
  float threshold = 1.0 - clampedIntensity;
  float maskedPattern = smoothstep(threshold, 1.0, pattern);

  return invert ? 1.0 - maskedPattern : maskedPattern;
}`,
  "blend.glsl": `float blendNode(float base, float mask, int steps) {
  float clampedMask = clamp(mask, 0.0, 1.0);
  float bands = max(float(steps), 1.0);
  float blended = mix(base, 1.0 - base, clampedMask * 0.6);

  return floor(blended * bands) / bands;
}`,
  "tint.glsl": `vec4 tintNode(vec4 base, vec4 accent, float mask) {
  float clampedMask = clamp(mask, 0.0, 1.0);
  vec3 rgb = mix(base.rgb, accent.rgb, clampedMask);
  float alpha = mix(base.a, accent.a, clampedMask);

  return vec4(rgb, alpha);
}`,
  "shade.glsl": `vec4 shadeNode(
  float signal,
  float detail,
  float roughness,
  vec4 tint,
  vec3 bias
) {
  float clampedSignal = clamp(signal, 0.0, 1.0);
  float clampedDetail = clamp(detail, 0.0, 1.0);
  float clampedRoughness = clamp(roughness, 0.0, 1.0);
  float highlight = mix(clampedDetail, clampedSignal, 1.0 - clampedRoughness);
  vec3 color = tint.rgb * (0.35 + 0.65 * clampedSignal);

  color += vec3(highlight) * (0.12 + 0.28 * clampedRoughness);
  color += bias * (0.25 + 0.5 * clampedSignal);

  return vec4(clamp(color, 0.0, 1.0), tint.a);
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
