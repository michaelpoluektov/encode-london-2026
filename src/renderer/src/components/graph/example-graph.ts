import { type DagGraph, dagGraphSchema } from "../../dag/dag-schema";

export const EXAMPLE_DAG_GRAPH: DagGraph = dagGraphSchema.parse({
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
      kind: "clampedFloat",
      max: 1,
      min: 0,
      uniformName: "u_roughness",
    },
    {
      defaultValue: 0.7,
      instanceName: "intensity",
      kind: "clampedFloat",
      max: 1,
      min: 0,
      uniformName: "u_intensity",
    },
    {
      defaultValue: {
        a: 1,
        b: 0.95,
        g: 0.52,
        r: 0.14,
      },
      instanceName: "baseColor",
      kind: "color",
      uniformName: "u_base_color",
    },
    {
      defaultValue: {
        a: 1,
        b: 0.42,
        g: 0.76,
        r: 0.94,
      },
      instanceName: "accentColor",
      kind: "color",
      uniformName: "u_accent_color",
    },
    {
      filepath: "nodes/wave.glsl",
      inputs: {
        frequency: "frequency",
        time: "time",
      },
      instanceName: "wave",
      kind: "custom",
    },
    {
      filepath: "nodes/noise.glsl",
      inputs: {
        frequency: "frequency",
        time: "time",
      },
      instanceName: "noise",
      kind: "custom",
    },
    {
      filepath: "nodes/remap.glsl",
      inputs: {
        signal: "wave",
      },
      instanceName: "remap",
      kind: "custom",
    },
    {
      filepath: "nodes/mask.glsl",
      inputs: {
        intensity: "intensity",
        pattern: "noise",
      },
      instanceName: "mask",
      kind: "custom",
    },
    {
      filepath: "nodes/blend.glsl",
      inputs: {
        base: "remap",
        mask: "mask",
      },
      instanceName: "blend",
      kind: "custom",
    },
    {
      filepath: "nodes/shade.glsl",
      inputs: {
        detail: "noise",
        roughness: "roughness",
        signal: "blend",
        tint: "tint",
      },
      instanceName: "shade",
      kind: "custom",
    },
    {
      filepath: "nodes/tint.glsl",
      inputs: {
        accent: "accentColor",
        base: "baseColor",
        mask: "mask",
      },
      instanceName: "tint",
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
