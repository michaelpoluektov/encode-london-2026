import { graphSchema } from "../internal/json-schema";

const exampleGraph = graphSchema.parse({
  nodes: [
    {
      defaultValue: 0,
      instanceName: "time",
      kind: "float",
      uniformName: "u_time",
    },
    {
      defaultValue: 3,
      instanceName: "frequency",
      kind: "float",
      uniformName: "u_frequency",
    },
    {
      defaultValue: 0.35,
      instanceName: "roughness",
      kind: "float",
      max: 1,
      min: 0,
      uniformName: "u_roughness",
    },
    {
      defaultValue: 0.7,
      instanceName: "intensity",
      kind: "float",
      max: 1,
      min: 0,
      uniformName: "u_intensity",
    },
    {
      defaultValue: 5,
      instanceName: "bandCount",
      kind: "int",
      uniformName: "u_band_count",
    },
    {
      defaultValue: false,
      instanceName: "invertMask",
      kind: "bool",
      uniformName: "u_invert_mask",
    },
    {
      defaultValue: {
        x: 1.1,
        y: 0.9,
      },
      instanceName: "uvScale",
      kind: "vec2",
      uniformName: "u_uv_scale",
    },
    {
      defaultValue: {
        x: 0.08,
        y: 0.03,
        z: 0.12,
      },
      instanceName: "colorBias",
      kind: "vec3",
      uniformName: "u_color_bias",
    },
    {
      defaultValue: {
        a: 1,
        b: 0.95,
        g: 0.52,
        r: 0.14,
      },
      instanceName: "baseTint",
      kind: "color",
      uniformName: "u_base_tint",
    },
    {
      defaultValue: {
        a: 1,
        b: 0.42,
        g: 0.76,
        r: 0.94,
      },
      instanceName: "accentTint",
      kind: "color",
      uniformName: "u_accent_tint",
    },
    {
      filepath: "./nodes/wave.glsl",
      inputs: {
        frequency: "frequency",
        time: "time",
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
        uvScale: "uvScale",
      },
      instanceName: "noise",
      kind: "custom",
    },
    {
      filepath: "./nodes/remap.glsl",
      inputs: {
        signal: "wave",
      },
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
      inputs: {
        base: "remap",
        mask: "mask",
        steps: "bandCount",
      },
      instanceName: "blend",
      kind: "custom",
    },
    {
      filepath: "./nodes/tint.glsl",
      inputs: {
        accent: "accentTint",
        base: "baseTint",
        mask: "mask",
      },
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
      inputs: {
        color: "shade",
      },
      kind: "glFragColor",
    },
  ],
});

export const EXAMPLE_GRAPH_SOURCE = JSON.stringify(exampleGraph, null, 2);
