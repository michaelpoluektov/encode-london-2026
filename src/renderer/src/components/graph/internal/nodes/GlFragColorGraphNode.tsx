import type { JSX } from "react";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";
import type { GlFragColorGraphNodeData } from "./node-data";

export type GlFragColorGraphFlowNode = GraphFlowNode<
  GlFragColorGraphNodeData,
  "glFragColor"
>;

export const GlFragColorGraphNode = ({
  data,
}: GraphFlowNodeProps<
  GlFragColorGraphNodeData,
  "glFragColor"
>): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "Built-in",
        value: "gl_FragColor",
      },
    ]}
    hasOutput={false}
    inputs={createGraphNodeInputs(Object.keys(data.definition.inputs))}
    title="gl_FragColor"
  />
);
