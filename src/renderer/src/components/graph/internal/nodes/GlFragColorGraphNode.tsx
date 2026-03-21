import type { JSX } from "react";
import type { ValidatedOutputNode } from "../../graph-types";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type GlFragColorGraphNodeData = {
  readonly node: ValidatedOutputNode;
};

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
        label: "built-in",
        value: "gl_FragColor",
      },
    ]}
    hasOutput={false}
    inputs={createGraphNodeInputs(["color"])}
    title={data.node.displayName}
  />
);
