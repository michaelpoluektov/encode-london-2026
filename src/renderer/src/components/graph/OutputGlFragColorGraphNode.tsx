import type { JSX } from "react";
import type { GlFragColorNode } from "../../dag/dag-schema";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type GlFragColorGraphFlowNode = GraphFlowNode<
  GlFragColorNode,
  "glFragColor"
>;

export const GlFragColorGraphNode = ({
  data,
}: GraphFlowNodeProps<GlFragColorNode, "glFragColor">): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "Built-in",
        value: "gl_FragColor",
      },
    ]}
    hasOutput={false}
    inputs={createGraphNodeInputs(Object.keys(data.inputs))}
    title="gl_FragColor"
  />
);
