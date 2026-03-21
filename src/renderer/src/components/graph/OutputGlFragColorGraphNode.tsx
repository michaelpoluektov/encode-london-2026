import type { JSX } from "react";
import type { OutputGlFragColorNode } from "../../dag/dag-schema";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type OutputGlFragColorGraphFlowNode = GraphFlowNode<
  OutputGlFragColorNode,
  "output_gl_frag_color"
>;

export const OutputGlFragColorGraphNode = ({
  data,
}: GraphFlowNodeProps<
  OutputGlFragColorNode,
  "output_gl_frag_color"
>): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "Built-in",
        value: "gl_FragColor",
      },
    ]}
    hasOutput={false}
    inputs={createGraphNodeInputs(Object.keys(data.inputs))}
    title={data.kind}
  />
);
