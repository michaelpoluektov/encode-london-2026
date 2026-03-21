import { graphSchema } from "../internal/json-schema";

const exampleGraph = graphSchema.parse({
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
      inputs: {
        color: "pulse",
      },
      kind: "glFragColor",
    },
  ],
});

export const EXAMPLE_GRAPH_SOURCE = JSON.stringify(exampleGraph, null, 2);
