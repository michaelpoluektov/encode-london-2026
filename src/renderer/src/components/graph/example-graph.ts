import { type DagGraph, dagGraphSchema } from "../../dag/dag-schema";

export const EXAMPLE_DAG_GRAPH: DagGraph = dagGraphSchema.parse({
  nodes: [
    {
      defaultValue: 0,
      instanceName: "time",
      kind: "input_float",
      uniformName: "u_time",
    },
    {
      defaultValue: 3,
      instanceName: "frequency",
      kind: "input_float",
      uniformName: "u_frequency",
    },
    {
      defaultValue: 0.35,
      instanceName: "roughness",
      kind: "input_clamped_float",
      max: 1,
      min: 0,
      uniformName: "u_roughness",
    },
    {
      defaultValue: 0.7,
      instanceName: "intensity",
      kind: "input_clamped_float",
      max: 1,
      min: 0,
      uniformName: "u_intensity",
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
      },
      instanceName: "shade",
      kind: "custom",
    },
    {
      inputs: {
        gl_frag_color_input: "shade",
      },
      kind: "output_gl_frag_color",
    },
  ],
});
