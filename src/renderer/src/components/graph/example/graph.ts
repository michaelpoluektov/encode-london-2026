import { graphSchema } from "../internal/json-schema";

const exampleGraph = graphSchema.parse({
  nodes: [
    {
      instanceName: "time",
      kind: "time",
    },
    {
      defaultValue: 30,
      instanceName: "frequency",
      kind: "uniform",
      uniformName: "u_frequency",
      valueType: "float",
    },
    {
      defaultValue: 0.35,
      editor: {
        kind: "slider",
        max: 1,
        min: 0,
      },
      instanceName: "roughness",
      kind: "uniform",
      uniformName: "u_roughness",
      valueType: "float",
    },
    {
      defaultValue: 0.7,
      editor: {
        kind: "slider",
        max: 1,
        min: 0,
      },
      instanceName: "intensity",
      kind: "uniform",
      uniformName: "u_intensity",
      valueType: "float",
    },
    {
      defaultValue: 5,
      editor: {
        kind: "slider",
        max: 8,
        min: 1,
      },
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
      defaultValue: {
        x: 1.1,
        y: 0.9,
      },
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
      defaultValue: {
        x: 0.08,
        y: 0.03,
        z: 0.12,
      },
      instanceName: "colorBias",
      kind: "uniform",
      uniformName: "u_color_bias",
      valueType: "vec3",
    },
    {
      defaultValue: {
        w: 1,
        x: 0.14,
        y: 0.52,
        z: 0.95,
      },
      editor: {
        kind: "color",
      },
      instanceName: "baseTint",
      kind: "uniform",
      uniformName: "u_base_tint",
      valueType: "vec4",
    },
    {
      defaultValue: {
        w: 1,
        x: 0.94,
        y: 0.76,
        z: 0.42,
      },
      editor: {
        kind: "color",
      },
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
